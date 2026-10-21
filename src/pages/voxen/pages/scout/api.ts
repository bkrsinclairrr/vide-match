/**
 * Dados da camada do Scout no painel da equipe: clubes (com escudo), oportunidades, travas e
 * foto de corpo inteiro de cada jogador, envios de vídeo, contexto do CRM e conflitos da ponte.
 *
 * A equipe lê tudo; quem mantém jogador (Scout, executivo, admin) escreve; excluir é do admin.
 * O banco é quem garante (RLS). No `npm run dev` com ?demo, dados locais (demo.ts, fora do build).
 * Migrações: 20261020100000_camada_do_scout, 20261020110000_midia_storage, 20261020120000_ficha_completa_e_crm.
 */
import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import type { Club as CatalogClub } from "@/data/clubs"
import {
  isMissing, toClub, toLocks, toSubmission,
  type BodyStyle, type ClubRef, type Locks, type OpportunityStatus, type Submission,
} from "@/pages/membros/scoutLayer"

const db = supabase as unknown as SupabaseClient
const BUCKET = "zyron-media"

/** As tabelas da camada do Scout ainda não existem no banco (migração não aplicada). */
export class ScoutSetupMissingError extends Error {
  constructor() {
    super("A camada do Scout ainda não foi ativada no banco de dados.")
    this.name = "ScoutSetupMissingError"
  }
}

export const SCOUT_MIGRATIONS = [
  "supabase/migrations/20261020100000_camada_do_scout.sql",
  "supabase/migrations/20261020110000_midia_storage.sql",
  "supabase/migrations/20261020120000_ficha_completa_e_crm.sql",
]

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Club = ClubRef & { active: boolean }

export type ClubInput = { id?: string; name: string; country: string | null; league: string | null; crestUrl: string | null; emblem: string | null; color: string | null }

export type Opportunity = {
  id: string
  memberId: string
  clubId: string
  club: Club | null
  compatibility: number
  deadline: string | null
  status: OpportunityStatus
  published: boolean
  publishedAt: string | null
  athleteNote: string | null
  internalNote: string | null
  createdAt: string
  updatedAt: string
}

export type OpportunityInput = {
  id?: string
  memberId: string
  clubId: string
  compatibility: number
  deadline: string | null
  status: OpportunityStatus
  published: boolean
  athleteNote: string | null
  internalNote: string | null
}

export type PhotoVersion = { url: string; smallUrl: string | null; style: BodyStyle }

export type Controls = {
  memberId: string
  locks: Locks
  bodyPhotoUrl: string | null
  bodyPhotoSmallUrl: string | null
  bodyPhotoOn: boolean
  bodyPhotoStyle: BodyStyle
  /** A foto anterior, para restaurar. */
  bodyPhotoPrev: PhotoVersion | null
  kitClubId: string | null
  /** Na lista da aba Oportunidades desde quando (null = fora). */
  shortlistedAt: string | null
  scoutId: string | null
  updatedAt: string | null
}

export type ControlsPatch = Partial<Omit<Controls, "memberId" | "updatedAt">>

export const emptyControls = (memberId: string): Controls => ({
  memberId, locks: {}, bodyPhotoUrl: null, bodyPhotoSmallUrl: null, bodyPhotoOn: false, bodyPhotoStyle: "moldura",
  bodyPhotoPrev: null, kitClubId: null, shortlistedAt: null, scoutId: null, updatedAt: null,
})

export type StaffSubmission = Submission & { userId: string; memberId: string | null; updatedAt: string }

export type SubmissionPatch = Partial<Pick<Submission, "status" | "reviewNote" | "matchId">> & { memberId?: string | null }

export type Answer = { question: string; answer: string }

export type MemberContext = {
  memberId: string
  currentClub: string | null
  pastClubs: string | null
  trials: string | null
  opportunitiesReceived: string | null
  goal: string | null
  blocker: string | null
  filledBy: "atleta" | "responsavel" | null
  answers: Answer[]
  source: "crm" | "equipe"
  importedAt: string | null
  updatedAt: string | null
}

export type ContextPatch = Partial<Pick<MemberContext, "currentClub" | "pastClubs" | "trials" | "opportunitiesReceived" | "goal" | "blocker" | "filledBy">>

export type ConflictField = "birth_date" | "position" | "category" | "team" | "city"

export type Conflict = {
  id: string
  memberId: string
  field: ConflictField
  kind: "divergente" | "revisar"
  currentValue: string | null
  proposedValue: string | null
  rawValue: string | null
  createdAt: string
}

export const FIELD_LABEL: Record<ConflictField, string> = {
  birth_date: "Nascimento", position: "Posição", category: "Categoria", team: "Time atual", city: "Cidade",
}

export type CrmHealth = {
  recebidos: number
  aplicados: number
  esperando: number
  quarentena: number
  conflitos: number
  comContexto: number
  ultimo: string | null
}

export interface ScoutApi {
  readonly demo: boolean
  clubs(): Promise<Club[]>
  saveClub(input: ClubInput): Promise<Club>
  /** O clube do catálogo da Zyron vira linha na hora do uso (uma vez só). */
  clubFromCatalog(c: CatalogClub): Promise<Club>
  /** Envia uma imagem ao Storage e devolve o endereço público. */
  upload(path: string, blob: Blob): Promise<string>
  removeMedia(urls: (string | null | undefined)[]): Promise<void>
  opportunities(memberId?: string): Promise<Opportunity[]>
  saveOpportunity(input: OpportunityInput): Promise<Opportunity>
  deleteOpportunity(id: string): Promise<void>
  controls(): Promise<Controls[]>
  controlsFor(memberId: string): Promise<Controls>
  saveControls(memberId: string, patch: ControlsPatch): Promise<Controls>
  submissions(): Promise<StaffSubmission[]>
  submission(id: string): Promise<StaffSubmission | null>
  updateSubmission(id: string, patch: SubmissionPatch): Promise<StaffSubmission>
  /** A partida foi publicada: os envios ligados a ela viram "analisado". */
  markAnalyzed(matchId: string): Promise<void>
  context(memberId: string): Promise<MemberContext | null>
  saveContext(memberId: string, patch: ContextPatch): Promise<MemberContext>
  conflicts(memberId?: string): Promise<Conflict[]>
  resolveConflict(id: string, accept: boolean, value?: string): Promise<void>
  crmHealth(): Promise<CrmHealth | null>
}

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>

function check(error: { code?: string; message?: string } | null) {
  if (!error) return
  if (isMissing(error)) throw new ScoutSetupMissingError()
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    throw new Error("O seu acesso não permite esta ação.")
  }
  throw new Error(error.message || "Erro ao acessar o banco de dados.")
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null)

const clubOf = (r: Row): Club => ({ ...(toClub(r) as ClubRef), active: r.active !== false })

const clubRow = (c: ClubInput) => ({
  name: c.name.trim(),
  country: c.country?.trim() || null,
  league: c.league?.trim() || null,
  crest_url: c.crestUrl,
  emblem: c.emblem?.trim() || null,
  color: c.color && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color.toLowerCase() : null,
})

export const toOpp = (r: Row): Opportunity => ({
  id: r.id as string,
  memberId: r.member_id as string,
  clubId: r.club_id as string,
  club: r.club && typeof r.club === "object" ? clubOf(r.club as Row) : null,
  compatibility: Number(r.compatibility) || 0,
  deadline: str(r.deadline)?.slice(0, 10) ?? null,
  status: (r.status as OpportunityStatus) ?? "aberta",
  published: r.published === true,
  publishedAt: str(r.published_at),
  athleteNote: str(r.athlete_note),
  internalNote: str(r.internal_note),
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})

const prevOf = (v: unknown): PhotoVersion | null => {
  if (!v || typeof v !== "object") return null
  const r = v as Row
  const url = str(r.url)
  return url ? { url, smallUrl: str(r.small_url), style: r.style === "recorte" ? "recorte" : "moldura" } : null
}

export const toControls = (r: Row): Controls => ({
  memberId: r.member_id as string,
  locks: toLocks(r.locks),
  bodyPhotoUrl: str(r.body_photo_url),
  bodyPhotoSmallUrl: str(r.body_photo_small_url),
  bodyPhotoOn: r.body_photo_on === true,
  bodyPhotoStyle: r.body_photo_style === "recorte" ? "recorte" : "moldura",
  bodyPhotoPrev: prevOf(r.body_photo_prev),
  kitClubId: str(r.kit_club_id),
  shortlistedAt: str(r.shortlisted_at),
  scoutId: str(r.scout_id),
  updatedAt: str(r.updated_at),
})

const controlsRow = (p: ControlsPatch) => {
  const out: Row = {}
  if (p.locks !== undefined) out.locks = p.locks
  if (p.bodyPhotoUrl !== undefined) out.body_photo_url = p.bodyPhotoUrl
  if (p.bodyPhotoSmallUrl !== undefined) out.body_photo_small_url = p.bodyPhotoSmallUrl
  if (p.bodyPhotoOn !== undefined) out.body_photo_on = p.bodyPhotoOn
  if (p.bodyPhotoStyle !== undefined) out.body_photo_style = p.bodyPhotoStyle
  if (p.bodyPhotoPrev !== undefined) out.body_photo_prev = p.bodyPhotoPrev ? { url: p.bodyPhotoPrev.url, small_url: p.bodyPhotoPrev.smallUrl, style: p.bodyPhotoPrev.style } : null
  if (p.kitClubId !== undefined) out.kit_club_id = p.kitClubId
  if (p.shortlistedAt !== undefined) out.shortlisted_at = p.shortlistedAt
  if (p.scoutId !== undefined) out.scout_id = p.scoutId
  return out
}

const toStaffSubmission = (r: Row): StaffSubmission | null => {
  const s = toSubmission(r)
  return s ? { ...s, userId: r.user_id as string, memberId: str(r.member_id), updatedAt: (r.updated_at as string) ?? s.createdAt } : null
}

const answersOf = (v: unknown): Answer[] =>
  Array.isArray(v)
    ? v.map((a) => (a && typeof a === "object" ? { question: String((a as Row).question ?? ""), answer: String((a as Row).answer ?? "") } : null))
      .filter((a): a is Answer => Boolean(a && a.question && a.answer))
    : []

export const toContext = (r: Row): MemberContext => ({
  memberId: r.member_id as string,
  currentClub: str(r.current_club),
  pastClubs: str(r.past_clubs),
  trials: str(r.trials),
  opportunitiesReceived: str(r.opportunities_received),
  goal: str(r.goal),
  blocker: str(r.blocker),
  filledBy: r.filled_by === "atleta" || r.filled_by === "responsavel" ? r.filled_by : null,
  answers: answersOf(r.answers),
  source: r.source === "crm" ? "crm" : "equipe",
  importedAt: str(r.imported_at),
  updatedAt: str(r.updated_at),
})

const contextRow = (p: ContextPatch) => {
  const out: Row = {}
  const t = (v: string | null | undefined, n: number) => (v ?? "").trim().slice(0, n) || null
  if (p.currentClub !== undefined) out.current_club = t(p.currentClub, 120)
  if (p.pastClubs !== undefined) out.past_clubs = t(p.pastClubs, 2000)
  if (p.trials !== undefined) out.trials = t(p.trials, 2000)
  if (p.opportunitiesReceived !== undefined) out.opportunities_received = t(p.opportunitiesReceived, 2000)
  if (p.goal !== undefined) out.goal = t(p.goal, 2000)
  if (p.blocker !== undefined) out.blocker = t(p.blocker, 2000)
  if (p.filledBy !== undefined) out.filled_by = p.filledBy
  return out
}

export const toConflict = (r: Row): Conflict => ({
  id: r.id as string,
  memberId: r.member_id as string,
  field: r.field as ConflictField,
  kind: r.kind === "revisar" ? "revisar" : "divergente",
  currentValue: str(r.current_value),
  proposedValue: str(r.proposed_value),
  rawValue: str(r.raw_value),
  createdAt: r.created_at as string,
})

/** Caminho do arquivo dentro do bucket, a partir do endereço público. */
export const mediaPath = (url: string) => {
  const i = url.indexOf(`/object/public/${BUCKET}/`)
  return i >= 0 ? decodeURIComponent(url.slice(i + `/object/public/${BUCKET}/`.length)) : null
}

const supabaseScout: ScoutApi = {
  demo: false,

  async clubs() {
    const { data, error } = await db.from("zyron_clubs").select("*").order("name")
    check(error)
    return (data ?? []).map(clubOf)
  },

  async saveClub(input) {
    const row = clubRow(input)
    const res = input.id
      ? await db.from("zyron_clubs").update(row).eq("id", input.id).select("*").single()
      : await db.from("zyron_clubs").insert(row).select("*").single()
    check(res.error)
    return clubOf(res.data)
  },

  async clubFromCatalog(c) {
    const found = await db.from("zyron_clubs").select("*").eq("catalog_id", c.id).maybeSingle()
    check(found.error)
    if (found.data) return clubOf(found.data)
    const res = await db.from("zyron_clubs")
      .insert({ name: c.name, country: c.country, league: c.league, emblem: c.logo.slice(0, 16), catalog_id: c.id })
      .select("*").single()
    // Outra pessoa criou o mesmo clube no mesmo instante: usa o dela.
    if (res.error?.code === "23505") {
      const again = await db.from("zyron_clubs").select("*").eq("catalog_id", c.id).single()
      check(again.error)
      return clubOf(again.data)
    }
    check(res.error)
    return clubOf(res.data)
  },

  async upload(path, blob) {
    const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false })
    if (error) {
      if (/bucket not found/i.test(error.message)) throw new ScoutSetupMissingError()
      throw new Error(/row-level security|unauthorized|403/i.test(error.message) ? "O seu acesso não permite enviar imagens." : error.message)
    }
    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  },

  async removeMedia(urls) {
    const paths = urls.filter((u): u is string => Boolean(u)).map(mediaPath).filter((p): p is string => Boolean(p))
    if (paths.length) await db.storage.from(BUCKET).remove(paths)
  },

  async opportunities(memberId) {
    let q = db.from("zyron_opportunities").select("*, club:zyron_clubs(*)").order("created_at", { ascending: false })
    if (memberId) q = q.eq("member_id", memberId)
    const { data, error } = await q
    check(error)
    return (data ?? []).map(toOpp)
  },

  async saveOpportunity(input) {
    const row = {
      member_id: input.memberId,
      club_id: input.clubId,
      compatibility: Math.max(0, Math.min(100, Math.round(input.compatibility))),
      deadline: input.deadline || null,
      status: input.status,
      published: input.published,
      athlete_note: input.athleteNote?.trim().slice(0, 600) || null,
      internal_note: input.internalNote?.trim().slice(0, 2000) || null,
    }
    const res = input.id
      ? await db.from("zyron_opportunities").update(row).eq("id", input.id).select("*, club:zyron_clubs(*)").single()
      : await db.from("zyron_opportunities").insert(row).select("*, club:zyron_clubs(*)").single()
    if (res.error?.code === "23505") throw new Error("Este jogador já tem uma oportunidade aberta neste clube.")
    check(res.error)
    return toOpp(res.data)
  },

  async deleteOpportunity(id) {
    const { error } = await db.from("zyron_opportunities").delete().eq("id", id)
    check(error)
  },

  async controls() {
    const { data, error } = await db.from("zyron_player_controls").select("*")
    check(error)
    return (data ?? []).map(toControls)
  },

  async controlsFor(memberId) {
    const { data, error } = await db.from("zyron_player_controls").select("*").eq("member_id", memberId).maybeSingle()
    check(error)
    return data ? toControls(data) : emptyControls(memberId)
  },

  async saveControls(memberId, patch) {
    const { data, error } = await db.from("zyron_player_controls")
      .upsert({ member_id: memberId, ...controlsRow(patch) }, { onConflict: "member_id" })
      .select("*").single()
    check(error)
    return toControls(data)
  },

  async submissions() {
    const { data, error } = await db.from("zyron_match_submissions").select("*").order("created_at", { ascending: false }).limit(500)
    check(error)
    return (data ?? []).map(toStaffSubmission).filter((s): s is StaffSubmission => s !== null)
  },

  async submission(id) {
    const { data, error } = await db.from("zyron_match_submissions").select("*").eq("id", id).maybeSingle()
    check(error)
    return data ? toStaffSubmission(data) : null
  },

  async updateSubmission(id, patch) {
    const { data: auth } = await supabase.auth.getUser()
    const row: Row = { reviewed_by: auth.user?.id ?? null }
    if (patch.status !== undefined) row.status = patch.status
    if (patch.reviewNote !== undefined) row.review_note = patch.reviewNote?.trim().slice(0, 500) || null
    if (patch.matchId !== undefined) row.match_id = patch.matchId
    if (patch.memberId !== undefined) row.member_id = patch.memberId
    const { data, error } = await db.from("zyron_match_submissions").update(row).eq("id", id).select("*").single()
    check(error)
    const s = toStaffSubmission(data)
    if (!s) throw new Error("Envio inválido.")
    return s
  },

  async markAnalyzed(matchId) {
    const { error } = await db.from("zyron_match_submissions").update({ status: "analisado" }).eq("match_id", matchId).neq("status", "recusado")
    if (error && !isMissing(error)) check(error)
  },

  async context(memberId) {
    const { data, error } = await db.from("zyron_member_context").select("*").eq("member_id", memberId).maybeSingle()
    check(error)
    return data ? toContext(data) : null
  },

  async saveContext(memberId, patch) {
    // Editado pela equipe: a ponte do CRM não sobrescreve mais os textos.
    const { data, error } = await db.from("zyron_member_context")
      .upsert({ member_id: memberId, ...contextRow(patch), source: "equipe" }, { onConflict: "member_id" })
      .select("*").single()
    check(error)
    return toContext(data)
  },

  async conflicts(memberId) {
    let q = db.from("zyron_crm_conflicts").select("*").eq("status", "aberto").order("created_at", { ascending: false })
    if (memberId) q = q.eq("member_id", memberId)
    const { data, error } = await q
    check(error)
    return (data ?? []).map(toConflict)
  },

  async resolveConflict(id, accept, value) {
    const { error } = await db.rpc("zyron_resolve_crm_conflict", { p_id: id, p_accept: accept, p_value: value ?? null })
    check(error)
  },

  async crmHealth() {
    const { data, error } = await db.rpc("crm_context_health")
    if (error) return null
    const d = (data ?? {}) as Row
    return {
      recebidos: Number(d.recebidos) || 0,
      aplicados: Number(d.aplicados) || 0,
      esperando: Number(d.esperando) || 0,
      quarentena: Number(d.quarentena) || 0,
      conflitos: Number(d.conflitos) || 0,
      comContexto: Number(d.com_contexto) || 0,
      ultimo: str(d.ultimo),
    }
  },
}

/**
 * A fonte dos dados. A condição fica escrita por extenso de propósito: só assim o build de
 * produção a resolve como falsa e descarta o import dos dados de teste.
 */
export async function getScoutApi(demo: boolean): Promise<ScoutApi> {
  if (import.meta.env.DEV && demo) return (await import("./demo")).demoScout
  return supabaseScout
}

/** A fonte pronta para usar (null no primeiro instante). */
export function useScoutApi(demo: boolean) {
  const [api, setApi] = useState<ScoutApi | null>(null)
  useEffect(() => {
    let cancelled = false
    void getScoutApi(demo).then((a) => { if (!cancelled) setApi(a) })
    return () => { cancelled = true }
  }, [demo])
  return api
}

export type Loaded<T> = { data: T | null; error: Error | null; loading: boolean; reload: () => void; set: (fn: (d: T | null) => T | null) => void }

/** Busca com a fonte pronta; `reload` busca de novo sem apagar o que está na tela. */
export function useLoad<T>(api: ScoutApi | null, fn: (a: ScoutApi) => Promise<T>, deps: unknown[]): Loaded<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!api) return
    let cancelled = false
    setLoading(true)
    fn(api)
      .then((d) => { if (!cancelled) { setData(d); setError(null) } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // `fn` muda a cada render; quem chama decide quando buscar de novo pelas `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, tick, ...deps])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload, set: setData }
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
