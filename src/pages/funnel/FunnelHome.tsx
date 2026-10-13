import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import { useScrollReveal, useSmoothScroll } from "@/hooks/useScrollAnimations"
import { FUNNEL_ROUTES } from "@/lib/funnel"
import ClubMarquee from "@/pages/site/ClubMarquee"
import {
  CtaBand, FinalCtaSection, ManifestoSection, PrimaryCta, ProofLine, SiteAmbient, SiteFooter, SiteNav,
  StatsGrid, TestimonialsSection,
} from "@/pages/site/SiteChrome"
import FunnelLegalMenu from "./FunnelLegalMenu"
import FunnelTestimonialVideo from "./FunnelTestimonialVideo"

/**
 * Entrada do funil aberto (/avaliacao), que recebe o tráfego pago. Usa as
 * mesmas peças visuais da home institucional (SiteChrome.tsx), mas mantém
 * o desenho de página de conversão: vídeo de depoimento logo no topo, um
 * único destino (o formulário) e nenhuma saída — sem links de seção, sem
 * "Entrar" e sem WhatsApp antes do formulário. O menu de termos fica na nav
 * porque o funil coleta dados pessoais, inclusive de menores.
 */
export default function FunnelHome() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollTo } = useSmoothScroll(true)
  useScrollReveal(pageRef, [])

  // O funil é desenhado no tema escuro. Sem isso, quem cai direto em
  // /avaliacao (sem passar pelo dashboard) veria o <body> claro por trás
  // da página nas áreas de overscroll.
  useEffect(() => {
    document.documentElement.classList.add("dark", "zyron-scroll-root")
    return () => document.documentElement.classList.remove("zyron-scroll-root")
  }, [])

  const start = FUNNEL_ROUTES.profile

  return (
    <div ref={pageRef} className="zs dark">
      <SiteAmbient />

      <SiteNav ctaTo={start} extra={<FunnelLegalMenu />} onLogoClick={() => scrollTo(0)} />

      <main className="zs-main">
        {/* ─── HERO ─── */}
        <section id="inicio" className="zs-hero zs-hero--split" aria-labelledby="zs-hero-title">
          <div className="zs-hero-grid">
            <div className="zs-hero-head">
              <div data-hero-item className="zs-label">
                <span className="zs-label-dot" aria-hidden="true" />
                Avaliação grátis · sem cadastro
              </div>
              <h1 id="zs-hero-title" data-hero-item className="zs-hero-title">
                Descubra o nível real <br />
                <span className="zs-grad">do seu futebol com IA.</span>
              </h1>
            </div>

            {/* No celular o vídeo vem logo depois do título, antes do texto e
                do CTA; no desktop fica ao lado. Fora das animações de entrada
                de propósito, para não atrapalhar o carregamento do player. */}
            <div className="zs-hero-video">
              <div className="zs-video-frame">
                <FunnelTestimonialVideo />
              </div>
            </div>

            <div className="zs-hero-body">
              <p data-hero-item className="zs-hero-sub">
                Pare de esperar por uma oportunidade. Descubra agora quais times combinam com as suas características e
                onde o seu futebol pode ganhar espaço — no Brasil, na Europa e no mundo. Encontre os clubes certos para o
                seu perfil, com análise por IA e 100% grátis.
              </p>
              <div data-hero-item className="zs-hero-ctas">
                <PrimaryCta to={start}>
                  <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span>Começar minha avaliação</span>
                </PrimaryCta>
              </div>
              <div data-hero-item><ProofLine /></div>
            </div>
          </div>
        </section>

        {/* ─── CLUBES NO RADAR ─── */}
        <ClubMarquee />

        {/* ─── NÚMEROS ─── */}
        <section className="zs-stats-band" aria-label="A Zyron em números">
          <div className="zs-container">
            <StatsGrid />
          </div>
        </section>

        {/* ─── MANIFESTO ─── */}
        <ManifestoSection />

        {/* ─── CTA INTERMEDIÁRIO ─── */}
        <CtaBand to={start} />

        <TestimonialsSection />

        {/* ─── CHAMADA FINAL ─── */}
        <FinalCtaSection to={start} />
      </main>

      <SiteFooter showWhatsApp={false} />
    </div>
  )
}
