import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight, BadgeCheck, CheckCircle2, Clock, Download, Eye, FileClock, MailWarning, Pencil, Plus, ShieldCheck, UserCog, UserPlus, Users,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Avatar, CardHead, Empty, StageTag } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { timeAgo } from "@/pages/voxen/data"
import { hasAccount } from "@/pages/voxen/people"
import { CountUp, Donut, Sparkline } from "@/pages/voxen/charts"
import { LEVEL_LABEL } from "@/pages/voxen/access"
import { getAccountsApi, type AccountRow } from "@/pages/voxen/pages/accounts/api"
import { SetupNotice, useAdminSource, useSourceData } from "@/pages/voxen/pages/members/shared"
import { downloadFile, stamp } from "@/lib/exportFile"
import { playersCsv } from "./exports"

const DAY = 86400000

function greeting() {
  const h = new Date().getHours()
  return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite"
}

type Attention = { key: string; icon: typeof Users; tone: "warn" | "info" | "danger"; title: string; text: string; count: number; to: string; action: string }

/** Painel inicial: números da operação, o que precisa de atenção e a atividade recente. */
export default function Dashboard() {
  const { players, demo, data } = useVoxen()
  const { user } = useAuth()
  const { toast } = useToast()
  const source = useAdminSource()
  const members = useSourceData(source, (s) => s.listProfiles(), [])
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null)
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const first = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "").trim().split(/\s+/)[0]

  useEffect(() => {
    let cancelled = false
    void getAccountsApi(demo)
      .then((api) => api.list())
      .then((d) => { if (!cancelled) setAccounts(d.users) })
      .catch((e) => { if (!cancelled) setAccountsError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [demo])

  const stats = useMemo(() => {
    const now = Date.now()
    const t = (iso: string) => new Date(iso).getTime()
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const daily14 = Array.from({ length: 14 }, (_, i) => {
      const end = midnight.getTime() + DAY - (13 - i) * DAY
      return players.filter((p) => t(p.createdAt) >= end - DAY && t(p.createdAt) < end).length
    })
    const week = players.filter((p) => now - t(p.createdAt) < 7 * DAY).length
    const leads = players.filter((p) => p.source === "funil")
    const accountsOfAthletes = players.filter(hasAccount)
    const coldLeads = leads.filter((p) => p.meta.stage === "novo" && now - t(p.createdAt) > 3 * DAY)
    const noProfile = players.filter((p) => !p.hasProfile)
    return { daily14, week, leads: leads.length, athletes: accountsOfAthletes.length, coldLeads: coldLeads.length, noProfile: noProfile.length }
  }, [players])

  const memberRows = members.data ?? []
  const onlyMembers = memberRows.filter((m) => m.kind === "membro")
  const waiting = onlyMembers.filter((m) => !m.userId).length
  const matchTotal = memberRows.reduce((a, m) => a + m.matchCount, 0)
  const drafts = memberRows.reduce((a, m) => a + (m.matchCount - m.publishedCount), 0)

  const accs = accounts ?? []
  const admins = accs.filter((a) => a.level === "admin").length
  const execs = accs.filter((a) => a.level === "executive").length
  const scouts = accs.filter((a) => a.level === "scout").length
  const athletes = accs.filter((a) => a.level === "user").length
  const unconfirmed = accs.filter((a) => !a.confirmed && !a.disabled).length
  const disabled = accs.filter((a) => a.disabled).length

  const attention = ([
    { key: "cold", icon: Clock, tone: "warn", title: "Leads sem contato há mais de 3 dias", text: "Entraram pelo funil e ainda estão em “Novo”.", count: stats.coldLeads, to: "/admin/cadastros?tipo=funil&etapa=novo", action: "Ver leads" },
    { key: "noprofile", icon: UserCog, tone: "info", title: "Cadastros sem perfil completo", text: "Faltam posição, categoria ou cidade.", count: stats.noProfile, to: "/admin/cadastros?filtro=sem-perfil", action: "Completar" },
    { key: "unconfirmed", icon: MailWarning, tone: "warn", title: "Contas que não confirmaram o e-mail", text: "Ainda não conseguem entrar.", count: unconfirmed, to: "/admin/contas", action: "Ver contas" },
    { key: "waiting", icon: BadgeCheck, tone: "info", title: "Membros aguardando o primeiro acesso", text: "Cadastrados, mas sem conta criada.", count: waiting, to: "/admin/membros?situacao=sem-conta", action: "Ver membros" },
    { key: "drafts", icon: FileClock, tone: "info", title: "Partidas em rascunho", text: "O membro só vê o que está publicado.", count: drafts, to: "/admin/membros", action: "Revisar" },
    { key: "disabled", icon: ShieldCheck, tone: "danger", title: "Contas desativadas", text: "Sem acesso até serem reativadas.", count: disabled, to: "/admin/contas", action: "Ver contas" },
  ] as Attention[]).filter((a) => a.count > 0)

  const exportAll = () => {
    downloadFile(`cadastros-${stamp()}.csv`, playersCsv(players))
    toast({ title: "Arquivo gerado", description: `${players.length} cadastros em CSV.` })
  }

  const slices = [
    { label: "Administradores", value: admins, color: "#fbbf24" },
    { label: "Executivos", value: execs, color: "#38bdf8" },
    { label: "Scouts", value: scouts, color: "#a78bfa" },
    { label: "Atletas", value: athletes, color: "#a1a1aa" },
  ].filter((s) => s.value > 0)
  const [slice, setSlice] = useState<number | null>(null)
  const active = slice !== null ? slices[slice] ?? null : null

  const recentAccounts = [...accs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="vx-hello">
            <span className="vx-live" aria-hidden="true" />
            <span className="text-zinc-300">{greeting()}{first ? `, ${first}` : ""}</span>
            <span className="text-zinc-600">·</span>
            <span>Central de administração</span>
          </p>
          <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em]">
            {attention.length ? <>Há <span className="vx-gold-text">{attention.length}</span> {attention.length === 1 ? "ponto" : "pontos"} para olhar hoje.</> : "Tudo em ordem por aqui."}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/contas" className="vx-btn vx-btn--gold"><UserPlus /> Criar conta de equipe</Link>
          <Link to="/admin/membros?novo=1" className="vx-btn"><Plus /> Novo membro</Link>
          <button type="button" className="vx-btn" onClick={exportAll} disabled={!players.length}><Download /> Exportar cadastros</button>
        </div>
      </div>

      <div className="vx-grid vx-stagger mb-[18px] grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Contas de login", value: accs.length, icon: ShieldCheck, color: "#fbbf24", foot: accounts ? `${admins} admin · ${execs} exec · ${scouts} scout · ${athletes} atletas` : accountsError ? "Não foi possível carregar" : "Carregando…", to: "/admin/contas" },
          { label: "Cadastros", value: players.length, icon: Users, color: "#38bdf8", spark: stats.daily14, foot: `${stats.week} nos últimos 7 dias`, to: "/admin/cadastros" },
          { label: "Membros", value: onlyMembers.length, icon: BadgeCheck, color: "#34d399", foot: `${onlyMembers.filter((m) => m.active).length} ativos · ${memberRows.length - onlyMembers.length} referências`, to: "/admin/membros" },
          { label: "Partidas", value: matchTotal, icon: Eye, color: "#fb923c", foot: `${matchTotal - drafts} publicadas · ${drafts} em rascunho`, to: "/admin/membros" },
        ].map((k, i) => (
          <Link key={k.label} to={k.to} className="vx-card vx-card--hover cn-kpi" style={{ "--i": i } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3">
              <span className="vx-kpi-label">{k.label}</span>
              <span className="vx-kpi-icon" style={{ color: k.color, background: `${k.color}14`, borderColor: `${k.color}33` }}><k.icon /></span>
            </div>
            <div className="vx-kpi-row">
              <div className="vx-kpi-value"><CountUp value={k.value} /></div>
              {"spark" in k && k.spark && <span className="hidden sm:block"><Sparkline data={k.spark} color={k.color} /></span>}
            </div>
            <div className="vx-kpi-foot"><span>{k.foot}</span><ArrowRight className="cn-kpi-go" /></div>
          </Link>
        ))}
      </div>

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="vx-card">
          <CardHead title="Precisa de atenção" sub="O que está parado e pode ser resolvido agora" />
          {attention.length ? (
            <ul className="cn-attention">
              {attention.map((a) => (
                <li key={a.key} className={`is-${a.tone}`}>
                  <span className="cn-att-icon"><a.icon /></span>
                  <div className="min-w-0 flex-1">
                    <b>{a.title}</b>
                    <p>{a.text}</p>
                  </div>
                  <span className="cn-att-count tnum">{a.count}</span>
                  <Link to={a.to} className="vx-btn">{a.action} <ArrowRight /></Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={<CheckCircle2 className="h-6 w-6" />} title={data ? "Nada pendente" : "Carregando…"}>
              Todos os leads têm contato, as contas estão confirmadas e as partidas estão publicadas.
            </Empty>
          )}
        </section>

        <section className="vx-card">
          <CardHead title="Contas por acesso" sub="Quem pode o quê" />
          {accounts && slices.length ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
              <Donut
                slices={slices} active={slice} onActive={setSlice} size={160} stroke={20}
                center={active ? (
                  <span key={active.label} className="vx-donut-detail">
                    <span className="text-[26px] font-bold tnum leading-none" style={{ color: active.color }}>{active.value}</span>
                    <span className="mt-1 text-[11px] text-zinc-400">{active.label}</span>
                  </span>
                ) : (
                  <span className="vx-donut-detail">
                    <span className="text-[26px] font-bold tnum leading-none"><CountUp value={accs.length} /></span>
                    <span className="mt-1 text-[11px] text-zinc-500">contas</span>
                  </span>
                )}
              />
              <ul className={`vx-legend flex w-full flex-col gap-1 ${slice !== null ? "has-active" : ""}`} onPointerLeave={() => setSlice(null)}>
                {slices.map((s, i) => (
                  <li key={s.label} className={`flex items-center gap-2.5 text-[12.5px] ${slice === i ? "is-active" : ""}`} onPointerEnter={() => setSlice(i)}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-zinc-300">{s.label}</span>
                    <span className="font-semibold tnum text-zinc-400">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : accountsError ? (
            <p className="text-[13px] text-red-300">{accountsError}</p>
          ) : (
            <Empty icon={<Users className="h-6 w-6" />} title="Carregando…" />
          )}
        </section>
      </div>

      {members.error && <div className="mb-[18px]"><SetupNotice error={members.error} /></div>}

      <div className="vx-grid xl:grid-cols-2">
        <section className="vx-card">
          <CardHead title="Últimos cadastros" sub="Quem chegou agora" actions={<Link to="/admin/cadastros" className="vx-btn">Ver todos <ArrowRight /></Link>} />
          <div className="vx-feed">
            {players.slice(0, 6).map((p) => (
              <div key={p.key} className="vx-feed-item">
                <Avatar name={p.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="vx-feed-name">{p.name}</div>
                  <div className="vx-feed-meta">{p.source === "funil" ? "Funil" : "Conta"} · {timeAgo(p.createdAt)}</div>
                </div>
                <StageTag stage={p.meta.stage} />
                <Link to={`/admin/cadastros?editar=${encodeURIComponent(p.key)}`} className="vx-icon-btn" aria-label={`Editar ${p.name}`} title="Editar"><Pencil /></Link>
              </div>
            ))}
            {!players.length && <Empty icon={<Users className="h-6 w-6" />} title="Nenhum cadastro ainda" />}
          </div>
        </section>

        <section className="vx-card">
          <CardHead title="Contas mais recentes" sub="Logins criados há pouco" actions={<Link to="/admin/contas" className="vx-btn">Gerenciar <ArrowRight /></Link>} />
          <div className="vx-feed">
            {recentAccounts.map((a) => (
              <div key={a.id} className="vx-feed-item">
                <Avatar name={a.fullName || a.email || "Conta"} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="vx-feed-name">{a.fullName || a.email}</div>
                  <div className="vx-feed-meta">{a.email} · {timeAgo(a.createdAt)}</div>
                </div>
                <span className={`ac-level is-${a.level}`}>{LEVEL_LABEL[a.level]}</span>
              </div>
            ))}
            {accounts && !recentAccounts.length && <Empty icon={<Users className="h-6 w-6" />} title="Nenhuma conta ainda" />}
          </div>
        </section>
      </div>
    </>
  )
}
