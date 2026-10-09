import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { prefersReducedMotion } from "@/hooks/useScrollAnimations"

/* ------------------------------------------------------------------ */
/* Contador animado                                                    */
/* ------------------------------------------------------------------ */

export function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const fromRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (target - from) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const v = useCountUp(value)
  return <>{v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}

/** Liga `true` no frame seguinte à montagem — para barras crescerem do zero. */
export function useMounted() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return on
}

/* ------------------------------------------------------------------ */
/* Radar                                                               */
/* ------------------------------------------------------------------ */

export type RadarSeries = { name: string; color: string; values: number[] }

/**
 * Radar em SVG. `values` vão de 0 a 1 (o chamador normaliza a escala).
 * Cada polígono entra crescendo do centro, um pouco depois do anterior.
 */
export function RadarChart({
  axes, series, size = 340, levels = 4, showValues,
}: {
  axes: string[]
  series: RadarSeries[]
  size?: number
  levels?: number
  showValues?: (string | number)[]
}) {
  const pad = 58
  const c = size / 2
  const r = c - pad
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2
  const point = (i: number, v: number) => [c + Math.cos(angle(i)) * r * v, c + Math.sin(angle(i)) * r * v] as const
  const ring = (v: number) => axes.map((_, i) => point(i, v).join(",")).join(" ")
  const gid = useId().replace(/:/g, "")

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="vx-radar" role="img" aria-label={`Radar: ${axes.join(", ")}`}>
      <defs>
        {series.map((s, i) => (
          <radialGradient key={i} id={`${gid}-g${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.05} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.32} />
          </radialGradient>
        ))}
        <filter id={`${gid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {Array.from({ length: levels }, (_, l) => (
        <polygon key={l} points={ring((l + 1) / levels)} className="vx-radar-ring" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="vx-radar-axis" />
      })}

      {series.map((s, si) => (
        <g key={s.name + si} className="vx-radar-shape" style={{ transformOrigin: `${c}px ${c}px`, animationDelay: `${si * 140}ms` }}>
          <polygon
            points={s.values.map((v, i) => point(i, Math.max(0.04, Math.min(1, v))).join(",")).join(" ")}
            fill={`url(#${gid}-g${si})`}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            filter={series.length === 1 ? `url(#${gid}-glow)` : undefined}
          />
          {s.values.map((v, i) => {
            const [x, y] = point(i, Math.max(0.04, Math.min(1, v)))
            return <circle key={i} cx={x} cy={y} r={3.4} fill="#0b0b0d" stroke={s.color} strokeWidth={2} />
          })}
        </g>
      ))}

      {axes.map((label, i) => {
        const [x, y] = point(i, 1.13)
        const cos = Math.cos(angle(i))
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end"
        return (
          <text key={label} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="vx-radar-label">
            {label}
            {showValues && <tspan className="vx-radar-value" dx={4}>{showValues[i]}</tspan>}
          </text>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Anel (nota geral)                                                   */
/* ------------------------------------------------------------------ */

export function Ring({
  value, max = 100, size = 132, stroke = 10, color = "#fbbf24", children, track = "rgba(255,255,255,0.07)",
}: {
  value: number; max?: number; size?: number; stroke?: number; color?: string; children?: ReactNode; track?: string
}) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  const on = useMounted()
  const pct = Math.max(0, Math.min(1, value / max))
  return (
    <div className="vx-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={on ? len * (1 - pct) : len}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 8px ${color}66)` }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="vx-ring-center">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Campo                                                               */
/* ------------------------------------------------------------------ */

export type PitchMarker = {
  x: number
  y: number
  label: string
  name?: string
  highlight?: boolean
  color?: string
  onClick?: () => void
  title?: string
}

/** Campo vertical (ataque em cima). x/y em % do campo. */
export function Pitch({ markers, heat = [], className = "" }: { markers: PitchMarker[]; heat?: { x: number; y: number }[]; className?: string }) {
  const W = 68
  const H = 105
  const gid = useId().replace(/:/g, "")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`vx-pitch ${className}`} role="img" aria-label="Campo com posições">
      <defs>
        <linearGradient id={`${gid}-grass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123b22" />
          <stop offset="100%" stopColor="#0b2a17" />
        </linearGradient>
        <radialGradient id={`${gid}-heat`}>
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#f97316" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="2.5" fill={`url(#${gid}-grass)`} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x="0" y={i * 15} width={W} height="7.5" fill="rgba(255,255,255,0.025)" />
      ))}
      {heat.map((h, i) => (
        <circle key={i} cx={(W * h.x) / 100} cy={(H * h.y) / 100} r="17" fill={`url(#${gid}-heat)`} className="vx-pitch-heat" />
      ))}
      <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.35">
        <rect x="2" y="2" width={W - 4} height={H - 4} />
        <line x1="2" y1={H / 2} x2={W - 2} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r="9.15" />
        <rect x={(W - 40.3) / 2} y="2" width="40.3" height="16.5" />
        <rect x={(W - 18.3) / 2} y="2" width="18.3" height="5.5" />
        <rect x={(W - 40.3) / 2} y={H - 18.5} width="40.3" height="16.5" />
        <rect x={(W - 18.3) / 2} y={H - 7.5} width="18.3" height="5.5" />
        <path d={`M ${W / 2 - 7.3} 18.5 A 9.15 9.15 0 0 0 ${W / 2 + 7.3} 18.5`} />
        <path d={`M ${W / 2 - 7.3} ${H - 18.5} A 9.15 9.15 0 0 1 ${W / 2 + 7.3} ${H - 18.5}`} />
      </g>
      <circle cx={W / 2} cy={H / 2} r="0.6" fill="rgba(255,255,255,0.35)" />

      {markers.map((m, i) => {
        const cx = (W * m.x) / 100
        const cy = (H * m.y) / 100
        const color = m.color ?? (m.highlight ? "#fbbf24" : "rgba(255,255,255,0.75)")
        return (
          <g
            key={i}
            className={`vx-pitch-marker ${m.onClick ? "is-clickable" : ""}`}
            style={{ animationDelay: `${120 + i * 45}ms` }}
            onClick={m.onClick}
          >
            {m.title && <title>{m.title}</title>}
            {m.highlight && <circle cx={cx} cy={cy} r="4.4" fill="none" stroke={color} strokeWidth="0.5" className="vx-pitch-pulse" />}
            <circle cx={cx} cy={cy} r="3.5" fill={m.highlight ? "rgba(251,191,36,0.25)" : "rgba(8,8,10,0.82)"} stroke={color} strokeWidth="0.55" />
            <text x={cx} y={cy + 0.05} textAnchor="middle" dominantBaseline="middle" className="vx-pitch-code" fill={m.highlight ? "#fde68a" : "#f5f5f4"}>
              {m.label}
            </text>
            {m.name && (
              <text x={cx} y={cy + 6.4} textAnchor="middle" className="vx-pitch-name" fill={m.highlight ? "#fde68a" : "rgba(255,255,255,0.72)"}>
                {m.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Área (série temporal)                                               */
/* ------------------------------------------------------------------ */

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return ""
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const [x3, y3] = points[i + 2] ?? points[i + 1]
    const t = 0.18
    d += ` C ${x1 + (x2 - x0) * t} ${y1 + (y2 - y0) * t}, ${x2 - (x3 - x1) * t} ${y2 - (y3 - y1) * t}, ${x2} ${y2}`
  }
  return d
}

export function AreaChart({
  data, height = 220, color = "#fbbf24", format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  format?: (v: number) => string
}) {
  const W = 720
  const H = height
  const padT = 18
  const padB = 26
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15
  const step = data.length > 1 ? W / (data.length - 1) : W
  const pts = data.map((d, i) => [i * step, padT + (H - padT - padB) * (1 - d.value / max)] as [number, number])
  const line = smoothPath(pts)
  const area = pts.length ? `${line} L ${W} ${H - padB} L 0 ${H - padB} Z` : ""
  const gid = useId().replace(/:/g, "")
  const [hover, setHover] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const ticks = useMemo(() => {
    const n = data.length
    if (n <= 1) return []
    const every = Math.ceil(n / 6)
    return data.map((d, i) => ({ i, label: d.label })).filter(({ i }) => i % every === 0 || i === n - 1)
  }, [data])

  const onMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || data.length < 2) return
    const x = ((e.clientX - rect.left) / rect.width) * W
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(x / step))))
  }

  return (
    <div ref={wrapRef} className="vx-area" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={padT + (H - padT - padB) * f} y2={padT + (H - padT - padB) * f} className="vx-area-grid" />
        ))}
        <path d={area} fill={`url(#${gid}-fill)`} className="vx-area-fill" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.4" pathLength={1} className="vx-area-line" vectorEffect="non-scaling-stroke" />
        {hover !== null && pts[hover] && (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={H - padB} className="vx-area-cursor" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {hover !== null && pts[hover] && (
        <>
          <span className="vx-area-dot" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: pts[hover][1], background: color }} />
          <div className="vx-area-tip" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: pts[hover][1] }}>
            <strong>{format(data[hover].value)}</strong>
            <span>{data[hover].label}</span>
          </div>
        </>
      )}
      <div className="vx-area-ticks">
        {ticks.map((t) => (
          <span key={t.i} style={{ left: `${(t.i / (data.length - 1)) * 100}%` }}>{t.label}</span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Rosca                                                               */
/* ------------------------------------------------------------------ */

export function Donut({
  slices, size = 180, stroke = 22, center,
}: {
  slices: { label: string; value: number; color: string }[]
  size?: number
  stroke?: number
  center?: ReactNode
}) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  const total = slices.reduce((a, s) => a + s.value, 0) || 1
  const on = useMounted()
  let acc = 0
  return (
    <div className="vx-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {slices.map((s, i) => {
          const frac = s.value / total
          const gap = slices.length > 1 ? Math.min(0.006, frac / 3) : 0
          const dash = Math.max(0, frac - gap) * len
          const offset = -acc * len
          acc += frac
          return (
            <circle
              key={s.label + i}
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${on ? dash : 0} ${len}`} strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: `stroke-dasharray 1.1s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms` }}
            />
          )
        })}
      </svg>
      <div className="vx-ring-center">{center}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barra fina                                                          */
/* ------------------------------------------------------------------ */

export function Meter({ value, color, height = 6, delay = 0 }: { value: number; color: string; height?: number; delay?: number }) {
  const on = useMounted()
  return (
    <div className="vx-meter" style={{ height }}>
      <div
        className="vx-meter-fill"
        style={{
          width: on ? `${Math.max(0, Math.min(100, value))}%` : "0%",
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 12px ${color}55`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mapa de calor (dia da semana × hora)                                */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function HeatGrid({ matrix }: { matrix: number[][] }) {
  const max = Math.max(1, ...matrix.flat())
  return (
    <div className="vx-heat" role="img" aria-label="Entradas por dia da semana e hora">
      <div className="vx-heat-hours">
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h}>{h % 3 === 0 ? `${h}h` : ""}</span>)}
      </div>
      {matrix.map((row, d) => (
        <div key={d} className="vx-heat-row">
          <span className="vx-heat-day">{WEEKDAYS[d]}</span>
          {row.map((v, h) => {
            const t = v / max
            return (
              <span
                key={h}
                className="vx-heat-cell"
                title={`${WEEKDAYS[d]}, ${h}h: ${v} entrada${v === 1 ? "" : "s"}`}
                style={{
                  background: v === 0
                    ? "rgba(255,255,255,0.035)"
                    : `rgba(${Math.round(251 - t * 30)}, ${Math.round(191 - t * 95)}, ${Math.round(36 - t * 14)}, ${0.18 + t * 0.82})`,
                  animationDelay: `${(d * 24 + h) * 4}ms`,
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
