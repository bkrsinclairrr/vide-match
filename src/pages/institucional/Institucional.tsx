import "@fontsource-variable/inter"
import "@fontsource-variable/playfair-display"
import "@fontsource-variable/playfair-display/wght-italic.css"
import "./institucional.css"

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowUpRight, Instagram, Mail, Menu, X } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import PartnersSection from "@/pages/site/PartnersSection"
import { ZyronMark } from "@/pages/site/ZyronMark"
import {
  ATHLETE_GALLERY, BOTAFOGO_PHOTO, CHELSEA_SOURCE, CONNECTION_PILLARS, CONNECTIONS_BRAZIL, CONNECTIONS_WORLD,
  CONTACT_EMAIL, FILM, HERO_PHOTOS, HISTORY_PHOTOS, INSTAGRAM_HANDLE, INSTAGRAM_URL, JOAOZINHO_CARD, MENTORING_PHOTO,
  MOSAIC, NETWORK_DESTINATIONS, PLATE_326, RECOGNITION_PHOTOS, TRACKING_VIDEO, WHATSAPP_URL, WORLD_NETWORK,
  WORLD_PHOTOS, type Photo,
} from "./data"
import {
  AutoVideo, CountUp, DepartureBoard, Frame, LightboxProvider, Marquee, MatchRadar, PitchScan,
  ReportBars, useInView, useLightbox, useRevealAll, useScrollProgress,
} from "./parts"

/**
 * Página institucional (/institucional). Sem oferta nem preço: o objetivo
 * é credibilidade, contra um inimigo comum (o método clássico, das
 * peneiras e do olhômetro).
 *
 * Ordem: nós mudamos o futebol → como é o método clássico → a IA vê os
 * 22 (vídeo real) → o match atleta–clube → IA + scout (filme) → a nossa
 * história → provas no Brasil e no mundo → rede → reconhecimento →
 * manifesto → arquivo → contato. A copy não usa travessões.
 */

const NAV = [
  { href: "#metodo", label: "O método" },
  { href: "#historia", label: "História" },
  { href: "#destinos", label: "Destinos" },
  { href: "#mundo", label: "Mundo" },
  { href: "#conexoes", label: "Conexões" },
]

const TITLE = "Voxen | Zyron · Nós mudamos o futebol"
const DESCRIPTION =
  "Há mais de dez anos a Voxen leva atletas direto aos clubes, sem peneira e sem olhômetro. Com a inteligência artificial da Zyron, cada jogador é analisado com precisão e conectado ao clube que procura o seu perfil."

/** Largura de exibição de cada tipo de foto, para o navegador escolher a versão certa. */
const SIZES = {
  hero: "(max-width: 640px) 50vw, (max-width: 1024px) 280px, 300px",
  album: "(max-width: 640px) 46vw, (max-width: 1024px) 45vw, 260px",
  athlete: "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px",
  conn: "(max-width: 640px) 80vw, 380px",
  world: "(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 420px",
  recog: "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 460px",
  phone: "(max-width: 640px) 72vw, 300px",
  card: "120px",
  plate: "(max-width: 640px) 80vw, 320px",
  archive: "100vw",
}

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

/** Imagem simples com as versões leves (srcset) já resolvidas. */
function Img({ photo, sizes, eager = false, className }: { photo: Photo; sizes: string; eager?: boolean; className?: string }) {
  return (
    <img
      className={className}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={photo.srcSet ? sizes : undefined}
      alt={photo.alt}
      width={photo.w}
      height={photo.h}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
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
        <a href="#inicio" className="vx-nav-brand" aria-label="Voxen | Zyron, voltar ao início" onClick={() => setOpen(false)}>
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

function Chapter({ num, label, title, children, light = false }: {
  num: string; label: string; title: ReactNode; children?: ReactNode; light?: boolean
}) {
  return (
    <header className={`vx-chapter${light ? " vx-chapter--light" : ""}`} data-reveal>
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

function SplitWords({ text, from = 0, className = "" }: { text: string; from?: number; className?: string }) {
  return (
    <>
      {/* o espaço fica fora do inline-block: dentro dele seria descartado no fim da caixa */}
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className={`vx-word ${className}`}><span style={{ ["--i" as string]: from + i }}>{w}</span></span>{" "}
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
            <span>Zyron · Inteligência artificial</span>
          </p>
          <h1 className="vx-h1">
            <SplitWords text="Nós mudamos o" />
            <SplitWords text="futebol." from={3} className="vx-word--accent" />
          </h1>
          <p className="vx-hero-lead">
            Há mais de dez anos levamos atletas <strong>direto aos clubes</strong>, sem peneira e sem olhômetro. A
            inteligência artificial da Zyron encontra o clube que procura exatamente o seu perfil, e a nossa rede, de
            donos de clubes a agentes, faz a conexão. Um scout dedicado conduz cada passo.
          </p>
          <div className="vx-hero-links">
            <a href="#metodo" className="vx-btn vx-btn--gold">
              Veja como funciona <ArrowDown size={16} aria-hidden="true" />
            </a>
            <InstagramLink className="vx-btn vx-btn--ghost">@{INSTAGRAM_HANDLE}</InstagramLink>
          </div>
        </div>

        <div className="vx-hero-stack" aria-label="Atletas da Voxen em clubes do Brasil e do exterior">
          {HERO_PHOTOS.map((p, i) => (
            <button key={p.src} type="button" className={`vx-hero-card vx-hero-card--${i}`}
              onClick={() => lightbox(HERO_PHOTOS, i)} aria-label={`Ampliar foto: ${p.title}`}>
              <Img photo={p} sizes={SIZES.hero} eager />
              <span className="vx-hero-card-cap"><strong>{p.title}</strong><em>{p.note}</em></span>
            </button>
          ))}
        </div>
      </div>

      <div className="vx-container">
        <dl className="vx-stats">
          <div data-reveal>
            <dt><CountUp to={10} suffix="+" duration={1200} /></dt>
            <dd>anos levando atletas aos clubes</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "80ms" }}>
            <dt><CountUp to={326} /></dt>
            <dd>atletas enviados</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "160ms" }}>
            <dt><CountUp to={22} duration={1300} /><small>/22</small></dt>
            <dd>jogadores analisados pela IA por partida</dd>
          </div>
          <div data-reveal style={{ ["--d" as string]: "240ms" }}>
            <dt>1</dt>
            <dd>scout dedicado a cada atleta</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

/* ─── I · O método clássico ────────────────────────────────────────── */

const LEDGER = [
  ["Peneira e avaliação de um dia", "Análise de cada lance do atleta"],
  ["Atenção só em quem está com a bola", "Os 22 jogadores observados com precisão"],
  ["Decisão pela impressão de poucos minutos", "Decisão baseada em dados"],
  ["O atleta espera ser visto", "O atleta vai direto ao clube que procura o seu perfil"],
]

function ClassicMethod() {
  return (
    <section id="metodo" className="vx-section vx-old">
      <div className="vx-container">
        <Chapter num="I" label="O método clássico" title={<>O futebol ainda escolhe <em>no olhômetro.</em></>}>
          <p>
            Peneiras e avaliações dependem de um olheiro que assiste a várias partidas no mesmo dia e decide pela
            impressão de poucos minutos. Ninguém analisa 22 jogadores com precisão a olho nu. Quem estava longe da bola
            simplesmente não foi visto.
          </p>
        </Chapter>

        <p className="vx-verdict" data-reveal>O problema nunca foi o talento. <em>Sempre foi o método.</em></p>

        <div className="vx-block" data-reveal><PitchScan /></div>

        <div className="vx-ledger vx-block" data-reveal>
          <div className="vx-ledger-head">
            <span>Método clássico</span>
            <span>Voxen + Zyron</span>
          </div>
          {LEDGER.map(([before, after], i) => (
            <div key={i} className="vx-ledger-row">
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

/* ─── II · O novo olhar ────────────────────────────────────────────── */

const CALLOUTS = [
  "Todos os jogadores identificados em campo.",
  "Velocidade medida a cada arrancada: de 8 a 23 km/h no mesmo lance.",
  "Destaque individual: Joãozinho, acompanhado lance a lance.",
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
            <AutoVideo src={TRACKING_VIDEO.src} poster={TRACKING_VIDEO.poster} className="vx-loop"
              label="Registro real de uma partida com todos os jogadores identificados pela IA e o atleta Joãozinho em destaque, com a velocidade medida" />
          </div>
        </div>

        <div className="vx-neweye-copy">
          <Chapter num="II" label="O novo olhar" title={<>A IA vê os 22. <em>Com precisão.</em></>}>
            <p>
              Registro real da Zyron em partida. Cada jogador é identificado e medido do início ao fim: velocidade,
              deslocamento, passes e posicionamento. Nada passa despercebido.
            </p>
          </Chapter>

          <ol ref={listRef} className={`vx-callouts${listIn ? " is-in" : ""}`}>
            {CALLOUTS.map((c, i) => (
              <li key={i} style={{ ["--d" as string]: `${i * 260}ms` }}>
                <span className="vx-callout-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>

          <div className="vx-story" data-reveal>
            <button type="button" className="vx-story-media" onClick={() => lightbox([JOAOZINHO_CARD], 0)} aria-label="Ampliar o cartão do Joãozinho">
              <Img photo={JOAOZINHO_CARD} sizes={SIZES.card} />
            </button>
            <div>
              <p className="vx-kicker">Da análise ao clube</p>
              <p className="vx-story-text">
                O atleta destacado neste rastreamento é o <strong>Joãozinho</strong>, que chegou ao <strong>Grêmio</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── III · O match ────────────────────────────────────────────────── */

const LOGIC = [
  ["A IA coleta.", "Cada lance vira dado: dez indicadores individuais do seu jogo."],
  ["O perfil encontra o clube.", "Suas características são cruzadas com o que cada clube da nossa rede precisa."],
  ["Nós conectamos.", "Você é encaminhado direto ao clube que procura exatamente o seu perfil."],
]

function Match() {
  const chainRef = useRef<HTMLOListElement>(null)
  useScrollProgress(chainRef, (p) => {
    const el = chainRef.current
    if (!el) return
    el.style.setProperty("--p", p.toFixed(3))
    el.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      li.classList.toggle("is-on", p > (i + 0.3) / (LOGIC.length + 0.6))
    })
  })

  return (
    <section className="vx-section vx-logic">
      <div className="vx-container">
        <Chapter num="III" label="O match" title={<>Você não precisa ser <em>o próximo Neymar.</em></>}>
          <p>Precisa ser o atleta que um clube específico está procurando. E nós sabemos qual clube é esse.</p>
        </Chapter>

        <div className="vx-logic-grid">
          <ol ref={chainRef} className="vx-chain">
            {LOGIC.map(([title, text], i) => (
              <li key={title}>
                <span className="vx-chain-letter">{i + 1}</span>
                <div>
                  <p className="vx-chain-title">{title}</p>
                  <p className="vx-chain-text">{text}</p>
                </div>
              </li>
            ))}
            <li className="vx-chain-result">
              <span className="vx-chain-letter" aria-label="Logo">∴</span>
              <div>
                <p className="vx-chain-title">Atleta certo, clube certo.</p>
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

/* ─── IV · IA + scout e filme ──────────────────────────────────────── */

function Method() {
  const lightbox = useLightbox()
  return (
    <section id="scout" className="vx-section vx-method">
      <div className="vx-container">
        <Chapter num="IV" label="Inteligência artificial + scout" title={<>A IA encontra. <em>O scout conduz.</em></>} />

        <div className="vx-row">
          <div className="vx-row-copy" data-reveal>
            <p className="vx-kicker">A inteligência artificial</p>
            <h3 className="vx-h3">Observa cada lance com excelência.</h3>
            <p>
              Sem cansaço, sem preferência e sem olhômetro. Mede dez indicadores de cada atleta e cruza o perfil com os
              clubes, o que permite encaminhar dezenas de atletas por dia.
            </p>
          </div>
          <div className="vx-row-visual" data-reveal style={{ ["--d" as string]: "100ms" }}>
            <ReportBars />
          </div>
        </div>

        <div className="vx-row vx-row--flip">
          <div className="vx-row-copy" data-reveal>
            <p className="vx-kicker">O scout</p>
            <h3 className="vx-h3">Um estrategista esportivo dedicado integralmente a você.</h3>
            <p>
              Interpreta os dados, define o plano de evolução, acompanha cada novo vídeo e faz a conexão com o clube. Na
              imagem, o encerramento de mais uma etapa de mentoria com atletas acompanhados.
            </p>
          </div>
          <div className="vx-row-visual" data-reveal style={{ ["--d" as string]: "100ms" }}>
            <figure className="vx-phone">
              <button type="button" className="vx-phone-screen" onClick={() => lightbox([MENTORING_PHOTO], 0)}
                aria-label="Ampliar a imagem da mentoria online">
                <Img photo={MENTORING_PHOTO} sizes={SIZES.phone} />
              </button>
              <figcaption><strong>{MENTORING_PHOTO.title}</strong><em>{MENTORING_PHOTO.note}</em></figcaption>
            </figure>
          </div>
        </div>

        <div className="vx-film-wrap">
          <div className="vx-film-copy" data-reveal>
            <p className="vx-kicker">O filme</p>
            <h3 className="vx-h3">Do primeiro lance ao clube, em dois minutos.</h3>
            <p>Veja como a IA analisa, como o scout orienta e como o atleta chega ao clube certo.</p>
          </div>
          <div data-reveal style={{ ["--d" as string]: "100ms" }}>
            <AutoVideo src={FILM.src} poster={FILM.poster} className="vx-film" loop={false} sound
              label="Filme Zyron: a jornada do atleta, da análise por IA ao clube" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── V · A nossa história ─────────────────────────────────────────── */

function History() {
  const lightbox = useLightbox()
  return (
    <section id="historia" className="vx-section vx-history">
      <div className="vx-container">
        <div className="vx-history-grid">
          <div>
            <Chapter num="V" label="A nossa história" title={<>Fazemos isso há <em>mais de dez anos.</em></>} />
            <div className="vx-prose" data-reveal>
              <p className="vx-dropcap">
                Antes de a inteligência artificial chegar ao futebol, a Voxen já levava atletas direto aos clubes, sem
                passar por peneiras. Foram incontáveis viagens, contratos assinados e vidas transformadas.
              </p>
              <p>
                A tecnologia não mudou o nosso propósito. Deixou o método mais preciso e mais rápido. <strong>Nós mudamos
                o futebol há muito tempo.</strong> E seguimos mudando.
              </p>
            </div>
          </div>

          <div className="vx-history-album">
            {HISTORY_PHOTOS.map((p, i) => (
              <div key={p.src} className={`vx-history-photo vx-history-photo--${i}`} data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}>
                <Frame photo={p} sizes={SIZES.album} onOpen={() => lightbox(HISTORY_PHOTOS, i)} />
              </div>
            ))}
          </div>
        </div>

        <div className="vx-plate vx-block" data-reveal>
          <div className="vx-plate-copy">
            <p className="vx-kicker vx-kicker--olive">Registro</p>
            <p className="vx-plate-number"><CountUp to={326} duration={2000} /></p>
            <p className="vx-plate-title">atletas enviados.</p>
            <p className="vx-plate-text">Cada um com nome, posição e clube de destino. Tudo registrado no nosso Instagram.</p>
            <InstagramLink className="vx-link vx-link--olive">Acompanhar @{INSTAGRAM_HANDLE}</InstagramLink>
          </div>
          <button type="button" className="vx-plate-media" onClick={() => lightbox([PLATE_326], 0)} aria-label="Ampliar a arte 326 atletas enviados">
            <Img photo={PLATE_326} sizes={SIZES.plate} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── VI · Destinos ────────────────────────────────────────────────── */

function Destinations() {
  const lightbox = useLightbox()
  return (
    <section id="destinos" className="vx-section vx-brazil">
      <div className="vx-container">
        <Chapter num="VI" label="Destinos" light title={<>Do Sul ao Nordeste. <em>Da Inglaterra ao Canadá.</em></>}>
          <p>
            Grandes clubes do Brasil e clubes do exterior, lado a lado na nossa rede. O atleta não espera ser visto:
            ele vai direto para quem procura o seu perfil.
          </p>
        </Chapter>

        <div data-reveal>
          <DepartureBoard title="Nossa rede · Brasil e exterior" code="VX · BR · INT" rows={NETWORK_DESTINATIONS} />
        </div>

        <div className="vx-athletes vx-block">
          <p className="vx-kicker vx-kicker--olive" data-reveal>Alguns dos nossos atletas</p>
          <div className="vx-athletes-grid">
            {ATHLETE_GALLERY.map((p, i) => (
              <button key={p.src} type="button" className="vx-athlete" data-reveal
                style={{ ["--d" as string]: `${(i % 4) * 60}ms` }}
                onClick={() => lightbox(ATHLETE_GALLERY, i)} aria-label="Ampliar foto">
                <Img photo={p} sizes={SIZES.athlete} />
              </button>
            ))}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="vx-athletes-more" data-reveal
              style={{ ["--d" as string]: "180ms" }}>
              <strong>+ centenas</strong>
              <span>de outros atletas encaminhados para clubes do Brasil e do exterior.</span>
              <em>Ver no Instagram <ArrowUpRight size={14} aria-hidden="true" /></em>
            </a>
          </div>
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
            Nossos atletas já vestem camisas de clubes da Inglaterra e do Canadá. A nossa rede vai de Portugal à
            Escandinávia e chega aos Emirados Árabes. Onde houver um clube procurando o seu perfil, nós chegamos.
          </p>
        </Chapter>

        <p className="vx-verdict" data-reveal>Do Brasil para o mundo, <em>sem escala na peneira.</em></p>

        <div className="vx-block" data-reveal>
          <DepartureBoard title="Rede internacional · Europa e Emirados" code="VX · INT" rows={WORLD_NETWORK} />
        </div>

        <div className="vx-world-grid vx-block">
          <div className="vx-world-photos">
            {WORLD_PHOTOS.map((p, i) => (
              <div key={p.src} data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}>
                <Frame photo={p} sizes={SIZES.world} onOpen={() => lightbox(WORLD_PHOTOS, i)} />
              </div>
            ))}
          </div>
          <aside className="vx-context" data-reveal>
            <p className="vx-kicker">O mundo já joga assim</p>
            <p>
              Em 2024 o Chelsea, da Inglaterra, lançou um programa de recrutamento de base com análise de vídeo por
              inteligência artificial. <strong>Quem não se adaptar ao novo modelo vai ficar para trás.</strong>
            </p>
            <a href={CHELSEA_SOURCE} target="_blank" rel="noopener noreferrer" className="vx-link">
              Fonte: Chelsea FC <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}

/* ─── VIII · Conexões ──────────────────────────────────────────────── */

function Connections() {
  const lightbox = useLightbox()
  return (
    <section id="conexoes" className="vx-section vx-connections">
      <div className="vx-container">
        <Chapter num="VIII" label="Conexões" title={<>As melhores conexões <em>do futebol.</em></>}>
          <p>
            Falamos direto com quem decide. Donos de clubes, diretores de futebol, departamentos de captação e os
            principais agentes do mercado, no Brasil e no exterior. É essa rede, construída em mais de dez anos, que
            coloca o atleta certo diante de quem assina.
          </p>
        </Chapter>

        <div className="vx-conn-grid">
          <div className="vx-conn-photo" data-reveal>
            <Frame photo={BOTAFOGO_PHOTO} sizes={SIZES.conn} onOpen={() => lightbox([BOTAFOGO_PHOTO], 0)} />
          </div>
          <ol className="vx-pillars">
            {CONNECTION_PILLARS.map((p, i) => (
              <li key={p.title} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                <span className="vx-pillar-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="vx-pillar-title">{p.title}</p>
                  <p className="vx-pillar-text">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="vx-marquee-block" data-reveal>
        <p className="vx-marquee-label"><span>Clubes da nossa rede · Brasil</span></p>
        <Marquee items={CONNECTIONS_BRAZIL} seconds={75} />
        <p className="vx-marquee-label"><span>Clubes da nossa rede · Mundo</span></p>
        <Marquee items={CONNECTIONS_WORLD} reverse seconds={80} />
      </div>
      <div className="vx-container">
        <p className="vx-fine">Escudos e marcas pertencem aos seus titulares. A presença nesta faixa não indica patrocínio.</p>
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
        <Chapter num="IX" label="Reconhecimento" title={<>Reconhecidos <em>dentro e fora de campo.</em></>}>
          <p>Homenagem no plenário do Distrito Federal e atletas da Voxen na imprensa.</p>
        </Chapter>
        <div className="vx-recog-grid">
          {RECOGNITION_PHOTOS.map((p, i) => (
            <div key={p.src} className={`vx-recog-item vx-recog-item--${i}`} data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
              <Frame photo={p} sizes={SIZES.recog} onOpen={() => lightbox(RECOGNITION_PHOTOS, i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Manifesto ────────────────────────────────────────────────────── */

const MANIFESTO =
  "Peneira, olhômetro e sorte ficaram para trás. O futebol agora é dado, precisão e conexão direta com o clube certo. Quem se adaptar será visto por inteiro. Quem não se adaptar vai ficar para trás."

function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = MANIFESTO.split(" ")
  useScrollProgress(ref, (p) => {
    const el = ref.current
    if (!el) return
    const lit = Math.round(Math.min(1, p * 1.4) * words.length)
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
          Nós mudamos o futebol. <em>E seguimos transformando vidas.</em>
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
        <Img photo={MOSAIC} sizes={SIZES.archive} />
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

/* ─── Contato e rodapé ─────────────────────────────────────────────── */

function Contact() {
  return (
    <section className="vx-section vx-closing">
      <div className="vx-container">
        <div className="vx-contact" data-reveal>
          <div>
            <p className="vx-kicker">Contato</p>
            <h2 className="vx-h3">Fale com a nossa equipe.</h2>
            <p>Atletas, famílias e clubes: estamos à disposição.</p>
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
        <p className="vx-fine">Atletas menores de 18 anos participam sempre com autorização do responsável legal.</p>
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
          <p className="vx-footer-tag">Voxen · Assessoria esportiva | Zyron · Inteligência artificial para o futebol</p>
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
      <a href="#metodo" className="vx-skip">Pular para o conteúdo</a>
      <div className="vx-grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <ClassicMethod />
        <NewEye />
        <Match />
        <Method />
        <History />
        <Destinations />
        <World />
        <Connections />
        <PartnersSection className="vx-partners" />
        <Recognition />
        <Manifesto />
        <Archive />
        <Contact />
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
