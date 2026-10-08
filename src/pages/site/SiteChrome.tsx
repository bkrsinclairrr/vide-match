import "@fontsource-variable/inter"
import "./site.css"

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react"
import { Link, type To } from "react-router-dom"
import {
  Activity, ArrowRight, BarChart3, ChevronLeft, ChevronRight, Clock, Gift, Globe2, Menu, Shield,
  Smartphone, Sparkles, User, UserRound, Video, X, type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronLogo } from "./ZyronMark"
import { SPECIALIST_WHATSAPP, STATS, TESTIMONIALS } from "./siteData"

/**
 * Peças visuais compartilhadas entre a home institucional (/) e as
 * entradas do funil (/avaliacao e o clone /jogador), para as páginas
 * continuarem com a mesma cara quando uma delas mudar.
 */

export type SectionLink = { href: string; label: string }
type NavigateHandler = (e: MouseEvent<HTMLAnchorElement>, href: string) => void

export function SiteAmbient() {
  return (
    <div className="zs-ambient" aria-hidden="true">
      <div className="zs-grid" />
      <div className="zs-orb zs-orb--1" />
      <div className="zs-orb zs-orb--2" />
      <div className="zs-orb zs-orb--3" />
    </div>
  )
}

/**
 * Nav de vidro. Sem `links` não há menu de seções nem botão sanduíche
 * (caso do funil, que não deve oferecer saídas); `extra` entra antes do
 * CTA (o menu de termos e privacidade do funil).
 */
export function SiteNav({
  ctaTo, links = [], onNavigate, onLogoClick, showAccount = false, extra,
}: {
  ctaTo: To
  links?: SectionLink[]
  onNavigate?: NavigateHandler
  onLogoClick?: () => void
  showAccount?: boolean
  extra?: ReactNode
}) {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMenu = links.length > 0
  const account = session ? { to: "/dashboard", label: "Meu painel" } : { to: "/login", label: "Entrar" }

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  const follow = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false)
    onNavigate?.(e, href)
  }

  return (
    <header data-header-scrolled data-scrolled="false" className="zs-nav">
      {onLogoClick ? (
        <a
          href="#inicio"
          className="zs-nav-logo"
          aria-label="Zyron — voltar ao início"
          onClick={(e) => { e.preventDefault(); setMenuOpen(false); onLogoClick() }}
        >
          <ZyronLogo size={32} />
        </a>
      ) : (
        <span className="zs-nav-logo"><ZyronLogo size={32} /></span>
      )}

      {hasMenu && (
        <nav className="zs-nav-links" aria-label="Seções da página">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => follow(e, link.href)} className="zs-nav-link">
              {link.label}
            </a>
          ))}
        </nav>
      )}

      <div className="zs-nav-cta">
        {showAccount && (
          <Link to={account.to} className="zs-btn zs-btn--glass zs-btn--sm zs-nav-entrar">{account.label}</Link>
        )}
        {extra}
        <Link to={ctaTo} className="zs-btn zs-btn--primary zs-btn--sm" aria-label="Começar avaliação grátis">
          <span className="sm:hidden">Avaliar grátis</span>
          <span className="hidden sm:inline">Avaliação grátis</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {hasMenu && (
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
        )}
      </div>

      {hasMenu && menuOpen && (
        <div id="zs-mobile-menu" className="zs-mobile-menu" data-lenis-prevent>
          <nav aria-label="Seções da página">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => follow(e, link.href)} className="zs-nav-link">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="zs-mobile-menu-ctas">
            {showAccount && <Link to={account.to} className="zs-btn zs-btn--glass">{account.label}</Link>}
            <Link to={ctaTo} className="zs-btn zs-btn--primary">
              Começar minha avaliação <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

const STAT_ICONS: Record<(typeof STATS)[number]["icon"], LucideIcon> = {
  chart: BarChart3,
  shield: Shield,
  clock: Clock,
  gift: Gift,
}

/** Os quatro números da Zyron, contando ao entrar na tela (data-count). */
export function StatsGrid() {
  return (
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
  )
}

/** Seção de depoimentos (carrossel com setas); conteúdo em siteData.ts. */
export function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null)

  const slide = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(".zs-testim-card")
    const step = card ? card.offsetWidth + 24 : 400
    track.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  return (
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
      </div>
    </section>
  )
}

/** CTA grande com brilho e anel pulsando, o mesmo do hero. */
export function PrimaryCta({ to, children, className = "" }: { to: To; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`zs-btn zs-btn--primary zs-btn--lg ${className}`}>
      <span className="zs-btn-pulse" aria-hidden="true" />
      <span className="zs-btn-sheen" aria-hidden="true" />
      {children}
      <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
    </Link>
  )
}

/** "3 minutos · resultado na hora · grátis", logo abaixo do CTA. */
export function ProofLine({ className = "" }: { className?: string }) {
  return (
    <div className={`zs-hero-proof ${className}`}>
      <span><strong>3 minutos</strong> para montar o perfil</span>
      <span className="zs-hero-proof-sep" aria-hidden="true" />
      <span><strong>Resultado</strong> na hora</span>
      <span className="zs-hero-proof-sep" aria-hidden="true" />
      <span><strong>100% grátis</strong>, sem cartão</span>
    </div>
  )
}

const MANIFESTO_POINTS: { icon: LucideIcon; title: string; desc: string; tile: string; glow: string }[] = [
  { icon: BarChart3, title: "10 indicadores individuais", desc: "Sem fadiga, sem preferências — só dados.", tile: "linear-gradient(135deg, #fcd34d, #f59e0b)", glow: "#f59e0b" },
  { icon: Activity, title: "Resultado em minutos", desc: "O que um olheiro demora semanas para ver.", tile: "linear-gradient(135deg, #6ee7b7, #10b981)", glow: "#10b981" },
  { icon: Globe2, title: "Direcionamento real", desc: "Onde o seu perfil rende mais dentro de campo.", tile: "linear-gradient(135deg, #7dd3fc, #0284c7)", glow: "#0ea5e9" },
]

/** Manifesto da entrada do funil: por que avaliar com dados, na voz da Zyron. */
export function ManifestoSection() {
  return (
    <section className="zs-manifesto" aria-labelledby="zs-manifesto-title">
      <div className="zs-container">
        <div className="zs-section-head" data-anim="up">
          <span className="zs-label">O futebol mudou. A avaliação também.</span>
          <h2 id="zs-manifesto-title">
            Os maiores clubes da Europa<br />
            <span className="zs-grad">já não contratam pelo olhar.</span>
          </h2>
        </div>

        <div className="zs-manifesto-copy" data-anim-group="0.12">
          <p>
            <strong>Brighton, Ajax, Bayer Leverkusen, Benfica.</strong> Clubes que estão no topo do futebol mundial hoje
            têm uma coisa em comum: eles encontram talentos que nenhum olheiro tradicional teria notado. E fazem isso
            através de dados, modelos preditivos e análise com IA.
          </p>
          <p>
            O problema é que essa tecnologia nunca esteve acessível para o atleta brasileiro que está no começo da
            carreira — aquele que vai bem num jogo, mas nunca tem quem analise e apresente seu desempenho de forma
            profissional.
          </p>
          <p>
            <strong>A Zyron encerra essa desigualdade.</strong> Você responde o perfil e a nossa análise organiza as
            suas características em pontos a melhorar, oportunidades e perfis de jogadores compatíveis.
          </p>
        </div>

        <div className="zs-features-grid" data-anim-group="0.08">
          {MANIFESTO_POINTS.map(({ icon: Icon, title, desc, tile, glow }) => (
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
  )
}

/** Faixa de CTA no meio da página do funil. */
export function CtaBand({ to }: { to: To }) {
  return (
    <section className="zs-cta-band" aria-label="Começar a avaliação" data-anim="scale">
      <p className="zs-cta-band-kicker">Comece sem cadastro. Leva 3 minutos.</p>
      <PrimaryCta to={to}>
        <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Fazer minha avaliação</span>
      </PrimaryCta>
      <p className="m-0 text-[12px] text-white/50">Processo rápido. Resultado permanente.</p>
    </section>
  )
}

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: UserRound, title: "Monte seu perfil", desc: "Posição, categoria e características. Menos de 3 minutos." },
  { icon: Video, title: "Envie seus vídeos", desc: "Lances do seu jogo, direto do celular." },
  { icon: Sparkles, title: "Veja sua análise", desc: "Nota geral, 10 indicadores e oportunidades, sem criar conta." },
  { icon: Smartphone, title: "Receba no WhatsApp", desc: "Nossa equipe libera a leitura completa e os próximos passos." },
]

/** Chamada final: leva o lead para o formulário da avaliação. */
export function FinalCtaSection({ to }: { to: To }) {
  return (
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
          <PrimaryCta to={to} className="w-full">
            <span>Começar minha avaliação grátis</span>
          </PrimaryCta>
          <p className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[12px] text-white/50">
            <span>Sem criar conta</span>
            <span>Sem cartão de crédito</span>
            <span>Leva 3 minutos</span>
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Rodapé com o aviso legal. No funil ele sai sem links de seção e sem o
 * WhatsApp, para não abrir saídas antes do formulário.
 */
export function SiteFooter({
  links = [], onNavigate, showWhatsApp = true,
}: {
  links?: SectionLink[]
  onNavigate?: NavigateHandler
  showWhatsApp?: boolean
}) {
  return (
    <footer className="zs-footer">
      <div className="zs-container">
        <div className="zs-footer-top">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <ZyronLogo size={34} />
            <p className="m-0 text-[14px] text-white/50">Sua carreira começa aqui.</p>
          </div>
          <nav className="zs-footer-links" aria-label="Rodapé">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => onNavigate?.(e, link.href)} className="zs-footer-link">
                {link.label}
              </a>
            ))}
            <Link to="/termos" className="zs-footer-link">Termos de Uso</Link>
            <Link to="/privacidade" className="zs-footer-link">Privacidade</Link>
          </nav>
          {showWhatsApp && (
            <a href={SPECIALIST_WHATSAPP} target="_blank" rel="noopener noreferrer" className="zs-wpp">
              <WhatsAppIcon className="h-[18px] w-[18px]" /> Fale por WhatsApp
            </a>
          )}
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
  )
}
