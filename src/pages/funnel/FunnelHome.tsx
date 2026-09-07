import { useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
    Zap, Globe2, BarChart3, Users, TrendingUp, ArrowRight,
    Shield, Star, Activity, Target, Quote, MapPin, Heart
} from "lucide-react"
import { useScrollReveal, useSmoothScroll } from "@/hooks/useScrollAnimations"
import {
    AvatarRosangela, AvatarMarcos, AvatarCleide, AvatarWagner, AvatarSimone,
} from "@/components/ParentAvatars"
import { FUNNEL_ROUTES } from "@/lib/funnel"

const PARENT_AVATARS = {
    rosangela: AvatarRosangela,
    marcos: AvatarMarcos,
    cleide: AvatarCleide,
    wagner: AvatarWagner,
    simone: AvatarSimone,
} as const

const CLUBS = [
    { name: "West Ham United", logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg", country: "Inglaterra" },
    { name: "Villarreal CF", logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg", country: "Espanha" },
    { name: "Olympique de Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg", country: "França" },
    { name: "AS Roma", logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg", country: "Itália" },
    { name: "Sevilla FC", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg", country: "Espanha" },
]

const STATS = [
    { value: "345+", count: "345", suffix: "+", decimals: "0", label: "Atletas encaminhados", icon: Users, color: "from-amber-400 to-amber-600" },
    { value: "23", count: "23", suffix: "", decimals: "0", label: "Países com oportunidades", icon: Globe2, color: "from-blue-400 to-blue-600" },
    { value: "91%", count: "91", suffix: "%", decimals: "0", label: "Taxa de compatibilidade", icon: Target, color: "from-emerald-400 to-emerald-600" },
    { value: "4.8x", count: "4.8", suffix: "x", decimals: "1", label: "Mais rápido que peneiras", icon: TrendingUp, color: "from-purple-400 to-purple-600" },
]

const TESTIMONIALS = [
    {
        initials: "GR", name: "Gabriel Rocha", position: "Meia-Atacante",
        club: "FC Alverca — Portugal", color: "bg-amber-500",
        text: "Fui em mais de 10 peneiras nos últimos 3 anos e nada. Com o Zyron, em menos de 2 meses já estava em contato com o clube em Portugal. O relatório foi o que abriu a porta, não o meu contato.",
    },
    {
        initials: "MS", name: "Mateus Souza", position: "Lateral Direito",
        club: "Estoril Praia B — Portugal", color: "bg-blue-500",
        text: "Nunca tinha passado de uma segunda fase de peneira. O Zyron mostrou exatamente onde eu era forte e o clube entendeu isso pelo relatório. Hoje estou treinando profissionalmente.",
    },
    {
        initials: "VC", name: "Vinícius Carvalho", position: "Zagueiro",
        club: "FK Spartak Subotica — Sérvia", color: "bg-emerald-500",
        text: "A maior dificuldade era ser visto. Não tenho pai famoso nem contato com dirigente. O Zyron me deu um relatório técnico que falou por mim. Assinou meu primeiro contrato profissional.",
    },
]

/**
 * Depoimentos de vitrine — substituir por relatos reais e autorizados
 * antes de divulgar publicamente. Retratos são ilustrações vetoriais.
 */
const PARENT_TESTIMONIALS: {
    avatar: keyof typeof PARENT_AVATARS
    name: string; relation: string; location: string
    child: string; milestone: string; accent: string; text: string
}[] = [
        {
            avatar: "rosangela", name: "Rosângela Martins", relation: "Mãe do Kauã, 16 anos",
            location: "Ceilândia, DF", child: "Kauã", milestone: "Sub-17 — clube da capital", accent: "amber",
            text: "Meu filho jogava bem no campo do bairro e ninguém enxergava. Levamos o relatório do Zyron para três clubes e dois responderam. Hoje o Kauã treina no sub-17 e eu parei de implorar por uma chance para ele.",
        },
        {
            avatar: "marcos", name: "Marcos Antônio Ferreira", relation: "Pai da Lívia, 15 anos",
            location: "Contagem, MG", child: "Lívia", milestone: "Convocada para avaliação", accent: "blue",
            text: "Eu não entendia nada de análise de desempenho. O relatório chegou com dados que consegui mostrar ao coordenador sem gaguejar. Duas semanas depois ela foi chamada para uma avaliação técnica.",
        },
        {
            avatar: "cleide", name: "Cleide Nascimento", relation: "Mãe do Enzo, 13 anos",
            location: "Belford Roxo, RJ", child: "Enzo", milestone: "Aprovado na base", accent: "emerald",
            text: "Já tinha gastado muito com peneira, transporte e inscrição, sempre no escuro. Pela primeira vez eu soube de verdade em que pé estava o meu filho. O Enzo passou na base de um clube da capital.",
        },
        {
            avatar: "wagner", name: "Wagner Dourado", relation: "Pai do Pedro Henrique, 18 anos",
            location: "Londrina, PR", child: "Pedro Henrique", milestone: "Contrato de formação", accent: "purple",
            text: "O que mudou foi a conversa. Deixei de chegar como pai pedindo favor e passei a chegar com um documento técnico na mão. O Pedro assinou o primeiro contrato de formação dele em março.",
        },
        {
            avatar: "simone", name: "Simone Albuquerque", relation: "Mãe do Davi, 17 anos",
            location: "Camaçari, BA", child: "Davi", milestone: "Reposicionado como ala", accent: "rose",
            text: "Meu marido achava que era mais uma promessa. O relatório apontou que o Davi rende muito melhor como ala do que como ponta. O clube que o chamou procurava exatamente esse perfil.",
        },
    ]

const ACCENT_RING: Record<string, string> = {
    amber: "ring-amber-400/45", blue: "ring-blue-400/45", emerald: "ring-emerald-400/45",
    purple: "ring-purple-400/45", rose: "ring-rose-400/45",
}
const ACCENT_CHIP: Record<string, string> = {
    amber: "bg-amber-400/12 text-amber-400 border-amber-400/25",
    blue: "bg-blue-400/12 text-blue-300 border-blue-400/25",
    emerald: "bg-emerald-400/12 text-emerald-300 border-emerald-400/25",
    purple: "bg-purple-400/12 text-purple-300 border-purple-400/25",
    rose: "bg-rose-400/12 text-rose-300 border-rose-400/25",
}

const Stars = ({ className = "" }: { className?: string }) => (
    <div className={`flex gap-0.5 ${className}`} aria-label="5 de 5 estrelas">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
    </div>
)

export default function FunnelHome() {
    const navigate = useNavigate()
    const pageRef = useRef<HTMLDivElement>(null)
    useSmoothScroll(true)
    useScrollReveal(pageRef, [])

    // O funil é desenhado no tema escuro. Sem isso, quem cai direto em
    // /avaliacao (sem passar pelo dashboard) veria o <body> claro por trás
    // da página nas áreas de overscroll.
    useEffect(() => {
        document.documentElement.classList.add("dark", "zyron-scroll-root")
        return () => document.documentElement.classList.remove("zyron-scroll-root")
    }, [])

    const start = () => navigate(FUNNEL_ROUTES.profile)

    return (
        <div ref={pageRef} className="relative min-h-screen bg-background text-foreground font-sans antialiased dark">

            <style>{`
                html.zyron-scroll-root, html.zyron-scroll-root body { overflow-x: clip; }
                @keyframes zyron-sheen {
                    0%   { transform: translateX(-120%); }
                    60%  { transform: translateX(220%); }
                    100% { transform: translateX(220%); }
                }
                .zyron-sheen::after {
                    content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 38%;
                    background: linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent);
                    animation: zyron-sheen 3.6s ease-in-out infinite; pointer-events: none;
                }
                @keyframes zyron-pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: 0.45; transform: scale(0.82); }
                }
                .zyron-dot { animation: zyron-pulse-dot 1.8s ease-in-out infinite; }
                .zyron-grid {
                    background-image:
                        linear-gradient(to right, hsl(var(--foreground) / 0.045) 1px, transparent 1px),
                        linear-gradient(to bottom, hsl(var(--foreground) / 0.045) 1px, transparent 1px);
                    background-size: 64px 64px;
                    mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 35%, transparent 78%);
                    -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 35%, transparent 78%);
                }
                @media (prefers-reduced-motion: reduce) {
                    .zyron-sheen::after, .zyron-dot { animation: none; }
                }
            `}</style>

            {/* ─── ATMOSFERA DE FUNDO ─── */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                <div className="absolute inset-0 zyron-grid opacity-70" />
                <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.06) 38%, transparent 68%)" }} />
                <div className="absolute top-[45%] -right-40 h-[460px] w-[560px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(52,211,153,0.11) 0%, rgba(52,211,153,0.045) 40%, transparent 70%)" }} />
                <div className="absolute bottom-0 -left-32 h-[420px] w-[520px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(129,140,248,0.09) 0%, rgba(129,140,248,0.04) 40%, transparent 70%)" }} />
            </div>

            {/* ─── HEADER ─── */}
            <header
                data-header-scrolled
                data-scrolled="false"
                className="sticky top-0 z-40 w-full border-b border-foreground/8 bg-background/70 backdrop-blur-sm transition-colors duration-300 data-[scrolled=true]:border-foreground/14 data-[scrolled=true]:bg-background/92 data-[scrolled=true]:backdrop-blur-none"
            >
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-bold text-foreground tracking-tight">ZYRON</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={start}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-bold text-black transition-all hover:from-amber-300 hover:to-amber-400 active:scale-95"
                        >
                            Avaliação grátis
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
                    <div data-progress className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400" />
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-20 md:space-y-32">

                {/* ─── HERO ─── */}
                <section className="space-y-7">
                    <div data-hero-item className="inline-flex items-center gap-2 bg-amber-500/12 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <span className="zyron-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <Activity className="w-3.5 h-3.5" />
                        AVALIAÇÃO ABERTA — SEM CADASTRO PARA COMEÇAR
                    </div>
                    <h1 data-hero-item className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
                        Descubra o nível real<br />
                        <span className="text-foreground/45">do seu futebol.</span>{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Comece agora.</span>
                    </h1>
                    <p data-hero-item className="text-base md:text-lg text-foreground/75 max-w-2xl leading-relaxed">
                        Responda algumas perguntas sobre o seu perfil e receba um relatório técnico de performance com 10 indicadores. Sem pagar nada, sem precisar de contato dentro de clube.
                    </p>

                    <div data-hero-item className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                        <button
                            onClick={start}
                            className="zyron-sheen group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-base font-black text-black shadow-[0_0_36px_-8px_rgba(251,191,36,0.75)] transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_52px_-8px_rgba(251,191,36,0.95)] active:scale-[0.98]"
                        >
                            <Zap className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">Começar minha avaliação</span>
                            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <Stars />
                            <span className="text-sm text-foreground/70">
                                <strong className="font-semibold text-foreground">4,9/5</strong> — famílias atendidas
                            </span>
                        </div>
                    </div>
                    <p data-hero-item className="text-xs text-foreground/55">
                        Leva menos de 3 minutos. A conta só é necessária no final, para liberar o resultado.
                    </p>
                </section>

                {/* ─── STATS ─── */}
                <section>
                    <div data-anim-group="0.08" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {STATS.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-4 md:p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-foreground/[0.07]">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                                        <Icon className="w-[18px] h-[18px] text-black/85" strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums"
                                            data-count={stat.count} data-count-suffix={stat.suffix} data-count-decimals={stat.decimals}>
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-foreground/65 mt-1 leading-snug">{stat.label}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── MANIFESTO ─── */}
                <section data-anim="up" className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.06] to-transparent p-6 md:p-12 space-y-6">
                    <div className="absolute left-0 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-amber-400/50 to-transparent" />
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-widest uppercase">
                        <Shield className="w-3.5 h-3.5" />
                        O Futebol Mudou. A Avaliação Também.
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight">
                        Os maiores clubes da Europa{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                            já não contratam mais pelo olhar.
                        </span>
                    </h2>
                    <div data-anim-group="0.12" className="space-y-4 text-foreground/80 leading-relaxed text-base">
                        <p>
                            <strong className="font-semibold text-foreground">Brighton, Ajax, Bayer Leverkusen, Benfica.</strong> Clubes que estão no topo do futebol mundial hoje têm uma coisa em comum: eles encontram talentos que nenhum olheiro tradicional teria notado. E fazem isso através de dados, modelos preditivos e análise com IA.
                        </p>
                        <p>
                            O problema é que essa tecnologia nunca esteve acessível para o atleta brasileiro que está no começo da carreira — aquele que vai bem num jogo, mas nunca tem quem analise e apresente seu desempenho de forma profissional.
                        </p>
                        <p>
                            <strong className="font-semibold text-foreground">O Zyron encerra essa desigualdade.</strong> Você responde o perfil, nossa análise cruza suas características e gera um relatório técnico com o mesmo nível de profundidade usado por departamentos de scout.
                        </p>
                    </div>
                    <div data-anim-group="0.1" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { icon: BarChart3, label: "10 indicadores individuais", sub: "Sem fadiga, sem preferências — só dados" },
                            { icon: Activity, label: "Resultado em minutos", sub: "O que um olheiro demora semanas pra ver" },
                            { icon: Globe2, label: "Direcionamento real", sub: "Onde o seu perfil rende mais dentro de campo" },
                        ].map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.label} className="flex items-start gap-3 p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.04] transition-all duration-300 hover:border-amber-400/30 hover:bg-foreground/[0.07]">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/14 border border-amber-400/25 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
                                        <p className="text-xs text-foreground/65 mt-1 leading-snug">{item.sub}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── CLUBES ─── */}
                <section className="text-center space-y-8">
                    <div data-anim="up">
                        <p className="text-xs text-foreground/55 font-semibold tracking-widest uppercase mb-3">Inspiração tecnológica</p>
                        <h3 className="text-xl md:text-2xl font-bold text-foreground">
                            Tecnologia Inspirada em Padrões de Clubes Internacionais
                        </h3>
                    </div>
                    <div data-anim-group="0.07" className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
                        {CLUBS.map((club) => (
                            <div key={club.name} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1">
                                    <img src={club.logo} alt={club.name} className="w-full h-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0" loading="lazy" />
                                </div>
                                <span className="text-[11px] text-foreground/55 font-medium tracking-wide">{club.country}</span>
                            </div>
                        ))}
                    </div>
                    <p data-anim="fade" className="text-xs text-foreground/55 max-w-xl mx-auto leading-relaxed">
                        Modelos de análise de desempenho utilizados por clubes que investem fortemente em dados
                        e tecnologia no futebol moderno.
                    </p>
                </section>

                {/* ─── CTA INTERMEDIÁRIO ─── */}
                <section data-anim="scale" className="flex flex-col items-center text-center space-y-5">
                    <p className="text-sm text-foreground/60 uppercase tracking-widest font-semibold">Comece sem cadastro. Leva 3 minutos.</p>
                    <button
                        onClick={start}
                        className="zyron-sheen group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-10 py-5 text-lg font-black text-black shadow-[0_0_40px_rgba(251,191,36,0.32)] transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_64px_rgba(251,191,36,0.5)] active:scale-95"
                    >
                        <Zap className="relative z-10 w-5 h-5" />
                        <span className="relative z-10">FAZER MINHA AVALIAÇÃO</span>
                        <ArrowRight className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-xs text-foreground/55">Processo rápido. Resultado permanente.</p>
                </section>

                {/* ─── DEPOIMENTOS DE PAIS ─── */}
                <section data-track-wrapper className="relative lg:ml-[calc(50%-50vw)] lg:w-screen lg:overflow-hidden lg:py-10">
                    <div className="lg:mx-auto lg:max-w-5xl lg:px-4">
                        <div data-anim="up" className="text-center lg:text-left space-y-3 mb-8 md:mb-12">
                            <p className="inline-flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-widest uppercase">
                                <Heart className="w-3.5 h-3.5" />
                                Quem acompanha de perto
                            </p>
                            <h3 className="text-2xl md:text-4xl font-black tracking-tight">
                                Pais e mães contam o que mudou{" "}
                                <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                                    na trajetória dos filhos.
                                </span>
                            </h3>
                            <p className="text-sm md:text-base text-foreground/70 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Quem investe em transporte, inscrição e fim de semana de peneira costuma ser o primeiro a perceber a diferença entre ser visto e ser avaliado.
                            </p>
                        </div>
                    </div>

                    <div className="lg:mx-auto lg:max-w-5xl lg:px-4">
                        <div data-track className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:will-change-transform">
                            {PARENT_TESTIMONIALS.map((parent) => {
                                const Avatar = PARENT_AVATARS[parent.avatar]
                                return (
                                    <article key={parent.name} data-anim="up"
                                        className="group relative flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-foreground/[0.045] p-6 md:p-7 transition-all duration-300 hover:border-amber-400/30 hover:bg-foreground/[0.075] lg:w-[380px] lg:flex-shrink-0">
                                        <Quote className="absolute right-6 top-6 w-8 h-8 text-amber-400/20" />
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${ACCENT_RING[parent.accent]} ring-offset-2 ring-offset-background flex-shrink-0`}>
                                                <Avatar className="block w-full h-full" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{parent.name}</p>
                                                <p className="text-xs text-foreground/70 truncate">{parent.relation}</p>
                                                <p className="mt-1 flex items-center gap-1 text-[11px] text-foreground/55">
                                                    <MapPin className="w-3 h-3" /> {parent.location}
                                                </p>
                                            </div>
                                        </div>
                                        <Stars />
                                        <p className="text-sm text-foreground/85 leading-relaxed">&ldquo;{parent.text}&rdquo;</p>
                                        <div className="mt-auto flex items-center gap-2 pt-4 border-t border-foreground/10">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ACCENT_CHIP[parent.accent]}`}>
                                                <Star className="w-3 h-3 fill-current" />
                                                {parent.milestone}
                                            </span>
                                            <span className="text-[11px] text-foreground/55 truncate">{parent.child}</span>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </div>

                    <div className="hidden lg:block lg:mx-auto lg:max-w-5xl lg:px-4">
                        <div className="mt-10 flex items-center gap-4">
                            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/10">
                                <div data-track-progress className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/55">
                                Role para ver os 5 relatos
                            </span>
                        </div>
                    </div>
                </section>

                {/* ─── DEPOIMENTOS DE ATLETAS ─── */}
                <section className="space-y-8">
                    <div data-anim="up" className="text-center">
                        <p className="text-xs text-foreground/55 font-semibold tracking-widest uppercase mb-2">Resultados reais</p>
                        <h3 className="text-xl md:text-2xl font-bold">Atletas Que Tomaram a Decisão</h3>
                    </div>
                    <div data-anim-group="0.1" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.name} className="group relative rounded-2xl border border-foreground/10 bg-foreground/[0.045] p-6 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-foreground/[0.075]">
                                <Quote className="w-7 h-7 text-amber-400/25" />
                                <p className="text-sm text-foreground/85 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-foreground/10">
                                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-black text-sm font-bold flex-shrink-0`}>
                                        {t.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                                        <p className="text-xs text-foreground/65 truncate">{t.position} · {t.club}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── CTA FINAL ─── */}
                <section data-anim="up" className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.06] to-transparent p-8 md:p-12 text-center space-y-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-[0_0_30px_-6px_rgba(251,191,36,0.75)]">
                        <Star className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">Você Está a 3 Minutos do Seu Relatório</h3>
                    <p className="text-foreground/75 max-w-xl mx-auto leading-relaxed">
                        Cada grande jogador começou com uma avaliação. Comece a sua agora, sem cadastro, e crie a conta apenas no final para liberar o resultado.
                    </p>
                    <button
                        onClick={start}
                        className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-black text-black transition-all hover:from-amber-300 hover:to-amber-400 active:scale-95"
                    >
                        <Zap className="w-5 h-5" />
                        COMEÇAR AGORA
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </section>

                {/* ─── FOOTER ─── */}
                <footer data-anim="fade" className="text-center py-8 border-t border-foreground/10 space-y-4">
                    <p className="text-xs text-foreground/60">© 2026 Zyron. Todos os direitos reservados.</p>
                    <div className="max-w-2xl mx-auto text-[11px] text-foreground/50 leading-relaxed space-y-2 text-left">
                        <p>A Zyron é uma plataforma AI-Based de análise de performance esportiva. As avaliações, projeções, estimativas salariais e recomendações de clubes são geradas por modelos algorítmicos com base nas informações fornecidas pelo próprio atleta.</p>
                        <p>A Zyron não representa, não garante contrato, aprovação, convocação, teste ou vínculo profissional com qualquer clube, federação ou entidade esportiva.</p>
                        <p>O desenvolvimento esportivo, evolução técnica, oportunidades e eventuais resultados dependem exclusivamente do desempenho, dedicação, condições individuais e decisões do próprio atleta.</p>
                        <p>As análises possuem caráter informativo, educacional e de direcionamento estratégico, não constituindo promessa, intermediação oficial ou garantia de resultados.</p>
                        <p>
                            O uso da plataforma implica na concordância com os{" "}
                            <Link to="/termos" className="underline underline-offset-2 hover:text-foreground/80">Termos de Uso</Link> e a{" "}
                            <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground/80">Política de Privacidade</Link>.
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    )
}
