import { useState, useSyncExternalStore } from 'react'
import { flushFunnelCaptures, getFunnelCaptureStatus, subscribeFunnelCaptureStatus } from '@/lib/funnel-capture-queue'
export default function FunnelCaptureStatus() {
  const status = useSyncExternalStore(subscribeFunnelCaptureStatus, getFunnelCaptureStatus)
  const [sending, setSending] = useState(false)
  if (!status.error) return null
  return <div role="status" className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
    <p>{status.error}</p>
    {status.storageAvailable && <button type="button" disabled={sending} className="mt-2 underline" onClick={async () => {
      setSending(true); try { await flushFunnelCaptures() } catch { /* The persistent status displays the retry failure. */ } finally { setSending(false) }
    }}>{sending ? 'Enviando...' : 'Tentar envio novamente'}</button>}
  </div>
}
