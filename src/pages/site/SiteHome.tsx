import { useEffect, useRef, type MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ArrowRight, BarChart3, Check, Cpu, MessageCircle, Shield, Sparkles, Target, Users,
  type LucideIcon,
} from "lucide-react"
import { useScrollReveal, useSmoothScroll } from "@/hooks/useScrollAnimations"
import { FUNNEL_ROUTES } from "@/lib/funnel"
import HeroPlatform from "./HeroPlatform"
import ClubMarquee from "./ClubMarquee"
import HighlightText from "./HighlightText"
import { AthletePanel, FamilyPanel } from "./SitePanels"
import {
  FinalCtaSection, PrimaryCta, ProofLine, SiteAmbient, SiteFooter, SiteNav, StatsGrid,
  TestimonialsSection, type SectionLink,
} from "./SiteChrome"
import { SPECIALIST_WHATSAPP } from "./siteData"

/**
 * Home institucional (/). Mesma estrutura de UI/UX do footlink.app (nav
 * de vidro, hero com print da plataforma, faixa de escudos, texto que
 * acende no scroll, recursos, seções por público, depoimentos e chamada
 * final), com a paleta, a marca e a proposta da Zyron: IA. Todo CTA leva
 * ao mesmo lugar que o botão "Começar minha avaliação" da /avaliacao — o
 * formulário do funil — repassando a query string para não perder UTMs.
 * As peças em comum com a /avaliacao ficam em SiteChrome.tsx.
 */

const NAV_LINKS: SectionLink[] = [
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

export default function SiteHome() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollTo } = useSmoothScroll(true)
  useScrollReveal(pageRef, [])
  const { search } = useLocation()

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

  // O respiro abaixo da nav vem do scroll-margin-top das seções (site.css),
  // que tanto o Lenis quanto o scrollIntoView nativo respeitam.
  const goTo = (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault()
    scrollTo(hash)
  }

  return (
    <div ref={pageRef} className="zs dark">
      <SiteAmbient />

      <SiteNav ctaTo={evaluation} links={NAV_LINKS} onNavigate={goTo} onLogoClick={() => scrollTo(0)} showAccount />

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
            <PrimaryCta to={evaluation}>
              <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Começar minha avaliação</span>
            </PrimaryCta>
            <a href={SPECIALIST_WHATSAPP} target="_blank" rel="noopener noreferrer" className="zs-btn zs-btn--glass zs-btn--lg">
              Fale com um especialista
            </a>
          </div>

          <div data-hero-item><ProofLine /></div>

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
            <StatsGrid />
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

        <TestimonialsSection />

        {/* ─── CHAMADA FINAL: leva o lead para a avaliação ─── */}
        <FinalCtaSection to={evaluation} />
      </main>

      <SiteFooter links={NAV_LINKS} onNavigate={goTo} />
    </div>
  )
}
