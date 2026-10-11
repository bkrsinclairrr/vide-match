import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Activity, ArrowRight, Crosshair, Flame, MoveHorizontal, Ruler } from "lucide-react"
import { POSITIONS } from "@/pages/voxen/data"
import { GROUPS, actionInfo, eventTone, formatClock, type MatchEvent } from "../model"
import { zoneInsights } from "../metrics"

/* ------------------------------------------------------------------ */
/* Campo horizontal (105 × 68 m)                                       */
/* ------------------------------------------------------------------ */

const W = 105
const H = 68

/** Linhas do campo, com o ataque para a direita. */
export function PitchLines({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`mb-pitch-lines ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.32">
        <rect x="0.6" y="0.6" width={W - 1.2} height={H - 1.2} rx="0.4" />
        <line x1={W / 2} y1="0.6" x2={W / 2} y2={H - 0.6} />
        <circle cx={W / 2} cy={H / 2} r="9.15" />
        <rect x="0.6" y={(H - 40.32) / 2} width="15.9" height="40.32" />
        <rect x="0.6" y={(H - 18.32) / 2} width="4.9" height="18.32" />
        <rect x={W - 16.5} y={(H - 40.32) / 2} width="15.9" height="40.32" />
        <rect x={W - 5.5} y={(H - 18.32) / 2} width="4.9" height="18.32" />
        <path d={`M 16.5 ${H / 2 - 7.31} A 9.15 9.15 0 0 1 16.5 ${H / 2 + 7.31}`} />
        <path d={`M ${W - 16.5} ${H / 2 - 7.31} A 9.15 9.15 0 0 0 ${W - 16.5} ${H / 2 + 7.31}`} />
        <path d="M 0.6 1.6 A 1 1 0 0 0 1.6 0.6 M 103.4 0.6 A 1 1 0 0 0 104.4 1.6 M 0.6 66.4 A 1 1 0 0 1 1.6 67.4 M 103.4 67.4 A 1 1 0 0 1 104.4 66.4" />
      </g>
      <g fill="rgba(255,255,255,0.6)">
        <circle cx={W / 2} cy={H / 2} r="0.45" />
        <circle cx="11" cy={H / 2} r="0.4" />
        <circle cx={W - 11} cy={H / 2} r="0.4" />
      </g>
      <g stroke="rgba(255,255,255,0.85)" strokeWidth="0.9" strokeLinecap="round">
        <line x1="0.6" y1={H / 2 - 3.66} x2="0.6" y2={H / 2 + 3.66} />
        <line x1={W - 0.6} y1={H / 2 - 3.66} x2={W - 0.6} y2={H / 2 + 3.66} />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Mapa de calor                                                       */
/* ------------------------------------------------------------------ */

let LUT: Uint8ClampedArray | null = null

/** Escala de cor: verde nas bordas, amarelo, laranja e vermelho no núcleo. */
function colorLut() {
  if (LUT) return LUT
  const c = document.createElement("canvas")
  c.width = 256
  c.height = 1
  const g = c.getContext("2d") as CanvasRenderingContext2D
  const grad = g.createLinearGradient(0, 0, 256, 0)
  grad.addColorStop(0, "rgba(0,0,0,0)")
  grad.addColorStop(0.1, "rgba(22,163,74,0)")
  grad.addColorStop(0.2, "rgba(34,197,94,0.38)")
  grad.addColorStop(0.38, "rgba(163,230,53,0.52)")
  grad.addColorStop(0.52, "rgba(250,204,21,0.66)")
  grad.addColorStop(0.68, "rgba(249,115,22,0.78)")
  grad.addColorStop(0.84, "rgba(239,68,68,0.87)")
  grad.addColorStop(1, "rgba(190,18,60,0.94)")
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 1)
  LUT = g.getImageData(0, 0, 256, 1).data
  return LUT
}

/** Densidade por núcleo gaussiano numa grade de ~1,4 célula por metro. */
function densityImage(points: { x: number; y: number }[]) {
  const scale = 1.4
  const cols = Math.round(W * scale)
  const rows = Math.round(H * scale)
  const grid = new Float32Array(cols * rows)
  const n = points.length
  const sigmaM = Math.min(8.5, Math.max(4.2, 10 - 1.15 * Math.log(Math.max(1, n))))
  const sigma = sigmaM * scale
  const radius = Math.ceil(sigma * 3)
  const kernel: number[] = []
  for (let d = -radius; d <= radius; d++) kernel.push(Math.exp(-(d * d) / (2 * sigma * sigma)))

  for (const p of points) {
    const cx = (p.x / 100) * cols
    const cy = (p.y / 100) * rows
    const x0 = Math.max(0, Math.floor(cx - radius))
    const x1 = Math.min(cols - 1, Math.ceil(cx + radius))
    const y0 = Math.max(0, Math.floor(cy - radius))
    const y1 = Math.min(rows - 1, Math.ceil(cy + radius))
    for (let y = y0; y <= y1; y++) {
      const ky = kernel[Math.min(kernel.length - 1, Math.max(0, Math.round(y - cy) + radius))]
      const row = y * cols
      for (let x = x0; x <= x1; x++) {
        grid[row + x] += ky * kernel[Math.min(kernel.length - 1, Math.max(0, Math.round(x - cx) + radius))]
      }
    }
  }

  let max = 0
  for (let i = 0; i < grid.length; i++) if (grid[i] > max) max = grid[i]
  const lut = colorLut()
  const img = new ImageData(cols, rows)
  if (max > 0) {
    for (let i = 0; i < grid.length; i++) {
      const v = Math.pow(grid[i] / max, 0.72)
      const k = Math.min(255, Math.round(v * 255)) * 4
      img.data[i * 4] = lut[k]
      img.data[i * 4 + 1] = lut[k + 1]
      img.data[i * 4 + 2] = lut[k + 2]
      img.data[i * 4 + 3] = lut[k + 3]
    }
  }
  return img
}

function HeatCanvas({ points }: { points: { x: number; y: number }[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!points.length) return
      const img = densityImage(points)
      const small = document.createElement("canvas")
      small.width = img.width
      small.height = img.height
      small.getContext("2d")?.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.filter = `blur(${Math.round(canvas.width / 260)}px)`
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height)
      ctx.filter = "none"
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [points])

  return <canvas ref={ref} className="mb-heat-canvas" aria-hidden="true" />
}

type Mode = "calor" | "acoes" | "zonas"
type Filter = "todas" | "com" | "sem"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas as ações" },
  { key: "com", label: "Com a bola" },
  { key: "sem", label: "Sem a bola" },
]

function applyFilter(events: MatchEvent[], filter: Filter, half: 0 | 1 | 2) {
  return events.filter((e) => {
    if (half && e.half !== half) return false
    const g = actionInfo(e.action).group
    if (filter === "com") return g === "ofensivo" || g === "construcao"
    if (filter === "sem") return g === "defensivo"
    return true
  })
}

/**
 * Mapa de calor do atleta. `controls` liga os modos (calor, ações, zonas),
 * os filtros e o recorte por tempo; `insights` mostra as leituras ao lado.
 */
export function HeatMap({
  events, controls = false, insights = false, compact = false, label,
}: {
  events: MatchEvent[]
  controls?: boolean
  insights?: boolean
  compact?: boolean
  label?: string
}) {
  const [mode, setMode] = useState<Mode>("calor")
  const [filter, setFilter] = useState<Filter>("todas")
  const [half, setHalf] = useState<0 | 1 | 2>(0)
  const hasHalves = events.some((e) => e.half === 2) && events.some((e) => e.half === 1)
  const shown = useMemo(() => applyFilter(events, filter, half), [events, filter, half])
  const info = useMemo(() => zoneInsights(shown), [shown])
  const zones = useMemo(() => {
    const cells = Array.from({ length: 18 }, () => 0)
    for (const e of shown) {
      const c = Math.min(5, Math.floor(e.x / (100 / 6)))
      const r = Math.min(2, Math.floor(e.y / (100 / 3)))
      cells[r * 6 + c]++
    }
    return cells
  }, [shown])
  const maxZone = Math.max(1, ...zones)
  const uid = useId().replace(/:/g, "")

  return (
    <div className={`mb-heat ${compact ? "is-compact" : ""} ${insights ? "has-insights" : ""}`}>
      {controls && (
        <div className="mb-heat-controls">
          <div className="vx-tabs" role="tablist" aria-label="Visualização">
            {([["calor", "Calor"], ["acoes", "Ações"], ["zonas", "Zonas"]] as [Mode, string][]).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={mode === k} className={`vx-tab ${mode === k ? "is-on" : ""}`} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
          <div className="vx-chips">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={`vx-chip ${filter === f.key ? "is-on" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
            {hasHalves && (
              <select className="vx-input vx-select vx-filter h-8 min-w-[120px] py-0 text-[12.5px]" value={half} onChange={(e) => setHalf(Number(e.target.value) as 0 | 1 | 2)} aria-label="Tempo de jogo">
                <option value={0}>Jogo todo</option>
                <option value={1}>1º tempo</option>
                <option value={2}>2º tempo</option>
              </select>
            )}
          </div>
        </div>
      )}

      <div className="mb-heat-body">
        <div className="mb-heat-stage">
          <div
            className="mb-field"
            role="img"
            aria-label={`${label ? label + ": " : ""}mapa de ${shown.length} ações${info ? `, mais concentradas em ${info.topZone}` : ""}`}
          >
            {mode === "calor" && <HeatCanvas key={`${filter}-${half}`} points={shown} />}
            {mode === "zonas" && (
              <svg viewBox={`0 0 ${W} ${H}`} className="mb-field-layer" preserveAspectRatio="none" aria-hidden="true">
                {zones.map((v, i) => {
                  const c = i % 6
                  const r = Math.floor(i / 6)
                  const share = shown.length ? Math.round((v / shown.length) * 100) : 0
                  return (
                    <g key={i} className="mb-zone" style={{ animationDelay: `${i * 22}ms` }}>
                      <rect x={c * (W / 6) + 0.6} y={r * (H / 3) + 0.6} width={W / 6 - 1.2} height={H / 3 - 1.2} rx="1"
                        fill={`rgba(251,191,36,${0.06 + (v / maxZone) * 0.62})`} stroke="rgba(255,255,255,0.12)" strokeWidth="0.2" />
                      <text x={c * (W / 6) + W / 12} y={r * (H / 3) + H / 6 + 1.4} textAnchor="middle" className="mb-zone-text">{share}%</text>
                    </g>
                  )
                })}
              </svg>
            )}
            <PitchLines />
            {mode === "acoes" && (
              <svg viewBox={`0 0 ${W} ${H}`} className="mb-field-layer" preserveAspectRatio="none">
                <defs>
                  <filter id={`${uid}-glow`}><feGaussianBlur stdDeviation="0.35" /></filter>
                </defs>
                {shown.map((e, i) => {
                  const tone = eventTone(e)
                  const color = GROUPS[actionInfo(e.action).group].color
                  const cx = (e.x / 100) * W
                  const cy = (e.y / 100) * H
                  return (
                    <g key={e.id} className="mb-dot" style={{ animationDelay: `${Math.min(i, 120) * 6}ms` }}>
                      <title>{`${actionInfo(e.action).label}${tone === "fail" ? " (errada)" : ""} · ${formatClock(e.t)}`}</title>
                      {tone === "fail" ? (
                        <g stroke={color} strokeWidth="0.42" strokeLinecap="round">
                          <line x1={cx - 0.9} y1={cy - 0.9} x2={cx + 0.9} y2={cy + 0.9} />
                          <line x1={cx - 0.9} y1={cy + 0.9} x2={cx + 0.9} y2={cy - 0.9} />
                        </g>
                      ) : (
                        <>
                          <circle cx={cx} cy={cy} r="1.35" fill={color} opacity="0.35" filter={`url(#${uid}-glow)`} />
                          <circle cx={cx} cy={cy} r="0.85" fill={color} stroke="rgba(0,0,0,0.55)" strokeWidth="0.18" />
                        </>
                      )}
                    </g>
                  )
                })}
              </svg>
            )}
            {!shown.length && <div className="mb-field-empty">Sem ações registradas{filter !== "todas" ? " neste filtro" : ""}</div>}
          </div>
          {!compact && (
            <div className="mb-heat-foot">
              <span className="inline-flex items-center gap-1.5"><ArrowRight className="h-3.5 w-3.5" /> Direção do ataque</span>
              {mode === "calor" && <span className="mb-heat-legend"><span>Menor</span><i /><span>Maior presença</span></span>}
              {mode === "acoes" && (
                <span className="flex flex-wrap gap-3">
                  {(["ofensivo", "construcao", "defensivo"] as const).map((g) => (
                    <span key={g} className="inline-flex items-center gap-1.5"><i className="mb-swatch" style={{ background: GROUPS[g].color }} />{GROUPS[g].label}</span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-zinc-500">× errada</span>
                </span>
              )}
              {mode === "zonas" && <span>% das ações em cada zona</span>}
            </div>
          )}
        </div>

        {insights && (
          <dl className="mb-heat-insights">
            <div><dt><Flame className="h-3.5 w-3.5" /> Zona mais ativa</dt><dd>{info ? info.topZone : "—"}</dd><small>{info ? `${info.topZoneShare}% das ações` : ""}</small></div>
            <div><dt><Crosshair className="h-3.5 w-3.5" /> Terço final</dt><dd className="tnum">{info ? `${info.finalThird}%` : "—"}</dd><small>das ações no último terço</small></div>
            <div><dt><MoveHorizontal className="h-3.5 w-3.5" /> Corredor preferido</dt><dd>{info ? info.corridor.replace("Corredor ", "") : "—"}</dd><small>{info ? `${info.corridorShare}% das ações` : ""}</small></div>
            <div><dt><Ruler className="h-3.5 w-3.5" /> Altura média</dt><dd className="tnum">{info ? `${info.avgMeters} m` : "—"}</dd><small>do próprio gol</small></div>
            <div><dt><Activity className="h-3.5 w-3.5" /> Ações no mapa</dt><dd className="tnum">{shown.length}</dd><small>{events.length !== shown.length ? `de ${events.length}` : "marcadas no vídeo"}</small></div>
          </dl>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Posições em campo (comparativo)                                     */
/* ------------------------------------------------------------------ */

/** Posições jogadas, no campo horizontal; o tamanho do ponto é a frequência. */
export function PositionsPitch({ positions, color }: { positions: { position: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...positions.map((p) => p.count))
  return (
    <div className="mb-field mb-field--sm" role="img" aria-label={`Posições: ${positions.map((p) => `${p.position} (${p.count})`).join(", ") || "não informadas"}`}>
      <PitchLines />
      <svg viewBox={`0 0 ${W} ${H}`} className="mb-field-layer" preserveAspectRatio="none" aria-hidden="true">
        {positions.map((p, i) => {
          const pos = POSITIONS[p.position]
          if (!pos) return null
          const cx = ((100 - pos.y) / 100) * W
          const cy = (pos.x / 100) * H
          const r = 3.2 + (p.count / max) * 2.4
          return (
            <g key={p.position} className="mb-dot" style={{ animationDelay: `${i * 90}ms` }}>
              {i === 0 && <circle cx={cx} cy={cy} r={r + 2.2} fill="none" stroke={color} strokeWidth="0.4" className="mb-pos-pulse" />}
              <circle cx={cx} cy={cy} r={r} fill={i === 0 ? color : "rgba(8,8,10,0.85)"} stroke={color} strokeWidth="0.5" />
              <text x={cx} y={cy + 0.9} textAnchor="middle" className="mb-pos-code" fill={i === 0 ? "#0a0a0a" : "#f5f5f4"}>{pos.code}</text>
              {p.count > 1 && <text x={cx + r + 1.2} y={cy - r + 1.5} className="mb-pos-count" fill={color}>{p.count}×</text>}
            </g>
          )
        })}
      </svg>
      {!positions.length && <div className="mb-field-empty">Posição não informada</div>}
    </div>
  )
}

