/**
 * Assinatura da ponte CRM → VOXEN (contrato, Parte A.1):
 *   x-crm-timestamp: segundos Unix (10 a 12 dígitos)
 *   x-crm-signature: sha256=<hex de HMAC-SHA256(segredo, timestamp + "." + corpo exato)>
 * Recusa se o horário diferir mais de 300 s. Comparação em tempo constante. Só Web Crypto, para
 * rodar igual no Deno (função) e no Node (testes).
 */

const enc = new TextEncoder()
export const WINDOW_SECONDS = 300

export const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")

function concat(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/** HMAC-SHA256 em hex sobre `timestamp + "." + corpo` (os bytes exatos que chegaram). */
export async function signHex(secret: string, timestamp: string, body: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return toHex(await crypto.subtle.sign("HMAC", key, concat(enc.encode(`${timestamp}.`), body)))
}

export async function sha256Hex(body: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", body))
}

/** Compara sem atalho: o tempo não revela onde está a primeira diferença. */
export function safeEqual(a: string, b: string): boolean {
  const n = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

export type Verdict = "ok" | "stale" | "bad"

export async function verifySignature(opts: { secret: string; timestamp: string; signature: string; body: Uint8Array; nowMs?: number }): Promise<Verdict> {
  const { secret, timestamp, signature, body } = opts
  if (!/^\d{10,12}$/.test(timestamp)) return "bad"
  const now = (opts.nowMs ?? Date.now()) / 1000
  if (Math.abs(now - Number(timestamp)) > WINDOW_SECONDS) return "stale"
  if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) return "bad"
  const expected = await signHex(secret, timestamp, body)
  return safeEqual(signature.slice(7).toLowerCase(), expected) ? "ok" : "bad"
}
