import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  initials, positionCode, scoreTone, stageInfo, type Player, type StageKey,
} from "./data"

/** Marca da VOXEN: placa dourada com um "V" facetado. */
export function VoxenMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-[0_0_24px_-6px_rgba(251,191,36,0.85)]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.66} height={size * 0.66}>
        <path d="M12 14 H25 L32 38 L39 14 H52 L38 50 H26 Z" fill="#0a0a0a" />
        <path d="M32 38 L39 14 H52 L38 50 Z" fill="#0a0a0a" opacity="0.72" />
      </svg>
    </span>
  )
}

export function VoxenWordmark({ size = 36, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <VoxenMark size={size} />
      <span>
        <span className="vx-brand-word block">VOXEN</span>
        {sub && <span className="vx-brand-sub block">Scouting · Zyron</span>}
      </span>
    </span>
  )
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#fde68a,#f59e0b)",
  "linear-gradient(135deg,#a7f3d0,#10b981)",
  "linear-gradient(135deg,#fed7aa,#ea580c)",
  "linear-gradient(135deg,#bae6fd,#0284c7)",
  "linear-gradient(135deg,#fef3c7,#d97706)",
  "linear-gradient(135deg,#d9f99d,#65a30d)",
]

function hueIndex(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h) % AVATAR_GRADIENTS.length
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="vx-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36, background: AVATAR_GRADIENTS[hueIndex(name)] }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function ScoreChip({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const tone = scoreTone(score)
  const dims = size === "lg" ? { minWidth: 52, height: 34, fontSize: 18 } : size === "sm" ? { minWidth: 30, height: 22, fontSize: 11 } : {}
  return (
    <span className="vx-score" style={{ color: tone.color, background: tone.bg, ...dims }}>
      {score}
    </span>
  )
}

export function PosBadge({ player }: { player: Player }) {
  const code = positionCode(player)
  return <span className={`vx-pos ${code === "—" ? "vx-pos--none" : ""}`}>{code}</span>
}

export function StageTag({ stage }: { stage: StageKey }) {
  const info = stageInfo(stage)
  return (
    <span className="vx-tag" style={{ color: info.color, background: `${info.color}1a`, boxShadow: `inset 0 0 0 1px ${info.color}40` }}>
      <span className="vx-stage-dot" style={{ background: info.color }} />
      {info.label}
    </span>
  )
}

export const playerPath = (p: Player) => `/voxen/jogadores/${encodeURIComponent(p.key)}`

/** Comparativo com até 3 atletas; o URLSearchParams cuida da codificação. */
export const comparePath = (keys: string[]) => `/voxen/comparativo?${new URLSearchParams({ p: keys.join(",") })}`

export function PlayerLink({ player, children, className = "" }: { player: Player; children: ReactNode; className?: string }) {
  return <Link to={playerPath(player)} className={className}>{children}</Link>
}

export function CardHead({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="vx-card-head">
      <div className="min-w-0">
        <h2 className="vx-card-title">{title}</h2>
        {sub && <p className="vx-card-sub">{sub}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="vx-empty">
      <span className="vx-empty-icon">{icon}</span>
      <strong className="text-[14.5px] text-white">{title}</strong>
      {children && <div className="max-w-md">{children}</div>}
    </div>
  )
}

export function Skeleton({ h = 16, w = "100%", r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="vx-skel" style={{ height: h, width: w, borderRadius: r }} />
}

export function PageSkeleton() {
  return (
    <div className="vx-grid">
      <div className="vx-grid grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="vx-card"><Skeleton h={14} w="40%" /><div className="h-4" /><Skeleton h={30} w="55%" /></div>)}
      </div>
      <div className="vx-grid xl:grid-cols-[2fr_1fr]">
        <div className="vx-card"><Skeleton h={240} /></div>
        <div className="vx-card"><Skeleton h={240} /></div>
      </div>
    </div>
  )
}
