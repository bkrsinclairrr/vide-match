/**
 * Modelo da área de membros (/membros) e do painel de gestão na VOXEN.
 *
 * Coordenadas do campo (eventos e mapas de calor), sempre do ponto de vista
 * do atleta, atacando para a direita:
 *   x: 0 = linha do próprio gol → 100 = linha do gol adversário
 *   y: 0 = lateral esquerda     → 100 = lateral direita
 */
import { POSITIONS } from "@/pages/voxen/data"

export type MemberKind = "membro" | "referencia"

export type Member = {
  id: string
  kind: MemberKind
  userId: string | null
  email: string | null
  fullName: string
  birthDate: string | null
  position: string | null
  category: string | null
  foot: string | null
  heightCm: number | null
  weightKg: number | null
  city: string | null
  team: string | null
  photoUrl: string | null
  bio: string | null
  scout: Record<string, number> | null
  leadId: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type Match = {
  id: string
  memberId: string
  playedOn: string
  competition: string | null
  team: string
  opponent: string
  isHome: boolean
  goalsFor: number | null
  goalsAgainst: number | null
  minutes: number | null
  position: string | null
  videoUrl: string | null
  rating: number | null
  summary: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

export type MatchEvent = {
  id: string
  matchId: string
  t: number
  half: 1 | 2 | null
  action: ActionKey
  success: boolean | null
  x: number
  y: number
  note: string | null
}

export type Bundle = { member: Member; matches: Match[]; events: MatchEvent[] }

/* ------------------------------------------------------------------ */
/* Ações marcadas no vídeo                                             */
/* ------------------------------------------------------------------ */

export type ActionGroup = "ofensivo" | "construcao" | "defensivo" | "disciplina"

export const GROUPS: Record<ActionGroup, { label: string; color: string }> = {
  ofensivo: { label: "Ofensivo", color: "#fbbf24" },
  construcao: { label: "Construção", color: "#38bdf8" },
  defensivo: { label: "Defensivo", color: "#34d399" },
  disciplina: { label: "Disciplina", color: "#f87171" },
}

/**
 * `outcome`: a ação tem certo/errado (Shift + tecla marca como errado).
 * `positive`: sem resultado, mas conta como ação bem-sucedida (ex.: gol).
 * Gol já conta como finalização no alvo; passe-chave e assistência já
 * contam como passe certo — não marque os dois.
 */
export const ACTIONS = {
  passe: { label: "Passe", group: "construcao", outcome: true, key: "p" },
  passe_chave: { label: "Passe-chave", group: "ofensivo", outcome: false, positive: true, key: "k" },
  assistencia: { label: "Assistência", group: "ofensivo", outcome: false, positive: true, key: "a" },
  finalizacao: { label: "Finalização", group: "ofensivo", outcome: true, key: "f", okLabel: "No alvo", failLabel: "Para fora" },
  gol: { label: "Gol", group: "ofensivo", outcome: false, positive: true, key: "g" },
  drible: { label: "Drible", group: "ofensivo", outcome: true, key: "d" },
  cruzamento: { label: "Cruzamento", group: "ofensivo", outcome: true, key: "c" },
  conducao: { label: "Condução", group: "construcao", outcome: true, key: "o" },
  falta_sofrida: { label: "Falta sofrida", group: "ofensivo", outcome: false, positive: true, key: "q" },
  desarme: { label: "Desarme", group: "defensivo", outcome: true, key: "t" },
  interceptacao: { label: "Interceptação", group: "defensivo", outcome: false, positive: true, key: "i" },
  recuperacao: { label: "Recuperação", group: "defensivo", outcome: false, positive: true, key: "r" },
  duelo_chao: { label: "Duelo no chão", group: "defensivo", outcome: true, key: "s", okLabel: "Ganho", failLabel: "Perdido" },
  duelo_aereo: { label: "Duelo aéreo", group: "defensivo", outcome: true, key: "e", okLabel: "Ganho", failLabel: "Perdido" },
  bloqueio: { label: "Bloqueio", group: "defensivo", outcome: false, positive: true, key: "b" },
  defesa_goleiro: { label: "Defesa (goleiro)", group: "defensivo", outcome: false, positive: true, key: "x" },
  perda: { label: "Perda de posse", group: "construcao", outcome: false, negative: true, key: "l" },
  falta_cometida: { label: "Falta cometida", group: "disciplina", outcome: false, negative: true, key: "w" },
  cartao_amarelo: { label: "Cartão amarelo", group: "disciplina", outcome: false, key: "y" },
  cartao_vermelho: { label: "Cartão vermelho", group: "disciplina", outcome: false, key: "v" },
} as const satisfies Record<string, {
  label: string; group: ActionGroup; outcome: boolean; key: string
  positive?: boolean; negative?: boolean; okLabel?: string; failLabel?: string
}>

export type ActionKey = keyof typeof ACTIONS
export const ACTION_KEYS = Object.keys(ACTIONS) as ActionKey[]
export const isAction = (v: string): v is ActionKey => v in ACTIONS
export const actionInfo = (a: ActionKey) => ACTIONS[a] as {
  label: string; group: ActionGroup; outcome: boolean; key: string
  positive?: boolean; negative?: boolean; okLabel?: string; failLabel?: string
}

/** Resultado da ação para cores e totais: certa, errada ou neutra. */
export function eventTone(e: Pick<MatchEvent, "action" | "success">): "ok" | "fail" | "neutral" {
  const info = actionInfo(e.action)
  if (info.outcome) return e.success === false ? "fail" : "ok"
  if (info.positive) return "ok"
  if (info.negative) return "fail"
  return "neutral"
}

/* ------------------------------------------------------------------ */
/* Avaliação do scout (1 a 5), agrupada como no radar                  */
/* ------------------------------------------------------------------ */

export type ScoutGroupKey = "defensivo" | "fisico" | "ofensivo" | "tecnico"

export const SCOUT_GROUPS: { key: ScoutGroupKey; label: string; attrs: [string, string][] }[] = [
  {
    key: "defensivo", label: "Defensivo",
    attrs: [["marcacao", "Marcação"], ["desarme", "Desarme"], ["leitura", "Leitura e interceptação"], ["jogo_aereo", "Jogo aéreo"], ["recomposicao", "Recomposição"]],
  },
  {
    key: "fisico", label: "Físico",
    attrs: [["velocidade", "Velocidade"], ["aceleracao", "Aceleração"], ["resistencia", "Resistência"], ["forca", "Força"], ["impulsao", "Impulsão"]],
  },
  {
    key: "ofensivo", label: "Ofensivo",
    attrs: [["mov_sem_bola", "Movimento sem bola"], ["um_contra_um", "1 contra 1"], ["ultimo_passe", "Último passe"], ["profundidade", "Ataque à profundidade"], ["presenca_area", "Presença na área"]],
  },
  {
    key: "tecnico", label: "Técnico",
    attrs: [["passe_curto", "Passe curto"], ["passe_longo", "Passe longo"], ["dominio", "Domínio"], ["conducao", "Condução"], ["finalizacao", "Finalização"], ["cruzamento", "Cruzamento"]],
  },
]

export function scoutGroupAverage(scout: Record<string, number> | null, group: ScoutGroupKey) {
  const g = SCOUT_GROUPS.find((x) => x.key === group)
  if (!scout || !g) return null
  const values = g.attrs.map(([k]) => scout[k]).filter((v): v is number => typeof v === "number")
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

/* ------------------------------------------------------------------ */
/* Partida, vídeo e formatação                                         */
/* ------------------------------------------------------------------ */

export const positionCodeOf = (position: string | null) => (position && POSITIONS[position] ? POSITIONS[position].code : "—")

export function ageFrom(birthDate: string | null, now = new Date()) {
  if (!birthDate) return null
  const b = new Date(birthDate + "T12:00:00")
  if (Number.isNaN(b.getTime())) return null
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

export function resultOf(m: Match): "V" | "E" | "D" | null {
  if (m.goalsFor === null || m.goalsAgainst === null) return null
  return m.goalsFor > m.goalsAgainst ? "V" : m.goalsFor < m.goalsAgainst ? "D" : "E"
}

export const RESULT_COLORS = { V: "#22c55e", E: "#fbbf24", D: "#ef4444" } as const

/** "Time A 2 × 1 Time B", com o mandante à esquerda. */
export function scoreline(m: Match) {
  const gf = m.goalsFor ?? "–"
  const ga = m.goalsAgainst ?? "–"
  return m.isHome
    ? { left: m.team, right: m.opponent, leftGoals: gf, rightGoals: ga }
    : { left: m.opponent, right: m.team, leftGoals: ga, rightGoals: gf }
}

/** Cor da nota da partida (0–10), na escala das barras de "Últimas partidas". */
export function ratingColor(r: number | null) {
  if (r === null) return "#52525b"
  if (r >= 8) return "#22c55e"
  if (r >= 7) return "#a3e635"
  if (r >= 6) return "#facc15"
  if (r >= 5) return "#f97316"
  return "#ef4444"
}

/** Número com uma casa decimal, no formato brasileiro (7,5). */
export const fmt1 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

export function parseClock(text: string): number | null {
  const parts = text.trim().split(":").map((p) => Number.parseInt(p, 10))
  if (!parts.length || parts.some((p) => !Number.isFinite(p) || p < 0)) return null
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
const shortFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })
export const formatMatchDate = (iso: string) => dateFmt.format(new Date(iso + "T12:00:00")).replace(".", "")
export const formatShortDate = (iso: string) => shortFmt.format(new Date(iso + "T12:00:00"))

export type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "file"; url: string }
  | { kind: "vimeo"; id: string }
  | { kind: "drive"; id: string }

/** YouTube e arquivo (.mp4/.webm) permitem marcar o tempo; Vimeo e Drive só exibem. */
export function parseVideo(url: string | null): VideoSource | null {
  if (!url) return null
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  if (u.protocol !== "https:") return null
  const host = u.hostname.replace(/^www\.|^m\./, "")
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0]
    return id ? { kind: "youtube", id } : null
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = u.searchParams.get("v")
    if (v) return { kind: "youtube", id: v }
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/)
    return m ? { kind: "youtube", id: m[1] } : null
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(\d{6,})/)
    return m ? { kind: "vimeo", id: m[1] } : null
  }
  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([\w-]+)/) ?? null
    const id = m?.[1] ?? u.searchParams.get("id")
    return id ? { kind: "drive", id } : null
  }
  if (/\.(mp4|webm|ogv|ogg|mov|m4v)$/i.test(u.pathname) || host.endsWith("supabase.co")) {
    return { kind: "file", url: u.toString() }
  }
  return null
}

export const videoThumb = (src: VideoSource | null) =>
  src?.kind === "youtube" ? `https://i.ytimg.com/vi/${src.id}/hqdefault.jpg` : null

/** Escudo genérico do adversário: iniciais e uma cor estável por nome. */
export function shieldOf(name: string) {
  const words = name.replace(/\b(sub-?\d+|fc|ec|sc|ac|esporte|clube|futebol|de|da|do)\b/gi, " ").trim().split(/\s+/).filter(Boolean)
  const letters = (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? name).slice(0, 2)).toUpperCase()
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return { letters, color: `hsl(${hue} 62% 46%)`, dark: `hsl(${hue} 55% 22%)` }
}

export const sortMatchesDesc = (matches: Match[]) =>
  [...matches].sort((a, b) => b.playedOn.localeCompare(a.playedOn) || b.createdAt.localeCompare(a.createdAt))
