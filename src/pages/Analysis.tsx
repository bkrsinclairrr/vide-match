import { useEffect, useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Zap, Trophy, Shield, Target, Activity, Flame,
  ArrowRight, CheckCircle2, Cpu, Database, Globe2, Users, Star,
  ScanSearch, Radar
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
  return 76 + (h % 20)
}

// ─── CLUBS DATA ─────────────────────────────────────────────────────────────
// Sub 6–17 → Brazil only (Série A & B)
const NATIONAL_CLUBS = [
  "Flamengo", "Palmeiras", "Corinthians", "São Paulo FC", "Santos FC",
  "Grêmio", "Internacional", "Atlético Mineiro", "Fluminense", "Vasco da Gama",
  "Athletico Paranaense", "Red Bull Bragantino", "Cruzeiro", "Sport Recife", "Fortaleza EC",
  "Ceará SC", "Bahia", "Coritiba", "América Mineiro", "Goiás EC",
  "Botafogo", "Avaí FC", "Juventude", "Cuiabá EC", "Chapecoense",
  "Ponte Preta", "Criciúma", "Londrina EC", "Náutico", "Sampaio Corrêa",
]

// Sub 20 → International clubs only
const INTERNATIONAL_CLUBS = [
  "West Ham United", "Sevilla FC", "Olympique de Marseille", "AS Roma", "Real Betis",
  "Sporting CP", "Benfica", "FC Porto", "Ajax", "Anderlecht",
  "FC Nantes", "RC Lens", "Valencia CF", "Getafe CF", "Hellas Verona",
  "Galatasaray", "Fenerbahçe", "Club Brugge", "RSC Anderlecht", "Legia Warszawa",
  "Celta de Vigo", "Osasuna", "Villarreal CF", "Girona FC", "Rennes",
  "Toulouse FC", "Standard Liège", "FC Köln", "Hajduk Split", "Panathinaikos",
]

// ─── CLUB BADGE URLs ─────────────────────────────────────────────────────────
// Using Wikipedia article thumbnail CDN (more reliable than raw Wikimedia SVGs)
const BADGE_URLS = [
  "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/West_Ham_United_FC_logo.svg/100px-West_Ham_United_FC_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/100px-Sevilla_FC_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/100px-AS_Roma_logo_%282017%29.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Real_betis_logo.svg/100px-Real_betis_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/SL_Benfica_logo.svg/100px-SL_Benfica_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/FC_Porto.svg/100px-FC_Porto.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/7/79/Ajax_Amsterdam.svg/100px-Ajax_Amsterdam.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Sporting_CP_%28logo%29.svg/100px-Sporting_CP_%28logo%29.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Valencia_CF_Logo.svg/100px-Valencia_CF_Logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/100px-Olympique_Marseille_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/3/38/Santos_fc_logo.png/100px-Santos_fc_logo.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Atletico_mineiro_galo.png/100px-Atletico_mineiro_galo.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/3/31/Footballclub_fluminense.svg/100px-Footballclub_fluminense.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/S%C3%A3o_Paulo_FC.svg/100px-S%C3%A3o_Paulo_FC.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Palmeiras_logo.svg/100px-Palmeiras_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Sport_Club_Corinthians_Paulista_crest.svg/100px-Sport_Club_Corinthians_Paulista_crest.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flamengo_braz_logo.svg/100px-Flamengo_braz_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Gr%C3%AAmio_FBPA.svg/100px-Gr%C3%AAmio_FBPA.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sport_Club_Internacional.svg/100px-Sport_Club_Internacional.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/b/b1/FC_Schalke_04_Logo.svg/100px-FC_Schalke_04_Logo.svg.png",
]

// ─── LOADING MESSAGES — 38 seconds ──────────────────────────────────────────
const LOADING_MESSAGES = [
  { t: 0, text: "Inicializando módulo de análise de vídeo biométrico..." },
  { t: 4, text: "Extraindo frames e isolando ações técnicas individuais..." },
  { t: 8, text: "Mapeando biomecânica de aceleração e domínio sob pressão..." },
  { t: 12, text: "Cruzando dados com banco de 12.400 perfis de atletas catalogados..." },
  { t: 16, text: "Aplicando modelos de análise tática e leitura de jogo em espaços curtos..." },
  { t: 20, text: "Calculando índices de finalização, velocidade e explosão física..." },
  { t: 24, text: "Encaminhando perfil técnico-físico para revisão da equipe de Scout Zyron..." },
  { t: 28, text: "Scout especializado com 14 anos de mercado validando os dados..." },
  { t: 32, text: "Gerando relatório individualizado com 10 indicadores de performance..." },
  { t: 35, text: "Assinando e finalizando relatório — quase pronto..." },
]

// ─── CLUB-LOADING MESSAGES — 16 seconds ─────────────────────────────────────
const CLUB_LOADING_MESSAGES = [
  { t: 0, text: "Conectando ao banco de dados do mercado global de futebol..." },
  { t: 2, text: "Cruzando seus indicadores de Finalização e Drible com demandas reais de clubes..." },
  { t: 5, text: "Filtrando filosofias táticas compatíveis com sua leitura de jogo..." },
  { t: 7, text: "Excluindo elencos com sobreposição na sua posição e faixa etária..." },
  { t: 9, text: "Avaliando projeção de valorização para atletas com seu perfil físico..." },
  { t: 11, text: "Aplicando filtro geográfico e compatibilidade cultural por nacionalidade..." },
  { t: 13, text: "Compatibilidade máxima encontrada. Descriptografando dossiê do clube..." },
  { t: 15, text: "MATCH CONFIRMADO. Preparando entrega do resultado..." },
]

// ─── STAT DEFINITIONS ────────────────────────────────────────────────────────
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

type Phase = "loading" | "report" | "club-loading" | "club"

export default function Analysis() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>("loading")
  const [elapsed, setElapsed] = useState(0)
  const [clubElapsed, setClubElapsed] = useState(0)
  const [currentMsg, setCurrentMsg] = useState(0)
  const [currentClubMsg, setCurrentClubMsg] = useState(0)
  const [playerData, setPlayerData] = useState<any>(null)
  const [badgeIdx, setBadgeIdx] = useState(0)

  // Load saved playerData from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("playerData")
    if (saved) {
      try { setPlayerData(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  // ── Phase 1 timer: 47 seconds ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "loading") return
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= 38) {
          clearInterval(interval)
          setPhase("report")
          return 38
        }
        let msgIdx = 0
        for (let i = 0; i < LOADING_MESSAGES.length; i++) {
          if (LOADING_MESSAGES[i].t <= next) msgIdx = i
        }
        setCurrentMsg(msgIdx)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ── Phase 3 timer: 16 seconds club-loading ────────────────────────────────
  useEffect(() => {
    if (phase !== "club-loading") return
    setClubElapsed(0)
    setCurrentClubMsg(0)
    const interval = setInterval(() => {
      setClubElapsed((e) => {
        const next = e + 1
        if (next >= 16) {
          clearInterval(interval)
          setPhase("club")
          return 16
        }
        let msgIdx = 0
        for (let i = 0; i < CLUB_LOADING_MESSAGES.length; i++) {
          if (CLUB_LOADING_MESSAGES[i].t <= next) msgIdx = i
        }
        setCurrentClubMsg(msgIdx)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ── Badge carousel: cycles every 300ms during club-loading ───────────────
  useEffect(() => {
    if (phase !== "club-loading") return
    const cycle = setInterval(() => {
      setBadgeIdx((i) => (i + 1) % BADGE_URLS.length)
    }, 300)
    return () => clearInterval(cycle)
  }, [phase])

  // ── Deterministic scores based on user email ─────────────────────────────
  const seed = useMemo(() => hashString(user?.email ?? "zyron-user"), [user])

  const stats = useMemo(() =>
    STAT_DEFINITIONS.map((s, i) => ({ ...s, score: seededRand(seed, i) })),
    [seed]
  )

  const overallScore = useMemo(() =>
    Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length),
    [stats]
  )

  // ── Club match: deterministic, segmented by category ─────────────────────
  const { club, isInternational, compatibility } = useMemo(() => {
    const raw = playerData?.category ?? ""
    const isInt = raw.trim() === "Sub 20"
    const pool = isInt ? INTERNATIONAL_CLUBS : NATIONAL_CLUBS
    return {
      club: pool[seed % pool.length],
      isInternational: isInt,
      compatibility: 94 + (seed % 5),
    }
  }, [seed, playerData?.category])

  // Display name: prefer saved playerData name, then user metadata, then email prefix
  const displayName = playerData?.name
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Atleta"
  const firstName = displayName.split(" ")[0]
  const avatarLetter = firstName.charAt(0).toUpperCase()

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1 — ANALYSIS LOADING (47s)
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "loading") {
    const progress = Math.min((elapsed / 38) * 100, 100)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.5)] animate-pulse">
            <Cpu className="w-12 h-12 text-black" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
        </div>

        <h2 className="text-xl font-black mb-1 tracking-tight">Análise de Performance em Andamento</h2>
        <p className="text-white/40 text-sm mb-10 text-center max-w-xs">
          Nossa IA processa o que nenhum olheiro humano conseguiria em uma peneira
        </p>

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

        <div className="w-full max-w-md space-y-2 mt-6">
          {LOADING_MESSAGES.slice(0, currentMsg + 1).map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-xs transition-all duration-500 ${i === currentMsg ? "text-amber-400 opacity-100" : "text-white/25 opacity-60"
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

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2 — PERFORMANCE REPORT
  // ════════════════════════════════════════════════════════════════════════════
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 font-semibold uppercase tracking-widest hidden sm:block">Relatório de Performance</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black ml-2">
                {avatarLetter}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          <section className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5" />
              ANÁLISE CONCLUÍDA — EQUIPE DE SCOUT ZYRON
            </div>
            {/* Avatar + score side by side on small screens, score below on large */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-black text-black shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                {avatarLetter}
              </div>
              <p className="text-white/50 text-sm font-medium">{firstName}</p>
            </div>
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)] mb-4">
              <span className="text-5xl font-black text-black leading-none">{overallScore}</span>
              <span className="text-xs font-bold text-black/70 mt-1">GERAL</span>
            </div>
            <h1 className="text-2xl font-black mb-1">Performance Geral do Atleta</h1>
            <p className="text-white/40 text-sm">Baseado nas informações individuais coletadas e análise de perfil</p>
          </section>

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
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-white/30 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
              <Globe2 className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-2xl font-black">Seu perfil foi mapeado.</h3>
            <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
              Com base nos seus indicadores individuais, o algoritmo do Zyron já identificou o clube que mais se encaixa no seu perfil técnico, físico e tático.
              <strong className="text-white"> Um clube que você jamais teria descoberto numa peneira convencional.</strong>
            </p>
            <button
              onClick={() => setPhase("club-loading")}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-base px-9 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] active:scale-95"
            >
              <Trophy className="w-5 h-5" />
              DESCOBRIR MEU CLUBE IDEAL
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-white/20">Resultado baseado em {stats.length} métricas individuais · Gerado pela equipe Zyron</p>
          </section>
        </main>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 3 — CLUB SEARCH LOADING (16s) — Badge carousel + persuasive copy
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "club-loading") {
    const progress = Math.min((clubElapsed / 16) * 100, 100)
    const isNearEnd = clubElapsed >= 13

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        {/* Pulsing orb with radar rings — no external images */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Radar rings */}
          <div className="absolute w-56 h-56 rounded-full border border-amber-400/8 animate-ping" style={{ animationDuration: "2.5s" }} />
          <div className="absolute w-40 h-40 rounded-full border border-amber-400/12 animate-ping" style={{ animationDuration: "1.8s" }} />
          <div className="absolute w-28 h-28 rounded-full border border-amber-400/18 animate-ping" style={{ animationDuration: "1.2s" }} />
          {/* Centre orb */}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.5)] animate-pulse transition-all duration-1000
            ${isNearEnd
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_80px_rgba(52,211,153,0.5)]"
              : "bg-gradient-to-br from-amber-400 to-amber-600"}`}>
            <Globe2 className="w-10 h-10 text-black" />
          </div>
        </div>

        {/* Scanning icon + status */}
        <div className="flex items-center gap-2 mb-3">
          <ScanSearch className={`w-5 h-5 ${isNearEnd ? "text-emerald-400" : "text-amber-400"} animate-pulse`} />
          <span className={`text-sm font-black tracking-widest uppercase ${isNearEnd ? "text-emerald-400" : "text-amber-400"}`}>
            {isNearEnd ? "Match Encontrado" : "Varrendo Base Global"}
          </span>
        </div>

        <h2 className="text-lg font-black mb-1 text-center max-w-xs">
          {isNearEnd ? "Finalizando Dossiê..." : "Filtrando Clubes no Mundo Inteiro"}
        </h2>
        <p className="text-white/30 text-xs mb-8 text-center max-w-xs">
          {isNearEnd
            ? "Preparando entrega do resultado exclusivo para você"
            : "Analisando dezenas de clubes antes de revelar o match perfeito"}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-sm mb-6">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isNearEnd ? "bg-emerald-400" : "bg-gradient-to-r from-amber-500 to-amber-300"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scrolling status messages */}
        <div className="w-full max-w-md space-y-2">
          {CLUB_LOADING_MESSAGES.slice(0, currentClubMsg + 1).map((m, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-xs transition-all duration-500 ${i === currentClubMsg
                ? isNearEnd ? "text-emerald-400 opacity-100" : "text-amber-400 opacity-100"
                : "text-white/20 opacity-50"
                }`}
            >
              <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${i === currentClubMsg ? (isNearEnd ? "text-emerald-400" : "text-amber-400") : "text-white/15"}`} />
              {m.text}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 4 — CLUB MATCH RESULT
  // ════════════════════════════════════════════════════════════════════════════
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-semibold uppercase tracking-widest hidden sm:block">Clube Ideal</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black ml-2">
              {avatarLetter}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CORRESPONDÊNCIA IDENTIFICADA PELA EQUIPE DE SCOUT
          </div>
          {/* Avatar personalizado */}
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-black text-black shadow-[0_0_40px_rgba(251,191,36,0.3)] ring-4 ring-amber-400/20">
              {avatarLetter}
            </div>
            <p className="text-white/40 text-xs mt-1">{firstName}</p>
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
