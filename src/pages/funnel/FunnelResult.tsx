import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Zap, Trophy, Shield, Target, Activity, Flame, Users, Globe2, Cpu, Database,
  CheckCircle2, ArrowRight, Lock, Home,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  FUNNEL_ROUTES, loadPlayerData, isProfileComplete,
  buildStats, overallFrom, buildWhatsAppLink, type PlayerData,
} from "@/lib/funnel"
import { buildAccountSeed, buildAnonymousSeed, getClientIp } from "@/lib/resultIdentity"
import FunnelLegalMenu from "./FunnelLegalMenu"
import MysteryClubOpportunity from "./MysteryClubOpportunity"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import "./funnel.css"

const STAT_ICONS: Record<string, typeof Flame> = {
  ataque: Flame, defesa: Shield, chute: Target, dominio: Activity, marcacao: Users,
  finalizacao: Trophy, drible: Zap, passe: Globe2, velocidade: Cpu, leitura: Database,
}

/**
 * Mantém os 38 segundos da análise existente. Apenas a apresentação e
 * a nomenclatura mudam; o cálculo dos indicadores fica em buildStats.
 */
const LOADING_MESSAGES = [
  { t: 0, text: "Inicializando módulo de análise de vídeo biométrico..." },
  { t: 4, text: "Extraindo frames e isolando ações técnicas individuais..." },
  { t: 8, text: "Mapeando biomecânica de aceleração e domínio sob pressão..." },
  { t: 12, text: "Cruzando dados com banco de 12.400 perfis de atletas catalogados..." },
  { t: 16, text: "Aplicando modelos de análise tática e leitura de jogo em espaços curtos..." },
  { t: 20, text: "Calculando índices de finalização, velocidade e explosão física..." },
  { t: 24, text: "Encaminhando perfil técnico-físico para revisão da equipe de Scout Zyron..." },
  { t: 28, text: "Scout especializado com 14 anos de mercado validando os dados..." },
  { t: 32, text: "Organizando pontos a melhorar e oportunidades a partir dos 10 indicadores..." },
  { t: 35, text: "Finalizando o perfil de jogadores compatíveis — quase pronto..." },
]

const LOADING_SECONDS = 38

export default function FunnelResult() {
  const navigate = useNavigate()
  const { user, session } = useAuth()

  const [player] = useState<PlayerData>(() => loadPlayerData())
  const [revealed, setRevealed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [currentMsg, setCurrentMsg] = useState(0)
  const [resultSeed, setResultSeed] = useState<string | null>(null)
  const savedRef = useRef(false)
  const newestMessageRef = useRef<HTMLDivElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const profileComplete = isProfileComplete(player)

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  /**
   * A mesma pessoa precisa ver sempre o mesmo resultado, mesmo preenchendo
   * o formulário de novo — por isso a seed não usa o texto digitado direto.
   * Com conta, o id já garante unicidade. Sem conta (o caso comum aqui,
   * já que o funil aberto não exige login), IP + telefone substituem o
   * texto livre. Roda em paralelo aos 38s de loading, então o resultado já
   * está pronto quando a contagem termina.
   */
  useEffect(() => {
    if (!profileComplete) return
    let cancelled = false

    if (user?.id) {
      setResultSeed(buildAccountSeed(user.id))
      return
    }

    getClientIp().then((ip) => {
      if (cancelled) return
      setResultSeed(buildAnonymousSeed(ip, { phone: player.phone, name: player.name }))
    })
    return () => { cancelled = true }
  }, [profileComplete, user?.id, player.phone, player.name])

  // Só os dados do perfil são necessários; autenticação nunca bloqueia a análise.
  useEffect(() => {
    if (!profileComplete) {
      navigate(FUNNEL_ROUTES.profile, { replace: true })
    }
  }, [profileComplete, navigate])

  // Contagem da revelação — mesma lógica e duração da fase 1 de Analysis.tsx.
  // Só revela quando a seed do resultado também estiver pronta: em rede
  // lenta, a resolução do IP pode passar dos 38s, e revelar antes disso
  // mostraria os indicadores zerados por um instante.
  useEffect(() => {
    if (!profileComplete || revealed) return
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= LOADING_SECONDS) {
          if (!resultSeed) return e
          clearInterval(id)
          setRevealed(true)
          return LOADING_SECONDS
        }
        let msgIdx = 0
        for (let i = 0; i < LOADING_MESSAGES.length; i++) {
          if (LOADING_MESSAGES[i].t <= next) msgIdx = i
        }
        setCurrentMsg(msgIdx)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [profileComplete, revealed, resultSeed])

  useEffect(() => {
    if (revealed || !profileComplete) return
    newestMessageRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [currentMsg, revealed, profileComplete])

  useEffect(() => {
    if (!revealed) return
    window.scrollTo({ top: 0, behavior: 'auto' })
    resultHeadingRef.current?.focus({ preventScroll: true })
  }, [revealed])

  /**
   * Quem já está logado continua com a gravação em Atletas. Visitantes
   * anônimos já têm o contato salvo no formulário e veem o mesmo resultado.
   */
  useEffect(() => {
    if (!session || !user || savedRef.current || !isProfileComplete(player)) return
    savedRef.current = true

    const persist = async () => {
      const payload = {
        user_id: user.id,
        nome: player.name,
        idade: parseInt(player.age),
        altura: parseFloat(player.height),
        peso: parseFloat(player.weight),
        melhor_pe: player.preferredFoot,
        nacionalidade: player.nationality,
        posicao: player.position,
        cidade: player.city,
      }

      try {
        const { data: rows } = await supabase
          .from("Atletas")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const existing = rows?.[0]
        if (existing) {
          await supabase.from("Atletas").update(payload).eq("id", existing.id)
        } else {
          await supabase.from("Atletas").insert([payload])
        }
      } catch (err) {
        // Falha de gravação não pode bloquear a entrega do resultado.
        console.error("Falha ao salvar perfil do funil aberto:", err)
      }
    }

    persist()
  }, [session, user, player])

  const stats = useMemo(
    () => buildStats(resultSeed ?? "zyron-atleta"),
    [resultSeed]
  )
  const overall = useMemo(() => overallFrom(stats), [stats])

  // A nota NÃO entra na mensagem: ela aparece borrada na tela, e mandá-la
  // no texto do WhatsApp entregaria de graça justamente o que está velado.
  const whatsappLink = useMemo(() => buildWhatsAppLink(player), [player])

  const firstName = player.name?.trim().split(" ")[0] || "Atleta"
  const avatarUrl = player.photo || user?.user_metadata?.avatar_url

  if (!profileComplete) {
    return (
      <div className="evaluation-funnel min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  /* Análise pública, com acompanhamento automático das novas mensagens. */
  if (!revealed) {
    const progress = Math.min((elapsed / LOADING_SECONDS) * 100, 100)
    return (
      <div className="evaluation-funnel min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 text-foreground">
        <div className="relative mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.5)] animate-pulse">
            <Cpu className="w-12 h-12 text-black" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
        </div>

        <h1 className="text-xl font-black mb-1 tracking-tight text-center">Análise em andamento</h1>
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

        <div className="w-full max-w-md space-y-3 mt-6 px-2" role="log" aria-label="Etapas da análise" aria-live="polite" aria-relevant="additions">
          {LOADING_MESSAGES.slice(0, currentMsg + 1).map((m, i) => (
            <div
              key={i}
              ref={i === currentMsg ? newestMessageRef : undefined}
              style={{ scrollMarginBottom: '24px' }}
              className={`flex items-start gap-3 text-xs transition-all duration-500 ${i === currentMsg ? "text-amber-400 opacity-100" : "text-white/25 opacity-60"
                }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${i === currentMsg ? "text-amber-400" : "text-white/20"}`} />
              <span className="leading-relaxed">{m.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* Quatro blocos principais, na ordem do funil. Os valores continuam censurados. */
  return (
    <div className="evaluation-funnel min-h-screen bg-background text-foreground font-sans antialiased">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-golden flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-accent-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest hidden sm:block">Sua avaliação</span>
            <FunnelLegalMenu />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <section aria-labelledby="evaluation-ready" className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary mb-6">
            <CheckCircle2 className="w-3.5 h-3.5" /> AVALIAÇÃO CONCLUÍDA
          </div>
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-golden text-accent-foreground text-2xl font-black shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : firstName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-bold text-lg leading-none">{player.name || firstName}</p>
              <p className="text-muted-foreground text-xs mt-1">{[player.position, player.category].filter(Boolean).join(" · ") || "Atleta avaliado"}</p>
            </div>
          </div>

          <div className="relative w-32 h-32 mb-5" aria-label="Nota geral: valor reservado">
            <div className="absolute inset-0 rounded-3xl bg-gradient-golden flex flex-col items-center justify-center overflow-hidden">
              <span aria-hidden="true" className="text-5xl font-black text-accent-foreground leading-none blur-[22px] select-none">{overall}</span>
              <span className="text-xs font-bold text-accent-foreground/70 mt-1">GERAL</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pt-1">
              <div className="w-11 h-11 rounded-2xl bg-background/70 flex items-center justify-center ring-1 ring-foreground/10">
                <Lock className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>

          <h1 id="evaluation-ready" ref={resultHeadingRef} tabIndex={-1} className="text-2xl md:text-3xl font-black mb-3 focus:outline-none">Sua análise está pronta</h1>
          <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
            Seus {stats.length} indicadores estão organizados em <strong className="text-foreground">Pontos a melhorar</strong>, <strong className="text-foreground">Oportunidades</strong> e <strong className="text-foreground">Perfil de jogadores compatíveis</strong>.
          </p>
          <div className="mt-6 w-full max-w-xl"><MysteryClubOpportunity player={player} compact /></div>
        </section>

        <section aria-labelledby="release-results" className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-5 sm:p-8 text-center space-y-5">
          <h2 id="release-results" className="text-2xl md:text-3xl font-black tracking-tight">Libere seus resultados completos</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Converse com nossa equipe para receber os pontos a melhorar, as oportunidades, os perfis de jogadores compatíveis e a leitura dos seus {stats.length} indicadores.
          </p>
          {/* Seletor e destino do InitiateCheckout da Utmify preservados. */}
          <a
            id="utmify-initiate-checkout-cta"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby="whatsapp-notice"
            className="funnel-whatsapp-cta group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl px-5 sm:px-7 py-4 text-base font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <WhatsAppIcon className="w-6 h-6 shrink-0" />
            <span>Liberar resultados pelo WhatsApp</span>
            <ArrowRight className="w-5 h-5 shrink-0 hidden sm:block" />
          </a>
          <p id="whatsapp-notice" className="text-sm font-medium text-foreground">
            Ao clicar, o WhatsApp abre com sua mensagem pronta. É só enviar.
          </p>
        </section>

        <section aria-labelledby="potential-club" className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Oportunidades</p>
            <h2 id="potential-club" className="text-xl sm:text-2xl font-black tracking-tight">Um time que se encaixa com o seu perfil</h2>
            <p className="mt-2 text-sm text-muted-foreground">Conheça os detalhes do possível encaixe ao falar com nossa equipe.</p>
          </div>
          <MysteryClubOpportunity player={player} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article aria-labelledby="improvement-points" className="rounded-2xl border border-border bg-card p-5">
              <Target className="w-5 h-5 text-accent mb-3" />
              <h3 id="improvement-points" className="font-bold mb-2">Pontos a melhorar</h3>
              <p className="text-xs leading-relaxed text-muted-foreground mb-4">Fundamentos com maior espaço de evolução entre os seus indicadores.</p>
              <div className="space-y-2">
                {[...stats].sort((a, b) => a.score - b.score).slice(0, 3).map(stat => (
                  <div key={stat.key} className="funnel-censored flex items-center justify-between rounded-lg bg-muted p-2.5" aria-label="Ponto a melhorar: detalhes reservados">
                    <span aria-hidden="true" className="blur-[7px] select-none text-sm font-semibold">{stat.label}</span>
                    <Lock className="w-3.5 h-3.5 text-accent" />
                  </div>
                ))}
              </div>
            </article>
            <article aria-labelledby="compatible-players" className="rounded-2xl border border-border bg-card p-5">
              <Users className="w-5 h-5 text-accent mb-3" />
              <h3 id="compatible-players" className="font-bold mb-2">Perfil de jogadores compatíveis</h3>
              <p className="text-xs leading-relaxed text-muted-foreground mb-4">Jogadores com um tipo de perfil próximo ao seu: posição, categoria e características técnicas.</p>
              <div className="space-y-2">
                {[
                  { label: "Posição", value: player.position },
                  { label: "Categoria", value: player.category },
                  { label: "Característica técnica", value: [...stats].sort((a, b) => b.score - a.score)[0].label },
                ].map(item => (
                  <div key={item.label} className="funnel-censored flex items-center justify-between rounded-lg bg-muted p-2.5" aria-label={item.label + ": detalhes reservados"}>
                    <span aria-hidden="true" className="blur-[7px] select-none text-sm font-semibold">{item.value}</span>
                    <Lock className="w-3.5 h-3.5 text-accent" />
                  </div>
                ))}
              </div>
            </article>
          </div>
          <details className="rounded-2xl border border-border bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold">Perfil informado</summary>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {[
                { label: "Idade", value: player.age && player.age + " anos" },
                { label: "Altura", value: player.height && player.height + " cm" },
                { label: "Peso", value: player.weight && player.weight + " kg" },
                { label: "Melhor pé", value: player.preferredFoot },
                { label: "Posição", value: player.position },
                { label: "Categoria", value: player.category },
                { label: "Nacionalidade", value: player.nationality },
                { label: "Cidade", value: [player.city, player.state].filter(Boolean).join(" - ") },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className="min-w-0 rounded-xl bg-muted px-3 py-2.5">
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm font-semibold mt-0.5 capitalize break-words">{item.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </section>

        <section aria-labelledby="individual-indicators">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 id="individual-indicators" className="text-lg font-bold">Indicadores individuais</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
              <Lock className="w-3 h-3" />{stats.length} reservados
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map(stat => {
              const Icon = STAT_ICONS[stat.key] || Activity
              const pct = ((stat.score - 76) / 19) * 100
              return (
                <div key={stat.key} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{stat.label}</span>
                      <span className="funnel-censored inline-flex items-center gap-1 rounded-md px-1" aria-label="Nota reservada">
                        <span aria-hidden="true" className="text-sm font-black text-accent blur-[9px] select-none tabular-nums">{stat.score}</span>
                        <Lock className="w-2.5 h-2.5 text-accent" />
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-1.5" aria-hidden="true">
                      <div className="h-full bg-gradient-golden rounded-full blur-[6px]" style={{ width: pct + "%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{stat.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Receba a leitura completa dos indicadores pelo WhatsApp.</p>
        </section>

        <footer className="text-center py-6 border-t border-border space-y-3">
          {/* Leva ao início do funil, não a "/": a raiz cai no dashboard, que é
              protegido, e o visitante do funil não está autenticado. */}
          <button
            type="button"
            onClick={() => navigate(FUNNEL_ROUTES.home)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <p className="text-xs text-muted-foreground">© 2026 Zyron. Todos os direitos reservados.</p>
          <p className="max-w-2xl mx-auto text-[11px] text-muted-foreground leading-relaxed">
            As avaliações e projeções são geradas por modelos algorítmicos com base nas informações fornecidas pelo próprio atleta. A Zyron não representa, não garante contrato, aprovação, convocação, teste ou vínculo profissional com qualquer clube, federação ou entidade esportiva. As análises possuem caráter informativo e de direcionamento estratégico.
          </p>
        </footer>
      </main>
    </div>
  )
}
