/**
 * Importados do CRM (wsltda.com): o modelo da tela, sem React e sem banco, para ser testado à parte
 * (`npm run test:importados`). "Importado" é tudo o que a ponte trouxe, em três formas:
 *   pre     pré-cadastro (lead que ainda não se cadastrou na VOXEN)
 *   conta   atleta com conta que recebeu o contexto do CRM
 *   espera  contexto que chegou antes de a pessoa virar membro
 * Cada um pode ter UMA subseção ("de onde veio") e uma aprovação (a equipe conferiu).
 */

export type ImportKind = "pre" | "conta" | "espera"

export const KINDS: ImportKind[] = ["pre", "conta", "espera"]

export const KIND_LABEL: Record<ImportKind, string> = {
  pre: "Pré-cadastro",
  conta: "Atleta com conta",
  espera: "Aguardando cadastro",
}

/** Nas linhas da lista, onde falta espaço. */
export const KIND_SHORT: Record<ImportKind, string> = {
  pre: "Pré-cadastro",
  conta: "Com conta",
  espera: "Aguardando",
}

/** [singular, plural] para contar: "3 atletas com conta". */
export const KIND_NOUN: Record<ImportKind, [string, string]> = {
  pre: ["pré-cadastro", "pré-cadastros"],
  conta: ["atleta com conta", "atletas com conta"],
  espera: ["aguardando cadastro", "aguardando cadastro"],
}

export const KIND_BLURB: Record<ImportKind, string> = {
  pre: "Lead do CRM que ainda não se cadastrou na VOXEN. Não é atleta e ninguém é contatado.",
  conta: "Já tem conta na VOXEN. O contexto do CRM está na ficha dele.",
  espera: "O CRM mandou o contexto, mas a pessoa ainda não virou membro. Quando virar, o contexto entra na ficha.",
}

export type ImportRow = {
  /** `${kind}:${ref}`, único na lista. */
  key: string
  kind: ImportKind
  /** Id do lead no CRM (pre), do membro (conta) ou do lead do funil (espera). */
  ref: string
  name: string | null
  guardianName: string | null
  position: string | null
  category: string | null
  city: string | null
  answersCount: number
  notesCount: number
  /** O CRM trouxe algum conteúdo (respostas, notas, histórico, responsável...). */
  hasContext: boolean
  /** Textos que a ponte não conseguiu interpretar (ou diferenças abertas com a ficha). */
  reviewCount: number
  revision: number
  firstAt: string | null
  updatedAt: string | null
  memberId: string | null
  sectionId: string | null
  approvedAt: string | null
  approvedByName: string | null
  approvedRevision: number | null
}

export type ImportSection = {
  id: string
  name: string
  note: string | null
  color: string
  createdAt: string
}

export type ImportItem = { kind: ImportKind; ref: string }

export const toItems = (rows: Pick<ImportRow, "kind" | "ref">[]): ImportItem[] => rows.map((r) => ({ kind: r.kind, ref: r.ref }))

export const rowKey = (kind: ImportKind, ref: string) => `${kind}:${ref}`

/** Cores para escolher nas subseções (cabem bem no tema escuro). */
export const SECTION_COLORS = ["#fbbf24", "#34d399", "#38bdf8", "#a78bfa", "#fb7185", "#fb923c", "#a3e635", "#94a3b8"]

/** Ideias para a primeira vez (um clique cria): a equipe troca ou apaga depois. */
export const SECTION_IDEAS = ["Instagram", "Anúncio (Meta)", "Indicação", "Peneira", "Evento", "WhatsApp", "Lista antiga"]

export const MAX_BATCH = 1000

/* ------------------------------------------------------------------ */
/* Situação                                                            */
/* ------------------------------------------------------------------ */

export type ImportStatus = "pendente" | "aprovado" | "mudou"

export const STATUS_LABEL: Record<ImportStatus, string> = {
  pendente: "Para conferir",
  aprovado: "Aprovado",
  mudou: "Mudou depois de aprovado",
}

/** "mudou": o CRM mandou uma versão mais nova do que a que a equipe aprovou. */
export function statusOf(r: ImportRow): ImportStatus {
  if (r.approvedAt === null) return "pendente"
  return r.approvedRevision !== null && r.revision > r.approvedRevision ? "mudou" : "aprovado"
}

export const needsReview = (r: ImportRow) => statusOf(r) !== "aprovado"

/* ------------------------------------------------------------------ */
/* Contexto devido                                                     */
/* ------------------------------------------------------------------ */

export type Gap = {
  key: "contexto" | "secao" | "nome" | "revisar"
  /** "falta" impede o item de ficar completo; "aviso" só chama atenção. */
  level: "falta" | "aviso"
  label: string
}

/** O que falta para o importado estar com o contexto devido. */
export function gapsOf(r: ImportRow): Gap[] {
  const gaps: Gap[] = []
  if (!r.hasContext) gaps.push({ key: "contexto", level: "falta", label: "O CRM não trouxe nenhum contexto" })
  if (!r.sectionId) gaps.push({ key: "secao", level: "falta", label: "Sem subseção de origem" })
  if (!r.name?.trim()) gaps.push({ key: "nome", level: "aviso", label: r.guardianName ? "O CRM não mandou o nome do atleta (só o do responsável)" : "O CRM não mandou o nome" })
  if (r.reviewCount > 0) gaps.push({ key: "revisar", level: "aviso", label: `${r.reviewCount} texto${r.reviewCount === 1 ? "" : "s"} para interpretar` })
  return gaps
}

/** completo: tem contexto e subseção · sem_origem: tem contexto, falta a subseção · vazio: nada veio do CRM. */
export type Readiness = "completo" | "sem_origem" | "vazio"

export function readinessOf(r: ImportRow): Readiness {
  if (!r.hasContext) return "vazio"
  return r.sectionId ? "completo" : "sem_origem"
}

export const READINESS_LABEL: Record<Readiness, string> = {
  completo: "Contexto completo",
  sem_origem: "Falta a subseção",
  vazio: "Sem contexto do CRM",
}

export const displayName = (r: Pick<ImportRow, "name">) => r.name?.trim() || "Atleta sem nome"

/** Linha de apoio sob o nome: posição, categoria, cidade (ou o responsável, quando não há nome). */
export function subline(r: ImportRow): string {
  const bits = [r.position, r.category, r.city].filter(Boolean) as string[]
  if (!r.name?.trim() && r.guardianName) bits.unshift(`Resp.: ${r.guardianName}`)
  return bits.join(" · ")
}

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

export type StatusFilter = "todos" | "conferir" | "aprovados" | "mudou" | "incompletos"
export type SectionFilter = "todas" | "nenhuma" | string
export type SortKey = "recentes" | "antigos" | "nome"

export type Filters = {
  query: string
  kind: ImportKind | "todos"
  section: SectionFilter
  status: StatusFilter
  /** Dia da chegada (AAAA-MM-DD, no horário do navegador) ou vazio. */
  day: string
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = { query: "", kind: "todos", section: "todas", status: "todos", day: "", sort: "recentes" }

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/** O dia (no fuso do navegador) de uma data ISO, como AAAA-MM-DD. */
export function dayKey(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function dayLabel(key: string): string {
  const [y, m, d] = key.split("-")
  return y && m && d ? `${d}/${m}/${y}` : key
}

export function matches(r: ImportRow, f: Filters): boolean {
  if (f.kind !== "todos" && r.kind !== f.kind) return false
  if (f.section === "nenhuma" && r.sectionId) return false
  if (f.section !== "todas" && f.section !== "nenhuma" && r.sectionId !== f.section) return false
  const st = statusOf(r)
  if (f.status === "conferir" && st === "aprovado") return false
  if (f.status === "aprovados" && st !== "aprovado") return false
  if (f.status === "mudou" && st !== "mudou") return false
  if (f.status === "incompletos" && readinessOf(r) === "completo") return false
  if (f.day && dayKey(r.firstAt) !== f.day) return false
  const q = norm(f.query.trim())
  if (q && !norm(`${r.name ?? ""} ${r.guardianName ?? ""} ${r.position ?? ""} ${r.category ?? ""} ${r.city ?? ""}`).includes(q)) return false
  return true
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() || 0 : 0)

export function applyFilters(rows: ImportRow[], f: Filters): ImportRow[] {
  const out = rows.filter((r) => matches(r, f))
  if (f.sort === "nome") return out.sort((a, b) => displayName(a).localeCompare(displayName(b), "pt-BR"))
  if (f.sort === "antigos") return out.sort((a, b) => time(a.firstAt) - time(b.firstAt))
  return out.sort((a, b) => time(b.firstAt) - time(a.firstAt))
}

export const isFiltered = (f: Filters) =>
  Boolean(f.query.trim()) || f.kind !== "todos" || f.section !== "todas" || f.status !== "todos" || Boolean(f.day)

/* ------------------------------------------------------------------ */
/* Números                                                             */
/* ------------------------------------------------------------------ */

export type Summary = {
  total: number
  byKind: Record<ImportKind, number>
  approved: number
  /** Para conferir: nunca aprovados ou que mudaram depois de aprovados. */
  toReview: number
  changed: number
  noSection: number
  empty: number
}

export function summarize(rows: ImportRow[]): Summary {
  const s: Summary = { total: rows.length, byKind: { pre: 0, conta: 0, espera: 0 }, approved: 0, toReview: 0, changed: 0, noSection: 0, empty: 0 }
  for (const r of rows) {
    s.byKind[r.kind] += 1
    const st = statusOf(r)
    if (st === "aprovado") s.approved += 1
    else s.toReview += 1
    if (st === "mudou") s.changed += 1
    if (!r.sectionId) s.noSection += 1
    if (!r.hasContext) s.empty += 1
  }
  return s
}

export function countBySection(rows: ImportRow[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = r.sectionId ?? "nenhuma"
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

/** Os dias em que chegaram importados (do mais recente ao mais antigo): cada dia costuma ser uma leva do CRM. */
export function arrivalDays(rows: ImportRow[]): { day: string; count: number }[] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const d = dayKey(r.firstAt)
    if (d) m.set(d, (m.get(d) ?? 0) + 1)
  }
  return [...m.entries()].map(([day, count]) => ({ day, count })).sort((a, b) => b.day.localeCompare(a.day))
}

/* ------------------------------------------------------------------ */
/* Levas                                                               */
/* ------------------------------------------------------------------ */

export type ApprovalPlan = {
  /** O que a aprovação de fato altera (os já aprovados e sem mudança ficam como estão). */
  toApprove: ImportRow[]
  alreadyApproved: ImportRow[]
  /** Com contexto e subseção. */
  complete: ImportRow[]
  /** Com contexto, mas sem subseção. */
  noSection: ImportRow[]
  /** O CRM não trouxe nada. */
  empty: ImportRow[]
  /** Os que já estavam aprovados e mudaram: aprovar de novo confere a versão nova. */
  changed: ImportRow[]
}

/** Resume uma leva antes de aprovar: quantos estão completos e o que falta nos outros. */
export function planApproval(rows: ImportRow[]): ApprovalPlan {
  const toApprove = rows.filter(needsReview)
  return {
    toApprove,
    alreadyApproved: rows.filter((r) => !needsReview(r)),
    complete: toApprove.filter((r) => readinessOf(r) === "completo"),
    noSection: toApprove.filter((r) => readinessOf(r) === "sem_origem"),
    empty: toApprove.filter((r) => readinessOf(r) === "vazio"),
    changed: toApprove.filter((r) => statusOf(r) === "mudou"),
  }
}

/** As chaves entre dois itens da lista (os dois incluídos), para marcar com Shift. */
export function rangeKeys(list: Pick<ImportRow, "key">[], fromKey: string, toKey: string): string[] {
  const a = list.findIndex((r) => r.key === fromKey)
  const b = list.findIndex((r) => r.key === toKey)
  if (a < 0 || b < 0) return b >= 0 ? [list[b].key] : []
  const [lo, hi] = a < b ? [a, b] : [b, a]
  return list.slice(lo, hi + 1).map((r) => r.key)
}

/** Fica só o que ainda está na lista visível (a seleção nunca age sobre o que a pessoa não está vendo). */
export function pruneSelection(selected: Set<string>, visible: Pick<ImportRow, "key">[]): Set<string> {
  const keep = new Set(visible.map((r) => r.key))
  let changed = false
  const next = new Set<string>()
  for (const k of selected) {
    if (keep.has(k)) next.add(k)
    else changed = true
  }
  return changed ? next : selected
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
