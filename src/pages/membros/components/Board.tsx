import { useMemo, useState, type ReactNode } from "react"
import {
  Activity, CalendarDays, Crosshair, Footprints, Gauge, Goal, Hand, RectangleVertical, Ruler, Send, Shield as ShieldIcon,
  Shirt, Sparkles, Swords, Target, Timer, TrendingUp, Weight, Wind, Zap, type LucideIcon,
} from "lucide-react"
import { RadarChart, useMounted } from "@/pages/voxen/charts"
import { SCOUT_GROUPS, ageFrom, fmt1, positionCodeOf, scoutGroupAverage, type ScoutGroupKey } from "../model"
import { duels, pct, per90, type MatchSummary, type ProfileSummary } from "../metrics"
import { HeatMap, PositionsPitch } from "./Field"
import { MatchBars, MemberAvatar, MiniLines, SectionTitle } from "./bits"

export const BOARD_COLORS = ["#fbbf24", "#38bdf8", "#f472b6"]

export type BoardCol = { summary: ProfileSummary; color: string; tag?: string }

type RowDef = {
  label: string
  icon?: LucideIcon
  values: (number | null)[]
  format?: (v: number) => string
  /** Qual valor é o melhor (destacado). "none" não destaca. */
  better?: "high" | "low" | "none"
  /** Mostra barra até `max` (ex.: índices 0–5). */
  bar?: { max: number }
}

const fmtInt = (v: number) => Math.round(v).toLocaleString("pt-BR")
const fmt2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (v: number) => `${Math.round(v)}%`

function Rows({ cols, rows }: { cols: BoardCol[]; rows: RowDef[] }) {
  const on = useMounted()
  return (
    <div className="mb-rows" style={{ "--n": cols.length } as React.CSSProperties}>
      {rows.map((row, r) => {
        const valid = row.values.filter((v): v is number => v !== null)
        const best = cols.length > 1 && valid.length > 1 && row.better !== "none"
          ? (row.better === "low" ? Math.min(...valid) : Math.max(...valid))
          : null
        const Icon = row.icon
        return (
          <div key={row.label} className="mb-row" style={{ animationDelay: `${r * 35}ms` }}>
            <span className="mb-row-label">{Icon && <Icon />}{row.label}</span>
            {row.values.map((v, i) => {
              const isBest = best !== null && v === best
              const color = cols[i].color
              return (
                <span key={i} className={`mb-row-value ${isBest ? "is-best" : ""}`} style={isBest ? { color } : undefined}>
                  {row.bar && (
                    <span className="mb-row-bar">
                      <span style={{ width: on && v !== null ? `${Math.min(100, (v / row.bar.max) * 100)}%` : "0%", background: `linear-gradient(90deg, ${color}66, ${color})`, transitionDelay: `${r * 60 + i * 80}ms` }} />
                    </span>
                  )}
                  <b className="tnum">{v === null ? "—" : (row.format ?? fmtInt)(v)}</b>
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-board-section">
      <SectionTitle sub={sub}>{title}</SectionTitle>
      {children}
    </section>
  )
}

function PerColumn({ cols, render }: { cols: BoardCol[]; render: (c: BoardCol, i: number) => ReactNode }) {
  return (
    <div className="mb-cols" style={{ "--n": cols.length } as React.CSSProperties}>
      {cols.map((c, i) => (
        <div key={c.summary.bundle.member.id} className="mb-col" style={{ "--c": c.color } as React.CSSProperties}>
          {cols.length > 1 && (
            <div className="mb-col-head">
              <i style={{ background: c.color }} />
              <span>{c.tag ?? c.summary.bundle.member.fullName.split(" ")[0]}</span>
            </div>
          )}
          {render(c, i)}
        </div>
      ))}
    </div>
  )
}

const RADAR_TABS: { key: "geral" | ScoutGroupKey; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "defensivo", label: "Defensivo" },
  { key: "fisico", label: "Físico" },
  { key: "ofensivo", label: "Ofensivo" },
  { key: "tecnico", label: "Técnico" },
]

function RadarSection({ cols }: { cols: BoardCol[] }) {
  const [tab, setTab] = useState<(typeof RADAR_TABS)[number]["key"]>("geral")
  const [hidden, setHidden] = useState<string[]>([])
  const withScout = cols.filter((c) => c.summary.bundle.member.scout)

  const { axes, series } = useMemo(() => {
    const visible = withScout.filter((c) => !hidden.includes(c.summary.bundle.member.id))
    if (tab === "geral") {
      return {
        axes: SCOUT_GROUPS.map((g) => g.label),
        series: visible.map((c) => ({
          name: c.summary.bundle.member.fullName,
          color: c.color,
          values: SCOUT_GROUPS.map((g) => (scoutGroupAverage(c.summary.bundle.member.scout, g.key) ?? 0) / 5),
        })),
      }
    }
    const group = SCOUT_GROUPS.find((g) => g.key === tab) ?? SCOUT_GROUPS[0]
    return {
      axes: group.attrs.map(([, label]) => label),
      series: visible.map((c) => ({
        name: c.summary.bundle.member.fullName,
        color: c.color,
        values: group.attrs.map(([k]) => (c.summary.bundle.member.scout?.[k] ?? 0) / 5),
      })),
    }
  }, [tab, hidden, withScout])

  return (
    <Section title="Comparação radar" sub="Avaliação do scout da Zyron (1 a 5)">
      <div className="mb-radar">
        <div className="vx-tabs mx-auto" role="tablist">
          {RADAR_TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`vx-tab ${tab === t.key ? "is-on" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        {withScout.length ? (
          <>
            <div className="mx-auto w-full max-w-[520px]">
              <RadarChart key={tab + hidden.join()} axes={axes} series={series} size={500} levels={5} />
            </div>
            <div className="mb-radar-legend">
              {cols.map((c) => {
                const id = c.summary.bundle.member.id
                const has = Boolean(c.summary.bundle.member.scout)
                const off = hidden.includes(id) || !has
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!has}
                    className={`mb-radar-chip ${off ? "is-off" : ""}`}
                    onClick={() => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))}
                    aria-pressed={!off}
                  >
                    <MemberAvatar member={c.summary.bundle.member} size={34} ring={c.color} />
                    <span>{c.summary.bundle.member.fullName}</span>
                    {!has && <small>sem avaliação</small>}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-[13px] text-zinc-500">A comparação aparece depois da avaliação do scout.</p>
        )}
      </div>
    </Section>
  )
}

/**
 * Painel de desempenho/comparativo — estrutura das referências 15 a 19:
 * Geral → Posições em campo → Mapa de calor → Últimas partidas (barras e
 * evolução) → Estatísticas → Estatísticas p/90 → Índices → Métricas scout →
 * Comparação radar. Com uma coluna só, vira o painel de desempenho.
 */
export function Board({ cols, onOpenMatch }: { cols: BoardCol[]; onOpenMatch?: (m: MatchSummary) => void }) {
  const single = cols.length === 1
  const s = cols.map((c) => c.summary)
  const m = s.map((x) => x.bundle.member)
  const t = s.map((x) => x.total)
  const p90 = (pick: (i: number) => number) => s.map((x, i) => per90(pick(i), x.total.minutes))

  return (
    <div className={`mb-board ${single ? "is-single" : ""}`}>
      <Section title="Geral">
        <Rows cols={cols} rows={[
          { label: "Idade", icon: CalendarDays, values: m.map((x) => ageFrom(x.birthDate)), format: (v) => `${v} anos`, better: "none" },
          { label: "Altura", icon: Ruler, values: m.map((x) => x.heightCm), format: (v) => `${v} cm`, better: "none" },
          { label: "Peso", icon: Weight, values: m.map((x) => x.weightKg), format: (v) => `${v} kg`, better: "none" },
          { label: "Partidas analisadas", icon: Shirt, values: t.map((x) => x.matches) },
          { label: "Minutos analisados", icon: Timer, values: t.map((x) => x.minutes), format: (v) => `${fmtInt(v)}'` },
          { label: "Nota média", icon: Gauge, values: s.map((x) => x.avgRating), format: fmt1, bar: { max: 10 } },
        ]} />
        <div className="mb-facts" style={{ "--n": cols.length } as React.CSSProperties}>
          <span className="mb-row-label">Perfil</span>
          {m.map((x, i) => (
            <span key={x.id} className="mb-facts-cell">
              <span className="vx-pos" style={{ borderColor: `${cols[i].color}55`, color: cols[i].color, background: `${cols[i].color}14` }}>{positionCodeOf(x.position)}</span>
              {[x.category, x.foot && `Pé ${x.foot.toLowerCase()}`, x.team].filter(Boolean).join(" · ") || "—"}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Posições em campo">
        {single ? (
          <div className="mb-positions-single">
            <PositionsPitch positions={s[0].positions} color={cols[0].color} />
            <ul>
              {s[0].positions.map((p) => (
                <li key={p.position}>
                  <span className="vx-pos">{positionCodeOf(p.position)}</span>
                  <span className="flex-1">{p.position}</span>
                  <b className="tnum">{p.count} jogo{p.count === 1 ? "" : "s"}</b>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <PerColumn cols={cols} render={(c) => <PositionsPitch positions={c.summary.positions} color={c.color} />} />
        )}
      </Section>

      <Section title="Mapa de calor" sub="Todas as ações marcadas nos vídeos">
        {single
          ? <HeatMap events={s[0].events} controls insights label={m[0].fullName} />
          : <PerColumn cols={cols} render={(c) => <HeatMap events={c.summary.events} compact label={c.summary.bundle.member.fullName} />} />}
      </Section>

      <Section title="Últimas partidas" sub="Nota de cada jogo e evolução">
        <PerColumn cols={cols} render={(c) => (
          <>
            <MatchBars matches={c.summary.matches} max={single ? 10 : 8} height={single ? 168 : 120} onOpen={onOpenMatch} />
            <MiniLines matches={c.summary.matches} max={single ? 10 : 8} height={single ? 150 : 110} />
          </>
        )} />
      </Section>

      <Section title="Estatísticas">
        <Rows cols={cols} rows={[
          { label: "Gols", icon: Goal, values: t.map((x) => x.goals) },
          { label: "Assistências", icon: Send, values: t.map((x) => x.assists) },
          { label: "Finalizações", icon: Target, values: t.map((x) => x.shots) },
          { label: "Finalizações no alvo", icon: Crosshair, values: t.map((x) => x.shotsOnTarget) },
          { label: "Passes certos", icon: Activity, values: t.map((x) => x.passesOk) },
          { label: "% de passes certos", icon: TrendingUp, values: t.map((x) => pct(x.passesOk, x.passes)), format: fmtPct, bar: { max: 100 } },
          { label: "Dribles certos", icon: Zap, values: t.map((x) => x.dribblesOk) },
          { label: "Duelos ganhos", icon: Swords, values: t.map((x) => duels(x).won) },
          { label: "% de duelos ganhos", icon: TrendingUp, values: t.map((x) => pct(duels(x).won, duels(x).total)), format: fmtPct, bar: { max: 100 } },
          { label: "Desarmes certos", icon: ShieldIcon, values: t.map((x) => x.tacklesOk) },
          { label: "Cartões amarelos", icon: RectangleVertical, values: t.map((x) => x.yellow), better: "low" },
        ]} />
      </Section>

      <Section title="Estatísticas p/90" sub="Média a cada 90 minutos jogados">
        <Rows cols={cols} rows={[
          { label: "Gols", icon: Goal, values: p90((i) => t[i].goals), format: fmt2 },
          { label: "Assistências", icon: Send, values: p90((i) => t[i].assists), format: fmt2 },
          { label: "Passes-chave", icon: Crosshair, values: p90((i) => t[i].keyPasses), format: fmt2 },
          { label: "Finalizações", icon: Target, values: p90((i) => t[i].shots), format: fmt2 },
          { label: "Passes certos", icon: Activity, values: p90((i) => t[i].passesOk), format: fmt1 },
          { label: "Dribles certos", icon: Zap, values: p90((i) => t[i].dribblesOk), format: fmt2 },
          { label: "Conduções", icon: Footprints, values: p90((i) => t[i].carriesOk), format: fmt2 },
          { label: "Desarmes", icon: ShieldIcon, values: p90((i) => t[i].tacklesOk), format: fmt2 },
          { label: "Interceptações", icon: Hand, values: p90((i) => t[i].interceptions), format: fmt2 },
          { label: "Recuperações", icon: Wind, values: p90((i) => t[i].recoveries), format: fmt2 },
          { label: "Duelos ganhos", icon: Swords, values: p90((i) => duels(t[i]).won), format: fmt2 },
        ]} />
      </Section>

      <Section title="Índices Zyron" sub="0 a 5, calculados das ações do vídeo por 90 minutos">
        <Rows cols={cols} rows={[
          { label: "Ofensivo", icon: Target, values: s.map((x) => (x.total.matches ? x.idx.ofensivo : null)), format: fmt1, bar: { max: 5 } },
          { label: "Construção", icon: Activity, values: s.map((x) => (x.total.matches ? x.idx.construcao : null)), format: fmt1, bar: { max: 5 } },
          { label: "Defensivo", icon: ShieldIcon, values: s.map((x) => (x.total.matches ? x.idx.defensivo : null)), format: fmt1, bar: { max: 5 } },
        ]} />
      </Section>

      <Section title="Métricas scout" sub="Avaliação da equipe Zyron, de 1 a 5">
        <Rows cols={cols} rows={SCOUT_GROUPS.map((g) => ({
          label: g.label,
          icon: Sparkles,
          values: m.map((x) => scoutGroupAverage(x.scout, g.key)),
          format: fmt1,
          bar: { max: 5 },
        }))} />
      </Section>

      <RadarSection cols={cols} />
    </div>
  )
}
