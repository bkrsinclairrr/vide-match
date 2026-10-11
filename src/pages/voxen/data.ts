/**
 * Dados da VOXEN: junta os leads do funil (funnel_leads), os atletas com
 * conta (Atletas + profiles) e a mesa de trabalho dos admins
 * (voxen_player_meta) num formato único, `Player`.
 *
 * Tudo aqui tolera o banco sem a migração 20261009000000_voxen_platform:
 * sem as colunas `profile`/`report` o lead aparece só com contato e origem;
 * sem a tabela de meta, etapa/notas/avaliação ficam salvas neste navegador.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { STAT_KEYS, buildStats, overallFrom, type StatResult } from "@/lib/funnel"
import { buildAccountSeed } from "@/lib/resultIdentity"

// Tabelas e colunas novas ainda não estão nos tipos gerados.
const db = supabase as unknown as SupabaseClient

/* ------------------------------------------------------------------ */
/* Catálogos                                                           */
/* ------------------------------------------------------------------ */

export const STAGES = [
  { key: "novo", label: "Novo", color: "#a1a1aa" },
  { key: "contato", label: "Em contato", color: "#38bdf8" },
  { key: "avaliacao", label: "Em avaliação", color: "#fbbf24" },
  { key: "aprovado", label: "Aprovado", color: "#34d399" },
  { key: "descartado", label: "Descartado", color: "#f87171" },
] as const

export type StageKey = (typeof STAGES)[number]["key"]
export const stageInfo = (key: StageKey) => STAGES.find((s) => s.key === key) ?? STAGES[0]

/** Atributos da avaliação do scout (notas de 1 a 5, meio ponto). */
export const SCOUT_ATTRS = [
  { key: "conducao", label: "Condução de bola" },
  { key: "troca", label: "Troca de corredor" },
  { key: "costas", label: "Jogo de costas" },
  { key: "sem_bola", label: "Movimento sem bola" },
  { key: "linha_passe", label: "Oferecer linha de passe" },
  { key: "passe_vencedor", label: "Passe vencedor" },
  { key: "ajuste", label: "Ajuste de corpo" },
  { key: "engano", label: "Engano" },
  { key: "cruzamento", label: "Cruzamento" },
  { key: "finalizacao", label: "Finalização" },
] as const

/** Abreviações das colunas da tabela, na ordem de STAT_KEYS. */
export const STAT_ABBR: Record<string, string> = {
  ataque: "ATA", defesa: "DEF", chute: "CHU", dominio: "DOM", marcacao: "MAR",
  finalizacao: "FIN", drible: "DRI", passe: "PAS", velocidade: "VEL", leitura: "LEI",
}

/** Dimensões do jogo, a partir dos 10 indicadores do relatório. */
export const DIMENSIONS = [
  { key: "ofensivo", label: "Ofensivo", stats: ["ataque", "chute", "finalizacao"] },
  { key: "tecnico", label: "Técnico", stats: ["dominio", "passe", "drible"] },
  { key: "defensivo", label: "Defensivo", stats: ["defesa", "marcacao"] },
  { key: "tatico", label: "Tático", stats: ["leitura"] },
  { key: "fisico", label: "Físico", stats: ["velocidade"] },
] as const

export type LineKey = "gol" | "def" | "mei" | "ata"

export const LINES: { key: LineKey; label: string }[] = [
  { key: "gol", label: "Goleiros" },
  { key: "def", label: "Defensores" },
  { key: "mei", label: "Meio-campistas" },
  { key: "ata", label: "Atacantes" },
]

/** Posição → sigla, linha e lugar no campo (x: esquerda→direita, y: ataque→defesa). */
export const POSITIONS: Record<string, { code: string; line: LineKey; x: number; y: number }> = {
  "Goleiro": { code: "GOL", line: "gol", x: 50, y: 91 },
  "Lateral Direito": { code: "LD", line: "def", x: 85, y: 70 },
  "Lateral Esquerdo": { code: "LE", line: "def", x: 15, y: 70 },
  "Zagueiro": { code: "ZAG", line: "def", x: 50, y: 76 },
  "Volante": { code: "VOL", line: "mei", x: 50, y: 58 },
  "Meio-Campo": { code: "MC", line: "mei", x: 50, y: 46 },
  "Meia-Atacante": { code: "MEI", line: "mei", x: 50, y: 34 },
  "Ponta Direita": { code: "PD", line: "ata", x: 82, y: 21 },
  "Ponta Esquerda": { code: "PE", line: "ata", x: 18, y: 21 },
  "Centroavante": { code: "CA", line: "ata", x: 50, y: 13 },
}

const UF: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA", "Ceará": "CE",
  "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
}

/* ------------------------------------------------------------------ */
/* Modelo                                                              */
/* ------------------------------------------------------------------ */

export type Profile = {
  age?: number
  height?: number
  weight?: number
  foot?: string
  nationality?: string
  position?: string
  category?: string
  state?: string
  city?: string
  dualCitizenship?: string
}

export type PlayerMeta = {
  stage: StageKey
  notes: string
  scout: Record<string, number> | null
  updatedAt: string | null
}

export type Player = {
  key: string
  source: "funil" | "conta"
  name: string
  email: string | null
  phone: string | null
  createdAt: string
  profile: Profile
  hasProfile: boolean
  origin: string
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null }
  stats: StatResult[]
  overall: number
  /** O relatório veio do funil/conta (o mesmo da tela do atleta) ou foi gerado aqui. */
  reportFromFunnel: boolean
  meta: PlayerMeta
}

export const EMPTY_META: PlayerMeta = { stage: "novo", notes: "", scout: null, updatedAt: null }

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export const positionOf = (p: Player) => (p.profile.position ? POSITIONS[p.profile.position] : undefined)
export const positionCode = (p: Player) => positionOf(p)?.code ?? "—"

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || "Atleta"

export function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? "Atleta"
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}

export function placeOf(p: Player) {
  if (p.profile.city) return p.profile.city
  if (p.profile.state) return UF[p.profile.state] ?? p.profile.state
  return null
}

export function ufOf(p: Player) {
  const fromCity = p.profile.city?.match(/-\s*([A-Z]{2})$/)?.[1]
  return fromCity ?? (p.profile.state ? UF[p.profile.state] ?? null : null)
}

export function formatPhone(digits: string | null) {
  if (!digits) return "—"
  const d = digits.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export function whatsappLink(p: Player, text?: string) {
  const d = (p.phone ?? "").replace(/\D/g, "")
  if (!d) return null
  const full = d.length <= 11 ? `55${d}` : d
  const msg = text ?? `Olá, ${firstName(p.name)}! Aqui é da equipe Zyron, sobre a sua avaliação.`
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "agora"
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  const d = Math.floor(s / 86400)
  return d === 1 ? "ontem" : `há ${d} dias`
}

/** Origem legível a partir das UTMs e dos click ids. */
export function originOf(row: { utm_source?: string | null; fbclid?: string | null; gclid?: string | null; ttclid?: string | null }) {
  const s = (row.utm_source ?? "").toLowerCase()
  if (/face|fb|insta|ig|meta/.test(s) || (!s && row.fbclid)) return "Meta Ads"
  if (/google|gads|adwords|youtube/.test(s) || (!s && row.gclid)) return "Google"
  if (/tiktok|tt/.test(s) || (!s && row.ttclid)) return "TikTok"
  if (/whats|wpp|zap/.test(s)) return "WhatsApp"
  if (s) return row.utm_source as string
  return "Direto"
}

/* ------------------------------------------------------------------ */
/* Cores por nota                                                      */
/* ------------------------------------------------------------------ */

/** Notas do relatório (faixa 76–95). */
export function scoreTone(score: number) {
  if (score >= 90) return { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "Elite" }
  if (score >= 86) return { color: "#a3e635", bg: "rgba(163,230,53,0.11)", label: "Acima da média" }
  if (score >= 81) return { color: "#fbbf24", bg: "rgba(251,191,36,0.11)", label: "Na média" }
  return { color: "#fb923c", bg: "rgba(251,146,60,0.12)", label: "Abaixo da média" }
}

/** Percentil dentro da base (0–100). */
export function pctTone(pct: number) {
  if (pct >= 90) return { color: "#34d399", label: "Elite" }
  if (pct >= 65) return { color: "#a3e635", label: "Acima da média" }
  if (pct >= 35) return { color: "#fbbf24", label: "Na média" }
  return { color: "#fb923c", label: "Abaixo da média" }
}

/** Notas do scout (1–5). */
export function scoutTone(v: number) {
  if (v >= 4) return "#34d399"
  if (v >= 3) return "#d4c234"
  if (v >= 2) return "#d9915a"
  return "#e0674f"
}

export function scoutAverage(scout: Record<string, number> | null) {
  if (!scout) return null
  const values = SCOUT_ATTRS.map((a) => scout[a.key]).filter((v): v is number => typeof v === "number")
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

export function dimensionScores(p: Player) {
  const byKey = Object.fromEntries(p.stats.map((s) => [s.key, s.score]))
  return DIMENSIONS.map((d) => ({
    ...d,
    score: Math.round(d.stats.reduce((acc, k) => acc + (byKey[k] ?? 0), 0) / d.stats.length),
  }))
}

/* ------------------------------------------------------------------ */
/* Percentis da base                                                   */
/* ------------------------------------------------------------------ */

export type Percentiles = (key: string, score: number) => number

/** "Melhor que X% da base": fatia dos demais atletas com nota menor. */
export function buildPercentiles(players: Player[]): Percentiles {
  const sorted: Record<string, number[]> = {}
  for (const { key } of [...STAT_KEYS, { key: "overall" }]) {
    sorted[key] = players
      .map((p) => (key === "overall" ? p.overall : p.stats.find((s) => s.key === key)?.score ?? 0))
      .sort((a, b) => a - b)
  }
  return (key, score) => {
    const list = sorted[key] ?? []
    if (list.length <= 1) return 50
    let lower = 0
    while (lower < list.length && list[lower] < score) lower++
    return Math.round((lower / (list.length - 1)) * 100)
  }
}

/* ------------------------------------------------------------------ */
/* Normalização                                                        */
/* ------------------------------------------------------------------ */

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : undefined
}
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined)

function profileFromJson(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return {}
  const r = raw as Record<string, unknown>
  return {
    age: num(r.age),
    height: num(r.height),
    weight: num(r.weight),
    foot: str(r.preferredFoot),
    nationality: str(r.nationality),
    position: str(r.position),
    category: str(r.category),
    state: str(r.state),
    city: str(r.city),
    dualCitizenship: r.hasDualCitizenship === "sim" || r.hasDualCitizenship === "Sim" ? str(r.dualCitizenshipCountry) : undefined,
  }
}

function statsFromReport(raw: unknown): { stats: StatResult[]; overall: number } | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { overall?: unknown; stats?: Record<string, unknown> }
  if (!r.stats || typeof r.stats !== "object") return null
  const stats = STAT_KEYS.map((s) => ({ ...s, score: num(r.stats?.[s.key]) ?? 0 }))
  if (stats.some((s) => s.score < 1 || s.score > 100)) return null
  return { stats, overall: num(r.overall) ?? overallFrom(stats) }
}

const hasAnyProfile = (p: Profile) => Boolean(p.position || p.category || p.age || p.city)

type LeadRow = {
  id: string; name: string | null; email: string; phone: string; created_at: string
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null
  utm_content: string | null; utm_term: string | null
  fbclid: string | null; gclid: string | null; ttclid: string | null
  profile?: unknown; report?: unknown
}

function fromLead(row: LeadRow, meta: Map<string, PlayerMeta>): Player {
  const key = `lead:${row.id}`
  const profile = profileFromJson(row.profile)
  const saved = statsFromReport(row.report)
  const stats = saved?.stats ?? buildStats(key)
  return {
    key,
    source: "funil",
    name: row.name?.trim() || row.email.split("@")[0],
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    profile,
    hasProfile: hasAnyProfile(profile),
    origin: originOf(row),
    utm: { source: row.utm_source, medium: row.utm_medium, campaign: row.utm_campaign, content: row.utm_content, term: row.utm_term },
    stats,
    overall: saved?.overall ?? overallFrom(stats),
    reportFromFunnel: Boolean(saved),
    meta: meta.get(key) ?? EMPTY_META,
  }
}

type AthleteRow = {
  id: number; user_id: string | null; nome: string | null; idade: number | null; altura: number | null
  peso: number | null; melhor_pe: string | null; nacionalidade: string | null; posicao: string | null
  cidade: string | null; created_at: string
}

function fromAthlete(row: AthleteRow, names: Map<string, string>, meta: Map<string, PlayerMeta>): Player {
  const key = `atleta:${row.id}`
  const profile: Profile = {
    age: num(row.idade), height: num(row.altura), weight: num(row.peso), foot: str(row.melhor_pe),
    nationality: str(row.nacionalidade), position: str(row.posicao), city: str(row.cidade),
  }
  // Mesmo cálculo da tela de resultado para quem tem conta.
  const stats = buildStats(row.user_id ? buildAccountSeed(row.user_id) : key)
  return {
    key,
    source: "conta",
    name: row.nome?.trim() || (row.user_id && names.get(row.user_id)) || "Atleta",
    email: null,
    phone: null,
    createdAt: row.created_at,
    profile,
    hasProfile: hasAnyProfile(profile),
    origin: "Conta Zyron",
    utm: { source: null, medium: null, campaign: null, content: null, term: null },
    stats,
    overall: overallFrom(stats),
    reportFromFunnel: Boolean(row.user_id),
    meta: meta.get(key) ?? EMPTY_META,
  }
}

/* ------------------------------------------------------------------ */
/* Carga                                                               */
/* ------------------------------------------------------------------ */

export type VoxenData = {
  players: Player[]
  /** A tabela voxen_player_meta existe (etapa/notas/avaliação compartilhadas). */
  sharedMeta: boolean
  /** A migração do perfil já rodou (funnel_leads.profile existe). */
  profileCapture: boolean
  loadedAt: Date
}

const LOCAL_META_KEY = "voxen:meta"

function loadLocalMeta(): Record<string, PlayerMeta> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_META_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveLocalMeta(key: string, meta: PlayerMeta) {
  try {
    const all = loadLocalMeta()
    all[key] = meta
    localStorage.setItem(LOCAL_META_KEY, JSON.stringify(all))
  } catch {
    /* storage cheio ou bloqueado */
  }
}

async function fetchAll<T>(table: string, order = "created_at"): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select("*").order(order, { ascending: false }).range(from, from + 999)
    if (error) throw error
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function loadVoxenData(): Promise<VoxenData> {
  const metaMap = new Map<string, PlayerMeta>()
  let sharedMeta = false

  const metaRes = await db.from("voxen_player_meta").select("*")
  if (!metaRes.error) {
    sharedMeta = true
    for (const row of metaRes.data ?? []) {
      metaMap.set(row.player_key, {
        stage: (STAGES.some((s) => s.key === row.stage) ? row.stage : "novo") as StageKey,
        notes: row.notes ?? "",
        scout: row.scout && typeof row.scout === "object" ? row.scout : null,
        updatedAt: row.updated_at ?? null,
      })
    }
  } else {
    for (const [k, v] of Object.entries(loadLocalMeta())) metaMap.set(k, v)
  }

  const [leads, athletes, profiles] = await Promise.all([
    fetchAll<LeadRow>("funnel_leads"),
    fetchAll<AthleteRow>("Atletas").catch(() => [] as AthleteRow[]),
    fetchAll<{ id: string; full_name: string | null }>("profiles").catch(() => []),
  ])

  const names = new Map(profiles.filter((p) => p.full_name).map((p) => [p.id, p.full_name as string]))
  const players = [
    ...leads.map((row) => fromLead(row, metaMap)),
    ...athletes.map((row) => fromAthlete(row, names, metaMap)),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    players,
    sharedMeta,
    profileCapture: leads.length === 0 || leads.some((row) => "profile" in row),
    loadedAt: new Date(),
  }
}

export async function saveMeta(key: string, meta: PlayerMeta, shared: boolean): Promise<void> {
  if (!shared) {
    saveLocalMeta(key, meta)
    return
  }
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await db.from("voxen_player_meta").upsert({
    player_key: key,
    stage: meta.stage,
    notes: meta.notes || null,
    scout: meta.scout,
    updated_at: new Date().toISOString(),
    updated_by: auth.user?.id ?? null,
  })
  if (error) throw error
}
