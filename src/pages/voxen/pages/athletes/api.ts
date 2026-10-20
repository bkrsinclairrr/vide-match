import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { useVoxen } from "@/pages/voxen/store"
import type { Player } from "@/pages/voxen/data"
import type { Member } from "@/pages/membros/model"
import { getAccountsApi } from "@/pages/voxen/pages/accounts/api"
import type { Athlete, AthleteDraft, AthletePatch, Temperature } from "./model"

/*
 * Dados do setor Atletas. Uma loja por modo (banco ou dados locais do `npm run dev`),
 * compartilhada entre as telas: Cadastros, Membros e o próprio setor enxergam a mesma
 * lista, e uma mudança feita num lugar aparece nos outros sem recarregar.
 */

const db = supabase as unknown as SupabaseClient

export const ATHLETES_MIGRATION = "supabase/migrations/20261012120000_setor_atletas.sql"
/** Colunas do contrato e a leitura da jornada pelo atleta. */
export const JOURNEY_MIGRATION = "supabase/migrations/20261016000000_jornada_do_atleta.sql"

/** A tabela do setor ainda não existe no banco. */
export class AthletesMissingError extends Error {
  constructor() {
    super("O setor Atletas ainda não foi ativado no banco de dados.")
    this.name = "AthletesMissingError"
  }
}

type DbError = { code?: string; message?: string } | null
const isMissing = (e: DbError) =>
  Boolean(e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|could not find the table/i.test(e.message ?? "")))

/** Coluna do contrato que ainda não existe (a migração da jornada não foi aplicada). */
const contractMissing = (e: DbError) => Boolean(e && /contract_/i.test(e.message ?? "") && (e.code === "42703" || e.code === "PGRST204" || /column|could not find/i.test(e.message ?? "")))

function friendly(e: DbError): Error {
  if (contractMissing(e)) return new Error(`Para marcar contratos, rode ${JOURNEY_MIGRATION} no editor SQL do Supabase.`)
  if (isMissing(e)) return new AthletesMissingError()
  if (e?.code === "23505") return new Error("Este atleta já está no setor (mesmo cadastro, membro ou e-mail).")
  if (e?.code === "42501") return new Error("Você não tem permissão para alterar o setor Atletas.")
  if (e?.code === "23514") return new Error("Algum dado está fora do formato aceito (e-mail, telefone, altura ou peso).")
  return new Error(e?.message || "Não foi possível falar com o banco de dados.")
}

/* ------------------------------------------------------------------ */
/* Linhas do banco                                                     */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>
const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null)
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v))

export function toAthlete(r: Row): Athlete {
  const t = r.temperature
  return {
    id: String(r.id),
    origin: (["funil", "conta", "membro", "manual"].includes(String(r.origin)) ? r.origin : "manual") as Athlete["origin"],
    leadId: str(r.lead_id),
    athleteId: num(r.athlete_id),
    memberId: str(r.member_id),
    fullName: String(r.full_name ?? ""),
    email: str(r.email),
    phone: str(r.phone),
    birthDate: str(r.birth_date),
    age: num(r.age),
    nationality: str(r.nationality),
    position: str(r.position),
    category: str(r.category),
    foot: str(r.preferred_foot),
    heightCm: num(r.height_cm),
    weightKg: num(r.weight_kg),
    city: str(r.city),
    team: str(r.team),
    temperature: (t === "frio" || t === "quente" ? t : "morno") as Temperature,
    forwarded: r.forwarded === true,
    forwardedTo: str(r.forwarded_to),
    forwardedOn: str(r.forwarded_on),
    advisory: r.advisory === true,
    advisorySince: str(r.advisory_since),
    contractSigned: r.contract_signed === true,
    contractClub: str(r.contract_club),
    contractOn: str(r.contract_on),
    contractReady: "contract_signed" in r,
    nextStep: str(r.next_step),
    nextStepOn: str(r.next_step_on),
    notes: str(r.notes),
    sourceCreatedAt: str(r.source_created_at),
    createdAt: String(r.created_at ?? new Date().toISOString()),
    updatedAt: String(r.updated_at ?? r.created_at ?? new Date().toISOString()),
  }
}

const COLUMN: Record<keyof AthletePatch, string> = {
  origin: "origin", leadId: "lead_id", athleteId: "athlete_id", memberId: "member_id", fullName: "full_name", email: "email",
  phone: "phone", birthDate: "birth_date", age: "age", nationality: "nationality", position: "position", category: "category",
  foot: "preferred_foot", heightCm: "height_cm", weightKg: "weight_kg", city: "city", team: "team", temperature: "temperature",
  forwarded: "forwarded", forwardedTo: "forwarded_to", forwardedOn: "forwarded_on", advisory: "advisory", advisorySince: "advisory_since",
  contractSigned: "contract_signed", contractClub: "contract_club", contractOn: "contract_on",
  nextStep: "next_step", nextStepOn: "next_step_on", notes: "notes", sourceCreatedAt: "source_created_at",
}

export function toRow(p: AthletePatch): Row {
  const out: Row = {}
  for (const [k, v] of Object.entries(p)) {
    const col = COLUMN[k as keyof AthletePatch]
    if (!col || v === undefined) continue
    out[col] = typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Fonte: banco ou dados locais                                        */
/* ------------------------------------------------------------------ */

export interface AthletesApi {
  list(): Promise<Athlete[]>
  insert(draft: AthleteDraft): Promise<Athlete>
  update(id: string, patch: AthletePatch): Promise<Athlete>
  remove(id: string): Promise<void>
}

const live: AthletesApi = {
  async list() {
    const { data, error } = await db.from("zyron_athletes").select("*").order("created_at", { ascending: false })
    if (error) throw friendly(error)
    return (data ?? []).map(toAthlete)
  },
  async insert(draft) {
    const { data, error } = await db.from("zyron_athletes").insert(toRow({ ...draft, temperature: draft.temperature ?? "morno" })).select("*").single()
    if (error) throw friendly(error)
    return toAthlete(data)
  },
  async update(id, patch) {
    const { data, error } = await db.from("zyron_athletes").update(toRow(patch)).eq("id", id).select("*").single()
    if (error) throw friendly(error)
    return toAthlete(data)
  },
  async remove(id) {
    const { error } = await db.from("zyron_athletes").delete().eq("id", id)
    if (error) throw friendly(error)
  },
}

async function apiFor(demo: boolean, players: Player[]): Promise<AthletesApi> {
  // Dados locais só existem no `npm run dev` (?demo); no build de produção a condição é falsa.
  if (import.meta.env.DEV && demo) return (await import("./demo")).demoApi(players)
  return live
}

/* ------------------------------------------------------------------ */
/* Loja compartilhada                                                  */
/* ------------------------------------------------------------------ */

type Snapshot = { list: Athlete[] | null; error: Error | null; loading: boolean; loadedAt: number }

class AthleteStore {
  snap: Snapshot = { list: null, error: null, loading: false, loadedAt: 0 }
  private listeners = new Set<() => void>()
  private api: Promise<AthletesApi> | null = null
  constructor(private demo: boolean) {}

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  get = () => this.snap
  private set(next: Partial<Snapshot>) { this.snap = { ...this.snap, ...next }; this.listeners.forEach((fn) => fn()) }
  apiOf(players: Player[]) { return (this.api ??= apiFor(this.demo, players)) }

  async load(players: Player[]) {
    if (this.snap.loading) return
    this.set({ loading: true })
    try {
      const list = await (await this.apiOf(players)).list()
      this.set({ list, error: null, loading: false, loadedAt: Date.now() })
    } catch (e) {
      this.set({ error: e instanceof Error ? e : new Error(String(e)), loading: false, loadedAt: Date.now() })
    }
  }

  put(a: Athlete) {
    const list = this.snap.list ?? []
    this.set({ list: list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [a, ...list] })
  }
  drop(id: string) { this.set({ list: (this.snap.list ?? []).filter((x) => x.id !== id) }) }
}

const stores = new Map<boolean, AthleteStore>()
const storeFor = (demo: boolean) => {
  let s = stores.get(demo)
  if (!s) { s = new AthleteStore(demo); stores.set(demo, s) }
  return s
}

export type ForwardResult = { added: Athlete[]; existing: Athlete[]; failed: { name: string; why: string }[] }

const lower = (s: string | null | undefined) => (s ?? "").trim().toLowerCase()

/**
 * Setor Atletas para qualquer tela. `fresh`: recarrega ao abrir (a página do setor usa;
 * Cadastros e Membros aproveitam a lista se ela tiver menos de um minuto).
 */
export function useAthletes({ fresh = false }: { fresh?: boolean } = {}) {
  const { demo, players, canScout: canEdit, canAdmin: canRemove } = useVoxen()
  const store = storeFor(demo)
  const snap = useSyncExternalStore(store.subscribe, store.get)

  useEffect(() => {
    const s = store.get()
    if (fresh || !s.loadedAt || Date.now() - s.loadedAt > 60_000) void store.load(players)
    // Só ao abrir a tela: `players` muda a cada recarga da base e não deve disparar outra busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, fresh])

  const index = useMemo(() => {
    const byLead = new Map<string, Athlete>()
    const byAthlete = new Map<number, Athlete>()
    const byMember = new Map<string, Athlete>()
    const byEmail = new Map<string, Athlete>()
    for (const a of snap.list ?? []) {
      if (a.leadId) byLead.set(a.leadId, a)
      if (a.athleteId !== null) byAthlete.set(a.athleteId, a)
      if (a.memberId) byMember.set(a.memberId, a)
      if (a.email) byEmail.set(lower(a.email), a)
    }
    return { byLead, byAthlete, byMember, byEmail }
  }, [snap.list])

  /** Ficha de um cadastro (lead ou conta), se ele já estiver no setor. */
  const forPlayer = useCallback((p: Player) => {
    const hit = p.key.startsWith("lead:") ? index.byLead.get(p.key.slice(5)) : p.key.startsWith("atleta:") ? index.byAthlete.get(Number(p.key.slice(7))) : undefined
    return hit ?? (p.email ? index.byEmail.get(lower(p.email)) : undefined) ?? null
  }, [index])

  /** Ficha de um membro, se ele (ou o lead dele) já estiver no setor. */
  const forMember = useCallback((m: Pick<Member, "id" | "leadId" | "email">) =>
    index.byMember.get(m.id) ?? (m.leadId ? index.byLead.get(m.leadId) : undefined) ?? (m.email ? index.byEmail.get(lower(m.email)) : undefined) ?? null, [index])

  const findDraft = useCallback((d: AthleteDraft) =>
    (d.memberId && index.byMember.get(d.memberId)) || (d.leadId && index.byLead.get(d.leadId)) || (d.athleteId !== null && index.byAthlete.get(d.athleteId))
    || (d.email && index.byEmail.get(lower(d.email))) || null, [index])

  const guard = () => { if (!canEdit) throw new Error("O seu acesso é só de leitura.") }

  /**
   * Leva vários atletas para o setor. Quem já está lá não é duplicado: a ficha existente
   * só ganha o vínculo que faltava (por exemplo, o membro de um lead que já estava).
   */
  const forward = useCallback(async (drafts: AthleteDraft[]): Promise<ForwardResult> => {
    guard()
    const api = await store.apiOf(players)
    const result: ForwardResult = { added: [], existing: [], failed: [] }
    const seen = new Set<string>()
    for (const d of drafts) {
      const current = findDraft(d) || [...result.added, ...result.existing].find((a) =>
        (d.memberId && a.memberId === d.memberId) || (d.leadId && a.leadId === d.leadId) || (d.athleteId !== null && a.athleteId === d.athleteId) || (d.email && lower(a.email) === d.email))
      try {
        if (current) {
          if (seen.has(current.id)) continue
          seen.add(current.id)
          const links: AthletePatch = {}
          if (!current.leadId && d.leadId) links.leadId = d.leadId
          if (current.athleteId === null && d.athleteId !== null) links.athleteId = d.athleteId
          if (!current.memberId && d.memberId) links.memberId = d.memberId
          if (!current.email && d.email && !index.byEmail.has(d.email)) links.email = d.email
          const saved = Object.keys(links).length ? await api.update(current.id, links) : current
          store.put(saved)
          result.existing.push(saved)
        } else {
          const saved = await api.insert(d)
          seen.add(saved.id)
          store.put(saved)
          result.added.push(saved)
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        if (err instanceof AthletesMissingError) throw err
        result.failed.push({ name: d.fullName, why: err.message })
      }
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, players, findDraft, index, canEdit])

  /** Muda a ficha na hora (otimista) e grava; se o banco recusar, volta ao que era. */
  const update = useCallback(async (id: string, patch: AthletePatch) => {
    guard()
    const before = store.get().list?.find((a) => a.id === id)
    if (!before) return
    store.put({ ...before, ...patch, updatedAt: new Date().toISOString() })
    try {
      store.put(await (await store.apiOf(players)).update(id, patch))
    } catch (e) {
      const now = store.get().list?.find((a) => a.id === id)
      if (now) store.put({ ...now, ...Object.fromEntries(Object.keys(patch).map((k) => [k, before[k as keyof Athlete]])) })
      throw e
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, players, canEdit])

  const create = useCallback(async (draft: AthleteDraft) => {
    guard()
    const saved = await (await store.apiOf(players)).insert(draft)
    store.put(saved)
    return saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, players, canEdit])

  const remove = useCallback(async (id: string) => {
    if (!canRemove) throw new Error("Só um administrador pode tirar alguém do setor.")
    await (await store.apiOf(players)).remove(id)
    store.drop(id)
  }, [store, players, canRemove])

  const reload = useCallback(() => store.load(players), [store, players])

  return {
    list: snap.list,
    error: snap.error,
    missing: snap.error instanceof AthletesMissingError,
    loading: snap.loading,
    canEdit,
    /** Tirar do setor apaga a ficha: só o administrador. */
    canRemove,
    reload,
    forPlayer,
    forMember,
    forward,
    update,
    create,
    remove,
  }
}

export type AthletesHook = ReturnType<typeof useAthletes>

/**
 * E-mail das contas de atleta: só a lista de contas (função admin-users) conhece.
 * Se ela não responder, as contas seguem sem e-mail.
 */
export async function accountEmails(demo: boolean, players: Player[]) {
  if (!players.some((p) => p.source === "conta" && p.userId)) return new Map<string, string>()
  try {
    const list = (await (await getAccountsApi(demo)).list()).users
    return new Map(list.filter((a) => a.email).map((a) => [a.id, a.email as string]))
  } catch {
    return new Map<string, string>()
  }
}
