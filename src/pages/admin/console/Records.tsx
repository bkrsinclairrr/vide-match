import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Download, ExternalLink, Pencil, Search, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, Empty, PosBadge } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import {
  STAGES, formatDate, formatPhone, placeOf, timeAgo, type Player, type StageKey,
} from "@/pages/voxen/data"
import PlayerEditor from "@/pages/voxen/pages/PlayerEditor"
import { downloadFile, stamp } from "@/lib/exportFile"
import { BulkBar, Check, DangerConfirm, Drawer, Pager } from "./parts"
import { playersCsv } from "./exports"

const PAGE = 20
const SORTS = [
  ["recentes", "Mais recentes"],
  ["antigos", "Mais antigos"],
  ["nome", "Nome (A–Z)"],
  ["nota", "Maior nota"],
] as const
type Sort = (typeof SORTS)[number][0]

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Cadastros: todos os leads do funil e as contas de atletas, com edição, exclusão e ações em massa. */
export default function Records() {
  const { players, updateMeta, removePlayer, removePlayers, byKey } = useVoxen()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get("busca") ?? "")
  const [kind, setKind] = useState<"todos" | "funil" | "conta">((["funil", "conta"] as const).find((k) => k === params.get("tipo")) ?? "todos")
  const [stage, setStage] = useState<"" | StageKey>((STAGES.find((s) => s.key === params.get("etapa"))?.key as StageKey | undefined) ?? "")
  const [category, setCategory] = useState(params.get("categoria") ?? "")
  const [incomplete, setIncomplete] = useState(params.get("filtro") === "sem-perfil")
  const [sort, setSort] = useState<Sort>("recentes")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmRow, setConfirmRow] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [busy, setBusy] = useState(false)
  const editKey = params.get("editar")
  const editing = editKey ? byKey.get(editKey) ?? null : null

  const categories = useMemo(() => [...new Set(players.map((p) => p.profile.category).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true })), [players])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = players.filter((p) => {
      if (kind !== "todos" && p.source !== kind) return false
      if (stage && p.meta.stage !== stage) return false
      if (category && p.profile.category !== category) return false
      if (incomplete && p.hasProfile) return false
      if (!q) return true
      return `${p.name} ${p.email ?? ""} ${p.phone ?? ""} ${p.profile.city ?? ""} ${p.profile.position ?? ""}`.toLowerCase().includes(q)
    })
    if (sort === "antigos") rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    else if (sort === "nome") rows.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    else if (sort === "nota") rows.sort((a, b) => b.overall - a.overall)
    return rows
  }, [players, query, kind, stage, category, incomplete, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE, current * PAGE)
  const pickedRows = rows.filter((p) => selected.has(p.key))
  const filterCount = [kind !== "todos", stage, category, incomplete].filter(Boolean).length

  // Registros que deixaram de existir (excluídos) saem da seleção.
  useEffect(() => {
    setSelected((s) => {
      const alive = new Set(players.map((p) => p.key))
      const next = new Set([...s].filter((k) => alive.has(k)))
      return next.size === s.size ? s : next
    })
  }, [players])

  const reset = () => setPage(1)
  const clearFilters = () => { setKind("todos"); setStage(""); setCategory(""); setIncomplete(false); setQuery(""); reset() }

  const toggle = (key: string) => setSelected((s) => {
    const next = new Set(s)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  const togglePage = () => setSelected((s) => {
    const next = new Set(s)
    const all = rows.every((p) => next.has(p.key))
    rows.forEach((p) => (all ? next.delete(p.key) : next.add(p.key)))
    return next
  })
  const selectAllFiltered = () => setSelected(new Set(filtered.map((p) => p.key)))

  const openEditor = (key: string | null) => {
    const next = new URLSearchParams(params)
    if (key) next.set("editar", key)
    else next.delete("editar")
    setParams(next, { replace: true })
  }

  const setStageOf = (p: Player, value: StageKey) => {
    if (value !== p.meta.stage) void updateMeta(p.key, { stage: value })
  }

  const deleteOne = async (p: Player) => {
    setBusy(true)
    try {
      await removePlayer(p.key)
      toast({ title: "Cadastro excluído", description: p.name })
      setConfirmRow(null)
      if (editKey === p.key) openEditor(null)
    } catch (e) {
      toast({ title: "Não foi possível excluir", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const deleteMany = async () => {
    setBusy(true)
    try {
      const r = await removePlayers([...selected])
      if (r.failed.length) {
        toast({ title: `${r.removed} excluído${r.removed === 1 ? "" : "s"}, ${r.failed.length} não`, description: r.reason ?? "O banco recusou alguns registros.", variant: "destructive" })
        setSelected(new Set(r.failed))
      } else {
        toast({ title: `${r.removed} cadastro${r.removed === 1 ? "" : "s"} excluído${r.removed === 1 ? "" : "s"}` })
        setSelected(new Set())
      }
      setConfirmBulk(false)
    } catch (e) {
      toast({ title: "Não foi possível excluir", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const setStageMany = (value: StageKey) => {
    for (const key of selected) void updateMeta(key, { stage: value })
    toast({ title: "Etapa atualizada", description: `${selected.size} cadastro${selected.size === 1 ? "" : "s"} em “${STAGES.find((s) => s.key === value)?.label}”.` })
  }

  const exportRows = (list: Player[], name: string) => {
    downloadFile(`${name}-${stamp()}.csv`, playersCsv(list))
    toast({ title: "Arquivo gerado", description: `${list.length} cadastro${list.length === 1 ? "" : "s"} em CSV.` })
  }

  return (
    <>
      <section className="vx-card cn-filters">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" placeholder="Buscar por nome, e-mail, telefone, cidade ou posição" value={query} onChange={(e) => { setQuery(e.target.value); reset() }} aria-label="Buscar cadastros" />
        </div>
        <div className="vx-tabs" role="group" aria-label="Tipo de cadastro">
          {([["todos", "Todos"], ["funil", "Funil"], ["conta", "Contas"]] as const).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={kind === k} className={`vx-tab ${kind === k ? "is-on" : ""}`} onClick={() => { setKind(k); reset() }}>{label}</button>
          ))}
        </div>
        <select className="vx-input vx-select vx-filter" value={stage} onChange={(e) => { setStage(e.target.value as StageKey | ""); reset() }} aria-label="Etapa">
          <option value="">Todas as etapas</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="vx-input vx-select vx-filter" value={category} onChange={(e) => { setCategory(e.target.value); reset() }} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" aria-pressed={incomplete} className={`vx-chip ${incomplete ? "is-on" : ""}`} onClick={() => { setIncomplete((v) => !v); reset() }}>Sem perfil completo</button>
        <select className="vx-input vx-select vx-filter" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar por">
          {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </section>

      <section className="vx-card vx-card--flush">
        <div className="cn-tablehead">
          <p>
            <strong className="tnum">{filtered.length}</strong> cadastro{filtered.length === 1 ? "" : "s"}
            {filtered.length !== players.length && <> de <span className="tnum">{players.length}</span></>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {filterCount > 0 && <button type="button" className="vx-chip" onClick={clearFilters}><X className="h-3.5 w-3.5" /> Limpar filtros ({filterCount})</button>}
            <button type="button" className="vx-btn" disabled={!filtered.length} onClick={() => exportRows(filtered, "cadastros")}><Download /> Exportar CSV</button>
          </div>
        </div>

        {pickedRows.length === rows.length && rows.length > 0 && filtered.length > rows.length && selected.size < filtered.length && (
          <div className="cn-selectall">
            Os {rows.length} desta página estão marcados.
            <button type="button" onClick={selectAllFiltered}>Marcar os {filtered.length} do filtro</button>
          </div>
        )}

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="vx-table cn-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20, width: 52 }}>
                    <Check on={pickedRows.length === rows.length} partial={pickedRows.length > 0} label="Marcar todos desta página" onChange={togglePage} />
                  </th>
                  <th>Atleta</th>
                  <th>Tipo</th>
                  <th>Posição</th>
                  <th>Cidade</th>
                  <th>Etapa</th>
                  <th>Entrada</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const picked = selected.has(p.key)
                  return (
                    <RowGroup key={p.key} player={p} picked={picked} confirming={confirmRow === p.key} busy={busy}
                      onPick={() => toggle(p.key)} onEdit={() => openEditor(p.key)} onAskDelete={() => setConfirmRow(p.key)}
                      onCancelDelete={() => setConfirmRow(null)} onDelete={() => void deleteOne(p)} onStage={(v) => setStageOf(p, v)} />
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<Users className="h-6 w-6" />} title={players.length ? "Nenhum cadastro com esses filtros" : "Nenhum cadastro ainda"}>
            {players.length ? "Ajuste a busca ou limpe os filtros para ver todos." : "Quem preencher o funil ou criar uma conta aparece aqui."}
          </Empty>
        )}
        <Pager page={current} pages={pages} total={filtered.length} size={PAGE} onPage={setPage} />
      </section>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size} noun="cadastro" onClear={() => { setSelected(new Set()); setConfirmBulk(false) }}
          confirm={confirmBulk ? (
            <DangerConfirm
              title={`Excluir ${selected.size} cadastro${selected.size === 1 ? "" : "s"}?`} typed={selected.size >= 5} busy={busy}
              confirmLabel={`Excluir ${selected.size}`} onCancel={() => setConfirmBulk(false)} onConfirm={() => void deleteMany()}
            >
              Os dados e as anotações da equipe são apagados e <strong>não dá para desfazer</strong>. As contas de login não são removidas.
            </DangerConfirm>
          ) : undefined}
        >
          <select className="vx-input vx-select cn-bulk-select" value="" onChange={(e) => e.target.value && setStageMany(e.target.value as StageKey)} aria-label="Mudar a etapa dos selecionados">
            <option value="">Mudar etapa…</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button type="button" className="vx-btn" onClick={() => exportRows(players.filter((p) => selected.has(p.key)), "cadastros-selecionados")}><Download /> Exportar</button>
          <button type="button" className="vx-btn cn-btn-danger" onClick={() => setConfirmBulk(true)}><Trash2 /> Excluir</button>
        </BulkBar>
      )}

      <Drawer
        open={Boolean(editing)}
        onClose={() => openEditor(null)}
        title={editing?.name ?? "Cadastro"}
        subtitle={editing ? `${editing.source === "funil" ? "Lead do funil" : "Conta de atleta"} · entrou ${timeAgo(editing.createdAt)}` : undefined}
      >
        {editing && <EditorBody key={editing.key} player={editing} onClose={() => openEditor(null)} onDelete={() => deleteOne(editing)} busy={busy} />}
      </Drawer>
    </>
  )
}

/* ------------------------------------------------------------------ */

function RowGroup({
  player: p, picked, confirming, busy, onPick, onEdit, onAskDelete, onCancelDelete, onDelete, onStage,
}: {
  player: Player
  picked: boolean
  confirming: boolean
  busy: boolean
  onPick: () => void
  onEdit: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
  onStage: (s: StageKey) => void
}) {
  const stage = STAGES.find((s) => s.key === p.meta.stage) ?? STAGES[0]
  return (
    <>
      <tr className={`${picked ? "is-selected" : ""} ${confirming ? "is-asking" : ""}`} onClick={onEdit}>
        <td style={{ paddingLeft: 20 }}><Check on={picked} label={`Marcar ${p.name}`} onChange={onPick} /></td>
        <td>
          <div className="flex items-center gap-3">
            <Avatar name={p.name} size={34} />
            <div className="min-w-0 max-w-[260px]">
              <button type="button" className="block max-w-full truncate text-left text-[13.5px] font-semibold text-white hover:text-amber-300" onClick={(e) => { e.stopPropagation(); onEdit() }}>{p.name}</button>
              <div className="truncate text-[11.5px] text-zinc-500">{p.email ?? (p.phone ? formatPhone(p.phone) : "Sem contato")}</div>
            </div>
          </div>
        </td>
        <td>
          {p.source === "funil"
            ? <span className="vx-tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.12)" }}>Funil</span>
            : <span className="vx-tag" style={{ color: "#7dd3fc", background: "rgba(56,189,248,.12)" }}><UserRound className="h-3 w-3" /> Conta</span>}
        </td>
        <td>
          <div className="flex items-center gap-2"><PosBadge player={p} /><span className="text-zinc-300">{p.profile.category ?? <span className="text-zinc-600">—</span>}</span></div>
        </td>
        <td className="max-w-[160px] truncate text-zinc-400">{placeOf(p) ?? <span className="text-zinc-600">—</span>}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <label className="cn-stage" style={{ "--c": stage.color } as React.CSSProperties}>
            <span className="vx-stage-dot" style={{ background: stage.color }} />
            <select value={p.meta.stage} onChange={(e) => onStage(e.target.value as StageKey)} aria-label={`Etapa de ${p.name}`}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
        </td>
        <td className="tnum text-zinc-400" title={p.createdAt}>{formatDate(p.createdAt)}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="ac-actions">
            <button type="button" className="vx-icon-btn" title="Editar" aria-label={`Editar ${p.name}`} onClick={onEdit}><Pencil /></button>
            <Link className="vx-icon-btn" to={`/voxen/jogadores/${encodeURIComponent(p.key)}`} target="_blank" title="Abrir na VOXEN" aria-label={`Abrir ${p.name} na VOXEN`}><ExternalLink /></Link>
            <button type="button" className="vx-icon-btn ac-danger" title="Excluir" aria-label={`Excluir ${p.name}`} onClick={onAskDelete}><Trash2 /></button>
          </div>
        </td>
      </tr>
      {confirming && (
        <tr className="ac-confirm-row">
          <td colSpan={8}>
            <DangerConfirm title={`Excluir ${p.name}?`} busy={busy} onCancel={onCancelDelete} onConfirm={onDelete}>
              O cadastro e as anotações da equipe são apagados e <strong>não dá para desfazer</strong>.
              {p.userId && " A conta de login desta pessoa não é removida: use Contas e acessos para isso."}
            </DangerConfirm>
          </td>
        </tr>
      )}
    </>
  )
}

/** Conteúdo da gaveta: editar o cadastro, acompanhar (etapa e notas), ver informações e excluir. */
function EditorBody({ player: p, onClose, onDelete, busy }: { player: Player; onClose: () => void; onDelete: () => void; busy: boolean }) {
  const { updateMeta } = useVoxen()
  const [asking, setAsking] = useState(false)
  const [notes, setNotes] = useState(p.meta.notes)

  return (
    <div className="cn-editor">
      <PlayerEditor p={p} onClose={onClose} />

      <section className="vx-card">
        <h3 className="vx-card-title">Acompanhamento</h3>
        <p className="vx-card-sub mb-4">Etapa no funil comercial e anotações internas da equipe.</p>
        <div className="vx-stages" role="group" aria-label="Etapa">
          {STAGES.map((s) => (
            <button key={s.key} type="button" aria-pressed={p.meta.stage === s.key} className={`vx-stage-btn ${p.meta.stage === s.key ? "is-on" : ""}`}
              style={p.meta.stage === s.key ? { color: s.color, borderColor: `${s.color}66`, background: `${s.color}1a` } : undefined}
              onClick={() => void updateMeta(p.key, { stage: s.key })}>
              <span className="vx-stage-dot" style={{ background: s.color }} /> {s.label}
            </button>
          ))}
        </div>
        <label className="cn-notes">
          <span>Notas da equipe</span>
          <textarea className="vx-input vx-textarea" style={{ minHeight: 110 }} maxLength={4000} value={notes} placeholder="O que a equipe combinou, observações do scout…"
            onChange={(e) => { setNotes(e.target.value); void updateMeta(p.key, { notes: e.target.value }) }} />
        </label>
      </section>

      <section className="vx-card">
        <h3 className="vx-card-title">Informações</h3>
        <dl className="vx-dl mt-4">
          <div><dt>Tipo</dt><dd>{p.source === "funil" ? "Lead do funil" : "Conta de atleta"}</dd></div>
          <div><dt>Origem</dt><dd>{p.origin}</dd></div>
          <div><dt>Entrada</dt><dd>{formatDate(p.createdAt)}</dd></div>
          <div><dt>Nota geral</dt><dd>{p.overall}</dd></div>
          {p.utm.campaign && <div><dt>Campanha</dt><dd title={p.utm.campaign}>{p.utm.campaign}</dd></div>}
          {p.utm.medium && <div><dt>Mídia</dt><dd>{p.utm.medium}</dd></div>}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="vx-btn" to={`/voxen/jogadores/${encodeURIComponent(p.key)}`} target="_blank"><ExternalLink /> Abrir na VOXEN</Link>
          {p.userId && <Link className="vx-btn" to={`/admin/contas?conta=${p.userId}`}><ShieldCheck /> Gerenciar o acesso</Link>}
        </div>
      </section>

      <section className="vx-card cn-risk">
        <h3 className="vx-card-title">Zona de risco</h3>
        {asking ? (
          <div className="mt-4">
            <DangerConfirm title={`Excluir ${p.name}?`} busy={busy} onCancel={() => setAsking(false)} onConfirm={onDelete}>
              O cadastro e as anotações da equipe são apagados e <strong>não dá para desfazer</strong>.
            </DangerConfirm>
          </div>
        ) : (
          <div className="cn-risk-row">
            <p>Excluir o cadastro apaga o registro e as anotações. A conta de login, se existir, continua.</p>
            <button type="button" className="vx-btn cn-btn-danger" onClick={() => setAsking(true)}><Trash2 /> Excluir cadastro</button>
          </div>
        )}
      </section>
    </div>
  )
}
