/**
 * Acesso a dados da área de membros e da gestão na VOXEN. Uma interface só
 * (DataSource), servida pelo Supabase — ou, no `npm run dev` com ?demo,
 * por dados de teste em memória (fixtures.ts, que não entra no build).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { isAction, type Bundle, type Match, type MatchEvent, type Member, type MemberKind } from "./model"
import type { AthleteAccount } from "./account"

// Tabelas novas ainda não estão nos tipos gerados do Supabase.
const db = supabase as unknown as SupabaseClient

/** As tabelas da área de membros ainda não existem (migração não aplicada). */
export class SetupMissingError extends Error {
  constructor() {
    super("A área de membros ainda não foi ativada no banco de dados.")
    this.name = "SetupMissingError"
  }
}

export type SelfResult =
  | { status: "ok"; bundle: Bundle; references: Member[] }
  | { status: "sem-acesso" }

export type ProfileListItem = Member & { matchCount: number; publishedCount: number; lastMatch: string | null }

export type MemberInput = Partial<Omit<Member, "id" | "createdAt" | "updatedAt" | "userId" | "extended" | "crmSyncedAt">> & {
  id?: string
  kind: MemberKind
  fullName: string
  /** Só ao criar: guarda a data em que a pessoa entrou (ex.: a data do cadastro no funil) em vez de "agora". */
  createdAt?: string
}
export type MatchInput = Omit<Match, "id" | "createdAt" | "updatedAt"> & { id?: string }
export type EventInput = Omit<MatchEvent, "id">

export interface DataSource {
  readonly preview: boolean
  /** Perfil do membro logado (ou de `asMemberId`, para o admin ver como o membro). */
  loadSelf(asMemberId?: string): Promise<SelfResult>
  /** Perfil + partidas + ações; `publishedOnly` mostra só o que o membro vê. */
  getBundle(id: string, publishedOnly: boolean): Promise<Bundle | null>
  listProfiles(): Promise<ProfileListItem[]>
  findByLead(leadId: string): Promise<Member | null>
  /** Cadastro de membro ligado a uma conta (o admin vendo um atleta como ele vê). */
  findByUser(userId: string): Promise<Member | null>
  saveMember(input: MemberInput): Promise<Member>
  /** Exclui o perfil e, em cascata, as partidas e os lances dele. */
  deleteMember(id: string): Promise<void>
  saveMatch(input: MatchInput): Promise<Match>
  deleteMatch(id: string): Promise<void>
  addEvent(input: EventInput): Promise<MatchEvent>
  deleteEvent(id: string): Promise<void>
}

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>

function check(error: { code?: string; message?: string } | null) {
  if (!error) return
  if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202" || /does not exist|could not find the (table|function)/i.test(error.message ?? "")) {
    throw new SetupMissingError()
  }
  throw new Error(error.message || "Erro ao acessar o banco de dados.")
}

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v))
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null)

export const toMember = (r: Row): Member => ({
  id: r.id as string,
  kind: r.kind === "referencia" ? "referencia" : "membro",
  userId: str(r.user_id),
  email: str(r.email),
  fullName: (r.full_name as string) ?? "",
  birthDate: str(r.birth_date),
  position: str(r.position),
  category: str(r.category),
  foot: str(r.preferred_foot),
  heightCm: num(r.height_cm),
  weightKg: num(r.weight_kg),
  city: str(r.city),
  team: str(r.team),
  photoUrl: str(r.photo_url),
  bio: str(r.bio),
  scout: r.scout && typeof r.scout === "object" ? (r.scout as Record<string, number>) : null,
  leadId: str(r.lead_id),
  active: r.active !== false,
  autoSync: r.auto_sync === true,
  phone: typeof r.phone === "string" && /^\d{8,15}$/.test(r.phone) ? r.phone : null,
  nationality: str(r.nationality),
  crmSyncedAt: str(r.crm_synced_at),
  extended: "phone" in r,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})

export const toMatch = (r: Row): Match => ({
  id: r.id as string,
  memberId: r.member_id as string,
  playedOn: r.played_on as string,
  competition: str(r.competition),
  team: (r.team as string) ?? "",
  opponent: (r.opponent as string) ?? "",
  isHome: r.is_home !== false,
  goalsFor: num(r.goals_for),
  goalsAgainst: num(r.goals_against),
  minutes: num(r.minutes),
  position: str(r.position),
  videoUrl: str(r.video_url),
  rating: num(r.rating),
  summary: str(r.summary),
  published: r.published === true,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})

export const toEvent = (r: Row): MatchEvent | null => {
  const action = String(r.action ?? "")
  if (!isAction(action)) return null
  return {
    id: r.id as string,
    matchId: r.match_id as string,
    t: Number(r.t_seconds),
    half: r.half === 1 || r.half === 2 ? r.half : null,
    action,
    success: r.success === null || r.success === undefined ? null : r.success === true,
    x: Number(r.x),
    y: Number(r.y),
    note: str(r.note),
  }
}

const memberRow = (m: MemberInput) => ({
  kind: m.kind,
  email: m.kind === "membro" ? (m.email ?? "").trim().toLowerCase() || null : null,
  full_name: m.fullName.trim(),
  birth_date: m.birthDate || null,
  position: m.position || null,
  category: m.category || null,
  preferred_foot: m.foot || null,
  height_cm: m.heightCm ?? null,
  weight_kg: m.weightKg ?? null,
  city: m.city || null,
  team: m.team || null,
  photo_url: m.photoUrl || null,
  bio: m.bio || null,
  scout: m.scout ?? null,
  lead_id: m.leadId ?? null,
  // Só quando o formulário conhece as colunas novas (banco com a migração da ficha completa).
  ...(m.phone !== undefined ? { phone: (m.phone ?? "").replace(/\D/g, "") || null } : {}),
  ...(m.nationality !== undefined ? { nationality: m.nationality?.trim() || null } : {}),
  active: m.active ?? true,
  updated_at: new Date().toISOString(),
  // Só na criação (sem id): quem edita não mexe na data em que o perfil nasceu.
  ...(m.createdAt && !m.id ? { created_at: m.createdAt } : {}),
})

const matchRow = (m: MatchInput) => ({
  member_id: m.memberId,
  played_on: m.playedOn,
  competition: m.competition || null,
  team: m.team.trim(),
  opponent: m.opponent.trim(),
  is_home: m.isHome,
  goals_for: m.goalsFor,
  goals_against: m.goalsAgainst,
  minutes: m.minutes,
  position: m.position || null,
  video_url: m.videoUrl || null,
  rating: m.rating,
  summary: m.summary || null,
  published: m.published,
  updated_at: new Date().toISOString(),
})

async function eventsFor(matchIds: string[]): Promise<MatchEvent[]> {
  const out: MatchEvent[] = []
  for (let i = 0; i < matchIds.length; i += 80) {
    const { data, error } = await db.from("zyron_match_events").select("*").in("match_id", matchIds.slice(i, i + 80)).order("t_seconds")
    check(error)
    for (const r of data ?? []) {
      const e = toEvent(r)
      if (e) out.push(e)
    }
  }
  return out
}

async function bundleFor(member: Member, publishedOnly: boolean): Promise<Bundle> {
  let q = db.from("zyron_matches").select("*").eq("member_id", member.id).order("played_on", { ascending: false })
  if (publishedOnly) q = q.eq("published", true)
  const { data, error } = await q
  check(error)
  const matches = (data ?? []).map(toMatch)
  return { member, matches, events: await eventsFor(matches.map((m) => m.id)) }
}

async function listReferences(): Promise<Member[]> {
  const { data, error } = await db.from("zyron_members").select("*").eq("kind", "referencia").eq("active", true).order("full_name")
  check(error)
  return (data ?? []).map(toMember)
}

const supabaseSource: DataSource = {
  preview: false,

  async loadSelf(asMemberId) {
    if (asMemberId) {
      const bundle = await supabaseSource.getBundle(asMemberId, true)
      return bundle ? { status: "ok", bundle, references: await listReferences() } : { status: "sem-acesso" }
    }
    const claim = await db.rpc("claim_zyron_membership")
    check(claim.error)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { status: "sem-acesso" }
    const { data, error } = await db.from("zyron_members").select("*").eq("user_id", auth.user.id).eq("kind", "membro").maybeSingle()
    check(error)
    if (!data) return { status: "sem-acesso" }
    const member = toMember(data)
    if (!member.active) return { status: "sem-acesso" }
    return { status: "ok", bundle: await bundleFor(member, true), references: await listReferences() }
  },

  async getBundle(id, publishedOnly) {
    const { data, error } = await db.from("zyron_members").select("*").eq("id", id).maybeSingle()
    check(error)
    return data ? bundleFor(toMember(data), publishedOnly) : null
  },

  async listProfiles() {
    const [members, matches] = await Promise.all([
      db.from("zyron_members").select("*").order("created_at", { ascending: false }),
      db.from("zyron_matches").select("member_id, published, played_on"),
    ])
    check(members.error)
    check(matches.error)
    const counts = new Map<string, { total: number; published: number; last: string | null }>()
    for (const r of matches.data ?? []) {
      const c = counts.get(r.member_id) ?? { total: 0, published: 0, last: null }
      c.total++
      if (r.published) c.published++
      if (!c.last || r.played_on > c.last) c.last = r.played_on
      counts.set(r.member_id, c)
    }
    return (members.data ?? []).map((r) => {
      const m = toMember(r)
      const c = counts.get(m.id)
      return { ...m, matchCount: c?.total ?? 0, publishedCount: c?.published ?? 0, lastMatch: c?.last ?? null }
    })
  },

  async findByLead(leadId) {
    const { data, error } = await db.from("zyron_members").select("*").eq("lead_id", leadId).maybeSingle()
    check(error)
    return data ? toMember(data) : null
  },

  async findByUser(userId) {
    const { data, error } = await db.from("zyron_members").select("*").eq("user_id", userId).eq("kind", "membro").maybeSingle()
    check(error)
    return data ? toMember(data) : null
  },

  async saveMember(input) {
    const row = memberRow(input)
    const res = input.id
      ? await db.from("zyron_members").update(row).eq("id", input.id).select("*").single()
      : await db.from("zyron_members").insert(row).select("*").single()
    if (res.error?.code === "23505") {
      throw new Error(/lead/i.test(res.error.message ?? "") ? "Este lead já foi cadastrado como membro." : "Já existe um membro com este e-mail.")
    }
    check(res.error)
    return toMember(res.data)
  },

  async deleteMember(id) {
    const { error } = await db.from("zyron_members").delete().eq("id", id)
    check(error)
  },

  async saveMatch(input) {
    const row = matchRow(input)
    const res = input.id
      ? await db.from("zyron_matches").update(row).eq("id", input.id).select("*").single()
      : await db.from("zyron_matches").insert(row).select("*").single()
    check(res.error)
    return toMatch(res.data)
  },

  async deleteMatch(id) {
    const { error } = await db.from("zyron_matches").delete().eq("id", id)
    check(error)
  },

  async addEvent(input) {
    const { data, error } = await db.from("zyron_match_events").insert({
      match_id: input.matchId,
      t_seconds: Math.round(input.t * 100) / 100,
      half: input.half,
      action: input.action,
      success: input.success,
      x: Math.round(input.x * 100) / 100,
      y: Math.round(input.y * 100) / 100,
      note: input.note,
    }).select("*").single()
    check(error)
    const e = toEvent(data)
    if (!e) throw new Error("Ação inválida.")
    return e
  },

  async deleteEvent(id) {
    const { error } = await db.from("zyron_match_events").delete().eq("id", id)
    check(error)
  },
}

/** Conta de teste sem acesso à análise de partidas (só no `npm run dev`; some do build). */
export async function getPreviewAccount(kind: "conta" | "novo" = "conta"): Promise<AthleteAccount | null> {
  if (import.meta.env.DEV) {
    const { FIXTURE_ACCOUNT, FIXTURE_NEWCOMER } = await import("./fixtures")
    return kind === "novo" ? FIXTURE_NEWCOMER : FIXTURE_ACCOUNT
  }
  return null
}

/**
 * Fonte de dados. A condição fica escrita por extenso aqui de propósito: só
 * assim o build de produção a resolve como falsa e descarta o import dos
 * dados de teste (uma constante importada de outro módulo não é resolvida).
 */
export async function getSource(preview: boolean): Promise<DataSource> {
  if (import.meta.env.DEV && preview) {
    const { fixtureSource } = await import("./fixtures")
    return fixtureSource
  }
  return supabaseSource
}
