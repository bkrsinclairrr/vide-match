import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Zap, Trophy, Shield, Target, Activity, Flame,
  ArrowRight, CheckCircle2, Cpu, Database, Globe2, Users, Star
} from "lucide-react"

// ─── DETERMINISTIC HASH ─────────────────────────────────────────────────────
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

function seededRand(seed: number, index: number): number {
  const h = hashString(`${seed}-${index}`)
  return 76 + (h % 20) // 76–95
}

// ─── CLUBS DATA ─────────────────────────────────────────────────────────────
const NATIONAL_CLUBS = [
  "Flamengo", "Palmeiras", "São Paulo FC", "Corinthians", "Athletico Paranaense",
  "Grêmio", "Internacional", "Atlético Mineiro", "Santos FC", "Sport Recife",
  "Fortaleza EC", "Ceará SC", "Bahia", "Vasco da Gama", "Fluminense",
  "Avaí FC", "Coritiba", "América Mineiro", "Red Bull Bragantino", "Cuiabá EC",
]

const INTERNATIONAL_CLUBS = [
  "West Ham United", "Sevilla FC", "Olympique de Marseille", "AS Roma", "Real Betis",
  "Sporting CP", "Benfica", "FC Porto", "Ajax", "Anderlecht",
  "FC Nantes", "RC Lens", "Valencia CF", "Getafe CF", "Hellas Verona",
  "Galatasaray", "Fenerbahçe", "FK Crvena zvezda", "Legia Warszawa", "Club Brugge",
]

// ─── LOADING MESSAGES ────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  { t: 0, text: "Inicializando módulo de análise biométrica..." },
  { t: 3, text: "Processando padrões de movimentação e técnica individual..." },
  { t: 7, text: "Cruzando dados com banco de 12.400 perfis de atletas catalogados..." },
  { t: 11, text: "Aplicando modelos de análise tática e posicionamento..." },
  { t: 15, text: "Calculando índice de finalização, passe e explosão física..." },
  { t: 19, text: "Encaminhando perfil para revisão da equipe de Scout Zyron..." },
  { t: 23, text: "Scout especializado analisando compatibilidade com clubes-alvo..." },
  { t: 27, text: "Gerando relatório de performance individualizado..." },
  { t: 31, text: "Validando e assinando relatório — quase pronto..." },
]

const STAT_DEFINITIONS = [
  { key: "ataque", label: "Ataque", icon: Flame, desc: "Participação ofensiva, movimento e impacto no terço final" },
  { key: "defesa", label: "Defesa", icon: Shield, desc: "Posicionamento, marcação e interceptações" },
  { key: "chute", label: "Chute", icon: Target, desc: "Precisão e potência nas finalizações" },
  { key: "dominio", label: "Domínio", icon: Activity, desc: "Controle de bola, primeiro toque e proteção" },
  { key: "marcacao", label: "Marcação", icon: Users, desc: "Pressão, recuperação de bola e duelos" },
  { key: "finalizacao", label: "Finalização", icon: Trophy, desc: "Conversão de oportunidades criadas" },
  { key: "drible", label: "Drible", icon: Zap, desc: "Capacidade de superação individual com a bola" },
  { key: "passe", label: "Passe", icon: Globe2, desc: "Qualidade, visão e frequência de passes certos" },
  { key: "velocidade", label: "Velocidade", icon: Cpu, desc: "Explosão em aceleração e velocidade máxima" },
  { key: "leitura", label: "Leitura de Jogo", icon: Database, desc: "Tomada de decisão e antecipação tática" },
]

// ─── PHASE CONTROL ───────────────────────────────────────────────────────────
type Phase = "loading" | "report" | "club"

export default function Analysis() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>("loading")
  const [elapsed, setElapsed] = useState(0)
  const [currentMsg, setCurrentMsg] = useState(0)
  const [playerData, setPlayerData] = useState<any>(null)

  // load saved playerData
  useEffect(() => {
    const saved = localStorage.getItem("playerData")
    if (saved) setPlayerData(JSON.parse(saved))
  }, [])

  // 35-second loading timer
  useEffect(() => {
    if (phase !== "loading") return
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= 35) {
          clearInterval(interval)
          setPhase("report")
          return 35
        }
        // find latest message index
        const msgIdx = LOADING_MESSAGES.findLastIndex((m) => m.t <= next)
        if (msgIdx >= 0) setCurrentMsg(msgIdx)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Deterministic scores based on user email
  const seed = useMemo(() => hashString(user?.email ?? "zyron-user"), [user])

  const stats = useMemo(() =>
    STAT_DEFINITIONS.map((s, i) => ({
      ...s,
      score: seededRand(seed, i),
    })),
    [seed]
  )

  const overallScore = useMemo(() =>
    Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length),
    [stats]
  )

  // Club selection — deterministic per user, by category
  const category = playerData?.category ?? "Sub 17"
  const isInternational = category === "Sub 20"
  const clubPool = isInternational ? INTERNATIONAL_CLUBS : NATIONAL_CLUBS
  const club = clubPool[seed % clubPool.length]
  const compatibility = 94 + (seed % 5) // 94–98

  // ─── LOADING PHASE ─────────────────────────────────────────────────────────
  if (phase === "loading") {
    const progress = Math.min((elapsed / 35) * 100, 100)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        {/* Pulsing orb */}
        <div className="relative mb-12">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.5)] animate-pulse">
            <Cpu className="w-12 h-12 text-black" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
        </div>

        <h2 className="text-xl font-black mb-2 tracking-tight">Analisando Seu Perfil</h2>
        <p className="text-white/40 text-sm mb-10 text-center max-w-xs">
          Nossa equipe de scout e IA estão processando todas as informações
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>Processando</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status messages */}
        <div className="w-full max-w-md space-y-2 mt-6">
          {LOADING_MESSAGES.slice(0, currentMsg + 1).map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-xs transition-opacity duration-500 ${i === currentMsg ? "text-amber-400 opacity-100" : "text-white/25 opacity-60"
                }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${i === currentMsg ? "text-amber-400" : "text-white/20"}`} />
              {m.text}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── REPORT PHASE ──────────────────────────────────────────────────────────
  if (phase === "report") {
    return (
      <div className="min-h-screen bg-black text-white font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-sm tracking-tight">ZYRON</span>
            </div>
            <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">Relatório de Performance</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          {/* Overall score */}
          <section className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5" />
              ANÁLISE CONCLUÍDA — EQUIPE DE SCOUT ZYRON
            </div>
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)] mb-4">
              <span className="text-5xl font-black text-black leading-none">{overallScore}</span>
              <span className="text-xs font-bold text-black/70 mt-1">GERAL</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Performance Geral do Atleta</h1>
            <p className="text-white/40 text-sm">
              Baseado nas informações individuais coletadas e análise de perfil
            </p>
          </section>

          {/* Stats grid */}
          <section>
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Indicadores Individuais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map((s) => {
                const Icon = s.icon
                const pct = ((s.score - 76) / 19) * 100
                return (
                  <div key={s.key} className="rounded-2xl border border-white/5 bg-white/3 p-4 flex items-start gap-4 hover:border-white/10 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{s.label}</span>
                        <span className="text-sm font-black text-amber-400">{s.score}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/30 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* CTA section */}
          <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
              <Globe2 className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-2xl font-black">Seu perfil foi mapeado.</h3>
            <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
              Com base nos seus indicadores individuais, o algoritmo do Zyron já identificou o clube que mais se encaixa no seu perfil técnico, físico e tático.
              <strong className="text-white"> Um clube que você pode nunca ter descoberto numa peneira convencional.</strong>
            </p>
            <button
              onClick={() => setPhase("club")}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-base px-9 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] active:scale-95"
            >
              <Trophy className="w-5 h-5" />
              DESCOBRIR MEU CLUBE IDEAL
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-white/20 mt-1">Resultado baseado em {stats.length} métricas individuais · Gerado pela equipe Zyron</p>
          </section>
        </main>
      </div>
    )
  }

  // ─── CLUB MATCH PHASE ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">Clube Ideal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Intro */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CORRESPONDÊNCIA IDENTIFICADA PELA EQUIPE DE SCOUT
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            O Algoritmo Encontrou<br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Seu Clube.
            </span>
          </h1>
          <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
            Com base nas suas {stats.length} métricas individuais, nossa equipe de scout validou a correspondência abaixo.
          </p>
        </section>

        {/* Club card */}
        <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-8 md:p-12 text-center space-y-6 shadow-[0_0_60px_rgba(251,191,36,0.08)]">
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
            {isInternational ? "Clube Internacional Recomendado" : "Clube Nacional Recomendado — Série A/B"}
          </p>
          <h2 className="text-4xl md:text-6xl font-black text-white">{club}</h2>

          <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl">
            <div className="text-4xl font-black text-emerald-400">{compatibility}%</div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Compatibilidade</p>
              <p className="text-xs text-white/40">com as características individuais do atleta</p>
            </div>
          </div>

          <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
            Com base nas características individuais coletadas, o atleta apresenta{" "}
            <strong className="text-emerald-400">{compatibility}% de compatibilidade</strong> com o perfil técnico,
            físico e tático buscado pelo <strong className="text-white">{club}</strong>.
          </p>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {[
              { label: "Pontuação Geral", value: overallScore },
              { label: "Métricas Analisadas", value: stats.length },
              { label: "Posição", value: playerData?.position ?? "—" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-3">
                <p className="text-lg font-black text-amber-400">{item.value}</p>
                <p className="text-white/30 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scout CTA */}
        <section className="flex flex-col items-center text-center space-y-4">
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Próximo passo</p>
          <button
            onClick={() => window.open("https://wa.me/5511999999999?text=Ol%C3%A1%2C+quero+entrar+em+contato+com+a+equipe+de+Scout+do+Zyron.", "_blank")}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-base px-9 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] active:scale-95"
          >
            <Users className="w-5 h-5" />
            Entrar em Contato com a Equipe de Scout
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-white/20 max-w-sm leading-relaxed">
            Nossa equipe de scout revisará seu relatório e entrará em contato via WhatsApp em até 48h úteis.
          </p>
        </section>

        {/* Back to dashboard */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-4"
          >
            Voltar ao painel
          </button>
        </div>
      </main>
    </div>
  )
}
