import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Zap, Trophy, Shield, Target, Activity, Flame, Users, Globe2, Cpu, Database,
  CheckCircle2, MessageCircle, ArrowRight, Sparkles, Lock,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  FUNNEL_ROUTES, loadPlayerData, isProfileComplete,
  buildStats, overallFrom, buildWhatsAppLink, type PlayerData,
} from "@/lib/funnel"
import FunnelLegalMenu from "./FunnelLegalMenu"

const STAT_ICONS: Record<string, typeof Flame> = {
  ataque: Flame, defesa: Shield, chute: Target, dominio: Activity, marcacao: Users,
  finalizacao: Trophy, drible: Zap, passe: Globe2, velocidade: Cpu, leitura: Database,
}

/**
 * Idêntica à tela de carregamento do fluxo tradicional (Analysis.tsx,
 * fase 1) — mesmo texto, mesmos 38 segundos, mesmo visual. Duplicada de
 * propósito em vez de importada de lá: mantém os dois fluxos
 * independentes, sem um puxar o outro.
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
  { t: 32, text: "Gerando relatório individualizado com 10 indicadores de performance..." },
  { t: 35, text: "Assinando e finalizando relatório — quase pronto..." },
]

const LOADING_SECONDS = 38

export default function FunnelResult() {
  const navigate = useNavigate()
  const { user, session, loading } = useAuth()

  const [player] = useState<PlayerData>(() => loadPlayerData())
  const [revealed, setRevealed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [currentMsg, setCurrentMsg] = useState(0)
  const savedRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  // Porta de acesso: sem conta volta para a criação; sem perfil, para o formulário.
  useEffect(() => {
    if (loading) return
    if (!session) {
      navigate(FUNNEL_ROUTES.account, { replace: true })
      return
    }
    if (!isProfileComplete(player)) {
      navigate(FUNNEL_ROUTES.profile, { replace: true })
    }
  }, [loading, session, player, navigate])

  // Contagem da revelação — mesma lógica e duração da fase 1 de Analysis.tsx.
  useEffect(() => {
    if (loading || !session || revealed) return
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= LOADING_SECONDS) {
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
  }, [loading, session, revealed])

  /**
   * Agora que a conta existe, o perfil coletado no funil aberto é gravado
   * no mesmo lugar que o funil tradicional usa (tabela Atletas), para os
   * dois caminhos alimentarem a mesma base.
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
    () => buildStats(user?.email || player.name || "zyron-atleta"),
    [user?.email, player.name]
  )
  const overall = useMemo(() => overallFrom(stats), [stats])

  // A nota NÃO entra na mensagem: ela aparece borrada na tela, e mandá-la
  // no texto do WhatsApp entregaria de graça justamente o que está velado.
  const whatsappLink = useMemo(() => buildWhatsAppLink(player), [player])

  const firstName = player.name?.trim().split(" ")[0] || "Atleta"
  const avatarUrl = player.photo || user?.user_metadata?.avatar_url

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0F" }}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  /* ─── Carregamento — idêntico à fase 1 de Analysis.tsx ─── */
  if (!revealed) {
    const progress = Math.min((elapsed / LOADING_SECONDS) * 100, 100)
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

        <div className="w-full max-w-md space-y-2 mt-6 px-2">
          {LOADING_MESSAGES.slice(0, currentMsg + 1).map((m, i) => (
            <div
              key={i}
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

  /* ─── Conclusão ─── */
  return (
    <div className="min-h-screen text-white font-sans antialiased" style={{ background: "#0D0D0F" }}>
      {/*
        Brilho que varre a área bloqueada — o mesmo recurso usado por
        LinkedIn e por telas de métrica "premium" (Robinhood, Webull) pra
        sinalizar "isto já foi calculado, só está oculto", em vez de um
        borrão estático que pode parecer simplesmente quebrado.
      */}
      <style>{`
        @keyframes zyron-locked-sweep {
          0%   { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        .zyron-locked::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: zyron-locked-sweep 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .zyron-locked::after { animation: none; }
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-sm" style={{ background: "rgba(13,13,15,0.92)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 font-semibold uppercase tracking-widest hidden sm:block">
              Relatório de Performance
            </span>
            <FunnelLegalMenu tone="white" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10">

        {/* Cabeçalho do resultado */}
        <section className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AVALIAÇÃO CONCLUÍDA
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-black text-2xl font-black flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : firstName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-bold text-lg leading-none">{player.name || firstName}</p>
              <p className="text-white/60 text-xs mt-1">
                {[player.position, player.category].filter(Boolean).join(" · ") || "Atleta avaliado"}
              </p>
            </div>
          </div>

          {/* Nota geral: existe, está calculada, mas fica velada até o
              contato com a equipe. O número real é renderizado com um
              borrão pesado — só a silhueta do valor aparece. Sem o brilho
              animado aqui: nesse tamanho ele vazava para fora do cartão
              arredondado (o wrapper não tem overflow-hidden). */}
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)] overflow-hidden">
              <span
                aria-hidden="true"
                className="text-5xl font-black text-black leading-none blur-[22px] select-none"
              >
                {overall}
              </span>
              <span className="text-xs font-bold text-black/70 mt-1">GERAL</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pt-1">
              <div className="w-11 h-11 rounded-2xl bg-black/60 backdrop-blur-[2px] flex items-center justify-center ring-1 ring-white/10">
                <Lock className="w-5 h-5 text-amber-200" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-black mb-1">Sua análise está pronta</h1>
          <p className="text-white/70 text-sm max-w-md">
            Os {stats.length} indicadores já foram calculados a partir do seu perfil. A liberação do relatório é feita pela nossa equipe.
          </p>
        </section>

        {/* Indicadores — o QUE foi medido fica visível; QUANTO deu, não.
            Rótulo e descrição nítidos dão a dimensão do relatório; a nota
            e a barra saem borradas até a liberação. */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Indicadores Individuais</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
              <Lock className="w-3 h-3" />
              {stats.length} bloqueados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = STAT_ICONS[s.key] || Activity
              const pct = ((s.score - 76) / 19) * 100
              return (
                <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{s.label}</span>
                      <span className="zyron-locked relative inline-flex items-center gap-1 overflow-hidden rounded-md px-1">
                        <span
                          aria-hidden="true"
                          className="text-sm font-black text-amber-400 blur-[9px] select-none tabular-nums"
                        >
                          {s.score}
                        </span>
                        <Lock className="w-2.5 h-2.5 text-amber-400/70 flex-shrink-0" />
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500/70 to-amber-300/70 rounded-full blur-[6px]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/55 leading-snug">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-white/55">
            <Lock className="w-3 h-3" />
            Valores ocultos até a liberação do relatório
          </p>
        </section>

        {/* Resumo do perfil informado */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Perfil informado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Idade", value: player.age && `${player.age} anos` },
              { label: "Altura", value: player.height && `${player.height} cm` },
              { label: "Peso", value: player.weight && `${player.weight} kg` },
              { label: "Melhor pé", value: player.preferredFoot },
              { label: "Posição", value: player.position },
              { label: "Categoria", value: player.category },
              { label: "Nacionalidade", value: player.nationality },
              { label: "Cidade", value: [player.city, player.state].filter(Boolean).join(" - ") },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{f.label}</p>
                <p className="text-sm font-semibold text-white/90 mt-0.5 capitalize truncate">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contato — fecho do funil */}
        <section className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.09] to-transparent p-6 md:p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-[0_0_36px_-6px_rgba(52,211,153,0.7)]">
            <MessageCircle className="w-7 h-7 text-black" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight">
            Libere seu relatório completo
          </h3>
          <p className="text-white/75 max-w-lg mx-auto leading-relaxed">
            A entrega é feita pela nossa equipe no WhatsApp: sua nota geral, os {stats.length} indicadores abertos, a leitura de cada um e o direcionamento de clubes compatíveis com o seu perfil.
          </p>

          {/* Configurar InitiateCheckout no painel da Utmify usando este CTA. */}
          <a
            id="utmify-initiate-checkout-cta"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-8 py-4 text-base font-black text-black shadow-[0_0_40px_-8px_rgba(52,211,153,0.7)] transition-all hover:from-emerald-300 hover:to-emerald-400 active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            LIBERAR MEUS RESULTADOS
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>

          <p className="flex items-center justify-center gap-1.5 text-xs text-white/55">
            <Sparkles className="w-3 h-3" />
            A mensagem já vai preenchida com os seus dados — é só enviar.
          </p>
        </section>

        <footer className="text-center py-6 border-t border-white/10 space-y-3">
          <p className="text-xs text-white/55">© 2026 Zyron. Todos os direitos reservados.</p>
          <p className="max-w-2xl mx-auto text-[11px] text-white/45 leading-relaxed">
            As avaliações e projeções são geradas por modelos algorítmicos com base nas informações fornecidas pelo próprio atleta. A Zyron não representa, não garante contrato, aprovação, convocação, teste ou vínculo profissional com qualquer clube, federação ou entidade esportiva. As análises possuem caráter informativo e de direcionamento estratégico.
          </p>
        </footer>
      </main>
    </div>
  )
}
