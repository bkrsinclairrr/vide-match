import { supabase } from '@/integrations/supabase/client'
import type { Json } from '@/integrations/supabase/types'

export interface FunnelCaptureInput {
  contact: { name: string; email: string; phone: string }
  profile: Record<string, string>
  attribution: Record<string, string | null>
  report?: { overall: number; stats: { key: string; label: string; desc: string; score: number }[]; method: 'deterministic-profile-v1' }
}
interface PendingCapture { id: string; sequence?: number; input: FunnelCaptureInput }
interface Receipt { lead_id: string; source_revision: number }
interface CaptureStore { add(input: FunnelCaptureInput): Promise<PendingCapture>; list(): Promise<PendingCapture[]>; remove(id: string): Promise<void> }
export interface CaptureStatus { pending: number; storageAvailable: boolean; error: string | null }
interface QueueOptions { store: CaptureStore; send(input: FunnelCaptureInput): Promise<unknown>; onStatus?(status: CaptureStatus): void }

function receiptId(value: unknown): string {
  const receipt = value as Receipt | null
  if (!receipt || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt.lead_id)
    || !Number.isSafeInteger(receipt.source_revision) || receipt.source_revision < 1) throw new Error('Confirmação de envio indisponível. Tente novamente.')
  return receipt.lead_id
}
export function createFunnelCaptureQueue({ store, send, onStatus = () => {} }: QueueOptions) {
  const waiting = new Map<string, { resolve(id: string): void; reject(error: Error): void }>()
  let running: Promise<void> | null = null
  async function drain() {
    while (true) {
      const pending = await store.list()
      onStatus({ pending: pending.length, storageAvailable: true, error: null })
      if (!pending.length) return
      const row = pending[0]
      const id = receiptId(await send(row.input))
      // Delete the confirmed immutable capture only, never another capture for the same email.
      await store.remove(row.id)
      waiting.get(row.id)?.resolve(id); waiting.delete(row.id)
    }
  }
  function flush(): Promise<void> {
    if (running) return running
    let succeeded = false
    const execute = () => drain()
    const operation = typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('zyron-funnel-captures', execute) : execute()
    running = operation.then(() => { succeeded = true }).catch(async () => {
      const error = new Error('Envio pendente. Seus dados estão guardados neste aparelho. Tente novamente quando houver conexão.')
      onStatus({ pending: (await store.list().catch(() => [])).length, storageAvailable: true, error: error.message })
      for (const waiter of waiting.values()) waiter.reject(error)
      waiting.clear(); throw error
    }).finally(() => {
      running = null
      if (succeeded && waiting.size) void flush().catch(() => {})
    })
    return running
  }
  async function queue(input: FunnelCaptureInput): Promise<string> {
    const immutable = structuredClone(input)
    let row: PendingCapture
    try { row = await store.add(immutable) } catch {
      onStatus({ pending: 1, storageAvailable: false, error: 'Não foi possível guardar seus dados neste aparelho. Mantenha esta página aberta e tente enviar novamente.' })
      // Storage failure cannot be reported as success; only a real server ACK permits progress.
      const id = receiptId(await send(immutable))
      onStatus({ pending: 0, storageAvailable: false, error: null }); return id
    }
    const result = new Promise<string>((resolve, reject) => waiting.set(row.id, { resolve, reject }))
    void flush().catch(() => {})
    return result
  }
  return { queue, flush }
}

const databaseName = 'zyron-funnel-captures'
function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('storage_unavailable')); return }
    const open = indexedDB.open(databaseName, 1)
    open.onupgradeneeded = () => { open.result.createObjectStore('captures', { keyPath: 'sequence', autoIncrement: true }).createIndex('id', 'id', { unique: true }) }
    open.onerror = () => reject(open.error)
    open.onblocked = () => reject(new Error('storage_blocked'))
    open.onsuccess = () => {
      const db = open.result; const tx = db.transaction('captures', mode); let value: T
      tx.oncomplete = () => { db.close(); resolve(value) }
      tx.onabort = tx.onerror = () => { db.close(); reject(tx.error ?? new Error('storage_failed')) }
      try { operation(tx.objectStore('captures'), result => { value = result }) } catch (error) { tx.abort(); reject(error) }
    }
  })
}
const store: CaptureStore = {
  add: input => transaction('readwrite', (table, done) => {
    const row: PendingCapture = { id: crypto.randomUUID(), input }
    const request = table.add(row)
    request.onsuccess = () => done({ ...row, sequence: Number(request.result) })
  }),
  list: () => transaction('readonly', (table, done) => { const request = table.getAll(); request.onsuccess = () => done(request.result) }),
  remove: id => transaction('readwrite', (table, done) => {
    const key = table.index('id').getKey(id)
    key.onsuccess = () => { if (key.result !== undefined) table.delete(key.result); done(undefined) }
  }),
}
let status: CaptureStatus = { pending: 0, storageAvailable: true, error: null }
const listeners = new Set<() => void>()
export const getFunnelCaptureStatus = () => status
export function subscribeFunnelCaptureStatus(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
const captures = createFunnelCaptureQueue({ store,
  async send(input) {
    const { data, error } = await supabase.rpc('capture_funnel_lead_v2', {
      p_contact: input.contact, p_profile: input.profile, p_attribution: input.attribution,
      p_report: (input.report ?? null) as Json,
    }).abortSignal(AbortSignal.timeout(10000))
    if (error) throw new Error('Envio indisponível. Seus dados continuam pendentes.')
    return data
  },
  onStatus: next => { status = next; for (const listener of listeners) listener() },
})
export const queueFunnelCapture = captures.queue
export const flushFunnelCaptures = captures.flush
export function resumeFunnelCaptures() {
  const resume = () => { void flushFunnelCaptures().catch(() => {}) }
  resume(); window.addEventListener('online', resume)
  return () => window.removeEventListener('online', resume)
}
