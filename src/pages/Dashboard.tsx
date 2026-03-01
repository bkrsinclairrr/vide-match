import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Settings, LogOut, Lock, Moon, Sun, User, ChevronDown,
    Zap, Globe2, BarChart3, Users, TrendingUp, ArrowRight,
    Shield, Star, Activity, Target
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

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

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Atleta"
    const firstName = displayName.split(" ")[0]

    const handleSignOut = async () => {
        await signOut()
        navigate("/login")
    }

    const handleChangePassword = async () => {
        setMenuOpen(false)
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
            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-bold text-white tracking-tight">ZYRON</span>
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-white/80 max-w-[120px] truncate">{firstName}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/5">
                                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={handleChangePassword}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                                        >
                                            <Lock className="w-4 h-4" /> Alterar senha
                                        </button>
                                        <button
                                            onClick={() => { setMenuOpen(false); navigate("/onboarding") }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                                        >
                                            <User className="w-4 h-4" /> Editar informações pessoais
                                        </button>
                                        <button
                                            onClick={() => setMenuOpen(false)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            <span className="flex items-center gap-3"><Moon className="w-4 h-4" /> Modo escuro</span>
                                            <div className="w-9 h-5 rounded-full bg-amber-500 flex items-center px-0.5">
                                                <div className="w-4 h-4 rounded-full bg-black ml-auto" />
                                            </div>
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
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12 space-y-24">

                {/* ─── HERO / SAUDAÇÃO ─── */}
                <section className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Activity className="w-3.5 h-3.5" />
                        SISTEMA ATIVO — PRONTO PARA ANÁLISE
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                        Olá, {firstName}.<br />
                        <span className="text-white/30">Sua carreira</span>{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">começa aqui.</span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
                        Você está acessando o ambiente de análise do Zyron. O que acontece a seguir vai determinar como o mercado enxerga o seu futebol.
                    </p>
                </section>

                {/* ─── STATS ─── */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {STATS.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/3 p-5 flex flex-col gap-3 hover:border-white/10 transition-all">
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
                <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent p-8 md:p-12 space-y-6">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-widest uppercase">
                        <Shield className="w-3.5 h-3.5" />
                        Tecnologia de Nível Internacional
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black leading-tight">
                        Sua Performance Está Prestes a Ser Analisada com{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                            Precisão Total.
                        </span>
                    </h2>
                    <div className="space-y-4 text-white/60 leading-relaxed text-base">
                        <p>
                            Nossa Inteligência Artificial observa cada detalhe do seu jogo com precisão máxima.
                            Nenhum frame ignorado. Nenhuma ação perdida.
                        </p>
                        <p>
                            Utilizamos modelos avançados de análise de desempenho semelhantes aos utilizados por
                            grandes clubes internacionais — os mesmos que inverteram a lógica do mercado: dados
                            encontram talento antes que o olheiro tradicional pisque o olho.
                        </p>
                        <p>
                            Seu perfil será cruzado com métricas técnicas, físicas e táticas para identificar o
                            melhor encaixe estratégico para sua evolução. O resultado é um relatório inquestionável.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {[
                            { icon: BarChart3, label: "100% das ações analisadas", sub: "Nenhum momento é descartado" },
                            { icon: Activity, label: "Sem fadiga. Sem parcialidade.", sub: "Apenas dados objetivos e reais" },
                            { icon: Globe2, label: "Compatibilidade global", sub: "Cruzado com oportunidades reais" },
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
                        Cada grande jogador começou com uma avaliação. O que separa atletas comuns dos que chegam
                        ao alto nível é a decisão de evoluir com método, dados e direcionamento estratégico.
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
