/**
 * Dados da seção Importados: a lista do que veio do CRM, as subseções ("de onde veio") e a aprovação em levas.
 * A equipe lê tudo; quem mantém jogador (Scout, executivo, admin) cria subseções, move e aprova; excluir
 * subseção é só do administrador. O banco é quem garante (RLS e funções). Migração:
 * 20261023100000_importados_subsecoes_e_aprovacao. No `npm run dev` com ?demo, dados locais (demo.ts).
 */
import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import {
  ScoutSetupMissingError, answersOf, check, notesOf, qualificationOf, str,
  type Answer, type ContextNote, type Qualification,
} from "../scout/api"
import { KINDS, MAX_BATCH, rowKey, type ImportItem, type ImportKind, type ImportRow, type ImportSection } from "./model"

const db = supabase as unknown as SupabaseClient

export const IMPORTED_MIGRATIONS = ["supabase/migrations/20261023100000_importados_subsecoes_e_aprovacao.sql"]

/** O diagnóstico da lista de pendências (um texto que a ponte não entendeu, ou uma diferença com a ficha). */
export type ReviewItem = {
  field: string
  raw: string
  kind: "divergente" | "revisar" | null
  current: string | null
  proposed: string | null
}

/** Um importado por inteiro, no mesmo formato para os três tipos. Só a equipe lê. */
export type ImportDetail = {
  kind: ImportKind
  ref: string
  name: string | null
  guardianName: string | null
  guardianFilledBy: string | null
  filledBy: "atleta" | "responsavel" | null
  birthDate: string | null
  position: string | null
  category: string | null
  team: string | null
  city: string | null
  review: ReviewItem[]
  currentClub: string | null
  pastClubs: string | null
  trials: string | null
  opportunitiesReceived: string | null
  goal: string | null
  blocker: string | null
  evaluatedClubs: string | null
  strengthsAndImprovements: string | null
  commitmentScore: string | null
  crmObservations: string | null
  qualification: Qualification | null
  notes: ContextNote[]
  answers: Answer[]
  revision: number
  firstAt: string | null
  updatedAt: string | null
  memberId: string | null
}

export type SectionInput = { id?: string; name: string; note: string | null; color: string }

export interface ImportedApi {
  readonly demo: boolean
  list(): Promise<ImportRow[]>
  detail(kind: ImportKind, ref: string): Promise<ImportDetail | null>
  sections(): Promise<ImportSection[]>
  saveSection(input: SectionInput): Promise<ImportSection>
  /** Só o administrador. As pessoas da subseção voltam para "sem subseção"; ninguém é apagado. */
  deleteSection(id: string): Promise<void>
  /** Move uma leva para a subseção (null = tira da subseção). Devolve quantos mudaram. */
  setSection(items: ImportItem[], sectionId: string | null): Promise<number>
  /** Aprova (ou tira a aprovação de) uma leva. Devolve quantos mudaram. */
  approve(items: ImportItem[], approve: boolean): Promise<number>
  /** Quantos esperam conferência (para o menu). */
  pending(): Promise<number>
  /** Só o administrador: descarta um pré-cadastro (apaga o texto e as próximas versões do CRM não o recriam). */
  discardProspect(ref: string): Promise<void>
}

type Row = Record<string, unknown>

const kindOf = (v: unknown): ImportKind | null => (typeof v === "string" && (KINDS as string[]).includes(v) ? (v as ImportKind) : null)
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || fallback)

export function toRow(r: Row): ImportRow | null {
  const kind = kindOf(r.kind)
  const ref = typeof r.ref === "string" ? r.ref : null
  if (!kind || !ref) return null
  return {
    key: rowKey(kind, ref), kind, ref,
    name: str(r.name), guardianName: str(r.guardian_name), position: str(r.player_position), category: str(r.category), city: str(r.city),
    answersCount: num(r.answers_count), notesCount: num(r.notes_count), hasContext: r.has_context === true, reviewCount: num(r.review_count),
    revision: num(r.revision, 1), firstAt: str(r.first_at), updatedAt: str(r.updated_at), memberId: str(r.member_id),
    sectionId: str(r.section_id), approvedAt: str(r.approved_at), approvedByName: str(r.approved_by_name),
    approvedRevision: r.approved_revision === null || r.approved_revision === undefined ? null : num(r.approved_revision, 1),
  }
}

const reviewOf = (v: unknown): ReviewItem[] =>
  Array.isArray(v)
    ? v.map((x): ReviewItem | null => {
        const r = x as Row | null
        if (!r || typeof r.field !== "string") return null
        return {
          field: r.field, raw: typeof r.raw === "string" ? r.raw : "",
          kind: r.kind === "divergente" || r.kind === "revisar" ? r.kind : null,
          current: str(r.current), proposed: str(r.proposed),
        }
      }).filter((x): x is ReviewItem => x !== null)
    : []

export function toDetail(r: Row): ImportDetail | null {
  const kind = kindOf(r.kind)
  const ref = typeof r.ref === "string" ? r.ref : null
  if (!kind || !ref) return null
  return {
    kind, ref, name: str(r.name), guardianName: str(r.guardian_name), guardianFilledBy: str(r.guardian_filled_by_raw),
    filledBy: r.filled_by === "atleta" || r.filled_by === "responsavel" ? r.filled_by : null,
    birthDate: str(r.birth_date)?.slice(0, 10) ?? null, position: str(r.position), category: str(r.category), team: str(r.team), city: str(r.city),
    review: reviewOf(r.review), currentClub: str(r.current_club), pastClubs: str(r.past_clubs), trials: str(r.trials),
    opportunitiesReceived: str(r.opportunities_received), goal: str(r.goal), blocker: str(r.blocker), evaluatedClubs: str(r.evaluated_clubs),
    strengthsAndImprovements: str(r.strengths_and_improvements), commitmentScore: str(r.commitment_score), crmObservations: str(r.crm_observations),
    qualification: qualificationOf(r.crm_qualification), notes: notesOf(r.notes), answers: answersOf(r.answers),
    revision: num(r.revision, 1), firstAt: str(r.first_at), updatedAt: str(r.updated_at), memberId: str(r.member_id),
  }
}

const toSection = (r: Row): ImportSection => ({
  id: r.id as string, name: String(r.name ?? ""), note: str(r.note), color: typeof r.color === "string" ? r.color : "#fbbf24", createdAt: String(r.created_at ?? ""),
})

/** Erros de gravação das subseções, em português claro. */
function sectionError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") throw new Error("Já existe uma subseção com este nome.")
  if (error.code === "23514") throw new Error("Use um nome de 2 a 60 letras, uma cor válida e uma nota de até 300 letras.")
  check(error)
  throw new Error(error.message || "Não foi possível salvar a subseção.")
}

const chunks = <T,>(list: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

const supabaseImported: ImportedApi = {
  demo: false,

  async list() {
    const { data, error } = await db.rpc("zyron_imported_list")
    check(error)
    return ((data ?? []) as Row[]).map(toRow).filter((r): r is ImportRow => r !== null)
  },

  async detail(kind, ref) {
    const { data, error } = await db.rpc("zyron_imported_detail", { p_kind: kind, p_ref: ref })
    check(error)
    return data && typeof data === "object" ? toDetail(data as Row) : null
  },

  async sections() {
    const { data, error } = await db.from("zyron_import_sections").select("*").order("name")
    check(error)
    return ((data ?? []) as Row[]).map(toSection)
  },

  async saveSection(input) {
    const row = {
      name: input.name.trim(),
      note: input.note?.trim().slice(0, 300) || null,
      color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color.toLowerCase() : "#fbbf24",
    }
    const res = input.id
      ? await db.from("zyron_import_sections").update(row).eq("id", input.id).select("*").single()
      : await db.from("zyron_import_sections").insert(row).select("*").single()
    if (res.error) sectionError(res.error)
    return toSection(res.data as Row)
  },

  async deleteSection(id) {
    const { data, error } = await db.from("zyron_import_sections").delete().eq("id", id).select("id")
    check(error)
    // A regra de acesso não dá erro para quem não pode excluir: simplesmente nada é excluído.
    if (!data || data.length === 0) throw new Error("Só o administrador exclui subseções.")
  },

  async setSection(items, sectionId) {
    let changed = 0
    for (const part of chunks(items, MAX_BATCH)) {
      const { data, error } = await db.rpc("zyron_import_set_section", { p_items: part, p_section: sectionId })
      check(error)
      changed += num(data)
    }
    return changed
  },

  async approve(items, approve) {
    let changed = 0
    for (const part of chunks(items, MAX_BATCH)) {
      const { data, error } = await db.rpc("zyron_import_approve", { p_items: part, p_approve: approve })
      check(error)
      changed += num(data)
    }
    return changed
  },

  async pending() {
    const { data, error } = await db.rpc("zyron_imported_pending")
    check(error)
    return num(data)
  },

  async discardProspect(ref) {
    const { error } = await db.rpc("zyron_discard_prospect", { p_lead: ref })
    check(error)
  },
}

/**
 * A fonte dos dados. A condição fica escrita por extenso de propósito: só assim o build de
 * produção a resolve como falsa e descarta o import dos dados de teste.
 */
export async function getImportedApi(demo: boolean): Promise<ImportedApi> {
  if (import.meta.env.DEV && demo) return (await import("./demo")).demoImported
  return supabaseImported
}

/** A fonte pronta para usar (null no primeiro instante). */
export function useImportedApi(demo: boolean) {
  const [api, setApi] = useState<ImportedApi | null>(null)
  useEffect(() => {
    let cancelled = false
    void getImportedApi(demo).then((a) => { if (!cancelled) setApi(a) })
    return () => { cancelled = true }
  }, [demo])
  return api
}

/** A migração ainda não foi aplicada no banco (a leitura converte o erro do banco neste). */
export const isSetupMissing = (e: Error | null): boolean => e instanceof ScoutSetupMissingError

/** Avisa o menu (e quem mais ouvir) que a conferência mudou: o número de pendentes precisa ser lido de novo. */
export const IMPORTED_EVENT = "zyron:importados"
export const announceImportedChange = () => {
  try { window.dispatchEvent(new Event(IMPORTED_EVENT)) } catch { /* sem janela (testes): nada a avisar */ }
}
