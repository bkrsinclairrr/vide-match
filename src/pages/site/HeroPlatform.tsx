import { useLayoutEffect, useRef, useState } from "react"
import {
  ArrowLeft, Bell, Calendar, ChevronDown, Crosshair, FileText, Footprints, Globe2,
  HelpCircle, Layers, MapPin, Menu, MessageCircle, Pencil, Ruler, Search, Sparkles,
  User, Weight,
} from "lucide-react"
import { DEMO_ATHLETE as A, clubLogo } from "./siteData"
import { ZyronLogo } from "./ZyronMark"

/**
 * "Print" do painel da Zyron no hero — o equivalente ao screenshot da
 * plataforma no footlink, mas desenhado em HTML: o conteúdo é o relatório
 * de um atleta (nota geral, 10 indicadores, perfil informado e clube em
 * potencial), as mesmas peças do resultado real do funil.
 *
 * O painel é diagramado numa largura fixa e escalado para caber no
 * contêiner, como uma imagem. Em telas estreitas mostra um recorte
 * ampliado do canto esquerdo, como o footlink faz com o print no celular.
 */
const BASE_WIDTH = 1096
const NARROW_BASE = 700

function useFitScale() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ scale: 1, height: 0, narrow: false })

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const measure = () => {
      const width = outer.clientWidth
      const narrow = width < 560
      const scale = width / (narrow ? NARROW_BASE : BASE_WIDTH)
      const natural = inner.offsetHeight * scale
      setBox({ scale, narrow, height: narrow ? Math.min(natural, width * 0.95) : natural })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return { outerRef, innerRef, ...box }
}

function BrazilFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#16a34a" />
      <path d="M10 2 18 7 10 12 2 7Z" fill="#facc15" />
      <circle cx="10" cy="7" r="2.9" fill="#1d4ed8" />
    </svg>
  )
}

/** Faixa de cor por nível — verde = ponto forte, dourado = bom, laranja = a melhorar. */
function tier(score: number) {
  if (score >= 90) return { bar: "from-emerald-500 to-emerald-300", text: "text-emerald-300" }
  if (score >= 84) return { bar: "from-amber-500 to-amber-300", text: "text-amber-300" }
  return { bar: "from-orange-500 to-orange-300", text: "text-orange-300" }
}

const PROFILE_ROWS = [
  { icon: User, label: "Nome completo", value: A.fullName },
  { icon: Calendar, label: "Idade", value: `${A.age} anos` },
  { icon: Ruler, label: "Altura", value: A.height },
  { icon: Weight, label: "Peso", value: A.weight },
  { icon: Crosshair, label: "Posição", value: A.position },
  { icon: Footprints, label: "Melhor pé", value: A.foot },
  { icon: Layers, label: "Categoria", value: A.category },
  { icon: MapPin, label: "Cidade", value: A.city },
]

const TABS = ["Visão geral", "Indicadores", "Oportunidades", "Pontos a melhorar", "Jogadores compatíveis", "Vídeos"]

function PlatformCanvas() {
  const circumference = 2 * Math.PI * 22

  return (
    <div className="text-white" style={{ width: BASE_WIDTH }}>
      {/* Barra superior */}
      <div className="flex h-14 items-center gap-4 border-b border-white/[0.07] bg-[#0d0d0e] px-5">
        <Menu className="h-5 w-5 text-white/55" />
        <ZyronLogo size={26} />
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Análise concluída
        </span>
        <div className="ml-6 flex h-9 w-[400px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white/40">
          <Search className="h-3.5 w-3.5" /> Buscar no relatório: indicadores, clubes, posições...
        </div>
        <div className="ml-auto flex items-center gap-4 text-white/55">
          <HelpCircle className="h-[18px] w-[18px]" />
          <MessageCircle className="h-[18px] w-[18px]" />
          <Bell className="h-[18px] w-[18px]" />
          <img src={A.photo} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-amber-400/50" />
        </div>
      </div>

      {/* Cabeçalho do atleta */}
      <div className="flex items-center gap-4 bg-[#101011] px-7 pb-5 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70">
          <ArrowLeft className="h-4 w-4" />
        </span>
        <img src={A.photo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/70 ring-offset-2 ring-offset-[#101011]" />
        <div className="min-w-0">
          <p className="text-[26px] font-bold leading-none tracking-[-0.02em]">{A.name}</p>
          <p className="mt-1.5 text-[12px] text-white/40">{A.fullName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60">
            <BrazilFlag className="h-3 w-[17px]" /> Brasil • {A.age} anos • {A.position} • {A.category}
          </p>
        </div>

        <div className="ml-8 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.35)]">
          <span className="text-[26px] font-black leading-none text-black">{A.overall}</span>
          <span className="mt-0.5 text-[8px] font-bold tracking-widest text-black/70">GERAL</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-2 pr-4">
            <img src={clubLogo(A.club.slug)} alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-300/80">Oportunidade</p>
              <p className="text-[13px] font-semibold leading-tight">{A.club.name}</p>
              <p className="text-[11px] text-emerald-300">{A.club.compatibility}% de compatibilidade</p>
            </div>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 text-amber-300">
            <FileText className="h-4 w-4" />
          </span>
          <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 text-[13px] font-bold text-black">
            Relatório completo <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-8 border-b border-white/[0.07] bg-[#101011] px-7 text-[13px]">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={i === 0
              ? "border-b-2 border-amber-400 pb-3 font-semibold text-amber-300"
              : "pb-3 text-white/50"}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-[340px_1fr] gap-5 bg-[#0b0b0c] p-6">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <p className="mb-3 text-[15px] font-semibold">Perfil informado</p>
          {PROFILE_ROWS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between border-b border-white/[0.06] py-2.5 text-[12px]">
              <span className="flex items-center gap-2 text-white/45">
                <Icon className="h-3.5 w-3.5 text-amber-400/80" /> {label}
              </span>
              <span className="font-semibold text-white/90">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5 text-[12px]">
            <span className="flex items-center gap-2 text-white/45">
              <Globe2 className="h-3.5 w-3.5 text-amber-400/80" /> Nacionalidade
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-white/90">
              <BrazilFlag className="h-3 w-[17px]" /> Brasil
            </span>
          </div>
          <span className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/40 text-[12px] font-semibold text-amber-300">
            <Pencil className="h-3.5 w-3.5" /> Editar perfil
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[15px] font-semibold">Indicadores individuais</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                <Sparkles className="h-3 w-3" /> Leitura por IA
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
              {A.stats.map((stat) => {
                const t = tier(stat.score)
                return (
                  <div key={stat.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="text-white/65">{stat.label}</span>
                      <span className={`font-bold tabular-nums ${t.text}`}>{stat.score}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className={`h-full rounded-full bg-gradient-to-r ${t.bar}`} style={{ width: `${stat.score}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/[0.07] to-transparent p-5">
            <img src={clubLogo(A.club.slug)} alt="" className="h-14 w-14 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Time em potencial encontrado</p>
              <p className="mt-1 text-[17px] font-bold leading-tight">{A.club.name}</p>
              <p className="text-[12px] text-white/50">{A.club.country} · {A.club.league}</p>
              <div className="mt-2.5 flex gap-2 text-[11px]">
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-white/70">
                  Posição procurada: <strong className="text-white">{A.position}</strong>
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-white/70">
                  Categoria compatível: <strong className="text-white">{A.category}</strong>
                </span>
              </div>
            </div>
            <div className="relative h-[60px] w-[60px] shrink-0">
              <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="22" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - A.club.compatibility / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-black">
                {A.club.compatibility}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroPlatform() {
  const { outerRef, innerRef, scale, height, narrow } = useFitScale()

  return (
    <div
      className="zs-mock-frame"
      role="img"
      aria-label={`Painel da Zyron com o relatório do atleta ${A.name}: nota geral ${A.overall}, 10 indicadores individuais e ${A.club.name} como time em potencial, com ${A.club.compatibility}% de compatibilidade.`}
    >
      <div ref={outerRef} className="zs-mock-viewport" style={{ height: height || undefined }}>
        <div ref={innerRef} className="zs-mock-canvas" style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <PlatformCanvas />
        </div>
        {narrow && <div className="zs-mock-fade" />}
      </div>
    </div>
  )
}
