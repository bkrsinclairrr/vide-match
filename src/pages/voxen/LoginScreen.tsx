import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, KeyRound, Lock, Mail, User } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { friendlyAuthError } from "@/lib/funnel"
import { VoxenWordmark } from "./ui"

type Mode = "entrar" | "primeiro" | "senha"

const COPY: Record<Mode, [string, string]> = {
  entrar: ["Entrar na VOXEN", "Use o e-mail da sua conta Zyron."],
  primeiro: ["Primeiro acesso", "Crie a sua senha com o mesmo e-mail que você informou para a equipe Zyron."],
  senha: ["Recuperar senha", "Enviamos um link para você criar uma nova senha."],
}

/**
 * Login único da VOXEN: a equipe (admins) cai no painel e o cliente da Zyron
 * cai na própria área (/voxen/cliente). O primeiro acesso é do cliente, que
 * cria a senha com o e-mail que a equipe cadastrou.
 */
export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("entrar")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const go = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    const mail = email.trim().toLowerCase()
    if (mode === "entrar") {
      const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password })
      if (err) setError(friendlyAuthError(err.message))
    } else if (mode === "primeiro") {
      const { data, error: err } = await supabase.auth.signUp({
        email: mail,
        password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/voxen` },
      })
      if (err) setError(friendlyAuthError(err.message))
      else if (!data.session) setNotice("Enviamos um link de confirmação para o seu e-mail. Confirme e volte aqui para entrar.")
    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/reset-password` })
      if (err) setError(friendlyAuthError(err.message))
      else setNotice("Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.")
    }
    setBusy(false)
  }

  const [title, sub] = COPY[mode]

  return (
    <div className="vx-gate relative z-[1]">
      <aside className="vx-gate-art">
        <div className="vx-gate-orbit" aria-hidden="true" />
        <VoxenWordmark size={40} />
        <div className="relative max-w-[540px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-amber-300">Plataforma Zyron</p>
          <h1 className="mt-4 text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            O jogo de cada atleta,{" "}
            <span className="bg-gradient-to-b from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">lido lance a lance.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-zinc-400">
            Vídeos das partidas com cada ação marcada pela equipe, mapa de calor, métricas, evolução jogo a jogo e a
            comparação com perfis de referência da sua posição.
          </p>
        </div>
        <p className="relative text-[12px] text-zinc-500">© 2026 Zyron · Acesso para a equipe e para clientes</p>
      </aside>

      <section className="vx-gate-form">
        <form onSubmit={submit} className="vx-gate-card" noValidate>
          <div className="mb-8 lg:hidden"><VoxenWordmark /></div>
          {mode !== "senha" && (
            <div className="vx-tabs mb-6" role="tablist">
              <button type="button" role="tab" aria-selected={mode === "entrar"} className={`vx-tab ${mode === "entrar" ? "is-on" : ""}`} onClick={() => go("entrar")}>Entrar</button>
              <button type="button" role="tab" aria-selected={mode === "primeiro"} className={`vx-tab ${mode === "primeiro" ? "is-on" : ""}`} onClick={() => go("primeiro")}>Primeiro acesso</button>
            </div>
          )}
          <h2 className="text-[24px] font-bold tracking-[-0.02em]">{title}</h2>
          <p className="mt-1.5 text-[13.5px] text-zinc-400">{sub}</p>

          {mode === "primeiro" && (
            <>
              <label className="mt-6 block text-[12px] font-semibold text-zinc-400" htmlFor="vx-name">Nome</label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="vx-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="vx-input vx-input--icon" placeholder="Seu nome completo" />
              </div>
            </>
          )}

          <label className="mt-6 block text-[12px] font-semibold text-zinc-400" htmlFor="vx-email">E-mail</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input id="vx-email" type="email" autoComplete="username" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="vx-input vx-input--icon" placeholder="seuemail@gmail.com" />
          </div>

          {mode !== "senha" && (
            <>
              <label className="mt-4 block text-[12px] font-semibold text-zinc-400" htmlFor="vx-pass">{mode === "primeiro" ? "Crie uma senha" : "Senha"}</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="vx-pass" type="password" autoComplete={mode === "primeiro" ? "new-password" : "current-password"} required minLength={6}
                  value={password} onChange={(e) => setPassword(e.target.value)} className="vx-input vx-input--icon"
                  placeholder={mode === "primeiro" ? "Mínimo de 6 caracteres" : "••••••••"} />
              </div>
            </>
          )}

          {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-[12.5px] text-red-300">{error}</p>}
          {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5 text-[12.5px] text-emerald-300">{notice}</p>}

          <button
            type="submit"
            disabled={busy || !email || (mode !== "senha" && password.length < 6) || (mode === "primeiro" && name.trim().length < 2)}
            className="vx-btn vx-btn--gold mt-6 h-11 w-full text-[14px]"
          >
            {busy ? "Aguarde..." : mode === "entrar" ? "Entrar" : mode === "primeiro" ? "Criar minha senha" : "Enviar link"}
          </button>

          <div className="mt-5 flex items-center justify-between text-[12.5px]">
            {mode === "senha"
              ? <button type="button" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300" onClick={() => go("entrar")}><ArrowLeft className="h-3.5 w-3.5" /> Voltar</button>
              : <button type="button" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300" onClick={() => go("senha")}><KeyRound className="h-3.5 w-3.5" /> Esqueci a senha</button>}
            <Link to="/" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site</Link>
          </div>
        </form>
      </section>
    </div>
  )
}
