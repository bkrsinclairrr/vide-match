import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Settings, LogOut, Lock, User, ChevronDown,
    Zap, Globe2, BarChart3, Users, TrendingUp, ArrowRight,
    Shield, Star, Activity, Target, Bell, HelpCircle,
    FileText, Moon, X
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useIsAdmin } from "@/hooks/useAdmin"

// Official club logos via Wikimedia Commons
const CLUBS = [
    {
        name: "West Ham United",
        logo: "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
        country: "Inglaterra",
    },
    {
        name: "Real Betis",
        logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",
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
    { value: "345+", label: "Atletas encaminhados", icon: Users, color: "from-amber-400 to-amber-600" },
    { value: "23", label: "Países com oportunidades", icon: Globe2, color: "from-blue-400 to-blue-600" },
    { value: "91%", label: "Taxa de compatibilidade", icon: Target, color: "from-emerald-400 to-emerald-600" },
    { value: "4.8x", label: "Mais rápido que peneiras", icon: TrendingUp, color: "from-purple-400 to-purple-600" },
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

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [menuOpen, setMenuOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const { isAdmin } = useIsAdmin()

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
        <div className="min-h-screen bg-black text-white font-sans antialiased">

            {/* ─── SETTINGS PANEL (slide-in) ─── */}
            {settingsOpen && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
                    <div className="fixed top-0 right-0 h-full w-80 z-50 bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-amber-400" />
                                <span className="font-semibold text-sm">Configurações</span>
                            </div>
                            <button onClick={() => setSettingsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {/* Account section */}
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold px-3 pt-3 pb-1">Conta</p>

                            <button
                                onClick={() => { setSettingsOpen(false); navigate("/onboarding") }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                            >
                                <User className="w-4 h-4 text-white/40" /> Editar informações pessoais
                            </button>

                            <button
                                onClick={handleChangePassword}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                            >
                                <Lock className="w-4 h-4 text-white/40" /> Alterar senha
                            </button>

                            {/* Preferences section */}
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold px-3 pt-5 pb-1">Preferências</p>

                            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5 transition-all">
                                <span className="flex items-center gap-3">
                                    <Moon className="w-4 h-4 text-white/40" /> Modo noturno
                                </span>
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${darkMode ? "bg-amber-500" : "bg-white/10"}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                            </div>

                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left">
                                <Bell className="w-4 h-4 text-white/40" /> Notificações
                                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Em breve</span>
                            </button>

                            {/* Support section */}
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold px-3 pt-5 pb-1">Suporte</p>

                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left">
                                <HelpCircle className="w-4 h-4 text-white/40" /> Central de ajuda
                            </button>

                            <button onClick={() => navigate('/privacidade')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left">
                                <FileText className="w-4 h-4 text-white/40" /> Política de privacidade
                            </button>
                        </div>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                            >
                                <LogOut className="w-4 h-4" /> Sair da conta
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-bold text-white tracking-tight">ZYRON</span>
                    </div>

                    {/* Right side: settings gear + user menu */}
                    <div className="flex items-center gap-2">
                        {/* Settings gear icon */}
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                            title="Configurações"
                        >
                            <Settings className="w-4 h-4 text-white/60" />
                        </button>

                        {/* User avatar dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-white/80 max-w-[100px] truncate hidden sm:block">{firstName}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/5">
                                            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                            <p className="text-xs text-white/40 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setMenuOpen(false); navigate("/onboarding") }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                                            >
                                                <User className="w-4 h-4" /> Meu perfil
                                            </button>
                                            <button
                                                onClick={() => { setMenuOpen(false); setSettingsOpen(true) }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                                            >
                                                <Settings className="w-4 h-4" /> Configurações
                                            </button>
                                        </div>
                                        <div className="p-2 border-t border-white/5">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
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
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 md:py-12 space-y-14 md:space-y-24">

                {/* ─── HERO / SAUDAÇÃO ─── */}
                <section className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Activity className="w-3.5 h-3.5" />
                        SISTEMA ATIVO — PRONTO PARA ANÁLISE
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight">
                        Olá, {firstName}.<br />
                        <span className="text-white/30">Sua carreira</span>{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">começa aqui.</span>
                    </h1>
                    <p className="text-base md:text-lg text-white/50 max-w-2xl leading-relaxed">
                        Você está acessando o ambiente de análise do Zyron. O que acontece a seguir vai determinar como o mercado enxerga o seu futebol.
                    </p>
                </section>

                {/* ─── STATS ─── */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {STATS.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/3 p-3 md:p-5 flex flex-col gap-2 md:gap-3 hover:border-white/10 transition-all">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-white">{stat.value}</p>
                                        <p className="text-xs text-white/40 mt-0.5 leading-tight">{stat.label}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── COPY PSICOLÓGICO PRINCIPAL ─── */}
                <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent p-5 md:p-12 space-y-6">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-widest uppercase">
                        <Shield className="w-3.5 h-3.5" />
                        O Futebol Mudou. A Avaliação Também.
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black leading-tight">
                        Os maiores clubes da Europa{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                            já não contratam mais pelo olhar.
                        </span>
                    </h2>
                    <div className="space-y-4 text-white/60 leading-relaxed text-base">
                        <p>
                            <strong className="text-white">Brighton, Ajax, Bayer Leverkusen, Benfica.</strong> Clubes que estão no topo do futebol mundial hoje têm uma coisa em comum: eles encontram talentos que nenhum olheiro tradicional teria notado. E fazem isso através de dados, modelos preditivos e análise de vídeo com IA.
                        </p>
                        <p>
                            O problema é que essa tecnologia nunca esteve acessível para o atleta brasileiro que está no começo da carreira — aquele que vai bem num jogo, mas nunca tem quem grave, analise e apresente seu desempenho de forma profissional.
                        </p>
                        <p>
                            <strong className="text-white">O Zyron encerra essa desigualdade.</strong> Nossa IA processa cada frame do seu jogo, identifica suas características únicas e gera um relatório técnico com o mesmo nível de profundidade usado pelos departamentos de scout internacionais.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { icon: BarChart3, label: "100% das ações analisadas", sub: "Sem fadiga, sem preferências — só dados" },
                            { icon: Activity, label: "Resultados em minutos", sub: "O que um olheiro demora semanas pra ver" },
                            { icon: Globe2, label: "Match com clubes reais", sub: "Compatibilidade cruzada com oportunidades abertas" },
                        ].map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.label}</p>
                                        <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ─── ESCUDOS DE CLUBES ─── */}
                <section className="text-center space-y-8">
                    <div>
                        <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Inspiração tecnológica</p>
                        <h3 className="text-xl md:text-2xl font-bold text-white">
                            Tecnologia Inspirada em Padrões de Clubes Internacionais
                        </h3>
                    </div>
                    <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
                        {CLUBS.map((club) => (
                            <div key={club.name} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center opacity-40 group-hover:opacity-70 transition-opacity duration-300">
                                    <img
                                        src={club.logo}
                                        alt={club.name}
                                        className="w-full h-full object-contain filter grayscale"
                                        loading="lazy"
                                    />
                                </div>
                                <span className="text-[10px] text-white/25 font-medium tracking-wide">{club.country}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-white/20 max-w-xl mx-auto leading-relaxed">
                        Modelos de análise de desempenho utilizados por clubes que investem fortemente em dados
                        e tecnologia no futebol moderno.
                    </p>
                </section>

                {/* ─── BOTÃO PRINCIPAL ─── */}
                <section className="flex flex-col items-center text-center space-y-5">
                    <p className="text-sm text-white/30 uppercase tracking-widest font-semibold">Tudo pronto. É hora de dar o próximo passo.</p>
                    <button
                        onClick={() => navigate("/onboarding")}
                        className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-lg px-10 py-5 rounded-2xl transition-all duration-200 shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] active:scale-95"
                    >
                        <Zap className="w-5 h-5" />
                        INICIAR MINHA ANÁLISE
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-white/20">Processo rápido. Resultado permanente.</p>
                </section>

                {/* ─── CONEXÃO EMOCIONAL ─── */}
                <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent p-8 md:p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
                        <Star className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black">Você Está Dando o Próximo Passo</h3>
                    <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
                        Cada grande jogador começou com uma avaliação. O que separa atletas comuns dos que chegam ao alto nível é a decisão de evoluir com método, dados e direcionamento estratégico.
                    </p>
                </section>

                {/* ─── DEPOIMENTOS ─── */}
                <section className="space-y-8">
                    <div className="text-center">
                        <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-2">Resultados reais</p>
                        <h3 className="text-xl md:text-2xl font-bold">Atletas Que Tomaram a Decisão</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.name} className="rounded-2xl border border-white/5 bg-white/3 p-6 flex flex-col gap-5 hover:border-white/10 transition-all">
                                <p className="text-sm text-white/70 leading-relaxed italic">"{t.text}"</p>
                                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{t.name}</p>
                                        <p className="text-xs text-white/40">{t.position} · {t.club}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── FOOTER ─── */}
                <footer className="text-center py-8 border-t border-white/5 space-y-4">
                    <p className="text-xs text-white/20">© 2026 Zyron. Todos os direitos reservados.</p>
                    <div className="max-w-2xl mx-auto text-[10px] text-white/15 leading-relaxed space-y-2 text-left">
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
