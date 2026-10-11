import "./staff.css"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, Mail, ShieldCheck, Users,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { friendlyAuthError } from "@/lib/funnel"
import { VoxenWordmark } from "./ui"

const FEATURES = [
  { icon: Users, title: "Atletas e funil", text: "Todos os leads e contas em um só lugar, com etapa, notas e avaliação do scout." },
  { icon: BadgeCheck, title: "Membros e análises", text: "Vídeos das partidas, lances marcados, mapa de calor e métricas por atleta." },
  { icon: ShieldCheck, title: "Contas e acessos", text: "Quem é administrador, quem só lê e quem é atleta, com controle total." },
]

type Mode = "entrar" | "senha"

/**
 * Login da equipe (administradores e executivos). É separado do login dos
 * atletas (/login): aqui não há criação de conta. Quem entra na equipe é
 * convidado por um administrador e define a senha pelo link do e-mail.
 */
export function StaffLogin() {
  const [mode, setMode] = useState<Mode>("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => { emailRef.current?.focus() }, [mode])

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && (mode === "senha" || password.length >= 6)

  const go = (next: Mode) => {
    setMode(next)
    setError(null)
    setSent(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const mail = email.trim().toLowerCase()
    if (mode === "entrar") {
      const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password })
      if (err) {
        setError(/invalid login credentials/i.test(err.message)
          ? "E-mail ou senha incorretos. Confira os dados ou use “Esqueci a senha”."
          : friendlyAuthError(err.message))
      }
    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/reset-password` })
      if (err) setError(friendlyAuthError(err.message))
      else setSent(true)
    }
    setBusy(false)
  }

  return (
    <div className="vx-gate relative z-[1]">
      <aside className="vx-gate-art sl-art">
        <div className="vx-gate-orbit" aria-hidden="true" />
        <VoxenWordmark size={40} />
        <div className="relative max-w-[520px]">
          <span className="sl-kicker"><Lock className="h-3.5 w-3.5" /> Acesso da equipe</span>
          <h1 className="mt-5 text-[42px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            A central da{" "}
            <span className="bg-gradient-to-b from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">equipe Zyron.</span>
          </h1>
          <ul className="sl-features">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <li key={title} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                <span><Icon /></span>
                <div><b>{title}</b><p>{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[12px] text-zinc-500">© 2026 Zyron · Acesso restrito à equipe autorizada</p>
      </aside>

      <section className="vx-gate-form">
        <form onSubmit={(e) => void submit(e)} className="vx-gate-card sl-card" noValidate>
          <div className="mb-8 lg:hidden"><VoxenWordmark /></div>
          <span className="sl-badge"><ShieldCheck className="h-3.5 w-3.5" /> Equipe Zyron</span>
          <h2 className="mt-4 text-[26px] font-bold tracking-[-0.02em]">{mode === "entrar" ? "Entrar na VOXEN" : "Recuperar a senha"}</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-400">
            {mode === "entrar"
              ? "Use o e-mail e a senha da sua conta de administrador ou executivo."
              : "Informe o e-mail da sua conta. Enviamos um link para você criar uma nova senha."}
          </p>

          {sent ? (
            <div className="sl-sent" role="status">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <b>Confira o seu e-mail</b>
                <p>Se existir uma conta da equipe com <strong>{email.trim()}</strong>, o link para criar a nova senha chega em instantes.</p>
              </div>
            </div>
          ) : (
            <>
              <label className="sl-label" htmlFor="sl-email">E-mail</label>
              <div className="relative">
                <Mail className="sl-icon" />
                <input id="sl-email" ref={emailRef} type="email" autoComplete="username" inputMode="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} className="vx-input vx-input--icon" placeholder="nome@aizyron.com" />
              </div>

              {mode === "entrar" && (
                <>
                  <div className="sl-label-row">
                    <label className="sl-label !mt-0" htmlFor="sl-pass">Senha</label>
                    <button type="button" className="sl-link" onClick={() => go("senha")}>Esqueci a senha</button>
                  </div>
                  <div className="relative">
                    <Lock className="sl-icon" />
                    <input id="sl-pass" type={show ? "text" : "password"} autoComplete="current-password" required value={password}
                      onChange={(e) => setPassword(e.target.value)} onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))} onBlur={() => setCaps(false)}
                      className="vx-input vx-input--icon pr-11" placeholder="Sua senha" aria-describedby={caps ? "sl-caps" : undefined} />
                    <button type="button" className="sl-eye" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Ocultar a senha" : "Mostrar a senha"}>
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {caps && <p id="sl-caps" className="sl-caps"><AlertCircle className="h-3.5 w-3.5" /> Caps Lock ligado</p>}
                </>
              )}

              {error && <p role="alert" className="sl-error"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</p>}

              <button type="submit" disabled={!valid || busy} className="vx-btn vx-btn--gold sl-submit">
                {busy ? <><Loader2 className="sl-spin" /> {mode === "entrar" ? "Entrando..." : "Enviando..."}</> : mode === "entrar" ? <>Entrar <ArrowRight /></> : "Enviar o link"}
              </button>
            </>
          )}

          {mode === "senha" && (
            <button type="button" className="sl-link sl-back" onClick={() => go("entrar")}><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login</button>
          )}

          <div className="sl-foot">
            <Link to="/login"><KeyRound className="h-4 w-4" /> <span><b>É atleta?</b> Entre na sua área</span><ArrowRight className="ml-auto h-4 w-4" /></Link>
            <Link to="/" className="sl-link"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site</Link>
          </div>
        </form>
      </section>
    </div>
  )
}

/** A consulta do nível de acesso falhou (rede, por exemplo): pede para tentar de novo em vez de adivinhar. */
export function AccessCheckError({ onRetry }: { onRetry: () => void }) {
  const { signOut } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card sl-only">
        <span className="sl-only-icon is-warn"><AlertCircle /></span>
        <h1>Não foi possível verificar o seu acesso</h1>
        <p>Confira a sua conexão e tente de novo. Se continuar assim, saia e entre outra vez.</p>
        <div className="sl-only-actions">
          <button type="button" className="vx-btn vx-btn--gold" onClick={onRetry}>Tentar de novo</button>
          <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Sair</button>
        </div>
      </div>
    </div>
  )
}

/** Conta de atleta que chegou à entrada da equipe: explica e leva para a área certa. */
export function StaffOnly({ email }: { email: string }) {
  const { signOut } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card sl-only">
        <span className="sl-only-icon"><ShieldCheck /></span>
        <h1>Esta é a entrada da equipe</h1>
        <p>
          A conta <strong>{email}</strong> é de atleta e não tem acesso à VOXEN. A sua área, com perfil, conquistas e oportunidades,
          fica em outro endereço.
        </p>
        <div className="sl-only-actions">
          <Link to="/minha-area" className="vx-btn vx-btn--gold">Ir para a minha área <ArrowRight /></Link>
          <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Entrar com outra conta</button>
        </div>
        <small>Acha que deveria ter acesso à equipe? Peça a um administrador para liberar o seu e-mail.</small>
      </div>
    </div>
  )
}
