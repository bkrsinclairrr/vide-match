import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  CircleDot, Download, ExternalLink, Eye, Medal, Pencil, Plus, Power, Search, Trash2, UserCheck, Users, Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { formatDate } from "@/pages/voxen/data"
import { MemberAvatar } from "@/pages/membros/components/bits"
import { formatShortDate, positionCodeOf, resultOf, RESULT_COLORS, type Match, type MemberKind } from "@/pages/membros/model"
import type { MemberInput, ProfileListItem } from "@/pages/membros/api"
import { MemberForm, SetupNotice, inputFromMember, memberAreaUrl, useAdminSource, useSourceData } from "@/pages/voxen/pages/members/shared"
import { downloadFile, stamp } from "@/lib/exportFile"
import { useAthletes, type AthletesHook } from "@/pages/voxen/pages/athletes/api"
import { SectorBadge, SectorCard } from "@/pages/voxen/pages/athletes/bits"
import { draftFromMember, type Athlete } from "@/pages/voxen/pages/athletes/model"
import { useSendToSector } from "@/pages/voxen/pages/athletes/useSendToSector"
import { BulkBar, Check, DangerConfirm, Drawer } from "./parts"
import { membersCsv } from "./exports"
import { SyncCard } from "./SyncCard"

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
type Status = "todos" | "ativos" | "inativos" | "sem-conta"

/** Membros e referências: criar, editar, ativar/desativar, excluir e cuidar das partidas de cada um. */
export default function Members() {
  const source = useAdminSource()
  const { demo } = useVoxen()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const kind: MemberKind = params.get("tipo") === "referencias" ? "referencia" : "membro"
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<Status>(params.get("situacao") === "sem-conta" ? "sem-conta" : "todos")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(params.get("novo") === "1")
  const [editId, setEditId] = useState<string | null>(params.get("editar"))
  const [confirmRow, setConfirmRow] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [busy, setBusy] = useState(false)
  const list = useSourceData(source, (s) => s.listProfiles(), [])
  const sector = useAthletes()
  const { send, sending } = useSendToSector(sector)
  const sendToSector = async (items: ProfileListItem[]) => {
    const r = await send(items.filter((m) => m.kind === "membro").map(draftFromMember))
    return Boolean(r && (r.added.length || r.existing.length))
  }

  const all = useMemo(() => list.data ?? [], [list.data])
  const counts = useMemo(() => ({
    membro: all.filter((m) => m.kind === "membro").length,
    referencia: all.filter((m) => m.kind === "referencia").length,
  }), [all])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all
      .filter((m) => m.kind === kind)
      .filter((m) => status === "todos" || (status === "ativos" ? m.active : status === "inativos" ? !m.active : !m.userId))
      .filter((m) => !q || `${m.fullName} ${m.email ?? ""} ${m.position ?? ""} ${m.team ?? ""} ${m.city ?? ""}`.toLowerCase().includes(q))
  }, [all, kind, status, query])

  const editing = editId ? all.find((m) => m.id === editId) ?? null : null

  // Perfis excluídos saem da seleção.
  useEffect(() => {
    setSelected((s) => {
      const alive = new Set(all.map((m) => m.id))
      const next = new Set([...s].filter((id) => alive.has(id)))
      return next.size === s.size ? s : next
    })
  }, [all])

  if (list.error) return <SetupNotice error={list.error} />
  if (!list.data) return <PageSkeleton />

  const setKind = (k: MemberKind) => {
    setParams(k === "referencia" ? { tipo: "referencias" } : {}, { replace: true })
    setSelected(new Set())
    setCreating(false)
    setEditId(null)
  }

  const toggle = (id: string) => setSelected((s) => {
    const next = new Set(s)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const allOn = rows.length > 0 && rows.every((m) => selected.has(m.id))
  const someOn = rows.some((m) => selected.has(m.id))
  const togglePage = () => setSelected((s) => {
    const next = new Set(s)
    rows.forEach((m) => (allOn ? next.delete(m.id) : next.add(m.id)))
    return next
  })

  const save = async (input: MemberInput, message: string) => {
    if (!source) return false
    setBusy(true)
    try {
      const m = await source.saveMember(input)
      toast({ title: message, description: m.fullName })
      list.reload()
      return true
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
      return false
    } finally {
      setBusy(false)
    }
  }

  const setActive = (m: ProfileListItem, active: boolean) => save({ ...inputFromMember(m), active }, active ? "Perfil reativado" : "Perfil desativado")

  const remove = async (ids: string[]) => {
    if (!source) return
    setBusy(true)
    let done = 0
    let reason: string | null = null
    for (const id of ids) {
      try {
        await source.deleteMember(id)
        done++
      } catch (e) {
        reason ??= errMsg(e)
      }
    }
    setBusy(false)
    setConfirmRow(null)
    setConfirmBulk(false)
    setSelected(new Set())
    if (editId && ids.includes(editId)) setEditId(null)
    list.reload()
    if (done === ids.length) toast({ title: done === 1 ? "Perfil excluído" : `${done} perfis excluídos` })
    else toast({ title: `${done} excluído${done === 1 ? "" : "s"}, ${ids.length - done} não`, description: reason ?? undefined, variant: "destructive" })
  }

  const setActiveMany = async (active: boolean) => {
    if (!source) return
    setBusy(true)
    let done = 0
    for (const m of all.filter((x) => selected.has(x.id))) {
      try {
        await source.saveMember({ ...inputFromMember(m), active })
        done++
      } catch { /* conta só os que deram certo */ }
    }
    setBusy(false)
    list.reload()
    toast({ title: `${done} perfil${done === 1 ? "" : "s"} ${active ? "reativado" : "desativado"}${done === 1 ? "" : "s"}` })
  }

  const exportRows = (items: ProfileListItem[], name: string) => {
    downloadFile(`${name}-${stamp()}.csv`, membersCsv(items))
    toast({ title: "Arquivo gerado", description: `${items.length} perfil${items.length === 1 ? "" : "s"} em CSV.` })
  }

  const noun = kind === "membro" ? "membro" : "referência"

  return (
    <>
      <SyncCard onChanged={list.reload} />

      <section className="vx-card cn-filters">
        <div className="vx-tabs" role="tablist" aria-label="Tipo de perfil">
          <button type="button" role="tab" aria-selected={kind === "membro"} className={`vx-tab ${kind === "membro" ? "is-on" : ""}`} onClick={() => setKind("membro")}>
            Membros <span className="ml-1 text-zinc-500 tnum">{counts.membro}</span>
          </button>
          <button type="button" role="tab" aria-selected={kind === "referencia"} className={`vx-tab ${kind === "referencia" ? "is-on" : ""}`} onClick={() => setKind("referencia")}>
            Referências <span className="ml-1 text-zinc-500 tnum">{counts.referencia}</span>
          </button>
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" placeholder="Buscar por nome, e-mail, posição, time ou cidade" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar perfis" />
        </div>
        <div className="vx-chips" role="group" aria-label="Situação">
          {([["todos", "Todos"], ["ativos", "Ativos"], ["inativos", "Inativos"], ...(kind === "membro" ? [["sem-conta", "Aguardando 1º acesso"]] : [])] as [Status, string][]).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={status === k} className={`vx-chip ${status === k ? "is-on" : ""}`} onClick={() => setStatus(k)}>{label}</button>
          ))}
        </div>
        <button type="button" className="vx-btn vx-btn--gold" onClick={() => { setCreating(true); setEditId(null) }}><Plus /> {kind === "membro" ? "Novo membro" : "Nova referência"}</button>
      </section>

      <section className="vx-card vx-card--flush">
        <div className="cn-tablehead">
          <p><strong className="tnum">{rows.length}</strong> {noun}{rows.length === 1 ? "" : "s"}{rows.length !== counts[kind] && <> de <span className="tnum">{counts[kind]}</span></>}</p>
          <button type="button" className="vx-btn" disabled={!rows.length} onClick={() => exportRows(rows, kind === "membro" ? "membros" : "referencias")}><Download /> Exportar CSV</button>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="vx-table cn-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20, width: 52 }}><Check on={allOn} partial={someOn} label="Marcar todos" onChange={togglePage} /></th>
                  <th>{kind === "membro" ? "Membro" : "Referência"}</th>
                  <th>Posição</th>
                  {kind === "membro" && <th>Acesso</th>}
                  <th>Partidas</th>
                  <th>Última</th>
                  <th>Cadastro</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const picked = selected.has(m.id)
                  return (
                    <MemberRows key={m.id} m={m} picked={picked} confirming={confirmRow === m.id} busy={busy} demo={demo}
                      inSector={m.kind === "membro" ? sector.forMember(m) : null} canSend={m.kind === "membro" && sector.canEdit && !sending} onSend={() => void sendToSector([m])}
                      onPick={() => toggle(m.id)} onEdit={() => { setEditId(m.id); setCreating(false) }} onToggleActive={() => void setActive(m, !m.active)}
                      onAskDelete={() => setConfirmRow(m.id)} onCancelDelete={() => setConfirmRow(null)} onDelete={() => void remove([m.id])} />
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<Users className="h-6 w-6" />} title={query || status !== "todos" ? "Nenhum perfil encontrado" : `Nenhum${kind === "membro" ? " membro" : "a referência"} ainda`}>
            {kind === "membro"
              ? "Cadastre o atleta pelo botão acima. O acesso é liberado pelo e-mail dele."
              : "Crie perfis de referência por posição para os membros compararem o próprio jogo."}
          </Empty>
        )}
      </section>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size} noun="perfil" onClear={() => { setSelected(new Set()); setConfirmBulk(false) }}
          confirm={confirmBulk ? (
            <DangerConfirm title={`Excluir ${selected.size} perfil${selected.size === 1 ? "" : "s"}?`} typed={selected.size >= 3} busy={busy} confirmLabel={`Excluir ${selected.size}`}
              onCancel={() => setConfirmBulk(false)} onConfirm={() => void remove([...selected])}>
              As partidas e as ações marcadas de cada perfil também são apagadas e <strong>não dá para desfazer</strong>.
            </DangerConfirm>
          ) : undefined}
        >
          <button type="button" className="vx-btn" disabled={busy} onClick={() => void setActiveMany(true)}><Power style={{ color: "#34d399" }} /> Reativar</button>
          <button type="button" className="vx-btn" disabled={busy} onClick={() => void setActiveMany(false)}><Power /> Desativar</button>
          <button type="button" className="vx-btn" onClick={() => exportRows(all.filter((m) => selected.has(m.id)), "perfis-selecionados")}><Download /> Exportar</button>
          {kind === "membro" && sector.canEdit && (
            <button type="button" className="vx-btn vx-btn--gold" disabled={sending}
              onClick={() => void sendToSector(all.filter((m) => selected.has(m.id))).then((ok) => { if (ok) setSelected(new Set()) })}>
              <Medal /> {sending ? "Enviando..." : "Enviar para Atletas"}
            </button>
          )}
          <button type="button" className="vx-btn cn-btn-danger" onClick={() => setConfirmBulk(true)}><Trash2 /> Excluir</button>
        </BulkBar>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title={kind === "membro" ? "Novo membro" : "Nova referência"}
        subtitle={kind === "membro" ? "O atleta cria a conta em /login com este e-mail e já vê o que for publicado." : "Referências não têm login: servem de comparação para os membros."}>
        {creating && (
          <div className="cn-editor">
            <section className="vx-card">
              <MemberForm key={`novo-${kind}`} kind={kind} saving={busy} onCancel={() => setCreating(false)}
                onSave={async (input) => { if (await save(input, kind === "membro" ? "Membro cadastrado" : "Referência criada")) setCreating(false) }} />
            </section>
          </div>
        )}
      </Drawer>

      <Drawer open={Boolean(editing)} onClose={() => setEditId(null)} title={editing?.fullName ?? "Perfil"}
        subtitle={editing ? `${editing.kind === "membro" ? "Membro" : "Referência"}${editing.email ? ` · ${editing.email}` : ""}` : undefined}>
        {editing && source && (
          <MemberEditor key={editing.id} m={editing} source={source} busy={busy} demo={demo} sector={sector} sending={sending} onSend={() => void sendToSector([editing])}
            onSave={async (input) => { await save(input, "Dados salvos") }} onDelete={() => void remove([editing.id])} onChanged={list.reload} />
        )}
      </Drawer>
    </>
  )
}

/* ------------------------------------------------------------------ */

function MemberRows({
  m, picked, confirming, busy, demo, inSector, canSend, onSend, onPick, onEdit, onToggleActive, onAskDelete, onCancelDelete, onDelete,
}: {
  m: ProfileListItem
  picked: boolean
  confirming: boolean
  busy: boolean
  demo: boolean
  inSector: Athlete | null
  canSend: boolean
  onSend: () => void
  onPick: () => void
  onEdit: () => void
  onToggleActive: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  const isMember = m.kind === "membro"
  return (
    <>
      <tr className={picked ? "is-selected" : ""} onClick={onEdit}>
        <td style={{ paddingLeft: 20 }}><Check on={picked} label={`Marcar ${m.fullName}`} onChange={onPick} /></td>
        <td>
          <div className="flex items-center gap-3">
            <MemberAvatar member={m} size={34} />
            <div className="min-w-0 max-w-[300px]">
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" className="block min-w-0 truncate text-left text-[13.5px] font-semibold text-white hover:text-amber-300" onClick={(e) => { e.stopPropagation(); onEdit() }}>{m.fullName}</button>
                <SectorBadge a={inSector} />
              </div>
              <div className="truncate text-[11.5px] text-zinc-500">{m.email ?? m.team ?? "—"}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="flex items-center gap-2"><span className={`vx-pos ${m.position ? "" : "vx-pos--none"}`}>{positionCodeOf(m.position)}</span><span className="text-zinc-300">{m.category ?? <span className="text-zinc-600">—</span>}</span></div>
        </td>
        {isMember && (
          <td>
            {m.userId
              ? <span className="vx-tag" style={{ color: "#34d399", background: "rgba(52,211,153,.12)" }}><UserCheck className="h-3 w-3" /> Conta ativa</span>
              : <span className="vx-tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.12)" }}><CircleDot className="h-3 w-3" /> Aguardando 1º acesso</span>}
          </td>
        )}
        <td className="tnum text-zinc-300">{m.publishedCount}<span className="text-zinc-600"> / {m.matchCount}</span> <span className="text-[11px] text-zinc-500">publicadas</span></td>
        <td className="tnum text-zinc-400">{m.lastMatch ? formatShortDate(m.lastMatch) : "—"}</td>
        <td className="tnum text-zinc-400" title={m.createdAt}>{formatDate(m.createdAt)}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <button type="button" role="switch" aria-checked={m.active} className={`cn-switch ${m.active ? "is-on" : ""}`} onClick={onToggleActive} disabled={busy} aria-label={m.active ? `Desativar ${m.fullName}` : `Reativar ${m.fullName}`}>
            <span /> <em>{m.active ? "Ativo" : "Inativo"}</em>
          </button>
          {isMember && m.autoSync && <span className="cn-auto" title="Criado e mantido pela sincronização automática. Se você editar os dados, ele passa a ser da equipe.">Auto</span>}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="ac-actions">
            <button type="button" className="vx-icon-btn" title="Editar" aria-label={`Editar ${m.fullName}`} onClick={onEdit}><Pencil /></button>
            {isMember && !inSector && canSend && (
              <button type="button" className="vx-icon-btn at-send-btn" title="Enviar para Atletas" aria-label={`Enviar ${m.fullName} para o setor Atletas`} onClick={onSend}><Medal /></button>
            )}
            {isMember && <a className="vx-icon-btn" href={memberAreaUrl(m.id, "", demo)} target="_blank" rel="noopener noreferrer" title="Ver como membro" aria-label={`Ver a área de ${m.fullName}`}><Eye /></a>}
            <Link className="vx-icon-btn" to={`/voxen/membros/${m.id}`} target="_blank" title="Abrir na VOXEN" aria-label={`Abrir ${m.fullName} na VOXEN`}><ExternalLink /></Link>
            <button type="button" className="vx-icon-btn ac-danger" title="Excluir" aria-label={`Excluir ${m.fullName}`} onClick={onAskDelete}><Trash2 /></button>
          </div>
        </td>
      </tr>
      {confirming && (
        <tr className="ac-confirm-row">
          <td colSpan={isMember ? 9 : 8}>
            <DangerConfirm title={`Excluir ${m.fullName}?`} busy={busy} onCancel={onCancelDelete} onConfirm={onDelete}>
              {m.matchCount ? <>As <strong>{m.matchCount} partida{m.matchCount === 1 ? "" : "s"}</strong> e as ações marcadas também são apagadas e </> : "O perfil é apagado e "}
              <strong>não dá para desfazer</strong>.
            </DangerConfirm>
          </td>
        </tr>
      )}
    </>
  )
}

/** Gaveta do perfil: dados, partidas (publicar e excluir) e zona de risco. */
function MemberEditor({
  m, source, busy, demo, sector, sending, onSend, onSave, onDelete, onChanged,
}: {
  m: ProfileListItem
  source: NonNullable<ReturnType<typeof useAdminSource>>
  busy: boolean
  demo: boolean
  sector: AthletesHook
  sending: boolean
  onSend: () => void
  onSave: (input: MemberInput) => Promise<void>
  onDelete: () => void
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [tab, setTab] = useState<"dados" | "partidas">("dados")
  const [asking, setAsking] = useState(false)
  const bundle = useSourceData(source, (s) => s.getBundle(m.id, false), [m.id])
  const [matchBusy, setMatchBusy] = useState<string | null>(null)
  const [askMatch, setAskMatch] = useState<string | null>(null)
  const matches = [...(bundle.data?.matches ?? [])].sort((a, b) => b.playedOn.localeCompare(a.playedOn))

  const togglePublished = async (x: Match) => {
    setMatchBusy(x.id)
    try {
      const saved = await source.saveMatch({ ...x, published: !x.published })
      bundle.setData((b) => (b ? { ...b, matches: b.matches.map((y) => (y.id === saved.id ? saved : y)) } : b))
      toast({ title: saved.published ? "Partida publicada" : "Partida despublicada", description: `${saved.team} × ${saved.opponent}` })
      onChanged()
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: errMsg(e), variant: "destructive" })
    } finally {
      setMatchBusy(null)
    }
  }

  const removeMatch = async (x: Match) => {
    setMatchBusy(x.id)
    try {
      await source.deleteMatch(x.id)
      bundle.setData((b) => (b ? { ...b, matches: b.matches.filter((y) => y.id !== x.id) } : b))
      toast({ title: "Partida excluída", description: `${x.team} × ${x.opponent}` })
      setAskMatch(null)
      onChanged()
    } catch (e) {
      toast({ title: "Não foi possível excluir", description: errMsg(e), variant: "destructive" })
    } finally {
      setMatchBusy(null)
    }
  }

  return (
    <div className="cn-editor">
      <div className="vx-tabs self-start" role="tablist" aria-label="Seções do perfil">
        <button type="button" role="tab" aria-selected={tab === "dados"} className={`vx-tab ${tab === "dados" ? "is-on" : ""}`} onClick={() => setTab("dados")}>Dados</button>
        <button type="button" role="tab" aria-selected={tab === "partidas"} className={`vx-tab ${tab === "partidas" ? "is-on" : ""}`} onClick={() => setTab("partidas")}>
          Partidas <span className="ml-1 text-zinc-500 tnum">{bundle.data ? matches.length : m.matchCount}</span>
        </button>
      </div>

      {tab === "dados" ? (
        <section className="vx-card">
          <MemberForm kind={m.kind} initial={inputFromMember(m)} saving={busy} onSave={onSave} />
          {m.kind === "membro" && m.userId && <p className="mt-4 text-[12px] text-zinc-500">A conta de login está ligada a este perfil. Mudar o e-mail aqui não altera o e-mail da conta.</p>}
          {m.kind === "membro" && m.autoSync && (
            <p className="cn-auto-note"><Zap className="h-3.5 w-3.5" /> Este membro é automático: acompanha o cadastro do funil ou da conta. Se você salvar mudanças nos dados aqui, ele passa a ser só da equipe e deixa de ser sobrescrito.</p>
          )}
        </section>
      ) : (
        <section className="vx-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-zinc-400">Publicada: o membro vê na área dele. Os lances marcados no vídeo são editados na VOXEN.</p>
            <Link className="vx-btn" to={`/voxen/membros/${m.id}/partidas/nova`} target="_blank"><Plus /> Nova partida</Link>
          </div>
          {bundle.loading && !bundle.data ? <p className="text-[13px] text-zinc-500">Carregando as partidas…</p> : matches.length === 0 ? (
            <Empty icon={<Users className="h-6 w-6" />} title="Nenhuma partida ainda">Cadastre a primeira partida na VOXEN para marcar os lances do vídeo.</Empty>
          ) : (
            <ul className="cn-matches">
              {matches.map((x) => {
                const r = resultOf(x)
                return (
                  <li key={x.id}>
                    <div className="cn-match-row">
                      <span className="cn-match-res" style={r ? { color: RESULT_COLORS[r], borderColor: `${RESULT_COLORS[r]}55`, background: `${RESULT_COLORS[r]}14` } : undefined}>{r ?? "—"}</span>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[13.5px]">{x.team} {x.goalsFor ?? "–"} × {x.goalsAgainst ?? "–"} {x.opponent}</b>
                        <span className="text-[12px] text-zinc-500">{formatShortDate(x.playedOn)}{x.competition ? ` · ${x.competition}` : ""}</span>
                      </div>
                      <button type="button" role="switch" aria-checked={x.published} disabled={matchBusy === x.id} className={`cn-switch ${x.published ? "is-on" : ""}`} onClick={() => void togglePublished(x)} aria-label={x.published ? "Despublicar a partida" : "Publicar a partida"}>
                        <span /> <em>{x.published ? "Publicada" : "Rascunho"}</em>
                      </button>
                      <Link className="vx-icon-btn" to={`/voxen/membros/${m.id}/partidas/${x.id}`} target="_blank" title="Editar lances na VOXEN" aria-label="Editar a partida e os lances na VOXEN"><ExternalLink /></Link>
                      <button type="button" className="vx-icon-btn ac-danger" title="Excluir a partida" aria-label="Excluir a partida" onClick={() => setAskMatch(askMatch === x.id ? null : x.id)}><Trash2 /></button>
                    </div>
                    {askMatch === x.id && (
                      <DangerConfirm title="Excluir esta partida?" busy={matchBusy === x.id} onCancel={() => setAskMatch(null)} onConfirm={() => void removeMatch(x)}>
                        Os lances marcados no vídeo também são apagados e <strong>não dá para desfazer</strong>.
                      </DangerConfirm>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {m.kind === "membro" && tab === "dados" && (
        <SectorCard a={sector.forMember(m)} missing={sector.missing} canEdit={sector.canEdit} sending={sending} onSend={onSend} />
      )}

      {m.kind === "membro" && (
        <section className="vx-card">
          <h3 className="vx-card-title">Ver como o membro vê</h3>
          <p className="vx-card-sub mb-4">Abre a área do atleta em modo leitura, para conferir o que ele enxerga.</p>
          <a className="vx-btn" href={memberAreaUrl(m.id, "", demo)} target="_blank" rel="noopener noreferrer"><Eye /> Abrir a área dele</a>
        </section>
      )}

      <section className="vx-card cn-risk">
        <h3 className="vx-card-title">Zona de risco</h3>
        {asking ? (
          <div className="mt-4">
            <DangerConfirm title={`Excluir ${m.fullName}?`} busy={busy} onCancel={() => setAsking(false)} onConfirm={onDelete}>
              {m.matchCount ? <>As <strong>{m.matchCount} partida{m.matchCount === 1 ? "" : "s"}</strong> e os lances também são apagados e </> : "O perfil é apagado e "}<strong>não dá para desfazer</strong>.
            </DangerConfirm>
          </div>
        ) : (
          <div className="cn-risk-row">
            <p>Excluir apaga o perfil, as partidas e os lances marcados. A conta de login, se existir, continua.</p>
            <button type="button" className="vx-btn cn-btn-danger" onClick={() => setAsking(true)}><Trash2 /> Excluir perfil</button>
          </div>
        )}
      </section>
    </div>
  )
}
