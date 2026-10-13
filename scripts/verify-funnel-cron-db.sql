BEGIN;
DO $$
DECLARE before_count bigint; v_id uuid;
BEGIN
 PERFORM pg_temp.assert((SELECT NOT active FROM cron.job WHERE jobname='funnel-lead-delivery'),'job activated before rollout');
 PERFORM pg_temp.assert((SELECT NOT enabled FROM public.funnel_delivery_control),'nudge activated before rollout');
 SELECT count(*) INTO before_count FROM public.funnel_lead_outbox;
 PERFORM public.funnel_delivery_set_enabled(true);
 PERFORM pg_temp.assert(public.funnel_delivery_invoke() IS NULL,'missing secret invoked worker');
 v_id:=public.capture_funnel_lead('Cron fixture','qa-cron@example.invalid','11999990003');
 PERFORM pg_temp.assert((SELECT count(*)=before_count+1 FROM public.funnel_lead_outbox),'missing scheduler config lost event');
 INSERT INTO vault.decrypted_secrets(name,decrypted_secret) VALUES('funnel_lead_delivery_cron_secret','synthetic-secret');
 PERFORM pg_temp.assert(public.funnel_delivery_invoke() IS NOT NULL,'configured invocation not prepared');
 PERFORM pg_temp.assert((SELECT url='https://mehmqibxzxfqdxqjnjad.supabase.co/functions/v1/funnel-lead-delivery' AND headers->>'x-site-cron-secret'='synthetic-secret' FROM net.synthetic_requests ORDER BY id DESC LIMIT 1),'invocation target or secret incorrect');
 PERFORM public.funnel_delivery_set_enabled(false);
 PERFORM pg_temp.assert(public.funnel_delivery_invoke() IS NULL AND (SELECT NOT active FROM cron.job WHERE jobname='funnel-lead-delivery'),'rollback did not stop emission');
 PERFORM pg_temp.assert((SELECT count(*)=before_count+1 FROM public.funnel_lead_outbox),'deactivation erased durable events');
END $$;
SELECT 'PASS: disabled scheduling, missing configuration, fixed private invocation and reversible activation' AS verification;
ROLLBACK;
