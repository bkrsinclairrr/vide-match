import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Settings, LogOut, Lock, User, ChevronDown,
    Zap, Globe2, BarChart3, Users, TrendingUp, ArrowRight,
    Shield, Star, Activity, Target, Bell, HelpCircle,
    FileText, Moon, X, Quote, MapPin, Heart
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useIsAdmin } from "@/hooks/useAdmin"
import { useScrollReveal, useSmoothScroll } from "@/hooks/useScrollAnimations"
import {
    AvatarRosangela, AvatarMarcos, AvatarCleide, AvatarWagner, AvatarSimone,
} from "@/components/ParentAvatars"

// Retratos ilustrados dos depoimentos (nenhuma foto de pessoa real)
const PARENT_AVATARS = {
    rosangela: AvatarRosangela,
    marcos: AvatarMarcos,
    cleide: AvatarCleide,
    wagner: AvatarWagner,
    simone: AvatarSimone,
} as const

type ParentAvatarKey = keyof typeof PARENT_AVATARS

// Official club logos via Wikimedia Commons
const CLUBS = [
    {
        name: "West Ham United",
        logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
        country: "Inglaterra",
    },
    {
        name: "Villarreal CF",
        logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg",
        country: "Espanha",
    },
    {
        name: "Olympique de Marseille",
        logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg",
        country: "França",
    },
    {
        name: "AS Roma",
        logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
        country: "Itália",
    },
    {
        name: "Sevilla FC",
        logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
        country: "Espanha",
    },
]

const STATS = [
    { value: "345+", count: "345", suffix: "+", decimals: "0", label: "Atletas encaminhados", icon: Users, color: "from-amber-400 to-amber-600" },
    { value: "23", count: "23", suffix: "", decimals: "0", label: "Países com oportunidades", icon: Globe2, color: "from-blue-400 to-blue-600" },
    { value: "91%", count: "91", suffix: "%", decimals: "0", label: "Taxa de compatibilidade", icon: Target, color: "from-emerald-400 to-emerald-600" },
    { value: "4.8x", count: "4.8", suffix: "x", decimals: "1", label: "Mais rápido que peneiras", icon: TrendingUp, color: "from-purple-400 to-purple-600" },
]

const TESTIMONIALS = [
    {
        initials: "GR",
        name: "Gabriel Rocha",
        position: "Meia-Atacante",
        club: "FC Alverca — Portugal",
        color: "bg-amber-500",
        text: "Fui em mais de 10 peneiras nos últimos 3 anos e nada. Com o Zyron, em menos de 2 meses já estava em contato com o clube em Portugal. O relatório foi o que abriu a porta, não o meu contato.",
    },
    {
        initials: "MS",
        name: "Mateus Souza",
        position: "Lateral Direito",
        club: "Estoril Praia B — Portugal",
        color: "bg-blue-500",
        text: "Nunca tinha passado de uma segunda fase de peneira. O Zyron mostrou exatamente onde eu era forte e o clube entendeu isso pelo relatório. Hoje estou treinando profissionalmente.",
    },
    {
        initials: "VC",
        name: "Vinícius Carvalho",
        position: "Zagueiro",
        club: "FK Spartak Subotica — Sérvia",
        color: "bg-emerald-500",
        text: "A maior dificuldade era ser visto. Não tenho pai famoso nem contato com dirigente. O Zyron me deu um relatório técnico que falou por mim. Assinou meu primeiro contrato profissional.",
    },
]

/**
 * Depoimentos de pais e mães sobre a trajetória dos filhos.
 * Texto de vitrine — substitua por depoimentos reais e autorizados antes de
 * divulgar publicamente. Os retratos são ilustrações vetoriais (ParentAvatars),
 * nunca fotos de pessoas reais.
 */
const PARENT_TESTIMONIALS: {
    avatar: ParentAvatarKey
    name: string
    relation: string
    location: string
    child: string
    milestone: string
    accent: string
    text: string
}[] = [
        {
            avatar: "rosangela",
            name: "Rosângela Martins",
            relation: "Mãe do Kauã, 16 anos",
            location: "Ceilândia, DF",
            child: "Kauã",
            milestone: "Sub-17 — clube da capital",
            accent: "amber",
            text: "Meu filho jogava bem no campo do bairro e ninguém enxergava. Levamos o relatório do Zyron para três clubes e dois responderam. Hoje o Kauã treina no sub-17 e eu parei de implorar por uma chance para ele.",
        },
        {
            avatar: "marcos",
            name: "Marcos Antônio Ferreira",
            relation: "Pai da Lívia, 15 anos",
            location: "Contagem, MG",
            child: "Lívia",
            milestone: "Convocada para avaliação",
            accent: "blue",
            text: "Eu não entendia nada de análise de desempenho. O relatório chegou com dados que consegui mostrar ao coordenador sem gaguejar. Duas semanas depois ela foi chamada para uma avaliação técnica.",
        },
        {
            avatar: "cleide",
            name: "Cleide Nascimento",
            relation: "Mãe do Enzo, 13 anos",
            location: "Belford Roxo, RJ",
            child: "Enzo",
            milestone: "Aprovado na base",
            accent: "emerald",
            text: "Já tinha gastado muito com peneira, transporte e inscrição, sempre no escuro. Pela primeira vez eu soube de verdade em que pé estava o meu filho. O Enzo passou na base de um clube da capital.",
        },
        {
            avatar: "wagner",
            name: "Wagner Dourado",
            relation: "Pai do Pedro Henrique, 18 anos",
            location: "Londrina, PR",
            child: "Pedro Henrique",
            milestone: "Contrato de formação",
            accent: "purple",
            text: "O que mudou foi a conversa. Deixei de chegar como pai pedindo favor e passei a chegar com um documento técnico na mão. O Pedro assinou o primeiro contrato de formação dele em março.",
        },
        {
            avatar: "simone",
            name: "Simone Albuquerque",
            relation: "Mãe do Davi, 17 anos",
            location: "Camaçari, BA",
            child: "Davi",
            milestone: "Reposicionado como ala",
            accent: "rose",
            text: "Meu marido achava que era mais uma promessa. O relatório apontou que o Davi rende muito melhor como ala do que como ponta. O clube que o chamou procurava exatamente esse perfil.",
        },
    ]

const ACCENT_RING: Record<string, string> = {
    amber: "ring-amber-400/45",
    blue: "ring-blue-400/45",
    emerald: "ring-emerald-400/45",
    purple: "ring-purple-400/45",
    rose: "ring-rose-400/45",
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

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [menuOpen, setMenuOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const { isAdmin } = useIsAdmin()

    const pageRef = useRef<HTMLDivElement>(null)
    const { setLocked } = useSmoothScroll(true)
    useScrollReveal(pageRef, [])

    // Bug 5 fix: aplica a classe dark no <html> para que o Tailwind responda
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    // overflow-x:hidden no <html> transforma a raiz em contêiner de rolagem e
    // quebra pin/sticky do ScrollTrigger. `clip` corta igual, sem esse efeito.
    useEffect(() => {
        document.documentElement.classList.add('zyron-scroll-root')
        return () => document.documentElement.classList.remove('zyron-scroll-root')
    }, [])

    // Painel aberto = scroll da página congelado (o painel rola por conta própria)
    useEffect(() => {
        setLocked(settingsOpen)
    }, [settingsOpen, setLocked])

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Atleta"
    const firstName = displayName.split(" ")[0]

    const handleSignOut = async () => {
        await signOut()
        navigate("/login")
    }

    const handleChangePassword = async () => {
        setMenuOpen(false)
        setSettingsOpen(false)
        const { error } = await supabase.auth.resetPasswordForEmail(user?.email || "", {
            redirectTo: "https://www.aizyron.site/reset-password",
        })
        if (!error) {
            toast({
                title: "E-mail enviado!",
                description: "Verifique sua caixa de entrada para redefinir a senha.",
            })
        }
    }

    return (
        <div ref={pageRef} className="relative min-h-screen bg-background text-foreground font-sans antialiased">

            <style>{`
                html.zyron-scroll-root, html.zyron-scroll-root body { overflow-x: clip; }
                @keyframes zyron-sheen {
                    0%   { transform: translateX(-120%); }
                    60%  { transform: translateX(220%); }
                    100% { transform: translateX(220%); }
                }
                .zyron-sheen::after {
                    content: "";
                    position: absolute;
                    top: 0; bottom: 0; left: 0;
                    width: 38%;
                    background: linear-gradient(100deg, transparent, rgba(255,255,255,0.42), transparent);
                    animation: zyron-sheen 3.6s ease-in-out infinite;
                    pointer-events: none;
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

            {/*
                ─── ATMOSFERA DE FUNDO ───
                Antes estes brilhos usavam filter:blur(130px) + parallax via
                ScrollTrigger. Medido com profiling (CPU 4x throttle, Chromium):
                isso sozinho derrubava o scroll de ~25ms/quadro para ~100-130ms/
                quadro (pior quadro passava de 1,7s), porque o navegador tinha
                que re-borrar uma área enorme a cada frame de scroll. A camada é
                `fixed`, então não precisa de parallax para "flutuar" — o
                degradê radial já entrega a borda suave sem custo de filtro.
            */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                <div className="absolute inset-0 zyron-grid opacity-70" />
                <div
                    className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.06) 38%, transparent 68%)" }}
                />
                <div
                    className="absolute top-[45%] -right-40 h-[460px] w-[560px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(52,211,153,0.11) 0%, rgba(52,211,153,0.045) 40%, transparent 70%)" }}
                />
                <div
                    className="absolute bottom-0 -left-32 h-[420px] w-[520px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(129,140,248,0.09) 0%, rgba(129,140,248,0.04) 40%, transparent 70%)" }}
                />
            </div>

            {/* ─── SETTINGS PANEL (slide-in) ─── */}
            {settingsOpen && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSettingsOpen(false)} />
                    <div className="fixed top-0 right-0 h-full w-80 max-w-[88vw] z-50 bg-card border-l border-foreground/10 shadow-2xl flex flex-col animate-fade-in">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/10">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-amber-400" />
                                <span className="font-semibold text-sm">Configurações</span>
                            </div>
                            <button onClick={() => setSettingsOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors" aria-label="Fechar configurações">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1" data-lenis-prevent>
                            {/* Account section */}
                            <p className="text-[10px] text-foreground/55 uppercase tracking-widest font-semibold px-3 pt-3 pb-1">Conta</p>

                            <button
                                onClick={() => { setSettingsOpen(false); navigate("/onboarding") }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left"
                            >
                                <User className="w-4 h-4 text-foreground/60" /> Editar informações pessoais
                            </button>

                            <button
                                onClick={handleChangePassword}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left"
                            >
                                <Lock className="w-4 h-4 text-foreground/60" /> Alterar senha
                            </button>

                            {/* Preferences section */}
                            <p className="text-[10px] text-foreground/55 uppercase tracking-widest font-semibold px-3 pt-5 pb-1">Preferências</p>

                            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:bg-foreground/8 transition-all">
                                <span className="flex items-center gap-3">
                                    <Moon className="w-4 h-4 text-foreground/60" /> Modo noturno
                                </span>
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${darkMode ? "bg-amber-500" : "bg-foreground/20"}`}
                                    aria-label="Alternar modo noturno"
                                >
                                    <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${darkMode ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                            </div>

                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left">
                                <Bell className="w-4 h-4 text-foreground/60" /> Notificações
                                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Em breve</span>
                            </button>

                            {/* Admin section */}
                            {isAdmin && (
                                <>
                                    <p className="text-[10px] text-foreground/55 uppercase tracking-widest font-semibold px-3 pt-5 pb-1">Administração</p>
                                    <button
                                        onClick={() => { setSettingsOpen(false); navigate("/admin") }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-400 hover:bg-amber-500/12 transition-all text-left"
                                    >
                                        <Shield className="w-4 h-4" /> Gerenciar usuários
                                    </button>
                                </>
                            )}

                            {/* Support section */}
                            <p className="text-[10px] text-foreground/55 uppercase tracking-widest font-semibold px-3 pt-5 pb-1">Suporte</p>

                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left">
                                <HelpCircle className="w-4 h-4 text-foreground/60" /> Central de ajuda
                            </button>

                            <button onClick={() => navigate('/privacidade')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left">
                                <FileText className="w-4 h-4 text-foreground/60" /> Política de privacidade
                            </button>
                        </div>

                        <div className="p-4 border-t border-foreground/10">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/12 transition-all text-left"
                            >
                                <LogOut className="w-4 h-4" /> Sair da conta
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ─── HEADER ─── */}
            <header
                data-header-scrolled
                data-scrolled="false"
                className="group sticky top-0 z-40 w-full border-b border-foreground/8 bg-background/70 backdrop-blur-sm transition-colors duration-300 data-[scrolled=true]:border-foreground/14 data-[scrolled=true]:bg-background/92 data-[scrolled=true]:backdrop-blur-none"
            >
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-bold text-foreground tracking-tight">ZYRON</span>
                    </div>

                    {/* Right side: settings gear + user menu */}
                    <div className="flex items-center gap-2">
                        {/* Settings gear icon */}
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-foreground/12 hover:border-amber-400/40 bg-foreground/6 hover:bg-foreground/10 transition-all"
                            title="Configurações"
                        >
                            <Settings className="w-4 h-4 text-foreground/75" />
                        </button>

                        {/* User avatar dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-foreground/12 hover:border-amber-400/40 bg-foreground/6 hover:bg-foreground/10 transition-all"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-foreground/90 max-w-[100px] truncate hidden sm:block">{firstName}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-foreground/60 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-foreground/12 bg-popover/95 backdrop-blur-sm shadow-2xl z-50 overflow-hidden animate-fade-in">
                                        <div className="px-4 py-3 border-b border-foreground/10">
                                            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                                            <p className="text-xs text-foreground/60 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setMenuOpen(false); navigate("/onboarding") }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left"
                                            >
                                                <User className="w-4 h-4" /> Meu perfil
                                            </button>
                                            <button
                                                onClick={() => { setMenuOpen(false); setSettingsOpen(true) }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/8 transition-all text-left"
                                            >
                                                <Settings className="w-4 h-4" /> Configurações
                                            </button>
                                        </div>
                                        <div className="p-2 border-t border-foreground/10">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/12 transition-all text-left"
                                            >
                                                <LogOut className="w-4 h-4" /> Sair da conta
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Barra de progresso de leitura */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden">
                    <div
                        data-progress
                        className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400"
                    />
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-20 md:space-y-32">

                {/* ─── HERO / SAUDAÇÃO ─── */}
                <section className="space-y-7">
                    <div data-hero-item className="inline-flex items-center gap-2 bg-amber-500/12 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <span className="zyron-dot w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <Activity className="w-3.5 h-3.5" />
                        SISTEMA ATIVO — PRONTO PARA ANÁLISE
                    </div>
                    <h1 data-hero-item className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
                        Olá, {firstName}.<br />
                        <span className="text-foreground/45">Sua carreira</span>{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">começa aqui.</span>
                    </h1>
                    <p data-hero-item className="text-base md:text-lg text-foreground/75 max-w-2xl leading-relaxed">
                        Você está acessando o ambiente de análise do Zyron. O que acontece a seguir vai determinar como o mercado enxerga o seu futebol.
                    </p>

                    <div data-hero-item className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                        <button
                            onClick={() => navigate("/onboarding")}
                            className="zyron-sheen group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-base font-black text-black shadow-[0_0_36px_-8px_rgba(251,191,36,0.75)] transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_52px_-8px_rgba(251,191,36,0.95)] active:scale-[0.98]"
                        >
                            <Zap className="relative z-10 w-4 h-4" />
                            <span className="relative z-10">Iniciar minha análise</span>
                            <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <Stars />
                            <span className="text-sm text-foreground/70">
                                <strong className="font-semibold text-foreground">4,9/5</strong> — famílias atendidas
                            </span>
                        </div>
                    </div>
                </section>

                {/* ─── STATS ─── */}
                <section>
                    <div data-anim-group="0.08" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {STATS.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div
                                    key={stat.label}
                                    className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-4 md:p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-foreground/[0.07]"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                                        <Icon className="w-[18px] h-[18px] text-black/85" strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <p
                                            className="text-2xl md:text-3xl font-black text-foreground tabular-nums"
                                            data-count={stat.count}
                                            data-count-suffix={stat.suffix}
                                            data-count-decimals={stat.decimals}
                                        >
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-foreground/65 mt-1 leading-snug">{stat.label}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── COPY PSICOLÓGICO PRINCIPAL ─── */}
                <section
                    data-anim="up"
                    className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.06] to-transparent p-6 md:p-12 space-y-6"
                >
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
                            <strong className="font-semibold text-foreground">Brighton, Ajax, Bayer Leverkusen, Benfica.</strong> Clubes que estão no topo do futebol mundial hoje têm uma coisa em comum: eles encontram talentos que nenhum olheiro tradicional teria notado. E fazem isso através de dados, modelos preditivos e análise de vídeo com IA.
                        </p>
                        <p>
                            O problema é que essa tecnologia nunca esteve acessível para o atleta brasileiro que está no começo da carreira — aquele que vai bem num jogo, mas nunca tem quem grave, analise e apresente seu desempenho de forma profissional.
                        </p>
                        <p>
                            <strong className="font-semibold text-foreground">O Zyron encerra essa desigualdade.</strong> Nossa IA processa cada frame do seu jogo, identifica suas características únicas e gera um relatório técnico com o mesmo nível de profundidade usado pelos departamentos de scout internacionais.
                        </p>
                    </div>
                    <div data-anim-group="0.1" className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { icon: BarChart3, label: "100% das ações analisadas", sub: "Sem fadiga, sem preferências — só dados" },
                            { icon: Activity, label: "Resultados em minutos", sub: "O que um olheiro demora semanas pra ver" },
                            { icon: Globe2, label: "Match com clubes reais", sub: "Compatibilidade cruzada com oportunidades abertas" },
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

                {/* ─── ESCUDOS DE CLUBES ─── */}
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
                                    <img
                                        src={club.logo}
                                        alt={club.name}
                                        className="w-full h-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
                                        loading="lazy"
                                    />
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

                {/* ─── BOTÃO PRINCIPAL ─── */}
                <section data-anim="scale" className="flex flex-col items-center text-center space-y-5">
                    <p className="text-sm text-foreground/60 uppercase tracking-widest font-semibold">Tudo pronto. É hora de dar o próximo passo.</p>
                    <button
                        onClick={() => navigate("/onboarding")}
                        className="zyron-sheen group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-10 py-5 text-lg font-black text-black shadow-[0_0_40px_rgba(251,191,36,0.32)] transition-all duration-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_64px_rgba(251,191,36,0.5)] active:scale-95"
                    >
                        <Zap className="relative z-10 w-5 h-5" />
                        <span className="relative z-10">INICIAR MINHA ANÁLISE</span>
                        <ArrowRight className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-xs text-foreground/55">Processo rápido. Resultado permanente.</p>
                </section>

                {/* ─── DEPOIMENTOS DE PAIS (prova social) ─── */}
                <section
                    data-track-wrapper
                    className="relative lg:ml-[calc(50%-50vw)] lg:w-screen lg:overflow-hidden lg:py-10"
                >
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
                        <div
                            data-track
                            className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:will-change-transform"
                        >
                            {PARENT_TESTIMONIALS.map((parent) => {
                                const Avatar = PARENT_AVATARS[parent.avatar]
                                return (
                                    <article
                                        key={parent.name}
                                        data-anim="up"
                                        className="group relative flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-foreground/[0.045] p-6 md:p-7 transition-all duration-300 hover:border-amber-400/30 hover:bg-foreground/[0.075] lg:w-[380px] lg:flex-shrink-0"
                                    >
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

                                        <p className="text-sm text-foreground/85 leading-relaxed">
                                            &ldquo;{parent.text}&rdquo;
                                        </p>

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

                    {/* Indicador de progresso da galeria (desktop) */}
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

                {/* ─── CONEXÃO EMOCIONAL ─── */}
                <section
                    data-anim="up"
                    className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.06] to-transparent p-8 md:p-12 text-center space-y-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-[0_0_30px_-6px_rgba(251,191,36,0.75)]">
                        <Star className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">Você Está Dando o Próximo Passo</h3>
                    <p className="text-foreground/75 max-w-xl mx-auto leading-relaxed">
                        Cada grande jogador começou com uma avaliação. O que separa atletas comuns dos que chegam ao alto nível é a decisão de evoluir com método, dados e direcionamento estratégico.
                    </p>
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

                {/* ─── FOOTER ─── */}
                <footer data-anim="fade" className="text-center py-8 border-t border-foreground/10 space-y-4">
                    <p className="text-xs text-foreground/60">© 2026 Zyron. Todos os direitos reservados.</p>
                    <div className="max-w-2xl mx-auto text-[11px] text-foreground/50 leading-relaxed space-y-2 text-left">
                        <p>A Zyron é uma plataforma AI-Based de análise de performance esportiva. As avaliações, projeções, estimativas salariais e recomendações de clubes são geradas por modelos algorítmicos com base nas informações e vídeos fornecidos pelo próprio atleta.</p>
                        <p>A Zyron não representa, não garante contrato, aprovação, convocação, teste ou vínculo profissional com qualquer clube, federação ou entidade esportiva.</p>
                        <p>O desenvolvimento esportivo, evolução técnica, oportunidades e eventuais resultados dependem exclusivamente do desempenho, dedicação, condições individuais e decisões do próprio atleta.</p>
                        <p>As análises possuem caráter informativo, educacional e de direcionamento estratégico, não constituindo promessa, intermediação oficial ou garantia de resultados.</p>
                        <p>O uso da plataforma implica na concordância com estes termos e com a Política de Privacidade.</p>
                    </div>
                </footer>
            </main>
        </div>
    )
}
