/**
 * Camada do Scout na área do atleta: o que a equipe publicou para a pessoa (travas de cada
 * parte da área, foto de corpo inteiro, oportunidades reais com prazo) e os vídeos que ela
 * mandou para a análise.
 *
 * O atleta não lê as tabelas da equipe: usa `zyron_my_scout_layer()`, que devolve só o
 * publicado e nunca a nota interna, e envia vídeo por `zyron_submit_match_video()` (o banco
 * confere o link). A equipe, no "ver como", lê as tabelas direto. Sem a migração (ou com
 * qualquer falha de leitura), a camada vem vazia e a área segue como antes: nada quebra.
 * Migração: 20261020100000_camada_do_scout.sql.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"

const db = supabase as unknown as SupabaseClient

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** As partes da área do atleta que a equipe pode abrir ou trancar à mão. */
export type LockKey = "opportunities" | "analysis" | "matches" | "performance" | "compare"
export type LockState = "open" | "locked"
/** Ausente = automático (a jornada decide). */
export type Locks = Partial<Record<LockKey, LockState>>

export const LOCK_KEYS: LockKey[] = ["opportunities", "analysis", "matches", "performance", "compare"]

export const LOCK_LABEL: Record<LockKey, { label: string; text: string }> = {
  opportunities: { label: "Oportunidades", text: "Clubes revelados e oportunidades da equipe." },
  analysis: { label: "Envio de jogos", text: "Mandar o link de um jogo para a análise lance a lance." },
  matches: { label: "Partidas", text: "As partidas analisadas, com vídeo e cada lance." },
  performance: { label: "Desempenho", text: "Mapa de calor, estatísticas e índices da temporada." },
  compare: { label: "Comparativo", text: "O próprio jogo lado a lado com perfis de referência." },
}

export type ClubRef = {
  id: string
  name: string
  country: string | null
  league: string | null
  /** Escudo enviado pela equipe (Storage). */
  crestUrl: string | null
  /** Escudo do catálogo (emoji), quando ainda não há imagem. */
  emblem: string | null
  /** Cor do clube (#rrggbb): acento do palco da foto de corpo inteiro. */
  color: string | null
  catalogId: string | null
}

export type OpportunityStatus = "aberta" | "enviada" | "encerrada" | "recusada"

export type RealOpportunity = {
  id: string
  club: ClubRef
  compatibility: number
  /** Data limite (AAAA-MM-DD) ou null. */
  deadline: string | null
  status: OpportunityStatus
  athleteNote: string | null
  publishedAt: string | null
}

export type BodyStyle = "moldura" | "recorte"

export type BodyPhoto = {
  /** Versão grande (1000 px de altura). */
  url: string
  /** Versão de 640 px, para o celular. */
  smallUrl: string | null
  style: BodyStyle
  /** Clube do uniforme: dá a cor do palco e o escudo do selo. */
  kit: ClubRef | null
}

export type SubmissionStatus = "enviado" | "em_analise" | "analisado" | "recusado"

export type Submission = {
  id: string
  /** Id do vídeo no YouTube: o link é sempre refeito a partir dele, nunca o texto que a pessoa colou. */
  videoId: string
  opponent: string | null
  playedOn: string | null
  note: string | null
  status: SubmissionStatus
  reviewNote: string | null
  matchId: string | null
  createdAt: string
}

/** Como a pessoa aparece: a foto redonda de perfil ou a de corpo inteiro. */
export type PhotoMode = "perfil" | "corpo"

export type ScoutLayer = {
  memberId: string | null
  locks: Locks
  /** A foto de corpo inteiro que aparece no Início (só quando a escolha é "corpo"). */
  bodyPhoto: BodyPhoto | null
  /** A foto de corpo inteiro que a equipe enviou, mesmo com a escolha em "perfil" (para a pessoa ver as duas opções). */
  bodyPhotoOption: BodyPhoto | null
  photoMode: PhotoMode
  /** Quem escolheu por último (o atleta ou a equipe) e quando. */
  photoChoiceBy: "atleta" | "equipe" | null
  photoChoiceAt: string | null
  /** Só as publicadas e em andamento (aberta ou enviada). */
  opportunities: RealOpportunity[]
  submissions: Submission[]
  /** A migração existe: dá para enviar vídeo pela área. */
  available: boolean
}

export const EMPTY_LAYER: ScoutLayer = {
  memberId: null, locks: {}, bodyPhoto: null, bodyPhotoOption: null, photoMode: "perfil", photoChoiceBy: null, photoChoiceAt: null,
  opportunities: [], submissions: [], available: false,
}

const choiceBy = (v: unknown): ScoutLayer["photoChoiceBy"] => (v === "atleta" || v === "equipe" ? v : null)

/* ------------------------------------------------------------------ */
/* Leitura (o banco devolve snake_case, tanto na função quanto nas tabelas) */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
const https = (v: unknown) => (typeof v === "string" && /^https:\/\//.test(v) ? v : null)
const YT_ID = /^[A-Za-z0-9_-]{11}$/

export const toClub = (r: Row | null | undefined): ClubRef | null => {
  if (!r || typeof r !== "object" || !text(r.id) || !text(r.name)) return null
  return {
    id: String(r.id),
    name: String(r.name),
    country: text(r.country),
    league: text(r.league),
    crestUrl: https(r.crest_url),
    emblem: text(r.emblem),
    color: typeof r.color === "string" && /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : null,
    catalogId: text(r.catalog_id),
  }
}

const STATUSES: OpportunityStatus[] = ["aberta", "enviada", "encerrada", "recusada"]

export const toOpportunity = (r: Row): RealOpportunity | null => {
  const club = toClub(r.club as Row)
  if (!club || !text(r.id)) return null
  return {
    id: String(r.id),
    club,
    compatibility: Math.max(0, Math.min(100, Math.round(Number(r.compatibility) || 0))),
    deadline: text(r.deadline)?.slice(0, 10) ?? null,
    status: STATUSES.includes(r.status as OpportunityStatus) ? (r.status as OpportunityStatus) : "aberta",
    athleteNote: text(r.athlete_note),
    publishedAt: text(r.published_at),
  }
}

const SUB_STATUSES: SubmissionStatus[] = ["enviado", "em_analise", "analisado", "recusado"]

export const toSubmission = (r: Row): Submission | null => {
  const videoId = text(r.video_id)
  if (!text(r.id) || !videoId || !YT_ID.test(videoId)) return null
  return {
    id: String(r.id),
    videoId,
    opponent: text(r.opponent),
    playedOn: text(r.played_on)?.slice(0, 10) ?? null,
    note: text(r.note),
    status: SUB_STATUSES.includes(r.status as SubmissionStatus) ? (r.status as SubmissionStatus) : "enviado",
    reviewNote: text(r.review_note),
    matchId: text(r.match_id),
    createdAt: text(r.created_at) ?? new Date().toISOString(),
  }
}

export function toLocks(v: unknown): Locks {
  const out: Locks = {}
  if (!v || typeof v !== "object") return out
  for (const k of LOCK_KEYS) {
    const s = (v as Row)[k]
    if (s === "open" || s === "locked") out[k] = s
  }
  return out
}

function toBodyPhoto(r: Row | null | undefined, kit: ClubRef | null): BodyPhoto | null {
  const url = https(r?.url ?? r?.body_photo_url)
  if (!r || !url) return null
  return {
    url,
    smallUrl: https(r.small_url ?? r.body_photo_small_url),
    style: (r.style ?? r.body_photo_style) === "recorte" ? "recorte" : "moldura",
    kit,
  }
}

const list = <T,>(rows: unknown, fn: (r: Row) => T | null): T[] =>
  Array.isArray(rows) ? rows.map((r) => fn(r as Row)).filter((x): x is T => x !== null) : []

/** A função ou a tabela ainda não existe no banco. */
export const isMissing = (error: { code?: string; message?: string } | null | undefined) =>
  Boolean(error && (error.code === "42P01" || error.code === "42883" || error.code === "PGRST202" || error.code === "PGRST205"
    || /does not exist|could not find the (table|function)/i.test(error.message ?? "")))

/** O atleta logado: só o publicado, pela função do banco. */
async function readOwn(): Promise<ScoutLayer> {
  const { data, error } = await db.rpc("zyron_my_scout_layer")
  if (error || !data || typeof data !== "object") return EMPTY_LAYER
  const d = data as Row
  const photo = d.body_photo as Row | null
  // Banco sem a migração da foto escolhida: a opção é a própria foto ligada.
  const option = (d.body_photo_option as Row | null | undefined) ?? photo
  const bodyPhoto = toBodyPhoto(photo, toClub(photo?.kit as Row))
  return {
    memberId: text(d.member_id),
    locks: toLocks(d.locks),
    bodyPhoto,
    bodyPhotoOption: toBodyPhoto(option, toClub(option?.kit as Row)),
    photoMode: bodyPhoto ? "corpo" : "perfil",
    photoChoiceBy: choiceBy(d.photo_choice_by),
    photoChoiceAt: text(d.photo_choice_at),
    opportunities: list(d.opportunities, toOpportunity),
    submissions: list(d.submissions, toSubmission),
    available: true,
  }
}

/** A equipe no "ver como": lê as tabelas, mas só o que o atleta veria. */
async function readAsStaff(memberId: string | null, userId: string | null): Promise<ScoutLayer> {
  const [controls, opps, subs] = await Promise.all([
    memberId ? db.from("zyron_player_controls").select("*").eq("member_id", memberId).maybeSingle() : Promise.resolve(null),
    memberId
      ? db.from("zyron_opportunities").select("*, club:zyron_clubs(*)").eq("member_id", memberId).eq("published", true).in("status", ["aberta", "enviada"])
      : Promise.resolve(null),
    userId ? db.from("zyron_match_submissions").select("*").eq("user_id", userId).order("created_at", { ascending: false }) : Promise.resolve(null),
  ])
  if (isMissing(controls?.error) || isMissing(opps?.error)) return EMPTY_LAYER
  const c = (controls?.data ?? null) as Row | null
  let kit: ClubRef | null = null
  if (c?.kit_club_id) {
    const k = await db.from("zyron_clubs").select("*").eq("id", c.kit_club_id as string).maybeSingle()
    kit = toClub(k.data as Row)
  }
  const option = toBodyPhoto(c, kit)
  const bodyPhoto = c?.body_photo_on === true ? option : null
  return {
    memberId,
    locks: toLocks(c?.locks),
    bodyPhoto,
    bodyPhotoOption: option,
    photoMode: bodyPhoto ? "corpo" : "perfil",
    photoChoiceBy: choiceBy(c?.photo_choice_by),
    photoChoiceAt: text(c?.photo_choice_at),
    opportunities: list(opps?.data, toOpportunity).sort(byFit),
    submissions: list(subs?.data, toSubmission),
    available: true,
  }
}

const byFit = (a: RealOpportunity, b: RealOpportunity) =>
  b.compatibility - a.compatibility || (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")

/**
 * A camada de quem está na área. `asStaff`: a equipe vendo a área de alguém ("ver como").
 * `preview`: dados locais do `npm run dev`.
 */
export async function loadScoutLayer(opts: { preview: boolean; asStaff: boolean; memberId: string | null; userId: string | null }): Promise<ScoutLayer> {
  try {
    // A condição fica por extenso para o build de produção descartar os dados de teste.
    if (import.meta.env.DEV && opts.preview) return (await import("./fixtures")).fixtureScoutLayer(opts.memberId)
    return opts.asStaff ? await readAsStaff(opts.memberId, opts.userId) : await readOwn()
  } catch {
    return EMPTY_LAYER
  }
}

/* ------------------------------------------------------------------ */
/* Envio de vídeo                                                      */
/* ------------------------------------------------------------------ */

export type SubmitInput = { url: string; opponent: string; playedOn: string; note: string }

/** Manda o link de um jogo para a análise. O banco confere o link (só YouTube) e o limite de envios. */
export async function submitMatchVideo(input: SubmitInput, preview: boolean): Promise<Submission> {
  if (import.meta.env.DEV && preview) return (await import("./fixtures")).fixtureSubmit(input)
  const { data, error } = await db.rpc("zyron_submit_match_video", {
    p_url: input.url.trim(),
    p_opponent: input.opponent.trim() || null,
    p_played_on: input.playedOn || null,
    p_note: input.note.trim() || null,
  })
  if (error) {
    if (isMissing(error)) throw new Error("O envio de jogos pela área ainda não foi ativado. Fale com a equipe pelo WhatsApp.")
    throw new Error(error.message || "Não foi possível enviar o jogo.")
  }
  const s = toSubmission(data as Row)
  if (!s) throw new Error("Não foi possível enviar o jogo.")
  return s
}

/* ------------------------------------------------------------------ */
/* A escolha da foto                                                   */
/* ------------------------------------------------------------------ */

export type PhotoChoiceResult = { mode: PhotoMode; choiceBy: ScoutLayer["photoChoiceBy"]; choiceAt: string | null }

/** A própria pessoa escolhe como aparece. O banco confere que corpo inteiro só vale com a foto enviada pela equipe. */
export async function setMyPhotoMode(mode: PhotoMode, preview: boolean): Promise<PhotoChoiceResult> {
  if (import.meta.env.DEV && preview) return (await import("./fixtures")).fixtureSetPhotoMode(mode)
  const { data, error } = await db.rpc("zyron_set_my_photo_mode", { p_mode: mode })
  if (error) {
    if (isMissing(error)) throw new Error("A escolha da foto ainda não foi ativada. Fale com a equipe pelo WhatsApp.")
    throw new Error(error.message || "Não foi possível trocar a foto.")
  }
  const d = (data ?? {}) as Row
  return { mode: d.photo_mode === "corpo" ? "corpo" : "perfil", choiceBy: choiceBy(d.photo_choice_by), choiceAt: text(d.photo_choice_at) }
}

/* ------------------------------------------------------------------ */
/* Ajudantes de tela                                                   */
/* ------------------------------------------------------------------ */

/** Link e miniatura do YouTube a partir do id (nunca do texto colado). */
export const youtubeWatch = (id: string) => (YT_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null)
export const youtubeThumb = (id: string) => (YT_ID.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null)

export type DeadlineTone = "ok" | "soon" | "urgent" | "over" | "none"

/** Dias até o prazo (0 = hoje), o tom (verde > 7, âmbar 3 a 7, vermelho ≤ 3, cinza vencido) e o texto. */
export function deadlineInfo(deadline: string | null, now = new Date()): { days: number | null; tone: DeadlineTone; label: string } {
  if (!deadline) return { days: null, tone: "none", label: "Sem prazo" }
  const end = new Date(`${deadline}T23:59:59`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const days = Math.round((day.getTime() - today.getTime()) / 86400000)
  if (end.getTime() < now.getTime()) return { days, tone: "over", label: "Prazo encerrado" }
  if (days === 0) return { days, tone: "urgent", label: "Último dia" }
  return { days, tone: days <= 3 ? "urgent" : days <= 7 ? "soon" : "ok", label: `Falta${days === 1 ? "" : "m"} ${days} dia${days === 1 ? "" : "s"}` }
}

/** "2026-11-03" → "03/11". */
export const shortDay = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/") : "")
