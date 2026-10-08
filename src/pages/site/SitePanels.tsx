import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Check, CheckCheck, Radar, SendHorizontal, User } from "lucide-react"
import { prefersReducedMotion } from "@/hooks/useScrollAnimations"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { DEMO_ATHLETE as A, clubLogo } from "./siteData"
import { ZyronMark } from "./ZyronMark"

/** Liga `is-active` uma única vez, quando o painel entra na tela. */
function useActivateOnView<T extends HTMLElement>(threshold: number) {
  const ref = useRef<T>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setActive(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, active }
}

/* ────────────────────────────────────────────────────────────────────── */
/* Para atletas — card do relatório + encaixe na escalação do clube        */
/* ────────────────────────────────────────────────────────────────────── */

type Slot = { pos: string; label: string; target?: boolean }

/** 4-2-3-1 com o ataque no topo; a vaga procurada pelo clube é a do meia. */
const FORMATION: Slot[][] = [
  [{ pos: "CA", label: "Centroavante" }],
  [{ pos: "PE", label: "Ponta esq." }, { pos: "MEI", label: "G. Rocha", target: true }, { pos: "PD", label: "Ponta dir." }],
  [{ pos: "VOL", label: "Volante" }, { pos: "VOL", label: "Volante" }],
  [{ pos: "LE", label: "Lateral esq." }, { pos: "ZAG", label: "Zagueiro" }, { pos: "ZAG", label: "Zagueiro" }, { pos: "LD", label: "Lateral dir." }],
  [{ pos: "GOL", label: "Goleiro" }],
]

const TOP_STATS = [...A.stats].sort((a, b) => b.score - a.score).slice(0, 3)

export function AthletePanel() {
  const { ref, active } = useActivateOnView<HTMLDivElement>(0.25)
  const cardRef = useRef<HTMLDivElement>(null)

  // Depois de entrar, o card "flutua" alguns pixels conforme o scroll.
  useEffect(() => {
    const panel = ref.current
    const card = cardRef.current
    if (!active || !panel || !card || prefersReducedMotion()) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = panel.getBoundingClientRect()
      const viewport = window.innerHeight
      const ratio = Math.max(0, Math.min(1, (viewport - rect.top) / (viewport + rect.height)))
      card.style.setProperty("--zs-drift", `${((ratio - 0.5) * 18).toFixed(1)}px`)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [active, ref])

  return (
    <div className="zs-panel" aria-label={`Relatório de ${A.name} e o encaixe dele na escalação do ${A.club.name}`} role="img">
      <div ref={ref} className={`zs-ap ${active ? "is-active" : ""}`} aria-hidden="true">
        <div ref={cardRef} className="zs-ap-card">
          <div className="mb-3.5 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img src={A.photo} alt="" className="h-[52px] w-[52px] rounded-full border-2 border-amber-400/60 object-cover" />
              <span className="absolute -bottom-1.5 -right-1.5 rounded border border-white/20 bg-amber-400 px-1.5 py-px text-[9px] font-bold tracking-wide text-black">
                {A.positionShort}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-[-0.01em] text-white">{A.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {A.category} · {A.city.replace(" - ", ", ")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Análise concluída
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  {A.position}
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-center">
              <p className="text-[24px] font-extrabold leading-none tracking-[-0.04em] text-amber-300">{A.overall}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-amber-300/70">Geral</p>
            </div>
          </div>

          <div className="mb-3.5 flex flex-col gap-2">
            {TOP_STATS.map((stat, i) => (
              <div key={stat.label} className="grid grid-cols-[92px_1fr_auto] items-center gap-2.5">
                <span className="text-[10px] text-white/55">{stat.label}</span>
                <div className="zs-bar">
                  <div className={`zs-bar-fill ${i === 2 ? "zs-bar-fill--green" : ""}`} style={{ width: `${stat.score}%` }} />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-white/85">{stat.score}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-white/50">
              <img src={clubLogo(A.club.slug)} alt="" className="h-4 w-4 object-contain" />
              Oportunidade: <strong className="text-amber-300">{A.club.name} · {A.club.compatibility}%</strong>
            </span>
            <span className="font-semibold text-amber-300">Ver relatório →</span>
          </div>
        </div>

        <div className="zs-fit">
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
            <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white/80">
              <Radar className="h-[15px] w-[15px] text-amber-300" /> Encaixe tático · IA
            </span>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              4-2-3-1
            </span>
          </div>

          <div className="zs-pitch">
            <div className="zs-pitch-line zs-pitch-mid" />
            <div className="zs-pitch-line zs-pitch-circle" />
            <div className="zs-pitch-line zs-pitch-box-top" />
            <div className="zs-pitch-line zs-pitch-box-bottom" />
            <div className="zs-pitch-scan" />

            {FORMATION.map((row, r) => (
              <div key={r} className="zs-pitch-row">
                {row.map((slot, s) => (
                  <div key={s} className="zs-player" style={{ position: "relative" }}>
                    {slot.target && <span className="zs-pitch-heat" style={{ left: "50%", top: 18 }} />}
                    <div className={`zs-dot ${slot.target ? "zs-dot--target" : ""}`}>
                      <span>{slot.pos}</span>
                      {slot.target && <span className="zs-dot-ring" />}
                    </div>
                    <span className={`zs-player-name ${slot.target ? "zs-player-name--target" : ""}`}>{slot.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-[10px] text-white/45">
            <span>{A.club.name} · posição procurada: <strong className="text-amber-300">{A.positionShort}</strong></span>
            <span>Atualizado agora</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── */
/* Para famílias — perfil do filho + conversa com a equipe no WhatsApp     */
/* ────────────────────────────────────────────────────────────────────── */

const FAMILY_ATHLETE = {
  firstName: "Arthur",
  name: "Arthur Lima",
  position: "Ponta Esquerda",
  details: [
    { label: "Idade", value: "16 anos" },
    { label: "Categoria", value: "Sub-17" },
    { label: "Pé", value: "Canhoto" },
    { label: "Cidade", value: "Taguatinga, DF" },
  ],
  rings: [
    { key: "VEL", score: 91 },
    { key: "DRI", score: 88 },
    { key: "FIN", score: 84 },
    { key: "PAS", score: 80 },
  ],
  overall: 86,
  compatibility: 94,
}

const RING_RADIUS = 21
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

export function FamilyPanel() {
  const { ref, active } = useActivateOnView<HTMLDivElement>(0.3)
  const [typing, setTyping] = useState(false)
  const [teamMessage, setTeamMessage] = useState(false)
  const [sent, setSent] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // A equipe "digita" e responde logo depois que a janela de conversa entra.
  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) {
      setTeamMessage(true)
      return
    }
    const startTyping = window.setTimeout(() => setTyping(true), 1100)
    const reply = window.setTimeout(() => {
      setTyping(false)
      setTeamMessage(true)
    }, 2600)
    return () => {
      window.clearTimeout(startTyping)
      window.clearTimeout(reply)
    }
  }, [active])

  useEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [typing, teamMessage, sent])

  const F = FAMILY_ATHLETE

  return (
    <div className="zs-panel" role="group" aria-label="Demonstração: a família recebe o resultado da avaliação pela equipe Zyron">
      <div ref={ref} className={`zs-fp ${active ? "is-active" : ""}`}>
        <div className="zs-fp-profile">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#2a2112] to-[#0d0a05]">
              <User className="h-11 w-11 text-amber-300/80" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[20px] font-bold tracking-[-0.02em] text-white">{F.name}</p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.08em] text-amber-300">{F.position}</p>
            </div>
          </div>

          <dl className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            {F.details.map((d) => (
              <div key={d.label} className="flex flex-col gap-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">{d.label}</dt>
                <dd className="text-[14px] font-bold text-white">{d.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mb-7 flex justify-between px-1" aria-label={F.rings.map((r) => `${r.key} ${r.score}`).join(", ")}>
            {F.rings.map((ring) => (
              <div key={ring.key} className="flex flex-col items-center gap-2">
                <div className="zs-ring-stat" style={{ "--zs-ring-len": RING_LENGTH } as CSSProperties}>
                  <svg viewBox="0 0 50 50" aria-hidden="true">
                    <circle cx="25" cy="25" r={RING_RADIUS} fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="3" />
                    <circle
                      cx="25" cy="25" r={RING_RADIUS} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={RING_LENGTH}
                      strokeDashoffset={RING_LENGTH * (1 - ring.score / 100)}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-white">
                    {ring.score}
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-white/50">{ring.key}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={() => setSent(true)}
              disabled={sent}
              className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/10 bg-gradient-to-r from-amber-300 to-amber-500 p-3 text-[14px] font-bold text-black shadow-[0_6px_20px_rgba(251,191,36,0.25)] transition-all hover:shadow-[0_8px_25px_rgba(251,191,36,0.4)] active:scale-[0.97] disabled:cursor-default disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              {sent
                ? <><Check className="h-4 w-4" strokeWidth={3} /> Pedido enviado</>
                : <><WhatsAppIcon className="h-[18px] w-[18px]" /> Liberar relatório completo</>}
            </button>
          </div>
        </div>

        <div className="zs-chat">
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.04] px-[18px] py-3.5">
            <ZyronMark size={36} className="rounded-full" />
            <div>
              <p className="text-[13px] font-bold text-white">Equipe Zyron</p>
              <p className="zs-online text-[10px] font-semibold text-emerald-400">Online agora</p>
            </div>
          </div>

          <div ref={bodyRef} className="zs-chat-body" aria-live="polite">
            {typing && (
              <div className="zs-typing" aria-label="Equipe Zyron digitando">
                <span /><span /><span />
              </div>
            )}
            {teamMessage && (
              <div className="zs-msg zs-msg--team">
                Olá! A análise do {F.firstName} ficou pronta: nota geral {F.overall} e um clube com {F.compatibility}% de encaixe no perfil dele. Quer receber a leitura completa?
              </div>
            )}
            {sent && (
              <div className="zs-msg zs-msg--user">
                Quero sim! Pode mandar.
                <CheckCheck className="ml-1.5 inline h-3.5 w-3.5 align-[-3px] text-black/55" aria-label="lida" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02] px-[18px] py-3">
            <span className="flex-1 text-[12px] font-medium text-white/30">Escreva uma mensagem...</span>
            <SendHorizontal className="h-[18px] w-[18px] text-amber-300" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}
