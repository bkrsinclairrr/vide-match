import "@/pages/voxen/voxen.css"
import "./membros.css"

import {
  createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Clapperboard, Eye, GitCompareArrows, Home, Lock, LogOut, Menu, UserRound } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { WHATSAPP_NUMBER } from "@/lib/funnel"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { PageSkeleton, VoxenMark, VoxenWordmark } from "@/pages/voxen/ui"
import { SetupMissingError, getSource, type DataSource } from "./api"
import { summarizeProfile, type ProfileSummary } from "./metrics"
import type { Bundle, Member } from "./model"
import { CLIENT_BASE, clearAsMember } from "./paths"
import { MemberAvatar } from "./components/bits"

const HomePage = lazy(() => import("./pages/HomePage"))
const MatchesPage = lazy(() => import("./pages/MatchesPage"))
const MatchPage = lazy(() => import("./pages/MatchPage"))
const PerformancePage = lazy(() => import("./pages/PerformancePage"))
const ComparePage = lazy(() => import("./pages/ComparePage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))

const NAV = [
  { to: CLIENT_BASE, label: "Início", icon: Home, end: true },
  { to: `${CLIENT_BASE}/partidas`, label: "Partidas", icon: Clapperboard, end: false },
  { to: `${CLIENT_BASE}/desempenho`, label: "Desempenho", icon: BarChart3, end: false },
  { to: `${CLIENT_BASE}/comparativo`, label: "Comparativo", icon: GitCompareArrows, end: false },
  { to: `${CLIENT_BASE}/perfil`, label: "Perfil", icon: UserRound, end: false },
]

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
  if (!ctx) throw new Error("useMember fora da área do cliente")
  return ctx
}

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><VoxenMark size={56} /></div>
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
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Quero acessar a minha área na Zyron com o e-mail ${user?.email ?? ""}.`)}`}>
            <WhatsAppIcon className="h-4 w-4" /> Falar com a equipe
          </a>
          {user && <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Sair</button>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Área do cliente                                                     */
/* ------------------------------------------------------------------ */

type LoadState =
  | { status: "loading" }
  | { status: "ok"; source: DataSource; bundle: Bundle; references: Member[] }
  | { status: "sem-acesso" }
  | { status: "setup" }
  | { status: "erro"; message: string }

/**
 * A parte da VOXEN do cliente da Zyron: cada atleta vê só o próprio perfil,
 * as partidas publicadas e as referências. `asMember` é o admin vendo a área
 * como um membro; `preview` usa os dados locais (só no `npm run dev`).
 */
export default function ClientArea({ preview, asMember, isAdmin }: { preview: boolean; asMember: string | null; isAdmin: boolean }) {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const refCache = useRef(new Map<string, Promise<Bundle | null>>())

  useEffect(() => {
    const prev = document.title
    document.title = "Área do membro · Zyron"
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    refCache.current.clear()
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
      adminPreview: Boolean(asMember && isAdmin),
      loadReference: (id) => {
        const cached = refCache.current.get(id)
        if (cached) return cached
        const p = source.getBundle(id, true)
        refCache.current.set(id, p)
        return p
      },
      whatsapp: (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text ?? `Olá! Sou ${bundle.member.fullName}, membro da Zyron.`)}`,
    }
  }, [state, asMember, isAdmin])

  if (state.status === "loading") return <Splash />
  if (state.status === "setup") {
    return <NoAccess title="Sua área está em preparação">A equipe Zyron está finalizando a sua área. Volte em breve ou fale com a gente.</NoAccess>
  }
  if (state.status === "sem-acesso") {
    return (
      <NoAccess title="Seu acesso ainda não foi liberado">
        A sua área abre quando a equipe Zyron libera o seu e-mail. Se você acabou de criar a senha, confirme o e-mail
        pelo link que enviamos e entre de novo.
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
  if (pathname.startsWith(`${CLIENT_BASE}/partidas/`)) return { kicker: "Partidas", title: "Análise da partida" }
  if (pathname.startsWith(`${CLIENT_BASE}/partidas`)) return { kicker: "Seus jogos", title: "Partidas" }
  if (pathname.startsWith(`${CLIENT_BASE}/desempenho`)) return { kicker: "Temporada", title: "Desempenho" }
  if (pathname.startsWith(`${CLIENT_BASE}/comparativo`)) return { kicker: "Lado a lado", title: "Comparativo" }
  if (pathname.startsWith(`${CLIENT_BASE}/perfil`)) return { kicker: "Seus dados", title: "Perfil" }
  return { kicker: "Área do membro", title: "Início" }
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
    clearAsMember()
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
                <Route path="cliente" element={<HomePage />} />
                <Route path="cliente/partidas" element={<MatchesPage />} />
                <Route path="cliente/partidas/:id" element={<MatchPage />} />
                <Route path="cliente/desempenho" element={<PerformancePage />} />
                <Route path="cliente/comparativo" element={<ComparePage />} />
                <Route path="cliente/perfil" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to={CLIENT_BASE} replace />} />
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
    <aside className={`vx-side ${open ? "is-open" : ""}`} aria-label="Navegação da área do membro">
      <div className="vx-brand"><VoxenWordmark sub="Área do membro" /></div>

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
