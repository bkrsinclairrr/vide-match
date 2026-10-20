import "@fontsource-variable/inter"
import "@/pages/voxen/voxen.css"
import "./admin.css"

import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type FormEvent, type RefObject } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, Mail, MailCheck, RefreshCw,
  ShieldCheck, ShieldX,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useAccessLevel } from "@/hooks/useAccessLevel"
import { prefersReducedMotion } from "@/lib/reducedMotion"
import { friendlyAuthError } from "@/lib/authErrors"
import { readFields } from "@/lib/formValues"
import { useDevPreview } from "@/lib/devPreview"
import { usePointerGlow } from "@/pages/voxen/motion"

/*
 * Entrada dos administradores (aizyron.com/admin). Só login, sem criar conta:
 * o acesso de administrador é dado por outro administrador em Contas e acessos.
 * Administrador entra e vê a central de administração (AdminApp) neste mesmo
 * endereço; executivo, scout e atleta recebem o caminho certo. O banco (RLS) é quem
 * protege os dados; esta tela só orienta.
 */

/** A central de administração só é baixada depois do login de um administrador. */
const AdminApp = lazy(() => import("./console/AdminApp"))

const REMEMBER_KEY = "zyron:admin-email"

/** Destino depois do login: só caminhos da própria central (/admin...). */
function safeNext(raw: string | null) {
  return raw && /^\/admin(\/|\?|$)/.test(raw) ? raw : null
}

function readRemembered() {
  try { return localStorage.getItem(REMEMBER_KEY) ?? "" } catch { return "" }
}

function remember(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch { /* sem armazenamento: só não lembra o e-mail */ }
}

type Phase = "splash" | "form" | "verifying" | "success" | "app" | "denied" | "error"

export default function AdminEntry() {
  const dev = useDevPreview()
  // Dados locais para desenvolver a central sem banco (a condição por extenso tira isto do site publicado).
  if (import.meta.env.DEV && dev.demo) {
    return <Suspense fallback={null}><AdminApp demo /></Suspense>
  }
  return <Gate />
}

/** Decide o que mostrar: login, avisos de conta sem acesso ou a central de administração. */
function Gate() {
  const { session, user, loading, signOut } = useAuth()
  const { level, loading: levelLoading, failed, retry } = useAccessLevel()
  const [params] = useSearchParams()
  const next = safeNext(params.get("next"))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [signedHere, setSignedHere] = useState(false)
  const [entered, setEntered] = useState(false)
  useAdminDocument()

  // Saiu da conta (aqui ou de dentro da central): a próxima entrada começa do zero.
  useEffect(() => {
    if (!loading && !session) {
      setSignedHere(false)
      setEntered(false)
    }
  }, [loading, session])

  const phase: Phase =
    loading ? "splash"
      : !session || !user ? "form"
        : failed ? "error"
          : levelLoading || !level ? (signedHere ? "verifying" : "splash")
            : level === "admin" ? (signedHere && !entered ? "success" : "app")
              : "denied"

  const finishEntry = () => {
    setEntered(true)
    if (next && next !== pathname) navigate(next, { replace: true })
  }

  if (phase === "app") {
    return (
      <Suspense fallback={<div className="vx"><div className="vx-splash"><div className="vx-splash-inner"><span className="vx-splash-bar" /></div></div></div>}>
        <AdminApp />
      </Suspense>
    )
  }

  return (
    <GateScreen
      phase={phase}
      level={level}
      email={user?.email ?? ""}
      onAttempt={setSignedHere}
      onRetry={retry}
      onFinish={finishEntry}
      onSignOut={async () => { setSignedHere(false); await signOut() }}
    />
  )
}

function GateScreen({
  phase, level, email, onAttempt, onRetry, onFinish, onSignOut,
}: {
  phase: Exclude<Phase, "app">
  level: string | null
  email: string
  onAttempt: (on: boolean) => void
  onRetry: () => void
  onFinish: () => void
  onSignOut: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const finish = useRef(onFinish)
  finish.current = onFinish
  usePointerGlow(rootRef)
  useParallax(rootRef)

  // Acabou de entrar: "Acesso liberado", a tela sai com uma transição e a central abre.
  useEffect(() => {
    if (phase !== "success") return
    const quick = prefersReducedMotion()
    const t1 = window.setTimeout(() => setLeaving(true), quick ? 0 : 950)
    const t2 = window.setTimeout(() => finish.current(), quick ? 60 : 1550)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [phase])

  return (
    <div ref={rootRef} className={`vx ad ${leaving ? "is-leaving" : ""}`}>
      <Backdrop />
      <main className="ad-stage">
        {phase === "splash" ? (
          <div className="ad-splash" role="status" aria-label="Verificando a sessão">
            <Emblem state="idle" />
            <span className="ad-splash-bar" aria-hidden="true" />
          </div>
        ) : phase === "denied" || phase === "error" ? (
          <Denied kind={phase === "error" ? "error" : level === "executive" || level === "scout" ? level : "user"} email={email} onRetry={onRetry} onSignOut={onSignOut} />
        ) : (
          <AdminForm status={phase === "verifying" ? "verifying" : phase === "success" ? "success" : "idle"} onAttempt={onAttempt} />
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

type Status = "idle" | "verifying" | "success"

/**
 * `onAttempt(true)` vem antes do login: o Supabase avisa da sessão nova antes de
 * a chamada terminar, e a tela precisa saber que o login foi feito aqui (para
 * mostrar "Acesso liberado" em vez de piscar a tela de carregamento).
 */
function AdminForm({ status, onAttempt }: { status: Status; onAttempt: (on: boolean) => void }) {
  const [mode, setMode] = useState<"entrar" | "senha">("entrar")
  const [swapped, setSwapped] = useState(false)
  const [remembered, setRemembered] = useState(readRemembered)
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [sent, setSent] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const target = mode === "entrar" && remembered ? passRef : emailRef
    target.current?.focus()
    // Só ao trocar de modo; o e-mail lembrado decide o foco da primeira vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (status === "success") remember(email.trim().toLowerCase())
  }, [status, email])

  const d = (ms: number) => ({ "--d": swapped ? "0ms" : `${ms}ms` }) as CSSProperties
  const working = busy || status === "verifying"
  const done = status === "success"

  const go = (to: "entrar" | "senha") => {
    setMode(to)
    setSwapped(true)
    setError(null)
    setSent(false)
  }

  const forget = () => {
    remember(null)
    setRemembered("")
    setEmail("")
    setPassword("")
    window.setTimeout(() => emailRef.current?.focus(), 0)
  }

  const fail = (message: string) => {
    setError(message)
    setShake(true)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (working || done) return
    // Lê da tela (não do estado): a senha preenchida pelo navegador só chega ao estado depois de um clique,
    // e o botão nunca fica desligado por um campo que parece vazio.
    const typed = readFields(e.currentTarget, { email, password })
    const mail = typed.email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      fail("Informe um e-mail válido.")
      return
    }
    if (mode === "entrar" && typed.password.length < 6) {
      fail("Informe a sua senha.")
      return
    }
    setEmail(typed.email)
    setPassword(typed.password)
    setBusy(true)
    setError(null)
    try {
      if (mode === "entrar") {
        onAttempt(true)
        const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password: typed.password })
        if (err) {
          onAttempt(false)
          fail(/invalid login credentials/i.test(err.message)
            ? "E-mail ou senha incorretos. Confira os dados ou use “Esqueci a senha”."
            : friendlyAuthError(err.message))
          window.setTimeout(() => passRef.current?.select(), 0)
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/reset-password` })
        if (err) fail(friendlyAuthError(err.message))
        else setSent(true)
      }
    } catch {
      onAttempt(false)
      fail("Sem conexão com o servidor. Confira a internet e tente de novo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Emblem state={done ? "success" : "idle"} />

      <div className={`ad-frame ad-in ${error ? "is-error" : ""} ${done ? "is-success" : ""}`} style={{ "--d": "120ms" } as CSSProperties}>
        <form className="ad-card" data-glow onSubmit={(e) => void submit(e)} noValidate aria-busy={working}>
          <span className="ad-chip ad-in" style={d(260)}>
            <span className="ad-chip-dot" aria-hidden="true" /> Área restrita
          </span>
          <h1 key={`t-${mode}`} className="ad-title ad-in" style={d(320)}>
            {mode === "entrar" ? <>Painel do <span className="ad-shine">administrador</span></> : <>Recuperar o <span className="ad-shine">acesso</span></>}
          </h1>
          <p key={`s-${mode}`} className="ad-sub ad-in" style={d(380)}>
            {mode === "entrar"
              ? "Entre com a sua conta de administrador. Não há cadastro por aqui: o acesso é liberado pela equipe."
              : "Informe o e-mail da sua conta. Enviamos um link para você criar uma nova senha."}
          </p>

          {sent ? (
            <div className="ad-sent" role="status">
              <span className="ad-sent-icon"><MailCheck /></span>
              <div>
                <b>Confira o seu e-mail</b>
                <p>Se existir uma conta de administrador com <strong>{email.trim()}</strong>, o link chega em instantes.</p>
              </div>
            </div>
          ) : (
            <div key={mode} className={`ad-fields ${shake ? "is-shake" : ""} ${swapped ? "is-swap" : ""}`} onAnimationEnd={(e) => { if (e.target === e.currentTarget && shake) setShake(false) }}>
              <div className="ad-field ad-in" style={d(440)}>
                <input
                  id="ad-email" ref={emailRef} name="email" type="email" inputMode="email" autoComplete="username" placeholder=" " required
                  value={email} disabled={done} aria-invalid={Boolean(error) || undefined}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                />
                <label htmlFor="ad-email">E-mail</label>
                <Mail className="ad-field-icon" aria-hidden="true" />
              </div>
              {remembered && email === remembered && mode === "entrar" && !done && (
                <button type="button" className="ad-mini" onClick={forget}>Não é você? Usar outro e-mail</button>
              )}

              {mode === "entrar" && (
                <>
                  <div className="ad-field ad-in" style={d(500)}>
                    <input
                      id="ad-pass" ref={passRef} name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder=" " required
                      value={password} disabled={done} aria-invalid={Boolean(error) || undefined} aria-describedby={caps ? "ad-caps" : undefined}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
                      onBlur={() => setCaps(false)}
                    />
                    <label htmlFor="ad-pass">Senha</label>
                    <Lock className="ad-field-icon" aria-hidden="true" />
                    <button type="button" className="ad-eye" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Ocultar a senha" : "Mostrar a senha"}>
                      {show ? <EyeOff key="off" /> : <Eye key="on" />}
                    </button>
                  </div>
                  {caps && <p id="ad-caps" className="ad-caps"><AlertCircle aria-hidden="true" /> Caps Lock ligado</p>}
                </>
              )}

              {error && <p role="alert" className="ad-error"><AlertCircle aria-hidden="true" /> {error}</p>}

              <button type="submit" disabled={working || done} className={`ad-submit ad-in ${done ? "is-success" : ""}`} style={d(560)}>
                {done ? (
                  <><Check className="ad-submit-check" /> Acesso liberado</>
                ) : working ? (
                  <><Loader2 className="ad-spin" /> {mode === "entrar" ? (status === "verifying" ? "Verificando o acesso..." : "Entrando...") : "Enviando..."}</>
                ) : mode === "entrar" ? (
                  <>Entrar no painel <ArrowRight /></>
                ) : (
                  <>Enviar o link <ArrowRight /></>
                )}
              </button>
            </div>
          )}

          <div key={`f-${mode}`} className="ad-card-foot ad-in" style={d(620)}>
            {mode === "entrar" ? (
              <button type="button" className="ad-link" onClick={() => go("senha")} disabled={done}><KeyRound /> Esqueci a senha</button>
            ) : (
              <button type="button" className="ad-link" onClick={() => go("entrar")}><ArrowLeft /> Voltar ao login</button>
            )}
            <Link to="/voxen" className="ad-link">Entrada da equipe <ArrowRight /></Link>
          </div>

          <p className="sr-only" role="status">{done ? "Acesso liberado. Abrindo a VOXEN." : ""}</p>
        </form>
      </div>

      <Legal />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Conta sem acesso de administrador, ou falha ao verificar            */
/* ------------------------------------------------------------------ */

function Denied({
  kind, email, onRetry, onSignOut,
}: { kind: "executive" | "scout" | "user" | "error"; email: string; onRetry: () => void; onSignOut: () => void }) {
  const team = kind === "executive" || kind === "scout"
  const copy = {
    executive: {
      title: "Esta entrada é só de administradores",
      text: <>A conta <strong>{email}</strong> é de executivo. A VOXEN continua aberta para você pela entrada da equipe.</>,
    },
    scout: {
      title: "Esta entrada é só de administradores",
      text: <>A conta <strong>{email}</strong> é de scout. A VOXEN continua aberta para você pela entrada da equipe.</>,
    },
    user: {
      title: "Esta conta não é de administrador",
      text: <>A conta <strong>{email}</strong> é de atleta. A sua área, com perfil, conquistas e oportunidades, fica em outro endereço.</>,
    },
    error: {
      title: "Não foi possível verificar o seu acesso",
      text: <>Confira a sua conexão e tente de novo. Se continuar assim, saia e entre outra vez.</>,
    },
  }[kind]

  return (
    <>
      <Emblem state={kind === "error" ? "idle" : "denied"} />
      <div className="ad-frame ad-in is-muted" style={{ "--d": "120ms" } as CSSProperties}>
        <div className="ad-card ad-denied" data-glow>
          <h1 className="ad-title ad-in" style={{ "--d": "240ms" } as CSSProperties}>{copy.title}</h1>
          <p className="ad-sub ad-in" style={{ "--d": "300ms" } as CSSProperties}>{copy.text}</p>
          <div className="ad-actions ad-in" style={{ "--d": "380ms" } as CSSProperties}>
            {team && <Link to="/voxen" className="ad-submit">Abrir a VOXEN <ArrowRight /></Link>}
            {kind === "user" && <Link to="/minha-area" className="ad-submit">Ir para a minha área <ArrowRight /></Link>}
            {kind === "error" && <button type="button" className="ad-submit" onClick={onRetry}><RefreshCw /> Tentar de novo</button>}
            <button type="button" className="ad-ghost" onClick={onSignOut}><LogOut /> Entrar com outra conta</button>
          </div>
          {kind !== "error" && (
            <p className="ad-hint ad-in" style={{ "--d": "440ms" } as CSSProperties}>
              Precisa de acesso de administrador? Peça a um administrador em Contas e acessos.
            </p>
          )}
        </div>
      </div>
      <Legal />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Peças visuais                                                       */
/* ------------------------------------------------------------------ */

function Emblem({ state }: { state: "idle" | "success" | "denied" }) {
  return (
    <div className={`ad-emblem ad-in is-${state}`} aria-hidden="true">
      <span className="ad-emblem-halo" />
      <span className="ad-emblem-ring ad-emblem-ring--a" />
      <span className="ad-emblem-ring ad-emblem-ring--b" />
      {state === "success" && <span key="burst" className="ad-emblem-burst" />}
      <span className="ad-emblem-core">
        {state === "success" ? <Check key="ok" /> : state === "denied" ? <ShieldX key="x" /> : <ShieldCheck key="s" />}
      </span>
    </div>
  )
}

function Legal() {
  return (
    <p className="ad-legal ad-in" style={{ "--d": "700ms" } as CSSProperties}>
      <Lock aria-hidden="true" /> Acesso restrito a administradores da Zyron
      <span aria-hidden="true">·</span>
      <Link to="/">Voltar ao site</Link>
    </p>
  )
}

/** Partículas douradas subindo: posições fixas (pseudoaleatórias) para não mudar a cada render. */
const DUST = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return { l: r(1) * 100, s: 1.5 + r(2) * 2.5, t: 11 + r(3) * 12, dl: -r(4) * 22, dx: (r(5) - 0.5) * 80 }
})

function Backdrop() {
  return (
    <div className="ad-bg" aria-hidden="true">
      <div className="vx-backdrop">
        <span className="vx-aurora vx-aurora--a" />
        <span className="vx-aurora vx-aurora--b" />
        <span className="vx-aurora vx-aurora--c" />
      </div>
      <div className="ad-spot" />
      <div className="ad-floor"><div className="ad-floor-grid" /></div>
      <div className="ad-horizon" />
      <div className="ad-dust">
        {DUST.map((d, i) => (
          <span
            key={i}
            style={{ "--l": `${d.l}%`, "--s": `${d.s}px`, "--t": `${d.t}s`, "--dl": `${d.dl}s`, "--dx": `${d.dx}px` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

/** Paralaxe leve e luz que segue o cursor (variáveis CSS no topo da tela). */
function useParallax(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    let frame = 0
    let x = 0
    let y = 0
    const paint = () => {
      frame = 0
      el.style.setProperty("--px", (x / window.innerWidth - 0.5).toFixed(3))
      el.style.setProperty("--py", (y / window.innerHeight - 0.5).toFixed(3))
      el.style.setProperty("--sx", `${x}px`)
      el.style.setProperty("--sy", `${y}px`)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      x = e.clientX
      y = e.clientY
      if (!frame) frame = requestAnimationFrame(paint)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [root])
}

/** Título da aba, tema escuro e fora dos buscadores. */
function useAdminDocument() {
  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "Administração · Zyron"
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex, nofollow"
    document.head.appendChild(meta)
    return () => {
      document.title = prev
      meta.remove()
    }
  }, [])
}
