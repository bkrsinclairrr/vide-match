import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0'
export const SITE_RECEIVER_URL = 'https://mbzwchnxtskysqplqiyy.supabase.co/functions/v1/site-lead-receiver'
const maxBytes = 16 * 1024 * 1024
const receiptStates = new Set(['pending_review', 'context_only', 'superseded', 'quarantined'])
interface ClaimedEvent { event_id: string; source_lead_id: string; source_revision: number; event: unknown; claim_token: string; attempts: number }
interface Options { receiverUrl: string; sharedSecret: string; deadlineMs: number }
export function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}
async function signedPost(body: string, options: Options, deadline: number): Promise<Response> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(options.sharedSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + body))
  return fetch(SITE_RECEIVER_URL, { method: 'POST', redirect: 'error', body,
    headers: { 'content-type': 'application/json', 'x-site-timestamp': timestamp,
      'x-site-signature': 'sha256=' + Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('') },
    signal: AbortSignal.timeout(Math.max(1, Math.min(5000, deadline - Date.now()))),
  })
}
export async function deliverFunnelEvents(admin: SupabaseClient, options: Options) {
  const deadline = Date.now() + Math.min(45000, Math.max(0, options.deadlineMs))
  const result = { claimed: 0, delivered: 0, retryable: 0, blocked: 0 }
  const { data, error } = await admin.rpc('funnel_outbox_claim', { p_limit: 20, p_lease_seconds: 60 })
  if (error || !Array.isArray(data)) throw new Error('claim_unavailable')
  const rows = data as ClaimedEvent[]; result.claimed = rows.length
  const configured = !!options.sharedSecret && options.receiverUrl === SITE_RECEIVER_URL
  for (const row of rows) {
    // Leave unprocessed claims durable; their leases expire and another invocation resumes.
    if (deadline - Date.now() < 12000) break
    let code = configured ? '' : 'configuration'
    const body = JSON.stringify(row.event)
    if (!code && new TextEncoder().encode(body).byteLength > maxBytes) code = 'body_limit'
    if (!code) {
      try {
        const response = await signedPost(body, options, deadline)
        if (!response.ok) code = response.status === 409 ? 'identity_conflict' : response.status === 413 ? 'body_limit' : 'http_' + response.status
        else {
          let receipt
          try { receipt = await response.json() } catch { code = 'invalid_receipt' }
          if (!code && (!receipt || receipt.event_id !== row.event_id || receipt.source_lead_id !== row.source_lead_id
            || receipt.source_revision !== row.source_revision || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.receipt_id ?? '') || !receiptStates.has(receipt.status))) code = 'invalid_receipt'
          if (!code) {
            const ack = await admin.rpc('funnel_outbox_ack', { p_event: row.event_id, p_claim: row.claim_token, p_receipt: receipt })
            if (ack.error) code = 'ack_unavailable'
            else { result.delivered++; continue }
          }
        }
      } catch (error) { code = error && typeof error === 'object' && 'name' in error && /Timeout|Abort/.test(String(error.name)) ? 'network_timeout' : 'network_error' }
    }
    const seconds = Math.min(3600, 15 * 2 ** Math.min(row.attempts, 8))
    try { await admin.rpc('funnel_outbox_fail', { p_event: row.event_id, p_claim: row.claim_token,
      p_code: code, p_retry_at: new Date(Date.now() + seconds * 1000).toISOString() }) } catch { /* Lease recovers a failed retry-state write. */ }
    if (['configuration', 'body_limit', 'identity_conflict', 'invalid_receipt'].includes(code)) result.blocked++
    else result.retryable++
  }
  if (configured && deadline - Date.now() > 6000) {
    try {
      const health = await admin.rpc('funnel_outbox_health')
      if (!health.error && health.data) await signedPost(JSON.stringify(health.data), options, deadline)
    } catch { /* Missing heartbeat becomes visible as stale; the next scheduled run retries. */ }
  }
  return result
}
