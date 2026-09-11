const ATTRIBUTION_STORAGE_KEY = "zyron:utmify-attribution"

export const UTMIFY_ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
] as const

export type UtmifyAttributionKey = typeof UTMIFY_ATTRIBUTION_KEYS[number]
export type UtmifyAttribution = Record<UtmifyAttributionKey, string | null>

const EMPTY_ATTRIBUTION: UtmifyAttribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  fbclid: null,
  gclid: null,
  ttclid: null,
}

const normalizeAttribution = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, 2048) : null
}

export function loadUtmifyAttribution(): UtmifyAttribution {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "null")
    if (!stored || typeof stored !== "object") return { ...EMPTY_ATTRIBUTION }

    return UTMIFY_ATTRIBUTION_KEYS.reduce<UtmifyAttribution>((result, key) => {
      result[key] = normalizeAttribution(stored[key])
      return result
    }, { ...EMPTY_ATTRIBUTION })
  } catch {
    return { ...EMPTY_ATTRIBUTION }
  }
}

/**
 * Preserva a primeira atribuição válida desta aba. Isso mantém as UTMs e os
 * click IDs disponíveis depois que o React Router remove a query string ao
 * avançar pelas subrotas do funil.
 */
export function captureUtmifyAttribution(search: string): UtmifyAttribution {
  const current = loadUtmifyAttribution()
  const params = new URLSearchParams(search)

  const attribution = UTMIFY_ATTRIBUTION_KEYS.reduce<UtmifyAttribution>((result, key) => {
    result[key] = current[key] ?? normalizeAttribution(params.get(key))
    return result
  }, { ...EMPTY_ATTRIBUTION })

  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    /* storage bloqueado — o script oficial ainda pode cuidar da atribuição */
  }

  return attribution
}
