import "@fontsource-variable/inter"
import "@fontsource-variable/playfair-display"
import "@fontsource-variable/playfair-display/wght-italic.css"
import "./institucional.css"

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowUpRight, Instagram, Mail, Menu, X } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronMark } from "@/pages/site/ZyronMark"
import {
  BRAZIL_DESTINATIONS, BRAZIL_GALLERY, CHELSEA_SOURCE, CONNECTIONS_BRAZIL, CONNECTIONS_WORLD, CONTACT_EMAIL,
  FILM, HERO_PHOTOS, HISTORY_PHOTOS, INSTAGRAM_HANDLE, INSTAGRAM_URL, JOAOZINHO_CARD, JOURNEY, MENTORING_PHOTO,
  MOSAIC, PLATE_326, RECOGNITION_PHOTOS, REGIONS, TRACKING_VIDEO, WHATSAPP_URL, WORLD_DESTINATIONS, WORLD_PHOTOS,
  type Region,
} from "./data"
import {
  CountUp, DepartureBoard, FilmPlayer, Frame, LightboxProvider, LoopVideo, Marquee, MatchRadar, PitchScan,
  ReportBars, useInView, useLightbox, useRevealAll, useScrollProgress,
} from "./parts"

/**
 * Página institucional (/institucional): a história da Voxen, o método
 * (IA + scout) e as provas — fotos, vídeos, destinos e conexões. Sem
 * oferta nem preço: o objetivo é credibilidade.
 *
 * Ordem narrativa: quem somos → como era → como é agora (vídeo real de
 * rastreamento) → por que funciona → como acompanhamos (filme) → provas no
 * Brasil → provas no mundo → rede → reconhecimento → manifesto → arquivo.
 */

const NAV = [
  { href: "#historia", label: "História" },
  { href: "#metodo", label: "O método" },
  { href: "#brasil", label: "Brasil" },
  { href: "#mundo", label: "Mundo" },
  { href: "#conexoes", label: "Conexões" },
]

const TITLE = "Voxen | Zyron — Atletas acompanhados por IA e por um scout dedicado"
const DESCRIPTION =
  "Há mais de dez anos a Voxen encaminha atletas para clubes do Brasil e do mundo. Hoje, cada jogador é acompanhado por inteligência artificial e por um scout dedicado integralmente à sua carreira."

function useDocumentMeta() {
  useEffect(() => {
    const prevTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = meta?.content
    document.title = TITLE
    if (meta) meta.content = DESCRIPTION
    document.documentElement.classList.add("vx-root")
    return () => {
      document.title = prevTitle
      if (meta && prevDesc !== undefined) meta.content = prevDesc
      document.documentElement.classList.remove("vx-root")
    }
  }, [])
}

/* ─── Marca ────────────────────────────────────────────────────────── */

function Lockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`vx-lockup${compact ? " vx-lockup--compact" : ""}`}>
      <span className="vx-lockup-voxen">VOXEN</span>
      <span className="vx-lockup-bar" aria-hidden="true" />
      <ZyronMark size={compact ? 22 : 26} />
      <span className="vx-lockup-zyron">ZYRON</span>
    </span>
  )
}

function InstagramLink({ className = "", children }: { className?: string; children?: ReactNode }) {
  return (
    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={className}
      aria-label={children ? undefined : `Instagram @${INSTAGRAM_HANDLE}`}>
      <Instagram size={18} aria-hidden="true" />
      {children}
    </a>
  )
}

/* ─── Navegação ────────────────────────────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const sections = NAV.map((n) => document.querySelector(n.href)).filter(Boolean) as Element[]
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`)
    }, { rootMargin: "-45% 0px -50% 0px" })
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className={`vx-nav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="vx-nav-inner">
        <a href="#inicio" className="vx-nav-brand" aria-label="Voxen | Zyron — início" onClick={() => setOpen(false)}>
          <Lockup compact />
        </a>
        <nav className="vx-nav-links" aria-label="Seções">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={active === n.href ? "is-active" : undefined}
              onClick={() => setOpen(false)}>{n.label}</a>
          ))}
        </nav>
        <div className="vx-nav-actions">
          <InstagramLink className="vx-icon-btn" />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--ghost vx-nav-cta">
            Fale com a equipe
          </a>
          <button type="button" className="vx-icon-btn vx-nav-burger" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((o) => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

/* ─── Cabeçalho de capítulo ────────────────────────────────────────── */

function Chapter({ num, label, title, children, light = false, center = false }: {
  num: string; label: string; title: ReactNode; children?: ReactNode; light?: boolean; center?: boolean
}) {
  return (
    <header className={`vx-chapter${light ? " vx-chapter--light" : ""}${center ? " vx-chapter--center" : ""}`} data-reveal>
      <p className="vx-chapter-label">
        <span className="vx-chapter-num">{num}</span>
        <span className="vx-chapter-rule" aria-hidden="true" />
        {label}
      </p>
      <h2 className="vx-h2">{title}</h2>
      {children && <div className="vx-chapter-lead">{children}</div>}
    </header>
  )
}

/* ─── Abertura ─────────────────────────────────────────────────────── */

function SplitWords({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {/* o espaço fica fora do inline-block: dentro dele seria descartado no fim da caixa */}
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className={`vx-word ${className}`}><span style={{ ["--i" as string]: i }}>{w}</span></span>{" "}
        </Fragment>
      ))}
    </>
  )
}

function Hero() {
  const lightbox = useLightbox()
  return (
    <section id="inicio" className="vx-hero">
      <div className="vx-hero-glow" aria-hidden="true" />
      <div className="vx-container vx-hero-grid">
        <div className="vx-hero-copy">
          <p className="vx-hero-kicker">
            <span>Voxen · Assessoria esportiva</span>
            <i aria-hidden="true">◆</i>
            <span>Zyron · Inteligência artificial</span>
          </p>
          <h1 className="vx-h1">
            <SplitWords text="O futebol mudou a forma de" />
            <span className="vx-word vx-word--accent"><span style={{ ["--i" as string]: 6 }}>enxergar</span></span>{" "}
            <SplitWords text="talento." className="vx-word--late" />
          </h1>
          <p className="vx-hero-lead">
            Há mais de dez anos, a Voxen encaminha atletas para clubes do Brasil e do mundo. Hoje, cada jogador que
            acompanhamos é observado por inteligência artificial e tem um <strong>scout — estrategista esportivo —
            dedicado integralmente à sua carreira</strong>.
          </p>
          <div className="vx-hero-links">
            <a href="#historia" className="vx-btn vx-btn--gold">
              Conheça a nossa história <ArrowDown size={16} aria-hidden="true" />
            </a>
            <InstagramLink className="vx-btn vx-btn--ghost">@{INSTAGRAM_HANDLE}</InstagramLink>
          </div>
        </div>

        <div className="vx-hero-stack" aria-label="Atletas acompanhados pela Voxen">
          {HERO_PHOTOS.map((p, i) => (
            <button key={p.src} type="button" className={`vx-hero-card vx-hero-card--${i}`}
              onClick={() => lightbox(HERO_PHOTOS, i)} aria-label={`Ampliar foto: ${p.title}`}>
              <img src={p.src} alt={p.alt} width={p.w} height={p.h} loading="eager" decoding="async" />
              <span className="vx-hero-card-cap"><strong>{p.title}</strong><em>{p.note}</em></span>
            </button>
          ))}
        </div>
      </div>

      <div className="vx-container">
        <dl className="vx-stats">
          <div data-reveal>
            <dt><CountUp to={10} suffix="+" duration={1200} /></dt>
            <dd>anos encaminhando atletas</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "90ms" }}>
            <dt><CountUp to={326} /></dt>
            <dd>atletas enviados</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "180ms" }}>
            <dt><CountUp to={22} duration={1300} /><small>/22</small></dt>
            <dd>jogadores lidos pela IA em cada partida</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "270ms" }}>
            <dt>1</dt>
            <dd>scout dedicado a cada atleta</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

/* ─── I · História ─────────────────────────────────────────────────── */

function History() {
  const lightbox = useLightbox()
  return (
    <section id="historia" className="vx-section vx-history">
      <div className="vx-container">
        <div className="vx-history-grid">
          <div>
            <Chapter num="I" label="A nossa história" title={<>Dez anos à beira <em>do campo.</em></>} />
            <div className="vx-prose" data-reveal>
              <p className="vx-dropcap">
                Antes de existir qualquer algoritmo, existia o campo. Há mais de uma década, a Voxen percorre peneiras,
                centros de treinamento, estádios e aeroportos ao lado de atletas e de suas famílias — e encaminha
                jogadores para clubes do Brasil e do mundo.
              </p>
              <p>
                Perdemos a conta das viagens, dos portões de CT, das conversas à beira do gramado e dos contratos
                assinados. São histórias incontáveis. E cada uma delas mudou uma vida: a do atleta e, muitas vezes, a da
                família inteira.
              </p>
              <p>
                Foi esse trabalho que nos trouxe até aqui. E é por ele que seguimos: <strong>transformando vidas pelo
                futebol</strong>, com a mesma seriedade do primeiro dia.
              </p>
            </div>
            <blockquote className="vx-quote" data-reveal>
              <p>Não vendemos atalhos. Construímos caminhos — um atleta de cada vez.</p>
            </blockquote>
          </div>

          <div className="vx-history-album">
            {HISTORY_PHOTOS.map((p, i) => (
              <div key={p.src} className={`vx-history-photo vx-history-photo--${i}`} data-reveal style={{ ["--d" as string]: `${i * 120}ms` }}>
                <Frame photo={p} onOpen={() => lightbox(HISTORY_PHOTOS, i)} />
              </div>
            ))}
          </div>
        </div>

        <div className="vx-plate" data-reveal>
          <div className="vx-plate-copy">
            <p className="vx-kicker vx-kicker--olive">Registro</p>
            <p className="vx-plate-number"><CountUp to={326} duration={2200} /></p>
            <p className="vx-plate-title">atletas enviados.</p>
            <p className="vx-plate-text">
              Cada um deles tem nome, posição e uma história que acompanhamos de perto. A trajetória está registrada,
              foto a foto, no nosso Instagram.
            </p>
            <InstagramLink className="vx-link vx-link--olive">Acompanhar @{INSTAGRAM_HANDLE}</InstagramLink>
          </div>
          <button type="button" className="vx-plate-media" onClick={() => lightbox([PLATE_326], 0)} aria-label="Ampliar a arte 326 atletas enviados">
            <img src={PLATE_326.src} alt={PLATE_326.alt} width={PLATE_326.w} height={PLATE_326.h} loading="lazy" decoding="async" />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── II · O método antigo ─────────────────────────────────────────── */

const LEDGER = [
  ["Uma partida por vez, quando há um avaliador presente", "Cada vídeo do atleta analisado, lance a lance"],
  ["A atenção vai para quem está com a bola", "Os 22 jogadores acompanhados o tempo todo"],
  ["A impressão de um único dia", "Um histórico de evolução, semana após semana"],
  ["Algumas indicações por semana", "Dezenas de atletas encaminhados por dia"],
  ["O resultado depende de quem estava assistindo", "O resultado depende do que o atleta mostrou"],
]

function OldMethod() {
  return (
    <section id="metodo" className="vx-section vx-old">
      <div className="vx-container">
        <Chapter num="II" label="O método antigo" title={<>Um avaliador. Vinte e dois jogadores. <em>Noventa minutos.</em></>}>
          <p>
            Durante décadas, o futuro de um atleta dependeu de um único olhar. O avaliador chega, assiste a uma
            partida — às vezes três ou quatro no mesmo dia — e decide em poucos minutos quem merece uma segunda chance.
          </p>
          <p>
            Ninguém consegue prestar atenção em 22 jogadores ao mesmo tempo. O olhar segue a bola. Quem estava longe
            dela naquele lance simplesmente não foi visto.
          </p>
        </Chapter>

        <p className="vx-verdict" data-reveal>Não era falta de talento. <em>Era falta de método.</em></p>

        <div data-reveal><PitchScan /></div>

        <div className="vx-ledger" data-reveal>
          <div className="vx-ledger-head">
            <span>Como era</span>
            <span>Como é agora</span>
          </div>
          {LEDGER.map(([before, after], i) => (
            <div key={i} className="vx-ledger-row" data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
              <span className="vx-ledger-before">{before}</span>
              <span className="vx-ledger-arrow" aria-hidden="true">→</span>
              <span className="vx-ledger-after">{after}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── III · O novo olhar ───────────────────────────────────────────── */

const CALLOUTS = [
  "Todos os jogadores identificados, do primeiro ao último minuto.",
  "Velocidade medida a cada arrancada — de 8 a 23 km/h no mesmo lance.",
  "Passes e trajetórias registrados, com a velocidade da bola.",
  "Um atleta em destaque, acompanhado durante toda a jogada: Joãozinho.",
]

function NewEye() {
  const lightbox = useLightbox()
  const listRef = useRef<HTMLOListElement>(null)
  const listIn = useInView(listRef, 0.3)
  return (
    <section className="vx-section vx-neweye">
      <div className="vx-container vx-neweye-grid">
        <div className="vx-neweye-media" data-reveal>
          <div className="vx-monitor">
            <div className="vx-monitor-bar">
              <span className="vx-rec" aria-hidden="true" />
              Registro real · rastreamento Zyron
            </div>
            <LoopVideo {...TRACKING_VIDEO}
              label="Registro real de uma partida com todos os jogadores identificados pela IA e o atleta Joãozinho em destaque, com a velocidade medida" />
          </div>
        </div>

        <div>
          <Chapter num="III" label="O novo olhar" title={<>A inteligência artificial <em>enxerga os 22.</em></>}>
            <p>
              Este é um registro real da Zyron em uma partida. Cada jogador em campo é identificado e acompanhado:
              deslocamento, velocidade, passes, posicionamento. Nenhum lance passa despercebido — e nada depende de um
              dia bom ou ruim de quem está assistindo.
            </p>
          </Chapter>

          <ol ref={listRef} className={`vx-callouts${listIn ? " is-in" : ""}`}>
            {CALLOUTS.map((c, i) => (
              <li key={i} style={{ ["--d" as string]: `${i * 380}ms` }}>
                <span className="vx-callout-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>

          <div className="vx-story" data-reveal>
            <button type="button" className="vx-story-media" onClick={() => lightbox([JOAOZINHO_CARD], 0)} aria-label="Ampliar o cartão do Joãozinho">
              <img src={JOAOZINHO_CARD.src} alt={JOAOZINHO_CARD.alt} width={JOAOZINHO_CARD.w} height={JOAOZINHO_CARD.h} loading="lazy" decoding="async" />
            </button>
            <div>
              <p className="vx-kicker">Da análise ao clube</p>
              <p className="vx-story-text">
                O atleta destacado neste rastreamento é o <strong>Joãozinho</strong> — que chegou ao <strong>Grêmio</strong>.
                O mesmo olhar que acompanhou cada passo dele em campo é o que acompanha cada atleta da Voxen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── IV · A lógica ────────────────────────────────────────────────── */

const LOGIC = [
  ["Um clube não procura um craque genérico.", "Procura um perfil: uma posição, um tipo físico, um estilo de jogo, um momento de carreira."],
  ["Cada atleta tem características próprias.", "Velocidade, leitura de jogo, passe, finalização. É isso que define onde ele rende mais."],
  ["A IA mede essas características, lance a lance.", "Dez indicadores individuais, a partir dos vídeos do próprio atleta."],
  ["O scout cruza esse perfil com o que cada clube procura.", "Com contexto: posição, categoria, mercado e o momento de cada atleta."],
  ["Nós temos acesso a esses clubes. E fazemos a conexão.", "Uma rede construída em mais de dez anos, no Brasil e no exterior."],
]

function Logic() {
  const chainRef = useRef<HTMLOListElement>(null)
  useScrollProgress(chainRef, (p) => {
    const el = chainRef.current
    if (!el) return
    el.style.setProperty("--p", p.toFixed(3))
    el.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      li.classList.toggle("is-on", p > (i + 0.35) / (LOGIC.length + 0.6))
    })
  })

  return (
    <section className="vx-section vx-logic">
      <div className="vx-container">
        <Chapter num="IV" label="A lógica" center title={<>Você não precisa ser <em>o próximo Neymar.</em></>}>
          <p>Precisa ser exatamente o atleta que um clube específico está procurando. A conta é simples:</p>
        </Chapter>

        <div className="vx-logic-grid">
          <ol ref={chainRef} className="vx-chain">
            {LOGIC.map(([title, text], i) => (
              <li key={title}>
                <span className="vx-chain-letter">{"ABCDE"[i]}</span>
                <div>
                  <p className="vx-chain-title">{title}</p>
                  <p className="vx-chain-text">{text}</p>
                </div>
              </li>
            ))}
            <li className="vx-chain-result">
              <span className="vx-chain-letter" aria-label="Logo">∴</span>
              <div>
                <p className="vx-chain-title">O atleta certo, no clube certo.</p>
                <p className="vx-chain-text vx-chain-text--big">Não é sorte. <em>É método.</em></p>
              </div>
            </li>
          </ol>
          <div className="vx-logic-visual" data-reveal>
            <MatchRadar />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── V · IA + scout, jornada e filme ──────────────────────────────── */

function Method() {
  const lightbox = useLightbox()
  const journeyRef = useRef<HTMLOListElement>(null)
  const journeyIn = useInView(journeyRef, 0.4)
  return (
    <section id="scout" className="vx-section vx-method">
      <div className="vx-container">
        <Chapter num="V" label="Inteligência artificial + scout" title={<>Os dados descrevem o jogo. <em>O scout decide o caminho.</em></>} />

        <div className="vx-duo">
          <article className="vx-duo-card" data-reveal>
            <p className="vx-kicker">A inteligência artificial</p>
            <h3 className="vx-h3">Observa, mede e registra. Sem cansaço, sem pressa, sem preferência.</h3>
            <ul className="vx-ticks">
              <li>Análise de cada vídeo enviado pelo atleta</li>
              <li>Dez indicadores individuais, do passe à leitura de jogo</li>
              <li>Histórico de evolução ao longo do tempo</li>
              <li>Cruzamento com o perfil que cada clube procura</li>
            </ul>
            <ReportBars />
          </article>

          <article className="vx-duo-card vx-duo-card--scout" data-reveal style={{ ["--d" as string]: "140ms" }}>
            <p className="vx-kicker">O scout</p>
            <h3 className="vx-h3">Um estrategista esportivo que se dedica integralmente ao atleta.</h3>
            <p className="vx-duo-text">
              É ele quem interpreta os números e enxerga o que a máquina não vê — o contexto, o momento, a pessoa — e
              transforma a leitura em um plano.
            </p>
            <ul className="vx-ticks">
              <li>Define metas e treinos para a posição</li>
              <li>Acompanha cada novo vídeo e ajusta o plano</li>
              <li>Mantém a família informada a cada etapa</li>
              <li>Conduz a conexão com o clube</li>
            </ul>
            <Frame photo={MENTORING_PHOTO} className="vx-duo-photo" onOpen={() => lightbox([MENTORING_PHOTO], 0)} />
          </article>
        </div>

        <div className="vx-journey-wrap" data-reveal>
          <p className="vx-kicker vx-kicker--center">A jornada do atleta</p>
          <ol ref={journeyRef} className={`vx-journey${journeyIn ? " is-in" : ""}`}>
            {JOURNEY.map((j, i) => (
              <li key={j.step} style={{ ["--d" as string]: `${i * 260}ms` }}>
                <span className="vx-journey-dot" aria-hidden="true">{i + 1}</span>
                <p className="vx-journey-step">{j.step}</p>
                <p className="vx-journey-text">{j.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="vx-film-wrap">
          <div className="vx-film-copy" data-reveal>
            <p className="vx-kicker">O filme</p>
            <h3 className="vx-h3 vx-h3--serif">O método, do primeiro lance ao clube.</h3>
            <p>
              Em dois minutos, a jornada completa: como a IA analisa, como o scout orienta e como o perfil do atleta chega
              ao clube que procura exatamente aquelas características.
            </p>
          </div>
          <div data-reveal style={{ ["--d" as string]: "120ms" }}>
            <FilmPlayer {...FILM} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── VI · Brasil ──────────────────────────────────────────────────── */

function Brazil() {
  const lightbox = useLightbox()
  const [region, setRegion] = useState<Region | "Todos">("Todos")
  const shown = BRAZIL_GALLERY.map((p, i) => ({ p, i })).filter(({ p }) => region === "Todos" || p.region === region)

  return (
    <section id="brasil" className="vx-section vx-brazil">
      <div className="vx-container">
        <Chapter num="VI" label="Brasil" light title={<>Do Sul ao Nordeste, <em>nossos atletas estão em campo.</em></>}>
          <p>
            Grandes clubes, clubes formadores e centros de treinamento em quatro regiões do país. Cada linha deste painel
            corresponde a um registro do nosso arquivo — toque em “ver foto” para conferir.
          </p>
        </Chapter>

        <div data-reveal>
          <DepartureBoard title="Destinos · Brasil" code="VX · BR" rows={BRAZIL_DESTINATIONS}
            onOpen={(i) => lightbox(BRAZIL_GALLERY, i)} />
        </div>

        <div className="vx-filter" role="group" aria-label="Filtrar fotos por região" data-reveal>
          {(["Todos", ...REGIONS] as const).map((r) => (
            <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)}>{r}</button>
          ))}
        </div>

        <div className="vx-gallery" key={region}>
          {shown.map(({ p, i }, k) => (
            <div key={p.src} className="vx-gallery-item" style={{ ["--d" as string]: `${Math.min(k, 8) * 60}ms` }}>
              <Frame photo={p} onOpen={() => lightbox(BRAZIL_GALLERY, i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── VII · Mundo ──────────────────────────────────────────────────── */

function World() {
  const lightbox = useLightbox()
  return (
    <section id="mundo" className="vx-section vx-world">
      <div className="vx-world-lines" aria-hidden="true" />
      <div className="vx-container">
        <Chapter num="VII" label="Mundo" title={<>O talento brasileiro <em>não tem fronteira.</em></>}>
          <p>
            Nossa rede ultrapassa o país. Atletas acompanhados pela Voxen já foram recebidos por clubes no exterior — e a
            base de compatibilidade da Zyron cruza o perfil de cada jogador com clubes de 39 países.
          </p>
        </Chapter>

        <div data-reveal>
          <DepartureBoard title="Destinos · Exterior" code="VX · INT" rows={WORLD_DESTINATIONS}
            onOpen={(i) => lightbox(WORLD_PHOTOS, i)} />
        </div>

        <div className="vx-world-grid">
          <div className="vx-world-photos">
            {WORLD_PHOTOS.map((p, i) => (
              <div key={p.src} data-reveal style={{ ["--d" as string]: `${i * 140}ms` }}>
                <Frame photo={p} onOpen={() => lightbox(WORLD_PHOTOS, i)} />
              </div>
            ))}
          </div>
          <div className="vx-world-side">
            <aside className="vx-context" data-reveal>
              <p className="vx-kicker">O mundo já joga assim</p>
              <p>
                Em 2024, o Chelsea, da Inglaterra, apresentou um programa de recrutamento de base que usa inteligência
                artificial para analisar vídeos de jovens atletas. O novo futebol não é uma promessa: <strong>já está
                acontecendo</strong>.
              </p>
              <a href={CHELSEA_SOURCE} target="_blank" rel="noopener noreferrer" className="vx-link">
                Fonte: Chelsea FC <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── VIII · Conexões ──────────────────────────────────────────────── */

function Connections() {
  return (
    <section id="conexoes" className="vx-section vx-connections">
      <div className="vx-container">
        <Chapter num="VIII" label="Conexões" center title={<>Uma rede construída <em>em campo.</em></>}>
          <p>
            Clubes onde nossos atletas estiveram, clubes da base de compatibilidade da Zyron e as marcas presentes nos
            uniformes que eles vestem — no Brasil e no mundo.
          </p>
        </Chapter>
      </div>
      <div className="vx-marquee-block" data-reveal>
        <p className="vx-marquee-label"><span>Brasil</span></p>
        <Marquee items={CONNECTIONS_BRAZIL} seconds={75} />
        <p className="vx-marquee-label"><span>Mundo</span></p>
        <Marquee items={CONNECTIONS_WORLD} reverse seconds={80} />
      </div>
      <div className="vx-container">
        <p className="vx-fine vx-fine--center">
          Escudos e marcas pertencem aos seus titulares e identificam clubes e uniformes da trajetória dos atletas; a
          presença nesta faixa não indica patrocínio.
        </p>
      </div>
    </section>
  )
}

/* ─── IX · Reconhecimento ──────────────────────────────────────────── */

function Recognition() {
  const lightbox = useLightbox()
  return (
    <section className="vx-section vx-recognition">
      <div className="vx-container">
        <Chapter num="IX" label="Reconhecimento" title={<>Um trabalho reconhecido <em>dentro e fora de campo.</em></>}>
          <p>
            O trabalho com atletas de base levou a nossa equipe ao plenário, em uma homenagem no Distrito Federal — e os
            nossos atletas, às câmeras da imprensa.
          </p>
        </Chapter>
        <div className="vx-recog-grid">
          {RECOGNITION_PHOTOS.map((p, i) => (
            <div key={p.src} className={`vx-recog-item vx-recog-item--${i}`} data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}>
              <Frame photo={p} onOpen={() => lightbox(RECOGNITION_PHOTOS, i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Manifesto ────────────────────────────────────────────────────── */

const MANIFESTO =
  "O método mudou. No Brasil e no mundo, clubes já enxergam atletas por dados. Quem se adaptar será visto por inteiro. Quem não se adaptar vai continuar esperando por um olhar de um dia — e vai ficar para trás."

function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = MANIFESTO.split(" ")
  useScrollProgress(ref, (p) => {
    const el = ref.current
    if (!el) return
    const lit = Math.round(Math.min(1, p * 1.35) * words.length)
    el.querySelectorAll<HTMLElement>("span").forEach((s, i) => s.classList.toggle("is-lit", i < lit))
  })
  return (
    <section id="novo-futebol" className="vx-section vx-manifesto">
      <div className="vx-container vx-container--narrow">
        <p className="vx-kicker vx-kicker--center">O novo futebol</p>
        <p ref={ref} className="vx-manifesto-text">
          {words.map((w, i) => <span key={i}>{w} </span>)}
        </p>
        <p className="vx-manifesto-sign" data-reveal>
          E nós seguiremos aqui, como há mais de dez anos: <em>transformando vidas pelo futebol.</em>
        </p>
      </div>
    </section>
  )
}

/* ─── Arquivo (mosaico) ────────────────────────────────────────────── */

function Archive() {
  const lightbox = useLightbox()
  return (
    <section className="vx-archive" aria-labelledby="vx-archive-title">
      <button type="button" className="vx-archive-media" onClick={() => lightbox([MOSAIC], 0)} aria-label="Ampliar o mosaico de fotos">
        <img src={MOSAIC.src} alt={MOSAIC.alt} width={MOSAIC.w} height={MOSAIC.h} loading="lazy" decoding="async" />
      </button>
      <div className="vx-archive-overlay">
        <div className="vx-container">
          <p className="vx-kicker">Arquivo</p>
          <h2 id="vx-archive-title" className="vx-h2">Cada rosto, <em>uma história que acompanhamos.</em></h2>
          <InstagramLink className="vx-btn vx-btn--gold">Ver o arquivo completo · @{INSTAGRAM_HANDLE}</InstagramLink>
        </div>
      </div>
    </section>
  )
}

/* ─── Compromissos, contato e rodapé ───────────────────────────────── */

const PRINCIPLES = [
  ["Sem promessas vazias", "Orientamos, preparamos e conectamos. A decisão de contratar é sempre do clube."],
  ["Atletas menores", "A participação de menores de 18 anos acontece sempre com a autorização do responsável legal."],
  ["Dados com cuidado", "As informações de cada atleta seguem os nossos Termos de Uso e a Política de Privacidade."],
  ["Um scout por atleta", "Do primeiro vídeo à assinatura, o atleta e a família sabem com quem estão falando."],
]

function Closing() {
  return (
    <section className="vx-section vx-closing">
      <div className="vx-container">
        <Chapter num="X" label="Compromissos" center title={<>Seriedade, do primeiro contato <em>ao contrato.</em></>} />
        <div className="vx-principles">
          {PRINCIPLES.map(([t, d], i) => (
            <div key={t} className="vx-principle" data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
              <span className="vx-principle-num">{["I", "II", "III", "IV"][i]}</span>
              <p className="vx-principle-title">{t}</p>
              <p className="vx-principle-text">{d}</p>
            </div>
          ))}
        </div>

        <div className="vx-contact" data-reveal>
          <div>
            <p className="vx-kicker">Contato</p>
            <h3 className="vx-h3 vx-h3--serif">Converse com a nossa equipe.</h3>
            <p>Atletas, famílias, clubes e parceiros: estamos à disposição para conversar.</p>
          </div>
          <div className="vx-contact-actions">
            <InstagramLink className="vx-btn vx-btn--ghost">@{INSTAGRAM_HANDLE}</InstagramLink>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--ghost">
              <WhatsAppIcon width={17} height={17} /> WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="vx-btn vx-btn--ghost">
              <Mail size={17} aria-hidden="true" /> {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="vx-footer">
      <div className="vx-container vx-footer-inner">
        <div>
          <Lockup />
          <p className="vx-footer-tag">Voxen · Assessoria esportiva — Zyron · Inteligência artificial para o futebol</p>
        </div>
        <div className="vx-footer-links">
          <InstagramLink className="vx-icon-btn" />
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/privacidade">Privacidade</Link>
        </div>
      </div>
      <div className="vx-container">
        <p className="vx-footer-copy">© 2026 Voxen | Zyron. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}

/* ─── Página ───────────────────────────────────────────────────────── */

function Page() {
  const rootRef = useRef<HTMLDivElement>(null)
  useDocumentMeta()
  useRevealAll(rootRef)
  return (
    <div ref={rootRef} className="vx">
      <a href="#historia" className="vx-skip">Pular para o conteúdo</a>
      <div className="vx-grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <History />
        <OldMethod />
        <NewEye />
        <Logic />
        <Method />
        <Brazil />
        <World />
        <Connections />
        <Recognition />
        <Manifesto />
        <Archive />
        <Closing />
      </main>
      <Footer />
    </div>
  )
}

export default function Institucional() {
  return (
    <LightboxProvider>
      <Page />
    </LightboxProvider>
  )
}
