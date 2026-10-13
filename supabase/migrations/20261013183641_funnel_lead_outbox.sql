BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
-- These two columns already exist in production. Preserve all existing values and internal triggers.
ALTER TABLE public.funnel_leads ADD COLUMN IF NOT EXISTS profile jsonb, ADD COLUMN IF NOT EXISTS report jsonb,
 ADD COLUMN capture_attribution jsonb NOT NULL DEFAULT '{}', ADD COLUMN source_revision bigint NOT NULL DEFAULT 0 CHECK(source_revision>=0);
CREATE TABLE public.funnel_lead_outbox(
 event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),source_lead_id uuid NOT NULL,source_revision bigint NOT NULL CHECK(source_revision>0),
 event jsonb NOT NULL, state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','processing','delivered')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),claim_token uuid,lease_until timestamptz,
 receipt jsonb,delivered_at timestamptz,last_error_code text,
 UNIQUE(source_lead_id,source_revision),CHECK((state='processing')=(claim_token IS NOT NULL AND lease_until IS NOT NULL)),
 CHECK(state<>'delivered' OR receipt IS NOT NULL));
CREATE INDEX funnel_outbox_due ON public.funnel_lead_outbox(next_attempt_at,created_at) WHERE state<>'delivered';
ALTER TABLE public.funnel_lead_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.funnel_lead_outbox FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.funnel_outbox_enqueue(p_row public.funnel_leads) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE eid uuid:=gen_random_uuid(); revision bigint:=greatest(p_row.source_revision,1); attribution jsonb;
BEGIN
 attribution:=jsonb_strip_nulls(jsonb_build_object('utm_source',p_row.utm_source,'utm_medium',p_row.utm_medium,'utm_campaign',p_row.utm_campaign,
  'utm_content',p_row.utm_content,'utm_term',p_row.utm_term,'fbclid',p_row.fbclid,'gclid',p_row.gclid,'ttclid',p_row.ttclid))||p_row.capture_attribution;
 INSERT INTO public.funnel_lead_outbox(event_id,source_lead_id,source_revision,event) VALUES(eid,p_row.id,revision,
  jsonb_build_object('schema_version',1,'event_id',eid,'source_project','mehmqibxzxfqdxqjnjad','source_lead_id',p_row.id,'source_revision',revision,
   'generated_at',p_row.created_at,'source_updated_at',p_row.updated_at,'payload',jsonb_build_object(
    'contact',jsonb_build_object('name',p_row.name,'email',p_row.email,'phone',p_row.phone),
    'profile',p_row.profile,'report',p_row.report,'attribution',attribution,
    'source_record',to_jsonb(p_row)-'profile'-'report'-'capture_attribution')))
 ON CONFLICT(source_lead_id,source_revision) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.funnel_outbox_enqueue(public.funnel_leads) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.funnel_outbox_version() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.source_revision:=1;
 ELSIF (to_jsonb(NEW)-'updated_at'-'source_revision') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at'-'source_revision') THEN
  NEW.source_revision:=greatest(OLD.source_revision,1)+1;
 ELSE NEW.source_revision:=OLD.source_revision; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION public.funnel_outbox_record() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.source_revision IS DISTINCT FROM OLD.source_revision THEN PERFORM public.funnel_outbox_enqueue(NEW); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.funnel_outbox_version(),public.funnel_outbox_record() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER aa_funnel_outbox_version BEFORE INSERT OR UPDATE ON public.funnel_leads FOR EACH ROW EXECUTE FUNCTION public.funnel_outbox_version();
CREATE TRIGGER funnel_outbox_record AFTER INSERT OR UPDATE ON public.funnel_leads FOR EACH ROW EXECUTE FUNCTION public.funnel_outbox_record();

CREATE FUNCTION public.capture_funnel_lead_v2(p_contact jsonb,p_profile jsonb,p_attribution jsonb,p_report jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_id uuid; revision bigint; v_report jsonb:=p_report;
BEGIN
 IF jsonb_typeof(p_contact) IS DISTINCT FROM 'object' OR jsonb_typeof(p_profile) IS DISTINCT FROM 'object'
  OR jsonb_typeof(p_attribution) IS DISTINCT FROM 'object' OR (p_report IS NOT NULL AND jsonb_typeof(p_report) IS DISTINCT FROM 'object') THEN
  RAISE EXCEPTION 'Captura inválida; conserve os dados e tente novamente' USING ERRCODE='22023'; END IF;
 -- Preserve VOXEN's existing named-score map while retaining every original detail.
 IF jsonb_typeof(p_report->'stats')='array' THEN
  v_report:=p_report||jsonb_build_object('stat_details',p_report->'stats','stats',
   (SELECT coalesce(jsonb_object_agg(x->>'key',x->'score'),'{}') FROM jsonb_array_elements(p_report->'stats')x WHERE x->>'key' IS NOT NULL));
 END IF;
 -- Keep the deployed validation/throttle and eleven-argument RPC intact, in this same transaction.
 v_id:=public.capture_funnel_lead(p_contact->>'name',p_contact->>'email',p_contact->>'phone',
  p_attribution->>'utm_source',p_attribution->>'utm_medium',p_attribution->>'utm_campaign',p_attribution->>'utm_content',
  p_attribution->>'utm_term',p_attribution->>'fbclid',p_attribution->>'gclid',p_attribution->>'ttclid');
 UPDATE public.funnel_leads SET profile=coalesce(profile,'{}')||p_profile,
  capture_attribution=capture_attribution||p_attribution,report=coalesce(v_report,report),updated_at=clock_timestamp()
 WHERE id=v_id RETURNING source_revision INTO revision;
 RETURN jsonb_build_object('lead_id',v_id,'source_revision',revision);
END $$;
REVOKE ALL ON FUNCTION public.capture_funnel_lead_v2(jsonb,jsonb,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_funnel_lead_v2(jsonb,jsonb,jsonb,jsonb) TO anon,authenticated,service_role;

CREATE FUNCTION public.funnel_outbox_claim(p_limit integer DEFAULT 20,p_lease_seconds integer DEFAULT 60) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE events jsonb;
BEGIN
 IF p_limit NOT BETWEEN 1 AND 20 OR p_lease_seconds NOT BETWEEN 30 AND 300 THEN RAISE EXCEPTION 'Invalid claim bounds' USING ERRCODE='22023'; END IF;
 WITH due AS (SELECT event_id FROM public.funnel_lead_outbox
  WHERE (state='pending' AND next_attempt_at<=clock_timestamp()) OR (state='processing' AND lease_until<=clock_timestamp())
  ORDER BY created_at,event_id LIMIT p_limit FOR UPDATE SKIP LOCKED),
 claimed AS (UPDATE public.funnel_lead_outbox o SET state='processing',claim_token=gen_random_uuid(),lease_until=clock_timestamp()+make_interval(secs=>p_lease_seconds),attempts=attempts+1
  FROM due WHERE o.event_id=due.event_id RETURNING o.*)
 SELECT coalesce(jsonb_agg(to_jsonb(claimed) ORDER BY created_at,event_id),'[]') INTO events FROM claimed;
 RETURN events;
END $$;

CREATE FUNCTION public.funnel_outbox_ack(p_event uuid,p_claim uuid,p_receipt jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE row public.funnel_lead_outbox;
BEGIN
 SELECT * INTO row FROM public.funnel_lead_outbox WHERE event_id=p_event FOR UPDATE;
 IF row.state IS DISTINCT FROM 'processing' OR row.claim_token IS DISTINCT FROM p_claim OR row.lease_until<=clock_timestamp() THEN
  RAISE EXCEPTION 'Stale claim' USING ERRCODE='40001'; END IF;
 IF p_receipt->>'event_id' IS DISTINCT FROM row.event_id::text OR p_receipt->>'source_lead_id' IS DISTINCT FROM row.source_lead_id::text
  OR p_receipt->>'source_revision' IS DISTINCT FROM row.source_revision::text OR (p_receipt->>'receipt_id')::uuid IS NULL
  OR coalesce(p_receipt->>'status','') NOT IN('pending_review','context_only','superseded','quarantined') THEN
  RAISE EXCEPTION 'Invalid receipt identity' USING ERRCODE='22023'; END IF;
 UPDATE public.funnel_lead_outbox SET state='delivered',receipt=p_receipt,delivered_at=clock_timestamp(),last_error_code=NULL,claim_token=NULL,lease_until=NULL WHERE event_id=p_event;
END $$;

CREATE FUNCTION public.funnel_outbox_fail(p_event uuid,p_claim uuid,p_code text,p_retry_at timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.funnel_lead_outbox SET state='pending',claim_token=NULL,lease_until=NULL,
  last_error_code=CASE WHEN p_code ~ '^[a-z0-9_]{1,60}$' THEN p_code ELSE 'delivery_failed' END,
  next_attempt_at=greatest(clock_timestamp(),least(coalesce(p_retry_at,clock_timestamp()+interval '1 minute'),clock_timestamp()+interval '1 hour'))
 WHERE event_id=p_event AND state='processing' AND claim_token=p_claim AND lease_until>clock_timestamp();
 IF NOT FOUND THEN RAISE EXCEPTION 'Stale claim' USING ERRCODE='40001'; END IF;
END $$;

CREATE FUNCTION public.funnel_outbox_backfill(p_after uuid,p_limit integer DEFAULT 200) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE row public.funnel_leads; last_id uuid:=p_after; enqueued integer:=0; examined integer:=0; before_count bigint;
BEGIN
 IF p_limit NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Invalid backfill bounds' USING ERRCODE='22023'; END IF;
 FOR row IN SELECT * FROM public.funnel_leads WHERE p_after IS NULL OR id>p_after ORDER BY id LIMIT p_limit FOR UPDATE LOOP
  SELECT count(*) INTO before_count FROM public.funnel_lead_outbox WHERE source_lead_id=row.id;
  PERFORM public.funnel_outbox_enqueue(row);
  enqueued:=enqueued+(SELECT count(*)-before_count FROM public.funnel_lead_outbox WHERE source_lead_id=row.id);
  examined:=examined+1;last_id:=row.id;
 END LOOP;
 RETURN jsonb_build_object('last_id',last_id,'enqueued',enqueued,'done',NOT EXISTS(SELECT FROM public.funnel_leads WHERE last_id IS NULL OR id>last_id));
END $$;

CREATE FUNCTION public.funnel_outbox_health() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('schema_version',1,'kind','heartbeat','source_project','mehmqibxzxfqdxqjnjad','observed_at',clock_timestamp(),
  'pending_count',count(*) FILTER(WHERE state<>'delivered'),
  'quarantined_count',count(*) FILTER(WHERE receipt->>'status'='quarantined' OR last_error_code IN('body_limit','configuration','identity_conflict','invalid_receipt')),
  'oldest_pending_at',min(created_at) FILTER(WHERE state<>'delivered')) FROM public.funnel_lead_outbox
$$;
REVOKE ALL ON FUNCTION public.funnel_outbox_claim(integer,integer),public.funnel_outbox_ack(uuid,uuid,jsonb),public.funnel_outbox_fail(uuid,uuid,text,timestamptz),public.funnel_outbox_backfill(uuid,integer),public.funnel_outbox_health() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.funnel_outbox_claim(integer,integer),public.funnel_outbox_ack(uuid,uuid,jsonb),public.funnel_outbox_fail(uuid,uuid,text,timestamptz),public.funnel_outbox_backfill(uuid,integer),public.funnel_outbox_health() TO service_role;
COMMIT;
