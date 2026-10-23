/**
 * Importados do CRM (wsltda.com): o modelo da tela, sem React e sem banco, para ser testado à parte
 * (`npm run test:importados`). "Importado" é tudo o que a ponte trouxe, em três formas:
 *   pre     pré-cadastro (lead que ainda não se cadastrou na VOXEN)
 *   conta   atleta com conta que recebeu o contexto do CRM
 *   espera  contexto que chegou antes de a pessoa virar membro
 * Cada um pode ter UMA subseção ("de onde veio") e uma aprovação (a equipe conferiu).
 *
 * Três ideias que a tela segue:
 *   - quem já tem os dados básicos (idade, posição, categoria, cidade) vem primeiro;
 *   - "leva" é o dia em que algo chegou do CRM: quem chegou pela primeira vez é "novo" e quem já havia sido importado e
 *     chegou de novo é "reenviado" (nunca vira uma segunda linha);
 *   - "contexto" é só o que o CRM de fato contou (respostas, notas, responsável, histórico...), nunca os dados básicos.
 */
import { completenessOf, normName, type Completeness } from "../../people.ts"

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
  team: string | null
  /** AAAA-MM-DD. */
  birthDate: string | null
  age: number | null
  answersCount: number
  notesCount: number
  /** O CRM trouxe contexto de verdade (respostas, notas, responsável, histórico, objetivo...). Dado básico não conta. */
  hasContext: boolean
  /** Textos que a ponte não conseguiu interpretar (ou diferenças abertas com a ficha). */
  reviewCount: number
  revision: number
  firstAt: string | null
  updatedAt: string | null
  /** Quando cada versão chegou do CRM, da mais nova para a mais antiga. */
  receipts: string[]
  /** Veio antes como pré-cadastro e depois chegou como atleta (aguardando ou com conta). */
  wasProspect: boolean
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
/* Dados básicos                                                       */
/* ------------------------------------------------------------------ */

/** Quanto do perfil básico (idade, posição, categoria, cidade; e o time, a mais) este importado já tem. */
export function basicsOf(r: Pick<ImportRow, "age" | "birthDate" | "position" | "category" | "city" | "team">): Completeness {
  return completenessOf({
    age: r.age ?? undefined, birthDate: r.birthDate ?? undefined, position: r.position ?? undefined,
    category: r.category ?? undefined, city: r.city ?? undefined, team: r.team ?? undefined,
  })
}

/** Com os quatro dados básicos E contexto de verdade: pronto para a equipe aproveitar. */
export const isReady = (r: ImportRow) => r.hasContext && basicsOf(r).complete

/**
 * Para ordenar: quem tem os dados básicos preenchidos vem primeiro; entre iguais, quem tem mais contexto
 * (respostas e notas). O número só serve para comparar.
 */
export function priorityOf(r: ImportRow): number {
  return basicsOf(r).score * 1000 + (r.hasContext ? 100 : 0) + Math.min(r.answersCount, 12) + Math.min(r.notesCount, 5) * 2
}

/* ------------------------------------------------------------------ */
/* Contexto devido                                                     */
/* ------------------------------------------------------------------ */

export type Gap = {
  key: "contexto" | "secao" | "nome" | "revisar" | "basicos"
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
  const basics = basicsOf(r)
  if (!basics.complete) {
    const miss = basics.missing.filter((b) => b !== "time")
    gaps.push({ key: "basicos", level: "aviso", label: `Faltam dados básicos: ${miss.length === 1 ? miss[0] : `${miss.slice(0, -1).join(", ")} e ${miss[miss.length - 1]}`}` })
  }
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
  const bits = [r.position, r.category, r.age ? `${r.age} anos` : null, r.city].filter(Boolean) as string[]
  if (!r.name?.trim() && r.guardianName) bits.unshift(`Resp.: ${r.guardianName}`)
  return bits.join(" · ")
}

/* ------------------------------------------------------------------ */
/* Levas: quem chegou, quem chegou de novo                              */
/* ------------------------------------------------------------------ */

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

/** Os dias em que este importado chegou do CRM (do mais antigo ao mais novo). Sem recibos, vale o dia da primeira vez. */
export function receiptDays(r: Pick<ImportRow, "receipts" | "firstAt">): string[] {
  const days = r.receipts.map(dayKey).filter(Boolean)
  const list = days.length ? days : [dayKey(r.firstAt)].filter(Boolean)
  return [...new Set(list)].sort()
}

/** Já havia sido importado e o CRM mandou de novo em outro dia: é o mesmo registro, não uma pessoa nova. */
export const isResent = (r: Pick<ImportRow, "receipts" | "firstAt">): boolean => receiptDays(r).length > 1

/** No dia escolhido, este importado é "novo" (primeira vez) ou "reenviado" (já havia chegado antes)? */
export const arrivalOn = (r: Pick<ImportRow, "receipts" | "firstAt">, day: string): "novo" | "reenviado" | null => {
  const days = receiptDays(r)
  if (!days.includes(day)) return null
  return days[0] === day ? "novo" : "reenviado"
}

export type ArrivalDay = { day: string; count: number; fresh: number; resent: number }

/** Os dias em que chegou algo do CRM (do mais recente ao mais antigo), com quantos eram novos e quantos reenviados. */
export function arrivalDays(rows: ImportRow[]): ArrivalDay[] {
  const m = new Map<string, ArrivalDay>()
  for (const r of rows) {
    const days = receiptDays(r)
    days.forEach((day, i) => {
      const a = m.get(day) ?? { day, count: 0, fresh: 0, resent: 0 }
      a.count += 1
      if (i === 0) a.fresh += 1
      else a.resent += 1
      m.set(day, a)
    })
  }
  return [...m.values()].sort((a, b) => b.day.localeCompare(a.day))
}

/** Quantos são novos e quantos reenviados: no dia escolhido, ou (sem dia) em qualquer dia. */
export function arrivalCounts(rows: ImportRow[], day = ""): { novos: number; reenviados: number } {
  let novos = 0
  let reenviados = 0
  for (const r of rows) {
    const a = day ? arrivalOn(r, day) : isResent(r) ? "reenviado" : "novo"
    if (a === "novo") novos += 1
    else if (a === "reenviado") reenviados += 1
  }
  return { novos, reenviados }
}

/** A leva mais recente (o último dia em que o CRM mandou algo), com quantos eram novos e quantos reenviados. */
export const latestBatch = (rows: ImportRow[]): ArrivalDay | null => arrivalDays(rows)[0] ?? null

/** "22/10/2026: 127 novos" ou "25/10/2026: 40 (12 novos e 28 reenviados)". */
export function arrivalLabel(a: ArrivalDay): string {
  if (!a.resent) return `${dayLabel(a.day)} · ${a.fresh} novo${a.fresh === 1 ? "" : "s"}`
  if (!a.fresh) return `${dayLabel(a.day)} · ${a.resent} reenviado${a.resent === 1 ? "" : "s"}`
  return `${dayLabel(a.day)} · ${a.count} (${a.fresh} novo${a.fresh === 1 ? "" : "s"} e ${a.resent} reenviado${a.resent === 1 ? "" : "s"})`
}

/** "Chegou em 13/10/2026 e de novo em 20/10/2026". */
export function arrivalHistory(r: Pick<ImportRow, "receipts" | "firstAt">): string {
  const days = receiptDays(r)
  if (!days.length) return ""
  if (days.length === 1) return r.receipts.length > 1 ? `Chegou em ${dayLabel(days[0])} (${r.receipts.length} versões no mesmo dia)` : `Chegou em ${dayLabel(days[0])}`
  const again = days.slice(1).map(dayLabel)
  const last = again.pop() as string
  return `Chegou em ${dayLabel(days[0])} e de novo em ${again.length ? `${again.join(", ")} e ` : ""}${last}`
}

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

export type StatusFilter = "todos" | "conferir" | "aprovados" | "mudou" | "incompletos"
export type SectionFilter = "todas" | "nenhuma" | string
export type SortKey = "completos" | "recentes" | "antigos" | "nome"
export type ContextFilter = "todos" | "com" | "sem"
export type DataFilter = "todos" | "completos" | "incompletos"
export type ArrivalFilter = "todos" | "novos" | "reenviados"

export type Filters = {
  query: string
  kind: ImportKind | "todos"
  section: SectionFilter
  status: StatusFilter
  /** Dia em que algo chegou do CRM (AAAA-MM-DD, no horário do navegador) ou vazio. */
  day: string
  /**
   * Novos: chegaram pela primeira vez (no dia escolhido, ou em qualquer dia). Reenviados: já haviam sido importados antes e
   * o CRM mandou de novo (no dia escolhido, ou em qualquer dia depois do primeiro).
   */
  arrival: ArrivalFilter
  /** Contexto de verdade: com ou sem. */
  context: ContextFilter
  /** Dados básicos: completos ou incompletos. */
  data: DataFilter
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = { query: "", kind: "todos", section: "todas", status: "todos", day: "", arrival: "todos", context: "todos", data: "todos", sort: "completos" }

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function matches(r: ImportRow, f: Filters): boolean {
  if (f.kind !== "todos" && r.kind !== f.kind) return false
  if (f.section === "nenhuma" && r.sectionId) return false
  if (f.section !== "todas" && f.section !== "nenhuma" && r.sectionId !== f.section) return false
  const st = statusOf(r)
  if (f.status === "conferir" && st === "aprovado") return false
  if (f.status === "aprovados" && st !== "aprovado") return false
  if (f.status === "mudou" && st !== "mudou") return false
  if (f.status === "incompletos" && readinessOf(r) === "completo") return false
  if (f.day || f.arrival !== "todos") {
    const kindOfArrival = f.day ? arrivalOn(r, f.day) : isResent(r) ? "reenviado" : "novo"
    if (!kindOfArrival) return false
    if (f.arrival === "novos" && kindOfArrival !== "novo") return false
    if (f.arrival === "reenviados" && kindOfArrival !== "reenviado") return false
  }
  if (f.context === "com" && !r.hasContext) return false
  if (f.context === "sem" && r.hasContext) return false
  if (f.data === "completos" && !basicsOf(r).complete) return false
  if (f.data === "incompletos" && basicsOf(r).complete) return false
  const q = norm(f.query.trim())
  if (q && !norm(`${r.name ?? ""} ${r.guardianName ?? ""} ${r.position ?? ""} ${r.category ?? ""} ${r.city ?? ""} ${r.team ?? ""}`).includes(q)) return false
  return true
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() || 0 : 0)
/** A última vez que algo chegou deste importado. */
const lastTime = (r: ImportRow) => Math.max(time(r.receipts[0] ?? null), time(r.updatedAt), time(r.firstAt))

export function applyFilters(rows: ImportRow[], f: Filters): ImportRow[] {
  const out = rows.filter((r) => matches(r, f))
  if (f.sort === "nome") return out.sort((a, b) => displayName(a).localeCompare(displayName(b), "pt-BR"))
  if (f.sort === "antigos") return out.sort((a, b) => time(a.firstAt) - time(b.firstAt))
  if (f.sort === "recentes") return out.sort((a, b) => lastTime(b) - lastTime(a))
  return out.sort((a, b) => priorityOf(b) - priorityOf(a) || lastTime(b) - lastTime(a))
}

export const isFiltered = (f: Filters) =>
  Boolean(f.query.trim()) || f.kind !== "todos" || f.section !== "todas" || f.status !== "todos" || Boolean(f.day) || f.arrival !== "todos" || f.context !== "todos" || f.data !== "todos"

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
  /** Sem nenhum contexto do CRM. */
  empty: number
  withContext: number
  /** Já haviam sido importados e chegaram de novo. */
  resent: number
  /** Com os quatro dados básicos. */
  basicsComplete: number
  /** Com os quatro dados básicos e contexto de verdade. */
  ready: number
}

export function summarize(rows: ImportRow[]): Summary {
  const s: Summary = {
    total: rows.length, byKind: { pre: 0, conta: 0, espera: 0 }, approved: 0, toReview: 0, changed: 0, noSection: 0, empty: 0,
    withContext: 0, resent: 0, basicsComplete: 0, ready: 0,
  }
  for (const r of rows) {
    s.byKind[r.kind] += 1
    const st = statusOf(r)
    if (st === "aprovado") s.approved += 1
    else s.toReview += 1
    if (st === "mudou") s.changed += 1
    if (!r.sectionId) s.noSection += 1
    if (!r.hasContext) s.empty += 1
    else s.withContext += 1
    if (isResent(r)) s.resent += 1
    if (basicsOf(r).complete) s.basicsComplete += 1
    if (isReady(r)) s.ready += 1
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

/* ------------------------------------------------------------------ */
/* Pessoas com o mesmo nome                                            */
/* ------------------------------------------------------------------ */

export type Twin = {
  /** "jogador" abre a ficha em Jogadores; "importado" abre a outra linha da lista. */
  kind: "jogador" | "importado"
  name: string
  /** Para onde ir: o endereço do jogador, ou a chave do outro importado. */
  target: string
  detail: string
}

type PlayerRef = { key: string; name: string; memberId: string | null; aliases: string[] }

/**
 * Importados com o mesmo nome de um jogador que já está na base ou de outro importado: pode ser a mesma pessoa que chegou
 * por outro caminho. Só nome com 2 palavras ou mais (um "João" sozinho não prova nada), e nunca compara a pessoa com ela mesma.
 */
export function nameTwins(rows: ImportRow[], players: PlayerRef[]): Map<string, Twin[]> {
  const byName = new Map<string, { rows: ImportRow[]; players: PlayerRef[] }>()
  const slot = (n: string) => {
    const s = byName.get(n)
    if (s) return s
    const fresh = { rows: [] as ImportRow[], players: [] as PlayerRef[] }
    byName.set(n, fresh)
    return fresh
  }
  const words = (n: string) => n.split(" ").filter(Boolean).length
  for (const r of rows) {
    const n = normName(r.name)
    if (words(n) >= 2) slot(n).rows.push(r)
  }
  for (const p of players) {
    const n = normName(p.name)
    if (words(n) >= 2) slot(n).players.push(p)
  }
  const out = new Map<string, Twin[]>()
  for (const r of rows) {
    const n = normName(r.name)
    const s = byName.get(n)
    if (!s || words(n) < 2) continue
    // A própria pessoa em Jogadores: o lead de quem aguarda cadastro, ou o pré-cadastro aprovado (chave 'crm:').
    const ownKey = r.kind === "espera" ? `lead:${r.ref}` : r.kind === "pre" ? `crm:${r.ref}` : null
    const twins: Twin[] = []
    for (const p of s.players) {
      const same = (r.kind === "conta" && p.memberId === r.memberId) || (ownKey !== null && (p.key === ownKey || p.aliases.includes(ownKey)))
      if (!same) twins.push({ kind: "jogador", name: p.name, target: p.key, detail: "já está em Jogadores" })
    }
    for (const o of s.rows) {
      if (o.key !== r.key) twins.push({ kind: "importado", name: displayName(o), target: o.key, detail: KIND_LABEL[o.kind].toLowerCase() })
    }
    if (twins.length) out.set(r.key, twins)
  }
  return out
}
