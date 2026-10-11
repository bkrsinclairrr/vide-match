import "@fontsource-variable/inter"
import "@/pages/voxen/voxen.css"
import "./membros.css"

import {
  createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type FormEvent, type ReactNode,
} from "react"
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowLeft, BarChart3, Clapperboard, Eye, GitCompareArrows, Home, KeyRound, Lock, LogOut, Mail, Menu, User, UserRound,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { friendlyAuthError, WHATSAPP_NUMBER } from "@/lib/funnel"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronLogo, ZyronMark } from "@/pages/site/ZyronMark"
import { PageSkeleton } from "@/pages/voxen/ui"
import { SetupMissingError, getSource, type DataSource } from "./api"
import { summarizeProfile, type ProfileSummary } from "./metrics"
import type { Bundle, Member } from "./model"
import { MemberAvatar } from "./components/bits"

const HomePage = lazy(() => import("./pages/HomePage"))
const MatchesPage = lazy(() => import("./pages/MatchesPage"))
const MatchPage = lazy(() => import("./pages/MatchPage"))
const PerformancePage = lazy(() => import("./pages/PerformancePage"))
const ComparePage = lazy(() => import("./pages/ComparePage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))

const NAV = [
  { to: "/membros", label: "Início", icon: Home, end: true },
  { to: "/membros/partidas", label: "Partidas", icon: Clapperboard, end: false },
  { to: "/membros/desempenho", label: "Desempenho", icon: BarChart3, end: false },
  { to: "/membros/comparativo", label: "Comparativo", icon: GitCompareArrows, end: false },
  { to: "/membros/perfil", label: "Perfil", icon: UserRound, end: false },
]

const AS_MEMBER_KEY = "zyron:membros:como"

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

type MemberCtx = {
  source: DataSource
  bundle: Bundle
  member: Member
  summary: ProfileSummary
  references: Member[]
  /** Admin vendo a área como este membro (só leitura). */
  adminPreview: boolean
  loadReference: (id: string) => Promise<Bundle | null>
  whatsapp: (text?: string) => string
}

const Ctx = createContext<MemberCtx | null>(null)

export function useMember() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useMember fora da área de membros")
  return ctx
}

/* ------------------------------------------------------------------ */
/* Entrada                                                             */
/* ------------------------------------------------------------------ */

function readFlags(search: string) {
  const params = new URLSearchParams(search)
  let preview = false
  if (import.meta.env.DEV) {
    try {
      if (params.has("preview")) sessionStorage.setItem("zyron:preview", "1")
      preview = sessionStorage.getItem("zyron:preview") === "1"
    } catch {
      preview = false
    }
  }
  let asMember: string | null = null
  try {
    const como = params.get("como")
    if (como) sessionStorage.setItem(AS_MEMBER_KEY, como)
    asMember = sessionStorage.getItem(AS_MEMBER_KEY)
  } catch {
    asMember = params.get("como")
  }
  return { preview, asMember }
}

export default function MembersApp() {
  const { search } = useLocation()
  const flags = useMemo(() => readFlags(search), [search])

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "Área de membros · Zyron"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="vx">
      <div className="vx-backdrop" aria-hidden="true" />
      {flags.preview ? <Workspace preview asMember={flags.asMember} isAdmin /> : <Gate asMember={flags.asMember} />}
    </div>
  )
}

function Gate({ asMember }: { asMember: string | null }) {
  const { session, user, loading } = useAuth()
  const [admin, setAdmin] = useState<{ userId: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data, error }) => {
      if (!cancelled) setAdmin({ userId: user.id, isAdmin: !error && Boolean(data?.length) })
    })
    return () => { cancelled = true }
  }, [user])

  if (loading) return <Splash />
  if (!session || !user) return <MemberLogin />
  if (!admin || admin.userId !== user.id) return <Splash />
  return <Workspace preview={false} asMember={admin.isAdmin ? asMember : null} isAdmin={admin.isAdmin} />
}

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><ZyronMark size={56} /></div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Login e primeiro acesso                                             */
/* ------------------------------------------------------------------ */

function MemberLogin() {
  const [mode, setMode] = useState<"entrar" | "primeiro" | "senha">("entrar")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
        options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/membros` },
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

  const titles = {
    entrar: ["Entrar na área de membros", "Use o e-mail que você informou para a equipe Zyron."],
    primeiro: ["Primeiro acesso", "Crie sua senha com o mesmo e-mail que você informou para a equipe."],
    senha: ["Recuperar senha", "Enviamos um link para você criar uma nova senha."],
  }[mode]

  return (
    <div className="vx-gate relative z-[1]">
      <aside className="vx-gate-art">
        <div className="vx-gate-orbit" aria-hidden="true" />
        <ZyronLogo size={38} />
        <div className="relative max-w-[540px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-amber-300">Área de membros</p>
          <h1 className="mt-4 text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            O seu jogo,{" "}
            <span className="bg-gradient-to-b from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">lido lance a lance.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-zinc-400">
            Os vídeos das suas partidas, cada ação marcada pela equipe Zyron, mapa de calor, evolução jogo a jogo e a
            comparação com perfis de referência da sua posição.
          </p>
        </div>
        <p className="relative text-[12px] text-zinc-500">© 2026 Zyron · Acesso exclusivo para membros</p>
      </aside>

      <section className="vx-gate-form">
        <form onSubmit={submit} className="vx-gate-card" noValidate>
          <div className="mb-8 lg:hidden"><ZyronLogo size={32} /></div>
          {mode !== "senha" && (
            <div className="vx-tabs mb-6" role="tablist">
              <button type="button" role="tab" aria-selected={mode === "entrar"} className={`vx-tab ${mode === "entrar" ? "is-on" : ""}`} onClick={() => { setMode("entrar"); setError(null); setNotice(null) }}>Entrar</button>
              <button type="button" role="tab" aria-selected={mode === "primeiro"} className={`vx-tab ${mode === "primeiro" ? "is-on" : ""}`} onClick={() => { setMode("primeiro"); setError(null); setNotice(null) }}>Primeiro acesso</button>
            </div>
          )}
          <h2 className="text-[24px] font-bold tracking-[-0.02em]">{titles[0]}</h2>
          <p className="mt-1.5 text-[13.5px] text-zinc-400">{titles[1]}</p>

          {mode === "primeiro" && (
            <>
              <label className="mt-6 block text-[12px] font-semibold text-zinc-400" htmlFor="mb-name">Nome</label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="mb-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="vx-input vx-input--icon" placeholder="Seu nome completo" />
              </div>
            </>
          )}

          <label className="mt-6 block text-[12px] font-semibold text-zinc-400" htmlFor="mb-email">E-mail</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input id="mb-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="vx-input vx-input--icon" placeholder="voce@email.com" />
          </div>

          {mode !== "senha" && (
            <>
              <label className="mt-4 block text-[12px] font-semibold text-zinc-400" htmlFor="mb-pass">{mode === "primeiro" ? "Crie uma senha" : "Senha"}</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="mb-pass" type="password" autoComplete={mode === "primeiro" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="vx-input vx-input--icon" placeholder={mode === "primeiro" ? "Mínimo de 6 caracteres" : "••••••••"} />
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
              ? <button type="button" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300" onClick={() => { setMode("entrar"); setNotice(null) }}><ArrowLeft className="h-3.5 w-3.5" /> Voltar</button>
              : <button type="button" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300" onClick={() => { setMode("senha"); setError(null); setNotice(null) }}><KeyRound className="h-3.5 w-3.5" /> Esqueci a senha</button>}
            <Link to="/" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site</Link>
          </div>
        </form>
      </section>
    </div>
  )
}

function NoAccess({ title, children }: { title: string; children: ReactNode }) {
  const { signOut, user } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card max-w-lg text-center" style={{ animation: "vx-rise .7s var(--vx-ease) both" }}>
        <span className="vx-empty-icon mx-auto"><Lock className="h-6 w-6" /></span>
        <h1 className="mt-4 text-[20px] font-bold">{title}</h1>
        <div className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">{children}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a className="vx-btn vx-btn--wpp" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Quero acessar a área de membros da Zyron com o e-mail ${user?.email ?? ""}.`)}`}>
            <WhatsAppIcon className="h-4 w-4" /> Falar com a equipe
          </a>
          {user && <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Sair</button>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Área do membro                                                      */
/* ------------------------------------------------------------------ */

type LoadState =
  | { status: "loading" }
  | { status: "ok"; source: DataSource; bundle: Bundle; references: Member[] }
  | { status: "sem-acesso" }
  | { status: "setup" }
  | { status: "erro"; message: string }

function Workspace({ preview, asMember, isAdmin }: { preview: boolean; asMember: string | null; isAdmin: boolean }) {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const refCache = useRef(new Map<string, Promise<Bundle | null>>())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const source = await getSource(preview)
        const result = await source.loadSelf(asMember ?? undefined)
        if (cancelled) return
        setState(result.status === "ok" ? { status: "ok", source, bundle: result.bundle, references: result.references } : { status: "sem-acesso" })
      } catch (err) {
        if (cancelled) return
        if (err instanceof SetupMissingError) setState({ status: "setup" })
        else setState({ status: "erro", message: err instanceof Error ? err.message : "Erro inesperado." })
      }
    })()
    return () => { cancelled = true }
  }, [preview, asMember, user?.id])

  const value = useMemo<MemberCtx | null>(() => {
    if (state.status !== "ok") return null
    const { source, bundle, references } = state
    return {
      source,
      bundle,
      member: bundle.member,
      summary: summarizeProfile(bundle),
      references,
      adminPreview: Boolean(asMember && isAdmin && !preview),
      loadReference: (id) => {
        const cached = refCache.current.get(id)
        if (cached) return cached
        const p = source.getBundle(id, true)
        refCache.current.set(id, p)
        return p
      },
      whatsapp: (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text ?? `Olá! Sou ${bundle.member.fullName}, membro da Zyron.`)}`,
    }
  }, [state, asMember, isAdmin, preview])

  if (state.status === "loading") return <Splash />
  if (state.status === "setup") {
    return <NoAccess title="Área de membros em preparação">A equipe Zyron está finalizando a sua área. Volte em breve ou fale com a gente.</NoAccess>
  }
  if (state.status === "sem-acesso") {
    return (
      <NoAccess title="Seu acesso ainda não foi liberado">
        A área de membros abre quando a equipe Zyron libera o seu e-mail. Se você acabou de criar a senha, confirme o
        e-mail pelo link que enviamos e entre de novo.
      </NoAccess>
    )
  }
  if (state.status === "erro" || !value) {
    return <NoAccess title="Não foi possível abrir a sua área">{state.status === "erro" ? state.message : ""}</NoAccess>
  }

  return (
    <Ctx.Provider value={value}>
      <Shell />
    </Ctx.Provider>
  )
}

function useTitle() {
  const { pathname } = useLocation()
  if (pathname.startsWith("/membros/partidas/")) return { kicker: "Partidas", title: "Análise da partida" }
  if (pathname.startsWith("/membros/partidas")) return { kicker: "Seus jogos", title: "Partidas" }
  if (pathname.startsWith("/membros/desempenho")) return { kicker: "Temporada", title: "Desempenho" }
  if (pathname.startsWith("/membros/comparativo")) return { kicker: "Lado a lado", title: "Comparativo" }
  if (pathname.startsWith("/membros/perfil")) return { kicker: "Seus dados", title: "Perfil" }
  return { kicker: "Área de membros", title: "Início" }
}

function Shell() {
  const { member, adminPreview, whatsapp, source } = useMember()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { kicker, title } = useTitle()

  useEffect(() => { setOpen(false) }, [location.pathname])

  const exitPreview = () => {
    try {
      sessionStorage.removeItem(AS_MEMBER_KEY)
    } catch {
      /* sem storage */
    }
    navigate(`/voxen/membros/${encodeURIComponent(member.id)}`)
  }

  return (
    <>
      {open && <div className="vx-scrim" onClick={() => setOpen(false)} />}
      <MemberSidebar open={open} email={source.preview ? member.email ?? "" : user?.email ?? member.email ?? ""} onSignOut={source.preview || adminPreview ? undefined : () => void signOut()} />

      <div className="vx-main">
        {adminPreview && (
          <div className="mb-preview-bar">
            <Eye className="h-4 w-4" /> Você está vendo a área como <strong>{member.fullName}</strong> (só as partidas publicadas).
            <button type="button" className="vx-btn ml-auto h-8" onClick={exitPreview}>Voltar ao painel</button>
          </div>
        )}
        <header className="vx-top">
          <button type="button" className="vx-icon-btn vx-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="vx-top-title">
            <span className="vx-top-kicker">{kicker}</span>
            <h1 className="vx-top-h1">{title}</h1>
          </div>
          <a className="vx-btn vx-btn--wpp ml-auto" href={whatsapp(`Olá! Sou ${member.fullName}, membro da Zyron, e quero falar com a equipe.`)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" /><span className="hidden sm:inline">Falar com a equipe</span>
          </a>
        </header>

        <main className="vx-page">
          <Suspense fallback={<PageSkeleton />}>
            <div key={location.pathname} className="vx-page-enter">
              <Routes>
                <Route index element={<HomePage />} />
                <Route path="partidas" element={<MatchesPage />} />
                <Route path="partidas/:id" element={<MatchPage />} />
                <Route path="desempenho" element={<PerformancePage />} />
                <Route path="comparativo" element={<ComparePage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/membros" replace />} />
              </Routes>
            </div>
          </Suspense>
        </main>
      </div>
    </>
  )
}

function MemberSidebar({ open, email, onSignOut }: { open: boolean; email: string; onSignOut?: () => void }) {
  const { member } = useMember()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState({ y: 0, visible: false })
  const activeIndex = NAV.findIndex((n) => (n.end ? pathname === n.to || pathname === `${n.to}/` : pathname.startsWith(n.to)))

  const measure = useCallback(() => {
    const el = navRef.current?.querySelectorAll<HTMLElement>(".vx-nav-item")[activeIndex]
    setPill(el ? { y: el.offsetTop, visible: true } : (p) => ({ ...p, visible: false }))
  }, [activeIndex])
  useLayoutEffect(measure, [measure])

  return (
    <aside className={`vx-side ${open ? "is-open" : ""}`} aria-label="Navegação da área de membros">
      <div className="vx-brand">
        <span className="flex items-center gap-3">
          <ZyronMark size={36} />
          <span>
            <span className="vx-brand-word block">ZYRON</span>
            <span className="vx-brand-sub block">Área de membros</span>
          </span>
        </span>
      </div>

      <div className="mb-side-profile">
        <MemberAvatar member={member} size={46} ring="#fbbf24" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{member.fullName}</p>
          <p className="truncate text-[12px] text-zinc-500">{[member.position, member.category].filter(Boolean).join(" · ") || "Atleta Zyron"}</p>
        </div>
      </div>

      <p className="vx-nav-label">Plataforma</p>
      <nav ref={navRef} className="vx-nav">
        <span className="vx-nav-pill" style={{ transform: `translateY(${pill.y}px)`, opacity: pill.visible ? 1 : 0 }} aria-hidden="true" />
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `vx-nav-item ${isActive ? "is-active" : ""}`}>
            <Icon />{label}
          </NavLink>
        ))}
      </nav>

      <div className="vx-side-foot">
        <div className="vx-user">
          <div className="min-w-0 flex-1">
            <div className="vx-user-email">{email}</div>
            <div className="vx-user-role">Membro Zyron</div>
          </div>
          {onSignOut && <button type="button" className="vx-icon-btn" onClick={onSignOut} aria-label="Sair" title="Sair"><LogOut /></button>}
        </div>
      </div>
    </aside>
  )
}
