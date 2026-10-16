/**
 * Peças animadas da página institucional. Tudo que anima de forma contínua
 * (campo, rolagem) escreve direto no DOM dentro de requestAnimationFrame em
 * vez de passar pelo estado do React: 22 jogadores a 60 quadros por segundo
 * re-renderizando a árvore travariam celulares mais fracos.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode, type RefObject,
} from "react"
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react"
import {
  CLUB_PROFILE_SAMPLE, REPORT_SAMPLE, clubLogo,
  type Connection, type Destination, type Photo,
} from "./data"

/* ─── Utilidades ───────────────────────────────────────────────────── */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

/** Vira true na primeira vez que o elemento entra na tela (e fica true). */
export function useInView<T extends Element>(ref: RefObject<T>, threshold = 0.25) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, inView])
  return inView
}

/** Visibilidade contínua (entra e sai), para pausar o que roda fora da tela. */
function useVisible<T extends Element>(ref: RefObject<T>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return visible
}

/**
 * Progresso (0 → 1) do elemento atravessando a janela: 0 quando o topo
 * dele chega a 85% da altura da tela, 1 quando o fim passa de 35%.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T>, onProgress: (p: number) => void) {
  const cb = useRef(onProgress)
  cb.current = onProgress
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const measure = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const start = vh * 0.85
      const end = vh * 0.35
      const total = r.height + (start - end)
      const p = Math.min(1, Math.max(0, (start - r.top) / total))
      cb.current(p)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref])
}

/**
 * Liga a classe `is-in` em todo [data-reveal] dentro da raiz quando ele
 * aparece. As transições ficam no CSS; aqui só se decide o momento.
 */
export function useRevealAll(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"))
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        }
      }
    // dispara assim que a borda do bloco entra na tela: com limiar alto, quem rola
    // rápido no celular via buracos vazios onde o conteúdo ainda não tinha surgido
    }, { threshold: 0, rootMargin: "0px 0px -4% 0px" })
    items.forEach((item) => io.observe(item))
    return () => io.disconnect()
  }, [root])
}

/* ─── Contador ─────────────────────────────────────────────────────── */

export function CountUp({ to, duration = 1800, prefix = "", suffix = "" }: {
  to: number; duration?: number; prefix?: string; suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, 0.6)
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setValue(to); return }
    let frame = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(Math.round(to * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, to, duration])

  return (
    <span ref={ref} className="vx-count">
      {prefix}{value.toLocaleString("pt-BR")}{suffix}
    </span>
  )
}

/* ─── Painel de embarques (letras que giram) ───────────────────────── */

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function FlapText({ text, active, delay = 0 }: { text: string; active: boolean; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = usePrefersReducedMotion()
  const chars = useMemo(() => Array.from(text.toLocaleUpperCase("pt-BR")), [text])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cells = Array.from(el.querySelectorAll<HTMLSpanElement>(".vx-flap-char"))
    const final = (i: number) => (chars[i] === " " ? " " : chars[i])
    if (!active || reduced) {
      cells.forEach((c, i) => { c.textContent = active || reduced ? final(i) : " " })
      return
    }
    let frame = 0
    let last = 0
    const t0 = performance.now() + delay
    const tick = (now: number) => {
      if (now - last > 55) {
        last = now
        let done = true
        cells.forEach((c, i) => {
          const settle = t0 + 260 + i * 70
          if (chars[i] === " ") { c.textContent = " "; return }
          if (now < t0) { c.textContent = " "; done = false; return }
          if (now < settle) {
            c.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)]
            c.classList.add("is-flipping")
            done = false
          } else {
            c.textContent = final(i)
            c.classList.remove("is-flipping")
          }
        })
        if (done) return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reduced, chars, delay])

  return (
    <span ref={ref} className="vx-flap" aria-label={text}>
      {chars.map((_, i) => (
        <span key={i} className="vx-flap-char" aria-hidden="true">{" "}</span>
      ))}
    </span>
  )
}

export function DepartureBoard({ title, code, rows }: { title: string; code: string; rows: Destination[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.2)
  return (
    <div ref={ref} className="vx-board" role="table" aria-label={title}>
      <div className="vx-board-head" role="row">
        <span className="vx-board-title" role="columnheader">{title}</span>
        <span className="vx-board-code" aria-hidden="true">{code}</span>
      </div>
      <div className="vx-board-cols" role="row" aria-hidden="true">
        <span>Destino</span><span>Clube</span>
      </div>
      {rows.map((row, i) => (
        <div key={`${row.city}-${row.club}`} className="vx-board-row" role="row">
          <span className="vx-board-city" role="cell">
            {row.city} <em>{row.uf}</em>
          </span>
          <span className="vx-board-club" role="cell">
            <FlapText text={row.club} active={inView} delay={i * 110} />
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Faixa de escudos ─────────────────────────────────────────────── */

function BrandMark({ slug, name }: { slug: string; name: string }) {
  const paths: Record<string, string> = {
    adidas: "m24 19.535-8.697-15.07-4.659 2.687 7.145 12.383Zm-8.287 0L9.969 9.59 5.31 12.277l4.192 7.258ZM4.658 14.723l2.776 4.812H1.223L0 17.41Z",
    nike: "M24 7.8L6.442 15.276c-1.456.616-2.679.925-3.668.925-1.12 0-1.933-.392-2.437-1.177-.317-.504-.41-1.143-.28-1.918.13-.775.476-1.6 1.036-2.478.467-.71 1.232-1.643 2.297-2.8a6.122 6.122 0 00-.784 1.848c-.28 1.195-.028 2.072.756 2.632.373.261.886.392 1.54.392.522 0 1.11-.084 1.764-.252L24 7.8z",
  }
  return (
    <svg viewBox="0 0 24 24" className="vx-marquee-brand" role="img" aria-label={name}>
      <title>{name}</title>
      <path d={paths[slug]} fill="currentColor" />
    </svg>
  )
}

export function Marquee({ items, reverse = false, seconds = 70 }: {
  items: Connection[]; reverse?: boolean; seconds?: number
}) {
  return (
    <div className={`vx-marquee${reverse ? " vx-marquee--reverse" : ""}`} style={{ ["--vx-marquee-s" as string]: `${seconds}s` }}>
      {[0, 1].map((copy) => (
        <div key={copy} className="vx-marquee-track" aria-hidden={copy === 1 ? "true" : undefined}>
          {items.map((item) => (
            <span key={item.slug} className="vx-marquee-item" title={item.name}>
              {item.kind === "brand" ? (
                <BrandMark slug={item.slug} name={copy === 0 ? item.name : ""} />
              ) : (
                <img
                  src={clubLogo(item.slug)}
                  alt={copy === 0 ? item.name : ""}
                  width={72}
                  height={72}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Campo: olhar humano × IA ─────────────────────────────────────── */

type Mode = "olho" | "ia"

/** Posições-base (campo 1000 × 640) de um 4-3-3 contra um 4-4-2. */
const HOME = [
  [70, 320], [210, 130], [200, 260], [200, 380], [210, 510],
  [350, 190], [330, 320], [350, 450], [470, 140], [500, 320], [470, 500],
]
const AWAY = [
  [930, 320], [790, 140], [800, 265], [800, 375], [790, 500],
  [650, 120], [640, 260], [640, 380], [650, 520], [560, 250], [560, 390],
]

export function PitchScan() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const visible = useVisible(wrapRef)
  const inView = useInView(wrapRef, 0.35)
  const reduced = usePrefersReducedMotion()
  const [mode, setMode] = useState<Mode>("olho")
  const [touched, setTouched] = useState(false)
  const [seen, setSeen] = useState(3)
  const modeRef = useRef<Mode>("olho")
  modeRef.current = mode

  // Primeira vez na tela: mostra o olhar humano e, sem interação, vira para a IA.
  useEffect(() => {
    if (!inView || touched) return
    const t = window.setTimeout(() => setMode("ia"), 6500)
    return () => window.clearTimeout(t)
  }, [inView, touched])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const players = Array.from(svg.querySelectorAll<SVGGElement>(".vx-pl"))
    const speeds = Array.from(svg.querySelectorAll<SVGTextElement>(".vx-pl-speed"))
    const ball = svg.querySelector<SVGCircleElement>(".vx-ball")!
    const spot = svg.querySelector<SVGCircleElement>(".vx-spot")!
    const base = [...HOME, ...AWAY]
    const phase = base.map((_, i) => i * 1.7)
    let carrier = 9
    let next = 6
    let passT = 0
    let spotX = 500, spotY = 320
    let lastSpeedUpdate = 0
    let lastSeen = -1
    let frame = 0
    const t0 = performance.now()

    const pos = (i: number, t: number) => {
      const [bx, by] = base[i]
      const drift = i === 0 || i === 11 ? 8 : 26
      return [bx + Math.sin(t * 0.6 + phase[i]) * drift, by + Math.cos(t * 0.45 + phase[i] * 1.3) * drift * 0.8]
    }

    const draw = (now: number) => {
      const t = (now - t0) / 1000
      // a bola passa entre jogadores do mesmo time a cada ~1,6 s
      passT += 1 / 95
      if (passT >= 1) {
        passT = 0
        carrier = next
        // de vez em quando a posse troca de time
        const team = (carrier < 11) !== (Math.random() < 0.18) ? 0 : 11
        do { next = team + 1 + Math.floor(Math.random() * 10) } while (next === carrier)
      }
      const [ax, ay] = pos(carrier, t)
      const [cx, cy] = pos(next, t)
      const e = passT < 0.55 ? 0 : (passT - 0.55) / 0.45
      const bx = ax + (cx - ax) * e
      const by = ay + (cy - ay) * e
      ball.setAttribute("cx", bx.toFixed(1))
      ball.setAttribute("cy", by.toFixed(1))

      // o olhar humano chega atrasado na bola
      spotX += (bx - spotX) * 0.05
      spotY += (by - spotY) * 0.05
      spot.setAttribute("cx", spotX.toFixed(1))
      spot.setAttribute("cy", spotY.toFixed(1))

      const ia = modeRef.current === "ia"
      let count = 0
      players.forEach((p, i) => {
        const [x, y] = pos(i, t)
        p.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
        const lit = ia || Math.hypot(x - spotX, y - spotY) < 120
        if (lit) count++
        p.classList.toggle("is-lit", lit)
      })
      if (count !== lastSeen) { lastSeen = count; setSeen(count) }
      if (ia && now - lastSpeedUpdate > 450) {
        lastSpeedUpdate = now
        speeds.forEach((s, i) => {
          const v = 6 + Math.abs(Math.sin(t * 0.8 + phase[i])) * 20
          s.textContent = `${v.toFixed(0)} km/h`
        })
      }
    }

    if (reduced) { draw(t0 + 1); return }
    if (!visible) return
    const loop = (now: number) => { draw(now); frame = requestAnimationFrame(loop) }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [visible, reduced])

  const pick = (m: Mode) => { setTouched(true); setMode(m) }

  return (
    <div ref={wrapRef} className={`vx-pitch vx-pitch--${mode}`}>
      <div className="vx-pitch-bar">
        <div className="vx-pitch-toggle" role="group" aria-label="Forma de observar a partida">
          <button type="button" aria-pressed={mode === "olho"} onClick={() => pick("olho")}>Olhômetro</button>
          <button type="button" aria-pressed={mode === "ia"} onClick={() => pick("ia")}>Inteligência artificial</button>
        </div>
        <p className="vx-pitch-count" aria-live="polite">
          <strong>{mode === "ia" ? 22 : seen}</strong> de 22 jogadores observados agora
        </p>
      </div>
      <svg ref={svgRef} viewBox="0 0 1000 640" className="vx-pitch-svg" role="img"
        aria-label="Campo de futebol com 22 jogadores. No olhômetro, só os jogadores perto da bola ficam iluminados. Com inteligência artificial, todos são acompanhados.">
        <defs>
          <radialGradient id="vx-spot-grad">
            <stop offset="0%" stopColor="rgba(252,211,77,0.32)" />
            <stop offset="70%" stopColor="rgba(252,211,77,0.08)" />
            <stop offset="100%" stopColor="rgba(252,211,77,0)" />
          </radialGradient>
          <pattern id="vx-stripes" width="100" height="640" patternUnits="userSpaceOnUse">
            <rect width="50" height="640" fill="rgba(255,255,255,0.018)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1000" height="640" rx="18" className="vx-pitch-grass" />
        <rect x="0" y="0" width="1000" height="640" rx="18" fill="url(#vx-stripes)" />
        <g className="vx-pitch-lines" fill="none">
          <rect x="30" y="30" width="940" height="580" />
          <line x1="500" y1="30" x2="500" y2="610" />
          <circle cx="500" cy="320" r="78" />
          <rect x="30" y="170" width="140" height="300" />
          <rect x="830" y="170" width="140" height="300" />
          <rect x="30" y="250" width="50" height="140" />
          <rect x="920" y="250" width="50" height="140" />
        </g>
        <circle className="vx-spot" r="150" cx="500" cy="320" fill="url(#vx-spot-grad)" />
        {[...HOME, ...AWAY].map(([x, y], i) => (
          <g key={i} className={`vx-pl ${i < 11 ? "vx-pl--home" : "vx-pl--away"}`} transform={`translate(${x} ${y})`}>
            <rect className="vx-pl-box" x="-17" y="-22" width="34" height="44" rx="3" />
            <circle className="vx-pl-dot" r="9" />
            <text className="vx-pl-speed" y="-28" textAnchor="middle">12 km/h</text>
          </g>
        ))}
        <circle className="vx-ball" r="5" cx="500" cy="320" />
      </svg>
      <p className="vx-pitch-caption">
        {mode === "ia"
          ? "Com IA, cada atleta é identificado e medido do primeiro ao último minuto."
          : "No olhômetro, a atenção segue a bola. Quem está longe dela não é visto."}
      </p>
    </div>
  )
}

/* ─── Radar de compatibilidade ─────────────────────────────────────── */

const RADAR_R = 150

function radarPoints(values: readonly number[], scale = 1) {
  const n = values.length
  return values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    const r = ((v - 50) / 50) * RADAR_R * scale
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`
  }).join(" ")
}

export function MatchRadar() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.4)
  const athlete = REPORT_SAMPLE.map((s) => s.score)
  const diff = athlete.reduce((acc, v, i) => acc + Math.abs(v - CLUB_PROFILE_SAMPLE[i]), 0) / athlete.length
  const compat = Math.round(100 - diff)
  const n = athlete.length

  return (
    <div ref={ref} className={`vx-radar${inView ? " is-in" : ""}`}>
      <svg viewBox="-230 -210 460 420" role="img"
        aria-label={`Radar com dez indicadores: o perfil do atleta sobreposto ao perfil que um clube procura, com ${compat}% de compatibilidade (exemplo ilustrativo).`}>
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <polygon key={s} className="vx-radar-grid" points={radarPoints(Array(n).fill(100), s)} />
        ))}
        {REPORT_SAMPLE.map((s, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2
          const x = Math.cos(a) * (RADAR_R + 26)
          const y = Math.sin(a) * (RADAR_R + 26)
          return (
            <g key={s.label}>
              <line className="vx-radar-axis" x1="0" y1="0" x2={Math.cos(a) * RADAR_R} y2={Math.sin(a) * RADAR_R} />
              <text className="vx-radar-label" x={x} y={y} textAnchor={Math.abs(x) < 10 ? "middle" : x > 0 ? "start" : "end"} dominantBaseline="middle">
                {s.label}
              </text>
            </g>
          )
        })}
        <polygon className="vx-radar-club" points={radarPoints(CLUB_PROFILE_SAMPLE)} pathLength={1} />
        <polygon className="vx-radar-athlete" points={radarPoints(athlete)} />
      </svg>
      <div className="vx-radar-legend">
        <span><i className="vx-dot vx-dot--gold" /> Perfil do atleta</span>
        <span><i className="vx-dot vx-dot--line" /> O que o clube procura</span>
      </div>
      <p className="vx-radar-compat">
        <span>Compatibilidade</span>
        <strong>{inView ? <CountUp to={compat} suffix="%" duration={1600} /> : "0%"}</strong>
      </p>
      <p className="vx-fine">Exemplo ilustrativo, com valores fictícios.</p>
    </div>
  )
}

/* ─── Relatório (barras) ───────────────────────────────────────────── */

export function ReportBars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, 0.3)
  const overall = Math.round(REPORT_SAMPLE.reduce((a, s) => a + s.score, 0) / REPORT_SAMPLE.length)
  return (
    <div ref={ref} className={`vx-report${inView ? " is-in" : ""}`}>
      <div className="vx-report-head">
        <div>
          <span className="vx-kicker">Relatório individual</span>
          <p className="vx-report-name">Meia-atacante · Sub-20</p>
        </div>
        <div className="vx-report-overall">
          <strong>{inView ? <CountUp to={overall} duration={1400} /> : 0}</strong>
          <span>Geral</span>
        </div>
      </div>
      <ul className="vx-report-list">
        {REPORT_SAMPLE.map((s, i) => (
          <li key={s.label} style={{ ["--d" as string]: `${i * 70}ms`, ["--v" as string]: `${s.score}%` }}>
            <span>{s.label}</span>
            <i aria-hidden="true"><b /></i>
            <em>{s.score}</em>
          </li>
        ))}
      </ul>
      <p className="vx-fine">Exemplo de relatório, com valores ilustrativos.</p>
    </div>
  )
}

/* ─── Vídeos ───────────────────────────────────────────────────────── */

/** Laço mudo que só toca enquanto está na tela. */
export function LoopVideo({ src, poster, w, h, label }: { src: string; poster: string; w: number; h: number; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const visible = useVisible(wrapRef)
  const reduced = usePrefersReducedMotion()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (visible && !reduced && !paused) v.play().catch(() => setPaused(true))
    else v.pause()
  }, [visible, reduced, paused])

  useEffect(() => { if (reduced) setPaused(true) }, [reduced])

  return (
    <div ref={wrapRef} className="vx-loop">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        width={w}
        height={h}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
      />
      <button
        type="button"
        className="vx-loop-btn"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </div>
  )
}

/** Filme com som: carrega só quando a pessoa aperta o play. */
export function FilmPlayer({ src, poster, duration }: { src: string; poster: string; duration: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)

  const start = () => {
    setStarted(true)
    requestAnimationFrame(() => videoRef.current?.play().catch(() => undefined))
  }

  return (
    <div className={`vx-film${started ? " is-started" : ""}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={started}
        playsInline
        preload="none"
        aria-label="Filme Zyron: a jornada do atleta, da análise por IA ao clube"
      />
      {!started && (
        <button type="button" className="vx-film-play" onClick={start}>
          <span className="vx-film-icon" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
          <span className="vx-film-label">
            Assistir ao filme
            <small>{duration} · com som</small>
          </span>
        </button>
      )}
    </div>
  )
}

/* ─── Lightbox ─────────────────────────────────────────────────────── */

type LightboxState = { photos: Photo[]; index: number } | null
const LightboxContext = createContext<(photos: Photo[], index: number) => void>(() => undefined)

export const useLightbox = () => useContext(LightboxContext)

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LightboxState>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  const open = useCallback((photos: Photo[], index: number) => {
    lastFocus.current = document.activeElement as HTMLElement
    setState({ photos, index })
  }, [])
  const close = useCallback(() => setState(null), [])
  const step = useCallback((d: number) => {
    setState((s) => s && { ...s, index: (s.index + d + s.photos.length) % s.photos.length })
  }, [])

  useEffect(() => {
    if (!state) { lastFocus.current?.focus?.(); return }
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey) }
  }, [state, close, step])

  const photo = state ? state.photos[state.index] : null

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {state && photo && (
        <div className="vx-lightbox" role="dialog" aria-modal="true" aria-label={photo.title || "Foto ampliada"} onClick={close}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} />
            <figcaption>
              {photo.title && <strong>{photo.title}</strong>}
              {photo.note && <em>{photo.note}</em>}
              {state.photos.length > 1 && <span>{state.index + 1} / {state.photos.length}</span>}
            </figcaption>
          </figure>
          <button ref={closeRef} type="button" className="vx-lightbox-close" onClick={close} aria-label="Fechar">
            <X size={22} />
          </button>
          {state.photos.length > 1 && (
            <>
              <button type="button" className="vx-lightbox-nav vx-lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); step(-1) }} aria-label="Foto anterior">
                <ChevronLeft size={26} />
              </button>
              <button type="button" className="vx-lightbox-nav vx-lightbox-nav--next" onClick={(e) => { e.stopPropagation(); step(1) }} aria-label="Próxima foto">
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </div>
      )}
    </LightboxContext.Provider>
  )
}

/* ─── Figura com moldura ───────────────────────────────────────────── */

export function Frame({ photo, onOpen, className = "", priority = false, sizes }: {
  photo: Photo
  onOpen?: () => void
  className?: string
  priority?: boolean
  sizes?: string
}) {
  const img = (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={photo.srcSet ? sizes : undefined}
      alt={photo.alt}
      width={photo.w}
      height={photo.h}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  )
  return (
    <figure className={`vx-frame ${className}`}>
      {onOpen ? (
        <button type="button" className="vx-frame-media" onClick={onOpen} aria-label={`Ampliar foto: ${photo.title}`}>
          {img}
        </button>
      ) : <div className="vx-frame-media">{img}</div>}
      <figcaption>
        <strong>{photo.title}</strong>
        {photo.note && <em>{photo.note}</em>}
      </figcaption>
    </figure>
  )
}
