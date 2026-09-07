import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Zap, Trophy, Shield, Target, Activity, Flame, Users, Globe2, Cpu, Database,
  Star, CheckCircle2, MessageCircle, ArrowRight, Sparkles,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  FUNNEL_ROUTES, loadPlayerData, isProfileComplete,
  buildStats, overallFrom, buildWhatsAppLink, type PlayerData,
} from "@/lib/funnel"

const STAT_ICONS: Record<string, typeof Flame> = {
  ataque: Flame, defesa: Shield, chute: Target, dominio: Activity, marcacao: Users,
  finalizacao: Trophy, drible: Zap, passe: Globe2, velocidade: Cpu, leitura: Database,
}

const REVEAL_MESSAGES = [
  "Cruzando seu perfil técnico com a base de atletas...",
  "Calculando indicadores individuais de performance...",
  "Consolidando nota geral e assinando o relatório...",
]

const REVEAL_SECONDS = 4

export default function FunnelResult() {
  const navigate = useNavigate()
  const { user, session, loading } = useAuth()

  const [player] = useState<PlayerData>(() => loadPlayerData())
  const [revealed, setRevealed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
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

  // Contagem da revelação
  useEffect(() => {
    if (loading || !session || revealed) return
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= REVEAL_SECONDS) {
          clearInterval(id)
          setRevealed(true)
          return REVEAL_SECONDS
        }
        return e + 1
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
  const whatsappLink = useMemo(() => buildWhatsAppLink(player, overall), [player, overall])

  const firstName = player.name?.trim().split(" ")[0] || "Atleta"
  const avatarUrl = player.photo || user?.user_metadata?.avatar_url

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0F" }}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  /* ─── Revelação curta antes do resultado ─── */
  if (!revealed) {
    const progress = Math.min((elapsed / REVEAL_SECONDS) * 100, 100)
    const msgIndex = Math.min(Math.floor((elapsed / REVEAL_SECONDS) * REVEAL_MESSAGES.length), REVEAL_MESSAGES.length - 1)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white" style={{ background: "#0D0D0F" }}>
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_70px_rgba(251,191,36,0.45)] animate-pulse">
            <Cpu className="w-10 h-10 text-black" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
        </div>
        <h2 className="text-xl font-black mb-1 text-center">Liberando seu relatório, {firstName}</h2>
        <p className="text-white/60 text-sm mb-8 text-center max-w-xs">{REVEAL_MESSAGES[msgIndex]}</p>
        <div className="w-full max-w-sm">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    )
  }

  /* ─── Conclusão ─── */
  return (
    <div className="min-h-screen text-white font-sans antialiased" style={{ background: "#0D0D0F" }}>
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-sm" style={{ background: "rgba(13,13,15,0.92)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <span className="text-xs text-white/60 font-semibold uppercase tracking-widest hidden sm:block">
            Relatório de Performance
          </span>
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

          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)] mb-4">
            <span className="text-5xl font-black text-black leading-none">{overall}</span>
            <span className="text-xs font-bold text-black/70 mt-1">GERAL</span>
          </div>
          <h1 className="text-2xl font-black mb-1">Performance Geral do Atleta</h1>
          <p className="text-white/60 text-sm max-w-md">
            Baseado nas informações individuais que você informou e na análise do seu perfil técnico.
          </p>
        </section>

        {/* Indicadores */}
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Indicadores Individuais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = STAT_ICONS[s.key] || Activity
              const pct = ((s.score - 76) / 19) * 100
              return (
                <div key={s.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-start gap-4 transition-all hover:border-amber-400/30">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{s.label}</span>
                      <span className="text-sm font-black text-amber-400">{s.score}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-white/55 leading-snug">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
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
            Fale com a equipe Zyron
          </h3>
          <p className="text-white/75 max-w-lg mx-auto leading-relaxed">
            Seu relatório completo, com a leitura detalhada de cada indicador e o direcionamento de clubes compatíveis com o seu perfil, é entregue pela nossa equipe no WhatsApp.
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-8 py-4 text-base font-black text-black shadow-[0_0_40px_-8px_rgba(52,211,153,0.7)] transition-all hover:from-emerald-300 hover:to-emerald-400 active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            RECEBER MEUS RESULTADOS
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>

          <p className="flex items-center justify-center gap-1.5 text-xs text-white/55">
            <Sparkles className="w-3 h-3" />
            A mensagem já vai preenchida com os seus dados — é só enviar.
          </p>
        </section>

        <section className="text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition-all hover:border-amber-400/40 hover:text-white"
          >
            <Star className="w-4 h-4 text-amber-400" />
            Acessar minha conta na plataforma
          </button>
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
