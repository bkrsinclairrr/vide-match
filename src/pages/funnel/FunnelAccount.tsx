import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Zap, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck,
  CheckCircle2, BarChart3, Trophy,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { FUNNEL_ROUTES, loadPlayerData, isProfileComplete, friendlyAuthError } from "@/lib/funnel"
import { nameSchema, validateCredentials } from "@/lib/security"
import FunnelLegalMenu from "./FunnelLegalMenu"

type Mode = "signup" | "login"

export default function FunnelAccount() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const { toast } = useToast()

  const player = loadPlayerData()
  const firstName = player.name?.trim().split(" ")[0] || "Atleta"

  const [mode, setMode] = useState<Mode>("signup")
  const [name, setName] = useState(player.name || "")
  const [email, setEmail] = useState(player.email || "")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  // Já autenticado (ou acabou de confirmar em outra aba) → segue direto
  useEffect(() => {
    if (!loading && session) navigate(FUNNEL_ROUTES.result, { replace: true })
  }, [loading, session, navigate])

  // Sem perfil preenchido não há resultado para liberar
  useEffect(() => {
    if (!isProfileComplete(player)) navigate(FUNNEL_ROUTES.profile, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToResult = () => navigate(FUNNEL_ROUTES.result, { replace: true })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const credentials = validateCredentials(email, password)
    const validName = nameSchema.safeParse(name.trim())
    if (!credentials || !validName.success) {
      toast({ title: "Dados inválidos", description: "Informe nome válido, e-mail válido e uma senha de 12 a 128 caracteres.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: { full_name: validName.data },
        emailRedirectTo: `${window.location.origin}${FUNNEL_ROUTES.result}`,
      },
    })

    if (error) {
      setIsSubmitting(false)
      toast({ title: "Erro ao criar conta", description: friendlyAuthError(error.message), variant: "destructive" })
      return
    }

    // Fluxo esperado no funil: a sessão já vem pronta, sem passar por
    // confirmação de e-mail (isso é configurado no projeto Supabase, em
    // Authentication → Sign In / Up → "Confirm email" desativado).
    if (data.session) {
      setIsSubmitting(false)
      goToResult()
      return
    }

    setIsSubmitting(false)
    setMode("login")
    toast({
      title: "Conta criada! Confirme seu e-mail.",
      description: "Verifique sua caixa de entrada e entre após confirmar o endereço.",
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const credentials = validateCredentials(email, password)
    if (!credentials) {
      toast({ title: "Dados inválidos", description: "Informe um e-mail válido e uma senha de 12 a 128 caracteres.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword(credentials)
    setIsSubmitting(false)
    if (error) {
      toast({ title: "Erro ao entrar", description: friendlyAuthError(error.message), variant: "destructive" })
      return
    }
    goToResult()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${FUNNEL_ROUTES.result}` },
    })
    if (error) {
      setGoogleLoading(false)
      toast({ title: "Erro ao entrar com Google", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen text-white font-sans antialiased" style={{ background: "#0D0D0F" }}>
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-sm" style={{ background: "rgba(13,13,15,0.92)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(FUNNEL_ROUTES.upload)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.06] hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4 text-white/75" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <FunnelLegalMenu tone="white" />
        </div>
        <div className="h-0.5" style={{ background: "linear-gradient(to right, #FBBF24, #34D399)" }} />
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-8 space-y-6">

        {/* Prova de que o relatório já existe do outro lado da porta */}
        <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Análise concluída, {firstName}</span>
          </div>
          <p className="text-sm text-white/75 leading-relaxed">
            Seu relatório de performance com <strong className="text-white">10 indicadores individuais</strong> está pronto. Crie sua conta para liberar o resultado e guardá-lo no seu perfil.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { icon: BarChart3, label: "10 indicadores" },
              { icon: Trophy, label: "Nota geral" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <Icon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white/85">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          {([["signup", "Criar conta"], ["login", "Já tenho conta"]] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                mode === value ? "bg-amber-400 text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/75">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  className="w-full rounded-xl h-12 pl-10 pr-4 text-base text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all"
                  style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.14)" }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/75">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full rounded-xl h-12 pl-10 pr-4 text-base text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all"
                style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.14)" }}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/75">
              {mode === "signup" ? "Criar senha" : "Senha"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl h-12 pl-10 pr-4 text-base text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all"
                style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.14)" }}
              />
            </div>
            {mode === "signup" && (
              <p className="mt-1.5 text-xs text-white/55">Mínimo de 8 caracteres.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 font-black text-base text-black shadow-[0_0_32px_rgba(251,191,36,0.3)] transition-all hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                {mode === "signup" ? "Criando conta..." : "Entrando..."}
              </>
            ) : (
              <>
                {mode === "signup" ? "Criar conta e ver resultado" : "Entrar e ver resultado"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">ou</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center gap-3 font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Redirecionando..." : "Continuar com Google"}
          </button>
        </form>

        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/65 leading-relaxed">
            Seus dados são usados apenas para gerar e guardar sua avaliação. Ao continuar, você concorda com os{" "}
            <a href="/termos" className="underline underline-offset-2 hover:text-white/85">Termos de Uso</a> e a{" "}
            <a href="/privacidade" className="underline underline-offset-2 hover:text-white/85">Política de Privacidade</a>.
          </p>
        </div>
      </main>
    </div>
  )
}
