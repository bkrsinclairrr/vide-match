import { useId, type ReactNode } from "react"
import { Avatar } from "@/pages/voxen/ui"
import { useMounted } from "@/pages/voxen/charts"
import { RESULT_COLORS, fmt1, formatShortDate, ratingColor, resultOf, shieldOf, type Match, type Member } from "../model"
import type { MatchSummary } from "../metrics"

/** Foto do membro (se houver) ou iniciais; referência ganha selo. */
export function MemberAvatar({ member, size = 40, ring }: { member: Pick<Member, "fullName" | "photoUrl" | "kind">; size?: number; ring?: string }) {
  return (
    <span className="mb-avatar" style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px #0b0b0d, 0 0 0 4px ${ring}` : undefined }}>
      {member.photoUrl
        ? <img src={member.photoUrl} alt="" referrerPolicy="no-referrer" />
        : <Avatar name={member.fullName.replace(/^Referência · /, "")} size={size} />}
      {member.kind === "referencia" && <span className="mb-avatar-ref" title="Perfil de referência">R</span>}
    </span>
  )
}

/** Escudo genérico do adversário (iniciais + cor estável). */
export function Shield({ name, size = 28 }: { name: string; size?: number }) {
  const s = shieldOf(name)
  return (
    <span className="mb-shield" style={{ width: size, height: size * 1.12, fontSize: size * 0.36 }} title={name} aria-hidden="true">
      <svg viewBox="0 0 40 45" width={size} height={size * 1.12}>
        <path d="M20 1 L38 7 V21 C38 33 30 40 20 44 C10 40 2 33 2 21 V7 Z" fill={s.dark} stroke={s.color} strokeWidth="2" />
        <path d="M20 6 L33 10.5 V21 C33 30 27 35.5 20 38.8 Z" fill={s.color} opacity="0.35" />
      </svg>
      <b>{s.letters}</b>
    </span>
  )
}

export function ResultBadge({ match, size = 26 }: { match: Match; size?: number }) {
  const r = resultOf(match)
  if (!r) return <span className="mb-result" style={{ width: size, height: size }}>–</span>
  return (
    <span className="mb-result" style={{ width: size, height: size, color: RESULT_COLORS[r], background: `${RESULT_COLORS[r]}1f`, boxShadow: `inset 0 0 0 1px ${RESULT_COLORS[r]}55` }}>
      {r}
    </span>
  )
}

export function RatingChip({ rating, size = "md" }: { rating: number | null; size?: "sm" | "md" | "lg" }) {
  const c = ratingColor(rating)
  const dims = size === "lg" ? { minWidth: 54, height: 34, fontSize: 18 } : size === "sm" ? { minWidth: 34, height: 22, fontSize: 11.5 } : {}
  return (
    <span className="vx-score" style={{ color: c, background: `${c}1c`, ...dims }}>
      {rating === null ? "—" : fmt1(rating)}
    </span>
  )
}

/** Título de seção centralizado, com linhas dos lados (como nas referências). */
export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-section-title">
      <span className="mb-section-line" />
      <div className="text-center">
        <h3>{children}</h3>
        {sub && <p>{sub}</p>}
      </div>
      <span className="mb-section-line" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Últimas partidas: barras pela nota, com o escudo do adversário      */
/* ------------------------------------------------------------------ */

export function MatchBars({ matches, max = 8, height = 132, onOpen }: {
  /** Da mais recente para a mais antiga (como sai de summarizeProfile). */
  matches: MatchSummary[]
  max?: number
  height?: number
  onOpen?: (m: MatchSummary) => void
}) {
  const on = useMounted()
  const list = matches.slice(0, max).reverse()
  if (!list.length) return <p className="py-6 text-center text-[12.5px] text-zinc-500">Nenhuma partida analisada ainda.</p>
  return (
    <div className="mb-bars" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
      {list.map((m, i) => {
        const c = ratingColor(m.rating)
        return (
          <button
            key={m.match.id}
            type="button"
            className="mb-bar-col"
            onClick={() => onOpen?.(m)}
            disabled={!onOpen}
            title={`${m.match.opponent} · ${m.match.goalsFor ?? "–"}×${m.match.goalsAgainst ?? "–"} · nota ${fmt1(m.rating)} · ${formatShortDate(m.match.playedOn)}`}
          >
            <Shield name={m.match.opponent} size={24} />
            <span className="mb-bar-track" style={{ height }}>
              <span
                className="mb-bar-fill"
                style={{
                  height: on ? `${Math.max(6, (m.rating / 10) * 100)}%` : "0%",
                  background: `linear-gradient(180deg, ${c}, ${c}aa)`,
                  boxShadow: `0 0 18px -4px ${c}`,
                  transitionDelay: `${i * 70}ms`,
                }}
              />
              <span className="mb-bar-value tnum" style={{ color: c, bottom: on ? `calc(${Math.max(6, (m.rating / 10) * 100)}% + 4px)` : "0%", transitionDelay: `${i * 70}ms` }}>
                {fmt1(m.rating)}
              </span>
            </span>
            <span className="mb-bar-date tnum">{formatShortDate(m.match.playedOn)}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Evolução: linhas por partida (nota, % de passe, % de duelos)        */
/* ------------------------------------------------------------------ */

export const LINE_SERIES = [
  { key: "nota", label: "Nota", color: "#fbbf24" },
  { key: "passe", label: "% de passe", color: "#38bdf8" },
  { key: "duelos", label: "% de duelos", color: "#34d399" },
] as const

function smooth(points: [number, number][]) {
  if (points.length < 2) return ""
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const [x3, y3] = points[i + 2] ?? points[i + 1]
    d += ` C ${x1 + (x2 - x0) * 0.16} ${y1 + (y2 - y0) * 0.16}, ${x2 - (x3 - x1) * 0.16} ${y2 - (y3 - y1) * 0.16}, ${x2} ${y2}`
  }
  return d
}

export function MiniLines({ matches, max = 8, height = 120 }: { matches: MatchSummary[]; max?: number; height?: number }) {
  const list = matches.slice(0, max).reverse()
  const gid = useId().replace(/:/g, "")
  if (list.length < 2) return <p className="py-4 text-center text-[12px] text-zinc-500">A evolução aparece a partir de 2 partidas.</p>
  const W = 300
  const H = height
  const pad = 10
  const x = (i: number) => pad + (i / (list.length - 1)) * (W - pad * 2)
  const y = (v: number) => pad + (1 - v / 10) * (H - pad * 2)
  const values = (key: (typeof LINE_SERIES)[number]["key"]) => list.map((m) => {
    if (key === "nota") return m.rating
    if (key === "passe") return m.line.passes ? (m.line.passesOk / m.line.passes) * 10 : null
    const total = m.line.groundDuels + m.line.aerials
    return total ? ((m.line.groundDuelsWon + m.line.aerialsWon) / total) * 10 : null
  })

  return (
    <div className="mb-lines">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[2.5, 5, 7.5].map((v) => <line key={v} x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} className="vx-area-grid" />)}
        {LINE_SERIES.map((s, si) => {
          const pts = values(s.key).map((v, i) => (v === null ? null : [x(i), y(v)] as [number, number])).filter((p): p is [number, number] => p !== null)
          if (pts.length < 2) return null
          const path = smooth(pts)
          return (
            <g key={s.key}>
              {si === 0 && <path d={`${path} L ${pts.at(-1)?.[0]} ${H - pad} L ${pts[0][0]} ${H - pad} Z`} fill={`url(#${gid}-f)`} className="vx-area-fill" />}
              <path d={path} fill="none" stroke={s.color} strokeWidth="2" pathLength={1} className="vx-area-line" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${si * 160}ms` }} />
            </g>
          )
        })}
      </svg>
      <div className="mb-lines-legend">
        {LINE_SERIES.map((s) => (
          <span key={s.key}><i className="mb-swatch" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  )
}
