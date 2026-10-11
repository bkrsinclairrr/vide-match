import {
  Activity, Crosshair, Footprints, Hand, Send, Shield as ShieldIcon, Swords, Target, Wind, X, Zap,
  type LucideIcon,
} from "lucide-react"
import { Meter } from "@/pages/voxen/charts"
import { ageFrom, fmt1, positionCodeOf, type Member } from "../model"
import { duels, indices, pct, type ProfileSummary, type StatLine } from "../metrics"
import { MemberAvatar } from "./bits"

/** Recortes de período do desempenho e do comparativo (0 = temporada). */
export const PERIODS = [
  { key: 5, label: "Últimos 5 jogos" },
  { key: 10, label: "Últimos 10 jogos" },
  { key: 0, label: "Temporada" },
] as const

type Stat = { label: string; icon: LucideIcon; value: string; sub?: string; ratio?: number | null }

export function matchStats(l: StatLine): Stat[] {
  const d = duels(l)
  const r = (ok: number, total: number) => pct(ok, total)
  const fmt = (ok: number, total: number) => (total ? `${Math.round((ok / total) * 100)}% certos` : "sem tentativas")
  return [
    { label: "Passes", icon: Activity, value: `${l.passesOk}/${l.passes}`, sub: fmt(l.passesOk, l.passes), ratio: r(l.passesOk, l.passes) },
    { label: "Passes-chave", icon: Crosshair, value: String(l.keyPasses), sub: `${l.assists} assistência${l.assists === 1 ? "" : "s"}` },
    { label: "Finalizações", icon: Target, value: String(l.shots), sub: `${l.shotsOnTarget} no alvo · ${l.goals} gol${l.goals === 1 ? "" : "s"}`, ratio: r(l.shotsOnTarget, l.shots) },
    { label: "Dribles", icon: Zap, value: `${l.dribblesOk}/${l.dribbles}`, sub: fmt(l.dribblesOk, l.dribbles), ratio: r(l.dribblesOk, l.dribbles) },
    { label: "Conduções", icon: Footprints, value: `${l.carriesOk}/${l.carries}`, sub: "progressivas", ratio: r(l.carriesOk, l.carries) },
    { label: "Cruzamentos", icon: Send, value: `${l.crossesOk}/${l.crosses}`, sub: fmt(l.crossesOk, l.crosses), ratio: r(l.crossesOk, l.crosses) },
    { label: "Duelos", icon: Swords, value: `${d.won}/${d.total}`, sub: d.total ? `${Math.round((d.won / d.total) * 100)}% ganhos` : "sem duelos", ratio: r(d.won, d.total) },
    { label: "Desarmes", icon: ShieldIcon, value: `${l.tacklesOk}/${l.tackles}`, sub: fmt(l.tacklesOk, l.tackles), ratio: r(l.tacklesOk, l.tackles) },
    { label: "Interceptações", icon: Hand, value: String(l.interceptions), sub: `${l.blocks} bloqueio${l.blocks === 1 ? "" : "s"}` },
    { label: "Recuperações", icon: Wind, value: String(l.recoveries), sub: `${l.losses} perda${l.losses === 1 ? "" : "s"} de posse` },
  ]
}

export function StatGrid({ line, compact = false }: { line: StatLine; compact?: boolean }) {
  return (
    <div className={`vx-stagger mb-stats ${compact ? "is-compact" : ""}`}>
      {matchStats(line).map((s, i) => (
        <div key={s.label} className="mb-stat" style={{ "--i": i } as React.CSSProperties}>
          <span className="mb-stat-label"><s.icon />{s.label}</span>
          <b className="tnum">{s.value}</b>
          {s.sub && <small>{s.sub}</small>}
          {s.ratio !== undefined && s.ratio !== null && <Meter value={s.ratio} color={s.ratio >= 70 ? "#22c55e" : s.ratio >= 50 ? "#facc15" : "#f97316"} height={4} delay={i * 40} />}
        </div>
      ))}
    </div>
  )
}

export function IndexBars({ line }: { line: StatLine }) {
  const idx = indices(line)
  const rows = [
    { label: "Ofensivo", value: idx.ofensivo, color: "#fbbf24" },
    { label: "Construção", value: idx.construcao, color: "#38bdf8" },
    { label: "Defensivo", value: idx.defensivo, color: "#34d399" },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rows.map((r, i) => (
        <div key={r.label} className="mb-index">
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-500">{r.label}</span>
          <b className="tnum" style={{ color: r.color }}>{fmt1(r.value)}<small> / 5</small></b>
          <Meter value={(r.value / 5) * 100} color={r.color} height={8} delay={i * 90} />
        </div>
      ))}
    </div>
  )
}

/** Cartão do topo do comparativo (referência 15). */
export function ProfileHeader({ member, color, tag, summary, onRemove, children }: {
  member: Member
  color: string
  tag?: string
  summary?: ProfileSummary
  onRemove?: () => void
  children?: React.ReactNode
}) {
  const age = ageFrom(member.birthDate)
  return (
    <section className="vx-card vx-card--hover mb-pheader" style={{ boxShadow: `inset 0 3px 0 ${color}` }}>
      {onRemove && <button type="button" className="vx-icon-btn absolute right-3 top-3" onClick={onRemove} aria-label={`Remover ${member.fullName}`}><X /></button>}
      <MemberAvatar member={member} size={64} ring={color} />
      <div className="min-w-0 flex-1">
        {tag && <span className="mb-ptag" style={{ color, background: `${color}17` }}>{tag}</span>}
        <p className="mt-1 truncate text-[16px] font-bold">{member.fullName}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-400">
          <span className="vx-pos" style={{ borderColor: `${color}55`, color, background: `${color}14` }}>{positionCodeOf(member.position)}</span>
          {[member.category, age ? `${age} anos` : null, member.team].filter(Boolean).join(" · ")}
        </p>
        {summary && <p className="mt-2 text-[11.5px] text-zinc-500">{summary.matches.length} partidas · {summary.events.length} ações analisadas</p>}
      </div>
      {children}
    </section>
  )
}
