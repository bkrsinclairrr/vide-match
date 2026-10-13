BEGIN;
SET LOCAL statement_timeout='90s';
DO $$
DECLARE v_id uuid; first_revision bigint; original jsonb; result jsonb; claims jsonb; claim jsonb; reclaimed jsonb; other jsonb; count_before bigint; cursor uuid; n integer; v_profile jsonb:=jsonb_build_object('city','São Paulo','photo',repeat('X',100000));
BEGIN
 PERFORM pg_temp.assert(to_regclass('public.funnel_lead_outbox') IS NOT NULL,'durable outbox missing');
 result:=public.capture_funnel_lead_v2('{"name":"Synthetic João","email":"qa-site@example.invalid","phone":"11999990000"}',v_profile,jsonb_build_object('utm_campaign',repeat('á',900)),'{"method":"deterministic-profile-v1","overall":87}');
 v_id:=(result->>'lead_id')::uuid;first_revision:=(result->>'source_revision')::bigint;
 PERFORM pg_temp.assert((SELECT profile=v_profile AND report->>'overall'='87' AND length(capture_attribution->>'utm_campaign')=900 FROM public.funnel_leads WHERE funnel_leads.id=v_id),'full source context not stored');
 PERFORM pg_temp.assert((SELECT count(*)>=1 FROM public.funnel_lead_outbox WHERE source_lead_id=v_id),'contact has no durable event');
 SELECT to_jsonb(l) INTO original FROM public.funnel_leads l WHERE l.id=v_id;
 UPDATE public.funnel_leads SET updated_at=clock_timestamp() WHERE funnel_leads.id=v_id;
 PERFORM pg_temp.assert((SELECT source_revision=first_revision FROM public.funnel_leads WHERE funnel_leads.id=v_id),'timestamp-only update created event');
 result:=public.capture_funnel_lead_v2('{"name":"Synthetic João","email":"qa-site@example.invalid","phone":"11999990000"}',v_profile,jsonb_build_object('utm_campaign',repeat('á',900)),NULL);
 PERFORM pg_temp.assert((result->>'source_revision')::bigint=first_revision AND (SELECT report->>'overall'='87' FROM public.funnel_leads WHERE funnel_leads.id=v_id),'identical capture created a version or erased report');
 -- Prove contact/profile and outbox cannot commit separately.
 CREATE FUNCTION pg_temp.break_outbox() RETURNS trigger LANGUAGE plpgsql AS $t$ BEGIN RAISE EXCEPTION 'synthetic outbox failure' USING ERRCODE='P5555'; END $t$;
 CREATE TRIGGER synthetic_outbox_failure BEFORE INSERT ON public.funnel_lead_outbox FOR EACH ROW EXECUTE FUNCTION pg_temp.break_outbox();
 BEGIN
  PERFORM public.capture_funnel_lead_v2('{"name":"Lost must rollback","email":"qa-rollback@example.invalid","phone":"11999990000"}','{"city":"X"}','{}',NULL);
  RAISE EXCEPTION 'FAIL: contact committed without event';
 EXCEPTION WHEN SQLSTATE 'P5555' THEN NULL; END;
 PERFORM pg_temp.assert(NOT EXISTS(SELECT FROM public.funnel_leads WHERE email='qa-rollback@example.invalid'),'atomicity lost contact/outbox');
 DROP TRIGGER synthetic_outbox_failure ON public.funnel_lead_outbox;
 -- Old clients keep the eleven-argument entry point and gain outbox delivery.
 PERFORM public.capture_funnel_lead('Legacy','qa-legacy@example.invalid','11999990001');
 PERFORM pg_temp.assert(EXISTS(SELECT FROM public.funnel_lead_outbox o JOIN public.funnel_leads l ON l.id=o.source_lead_id WHERE l.email='qa-legacy@example.invalid'),'legacy capture missed outbox');
 claims:=public.funnel_outbox_claim(20,60);other:=public.funnel_outbox_claim(20,60);
 PERFORM pg_temp.assert(jsonb_array_length(claims)>0 AND jsonb_array_length(other)=0,'workers share a live claim');
 claim:=claims->0;
 UPDATE public.funnel_lead_outbox SET lease_until=clock_timestamp()-interval '1 second' WHERE event_id=(claim->>'event_id')::uuid;
 reclaimed:=public.funnel_outbox_claim(20,60)->0;
 PERFORM pg_temp.assert(reclaimed->>'event_id'=claim->>'event_id' AND reclaimed->>'claim_token'<>claim->>'claim_token','expired lease cannot resume');
 BEGIN
  PERFORM public.funnel_outbox_ack((claim->>'event_id')::uuid,(claim->>'claim_token')::uuid,'{}');RAISE EXCEPTION 'FAIL: old ACK accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 result:=jsonb_build_object('event_id',reclaimed->>'event_id','source_lead_id',reclaimed->>'source_lead_id','source_revision',reclaimed->'source_revision','receipt_id',gen_random_uuid(),'status','pending_review');
 PERFORM public.funnel_outbox_ack((reclaimed->>'event_id')::uuid,(reclaimed->>'claim_token')::uuid,result);
 PERFORM pg_temp.assert((SELECT state='delivered' AND receipt=result AND event=claim->'event' FROM public.funnel_lead_outbox WHERE event_id=(claim->>'event_id')::uuid),'ACK did not persist receipt or changed event');
 SELECT count(*) INTO count_before FROM public.funnel_lead_outbox;
 result:=public.funnel_outbox_backfill(NULL,1);cursor:=(result->>'last_id')::uuid;
 FOR n IN 1..20 LOOP EXIT WHEN (result->>'done')::boolean;result:=public.funnel_outbox_backfill(cursor,1);cursor:=(result->>'last_id')::uuid; END LOOP;
 PERFORM pg_temp.assert((SELECT count(*)=count_before+1 FROM public.funnel_lead_outbox),'historical contact not recovered exactly once');
 SELECT count(*) INTO count_before FROM public.funnel_lead_outbox;
 PERFORM public.funnel_outbox_backfill(NULL,200);
 PERFORM pg_temp.assert((SELECT count(*)=count_before FROM public.funnel_lead_outbox),'restart backfill duplicated events');
 PERFORM pg_temp.assert((SELECT profile->>'nationality'='Brasil' AND report->>'overall'='88' AND created_at='2026-09-10T11:12:13Z'::timestamptz AND source_revision=0 FROM public.funnel_leads WHERE email='qa-history@example.invalid'),'backfill mutated historical contact');
 PERFORM pg_temp.assert(NOT has_table_privilege('anon','public.funnel_lead_outbox','SELECT') AND NOT has_table_privilege('authenticated','public.funnel_lead_outbox','SELECT'),'outbox exposes private contacts');
 PERFORM pg_temp.assert(NOT has_function_privilege('anon','public.funnel_outbox_claim(integer,integer)','EXECUTE'),'anonymous worker access');
 PERFORM pg_temp.assert((SELECT count(*)>=3 FROM public.synthetic_internal_sync),'existing internal sync triggers disabled');
END $$;
SELECT 'PASS: transactional source capture, full context, legacy, leases, ACK, backfill and access' AS verification;
ROLLBACK;
