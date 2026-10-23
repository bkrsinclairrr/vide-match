import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Database, Flame, Info, Minus, Sparkles, Target, UserCheck, Users,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useVoxen } from "../store"
import {
  POSITIONS, STAGES, firstName, placeOf, positionCode, shortName, timeAgo, type Player,
} from "../data"
import { AreaChart, CountUp, Donut, HeatGrid, Meter, Pitch, Sparkline } from "../charts"
import { Avatar, CardHead, Empty, PosBadge, ScoreChip, StageTag, playerPath } from "../ui"

const CATEGORY_COLORS = ["#fbbf24", "#34d399", "#38bdf8", "#fb923c", "#a3e635", "#f472b6", "#a78bfa", "#facc15", "#2dd4bf"]
const DAY = 86400000

function greeting() {
  const h = new Date().getHours()
  return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite"
}

function todayLabel() {
  const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function categoryOrder(c: string) {
  const n = Number.parseInt(c.replace(/\D/g, ""), 10)
  return Number.isFinite(n) ? n : 99
}

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="vx-delta vx-delta--flat"><Minus className="h-3 w-3" />0%</span>
  const pct = before === 0 ? 100 : Math.round(((now - before) / before) * 100)
  if (pct === 0) return <span className="vx-delta vx-delta--flat"><Minus className="h-3 w-3" />0%</span>
  const up = pct > 0
  return (
    <span className={`vx-delta ${up ? "vx-delta--up" : "vx-delta--down"}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  )
}

export default function Overview() {
  const { players, data, demo } = useVoxen()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [category, setCategory] = useState("Todos")
  const [range, setRange] = useState(30)
  const [slice, setSlice] = useState<number | null>(null)
  const first = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "").trim().split(/\s+/)[0]

  const categories = useMemo(() => {
    const set = new Set(players.map((p) => p.profile.category).filter(Boolean) as string[])
    return ["Todos", ...[...set].sort((a, b) => categoryOrder(a) - categoryOrder(b))]
  }, [players])

  const list = useMemo(
    () => (category === "Todos" ? players : players.filter((p) => p.profile.category === category)),
    [players, category],
  )

  const stats = useMemo(() => {
    const now = Date.now()
    const t = (p: Player) => new Date(p.createdAt).getTime()
    // As entradas por dia são do funil e das contas: o pré-cadastro do CRM chegou em lote, pela ponte, e entortaria o gráfico.
    const arrivals = list.filter((p) => p.source !== "crm")
    const last7 = arrivals.filter((p) => now - t(p) < 7 * DAY).length
    const prev7 = arrivals.filter((p) => now - t(p) >= 7 * DAY && now - t(p) < 14 * DAY).length
    const today = arrivals.filter((p) => new Date(p.createdAt).toDateString() === new Date().toDateString()).length
    const withProfile = list.filter((p) => p.hasProfile).length
    const worked = list.filter((p) => p.meta.stage !== "novo").length
    const evaluating = list.filter((p) => p.meta.stage === "avaliacao" || p.meta.stage === "aprovado").length

    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(now - (range - 1 - i) * DAY)
      d.setHours(0, 0, 0, 0)
      return { start: d.getTime(), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""), value: 0 }
    })
    for (const p of arrivals) {
      const day = new Date(t(p))
      day.setHours(0, 0, 0, 0)
      const slot = days.find((d) => d.start === day.getTime())
      if (slot) slot.value++
    }

    const byCat = new Map<string, number>()
    for (const p of list) {
      const c = p.profile.category ?? "Sem perfil"
      byCat.set(c, (byCat.get(c) ?? 0) + 1)
    }
    const catSlices = [...byCat.entries()]
      .sort((a, b) => (a[0] === "Sem perfil" ? 1 : b[0] === "Sem perfil" ? -1 : categoryOrder(a[0]) - categoryOrder(b[0])))
      .map(([label, value], i) => ({ label, value, color: label === "Sem perfil" ? "#3f3f46" : CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))

    const byOrigin = new Map<string, number>()
    for (const p of list) byOrigin.set(p.origin, (byOrigin.get(p.origin) ?? 0) + 1)
    const origins = [...byOrigin.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    const byPos = new Map<string, number>()
    for (const p of list) if (p.profile.position && POSITIONS[p.profile.position]) byPos.set(p.profile.position, (byPos.get(p.profile.position) ?? 0) + 1)

    const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
    for (const p of arrivals) {
      const d = new Date(p.createdAt)
      heat[d.getDay()][d.getHours()]++
    }

    const stages = STAGES.map((s) => ({ ...s, value: list.filter((p) => p.meta.stage === s.key).length }))
    const top = [...list].sort((a, b) => b.overall - a.overall).slice(0, 6)

    // Minilinhas dos indicadores: entradas por dia (14 dias) e base acumulada (30 dias).
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const dayEnd = (back: number) => midnight.getTime() + DAY - back * DAY
    const daily14 = Array.from({ length: 14 }, (_, i) => {
      const end = dayEnd(13 - i)
      return arrivals.filter((p) => t(p) >= end - DAY && t(p) < end).length
    })
    const total30 = Array.from({ length: 30 }, (_, i) => {
      const end = dayEnd(29 - i)
      return list.filter((p) => t(p) < end).length
    })

    return { last7, prev7, today, withProfile, worked, evaluating, days, catSlices, origins, byPos, heat, stages, top, daily14, total30 }
  }, [list, range])

  const total = list.length
  const activeSlice = slice !== null ? stats.catSlices[slice] ?? null : null
  const showNotice = !demo && data && (!data.profileCapture || !data.sharedMeta)
  const maxStage = Math.max(1, ...stats.stages.map((s) => s.value))

  return (
    <>
      {showNotice && (
        <div className="vx-notice mb-5">
          <Info />
          <div>
            <strong>Falta um passo para a VOXEN ficar completa.</strong>{" "}
            {!data?.profileCapture && "Os leads ainda chegam só com nome, contato e origem: posição, categoria e cidade passam a ser gravados depois da atualização do banco. "}
            {!data?.sharedMeta && "Etapas, notas e avaliações do scout estão sendo salvas só neste navegador até a atualização. "}
            Arquivo: <code className="text-sky-200">supabase/migrations/20261009000000_voxen_platform.sql</code>.
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="vx-hello">
            <span className="vx-live" aria-hidden="true" />
            <span className="text-zinc-300">{greeting()}{first ? `, ${first}` : ""}</span>
            <span className="text-zinc-600">·</span>
            <span>{todayLabel()}</span>
            {data && <span className="hidden text-zinc-500 sm:inline">· atualizado {timeAgo(data.loadedAt.toISOString())}</span>}
          </p>
          <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em]">
            {stats.today > 0
              ? <>Hoje chegaram <span className="vx-gold-text">{stats.today}</span> atleta{stats.today === 1 ? "" : "s"}.</>
              : "Sua base de atletas"}
          </h2>
        </div>
        <div className="vx-chips vx-chips--scroll" role="tablist" aria-label="Categoria">
          {categories.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={c === category} className={`vx-chip ${c === category ? "is-on" : ""}`} onClick={() => { setCategory(c); setSlice(null) }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <div className="vx-grid vx-stagger mb-[18px] grid-cols-2 xl:grid-cols-4">
        {([
          { label: "Atletas na base", value: total, icon: Users, color: "#fbbf24", spark: stats.total30, foot: <span>{stats.today} hoje</span> },
          { label: "Novos nos últimos 7 dias", value: stats.last7, icon: Flame, color: "#fb923c", spark: stats.daily14, foot: <><Delta now={stats.last7} before={stats.prev7} /><span>vs. 7 dias anteriores</span></> },
          { label: "Perfis completos", value: total ? Math.round((stats.withProfile / total) * 100) : 0, suffix: "%", icon: Database, color: "#38bdf8", meter: total ? (stats.withProfile / total) * 100 : 0, foot: <span>{stats.withProfile} com posição e categoria</span> },
          { label: "Em avaliação ou aprovados", value: stats.evaluating, icon: UserCheck, color: "#34d399", meter: total ? (stats.evaluating / total) * 100 : 0, foot: <span>{stats.worked} já trabalhados pela equipe</span> },
        ] as { label: string; value: number; suffix?: string; icon: typeof Users; color: string; spark?: number[]; meter?: number; foot: React.ReactNode }[]).map((kpi, i) => (
          <div key={kpi.label} className="vx-card vx-card--hover" style={{ "--i": i } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3">
              <span className="vx-kpi-label">{kpi.label}</span>
              <span className="vx-kpi-icon" style={{ color: kpi.color, background: `${kpi.color}14`, borderColor: `${kpi.color}33` }}>
                <kpi.icon />
              </span>
            </div>
            <div className="vx-kpi-row">
              <div className="vx-kpi-value"><CountUp value={kpi.value} suffix={kpi.suffix} /></div>
              {kpi.spark && <span className="hidden sm:block"><Sparkline data={kpi.spark} color={kpi.color} /></span>}
            </div>
            {kpi.meter !== undefined && <div className="mt-3.5"><Meter value={kpi.meter} color={kpi.color} height={5} delay={250 + i * 90} /></div>}
            <div className="vx-kpi-foot">{kpi.foot}</div>
          </div>
        ))}
      </div>

      {/* Série + categorias */}
      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="vx-card">
          <CardHead
            title="Entradas por dia"
            sub={`${stats.days.reduce((a, d) => a + d.value, 0)} atletas nos últimos ${range} dias`}
            actions={
              <div className="vx-tabs">
                {[7, 30, 90].map((r) => (
                  <button key={r} type="button" className={`vx-tab ${r === range ? "is-on" : ""}`} onClick={() => setRange(r)}>{r}d</button>
                ))}
              </div>
            }
          />
          <AreaChart key={`${range}-${category}`} height={268} data={stats.days} live format={(v) => `${v} atleta${v === 1 ? "" : "s"}`} />
        </section>

        <section className="vx-card">
          <CardHead title="Por categoria" sub="Passe o cursor numa fatia para ver o detalhe" />
          {total ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
              <Donut
                key={category}
                slices={stats.catSlices}
                active={slice}
                onActive={setSlice}
                center={activeSlice ? (
                  <span key={activeSlice.label} className="vx-donut-detail">
                    <span className="text-[28px] font-bold tnum leading-none" style={{ color: activeSlice.color }}>{Math.round((activeSlice.value / total) * 100)}%</span>
                    <span className="mt-1 text-[11px] text-zinc-400">{activeSlice.label} · {activeSlice.value}</span>
                  </span>
                ) : (
                  <span className="vx-donut-detail">
                    <span className="text-[28px] font-bold tnum leading-none"><CountUp value={total} /></span>
                    <span className="mt-1 text-[11px] text-zinc-500">atletas</span>
                  </span>
                )}
              />
              <ul className={`vx-legend flex w-full flex-col gap-1 ${slice !== null ? "has-active" : ""}`} onPointerLeave={() => setSlice(null)}>
                {stats.catSlices.slice(0, 7).map((s, i) => (
                  <li key={s.label} className={`flex items-center gap-2.5 text-[12.5px] ${slice === i ? "is-active" : ""}`} onPointerEnter={() => setSlice(i)}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color, boxShadow: slice === i ? `0 0 10px ${s.color}` : undefined }} />
                    <span className="flex-1 text-zinc-300">{s.label}</span>
                    <span className="font-semibold tnum text-zinc-400">{Math.round((s.value / total) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <Empty icon={<Users className="h-6 w-6" />} title="Sem atletas nesta categoria" />}
        </section>
      </div>

      {/* Destaques */}
      <section className="vx-card mb-[18px]">
        <CardHead
          title={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-300" /> Destaques da base</span>}
          sub="Maiores notas gerais do relatório"
          actions={<Link to="/voxen/jogadores" className="vx-btn">Ver todos <ArrowRight /></Link>}
        />
        {stats.top.length ? (
          <div className="vx-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {stats.top.map((p, i) => (
              <Link key={p.key} to={playerPath(p)} className="vx-pcard" style={{ "--i": i } as React.CSSProperties}>
                <span className={`vx-pcard-rank ${i < 3 ? "is-top" : ""}`}>#{i + 1}</span>
                <span className="vx-pcard-ovr"><ScoreChip score={p.overall} size="sm" /></span>
                <Avatar name={p.name} size={58} />
                <span className="vx-pcard-name">{shortName(p.name)}</span>
                <span className="flex items-center gap-1.5"><PosBadge player={p} /><span className="vx-pcard-meta">{p.profile.category ?? "—"}</span></span>
                <span className="vx-pcard-meta truncate">{placeOf(p) ?? "Cidade não informada"}</span>
              </Link>
            ))}
          </div>
        ) : <Empty icon={<Sparkles className="h-6 w-6" />} title="Ainda sem destaques" />}
      </section>

      {/* Funil comercial, origem e posições */}
      <div className="vx-grid mb-[18px] lg:grid-cols-2 xl:grid-cols-3">
        <section className="vx-card">
          <CardHead title="Funil comercial" sub="Etapa de cada atleta com a equipe" />
          <div className="flex flex-col gap-3">
            {stats.stages.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className="group grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-3 text-left"
                onClick={() => navigate(`/voxen/jogadores?etapa=${s.key}`)}
              >
                <span className="flex items-center gap-2 text-[13px] text-zinc-300 group-hover:text-white">
                  <span className="vx-stage-dot" style={{ background: s.color }} />{s.label}
                </span>
                <Meter value={(s.value / maxStage) * 100} color={s.color} height={10} delay={i * 80} />
                <span className="text-right text-[13px] font-bold tnum text-zinc-300">{s.value}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-[12px] text-zinc-500">
            Taxa de contato: <strong className="text-zinc-300">{total ? Math.round((stats.worked / total) * 100) : 0}%</strong> dos atletas já saíram de “Novo”.
          </p>
        </section>

        <section className="vx-card">
          <CardHead title="Origem do tráfego" sub="De onde vêm os atletas (UTM e click ids)" />
          {stats.origins.length ? (
            <div className="vx-rank">
              {stats.origins.map(([label, value], i) => (
                <div key={label} className="vx-rank-row">
                  <span className="vx-rank-label">{label}</span>
                  <span className="vx-rank-value">{value}</span>
                  <Meter value={(value / stats.origins[0][1]) * 100} color={["#fbbf24", "#38bdf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6"][i]} delay={i * 80} />
                </div>
              ))}
            </div>
          ) : <Empty icon={<Target className="h-6 w-6" />} title="Sem origem registrada" />}
        </section>

        <section className="vx-card lg:col-span-2 xl:col-span-1">
          <CardHead title="Posições em campo" sub="Quantos atletas por posição" actions={<Link to="/voxen/elenco" className="vx-btn">Elenco <ArrowRight /></Link>} />
          {stats.byPos.size ? (
            <div className="mx-auto max-w-[300px]">
              <Pitch
                markers={Object.entries(POSITIONS).map(([name, pos]) => ({
                  x: pos.x, y: pos.y, label: String(stats.byPos.get(name) ?? 0), name: pos.code,
                  highlight: (stats.byPos.get(name) ?? 0) === Math.max(...stats.byPos.values()),
                  title: `${name}: ${stats.byPos.get(name) ?? 0}`,
                  onClick: () => navigate(`/voxen/jogadores?posicao=${encodeURIComponent(name)}`),
                }))}
              />
            </div>
          ) : (
            <Empty icon={<Target className="h-6 w-6" />} title="Posições ainda não informadas">
              Aparecem aqui assim que os leads chegarem com o perfil preenchido no funil.
            </Empty>
          )}
        </section>
      </div>

      {/* Horários + atividade */}
      <div className="vx-grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="vx-card">
          <CardHead title="Quando os atletas chegam" sub="Entradas por dia da semana e hora — use para programar anúncios e o atendimento" />
          <HeatGrid key={category} matrix={stats.heat} />
        </section>

        <section className="vx-card">
          <CardHead title="Atividade recente" sub="Últimos atletas que entraram" />
          <div className="vx-feed">
            {list.slice(0, 7).map((p) => (
              <Link key={p.key} to={playerPath(p)} className="vx-feed-item">
                <Avatar name={p.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="vx-feed-name">{p.name}</div>
                  <div className="vx-feed-meta">
                    {p.hasProfile ? `${positionCode(p)} · ${p.profile.category ?? "—"} · ${placeOf(p) ?? "—"}` : `Contato de ${firstName(p.name)} · ${p.origin}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-zinc-500">{timeAgo(p.createdAt)}</span>
                  <StageTag stage={p.meta.stage} />
                </div>
              </Link>
            ))}
            {!list.length && <Empty icon={<Users className="h-6 w-6" />} title="Nenhum atleta ainda" />}
          </div>
        </section>
      </div>
    </>
  )
}
