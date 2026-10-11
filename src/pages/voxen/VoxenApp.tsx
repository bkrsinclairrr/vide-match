import "@fontsource-variable/inter"
import "./voxen.css"

import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowUpRight, BadgeCheck, Eye, GitCompareArrows, LayoutDashboard, LogOut, Menu, RefreshCw,
  Search, ShieldAlert, ShieldCheck, Shirt, Users, X,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { clearAsMember } from "@/pages/membros/paths"
import { useAccessLevel } from "@/hooks/useAccessLevel"
import { useDevPreview } from "@/lib/devPreview"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VoxenProvider, useVoxen } from "./store"
import { LEVEL_LABEL, type StaffRole } from "./access"
import { positionCode } from "./data"
import { Avatar, PageSkeleton, ScoreChip, VoxenMark, VoxenWordmark, playerPath } from "./ui"
import { AccessCheckError, StaffLogin, StaffOnly } from "./StaffGate"

const Overview = lazy(() => import("./pages/Overview"))
const PlayersPage = lazy(() => import("./pages/PlayersPage"))
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"))
const Compare = lazy(() => import("./pages/Compare"))
const Squad = lazy(() => import("./pages/Squad"))
const AdminMembers = lazy(() => import("./pages/members/AdminMembers"))
const AdminMember = lazy(() => import("./pages/members/AdminMember"))
const AdminMatch = lazy(() => import("./pages/members/AdminMatch"))
const AdminCompare = lazy(() => import("./pages/members/AdminCompare"))
const AccountsPage = lazy(() => import("./pages/accounts/AccountsPage"))

const NAV = [
  { to: "/voxen", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/voxen/jogadores", label: "Jogadores", icon: Users, end: false },
  { to: "/voxen/membros", label: "Membros", icon: BadgeCheck, end: false },
  { to: "/voxen/elenco", label: "Elenco", icon: Shirt, end: false },
  { to: "/voxen/comparativo", label: "Comparativo", icon: GitCompareArrows, end: false },
  { to: "/voxen/contas", label: "Contas e acessos", icon: ShieldCheck, end: false },
]

export default function VoxenApp() {
  const dev = useDevPreview()

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "VOXEN · Equipe Zyron"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="vx">
      <div className="vx-backdrop" aria-hidden="true" />
      {dev.demo ? <Workspace demo role={dev.role} /> : <AccessGate />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Acesso: login da equipe + papel (administrador ou executivo)        */
/* ------------------------------------------------------------------ */

/**
 * A VOXEN é só da equipe. Sem sessão, mostra o login da equipe; conta de atleta
 * recebe um aviso com o caminho para a área dela (/minha-area). A RLS do banco é
 * quem garante os dados; esta tela só evita telas sem sentido.
 */
function AccessGate() {
  const { session, user, loading } = useAuth()
  const { level, loading: levelLoading, failed, retry } = useAccessLevel()

  if (loading) return <Splash />
  if (!session || !user) return <StaffLogin />
  if (failed) return <AccessCheckError onRetry={retry} />
  if (levelLoading || !level) return <Splash />
  if (level === "user") return <StaffOnly email={user.email ?? ""} />
  return <Workspace demo={false} role={level} />
}

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><VoxenMark size={56} /></div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Área de trabalho                                                    */
/* ------------------------------------------------------------------ */

function Workspace({ demo, role }: { demo: boolean; role: StaffRole }) {
  // O "ver como" de /minha-area não deve vazar para a próxima visita.
  useEffect(() => { clearAsMember() }, [])
  return (
    <VoxenProvider demo={demo} role={role}>
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
  if (pathname.startsWith("/voxen/contas")) return { kicker: "Administração", title: "Contas e acessos" }
  if (pathname.startsWith("/voxen/membros/comparar")) return { kicker: "Área de membros", title: "Comparar perfis" }
  if (pathname.endsWith("/partidas/nova")) return { kicker: "Área de membros", title: "Nova partida" }
  if (pathname.includes("/partidas/")) return { kicker: "Área de membros", title: "Partida e lances" }
  if (pathname.startsWith("/voxen/membros/")) return { kicker: "Área de membros", title: "Perfil" }
  if (pathname.startsWith("/voxen/membros")) return { kicker: "Área de membros", title: "Membros" }
  return { kicker: "Painel", title: "Visão geral" }
}

function Shell() {
  const { players, loading, reload, demo, error, role, canEdit } = useVoxen()
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
      <Sidebar open={open} count={players.length} role={role} email={demo ? (role === "admin" ? "equipe@aizyron.com" : "executivo@aizyron.com") : user?.email ?? ""} onSignOut={demo ? undefined : () => void signOut()} />

      <div className="vx-main">
        <header className="vx-top">
          <button type="button" className="vx-icon-btn vx-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="vx-top-title">
            <span className="vx-top-kicker">{kicker}</span>
            <h1 className="vx-top-h1">{title}</h1>
          </div>
          {!canEdit && (
            <span className="vx-tag vx-readonly" title="O seu acesso é de executivo: você vê tudo, mas não altera nada.">
              <Eye className="h-3 w-3" /> Somente leitura
            </span>
          )}
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
                  <Route path="contas" element={<AccountsPage />} />
                  <Route path="membros" element={<AdminMembers />} />
                  <Route path="membros/comparar" element={<AdminCompare />} />
                  <Route path="membros/:id" element={<AdminMember />} />
                  <Route path="membros/:id/partidas/:matchId" element={<AdminMatch />} />
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

function Sidebar({ open, count, email, role, onSignOut }: { open: boolean; count: number; email: string; role: StaffRole; onSignOut?: () => void }) {
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
            <div className="vx-user-role">{LEVEL_LABEL[role]}</div>
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
