import {
  ArrowRight, Zap, Shield, Globe2, BarChart3, Target,
  Users, TrendingUp, CheckCircle2, Star, Activity,
  Clock, XCircle, Flame, Lock, AlertTriangle
} from "lucide-react"
import { useNavigate } from "react-router-dom"

// Authority number blocks
const STATS = [
  { value: "12.438", label: "Dados biométricos cruzados em 38s", color: "text-amber-400" },
  { value: "87%", label: "Dos talentos das periferias nunca são vistos por um scout sequer", color: "text-red-400" },
  { value: "2.140+", label: "Clubes globais operam com análise preditiva por IA em 2025", color: "text-amber-400" },
  { value: "92%", label: "Das contratações do futebol inglês em 2025 foram baseadas em dados — não em peneiras", color: "text-emerald-400" },
]

const STEPS = [
  {
    step: "01",
    icon: Activity,
    title: "Dossiê Tático e Biométrico",
    desc: "Você envia seu vídeo. Nossa IA processa 12.438 variáveis em menos de 38 segundos — velocidade, biomecânica, leitura de jogo, tomada de decisão. O que um olheiro demoraria 6 meses para enxergar, nós entregamos em minutos.",
    tag: "IA DE ELITE",
  },
  {
    step: "02",
    icon: BarChart3,
    title: "Relatório de Performance Irrefutável",
    desc: "O resultado é um documento técnico com 10 indicadores individuais assinados pela equipe de scouts do Zyron. É a diferença entre um jogador que 'parece bom' e um atleta que tem dados.",
    tag: "AUTORIDADE = DADOS",
  },
  {
    step: "03",
    icon: Target,
    title: "Match Reverso: clubes que precisam da sua métrica hoje",
    desc: "Não é você que vai atrás do clube. O sistema cruza seu perfil com necessidades reais de elencos parceiros e entrega a correspondência exata — categoria, posição, filosofia tática e sobreposição de vagas.",
    tag: "MATCH INTELIGENTE",
  },
]

const TESTIMONIALS = [
  {
    initials: "GR",
    name: "Gabriel Rocha",
    position: "Meia-Atacante · 21 anos",
    club: "FC Alverca B — Portugal",
    color: "bg-amber-500",
    text: "Fui em mais de 10 peneiras nos últimos 3 anos e absolutamente nada. Com o Zyron, em menos de 2 meses já estava em contato direto com o clube em Portugal. O relatório abriu a porta — não o meu contato, não o meu empresário.",
  },
  {
    initials: "MS",
    name: "Mateus Souza",
    position: "Lateral Direito · 19 anos",
    club: "Estoril Praia B — Portugal",
    color: "bg-blue-500",
    text: "O scout do clube me disse literalmente: 'Seu relatório foi diferente de tudo que recebemos esse ano.' Hoje assino meu primeiro contrato profissional graças ao documento que o Zyron gerou.",
  },
  {
    initials: "VC",
    name: "Vinícius Carvalho",
    position: "Zagueiro · 23 anos",
    club: "FK Spartak Subotica — Sérvia",
    color: "bg-emerald-500",
    text: "Eu não tinha pai famoso nem empresário. Nunca tive acesso. O Zyron me deu os dados que substituíram todos os contatos que eu não tinha. Esse sistema é o único democrático que existe no futebol.",
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-white tracking-tight text-lg">ZYRON</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-white/40 hover:text-white transition-colors hidden sm:block"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm font-bold bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-amber-400/5 px-4 py-2 rounded-xl transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Iniciar Análise
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            87% dos jogadores talentosos nunca são vistos. Você vai ser o próximo?
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-8">
            A Europa parou de<br />
            recrutar pelo olhar.<br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600 bg-clip-text text-transparent">
              E você ainda depende<br />de peneira?
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-4">
            Brighton. Bayer Leverkusen. Ajax. Brentford. Os clubes que dominam o futebol moderno
            encontram talentos que nenhum olheiro tradicional veria — através de <strong className="text-white">IA, dados biométricos e análise preditiva.</strong>
          </p>
          <p className="text-base text-white/40 max-w-xl mx-auto leading-relaxed mb-12">
            O Zyron é o primeiro sistema que coloca essa tecnologia de elite na mão do atleta que está começando.
            Sem empresário. Sem indicação. Só dados e talento.
          </p>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-lg px-10 py-5 rounded-2xl transition-all shadow-[0_0_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_80px_rgba(251,191,36,0.6)] active:scale-95"
            >
              <Zap className="w-5 h-5" />
              INICIAR MAPEAMENTO BIOMÉTRICO
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-white/25">Apenas dados. Sem indicações. Sem empresário.</p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-white/30">
            {[
              { icon: CheckCircle2, text: "Análise profissional em minutos" },
              { icon: Lock, text: "Dados 100% protegidos" },
              { icon: Globe2, text: "Clubes em 23 países" },
              { icon: Shield, text: "Relatório assinado por scouts reais" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5 text-amber-400/60" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTHORITY STATS ─── */}
      <section className="border-y border-white/5 bg-white/2">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold text-center mb-10">O mercado mudou. Os dados provam.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl border border-white/5 bg-white/3">
                <p className={`text-3xl md:text-4xl font-black mb-2 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white/40 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INIMIGO COMUM: A PENEIRA ─── */}
      <section className="max-w-5xl mx-auto px-4 py-24">
        <div className="rounded-3xl border border-red-500/10 bg-gradient-to-br from-red-500/5 to-transparent p-8 md:p-14 space-y-6">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
            <XCircle className="w-4 h-4" />
            O Sistema Que Não Te Serve
          </div>
          <h2 className="text-2xl md:text-4xl font-black leading-tight">
            A peneira é um sistema feito para filtrar quem tem <span className="text-red-400">conexão</span>,{" "}
            não quem tem <span className="text-white">talento.</span>
          </h2>
          <div className="space-y-4 text-white/55 text-base leading-relaxed max-w-3xl">
            <p>
              No Brasil, um jovem atleta precisa conhecer alguém que conhece alguém para entrar numa peneira que vai reprovar ele de qualquer jeito — porque a vaga já foi prometida. Enquanto isso, lá fora, times como o Brighton descobriram Wesley Fofana por algoritmo. O Brentford escala com modelos preditivos. O RB Leipzig compra jogadores que seriam invisíveis para qualquer olheiro tradicional.
            </p>
            <p>
              <strong className="text-white">O problema não é o seu talento. É que você não tem os dados para provar.</strong>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {[
              { label: "Peneira tradicional", sub: "Exige conhecidos, acesso e sorte" },
              { label: "Empresário desconhecido", sub: "Cobra caro para fazer pouco ou nada" },
              { label: "Indicação de contato", sub: "Funciona para 3% dos jogadores" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl border border-red-500/10 bg-red-500/5">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-white/35 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── O CUSTO DA INAÇÃO (dor do tempo) ─── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="rounded-3xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent p-8 md:p-14 space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black">
            A janela da sua carreira{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              não fica aberta.
            </span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
            A carreira profissional de um atleta começa — ou morre — entre os 16 e os 23 anos. <strong className="text-white">Cada ano que passa sem um relatório técnico profissional é uma janela que fecha definitivamente.</strong> Não é drástico. É a realidade que ninguém te conta na escolinha.
          </p>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            O Zyron intercepta esse ciclo. Independente de quantas peneiras você perdeu, de quantos empresários te ignoraram ou de quantas promessas não se tornaram contratos — a análise começa do zero, com dados, e chega até o clube certo.
          </p>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-4 pb-24 space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Tecnologia de elite, agora no seu celular</p>
          <h2 className="text-3xl md:text-4xl font-black">Como o Zyron funciona</h2>
          <p className="text-white/40 max-w-lg mx-auto">O mesmo processo que clubes bilionários usam para descobrir talentos — direto para o atleta.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="rounded-2xl border border-white/5 bg-white/3 p-7 space-y-4 hover:border-amber-400/20 hover:bg-white/4 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-5xl font-black text-white/5">{s.step}</span>
                </div>
                <div className="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {s.tag}
                </div>
                <h3 className="text-base font-black leading-tight">{s.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── SOCIAL PROOF (depoimentos) ─── */}
      <section id="depoimentos" className="bg-white/2 border-y border-white/5 py-24">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Resultados reais. Sem filtro.</p>
            <h2 className="text-3xl md:text-4xl font-black">Atletas Que Pararam de Esperar</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/5 bg-black p-6 flex flex-col gap-4 hover:border-white/10 transition-all">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/65 leading-relaxed italic flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/35">{t.position}</p>
                    <p className="text-xs text-amber-400/80 font-medium">{t.club}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── URGENCY CTA ─── */}
      <section className="max-w-4xl mx-auto px-4 py-24">
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-black to-black p-10 md:p-16 text-center space-y-7 shadow-[0_0_80px_rgba(251,191,36,0.06)]">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5" />
            Janelas de mercado abertas neste momento
          </div>

          <h2 className="text-3xl md:text-5xl font-black leading-tight">
            O sistema já identificou{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              atletas com o seu perfil.
            </span>
          </h2>

          <p className="text-white/45 max-w-2xl mx-auto leading-relaxed text-lg">
            Enquanto você lê isso, outros atletas estão sendo analisados, mapeados e entregues para clubes parceiros. A diferença entre você e eles é uma decisão de 30 segundos.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: TrendingUp, value: "23", label: "Clubes ativos agora" },
              { icon: Users, value: "345+", label: "Atletas encaminhados" },
              { icon: Globe2, value: "23", label: "Países com vagas" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-3 text-center">
                <p className="text-xl font-black text-amber-400">{item.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-lg px-10 py-5 rounded-2xl transition-all shadow-[0_0_60px_rgba(251,191,36,0.35)] hover:shadow-[0_0_80px_rgba(251,191,36,0.6)] active:scale-95"
            >
              <Zap className="w-5 h-5" />
              INICIAR MAPEAMENTO BIOMÉTRICO
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-white/20">
              Gratuito. Sem empresário. Sem peneira. Só você e os dados.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10 text-center">
        <div className="max-w-5xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" />
            </div>
            <span className="font-black text-sm tracking-tight">ZYRON</span>
          </div>
          <p className="text-xs text-white/20">© 2026 Zyron. Todos os direitos reservados.</p>
          <p className="text-[10px] text-white/12 max-w-2xl mx-auto leading-relaxed">
            A Zyron é uma plataforma AI-Based de análise de performance esportiva. As análises são geradas por modelos algorítmicos com base nas informações fornecidas pelo atleta. Não garantimos contratos, aprovação em clubes ou resultados esportivos. O uso implica concordância com os Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </footer>
    </div>
  )
}
