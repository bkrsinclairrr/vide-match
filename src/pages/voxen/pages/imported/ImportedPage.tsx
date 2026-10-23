import "../opportunities/opportunities.css"
import "../scout/scout.css"
import "./imported.css"

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleX, Download, Layers, Pencil, RefreshCw, RotateCcw, Search, UserSearch, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/exportFile"
import { Avatar, Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { errMsg, useLoad } from "../scout/api"
import { announceImportedChange, useImportedApi, type ImportedApi } from "./api"
import { ImportedDetail } from "./Detail"
import { contextFile, contextFileName, type ContextEntry } from "./markdown"
import { ArrivalTag, BasicsDots, ImportedNotice, KindBadge, SectionChip, StatusBadge, Tick } from "./parts"
import { SectionForm, SectionsDialog } from "./SectionsDialog"
import {
  KINDS, KIND_LABEL, KIND_NOUN, applyFilters, arrivalCounts, arrivalDays, arrivalLabel, countBySection, dayKey, dayLabel, displayName, isFiltered, isReady,
  latestBatch, nameTwins, needsReview, planApproval, plural, pruneSelection, rangeKeys, readinessOf, rowKey, subline, summarize, toItems,
  type ArrivalFilter, type ContextFilter, type DataFilter, type Filters, type ImportKind, type ImportRow, type ImportSection, type SortKey, type StatusFilter, type Twin,
} from "./model"

const STATUS_FILTERS: StatusFilter[] = ["conferir", "aprovados", "mudou", "incompletos"]
const SORTS: SortKey[] = ["recentes", "antigos", "nome"]
const DATA_FILTERS: DataFilter[] = ["completos", "incompletos"]
const CONTEXT_FILTERS: ContextFilter[] = ["com", "sem"]
const ARRIVALS: ArrivalFilter[] = ["novos", "reenviados"]
const NO_SECTIONS: ImportSection[] = []
const NO_TWINS: Twin[] = []

/** O valor do endereço, se for um dos permitidos; senão o padrão. */
const oneOf = <T extends string>(list: readonly T[], v: string, fallback: T): T => ((list as readonly string[]).includes(v) ? (v as T) : fallback)

type BarMode = "idle" | "approve" | "new"
type Exporting = { done: number; total: number }

/**
 * Importados (/voxen/importados e /admin/importados): tudo o que a ponte da wsltda.com trouxe (pré-cadastros,
 * atletas com conta e quem espera virar membro), separado só aqui. A equipe diz de onde especificamente cada
 * um veio (subseções editáveis) e confere o contexto, um a um ou em levas: marcar vários, marcar todos do
 * filtro, mover de subseção e aprovar. Aprovar é "conferido": não cria cadastro nem contata ninguém. O atleta com
 * conta e quem aguarda cadastro já estavam em Jogadores; o pré-cadastro do CRM passa a aparecer lá quando é aprovado
 * (e sai quando a aprovação é tirada). Se o CRM mandar uma versão nova depois da aprovação, o item volta a pedir
 * conferência, mas continua em Jogadores.
 *
 * Quem já tem os dados básicos preenchidos vem primeiro. O CRM pode mandar de novo quem já foi importado: a pessoa
 * continua sendo uma só (marcada "Reenviado"), nunca vira uma segunda linha. O contexto aparece só para quem de fato
 * tem contexto, e pode ser baixado em um arquivo .md.
 */
export default function ImportedPage() {
  const { demo, canScout, canAdmin, players, reload: reloadPlayers } = useVoxen()
  const { toast } = useToast()
  const api = useImportedApi(demo)
  const [params, setParams] = useSearchParams()
  const rowsQ = useLoad(api, (a) => a.list(), [])
  const secQ = useLoad(api, (a) => a.sections(), [])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [mode, setMode] = useState<BarMode>("idle")
  const [busy, setBusy] = useState(false)
  const [manager, setManager] = useState(false)
  const [exporting, setExporting] = useState<Exporting | null>(null)
  const anchor = useRef<string | null>(null)

  const filters = useMemo<Filters>(() => {
    const dia = params.get("dia") ?? ""
    return {
      query,
      kind: oneOf<ImportKind | "todos">(KINDS, params.get("tipo") ?? "", "todos"),
      section: params.get("sub") || "todas",
      status: oneOf<StatusFilter | "todos">(STATUS_FILTERS, params.get("situacao") ?? "", "todos"),
      day: /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : "",
      arrival: oneOf<ArrivalFilter>(["todos", ...ARRIVALS], params.get("chegada") ?? "", "todos"),
      context: oneOf<ContextFilter>(["todos", ...CONTEXT_FILTERS], params.get("contexto") ?? "", "todos"),
      data: oneOf<DataFilter>(["todos", ...DATA_FILTERS], params.get("dados") ?? "", "todos"),
      sort: oneOf<SortKey>(["completos", ...SORTS], params.get("ordem") ?? "", "completos"),
    }
  }, [query, params])

  const setFilter = useCallback((patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }, [params, setParams])

  const all = rowsQ.data
  const sections = secQ.data ?? NO_SECTIONS
  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections])
  const visible = useMemo(() => (all ? applyFilters(all, filters) : []), [all, filters])
  const visibleRef = useRef(visible)
  visibleRef.current = visible
  const summary = useMemo(() => summarize(all ?? []), [all])
  const counts = useMemo(() => countBySection(all ?? []), [all])
  const days = useMemo(() => arrivalDays(all ?? []), [all])
  const batch = useMemo(() => latestBatch(all ?? []), [all])
  const arrivals = useMemo(() => arrivalCounts(all ?? [], filters.day), [all, filters.day])
  const twins = useMemo(() => (all ? nameTwins(all, players) : new Map<string, Twin[]>()), [all, players])
  const selRows = useMemo(() => visible.filter((r) => selected.has(r.key)), [visible, selected])
  const readyRows = useMemo(() => visible.filter(isReady), [visible])
  const withContext = useMemo(() => visible.filter((r) => r.hasContext).length, [visible])

  // A seleção nunca age sobre o que a pessoa não está vendo: ao mudar o filtro, sai o que sumiu da lista.
  useEffect(() => { setSelected((s) => pruneSelection(s, visible)) }, [visible])
  useEffect(() => { if (selected.size === 0) setMode("idle") }, [selected])

  // Voltar para a aba depois de enviar do dashboard da wsltda.com: a lista se atualiza sozinha.
  const reloadRows = rowsQ.reload
  const reloadSections = secQ.reload
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") { reloadRows(); reloadSections() } }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [reloadRows, reloadSections])

  // Esc desmarca tudo (fora de campos de texto e da janela das subseções).
  useEffect(() => {
    if (selected.size === 0) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key !== "Escape" || manager || t?.closest("input, textarea, select, [role='dialog']")) return
      setSelected(new Set())
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, manager])

  const itemKey = params.get("item")
  const current = useMemo(() => all?.find((r) => r.key === itemKey) ?? null, [all, itemKey])

  const toggle = useCallback((key: string, shift: boolean) => {
    // O ponto de partida é lido antes: a função abaixo só roda depois, quando o anchor já é o item clicado.
    const from = anchor.current
    anchor.current = key
    setSelected((prev) => {
      const next = new Set(prev)
      if (shift && from && from !== key) {
        const turnOn = !prev.has(key)
        for (const k of rangeKeys(visibleRef.current, from, key)) {
          if (turnOn) next.add(k)
          else next.delete(k)
        }
      } else if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const open = useCallback((key: string) => setFilter({ item: key }), [setFilter])

  const dropFromSelection = (rows: ImportRow[]) =>
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of rows) next.delete(r.key)
      return next
    })

  const patchRows = (keys: Set<string>, fn: (r: ImportRow) => ImportRow) =>
    rowsQ.set((d) => (d ? d.map((r) => (keys.has(r.key) ? fn(r) : r)) : d))

  /** Move uma leva para a subseção (null = tira da subseção). */
  const moveTo = async (api: ImportedApi, rows: ImportRow[], sectionId: string | null, name?: string) => {
    if (!rows.length) return
    setBusy(true)
    const before = rowsQ.data
    patchRows(new Set(rows.map((r) => r.key)), (r) => ({ ...r, sectionId }))
    try {
      const n = await api.setSection(toItems(rows), sectionId)
      const label = name ?? (sectionId ? sectionById.get(sectionId)?.name : undefined) ?? "a subseção"
      if (n === 0) toast({ title: sectionId ? `Já estavam em “${label}”` : "Já estavam sem subseção" })
      else toast({ title: sectionId ? `${plural(n, "importado movido", "importados movidos")} para “${label}”` : `${plural(n, "importado tirado", "importados tirados")} da subseção` })
      dropFromSelection(rows)
      rowsQ.reload()
      announceImportedChange()
    } catch (e) {
      rowsQ.set(() => before ?? null)
      toast({ title: "Não foi possível mover", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  /** Aprova (ou tira a aprovação de) uma leva. `scope` é o que sai da seleção ao terminar (a leva marcada inteira, mesmo o que já estava aprovado). */
  const approveRows = async (api: ImportedApi, rows: ImportRow[], approve: boolean, scope: ImportRow[] = rows) => {
    const targets = approve ? rows.filter(needsReview) : rows.filter((r) => r.approvedAt !== null)
    if (!targets.length) return
    setBusy(true)
    const before = rowsQ.data
    const now = new Date().toISOString()
    patchRows(new Set(targets.map((r) => r.key)), (r) => (approve
      ? { ...r, approvedAt: now, approvedByName: "Você", approvedRevision: r.revision }
      : { ...r, approvedAt: null, approvedByName: null, approvedRevision: null }))
    try {
      const n = await api.approve(toItems(targets), approve)
      const pre = targets.filter((r) => r.kind === "pre").length
      toast({
        title: approve ? plural(n || targets.length, "importado aprovado", "importados aprovados") : `Aprovação retirada de ${plural(n || targets.length, "importado", "importados")}`,
        description: approve
          ? `${pre ? `${plural(pre, "pré-cadastro entrou", "pré-cadastros entraram")} em Jogadores. ` : ""}Ninguém foi contatado e nenhum cadastro foi criado.`
          : pre ? `${plural(pre, "pré-cadastro saiu", "pré-cadastros saíram")} de Jogadores.` : undefined,
      })
      // O pré-cadastro aprovado aparece em Jogadores: a lista da equipe é lida de novo, em segundo plano.
      if (pre) void reloadPlayers()
      dropFromSelection(scope)
      setMode("idle")
      rowsQ.reload()
      announceImportedChange()
    } catch (e) {
      rowsQ.set(() => before ?? null)
      toast({ title: approve ? "Não foi possível aprovar" : "Não foi possível tirar a aprovação", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const createAndMove = async (api: ImportedApi, rows: ImportRow[], d: { name: string; note: string; color: string }) => {
    setBusy(true)
    try {
      const s = await api.saveSection({ name: d.name, note: null, color: d.color })
      secQ.set((prev) => [...(prev ?? []), s])
      setMode("idle")
      setBusy(false)
      await moveTo(api, rows, s.id, s.name)
    } catch (e) {
      setBusy(false)
      toast({ title: "Não foi possível criar a subseção", description: errMsg(e), variant: "destructive" })
    }
  }

  const discard = async (api: ImportedApi, row: ImportRow) => {
    setBusy(true)
    try {
      await api.discardProspect(row.ref)
      rowsQ.set((d) => (d ? d.filter((r) => r.key !== row.key) : d))
      setFilter({ item: "" })
      toast({ title: "Pré-cadastro descartado", description: "O texto foi apagado e as próximas versões do CRM não o recriam." })
      announceImportedChange()
    } catch (e) {
      toast({ title: "Não foi possível descartar", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  /**
   * Baixa o contexto de quem tem contexto (a lista na ordem em que está na tela: quem tem os dados completos vem primeiro) num
   * arquivo .md só. Quem veio só com dados básicos fica de fora, e o aviso diz quantos.
   */
  const exportContext = async (api: ImportedApi, rows: ImportRow[]) => {
    const withCtx = rows.filter((r) => r.hasContext)
    if (!withCtx.length) {
      toast({ title: "Nenhum contexto para baixar", description: "Quem está nesta escolha veio do CRM só com dados básicos." })
      return
    }
    setExporting({ done: 0, total: withCtx.length })
    try {
      const details = await api.details(toItems(withCtx), (done, total) => setExporting({ done, total }))
      const byKey = new Map(details.map((d) => [rowKey(d.kind, d.ref), d]))
      const entries: ContextEntry[] = withCtx.flatMap((row) => {
        const detail = byKey.get(row.key)
        return detail ? [{ row, detail, sectionName: row.sectionId ? sectionById.get(row.sectionId)?.name ?? null : null }] : []
      })
      const today = dayKey(new Date().toISOString())
      const file = contextFile(entries, { today, skipped: rows.length - withCtx.length })
      downloadFile(contextFileName(entries, today), file.text, "text/markdown;charset=utf-8")
      toast({
        title: `Arquivo pronto com o contexto de ${plural(file.included, "pessoa", "pessoas")}`,
        description: file.skipped ? `${plural(file.skipped, "ficou de fora", "ficaram de fora")} por não ${file.skipped === 1 ? "ter" : "terem"} nenhum contexto do CRM.` : "Está na pasta de downloads do navegador.",
      })
    } catch (e) {
      toast({ title: "Não foi possível baixar o contexto", description: errMsg(e), variant: "destructive" })
    } finally {
      setExporting(null)
    }
  }

  if (rowsQ.error) return <ImportedNotice error={rowsQ.error} />
  if (secQ.error) return <ImportedNotice error={secQ.error} />
  if (!api || !all || !secQ.data) return <PageSkeleton />

  const filtered = isFiltered(filters)
  const pct = summary.total ? Math.round((summary.approved / summary.total) * 100) : 0
  const allOn = visible.length > 0 && selRows.length === visible.length
  const selectable = canScout
  const clearFilters = () => { setQuery(""); setFilter({ tipo: "", sub: "", situacao: "", dia: "", dados: "", contexto: "", chegada: "" }) }
  const toggleFilter = (key: string, value: string, now: string) => setFilter({ [key]: now === value ? "" : value })
  const exportLabel = exporting
    ? `Preparando ${exporting.done} de ${exporting.total}…`
    : filtered ? `Baixar contexto da lista (${withContext})` : `Baixar contexto de todos (${withContext})`

  return (
    <div className={`im-root ${selRows.length ? "has-bulk" : ""} ${current ? "has-detail" : ""}`}>
      <section className="vx-card im-top" aria-label="Resumo dos importados">
        <div className="im-top-head">
          <div className="im-kpis">
            <button type="button" className="im-kpi" onClick={clearFilters}><b className="tnum">{summary.total}</b><span>Importados</span></button>
            <button type="button" className={`im-kpi is-warn ${filters.status === "conferir" ? "is-on" : ""}`} onClick={() => toggleFilter("situacao", "conferir", filters.status)}><b className="tnum">{summary.toReview}</b><span>Para conferir</span></button>
            <button type="button" className={`im-kpi is-ok ${filters.status === "aprovados" ? "is-on" : ""}`} onClick={() => toggleFilter("situacao", "aprovados", filters.status)}><b className="tnum">{summary.approved}</b><span>Aprovados</span></button>
            <button type="button" className={`im-kpi is-ok ${filters.data === "completos" ? "is-on" : ""}`} onClick={() => toggleFilter("dados", "completos", filters.data)} title="Têm idade, posição, categoria e cidade"><b className="tnum">{summary.basicsComplete}</b><span>Dados completos</span></button>
            <button type="button" className={`im-kpi ${filters.context === "com" ? "is-on" : ""}`} onClick={() => toggleFilter("contexto", "com", filters.context)} title="O CRM trouxe respostas, notas, responsável ou histórico"><b className="tnum">{summary.withContext}</b><span>Com contexto</span></button>
            <button type="button" className={`im-kpi ${filters.section === "nenhuma" ? "is-on" : ""}`} onClick={() => setFilter({ sub: filters.section === "nenhuma" ? "" : "nenhuma" })}><b className="tnum">{summary.noSection}</b><span>Sem subseção</span></button>
          </div>
          <div className="im-top-actions">
            <button type="button" className="vx-btn h-9" onClick={() => { rowsQ.reload(); secQ.reload() }} disabled={rowsQ.loading}>
              <RefreshCw className={rowsQ.loading ? "op-spin" : ""} /> Atualizar
            </button>
            <button type="button" className="vx-btn im-export h-9" disabled={exporting !== null || withContext === 0} onClick={() => void exportContext(api, visible)}
              title="Baixa um arquivo .md com o resumo e tudo o que o CRM contou de cada pessoa da lista que tem contexto">
              <Download className={exporting ? "op-spin" : ""} /> {exportLabel}
            </button>
            {canScout && <button type="button" className="vx-btn vx-btn--gold h-9" onClick={() => setManager(true)}><Pencil /> Subseções</button>}
          </div>
        </div>

        <div className="im-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Importados aprovados">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="im-progress-text">
          <strong className="tnum">{pct}%</strong> conferido ·{" "}
          {KINDS.map((k, i) => (
            <span key={k}>{i > 0 ? " · " : ""}<button type="button" className={`im-link ${filters.kind === k ? "is-on" : ""}`} onClick={() => setFilter({ tipo: filters.kind === k ? "" : k })}>{plural(summary.byKind[k], ...KIND_NOUN[k])}</button></span>
          ))}
        </p>

        {batch && (
          <p className="im-batch">
            <Layers aria-hidden="true" />
            <span>
              Última leva do CRM: <strong>{dayLabel(batch.day)}</strong> · {plural(batch.count, "importado", "importados")}:{" "}
              <button type="button" className={`im-link ${filters.day === batch.day && filters.arrival === "novos" ? "is-on" : ""}`} onClick={() => setFilter({ dia: batch.day, chegada: "novos" })}>{plural(batch.fresh, "novo", "novos")}</button>
              {batch.resent > 0 && (
                <>
                  {" "}e{" "}
                  <button type="button" className={`im-link ${filters.day === batch.day && filters.arrival === "reenviados" ? "is-on" : ""}`} onClick={() => setFilter({ dia: batch.day, chegada: "reenviados" })}>{plural(batch.resent, "reenviado", "reenviados")}</button>
                  <span className="im-batch-hint"> (já estavam aqui; o CRM mandou de novo e eles foram atualizados, sem duplicar)</span>
                </>
              )}
              {" · "}<button type="button" className="im-link" onClick={() => setFilter({ dia: batch.day, chegada: "" })}>ver a leva toda</button>
            </span>
          </p>
        )}

        <div className="im-sections" aria-label="Subseções">
          <button type="button" className={`im-sec ${filters.section === "todas" ? "is-on" : ""}`} onClick={() => setFilter({ sub: "" })}>Todas <em className="tnum">{summary.total}</em></button>
          <button type="button" className={`im-sec ${filters.section === "nenhuma" ? "is-on" : ""}`} onClick={() => setFilter({ sub: "nenhuma" })}>Sem subseção <em className="tnum">{counts.get("nenhuma") ?? 0}</em></button>
          {sections.map((s) => (
            <button key={s.id} type="button" className={`im-sec ${filters.section === s.id ? "is-on" : ""}`} style={{ "--c": s.color } as CSSProperties} title={s.note ?? undefined} onClick={() => setFilter({ sub: filters.section === s.id ? "" : s.id })}>
              <i aria-hidden="true" /> {s.name} <em className="tnum">{counts.get(s.id) ?? 0}</em>
            </button>
          ))}
          {canScout && sections.length === 0 && <button type="button" className="im-sec is-add" onClick={() => setManager(true)}>+ Criar a primeira subseção</button>}
        </div>

        <div className="im-selects">
          <label><span>Tipo</span>
            <select className="vx-input vx-select vx-filter" value={filters.kind === "todos" ? "" : filters.kind} onChange={(e) => setFilter({ tipo: e.target.value })} aria-label="Tipo de importado">
              <option value="">Todos os tipos</option>
              {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]} ({summary.byKind[k]})</option>)}
            </select>
          </label>
          <label><span>Situação</span>
            <select className="vx-input vx-select vx-filter" value={filters.status === "todos" ? "" : filters.status} onChange={(e) => setFilter({ situacao: e.target.value })} aria-label="Situação da conferência">
              <option value="">Qualquer situação</option>
              <option value="conferir">Para conferir ({summary.toReview})</option>
              <option value="aprovados">Aprovados ({summary.approved})</option>
              <option value="mudou">Mudaram depois de aprovados ({summary.changed})</option>
              <option value="incompletos">Falta subseção ou contexto ({all.filter((r) => readinessOf(r) !== "completo").length})</option>
            </select>
          </label>
          <label><span>Dados básicos</span>
            <select className="vx-input vx-select vx-filter" value={filters.data === "todos" ? "" : filters.data} onChange={(e) => setFilter({ dados: e.target.value })} aria-label="Dados básicos: idade, posição, categoria e cidade">
              <option value="">Completos ou não</option>
              <option value="completos">Completos ({summary.basicsComplete})</option>
              <option value="incompletos">Incompletos ({summary.total - summary.basicsComplete})</option>
            </select>
          </label>
          <label><span>Contexto</span>
            <select className="vx-input vx-select vx-filter" value={filters.context === "todos" ? "" : filters.context} onChange={(e) => setFilter({ contexto: e.target.value })} aria-label="Contexto do CRM">
              <option value="">Com ou sem</option>
              <option value="com">Com contexto ({summary.withContext})</option>
              <option value="sem">Sem contexto ({summary.empty})</option>
            </select>
          </label>
          <label><span>Chegada</span>
            <select className="vx-input vx-select vx-filter" value={filters.day} onChange={(e) => setFilter({ dia: e.target.value })} aria-label="Dia em que chegou do CRM">
              <option value="">Qualquer dia</option>
              {days.map((d) => <option key={d.day} value={d.day}>{arrivalLabel(d)}</option>)}
            </select>
          </label>
          <label><span>Novos ou reenviados</span>
            <select className="vx-input vx-select vx-filter" value={filters.arrival === "todos" ? "" : filters.arrival} onChange={(e) => setFilter({ chegada: e.target.value })} aria-label="Novos ou reenviados">
              <option value="">Novos e reenviados</option>
              <option value="novos">Só os novos ({arrivals.novos})</option>
              <option value="reenviados">Só os reenviados ({arrivals.reenviados})</option>
            </select>
          </label>
          <label><span>Ordem</span>
            <select className="vx-input vx-select vx-filter" value={filters.sort === "completos" ? "" : filters.sort} onChange={(e) => setFilter({ ordem: e.target.value })} aria-label="Ordem da lista">
              <option value="">Dados completos primeiro</option>
              <option value="recentes">Chegaram há menos tempo</option>
              <option value="antigos">Chegaram há mais tempo</option>
              <option value="nome">Nome (A a Z)</option>
            </select>
          </label>
          {filtered && <button type="button" className="vx-chip" onClick={clearFilters}><X className="h-3.5 w-3.5" /> Limpar filtros</button>}
        </div>
      </section>

      <div className={`op-page im-page ${current ? "has-selection" : ""}`}>
        <aside className="vx-card vx-card--flush op-list im-list" aria-label="Importados">
          <div className="op-list-head">
            <h2 className="vx-card-title">
              {filtered ? "Resultado" : "Importados"} <span className="tnum text-zinc-500">{visible.length}{visible.length !== all.length ? ` de ${all.length}` : ""}</span>
            </h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input className="vx-input vx-input--icon" placeholder="Buscar por nome, responsável, posição, cidade ou time" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar importados" />
            </div>
          </div>

          {selectable && visible.length > 0 && (
            <div className="im-selectall">
              <Tick on={allOn} partial={selRows.length > 0} label={allOn ? "Desmarcar todos" : `Marcar os ${visible.length} da lista`} onChange={() => setSelected(allOn ? new Set() : new Set(visible.map((r) => r.key)))} />
              <span>
                {selRows.length === 0
                  ? <>Marcar {filtered ? `os ${visible.length} do filtro` : `todos os ${visible.length}`}</>
                  : allOn ? <>Os {visible.length} {filtered ? "do filtro estão marcados" : "estão marcados"}</> : <><strong className="tnum">{selRows.length}</strong> marcados</>}
              </span>
              {selRows.length > 0 && !allOn && <button type="button" className="im-link" onClick={() => setSelected(new Set(visible.map((r) => r.key)))}>Marcar os {visible.length}</button>}
              {readyRows.length > 0 && readyRows.length < visible.length && (
                <button type="button" className="im-link" onClick={() => setSelected(new Set(readyRows.map((r) => r.key)))} title="Têm idade, posição, categoria, cidade e contexto do CRM">
                  Marcar só os {readyRows.length} com dados e contexto completos
                </button>
              )}
              {selRows.length > 0 && <button type="button" className="im-link" onClick={() => setSelected(new Set())}>Limpar</button>}
            </div>
          )}

          {visible.length ? (
            <ul className="op-rows im-rows">
              {visible.map((r, i) => (
                <ImportRowItem key={r.key} row={r} index={i} section={r.sectionId ? sectionById.get(r.sectionId) : undefined} batchDay={batch?.day ?? ""}
                  twinCount={twins.get(r.key)?.length ?? 0}
                  picked={selected.has(r.key)} active={itemKey === r.key} selectable={selectable} showKind={filters.kind === "todos"} onToggle={toggle} onOpen={open} />
              ))}
            </ul>
          ) : (
            <Empty icon={<UserSearch className="h-6 w-6" />} title={all.length ? "Ninguém com esses filtros" : "Nada importado ainda"}>
              {all.length
                ? <>Troque a busca ou <button type="button" className="im-link" onClick={clearFilters}>limpe os filtros</button>.</>
                : "Quando a wsltda.com enviar o contexto de leads e atletas, eles aparecem aqui."}
            </Empty>
          )}
        </aside>

        <section className="op-detail" aria-live="polite">
          {current ? (
            <ImportedDetail key={current.key} row={current} api={api} sections={sections} canScout={canScout} canAdmin={canAdmin} busy={busy}
              twins={twins.get(current.key) ?? NO_TWINS}
              onBack={() => setFilter({ item: "" })}
              onOpenTwin={(key) => setFilter({ item: key })}
              onSection={(id) => void moveTo(api, [current], id)}
              onApprove={(ok) => void approveRows(api, [current], ok)}
              onManage={() => setManager(true)}
              onDiscard={() => discard(api, current)} />
          ) : (
            <div className="vx-card op-pick">
              <Empty icon={<UserSearch className="h-6 w-6" />} title="Escolha um importado">
                À esquerda está tudo o que veio do CRM, com quem já tem os dados completos primeiro. Abra um para ver o contexto e dizer de onde veio. Para fazer em levas, marque vários (Shift marca do último ao clicado) e use a barra que aparece embaixo.
              </Empty>
            </div>
          )}
        </section>
      </div>

      {selectable && selRows.length > 0 && (
        <BulkBar rows={selRows} sections={sections} mode={mode} busy={busy} exporting={exporting} onMode={setMode} onClear={() => setSelected(new Set())}
          onMove={(id) => void moveTo(api, selRows, id)}
          onApprove={(ok, only) => void approveRows(api, only ?? selRows, ok, selRows)}
          onExport={() => void exportContext(api, selRows)}
          onCreate={(d) => void createAndMove(api, selRows, d)} />
      )}

      <SectionsDialog open={manager} onOpenChange={setManager} api={api} sections={sections} counts={counts} canAdmin={canAdmin} canScout={canScout}
        onSaved={(s) => secQ.set((prev) => { const list = prev ?? []; return list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s] })}
        onDeleted={(id) => {
          secQ.set((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
          rowsQ.set((prev) => (prev ? prev.map((r) => (r.sectionId === id ? { ...r, sectionId: null } : r)) : prev))
          if (filters.section === id) setFilter({ sub: "" })
          rowsQ.reload()
        }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

const ImportRowItem = memo(function ImportRowItem({ row, index, section, batchDay, twinCount, picked, active, selectable, showKind, onToggle, onOpen }: {
  row: ImportRow
  index: number
  section: ImportSection | undefined
  /** O dia da leva mais recente: quem chegou nela aparece como "Novo" ou "Reenviado". */
  batchDay: string
  /** Quantas outras pessoas têm o mesmo nome (jogadores ou outros importados). */
  twinCount: number
  picked: boolean
  active: boolean
  selectable: boolean
  showKind: boolean
  onToggle: (key: string, shift: boolean) => void
  onOpen: (key: string) => void
}) {
  const name = displayName(row)
  const empty = !row.hasContext
  return (
    <li className={`im-row ${picked ? "is-picked" : ""} ${active ? "is-on" : ""}`} style={{ "--i": Math.min(index, 10) } as CSSProperties}>
      {selectable && <Tick on={picked} label={`Marcar ${name}`} onChange={(shift) => onToggle(row.key, shift)} />}
      <button type="button" className="im-row-main" onClick={() => onOpen(row.key)} aria-current={active || undefined}>
        <Avatar name={name} size={36} />
        <span className="min-w-0 flex-1">
          <b className="block truncate">{name}</b>
          <small className="block truncate">{subline(row) || KIND_LABEL[row.kind]}</small>
          <span className="im-row-tags">
            <BasicsDots row={row} />
            {showKind && <KindBadge kind={row.kind} short />}
            <SectionChip section={section} />
            {(row.approvedAt !== null) && <StatusBadge row={row} />}
            {batchDay && <ArrivalTag row={row} day={batchDay} />}
            {row.wasProspect && <span className="im-tag-was" title="Veio antes como pré-cadastro e depois chegou como atleta: é o mesmo registro">Já era pré-cadastro</span>}
            {twinCount > 0 && <span className="im-tag-twin" title="Há outra pessoa com o mesmo nome. Pode ser a mesma que chegou por outro caminho: abra para conferir.">Mesmo nome</span>}
            {empty && <span className="im-tag-empty" title="O CRM não trouxe nenhum contexto"><CircleX aria-hidden="true" /> Sem contexto</span>}
          </span>
        </span>
      </button>
    </li>
  )
})

/** Barra fixa de ações em levas: mover para a subseção, aprovar (com a conferência do contexto), tirar a aprovação e baixar o contexto. */
function BulkBar({ rows, sections, mode, busy, exporting, onMode, onClear, onMove, onApprove, onExport, onCreate }: {
  rows: ImportRow[]
  sections: ImportSection[]
  mode: BarMode
  busy: boolean
  exporting: Exporting | null
  onMode: (m: BarMode) => void
  onClear: () => void
  onMove: (sectionId: string | null) => void
  onApprove: (approve: boolean, only?: ImportRow[]) => void
  onExport: () => void
  onCreate: (d: { name: string; note: string; color: string }) => void
}) {
  const plan = useMemo(() => planApproval(rows), [rows])
  const anyApproved = rows.some((r) => r.approvedAt !== null)
  const withContext = rows.filter((r) => r.hasContext).length
  const n = rows.length

  if (mode === "new") {
    return (
      <div className="im-bulk is-form" role="region" aria-label="Nova subseção para os selecionados">
        <p className="im-bulk-title">Nova subseção para {plural(n, "importado", "importados")}</p>
        <SectionForm compact initial={{ name: "", note: "", color: "#fbbf24" }} busy={busy} submitLabel="Criar e mover" onCancel={() => onMode("idle")} onSubmit={onCreate} />
      </div>
    )
  }

  if (mode === "approve") {
    const total = plan.toApprove.length
    const allComplete = plan.complete.length === total
    return (
      <div className="im-bulk is-plan" role="region" aria-label="Confirmar a aprovação">
        <div className="im-plan">
          <b>Aprovar {plural(total, "importado", "importados")}?</b>
          <p>Aprovar é dizer que a equipe conferiu. Os pré-cadastros aprovados passam a aparecer em Jogadores (só para a equipe). Ninguém é contatado e nenhum cadastro é criado.</p>
          <ul>
            {plan.complete.length > 0 && <li className="is-ok"><CheckCircle2 aria-hidden="true" /> {plan.complete.length} {plan.complete.length === 1 ? "tem" : "têm"} contexto e subseção.</li>}
            {plan.noSection.length > 0 && <li className="is-warn"><AlertTriangle aria-hidden="true" /> {plan.noSection.length} {plan.noSection.length === 1 ? "tem" : "têm"} contexto, mas ainda sem subseção (de onde {plan.noSection.length === 1 ? "veio" : "vieram"}?).</li>}
            {plan.empty.length > 0 && <li className="is-miss"><CircleX aria-hidden="true" /> {plan.empty.length} {plan.empty.length === 1 ? "não tem" : "não têm"} nenhum contexto do CRM.</li>}
            {plan.changed.length > 0 && <li className="is-warn"><AlertTriangle aria-hidden="true" /> {plan.changed.length} {plan.changed.length === 1 ? "já estava aprovado, mas mudou" : "já estavam aprovados, mas mudaram"}: aprovar de novo confere a versão nova.</li>}
            {plan.alreadyApproved.length > 0 && <li><BadgeCheck aria-hidden="true" /> {plan.alreadyApproved.length} {plan.alreadyApproved.length === 1 ? "já está aprovado e fica" : "já estão aprovados e ficam"} como {plan.alreadyApproved.length === 1 ? "está" : "estão"}.</li>}
          </ul>
        </div>
        <div className="im-plan-actions">
          <button type="button" className="vx-btn h-9" onClick={() => onMode("idle")} disabled={busy}>Cancelar</button>
          {!allComplete && plan.complete.length > 0 && (
            <button type="button" className="vx-btn vx-btn--gold h-9" disabled={busy} onClick={() => onApprove(true, plan.complete)}><BadgeCheck /> Aprovar só os {plan.complete.length} completos</button>
          )}
          <button type="button" className={`vx-btn h-9 ${allComplete ? "vx-btn--gold" : ""}`} disabled={busy} onClick={() => onApprove(true, plan.toApprove)}>
            <BadgeCheck /> {allComplete ? `Aprovar ${total}` : `Aprovar os ${total} mesmo assim`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="im-bulk" role="region" aria-label="Ações para os selecionados">
      <span className="im-bulk-count"><strong className="tnum">{n}</strong> {n === 1 ? "marcado" : "marcados"}</span>
      <div className="im-bulk-actions">
        <select className="vx-input vx-select im-bulk-select" value="" disabled={busy} aria-label="Mover os marcados para uma subseção"
          onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v === "__new") onMode("new"); else if (v === "__none") onMove(null); else if (v) onMove(v) }}>
          <option value="">Mover para a subseção…</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value="__none">Tirar da subseção</option>
          <option value="__new">+ Nova subseção…</option>
        </select>
        {plan.toApprove.length > 0 && (
          <button type="button" className="vx-btn vx-btn--gold" disabled={busy} onClick={() => onMode("approve")}><BadgeCheck /> Aprovar {plan.toApprove.length}</button>
        )}
        {anyApproved && <button type="button" className="vx-btn" disabled={busy} onClick={() => onApprove(false)}><RotateCcw /> Tirar a aprovação</button>}
        {withContext > 0 && (
          <button type="button" className="vx-btn" disabled={exporting !== null} onClick={onExport} title="Baixa um arquivo .md com o contexto dos marcados que têm contexto">
            <Download className={exporting ? "op-spin" : ""} /> {exporting ? `Preparando ${exporting.done} de ${exporting.total}…` : `Baixar contexto (${withContext})`}
          </button>
        )}
      </div>
      <button type="button" className="vx-icon-btn" onClick={onClear} aria-label="Limpar a seleção" title="Limpar a seleção"><X /></button>
    </div>
  )
}
