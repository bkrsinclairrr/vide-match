import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import {
  ArrowLeft, ArrowRight, Bell, Check, ChevronDown, FileText, Flame, HelpCircle, Menu, MessageCircle, Search, Sparkles,
  Star, TrendingUp,
} from "lucide-react"
import { prefersReducedMotion } from "@/lib/reducedMotion"
import { FEATURED_ATHLETE as A, clubLogo } from "./siteData"
import { ZyronLogo } from "./ZyronMark"

/**
 * "Print" do painel da Zyron no hero — o equivalente ao screenshot da
 * plataforma no footlink, mas desenhado em HTML: o relatório de um atleta
 * com a nota geral, o gráfico de desempenho (os 10 indicadores contra a
 * média da posição), o mapa de calor, a nota jogo a jogo e a oportunidade
 * encontrada no clube (Wolverhampton, Championship, com a oferta mensal).
 *
 * O painel é diagramado numa largura fixa e escalado para caber no
 * contêiner, como uma imagem. Em telas estreitas usa uma diagramação
 * própria, mais estreita e em blocos maiores, para continuar legível.
 */
const BASE_WIDTH = 1096
const NARROW_BASE = 700

function useFitScale() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ scale: 1, height: 0, narrow: false, cropped: false })

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const measure = () => {
      const width = outer.clientWidth
      const narrow = width < 560
      const scale = width / (narrow ? NARROW_BASE : BASE_WIDTH)
      const natural = inner.offsetHeight * scale
      const cap = narrow ? width * 1.5 : Infinity
      setBox({ scale, narrow, height: Math.min(natural, cap), cropped: natural > cap })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return { outerRef, innerRef, ...box }
}

/**
 * Liga as animações dos gráficos quando o painel aparece na tela (no computador ele
 * fica abaixo da dobra: animar no carregamento seria animar para ninguém ver).
 */
function useOnView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setOn(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setOn(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, on }
}

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

const CARD = "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"

const fmt1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const scoreOf = (label: string) => A.stats.find((s) => s.label === label)?.score ?? 0
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

function BrazilFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#16a34a" />
      <path d="M10 2 18 7 10 12 2 7Z" fill="#facc15" />
      <circle cx="10" cy="7" r="2.9" fill="#1d4ed8" />
    </svg>
  )
}

function EnglandFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#fafafa" />
      <rect x="8.4" width="3.2" height="14" fill="#dc2626" />
      <rect y="5.4" width="20" height="3.2" fill="#dc2626" />
    </svg>
  )
}

/** Anel de compatibilidade (o traço cresce ao aparecer). */
function CompatRing({ value, size = 60 }: { value: number; size?: number }) {
  const r = 22
  const len = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={r} fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round"
          className="zs-pl-ring" style={{ "--len": len } as CSSProperties}
          strokeDasharray={len} strokeDashoffset={len * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[14px] font-black">{value}%</span>
    </div>
  )
}

/** Curva suave pelos pontos (Catmull-Rom), para a linha da nota por jogo. */
function smooth(points: [number, number][]) {
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const [x3, y3] = points[i + 2] ?? points[i + 1]
    d += ` C ${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)}, ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return d
}

/* ------------------------------------------------------------------ */
/* Topo                                                                */
/* ------------------------------------------------------------------ */

function TopBar({ narrow }: { narrow: boolean }) {
  return (
    <div className="flex h-14 items-center gap-4 border-b border-white/[0.07] bg-[#0d0d0e] px-5">
      <Menu className="h-5 w-5 text-white/55" />
      <ZyronLogo size={26} />
      <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Análise concluída
      </span>
      {!narrow && (
        <div className="ml-6 flex h-9 w-[360px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white/40">
          <Search className="h-3.5 w-3.5" /> Buscar no relatório: indicadores, clubes, jogos...
        </div>
      )}
      <div className="ml-auto flex items-center gap-4 text-white/55">
        {!narrow && (
          <>
            <HelpCircle className="h-[18px] w-[18px]" />
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="relative">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0d0d0e]" />
            </span>
          </>
        )}
        <img src={A.photo} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-amber-400/50" />
      </div>
    </div>
  )
}

function Header({ narrow }: { narrow: boolean }) {
  return (
    <div className="flex items-center gap-4 bg-[#101011] px-7 pb-5 pt-6">
      {!narrow && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70">
          <ArrowLeft className="h-4 w-4" />
        </span>
      )}
      <img src={A.photo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/70 ring-offset-2 ring-offset-[#101011]" />
      <div className="min-w-0">
        <p className="text-[26px] font-bold leading-none tracking-[-0.02em]">{A.name}</p>
        <p className="mt-1.5 text-[12px] text-white/40">{A.fullName}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60">
          <BrazilFlag className="h-3 w-[17px]" /> Brasil • {A.age} anos • {A.position} • {A.category}
        </p>
        {!narrow && (
          <p className="mt-1 text-[11px] text-white/35">{A.height} • {A.weight} • pé {A.foot.toLowerCase()} • {A.city}</p>
        )}
      </div>

      <div className={`${narrow ? "ml-auto" : "ml-8"} flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.35)]`}>
        <span className="text-[26px] font-black leading-none text-black">{A.overall}</span>
        <span className="mt-0.5 text-[8px] font-bold tracking-widest text-black/70">GERAL</span>
      </div>

      {!narrow && (
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] py-2 pl-2 pr-4">
            <img src={clubLogo(A.club.slug)} alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-300/80">Oportunidade</p>
              <p className="text-[13px] font-semibold leading-tight">{A.club.name}</p>
              <p className="text-[11px] text-emerald-300">
                {A.offer.currency}{A.offer.amount}/{A.offer.period} · {A.club.compatibility}% compatível
              </p>
            </div>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 text-amber-300">
            <FileText className="h-4 w-4" />
          </span>
          <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 text-[13px] font-bold text-black">
            Relatório completo <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      )}
    </div>
  )
}

const TABS = ["Visão geral", "Desempenho", "Mapa de calor", "Oportunidades", "Pontos a melhorar", "Vídeos"]

function Tabs() {
  return (
    <div className="flex gap-8 border-b border-white/[0.07] bg-[#101011] px-7 text-[13px]">
      {TABS.map((tab, i) => (
        <span key={tab} className={i === 0 ? "border-b-2 border-amber-400 pb-3 font-semibold text-amber-300" : "pb-3 text-white/50"}>
          {tab}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gráfico de desempenho: os 10 indicadores contra a média da posição  */
/* ------------------------------------------------------------------ */

/** Ordem em volta do radar: ataque no alto, defesa embaixo, construção à esquerda. */
const RADAR_AXES = [
  ["Ataque", "ATA"], ["Finalização", "FIN"], ["Chute", "CHU"], ["Drible", "DRI"], ["Velocidade", "VEL"],
  ["Defesa", "DEF"], ["Marcação", "MAR"], ["Domínio", "DOM"], ["Passe", "PAS"], ["Leitura de Jogo", "LEI"],
] as const

const tone = (v: number) => (v >= 90 ? "#6ee7b7" : v >= 84 ? "#fcd34d" : "#fdba74")

function RadarCard({ style }: { style?: CSSProperties }) {
  const gid = useId().replace(/:/g, "")
  const S = 236
  const C = S / 2
  const R = 78
  const n = RADAR_AXES.length
  const norm = (v: number) => Math.max(0, Math.min(1, (v - 60) / 40))
  const at = (i: number, k: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [C + Math.cos(a) * R * k, C + Math.sin(a) * R * k]
  }
  const ring = (k: number) => RADAR_AXES.map((_, i) => at(i, k).map((p) => p.toFixed(1)).join(",")).join(" ")
  const mine = RADAR_AXES.map(([label]) => scoreOf(label))
  const ref = RADAR_AXES.map(([label]) => A.reference[label])
  const poly = (vals: number[]) => vals.map((v, i) => at(i, norm(v)).map((p) => p.toFixed(1)).join(",")).join(" ")
  const lead = Math.round(mean(mine) - mean(ref))

  return (
    <div className={`${CARD} flex flex-col`} style={style}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold">Gráfico de desempenho</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-300">
          <TrendingUp className="h-3 w-3" /> +{lead}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-white/45">{A.name.split(" ")[0]} × média dos meias Sub-20</p>

      <div className="flex flex-1 items-center justify-center">
        <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className="mt-1 block overflow-visible">
          <defs>
            <radialGradient id={`${gid}-fill`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.14" />
            </radialGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon key={k} points={ring(k)} fill={k === 1 ? "rgba(255,255,255,0.02)" : "none"} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          ))}
          {RADAR_AXES.map((_, i) => {
            const [x, y] = at(i, 1)
            return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          })}
          <polygon points={poly(ref)} fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeOpacity="0.75" strokeWidth="1.2" strokeDasharray="3 3" strokeLinejoin="round" />
          <g className="zs-pl-radar">
            <polygon points={poly(mine)} fill={`url(#${gid}-fill)`} stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.55))" }} />
            {mine.map((v, i) => {
              const [x, y] = at(i, norm(v))
              return <circle key={i} cx={x} cy={y} r="2.6" fill="#0b0b0c" stroke="#fde68a" strokeWidth="1.5" />
            })}
          </g>
          {RADAR_AXES.map(([, abbr], i) => {
            const [x, y] = at(i, (R + 21) / R)
            return (
              <text key={abbr} x={x} y={y} textAnchor="middle">
                <tspan x={x} dy="-2" fontSize="8.5" fontWeight="700" letterSpacing="0.6" fill="rgba(255,255,255,0.45)">{abbr}</tspan>
                <tspan x={x} dy="11" fontSize="10.5" fontWeight="800" fill={tone(mine[i])}>{mine[i]}</tspan>
              </text>
            )
          })}
        </svg>
      </div>

      <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-white/55">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" /> {A.name.split(" ")[0]} · {A.overall}</span>
        <span className="flex items-center gap-1.5"><i className="h-0 w-3 border-t-2 border-dashed border-sky-400" /> Média · {Math.round(mean(ref))}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mapa de calor                                                       */
/* ------------------------------------------------------------------ */

function Pitch() {
  return (
    <g fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.35">
      <rect x="0.6" y="0.6" width="103.8" height="66.8" />
      <line x1="52.5" y1="0.6" x2="52.5" y2="67.4" />
      <circle cx="52.5" cy="34" r="9.15" />
      <rect x="0.6" y="13.85" width="16.4" height="40.3" />
      <rect x="88" y="13.85" width="16.4" height="40.3" />
      <rect x="0.6" y="24.85" width="5.4" height="18.3" />
      <rect x="99" y="24.85" width="5.4" height="18.3" />
      <path d="M 17 27.09 A 9.15 9.15 0 0 1 17 40.91" />
      <path d="M 88 27.09 A 9.15 9.15 0 0 0 88 40.91" />
      <g fill="rgba(255,255,255,0.6)" stroke="none">
        <circle cx="52.5" cy="34" r="0.45" />
        <circle cx="11" cy="34" r="0.45" />
        <circle cx="94" cy="34" r="0.45" />
      </g>
    </g>
  )
}

function HeatCard({ narrow, style }: { narrow: boolean; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  return (
    <div className={CARD} style={style}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><Flame className="h-4 w-4 text-orange-400" /> Mapa de calor</p>
        {!narrow && (
          <div className="flex gap-1 text-[10.5px] font-semibold">
            {["Todas", "Com bola", "Sem bola"].map((t, i) => (
              <span key={t} className={i === 0 ? "rounded-md bg-amber-400/15 px-2 py-0.5 text-amber-300" : "rounded-md px-2 py-0.5 text-white/40"}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-white/45">Últimos {A.matches.length} jogos · {A.season.actions} ações marcadas no vídeo</p>

      <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]">
        <svg viewBox="0 0 105 68" className="block w-full">
          <defs>
            <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#176239" />
              <stop offset="100%" stopColor="#0c3720" />
            </linearGradient>
            {/* Densidade em tons de calor: verde onde ele passa, vermelho onde mais atua. */}
            <filter id={`${id}-heat`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="3.4" />
              <feColorMatrix type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0 0.16 0.98 1 1" />
                <feFuncG type="table" tableValues="0 0.82 0.86 0.48 0.14" />
                <feFuncB type="table" tableValues="0 0.42 0.12 0.06 0.08" />
                <feFuncA type="table" tableValues="0 0.42 0.68 0.84 0.94" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect width="105" height="68" fill={`url(#${id}-grass)`} />
          {Array.from({ length: 10 }, (_, i) => i % 2 === 0 && (
            <rect key={i} x={i * 10.5} width="10.5" height="68" fill="rgba(255,255,255,0.028)" />
          ))}
          <g className="zs-pl-heat" filter={`url(#${id}-heat)`}>
            {A.heat.map(([x, y, w], i) => <circle key={i} cx={x} cy={y} r="7.2" fill="#000" fillOpacity={w * 0.42} />)}
          </g>
          <Pitch />
        </svg>
        <span className="absolute bottom-2 right-3 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/65">
          Ataque <ArrowRight className="h-2.5 w-2.5" />
        </span>
        <span className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[8.5px] font-semibold text-white/55">
          menos
          <i className="h-1.5 w-14 rounded-full" style={{ background: "linear-gradient(90deg, #29d66b, #fadc1f, #ff7a10, #ff2414)" }} />
          mais
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          [`${A.season.finalThird}%`, "no terço final"],
          ["Entrelinhas", "zona mais ativa"],
          [String(A.season.actions), "ações no vídeo"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
            <p className="truncate text-[13px] font-bold text-white">{v}</p>
            <p className="text-[10px] text-white/45">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nota por partida                                                    */
/* ------------------------------------------------------------------ */

function MatchCard({ narrow, style }: { narrow: boolean; style?: CSSProperties }) {
  const gid = useId().replace(/:/g, "")
  const W = narrow ? 384 : 452
  const H = 156
  const padL = 24
  const padR = 18
  const padT = 22
  const padB = 22
  const ratings = A.matches.map((m) => m.rating)
  const x = (i: number) => padL + (i / (ratings.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - 6) / 4) * (H - padT - padB)
  const pts = ratings.map((v, i) => [x(i), y(v)] as [number, number])
  const line = smooth(pts)
  const area = `${line} L ${x(ratings.length - 1).toFixed(1)} ${H - padB} L ${x(0).toFixed(1)} ${H - padB} Z`
  const last = pts[pts.length - 1]
  const growth = ratings[ratings.length - 1] - ratings[0]

  return (
    <div className={`${CARD} flex items-center gap-5`} style={style}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-semibold">Desempenho por partida</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-300">
            <TrendingUp className="h-3 w-3" /> +{fmt1(growth)} em {ratings.length} jogos
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-white/45">Nota Zyron em cada jogo · média {fmt1(mean(ratings))}</p>

        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mt-1 block overflow-visible">
          <defs>
            <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[7, 8, 9].map((v) => (
            <g key={v}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
              <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)">{v}</text>
            </g>
          ))}
          <line x1={padL} x2={W - padR} y1={y(A.positionAverage)} y2={y(A.positionAverage)} stroke="#38bdf8" strokeOpacity="0.6" strokeDasharray="4 3" />
          <text x={W - padR} y={y(A.positionAverage) + 11} textAnchor="end" fontSize="8.5" fill="#7dd3fc" fillOpacity="0.8">média da posição {fmt1(A.positionAverage)}</text>
          <path d={area} fill={`url(#${gid}-area)`} className="zs-pl-area" />
          <path d={line} fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" pathLength={1} className="zs-pl-line" style={{ filter: "drop-shadow(0 4px 8px rgba(251,191,36,0.35))" }} />
          {pts.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 4.2 : 3} fill="#0b0b0c" stroke={i === pts.length - 1 ? "#fde68a" : "#fbbf24"} strokeWidth="2"
              className="zs-pl-dot" style={{ "--i": i } as CSSProperties} />
          ))}
          <circle cx={last[0]} cy={last[1]} r="4.2" fill="none" stroke="#fde68a" strokeWidth="1.5" className="zs-pl-pulse" />
          <g transform={`translate(${last[0] - 22} ${last[1] - 30})`}>
            <rect width="44" height="19" rx="6" fill="#fbbf24" />
            <text x="22" y="13" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1a1203">{fmt1(ratings[ratings.length - 1])}</text>
          </g>
          {A.matches.map((m, i) => (
            <text key={m.date} x={x(i)} y={H - 4} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.35)">{m.date}</text>
          ))}
        </svg>
      </div>

      <div className="grid w-[196px] shrink-0 grid-cols-2 gap-2">
        {[
          [String(A.season.goals), "Gols"],
          [String(A.season.assists), "Assistências"],
          [`${A.season.passAccuracy}%`, "Passes certos"],
          [`${A.season.dribbles}%`, "Dribles certos"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <p className="text-[20px] font-extrabold leading-none tracking-[-0.02em] text-white">{v}</p>
            <p className="mt-1 text-[10px] text-white/45">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Oportunidade                                                        */
/* ------------------------------------------------------------------ */

const JOURNEY = [
  { label: `Relatório Zyron · nota ${A.overall}`, done: true },
  { label: `${A.matches.length} jogos analisados`, done: true },
  { label: "Perfil apresentado ao clube", done: true },
  { label: `Oferta do clube · ${A.offer.currency}${A.offer.amount}/${A.offer.period}`, done: false },
]

/** O que o clube procura e o que o atleta tem (todos batem: é por isso que a compatibilidade é alta). */
const CLUB_WANTS = [
  ["Canhoto", "esq."],
  ["Passe 90+", String(scoreOf("Passe"))],
  ["Leitura 90+", String(scoreOf("Leitura de Jogo"))],
  ["Até 21 anos", String(A.age)],
] as const

function OfferMoney({ size }: { size: number }) {
  return (
    <p className="zs-pl-money font-black leading-none tracking-[-0.03em]" style={{ fontSize: size }}>
      {A.offer.currency}{A.offer.amount}
    </p>
  )
}

function OfferCard({ style }: { style?: CSSProperties }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-400/[0.09] via-white/[0.02] to-emerald-400/[0.04] p-5" style={style}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
      <p className="relative flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
        <Sparkles className="h-3 w-3" /> Oportunidade encontrada
      </p>

      <div className="relative mt-4 flex items-center gap-3.5">
        <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <img src={clubLogo(A.club.slug)} alt="" className="h-14 w-14 object-contain" />
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight">{A.club.name}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-white/55">
            <EnglandFlag className="h-3 w-[17px]" /> {A.club.league} · {A.club.country}
          </p>
        </div>
      </div>

      <div className="relative mt-5 rounded-xl border border-amber-400/25 bg-black/30 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">Oferta/{A.offer.period}</p>
        <div className="mt-1.5 flex items-end gap-1.5">
          <OfferMoney size={38} />
          <span className="pb-1 text-[12px] font-semibold text-white/45">/{A.offer.period}</span>
        </div>
        <p className="mt-2 text-[11px] text-white/50">Elenco {A.club.squad} · {A.position}</p>
      </div>

      <div className="relative mt-4 flex items-center gap-3.5">
        <CompatRing value={A.club.compatibility} size={56} />
        <p className="text-[11.5px] leading-snug text-white/60">
          de compatibilidade com o perfil que o <strong className="text-white">{A.club.short}</strong> procura
        </p>
      </div>

      <p className="relative mt-5 text-[10px] font-bold uppercase tracking-widest text-white/40">O que o clube procura</p>
      <ul className="relative mt-2 grid grid-cols-2 gap-1.5">
        {CLUB_WANTS.map(([want, has]) => (
          <li key={want} className="flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1.5 text-[10.5px] text-white/70">
            <Check className="h-3 w-3 shrink-0 text-emerald-300" strokeWidth={3} />
            <span className="min-w-0 flex-1 truncate">{want}</span>
            <b className="text-emerald-300">{has}</b>
          </li>
        ))}
      </ul>

      <ol className="relative mt-5 flex flex-col gap-2.5">
        {JOURNEY.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-[11.5px]">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400 text-black shadow-[0_0_14px_rgba(251,191,36,0.6)]"}`}>
              {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : <Star className="h-2.5 w-2.5" fill="currentColor" />}
            </span>
            <span className={s.done ? "text-white/60" : "font-semibold text-amber-200"}>{s.label}</span>
          </li>
        ))}
      </ol>

      <span className="relative mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-[12.5px] font-bold text-black">
        Ver detalhes da oportunidade <ArrowRight className="h-4 w-4" />
      </span>
    </div>
  )
}

/** A mesma oportunidade em faixa, para a diagramação estreita (celular). */
function OfferStrip({ style }: { style?: CSSProperties }) {
  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/[0.1] via-white/[0.02] to-emerald-400/[0.05] p-5" style={style}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-16 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
      <span className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <img src={clubLogo(A.club.slug)} alt="" className="h-[52px] w-[52px] object-contain" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300"><Sparkles className="h-3 w-3" /> Oportunidade encontrada</p>
        <p className="mt-1 text-[17px] font-bold leading-tight">{A.club.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/55"><EnglandFlag className="h-3 w-[17px]" /> {A.club.league} · {A.club.country}</p>
      </div>
      <div className="relative shrink-0 text-right">
        <p className="text-[9.5px] font-bold uppercase tracking-widest text-amber-300/80">Oferta/{A.offer.period}</p>
        <div className="mt-1"><OfferMoney size={30} /></div>
      </div>
      <CompatRing value={A.club.compatibility} size={58} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Montagem                                                            */
/* ------------------------------------------------------------------ */

function PlatformCanvas({ narrow }: { narrow: boolean }) {
  return (
    <div className="text-white" style={{ width: narrow ? NARROW_BASE : BASE_WIDTH }}>
      <TopBar narrow={narrow} />
      <Header narrow={narrow} />
      {!narrow && <Tabs />}

      {narrow ? (
        <div className="grid gap-4 bg-[#0b0b0c] p-5" style={{ gridTemplateColumns: "284px minmax(0, 1fr)" }}>
          <OfferStrip style={{ gridColumn: "1 / span 2", gridRow: 1 }} />
          <RadarCard style={{ gridColumn: 1, gridRow: 2 }} />
          <HeatCard narrow style={{ gridColumn: 2, gridRow: 2 }} />
          <MatchCard narrow style={{ gridColumn: "1 / span 2", gridRow: 3 }} />
        </div>
      ) : (
        <div className="grid gap-5 bg-[#0b0b0c] p-6" style={{ gridTemplateColumns: "296px minmax(0, 1fr) 300px" }}>
          <RadarCard style={{ gridColumn: 1, gridRow: 1 }} />
          <HeatCard narrow={false} style={{ gridColumn: 2, gridRow: 1 }} />
          <OfferCard style={{ gridColumn: 3, gridRow: "1 / span 2" }} />
          <MatchCard narrow={false} style={{ gridColumn: "1 / span 2", gridRow: 2 }} />
        </div>
      )}
    </div>
  )
}

export default function HeroPlatform() {
  const { outerRef, innerRef, scale, height, narrow, cropped } = useFitScale()
  const view = useOnView<HTMLDivElement>()

  return (
    <div
      ref={view.ref}
      className="zs-mock-frame"
      role="img"
      aria-label={`Painel da Zyron com o relatório do atleta ${A.name}: nota geral ${A.overall}, gráfico de desempenho com os 10 indicadores, mapa de calor, nota jogo a jogo e a oportunidade no ${A.club.name} (${A.club.league}, ${A.club.country}), com oferta de ${A.offer.currency}${A.offer.amount} por ${A.offer.period} e ${A.club.compatibility}% de compatibilidade.`}
    >
      <div ref={outerRef} className="zs-mock-viewport" style={{ height: height || undefined }}>
        <div ref={innerRef} className={`zs-mock-canvas ${view.on ? "is-on" : ""}`} style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <PlatformCanvas narrow={narrow} />
        </div>
        {cropped && <div className="zs-mock-fade" />}
      </div>
    </div>
  )
}
