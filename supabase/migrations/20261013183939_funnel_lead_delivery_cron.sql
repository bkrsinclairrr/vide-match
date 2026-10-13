BEGIN;
SET LOCAL lock_timeout='5s';
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE TABLE public.funnel_delivery_control(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false,next_nudge_at timestamptz NOT NULL DEFAULT '-infinity');
INSERT INTO public.funnel_delivery_control(singleton) VALUES(true);
ALTER TABLE public.funnel_delivery_control ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.funnel_delivery_control FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.funnel_delivery_invoke() RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE secret text; request_id bigint;
BEGIN
 IF NOT EXISTS(SELECT FROM public.funnel_delivery_control WHERE singleton AND enabled) THEN RETURN NULL; END IF;
 SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name='funnel_lead_delivery_cron_secret' LIMIT 1;
 IF nullif(secret,'') IS NULL THEN RETURN NULL; END IF;
 SELECT net.http_post(url:='https://mehmqibxzxfqdxqjnjad.supabase.co/functions/v1/funnel-lead-delivery',
  headers:=jsonb_build_object('content-type','application/json','x-site-cron-secret',secret),body:='{}'::jsonb,timeout_milliseconds:=5000) INTO request_id;
 RETURN request_id;
 -- Capturing a contact must not depend on scheduler/network configuration.
 EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.funnel_delivery_invoke() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.funnel_delivery_invoke() TO service_role;

CREATE FUNCTION public.funnel_delivery_nudge() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF EXISTS(SELECT FROM funnel_nudge_new) AND EXISTS(SELECT FROM public.funnel_delivery_control WHERE singleton AND enabled AND next_nudge_at<=clock_timestamp() FOR UPDATE SKIP LOCKED) THEN
  UPDATE public.funnel_delivery_control SET next_nudge_at=clock_timestamp()+interval '5 seconds' WHERE singleton;
  PERFORM public.funnel_delivery_invoke();
 END IF;
 RETURN NULL;
 EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.funnel_delivery_nudge() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER funnel_delivery_nudge AFTER INSERT ON public.funnel_lead_outbox REFERENCING NEW TABLE AS funnel_nudge_new FOR EACH STATEMENT EXECUTE FUNCTION public.funnel_delivery_nudge();

SELECT cron.schedule('funnel-lead-delivery','* * * * *','SELECT public.funnel_delivery_invoke()');
SELECT cron.alter_job(jobid,active:=false) FROM cron.job WHERE jobname='funnel-lead-delivery';
CREATE FUNCTION public.funnel_delivery_set_enabled(p_enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'Activation state required' USING ERRCODE='22023'; END IF;
 UPDATE public.funnel_delivery_control SET enabled=p_enabled WHERE singleton;
 PERFORM cron.alter_job(jobid,active:=p_enabled) FROM cron.job WHERE jobname='funnel-lead-delivery';
END $$;
REVOKE ALL ON FUNCTION public.funnel_delivery_set_enabled(boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.funnel_delivery_set_enabled(boolean) TO service_role;
COMMIT;
