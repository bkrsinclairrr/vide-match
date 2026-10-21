/**
 * Ponte CRM (wsltda.com) → VOXEN: limpeza do evento e interpretação dos textos do formulário.
 * Contrato: PONTE_CRM_PARA_VOXEN.md (Parte A). Funções puras, sem Deno nem Node, para rodar na
 * função crm-context-receiver e nos testes (node --test).
 *
 * Regra de ouro: o que não for interpretado com segurança vai para revisão do Scout; nunca é
 * chutado. As regras ficam explícitas aqui (e testadas em crm-context.test.ts).
 */

/** Taxonomia de posições da VOXEN (a mesma de src/data/football.ts). */
export const POSITIONS = [
  "Goleiro", "Lateral Direito", "Lateral Esquerdo", "Zagueiro", "Volante", "Meio-Campo", "Meia-Atacante",
  "Ponta Direita", "Ponta Esquerda", "Centroavante",
] as const

export type Position = (typeof POSITIONS)[number]
export type Field = "birth_date" | "position" | "category" | "team" | "city"

export type Parsed = {
  birth_date?: string
  position?: Position
  category?: string
  team?: string
  city?: string
  filled_by?: "atleta" | "responsavel"
  /** O texto de onde cada campo saiu (para o Scout conferir). */
  raw: Partial<Record<Field, string>>
  /** Textos que vieram e não deu para interpretar com segurança. */
  review: { field: Field; raw: string }[]
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim()
const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : undefined)

/* ------------------------------------------------------------------ */
/* Limpeza: só as chaves do contrato saem daqui                        */
/* ------------------------------------------------------------------ */

const PROFILE_KEYS = ["birth_date_raw", "state_raw", "position_category_raw", "current_club_raw", "filled_by_raw"] as const
const CONTEXT_KEYS = ["past_clubs", "trials", "opportunities_received", "goal", "blocker"] as const
const STRUCTURED_TEXT = ["athlete_name", "athlete_birth_date", "athlete_position", "city_state"] as const
const STRUCTURED_NUM = ["athlete_height_cm", "athlete_weight_kg", "athlete_age"] as const

/**
 * Perguntas que nunca podem chegar à VOXEN (lista "Nunca sai" do contrato). O CRM já não deve
 * mandar; esta é a segunda trava, do lado de cá.
 */
const FORBIDDEN_QUESTION = /(telefone|celular|whats|zap|e-?mail|cpf|\brg\b|renda|sal[aá]rio|pagamento|pagar|valor|pre[cç]o|investir|investimento|cart[aã]o|pix|parcel|nome do (respons|pai|m[aã]e)|endere[cç]o|instagram|consentimento|autoriza)/i

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => Boolean(v) && typeof v === "object" && !Array.isArray(v)

function pick<K extends string>(src: unknown, keys: readonly K[], n: number): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  if (!isObj(src)) return out
  for (const k of keys) {
    const v = clip(src[k], n)
    if (v) out[k] = v
  }
  return out
}

/** O evento só com as chaves do contrato, textos cortados no tamanho máximo e perguntas proibidas fora. */
export function sanitizeEvent(e: Obj) {
  const link = isObj(e.link) ? e.link : {}
  const structured: Obj = { ...pick(e.structured, STRUCTURED_TEXT, 200) }
  if (isObj(e.structured)) {
    for (const k of STRUCTURED_NUM) {
      const n = Number((e.structured as Obj)[k])
      if (Number.isFinite(n) && n > 0 && n < 1000) structured[k] = Math.round(n)
    }
  }
  const answers = Array.isArray(e.answers)
    ? e.answers
      .filter(isObj)
      .map((a) => ({ question: clip(a.question, 300), answer: clip(a.answer, 2000) }))
      .filter((a): a is { question: string; answer: string } => Boolean(a.question && a.answer) && !FORBIDDEN_QUESTION.test(a.question as string))
      .slice(0, 200)
    : []
  return {
    schema_version: e.schema_version,
    kind: e.kind,
    event_id: e.event_id,
    source_project: e.source_project,
    source_lead_id: e.source_lead_id,
    source_revision: e.source_revision,
    generated_at: clip(e.generated_at, 40),
    link: pick(link, ["basis", "form_lead_id", "crm_lead_id"] as const, 64),
    profile: pick(e.profile, PROFILE_KEYS, 500),
    context: pick(e.context, CONTEXT_KEYS, 2000),
    ...(Object.keys(structured).length ? { structured } : {}),
    answers,
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Formato mínimo do contrato v1. Devolve o motivo quando não serve. */
export function invalidReason(e: unknown, sourceProject: string): string | null {
  if (!isObj(e)) return "Corpo não é um objeto JSON."
  if (e.schema_version !== 1) return "schema_version precisa ser 1."
  if (e.kind !== "athlete_context") return "kind precisa ser athlete_context."
  if (e.source_project !== sourceProject) return "source_project desconhecido."
  if (typeof e.event_id !== "string" || !UUID.test(e.event_id)) return "event_id precisa ser um uuid."
  if (typeof e.source_lead_id !== "string" || !UUID.test(e.source_lead_id)) return "source_lead_id precisa ser um uuid."
  if (!Number.isInteger(e.source_revision) || (e.source_revision as number) < 1) return "source_revision precisa ser um inteiro a partir de 1."
  return null
}

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

const MONTHS: Record<string, number> = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4, maio: 5, mai: 5, junho: 6, jun: 6,
  julho: 7, jul: 7, agosto: 8, ago: 8, setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11, dezembro: 12, dez: 12,
}

function isoIf(y: number, m: number, d: number, today: Date): string | null {
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  // Atleta de 4 a 40 anos: fora disso é erro de digitação, vai para revisão.
  const age = today.getUTCFullYear() - y
  if (y < 1990 || age < 4 || age > 40 || dt.getTime() > today.getTime()) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/**
 * Data de nascimento: dd/mm/aaaa (também com - ou .), dd/mm/aa, aaaa-mm-dd e "14 de março de 2007".
 * Dia antes do mês (padrão do Brasil). Ano de dois dígitos: até o ano atual é 20xx, depois 19xx.
 * Só o ano, ou data impossível: null (vai para revisão).
 */
export function parseBirthDate(raw: string, today = new Date()): string | null {
  const t = norm(raw).replace(/^(nasci(do|da)? (em|no dia)|data:?|dia)\s*/, "")
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return isoIf(+m[1], +m[2], +m[3], today)
  m = t.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2}|\d{4})$/)
  if (m) {
    let y = +m[3]
    if (m[3].length === 2) y += y <= today.getUTCFullYear() % 100 ? 2000 : 1900
    return isoIf(y, +m[2], +m[1], today)
  }
  m = t.match(/^(\d{1,2}) (?:de )?([a-z]+)\.? (?:de )?(\d{4})$/)
  if (m && MONTHS[m[2]]) return isoIf(+m[3], MONTHS[m[2]], +m[1], today)
  return null
}

/* ------------------------------------------------------------------ */
/* Posição e categoria                                                 */
/* ------------------------------------------------------------------ */

/**
 * Regras explícitas (texto já sem acento e em minúsculas). "meia" sozinho é Meia-Atacante (uso
 * comum no Brasil); "lateral", "ponta", "ala" e "atacante" sozinhos são ambíguos: revisão.
 * Siglas de duas letras (LD, PE...) ficam de fora: "pé esquerdo" viraria ponta esquerda.
 */
const POSITION_RULES: [RegExp, Position][] = [
  [/\b(goleir[oa]|goal ?keeper|arqueiro|gk)\b/, "Goleiro"],
  [/\blateral[ -]?direit[oa]\b/, "Lateral Direito"],
  [/\blateral[ -]?esquerd[oa]\b/, "Lateral Esquerdo"],
  [/\b(zagueir[oa]|zaga|beque|defensor central)\b/, "Zagueiro"],
  [/\b(primeiro |1o )?volante\b|\bcabeca de area\b/, "Volante"],
  [/\bmeio[ -]?campo\b|\bmeio campista\b|\bmeia central\b/, "Meio-Campo"],
  [/\bmeia[ -]?(atacante|ofensivo|armador)\b|\bmeia\b|\bcamisa 10\b|\bmeio[ -]?ofensivo\b/, "Meia-Atacante"],
  [/\bponta[ -]?direit[oa]\b|\bextremo direito\b/, "Ponta Direita"],
  [/\bponta[ -]?esquerd[oa]\b|\bextremo esquerdo\b/, "Ponta Esquerda"],
  [/\bcentro[ -]?avante\b|\bcamisa 9\b|\bcentroavante\b/, "Centroavante"],
]

const CATEGORY = /\bsub[ -]?(\d{1,2})\b|\bs(\d{2})\b/

/** "Meia, sub 17" → posição e categoria. Duas posições diferentes ou termo ambíguo: posição em revisão. */
export function parsePositionCategory(raw: string): { position: Position | null; category: string | null; positionAmbiguous: boolean } {
  const t = norm(raw)
  const cm = t.match(CATEGORY)
  const n = cm ? Number(cm[1] ?? cm[2]) : NaN
  const category = Number.isInteger(n) && n >= 6 && n <= 20 ? `Sub ${n}` : null
  const rest = t.replace(CATEGORY, " ")
  // A mais específica primeiro: "meia atacante" não conta também como "meia".
  const found = new Set<Position>()
  let left = rest
  for (const [re, pos] of POSITION_RULES) {
    if (re.test(left)) {
      found.add(pos)
      left = left.replace(new RegExp(re.source, "g"), " ")
    }
  }
  const vague = /\b(lateral|ponta|ala|atacante|extremo|defesa|meio)\b/.test(left)
  if (found.size === 1 && !vague) return { position: [...found][0], category, positionAmbiguous: false }
  return { position: null, category, positionAmbiguous: found.size > 0 || vague || rest.replace(/[^a-z]/g, "").length > 0 }
}

/* ------------------------------------------------------------------ */
/* Estado, clube e quem preencheu                                      */
/* ------------------------------------------------------------------ */

const STATES: Record<string, string> = {
  ac: "Acre", al: "Alagoas", ap: "Amapá", am: "Amazonas", ba: "Bahia", ce: "Ceará", df: "Distrito Federal", es: "Espírito Santo",
  go: "Goiás", ma: "Maranhão", mt: "Mato Grosso", ms: "Mato Grosso do Sul", mg: "Minas Gerais", pa: "Pará", pb: "Paraíba",
  pr: "Paraná", pe: "Pernambuco", pi: "Piauí", rj: "Rio de Janeiro", rn: "Rio Grande do Norte", rs: "Rio Grande do Sul",
  ro: "Rondônia", rr: "Roraima", sc: "Santa Catarina", sp: "São Paulo", se: "Sergipe", to: "Tocantins",
}
const STATE_BY_NAME = new Map(Object.values(STATES).map((name) => [norm(name), name]))
/** Do nome mais longo para o mais curto ("mato grosso do sul" antes de "mato grosso"), palavra inteira. */
const STATE_WORDS = [...STATE_BY_NAME].sort((a, b) => b[0].length - a[0].length).map(([k, name]) => [new RegExp(`\\b${k}\\b`), name] as const)

/** "BA", "bahia", "Bahia - BA" → "Bahia". Desconhecido: null. */
export function parseState(raw: string): string | null {
  const t = norm(raw).replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()
  if (STATES[t]) return STATES[t]
  if (STATE_BY_NAME.has(t)) return STATE_BY_NAME.get(t) as string
  const parts = t.split(" ")
  const uf = parts.at(-1) ?? ""
  if (STATES[uf]) return STATES[uf]
  for (const [re, name] of STATE_WORDS) if (re.test(t)) return name
  return null
}

const NO_CLUB = /^(nao|nenhum|nenhuma|sem clube|sem time|nao tenho|nao jogo|nao estou|ainda nao|n|-|x|\.|nada)\b/

/** Clube atual: texto como veio; "não tenho", "nenhum"... é "sem clube" (nada a preencher). */
export function parseClub(raw: string): { team: string | null; review: boolean } {
  const t = raw.trim().replace(/\s+/g, " ")
  if (!t || NO_CLUB.test(norm(t))) return { team: null, review: false }
  if (t.length > 80 || /[?!]/.test(t)) return { team: null, review: true }
  return { team: t, review: false }
}

export function parseFilledBy(raw: string): "atleta" | "responsavel" | null {
  const t = norm(raw)
  if (/(respons|\bpai\b|\bmae\b|\btio\b|\btia\b|\bavo\b|\bavó\b|irma|irmao|padrasto|madrasta|famil)/.test(t)) return "responsavel"
  if (/(atleta|jogador|eu mesmo|eu mesma|\beu\b|propri)/.test(t)) return "atleta"
  return null
}

/* ------------------------------------------------------------------ */
/* Tudo junto                                                          */
/* ------------------------------------------------------------------ */

/**
 * Interpreta o evento limpo. Campos que o SDR corrigiu no CRM (`structured`) valem mais que o
 * texto livre do formulário. O que veio e não serviu entra em `review`.
 */
export function parseEvent(e: ReturnType<typeof sanitizeEvent>, today = new Date()): Parsed {
  const out: Parsed = { raw: {}, review: [] }
  const profile = e.profile as Partial<Record<(typeof PROFILE_KEYS)[number], string>>
  const st = (e.structured ?? {}) as Partial<Record<(typeof STRUCTURED_TEXT)[number], string>>
  const review = (field: Field, raw: string) => out.review.push({ field, raw: raw.slice(0, 500) })

  const birthRaw = st.athlete_birth_date ?? profile.birth_date_raw
  if (birthRaw) {
    out.raw.birth_date = birthRaw
    const d = parseBirthDate(birthRaw, today)
    if (d) out.birth_date = d
    else review("birth_date", birthRaw)
  }

  const posRaw = st.athlete_position ?? profile.position_category_raw
  if (posRaw) {
    const p = parsePositionCategory(posRaw)
    out.raw.position = posRaw
    if (p.position) out.position = p.position
    else if (p.positionAmbiguous) review("position", posRaw)
    if (p.category) {
      out.category = p.category
      out.raw.category = posRaw
    }
  }
  // A categoria pode estar só no texto do formulário quando a posição veio do CRM.
  if (!out.category && profile.position_category_raw && profile.position_category_raw !== posRaw) {
    const p = parsePositionCategory(profile.position_category_raw)
    if (p.category) {
      out.category = p.category
      out.raw.category = profile.position_category_raw
    }
  }

  if (profile.current_club_raw) {
    const c = parseClub(profile.current_club_raw)
    out.raw.team = profile.current_club_raw
    if (c.team) out.team = c.team
    else if (c.review) review("team", profile.current_club_raw)
  }

  const cityRaw = st.city_state ?? profile.state_raw
  if (cityRaw) {
    out.raw.city = cityRaw
    // Cidade e UF corrigidas no CRM entram como vieram; só o estado vira o nome por extenso.
    if (st.city_state && /[a-z]/i.test(st.city_state) && st.city_state.length <= 80 && /[-/,]/.test(st.city_state)) out.city = st.city_state
    else {
      const s = parseState(cityRaw)
      if (s) out.city = s
      else review("city", cityRaw)
    }
  }

  if (profile.filled_by_raw) {
    const f = parseFilledBy(profile.filled_by_raw)
    if (f) out.filled_by = f
  }
  return out
}
