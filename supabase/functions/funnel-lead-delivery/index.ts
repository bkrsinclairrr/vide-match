import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0'
import { deliverFunnelEvents, sameSecret, SITE_RECEIVER_URL } from '../_shared/funnel-lead-delivery.ts'
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const cron = Deno.env.get('SITE_BRIDGE_CRON_SECRET')
  if (!cron) return new Response('Worker unavailable', { status: 503 })
  if (!sameSecret(req.headers.get('x-site-cron-secret') ?? '', cron)) return new Response('Forbidden', { status: 403 })
  const deadline = Date.now() + 45000
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(Math.max(1, Math.min(5000, deadline - Date.now()))) }) },
  })
  try {
    const result = await deliverFunnelEvents(admin, { receiverUrl: Deno.env.get('SITE_BRIDGE_RECEIVER_URL') ?? SITE_RECEIVER_URL,
      sharedSecret: Deno.env.get('SITE_BRIDGE_SHARED_SECRET') ?? '', deadlineMs: Math.max(0, deadline - Date.now()) })
    return Response.json(result)
  } catch { return new Response('Delivery unavailable', { status: 503 }) }
})
