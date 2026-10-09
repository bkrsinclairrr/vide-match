import "@fontsource-variable/inter"
import "./voxen.css"

import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowLeft, ArrowUpRight, GitCompareArrows, LayoutDashboard, Lock, LogOut, Mail, Menu, RefreshCw,
  Search, ShieldAlert, Shirt, Users, X,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { friendlyAuthError } from "@/lib/funnel"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VoxenProvider, useVoxen } from "./store"
import { positionCode } from "./data"
import { Avatar, PageSkeleton, ScoreChip, VoxenMark, VoxenWordmark, playerPath } from "./ui"

const Overview = lazy(() => import("./pages/Overview"))
const PlayersPage = lazy(() => import("./pages/PlayersPage"))
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"))
const Compare = lazy(() => import("./pages/Compare"))
const Squad = lazy(() => import("./pages/Squad"))

const NAV = [
  { to: "/voxen", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/voxen/jogadores", label: "Jogadores", icon: Users, end: false },
  { to: "/voxen/elenco", label: "Elenco", icon: Shirt, end: false },
  { to: "/voxen/comparativo", label: "Comparativo", icon: GitCompareArrows, end: false },
]

const DEMO_KEY = "voxen:demo"

/**
 * Modo demonstração: dados fictícios, sem login. Só existe no `npm run dev`
 * (import.meta.env.DEV é falso no build de produção, então o bloco some do
 * bundle publicado). Liga com /voxen?demo.
 */
function useDemoMode() {
  const { search } = useLocation()
  return useMemo(() => {
    if (!import.meta.env.DEV) return false
    try {
      if (new URLSearchParams(search).has("demo")) sessionStorage.setItem(DEMO_KEY, "1")
      return sessionStorage.getItem(DEMO_KEY) === "1"
    } catch {
      return false
    }
  }, [search])
}

export default function VoxenApp() {
  const demo = useDemoMode()

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "VOXEN · Scouting Zyron"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="vx">
      <div className="vx-backdrop" aria-hidden="true" />
      {demo ? <Workspace demo /> : <AccessGate />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Acesso: login + papel de admin                                      */
/* ------------------------------------------------------------------ */

type AdminState = { userId: string | null; status: "checking" | "admin" | "denied" }

function AccessGate() {
  const { session, user, loading } = useAuth()
  const [admin, setAdmin] = useState<AdminState>({ userId: null, status: "checking" })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setAdmin({ userId: user.id, status: "checking" })
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data, error }) => {
        if (cancelled) return
        setAdmin({ userId: user.id, status: !error && data && data.length > 0 ? "admin" : "denied" })
      })
    return () => { cancelled = true }
  }, [user])

  if (loading) return <Splash />
  if (!session || !user) return <LoginScreen />
  if (admin.userId !== user.id || admin.status === "checking") return <Splash />
  if (admin.status === "denied") return <Denied email={user.email ?? ""} />
  return <Workspace demo={false} />
}

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><VoxenMark size={56} /></div>
    </div>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) setError(friendlyAuthError(err.message))
  }

  return (
    <div className="vx-gate relative z-[1]">
      <aside className="vx-gate-art">
        <div className="vx-gate-orbit" aria-hidden="true" />
        <VoxenWordmark size={40} />
        <div className="relative max-w-[520px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-amber-300">Área restrita</p>
          <h1 className="mt-4 text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            Todos os atletas da Zyron,{" "}
            <span className="bg-gradient-to-b from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">em um só lugar.</span>
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-zinc-400">
            Perfis, relatórios, avaliação do scout, comparativos e o andamento de cada contato — para a equipe decidir
            com dados quem merece a próxima oportunidade.
          </p>
        </div>
        <p className="relative text-[12px] text-zinc-500">© 2026 Zyron · Acesso exclusivo de administradores</p>
      </aside>

      <section className="vx-gate-form">
        <form onSubmit={submit} className="vx-gate-card" noValidate>
          <div className="mb-8 lg:hidden"><VoxenWordmark /></div>
          <h2 className="text-[24px] font-bold tracking-[-0.02em]">Entrar na VOXEN</h2>
          <p className="mt-1.5 text-[13.5px] text-zinc-400">Use a mesma conta de administrador da Zyron.</p>

          <label className="mt-7 block text-[12px] font-semibold text-zinc-400" htmlFor="vx-email">E-mail</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input id="vx-email" type="email" autoComplete="username" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="vx-input vx-input--icon" placeholder="voce@zyron.com" />
          </div>

          <label className="mt-4 block text-[12px] font-semibold text-zinc-400" htmlFor="vx-pass">Senha</label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input id="vx-pass" type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="vx-input vx-input--icon" placeholder="••••••••" />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-[12.5px] text-red-300">{error}</p>
          )}

          <button type="submit" disabled={busy || !email || !password} className="vx-btn vx-btn--gold mt-6 h-11 w-full text-[14px]">
            {busy ? "Entrando..." : "Entrar"}
          </button>
          <div className="mt-5 flex items-center justify-between text-[12.5px]">
            <Link to="/reset-password" className="text-zinc-400 hover:text-amber-300">Esqueci a senha</Link>
            <Link to="/" className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}

function Denied({ email }: { email: string }) {
  const { signOut } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card max-w-md text-center" style={{ animation: "vx-rise .7s var(--vx-ease) both" }}>
        <span className="vx-empty-icon mx-auto" style={{ color: "#f87171", borderColor: "rgba(248,113,113,.3)", background: "rgba(248,113,113,.08)" }}>
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[20px] font-bold">Acesso restrito a administradores</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">
          A conta <strong className="text-zinc-200">{email}</strong> não tem permissão de administrador na Zyron.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="vx-btn">Voltar ao site</Link>
          <button type="button" className="vx-btn vx-btn--gold" onClick={() => void signOut()}>Trocar de conta</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Área de trabalho                                                    */
/* ------------------------------------------------------------------ */

function Workspace({ demo }: { demo: boolean }) {
  return (
    <VoxenProvider demo={demo}>
      <Shell />
    </VoxenProvider>
  )
}

function useTitle() {
  const { pathname } = useLocation()
  const { byKey } = useVoxen()
  if (pathname.startsWith("/voxen/jogadores/")) {
    const key = decodeURIComponent(pathname.split("/")[3] ?? "")
    return { kicker: "Jogadores", title: byKey.get(key)?.name ?? "Atleta" }
  }
  if (pathname.startsWith("/voxen/jogadores")) return { kicker: "Base de atletas", title: "Jogadores" }
  if (pathname.startsWith("/voxen/elenco")) return { kicker: "Por posição", title: "Elenco" }
  if (pathname.startsWith("/voxen/comparativo")) return { kicker: "Lado a lado", title: "Comparativo" }
  return { kicker: "Painel", title: "Visão geral" }
}

function Shell() {
  const { players, loading, reload, demo, error } = useVoxen()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const { kicker, title } = useTitle()

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPalette((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      {open && <div className="vx-scrim" onClick={() => setOpen(false)} />}
      <Sidebar open={open} count={players.length} email={demo ? "demonstracao@voxen" : user?.email ?? ""} onSignOut={demo ? undefined : () => void signOut()} />

      <div className="vx-main">
        <header className="vx-top">
          <button type="button" className="vx-icon-btn vx-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="vx-top-title">
            <span className="vx-top-kicker">{kicker}</span>
            <h1 className="vx-top-h1">{title}</h1>
          </div>
          {demo && <span className="vx-badge-demo">Demonstração</span>}
          <button type="button" className="vx-search" onClick={() => setPalette(true)} aria-label="Buscar atleta">
            <Search />
            <span>Buscar atleta, e-mail ou telefone</span>
            <span className="vx-kbd">Ctrl K</span>
          </button>
          <button
            type="button"
            className={`vx-icon-btn ${loading ? "vx-spin" : ""}`}
            onClick={() => void reload()}
            aria-label="Atualizar dados"
            title="Atualizar dados"
          >
            <RefreshCw />
          </button>
        </header>

        <main className="vx-page">
          {error ? (
            <div className="vx-card">
              <div className="vx-empty">
                <span className="vx-empty-icon"><ShieldAlert className="h-6 w-6" /></span>
                <strong className="text-white">Não foi possível carregar os atletas</strong>
                <span>{error}</span>
                <button type="button" className="vx-btn vx-btn--gold mt-2" onClick={() => void reload()}>Tentar de novo</button>
              </div>
            </div>
          ) : loading && !players.length ? (
            <PageSkeleton />
          ) : (
            <Suspense fallback={<PageSkeleton />}>
              <div key={location.pathname} className="vx-page-enter">
                <Routes>
                  <Route index element={<Overview />} />
                  <Route path="jogadores" element={<PlayersPage />} />
                  <Route path="jogadores/:key" element={<PlayerProfile />} />
                  <Route path="elenco" element={<Squad />} />
                  <Route path="comparativo" element={<Compare />} />
                  <Route path="*" element={<Navigate to="/voxen" replace />} />
                </Routes>
              </div>
            </Suspense>
          )}
        </main>
      </div>

      <Palette open={palette} onOpenChange={setPalette} />
    </>
  )
}

function Sidebar({ open, count, email, onSignOut }: { open: boolean; count: number; email: string; onSignOut?: () => void }) {
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ y: number; visible: boolean }>({ y: 0, visible: false })

  const activeIndex = NAV.findIndex((item) => (item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)))

  useLayoutEffect(() => {
    const nav = navRef.current
    const el = nav?.querySelectorAll<HTMLElement>(".vx-nav-item")[activeIndex]
    if (!nav || !el) {
      setPill((p) => ({ ...p, visible: false }))
      return
    }
    setPill({ y: el.offsetTop, visible: true })
  }, [activeIndex])

  return (
    <aside className={`vx-side ${open ? "is-open" : ""}`} aria-label="Navegação da VOXEN">
      <div className="vx-brand"><VoxenWordmark /></div>

      <p className="vx-nav-label">Plataforma</p>
      <nav ref={navRef} className="vx-nav">
        <span className="vx-nav-pill" style={{ transform: `translateY(${pill.y}px)`, opacity: pill.visible ? 1 : 0 }} aria-hidden="true" />
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `vx-nav-item ${isActive ? "is-active" : ""}`}>
            <Icon />
            {label}
            {to === "/voxen/jogadores" && <span className="vx-nav-count tnum">{count}</span>}
          </NavLink>
        ))}
      </nav>

      <p className="vx-nav-label">Atalhos</p>
      <nav className="vx-nav">
        <a href="/avaliacao" target="_blank" rel="noopener noreferrer" className="vx-nav-item">
          <ArrowUpRight /> Abrir o funil
        </a>
        <a href="/" target="_blank" rel="noopener noreferrer" className="vx-nav-item">
          <ArrowUpRight /> Site da Zyron
        </a>
      </nav>

      <div className="vx-side-foot">
        <div className="vx-user">
          <Avatar name={email || "Admin"} size={34} />
          <div className="min-w-0 flex-1">
            <div className="vx-user-email">{email}</div>
            <div className="vx-user-role">Administrador</div>
          </div>
          {onSignOut && (
            <button type="button" className="vx-icon-btn" onClick={onSignOut} aria-label="Sair" title="Sair">
              <LogOut />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

function Palette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { players } = useVoxen()
  const navigate = useNavigate()
  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0 shadow-2xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Buscar atleta</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
      <CommandInput placeholder="Buscar atleta por nome, e-mail, telefone ou cidade..." />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>Nenhum atleta encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {NAV.map(({ to, label, icon: Icon }) => (
            <CommandItem key={to} value={`pagina ${label}`} onSelect={() => go(to)}>
              <Icon className="mr-2 h-4 w-4" /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Atletas">
          {players.map((p) => (
            <CommandItem
              key={p.key}
              value={`${p.name} ${p.email ?? ""} ${p.phone ?? ""} ${p.profile.city ?? ""} ${p.profile.position ?? ""} ${p.key}`}
              onSelect={() => go(playerPath(p))}
            >
              <Avatar name={p.name} size={26} />
              <span className="ml-2.5 min-w-0 flex-1 truncate">{p.name}</span>
              <span className="mr-2 text-[11px] text-zinc-500">{positionCode(p)} · {p.profile.category ?? "—"}</span>
              <ScoreChip score={p.overall} size="sm" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t border-white/5 px-3 py-2 text-[11px] text-zinc-500">
        <span>Enter para abrir · Esc para fechar</span>
        <button type="button" onClick={() => onOpenChange(false)} className="inline-flex items-center gap-1 hover:text-zinc-300">
          <X className="h-3 w-3" /> Fechar
        </button>
      </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
