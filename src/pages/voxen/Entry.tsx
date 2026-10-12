import "./entry.css"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Compass, Eye, EyeOff, GitCompareArrows, Loader2, Lock, Mail, ShieldCheck, Trophy,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { friendlyAuthError } from "@/lib/authErrors"
import { VoxenWordmark } from "./ui"

/*
 * Entrada de /voxen. Duas portas, nesta ordem: o atleta primeiro (é quem mais
 * chega aqui) e a equipe logo abaixo. É leve de propósito: aparece na hora (sem
 * esperar a verificação de sessão quando não há login guardado), não anima a
 * entrada e não baixa o painel da VOXEN, que só chega depois do login da equipe
 * (`onTeamIntent` adianta esse download quando a pessoa começa a digitar).
 */

const PERKS = [
  { icon: Trophy, label: "Nível e conquistas" },
  { icon: Compass, label: "Clubes que procuram você" },
  { icon: GitCompareArrows, label: "Comparativo" },
]

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

/** Baixa a tela de login do atleta em segundo plano: o clique em "Entrar na minha área" abre sem espera. */
const warmLogin = () => { void import("@/pages/Login") }

export default function Entry({ onTeamIntent }: { onTeamIntent?: () => void }) {
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void })
    if (ric.requestIdleCallback) {
      const id = ric.requestIdleCallback(warmLogin)
      return () => ric.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warmLogin, 1500)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <main className="ve">
      <div className="ve-wrap">
        <header className="ve-head"><VoxenWordmark size={38} /></header>
        <AthleteDoor />
        <TeamDoor onIntent={onTeamIntent} />
        <footer className="ve-foot">
          <Link to="/admin">Administrador? Abra a central</Link>
          <span aria-hidden="true">·</span>
          <Link to="/">Voltar ao site</Link>
        </footer>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Atleta                                                              */
/* ------------------------------------------------------------------ */

function AthleteDoor() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const google = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    // /dashboard já está liberado no Supabase e encaminha: atleta para /minha-area, equipe para /voxen.
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (err) {
      setError(friendlyAuthError(err.message))
      setBusy(false)
    }
  }

  return (
    <section className="ve-athlete" aria-labelledby="ve-athlete-title">
      <span className="ve-kicker">Atletas</span>
      <h1 id="ve-athlete-title">Acesse a sua área de atleta</h1>
      <p className="ve-sub">Veja o seu perfil, o seu nível, os clubes que procuram o seu jogo e como você se compara.</p>

      <div className="ve-actions">
        <Link to="/login" className="vx-btn vx-btn--gold ve-main">Entrar na minha área <ArrowRight /></Link>
        <Link to="/login?aba=cadastro" className="vx-btn ve-second">Criar conta</Link>
      </div>

      <button type="button" className="ve-google" onClick={() => void google()} disabled={busy}>
        {busy ? <Loader2 className="ve-spin" /> : <GoogleMark />}
        {busy ? "Abrindo o Google..." : "Entrar com Google"}
      </button>
      {error && <p role="alert" className="ve-error"><AlertCircle /> {error}</p>}

      <ul className="ve-perks">
        {PERKS.map(({ icon: Icon, label }) => <li key={label}><Icon /> {label}</li>)}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Equipe                                                              */
/* ------------------------------------------------------------------ */

type Mode = "entrar" | "senha"

/** Login da equipe (administrador e executivo): sem criar conta. Quem entra na equipe é convidado por um administrador. */
function TeamDoor({ onIntent }: { onIntent?: () => void }) {
  const [mode, setMode] = useState<Mode>("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const intent = useRef(false)

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && (mode === "senha" || password.length >= 6)

  /** A pessoa começou a usar o login da equipe: adianta o download do painel para o login abrir direto. */
  const warm = () => {
    if (intent.current) return
    intent.current = true
    onIntent?.()
  }

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
    try {
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
    } catch {
      setError("Sem conexão com o servidor. Confira a internet e tente de novo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="ve-team" aria-labelledby="ve-team-title">
      <div className="ve-team-head">
        <span className="ve-team-icon"><ShieldCheck /></span>
        <div>
          <h2 id="ve-team-title">{mode === "entrar" ? "Acesso da equipe" : "Recuperar a senha"}</h2>
          <p>{mode === "entrar" ? "Administradores e executivos da Zyron." : "Enviamos um link para criar uma nova senha."}</p>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} onFocus={warm} noValidate>
        {sent ? (
          <div className="ve-sent" role="status">
            <CheckCircle2 />
            <p><b>Confira o seu e-mail.</b> Se existir uma conta da equipe com <strong>{email.trim()}</strong>, o link chega em instantes.</p>
          </div>
        ) : (
          <>
            <div className="ve-field">
              <label htmlFor="sl-email">E-mail</label>
              <div className="ve-input">
                <Mail aria-hidden="true" />
                <input id="sl-email" type="email" inputMode="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@aizyron.com" />
              </div>
            </div>

            {mode === "entrar" && (
              <div className="ve-field">
                <div className="ve-field-row">
                  <label htmlFor="sl-pass">Senha</label>
                  <button type="button" className="ve-link" onClick={() => go("senha")}>Esqueci a senha</button>
                </div>
                <div className="ve-input">
                  <Lock aria-hidden="true" />
                  <input
                    id="sl-pass" type={show ? "text" : "password"} autoComplete="current-password" required value={password} placeholder="Sua senha"
                    onChange={(e) => setPassword(e.target.value)} onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))} onBlur={() => setCaps(false)}
                    aria-describedby={caps ? "sl-caps" : undefined}
                  />
                  <button type="button" className="ve-eye" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Ocultar a senha" : "Mostrar a senha"}>
                    {show ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {caps && <p id="sl-caps" className="ve-caps"><AlertCircle /> Caps Lock ligado</p>}
              </div>
            )}

            {error && <p role="alert" className="ve-error"><AlertCircle /> {error}</p>}

            <button type="submit" disabled={!valid || busy} className="vx-btn ve-team-btn">
              {busy ? <><Loader2 className="ve-spin" /> {mode === "entrar" ? "Entrando..." : "Enviando..."}</> : mode === "entrar" ? <>Entrar na VOXEN <ArrowRight /></> : "Enviar o link"}
            </button>
          </>
        )}

        {mode === "senha" && (
          <button type="button" className="ve-link ve-back" onClick={() => go("entrar")}><ArrowLeft /> Voltar ao login</button>
        )}
      </form>
    </section>
  )
}
