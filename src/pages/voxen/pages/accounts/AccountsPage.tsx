import "./accounts.css"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Ban, Binoculars, Check, CheckCircle2, Crown, Eye, Pencil, Power, Search, ShieldCheck, Trash2, UserRound, Users, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, Empty, PageSkeleton } from "../../ui"
import { useVoxen } from "../../store"
import { timeAgo } from "../../data"
import { LEVEL_BLURB, LEVEL_LABEL, type AccessLevel, type StaffRole } from "../../access"
import { getAccountsApi, type AccountRow, type AccountsApi } from "./api"
import { StaffCreator } from "./StaffCreator"

type Tab = "equipe" | "atletas"
type TeamFilter = "todos" | StaffRole

const LEVELS: AccessLevel[] = ["admin", "executive", "scout", "user"]
const LEVEL_ICON = { admin: Crown, executive: Eye, scout: Binoculars, user: UserRound } as const
/** Nome do cargo no plural, para os números e o filtro da equipe. */
const TEAM_PLURAL: Record<StaffRole, string> = { admin: "Administradores", executive: "Executivos", scout: "Scouts" }
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Chip do nível de acesso. */
function LevelChip({ level }: { level: AccessLevel }) {
  const Icon = LEVEL_ICON[level]
  return <span className={`ac-level is-${level}`}><Icon className="h-3 w-3" /> {LEVEL_LABEL[level]}</span>
}

export default function AccountsPage() {
  const { demo, canAdmin } = useVoxen()
  const { toast } = useToast()
  const [params] = useSearchParams()
  const focusId = params.get("conta")
  const [api, setApi] = useState<AccountsApi | null>(null)
  const [rows, setRows] = useState<AccountRow[] | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("equipe")
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("todos")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  // Ação que pede confirmação antes de valer: dar/tirar administrador e excluir conta.
  const [confirm, setConfirm] = useState<{ id: string; kind: "level" | "delete"; level?: AccessLevel } | null>(null)
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void getAccountsApi(demo).then((a) => { if (!cancelled) setApi(a) })
    return () => { cancelled = true }
  }, [demo])

  const load = useCallback(async () => {
    if (!api) return
    try {
      const data = await api.list()
      setRows(data.users)
      setMeId(data.me?.id ?? null)
      setError(null)
    } catch (e) {
      setError(errMsg(e))
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  // Veio de "Gerenciar acesso" no perfil de um atleta: abre a aba certa.
  useEffect(() => {
    const target = rows?.find((r) => r.id === focusId)
    if (!target) return
    setTab(target.level === "user" ? "atletas" : "equipe")
    setTeamFilter("todos")
    window.setTimeout(() => document.getElementById(`ac-${target.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 250)
  }, [focusId, rows])

  const team = useMemo(() => (rows ?? []).filter((r) => r.level !== "user").sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.fullName.localeCompare(b.fullName)), [rows])
  const athletes = useMemo(() => (rows ?? []).filter((r) => r.level === "user").sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [rows])
  const admins = team.filter((r) => r.level === "admin").length
  const executives = team.filter((r) => r.level === "executive").length
  const scouts = team.filter((r) => r.level === "scout").length
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = tab === "equipe" ? team.filter((r) => teamFilter === "todos" || r.level === teamFilter) : athletes
    return base.filter((r) => !q || `${r.fullName} ${r.email ?? ""}`.toLowerCase().includes(q))
  }, [tab, team, athletes, query, teamFilter])

  const run = async (id: string, job: () => Promise<void>, done: string) => {
    if (!canAdmin) return
    setBusy(id)
    try {
      await job()
      toast({ title: done })
      await load()
    } catch (e) {
      toast({ title: "Não foi possível concluir", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
      setConfirm(null)
    }
  }

  const changeLevel = (row: AccountRow, level: AccessLevel) => {
    if (!api || level === row.level) return
    // Mexer em administrador (dar ou tirar) pede confirmação; os demais valem na hora.
    if (level === "admin" || row.level === "admin") setConfirm({ id: row.id, kind: "level", level })
    else void run(row.id, () => api.setLevel(row.id, level), `${row.fullName || row.email}: agora ${LEVEL_LABEL[level].toLowerCase()}`)
  }

  if (error && !rows) {
    return (
      <section className="vx-card">
        <Empty icon={<ShieldCheck className="h-6 w-6" />} title="Não foi possível carregar as contas">
          {error}
        </Empty>
      </section>
    )
  }
  if (!rows) return <PageSkeleton />

  const disabledCount = rows.filter((r) => r.disabled).length
  const pending = rows.filter((r) => !r.confirmed).length

  return (
    <>
      <div className="ac-kpis">
        {[
          { label: "Administradores", value: admins, icon: Crown },
          { label: "Executivos", value: executives, icon: Eye },
          { label: "Scouts", value: scouts, icon: Binoculars },
          { label: "Atletas", value: athletes.length, icon: Users },
          { label: "Desativadas", value: disabledCount, icon: Ban },
        ].map((k) => (
          <section key={k.label} className="vx-card ac-kpi">
            <k.icon />
            <div><b className="tnum">{k.value}</b><span>{k.label}</span></div>
          </section>
        ))}
      </div>

      <section className="ac-legend" aria-label="O que cada acesso permite">
        {LEVELS.map((l) => {
          const Icon = LEVEL_ICON[l]
          return (
            <div key={l} className={`ac-legend-card is-${l}`}>
              <span className="ac-legend-icon"><Icon /></span>
              <div><b>{LEVEL_LABEL[l]}</b><p>{LEVEL_BLURB[l]}</p></div>
            </div>
          )
        })}
      </section>

      {canAdmin && api && <StaffCreator api={api} onDone={load} />}
      {!canAdmin && (
        <p className="ac-readonly"><Eye className="h-4 w-4" /> O seu acesso é de executivo: você vê as contas e os acessos, mas só um administrador pode alterar.</p>
      )}

      <section className="vx-card vx-card--flush">
        <div className="ac-toolbar">
          <div className="vx-tabs" role="tablist" aria-label="Tipo de conta">
            <button type="button" role="tab" aria-selected={tab === "equipe"} className={`vx-tab ${tab === "equipe" ? "is-on" : ""}`} onClick={() => setTab("equipe")}>
              Equipe <span className="ml-1 text-zinc-500 tnum">{team.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === "atletas"} className={`vx-tab ${tab === "atletas" ? "is-on" : ""}`} onClick={() => setTab("atletas")}>
              Atletas <span className="ml-1 text-zinc-500 tnum">{athletes.length}</span>
            </button>
          </div>
          {tab === "equipe" && (
            <div className="vx-chips" role="group" aria-label="Filtrar a equipe por nível">
              {([["todos", "Todos", team.length], ["admin", TEAM_PLURAL.admin, admins], ["executive", TEAM_PLURAL.executive, executives], ["scout", TEAM_PLURAL.scout, scouts]] as const).map(([key, label, n]) => (
                <button key={key} type="button" aria-pressed={teamFilter === key} className={`vx-chip ${teamFilter === key ? "is-on" : ""}`} onClick={() => setTeamFilter(key)}>
                  {label} <span className="tnum opacity-60">{n}</span>
                </button>
              ))}
            </div>
          )}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input className="vx-input vx-input--icon" placeholder="Buscar por nome ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar contas" />
          </div>
          {pending > 0 && <span className="text-[12px] text-zinc-500">{pending} sem confirmar o e-mail</span>}
        </div>

        {shown.length ? (
          <div className="overflow-x-auto">
            <table className="vx-table ac-table">
              <thead>
                <tr><th style={{ paddingLeft: 20 }}>Conta</th><th>Acesso</th><th>Status</th><th>Último acesso</th>{canAdmin && <th aria-label="Ações" />}</tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const isMe = r.id === meId
                  const lastAdmin = r.level === "admin" && admins <= 1
                  const asking = confirm?.id === r.id ? confirm : null
                  const label = r.fullName || r.email || "esta conta"
                  return (
                    <Fragment key={r.id}>
                    <tr id={`ac-${r.id}`} className={`${r.disabled ? "is-off" : ""} ${focusId === r.id ? "is-focus" : ""}`}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.fullName || r.email || "Conta"} size={34} />
                          <div className="min-w-0 max-w-[280px]">
                            {editing?.id === r.id ? (
                              <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); if (api && editing.name.trim().length >= 2) void run(r.id, async () => { await api.rename(r.id, editing.name.trim()); setEditing(null) }, "Nome atualizado") }}>
                                <input className="vx-input h-8 py-0 text-[13px]" value={editing.name} onChange={(e) => setEditing({ id: r.id, name: e.target.value })} autoFocus aria-label="Nome da conta" maxLength={120} />
                                <button type="submit" className="vx-icon-btn h-8 w-8" aria-label="Salvar nome" disabled={busy === r.id || editing.name.trim().length < 2}><Check /></button>
                                <button type="button" className="vx-icon-btn h-8 w-8" aria-label="Cancelar" onClick={() => setEditing(null)}><X /></button>
                              </form>
                            ) : (
                              <div className="truncate text-[13.5px] font-semibold text-white">
                                {r.fullName || <span className="text-zinc-500">Sem nome</span>}
                                {isMe && <span className="ac-you">você</span>}
                              </div>
                            )}
                            <div className="truncate text-[11.5px] text-zinc-500">{r.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {canAdmin && !isMe ? (
                          <select className="vx-input vx-select ac-select" value={r.level} disabled={busy === r.id || lastAdmin} aria-label={`Acesso de ${label}`}
                            title={lastAdmin ? "É o único administrador: promova outra pessoa antes." : undefined}
                            onChange={(e) => changeLevel(r, e.target.value as AccessLevel)}>
                            {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                          </select>
                        ) : <LevelChip level={r.level} />}
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {r.disabled
                            ? <span className="vx-tag" style={{ color: "#f87171", background: "rgba(248,113,113,.12)" }}><Ban className="h-3 w-3" /> Desativada</span>
                            : <span className="vx-tag" style={{ color: "#34d399", background: "rgba(52,211,153,.1)" }}><CheckCircle2 className="h-3 w-3" /> Ativa</span>}
                          {!r.confirmed && <span className="vx-tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.12)" }}>E-mail não confirmado</span>}
                          {r.provider === "google" && <span className="vx-tag" style={{ color: "#a1a1aa", background: "rgba(255,255,255,.06)" }}>Google</span>}
                        </div>
                      </td>
                      <td className="tnum text-zinc-400">{r.lastSignInAt ? timeAgo(r.lastSignInAt) : "Nunca entrou"}</td>
                      {canAdmin && (
                        <td>
                          <div className="ac-actions">
                            <button type="button" className="vx-icon-btn" title="Editar nome" aria-label={`Editar o nome de ${label}`} onClick={() => setEditing({ id: r.id, name: r.fullName })}><Pencil /></button>
                            {!isMe && (
                              <button type="button" className="vx-icon-btn" disabled={busy === r.id || (lastAdmin && !r.disabled)}
                                title={r.disabled ? "Reativar a conta" : lastAdmin ? "É o único administrador." : "Desativar o login desta conta"} aria-label={r.disabled ? `Reativar ${label}` : `Desativar ${label}`}
                                onClick={() => api && void run(r.id, () => api.setDisabled(r.id, !r.disabled), r.disabled ? "Conta reativada" : "Conta desativada")}>
                                <Power style={{ color: r.disabled ? "#a1a1aa" : "#34d399" }} />
                              </button>
                            )}
                            {!isMe && (
                              <button type="button" className="vx-icon-btn ac-danger" disabled={busy === r.id || lastAdmin} title={lastAdmin ? "É o único administrador." : "Excluir a conta"} aria-label={`Excluir ${label}`}
                                onClick={() => setConfirm({ id: r.id, kind: "delete" })}><Trash2 /></button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {asking && (
                      <tr className="ac-confirm-row">
                        <td colSpan={canAdmin ? 5 : 4}>
                          <div className="ac-confirm" role="alertdialog" aria-label="Confirmar">
                            <p>
                              {asking.kind === "delete"
                                ? <>Excluir <strong>{label}</strong>? A conta, o perfil e os dados dela são apagados e <strong>não dá para desfazer</strong>.</>
                                : asking.level === "admin"
                                  ? <>Dar <strong>acesso total</strong> a <strong>{label}</strong>? Essa pessoa poderá editar e excluir tudo na VOXEN.</>
                                  : <>Tirar o acesso de administrador de <strong>{label}</strong>?</>}
                            </p>
                            <div>
                              <button type="button" className="vx-btn" onClick={() => setConfirm(null)}>Cancelar</button>
                              <button type="button" className={`vx-btn ${asking.kind === "delete" ? "ac-btn-danger" : "vx-btn--gold"}`} disabled={busy === r.id}
                                onClick={() => api && void run(r.id,
                                  asking.kind === "delete" ? () => api.remove(r.id) : () => api.setLevel(r.id, asking.level ?? "user"),
                                  asking.kind === "delete" ? "Conta excluída" : "Acesso atualizado")}>
                                {asking.kind === "delete" ? "Excluir de vez" : "Confirmar"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<Users className="h-6 w-6" />} title={query ? "Nenhuma conta encontrada" : tab === "equipe" ? (teamFilter === "todos" ? "Ninguém na equipe ainda" : `Nenhum ${LEVEL_LABEL[teamFilter].toLowerCase()} por aqui`) : "Nenhum atleta com conta ainda"}>
            {tab === "atletas" ? "Quem criar uma conta no aizyron.com aparece aqui. Para dar acesso de equipe, escolha o nível na lista." : canAdmin ? "Use “Adicionar à equipe” acima para criar uma conta." : "Só um administrador pode adicionar pessoas à equipe."}
          </Empty>
        )}
      </section>
    </>
  )
}
