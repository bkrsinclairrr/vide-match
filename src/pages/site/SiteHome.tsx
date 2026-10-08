import "@fontsource-variable/inter"
import "./site.css"

import { useEffect, useRef, useState, type MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ArrowRight, BarChart3, Check, ChevronLeft, ChevronRight, Clock, Cpu, Gift, Menu,
  MessageCircle, Shield, Smartphone, Sparkles, Target, User, UserRound, Users, Video, X,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useScrollReveal, useSmoothScroll } from "@/hooks/useScrollAnimations"
import { FUNNEL_ROUTES } from "@/lib/funnel"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronLogo } from "./ZyronMark"
import HeroPlatform from "./HeroPlatform"
import ClubMarquee from "./ClubMarquee"
import HighlightText from "./HighlightText"
import { AthletePanel, FamilyPanel } from "./SitePanels"
import { SPECIALIST_WHATSAPP, STATS, TESTIMONIALS } from "./siteData"

/**
 * Home institucional (/). Mesma estrutura de UI/UX do footlink.app (nav
 * de vidro, hero com print da plataforma, faixa de escudos, texto que
 * acende no scroll, recursos, seções por público, depoimentos e chamada
 * final), com a paleta, a marca e a proposta da Zyron: IA. Todo CTA leva
 * ao mesmo lugar que o botão "Começar minha avaliação" da /avaliacao — o
 * formulário do funil — repassando a query string para não perder UTMs.
 */

const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#atletas", label: "Atletas" },
  { href: "#familias", label: "Famílias" },
  { href: "#depoimentos", label: "Depoimentos" },
]

const WHY_TEXT = [
  { text: "Os grandes clubes já não contratam só pelo olhar: eles decidem com dados. A Zyron coloca essa lógica, com" },
  { text: "inteligência artificial,", accent: true },
  { text: "a favor da" },
  { text: "sua carreira.", accent: true },
]

const STAT_ICONS: Record<(typeof STATS)[number]["icon"], LucideIcon> = {
  chart: BarChart3,
  shield: Shield,
  clock: Clock,
  gift: Gift,
}

const FEATURES: { icon: LucideIcon; title: string; desc: string; tile: string; glow: string }[] = [
  {
    icon: Cpu,
    title: "Avaliação de performance com IA",
    desc: "Suas características físicas, técnicas e táticas viram uma leitura objetiva do seu jogo — sem achismo e sem depender de indicação.",
    tile: "linear-gradient(135deg, #fcd34d, #f59e0b)",
    glow: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "10 indicadores individuais",
    desc: "Ataque, defesa, chute, domínio, marcação, finalização, drible, passe, velocidade e leitura de jogo — cada um com a sua nota.",
    tile: "linear-gradient(135deg, #6ee7b7, #10b981)",
    glow: "#10b981",
  },
  {
    icon: Shield,
    title: "Clubes compatíveis com o seu perfil",
    desc: "Seu perfil é comparado a uma base de mais de 300 clubes do Brasil e do mundo para indicar onde o seu futebol tem mais espaço.",
    tile: "linear-gradient(135deg, #fdba74, #ea580c)",
    glow: "#ea580c",
  },
  {
    icon: Target,
    title: "Pontos a melhorar e oportunidades",
    desc: "Saiba exatamente o que treinar e onde está a sua vantagem competitiva antes da próxima peneira.",
    tile: "linear-gradient(135deg, #7dd3fc, #0284c7)",
    glow: "#0ea5e9",
  },
  {
    icon: Users,
    title: "Perfil de jogadores compatíveis",
    desc: "Conheça o tipo de jogador com posição, categoria e características parecidas com as suas e use como referência de evolução.",
    tile: "linear-gradient(135deg, #fef3c7, #fbbf24)",
    glow: "#fbbf24",
  },
  {
    icon: MessageCircle,
    title: "Resultado na hora, equipe ao lado",
    desc: "Perfil pronto em menos de 3 minutos e análise na tela, sem criar conta. A leitura completa chega pelo WhatsApp, com a nossa equipe.",
    tile: "linear-gradient(135deg, #86efac, #16a34a)",
    glow: "#22c55e",
  },
]

const ATHLETE_POINTS = [
  "Nota geral e 10 indicadores individuais gerados por IA.",
  "Clubes do Brasil e da Europa compatíveis com o seu perfil.",
  "A posição e a função em que o seu futebol mais rende.",
  "Pontos a melhorar antes da próxima peneira.",
  "Um relatório técnico que fala por você com clubes e empresários.",
]

const FAMILY_POINTS = [
  "Entenda, com dados, em que nível o seu filho está hoje.",
  "Pare de gastar com peneira, transporte e inscrição no escuro.",
  "Chegue aos clubes com um documento técnico na mão, não com um pedido de favor.",
  "Acompanhamento da equipe Zyron pelo WhatsApp em cada etapa.",
]

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserRound, title: "Monte seu perfil", desc: "Posição, categoria e características. Menos de 3 minutos." },
  { icon: Video, title: "Envie seus vídeos", desc: "Lances do seu jogo, direto do celular." },
  { icon: Sparkles, title: "Veja sua análise", desc: "Nota geral, 10 indicadores e oportunidades, sem criar conta." },
  { icon: Smartphone, title: "Receba no WhatsApp", desc: "Nossa equipe libera a leitura completa e os próximos passos." },
]

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="zs-checklist" data-anim-group="0.07">
      {items.map((item) => (
        <li key={item} className="zs-check">
          <span className="zs-check-icon" aria-hidden="true">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="zs-check-text">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null)

  const slide = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(".zs-testim-card")
    const step = card ? card.offsetWidth + 24 : 400
    track.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  return (
    <div data-anim="up">
      <div ref={trackRef} className="zs-testim-track" tabIndex={0} role="region" aria-label="Depoimentos — role para o lado">
        {TESTIMONIALS.map((t, i) => (
          <article key={i} className="zs-testim-card">
            <div>
              <div className="zs-quote" aria-hidden="true">&ldquo;</div>
              <p className="zs-testim-text">{t.text}</p>
            </div>
            <div className="flex items-center gap-4">
              {t.photo
                ? <img src={t.photo} alt="" className="h-12 w-12 rounded-full border-2 border-white/10 object-cover" />
                : <span className="zs-avatar-empty" aria-hidden="true"><User className="h-5 w-5" /></span>}
              <div className="flex flex-col gap-1">
                {t.name && <span className="text-[15px] font-semibold text-white">{t.name}</span>}
                <span className="text-[13px] text-white/50">{t.role}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-4">
        <button type="button" className="zs-round-btn" onClick={() => slide(-1)} aria-label="Depoimento anterior">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" className="zs-round-btn" onClick={() => slide(1)} aria-label="Próximo depoimento">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function SiteHome() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollTo } = useSmoothScroll(true)
  useScrollReveal(pageRef, [])
  const { search } = useLocation()
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const evaluation = { pathname: FUNNEL_ROUTES.profile, search }

  useEffect(() => {
    document.documentElement.classList.add("dark", "zyron-scroll-root")
    return () => document.documentElement.classList.remove("zyron-scroll-root")
  }, [])

  // Quase todo clique aqui termina no formulário: aquece o chunk dele.
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    const prefetch = () => { void import("@/pages/funnel/FunnelProfile") }
    if (ric) ric(prefetch)
    else window.setTimeout(prefetch, 1500)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  // O respiro abaixo da nav vem do scroll-margin-top das seções (site.css),
  // que tanto o Lenis quanto o scrollIntoView nativo respeitam.
  const goTo = (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault()
    setMenuOpen(false)
    scrollTo(hash)
  }

  const accountLink = session
    ? { to: "/dashboard", label: "Meu painel" }
    : { to: "/login", label: "Entrar" }

  return (
    <div ref={pageRef} className="zs dark">
      <div className="zs-ambient" aria-hidden="true">
        <div className="zs-grid" />
        <div className="zs-orb zs-orb--1" />
        <div className="zs-orb zs-orb--2" />
        <div className="zs-orb zs-orb--3" />
      </div>

      {/* ─── NAVEGAÇÃO ─── */}
      <header data-header-scrolled data-scrolled="false" className="zs-nav">
        <Link
          to="/"
          className="zs-nav-logo"
          aria-label="Zyron — voltar ao início"
          onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo(0) }}
        >
          <ZyronLogo size={32} />
        </Link>

        <nav className="zs-nav-links" aria-label="Seções da página">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => goTo(e, link.href)} className="zs-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="zs-nav-cta">
          <Link to={accountLink.to} className="zs-btn zs-btn--glass zs-btn--sm zs-nav-entrar">{accountLink.label}</Link>
          <Link to={evaluation} className="zs-btn zs-btn--primary zs-btn--sm" aria-label="Começar avaliação grátis">
            <span className="sm:hidden">Avaliar grátis</span>
            <span className="hidden sm:inline">Avaliação grátis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            className="zs-burger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="zs-mobile-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div id="zs-mobile-menu" className="zs-mobile-menu" data-lenis-prevent>
            <nav aria-label="Seções da página">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={(e) => goTo(e, link.href)} className="zs-nav-link">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="zs-mobile-menu-ctas">
              <Link to={accountLink.to} className="zs-btn zs-btn--glass">{accountLink.label}</Link>
              <Link to={evaluation} className="zs-btn zs-btn--primary">
                Começar minha avaliação <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="zs-main">
        {/* ─── HERO ─── */}
        <section id="inicio" className="zs-hero" aria-labelledby="zs-hero-title">
          <div data-hero-item className="zs-label">
            <span className="zs-label-dot" aria-hidden="true" />
            Avaliação grátis · sem cadastro
          </div>

          <h1 id="zs-hero-title" data-hero-item className="zs-hero-title">
            Descubra o nível real <br />
            <span className="zs-grad">do seu futebol com IA.</span>
          </h1>

          <p data-hero-item className="zs-hero-sub">
            Pare de esperar por uma oportunidade. A inteligência artificial da Zyron mostra quais clubes combinam com as
            suas características e onde o seu futebol pode ganhar espaço — no Brasil, na Europa e no mundo.
          </p>

          <div data-hero-item className="zs-hero-ctas">
            <Link to={evaluation} className="zs-btn zs-btn--primary zs-btn--lg">
              <span className="zs-btn-pulse" aria-hidden="true" />
              <span className="zs-btn-sheen" aria-hidden="true" />
              <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Começar minha avaliação</span>
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <a href={SPECIALIST_WHATSAPP} target="_blank" rel="noopener noreferrer" className="zs-btn zs-btn--glass zs-btn--lg">
              Fale com um especialista
            </a>
          </div>

          <div data-hero-item className="zs-hero-proof">
            <span><strong>3 minutos</strong> para montar o perfil</span>
            <span className="zs-hero-proof-sep" aria-hidden="true" />
            <span><strong>Resultado</strong> na hora</span>
            <span className="zs-hero-proof-sep" aria-hidden="true" />
            <span><strong>100% grátis</strong>, sem cartão</span>
          </div>

          <div data-hero-item className="zs-hero-mock">
            <div className="zs-hero-mock-tilt">
              <HeroPlatform />
            </div>
          </div>
        </section>

        {/* ─── CLUBES NO RADAR ─── */}
        <ClubMarquee />

        {/* ─── POR QUE A ZYRON ─── */}
        <section className="zs-why" aria-label="Por que a Zyron">
          <div className="zs-container">
            <div className="mb-10 flex justify-center" data-anim="up">
              <span className="zs-label">Por que a Zyron</span>
            </div>
            <HighlightText segments={WHY_TEXT} />
            <div className="zs-stats" data-anim-group="0.1">
              {STATS.map((stat) => {
                const Icon = STAT_ICONS[stat.icon]
                return (
                  <div key={stat.label} className="zs-glass zs-stat">
                    <div className="zs-stat-icon"><Icon className="h-7 w-7" aria-hidden="true" /></div>
                    <div className="zs-stat-value" data-count={stat.count} data-count-suffix={stat.suffix}>
                      {stat.count}{stat.suffix}
                    </div>
                    <div className="zs-stat-label">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <div className="zs-sep" aria-hidden="true" />

        {/* ─── RECURSOS ─── */}
        <section id="recursos" className="zs-features" aria-labelledby="zs-features-title">
          <div className="zs-container">
            <div className="zs-section-head" data-anim="up">
              <span className="zs-label">Recursos da Zyron</span>
              <h2 id="zs-features-title">
                Tudo o que um clube enxerga,<br />
                <span className="zs-grad">agora a seu favor.</span>
              </h2>
              <p>Uma avaliação com inteligência artificial pensada para mostrar o valor do seu futebol dentro e fora de campo.</p>
            </div>

            <div className="zs-features-grid" data-anim-group="0.08">
              {FEATURES.map(({ icon: Icon, title, desc, tile, glow }) => (
                <article key={title} className="zs-feature">
                  <div className="zs-feature-head">
                    <div className="zs-feature-icon-area" aria-hidden="true">
                      <div className="zs-feature-glow" style={{ background: glow }} />
                      <div className="zs-feature-icon" style={{ background: tile, boxShadow: `0 8px 32px ${glow}40` }}>
                        <Icon className="h-7 w-7 text-black/80" strokeWidth={2.2} />
                      </div>
                    </div>
                    <h3>{title}</h3>
                  </div>
                  <div className="zs-feature-body"><p>{desc}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PARA ATLETAS ─── */}
        <section id="atletas" className="zs-split" aria-labelledby="zs-athletes-title">
          <div className="zs-container">
            <div className="zs-split-grid">
              <div className="zs-split-copy" data-anim="up">
                <span className="zs-label zs-label--strong">Para atletas</span>
                <h2 id="zs-athletes-title">
                  Seja o talento<br />
                  <span className="zs-grad">que o clube procura.</span>
                </h2>
                <p>
                  Uma avaliação completa para quem cansou de depender da sorte em peneira: a IA revela o seu nível real,
                  a posição em que você mais rende e os clubes que combinam com o seu estilo.
                </p>
                <CheckList items={ATHLETE_POINTS} />
                <Link to={evaluation} className="zs-btn zs-btn--primary">
                  Começar minha avaliação <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <AthletePanel />
            </div>
          </div>
        </section>

        {/* ─── PARA FAMÍLIAS ─── */}
        <section id="familias" className="zs-split zs-split--alt" aria-labelledby="zs-families-title">
          <div className="zs-container">
            <div className="zs-split-grid">
              <FamilyPanel />
              <div className="zs-split-copy" data-anim="up">
                <span className="zs-label zs-label--strong">Para pais e responsáveis</span>
                <h2 id="zs-families-title">
                  Conecte seu filho<br />
                  <span className="zs-grad">ao clube certo.</span>
                </h2>
                <p>
                  Quem investe em transporte, inscrição e fim de semana de peneira merece saber, com dados, em que nível
                  o filho está — e para onde ele pode ir.
                </p>
                <CheckList items={FAMILY_POINTS} />
                <Link to={evaluation} className="zs-btn zs-btn--primary">
                  Avaliar meu filho grátis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DEPOIMENTOS ─── */}
        <section id="depoimentos" className="zs-testim" aria-labelledby="zs-testim-title">
          <div className="zs-container">
            <div className="zs-section-head" data-anim="up">
              <span className="zs-label zs-label--strong">Depoimentos</span>
              <h2 id="zs-testim-title">
                O que os clientes dizem<br />
                <span className="zs-grad">sobre a Zyron</span>
              </h2>
              <p>Atletas e famílias contam o que mudou quando o futebol deles passou a ser lido com dados.</p>
            </div>
            <Testimonials />
          </div>
        </section>

        {/* ─── CHAMADA FINAL: leva o lead para a avaliação ─── */}
        <section id="avaliacao" className="zs-final" aria-labelledby="zs-final-title">
          <div className="zs-final-ring zs-final-ring--1" aria-hidden="true" />
          <div className="zs-final-ring zs-final-ring--2" aria-hidden="true" />
          <div className="zs-final-ring zs-final-ring--3" aria-hidden="true" />

          <div className="zs-container zs-final-content" data-anim="up">
            <span className="zs-label zs-label--strong">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Avaliação grátis com IA
            </span>
            <h2 id="zs-final-title">
              Sua carreira<br />
              <span className="zs-grad">começa aqui.</span>
            </h2>
            <p className="m-0 max-w-[600px] text-[17px] leading-relaxed text-[color:var(--zs-muted)]">
              Monte seu perfil em menos de 3 minutos, envie seus vídeos e veja sua análise na hora — sem criar conta e
              100% grátis. Os detalhes chegam pelo WhatsApp, com a nossa equipe.
            </p>

            <div className="zs-final-card">
              <p className="mb-5 text-[15px] font-semibold text-white">Como funciona a sua avaliação</p>
              <ol className="zs-steps">
                {STEPS.map(({ icon: Icon, title, desc }, i) => (
                  <li key={title} className="zs-step">
                    <span className="zs-step-num" aria-hidden="true"><Icon className="h-[18px] w-[18px]" /></span>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{i + 1}. {title}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-white/55">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link to={evaluation} className="zs-btn zs-btn--primary zs-btn--lg w-full">
                <span className="zs-btn-pulse" aria-hidden="true" />
                <span className="zs-btn-sheen" aria-hidden="true" />
                <span>Começar minha avaliação grátis</span>
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
              <p className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-white/50">
                <span>Sem criar conta</span>
                <span>Sem cartão de crédito</span>
                <span>Leva 3 minutos</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ─── RODAPÉ ─── */}
      <footer className="zs-footer">
        <div className="zs-container">
          <div className="zs-footer-top">
            <div className="flex flex-col items-center gap-3 md:items-start">
              <ZyronLogo size={34} />
              <p className="m-0 text-[14px] text-white/50">Sua carreira começa aqui.</p>
            </div>
            <nav className="zs-footer-links" aria-label="Rodapé">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={(e) => goTo(e, link.href)} className="zs-footer-link">
                  {link.label}
                </a>
              ))}
              <Link to="/termos" className="zs-footer-link">Termos de Uso</Link>
              <Link to="/privacidade" className="zs-footer-link">Privacidade</Link>
            </nav>
            <a href={SPECIALIST_WHATSAPP} target="_blank" rel="noopener noreferrer" className="zs-wpp">
              <WhatsAppIcon className="h-[18px] w-[18px]" /> Fale por WhatsApp
            </a>
          </div>

          <div className="zs-footer-bottom">
            <p className="m-0">
              © 2026 Zyron. Todos os direitos reservados. |{" "}
              <Link to="/privacidade" className="text-white/60 hover:text-amber-300">Política de Privacidade</Link>
            </p>
            <div className="zs-footer-legal">
              <p>A Zyron é uma plataforma AI-Based de análise de performance esportiva. As avaliações, projeções, estimativas salariais e recomendações de clubes são geradas por modelos algorítmicos com base nas informações fornecidas pelo próprio atleta.</p>
              <p>A Zyron não representa, não garante contrato, aprovação, convocação, teste ou vínculo profissional com qualquer clube, federação ou entidade esportiva. Os escudos exibidos identificam clubes presentes na base usada pela análise e não indicam parceria, patrocínio ou vínculo com a Zyron.</p>
              <p>O desenvolvimento esportivo, evolução técnica, oportunidades e eventuais resultados dependem exclusivamente do desempenho, dedicação, condições individuais e decisões do próprio atleta.</p>
              <p>As análises possuem caráter informativo, educacional e de direcionamento estratégico, não constituindo promessa, intermediação oficial ou garantia de resultados.</p>
              <p>
                O uso da plataforma implica na concordância com os{" "}
                <Link to="/termos" className="underline underline-offset-2 hover:text-white/70">Termos de Uso</Link> e a{" "}
                <Link to="/privacidade" className="underline underline-offset-2 hover:text-white/70">Política de Privacidade</Link>.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
