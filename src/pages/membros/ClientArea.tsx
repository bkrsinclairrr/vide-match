import "@/pages/voxen/voxen.css"
import "./membros.css"

import {
  createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3, Clapperboard, Compass, Eye, GitCompareArrows, Home, Lock, LogOut, Menu, Trophy, UserRound,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { WHATSAPP_NUMBER } from "@/lib/funnel"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronMark } from "@/pages/site/ZyronMark"
import { PageSkeleton } from "@/pages/voxen/ui"
import { SetupMissingError, getPreviewAccount, getSource, type DataSource } from "./api"
import { loadAccountByAtletaId, loadAccountByUserId, loadOwnAccount, withMember, type AthleteAccount } from "./account"
import { categoryOf, gameOf, reportOf, type Game, type Report } from "./game"
import { summarizeProfile, type ProfileSummary } from "./metrics"
import type { Bundle, Member } from "./model"
import { CLIENT_BASE, clearAsMember } from "./paths"
import { MemberAvatar } from "./components/bits"

const StartPage = lazy(() => import("./pages/StartPage"))
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"))
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"))
const AthleteComparePage = lazy(() => import("./pages/AthleteComparePage"))
const AthleteProfilePage = lazy(() => import("./pages/AthleteProfilePage"))
const MatchesPage = lazy(() => import("./pages/MatchesPage"))
const MatchPage = lazy(() => import("./pages/MatchPage"))
const PerformancePage = lazy(() => import("./pages/PerformancePage"))
const Locked = lazy(() => import("./pages/Locked"))

const NAV = [
  { to: CLIENT_BASE, label: "Início", icon: Home, end: true, needsMember: false },
  { to: `${CLIENT_BASE}/oportunidades`, label: "Oportunidades", icon: Compass, end: false, needsMember: false },
  { to: `${CLIENT_BASE}/conquistas`, label: "Conquistas", icon: Trophy, end: false, needsMember: false },
  { to: `${CLIENT_BASE}/comparativo`, label: "Comparativo", icon: GitCompareArrows, end: false, needsMember: false },
  { to: `${CLIENT_BASE}/partidas`, label: "Partidas", icon: Clapperboard, end: false, needsMember: true },
  { to: `${CLIENT_BASE}/desempenho`, label: "Desempenho", icon: BarChart3, end: false, needsMember: true },
  { to: `${CLIENT_BASE}/perfil`, label: "Perfil", icon: UserRound, end: false, needsMember: false },
]

/* ------------------------------------------------------------------ */
/* Contextos                                                           */
/* ------------------------------------------------------------------ */

/** Acesso à análise de partidas (zyron_members): só existe para quem a equipe liberou. */
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

/** O atleta: dados da conta, relatório, nível e, se liberado, a análise das partidas. */
type AthleteCtx = {
  account: AthleteAccount
  category: string | null
  report: Report | null
  game: Game
  member: MemberCtx | null
  adminPreview: boolean
  whatsapp: (text?: string) => string
}

const MemberContext = createContext<MemberCtx | null>(null)
const AthleteContext = createContext<AthleteCtx | null>(null)

/** Dados da análise de partidas; só dentro das rotas que exigem acesso liberado. */
export function useMember() {
  const ctx = useContext(MemberContext)
  if (!ctx) throw new Error("useMember fora das rotas do membro")
  return ctx
}

export function useAthlete() {
  const ctx = useContext(AthleteContext)
  if (!ctx) throw new Error("useAthlete fora da área do cliente")
  return ctx
}

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><ZyronMark size={56} /></div>
    </div>
  )
}

function Failure({ title, children }: { title: string; children: ReactNode }) {
  const { signOut, user } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card max-w-lg text-center" style={{ animation: "vx-rise .7s var(--vx-ease) both" }}>
        <span className="vx-empty-icon mx-auto"><Lock className="h-6 w-6" /></span>
        <h1 className="mt-4 text-[20px] font-bold">{title}</h1>
        <div className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">{children}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a className="vx-btn vx-btn--wpp" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Não consegui abrir a minha área na Zyron${user?.email ? ` (${user.email})` : ""}.`)}`}>
            <WhatsAppIcon className="h-4 w-4" /> Falar com a equipe
          </a>
          {user && <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Sair</button>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Carga                                                               */
/* ------------------------------------------------------------------ */

type Loaded = {
  source: DataSource
  account: AthleteAccount
  membership: { bundle: Bundle; references: Member[] } | null
}

type LoadState = { status: "loading" } | ({ status: "ok" } & Loaded) | { status: "erro"; message: string }

async function loadClient(opts: { preview: boolean; asMember: string | null; own: () => Promise<AthleteAccount> }): Promise<Loaded> {
  const { preview, asMember } = opts
  const source = await getSource(preview)

  // O acesso à análise de partidas é opcional: sem as tabelas ou sem cadastro, a pessoa segue com a conta.
  const membershipOf = async (memberId?: string) => {
    try {
      const r = await source.loadSelf(memberId)
      return r.status === "ok" ? { bundle: r.bundle, references: r.references } : null
    } catch (err) {
      if (err instanceof SetupMissingError) return null
      throw err
    }
  }

  if (preview) {
    if (asMember === "conta") {
      const account = await getPreviewAccount()
      if (!account) throw new Error("Conta de teste indisponível.")
      return { source, account, membership: null }
    }
    const membership = await membershipOf(asMember ?? undefined)
    if (!membership) throw new Error("Membro não encontrado.")
    return { source, account: withMember(null, membership.bundle.member), membership }
  }

  if (asMember?.startsWith("atleta:")) {
    const account = await loadAccountByAtletaId(Number(asMember.slice(7)))
    if (!account) throw new Error("Atleta não encontrado.")
    // Sem as tabelas de membros (migração pendente) ou sem cadastro, segue só com a conta.
    const member = account.userId
      ? await source.findByUser(account.userId).catch((err) => { if (err instanceof SetupMissingError) return null; throw err })
      : null
    const membership = member ? await membershipOf(member.id) : null
    return { source, account: membership ? withMember(account, membership.bundle.member) : account, membership }
  }

  if (asMember) {
    const membership = await membershipOf(asMember)
    if (!membership) throw new Error("Membro não encontrado.")
    const member = membership.bundle.member
    const account = member.userId ? await loadAccountByUserId(member.userId, member.email) : null
    return { source, account: withMember(account, member), membership }
  }

  const [account, membership] = await Promise.all([opts.own(), membershipOf()])
  return { source, account: membership ? withMember(account, membership.bundle.member) : account, membership }
}

/**
 * A parte da VOXEN de quem entra com a conta da Zyron. Cada pessoa vê só o que
 * é dela: perfil, relatório, nível, conquistas, oportunidades e comparativos
 * (e, quando a equipe libera, a análise lance a lance dos jogos). `asMember` é
 * o admin vendo a área como outra pessoa; `preview` usa dados locais (só no
 * `npm run dev`).
 */
export default function ClientArea({ preview, asMember, isAdmin }: { preview: boolean; asMember: string | null; isAdmin: boolean }) {
  const { user } = useAuth()
  const userRef = useRef(user)
  userRef.current = user
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const refCache = useRef(new Map<string, Promise<Bundle | null>>())

  useEffect(() => {
    const prev = document.title
    document.title = "Minha área · Zyron"
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    refCache.current.clear()
    loadClient({
      preview,
      asMember,
      own: () => {
        const u = userRef.current
        if (!u) throw new Error("Sessão expirada. Entre de novo.")
        return loadOwnAccount(u)
      },
    })
      .then((loaded) => { if (!cancelled) setState({ status: "ok", ...loaded }) })
      .catch((err) => { if (!cancelled) setState({ status: "erro", message: err instanceof Error ? err.message : "Erro inesperado." }) })
    return () => { cancelled = true }
  }, [preview, asMember, user?.id])

  const value = useMemo(() => {
    if (state.status !== "ok") return null
    const { source, account, membership } = state
    const adminPreview = Boolean(asMember && isAdmin)
    const whatsapp = (text?: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text ?? `Olá! Sou ${account.name}, da Zyron.`)}`
    const summary = membership ? summarizeProfile(membership.bundle) : null
    const memberCtx: MemberCtx | null = membership && summary
      ? {
          source,
          bundle: membership.bundle,
          member: membership.bundle.member,
          summary,
          references: membership.references,
          adminPreview,
          loadReference: (id) => {
            const cached = refCache.current.get(id)
            if (cached) return cached
            const p = source.getBundle(id, true)
            refCache.current.set(id, p)
            return p
          },
          whatsapp,
        }
      : null
    const category = categoryOf(account.age) ?? membership?.bundle.member.category ?? null
    const athlete: AthleteCtx = { account, category, report: reportOf(account), game: gameOf(account, summary), member: memberCtx, adminPreview, whatsapp }
    return { athlete, memberCtx, source }
  }, [state, asMember, isAdmin])

  if (state.status === "loading") return <Splash />
  if (state.status === "erro" || !value) {
    return <Failure title="Não foi possível abrir a sua área">{state.status === "erro" ? state.message : ""}</Failure>
  }

  return (
    <AthleteContext.Provider value={value.athlete}>
      <MemberContext.Provider value={value.memberCtx}>
        <Shell asMember={asMember} previewing={value.source.preview} />
      </MemberContext.Provider>
    </AthleteContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */

function useTitle() {
  const { pathname } = useLocation()
  if (pathname.startsWith(`${CLIENT_BASE}/partidas/`)) return { kicker: "Partidas", title: "Análise da partida" }
  if (pathname.startsWith(`${CLIENT_BASE}/partidas`)) return { kicker: "Seus jogos", title: "Partidas" }
  if (pathname.startsWith(`${CLIENT_BASE}/desempenho`)) return { kicker: "Temporada", title: "Desempenho" }
  if (pathname.startsWith(`${CLIENT_BASE}/oportunidades`)) return { kicker: "Para o seu perfil", title: "Oportunidades" }
  if (pathname.startsWith(`${CLIENT_BASE}/conquistas`)) return { kicker: "Seu progresso", title: "Conquistas" }
  if (pathname.startsWith(`${CLIENT_BASE}/comparativo`)) return { kicker: "Lado a lado", title: "Comparativo" }
  if (pathname.startsWith(`${CLIENT_BASE}/perfil`)) return { kicker: "Seus dados", title: "Perfil" }
  return { kicker: "Minha área", title: "Início" }
}

/** Rotas que dependem da análise de partidas: sem acesso liberado, mostram o convite para liberar. */
function MemberOnly({ page, children }: { page: "partidas" | "desempenho"; children: ReactNode }) {
  const { member } = useAthlete()
  return member ? <>{children}</> : <Locked page={page} />
}

function Shell({ asMember, previewing }: { asMember: string | null; previewing: boolean }) {
  const { account, adminPreview, whatsapp, member } = useAthlete()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { kicker, title } = useTitle()

  useEffect(() => { setOpen(false) }, [location.pathname])

  const exitPreview = () => {
    clearAsMember()
    if (asMember?.startsWith("atleta:")) navigate(`/voxen/jogadores/${encodeURIComponent(asMember)}`)
    else if (member) navigate(`/voxen/membros/${encodeURIComponent(member.member.id)}`)
    else navigate("/voxen/membros")
  }

  return (
    <>
      {open && <div className="vx-scrim" onClick={() => setOpen(false)} />}
      <ClientSidebar open={open} email={previewing ? account.email ?? "" : user?.email ?? account.email ?? ""} onSignOut={previewing || adminPreview ? undefined : () => void signOut()} />

      <div className="vx-main">
        {adminPreview && (
          <div className="mb-preview-bar">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">Você está vendo a área como <strong>{account.name}</strong> (somente o que ela vê).</span>
            <button type="button" className="vx-btn h-8 shrink-0" onClick={exitPreview}>Voltar ao painel</button>
          </div>
        )}
        <header className="vx-top">
          <button type="button" className="vx-icon-btn vx-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="vx-top-title">
            <span className="vx-top-kicker">{kicker}</span>
            <h1 className="vx-top-h1">{title}</h1>
          </div>
          <a className="vx-btn vx-btn--wpp ml-auto" href={whatsapp(`Olá! Sou ${account.name}, da Zyron, e quero falar com a equipe.`)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" /><span className="hidden sm:inline">Falar com a equipe</span>
          </a>
        </header>

        <main className="vx-page">
          <Suspense fallback={<PageSkeleton />}>
            <div key={location.pathname} className="vx-page-enter">
              <Routes>
                <Route index element={<StartPage />} />
                <Route path="oportunidades" element={<OpportunitiesPage />} />
                <Route path="conquistas" element={<AchievementsPage />} />
                <Route path="comparativo" element={<AthleteComparePage />} />
                <Route path="partidas" element={<MemberOnly page="partidas"><MatchesPage /></MemberOnly>} />
                <Route path="partidas/:id" element={<MemberOnly page="partidas"><MatchPage /></MemberOnly>} />
                <Route path="desempenho" element={<MemberOnly page="desempenho"><PerformancePage /></MemberOnly>} />
                <Route path="perfil" element={<AthleteProfilePage />} />
                <Route path="*" element={<Navigate to={CLIENT_BASE} replace />} />
              </Routes>
            </div>
          </Suspense>
        </main>
      </div>
    </>
  )
}

function ClientSidebar({ open, email, onSignOut }: { open: boolean; email: string; onSignOut?: () => void }) {
  const { account, category, game, member } = useAthlete()
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
    <aside className={`vx-side ${open ? "is-open" : ""}`} aria-label="Navegação da sua área">
      <div className="vx-brand">
        <span className="flex items-center gap-3">
          <ZyronMark size={36} />
          <span>
            <span className="vx-brand-word block">ZYRON</span>
            <span className="vx-brand-sub block">Minha área</span>
          </span>
        </span>
      </div>

      <div className="mb-side-profile">
        <MemberAvatar member={{ fullName: account.name, photoUrl: account.avatarUrl, kind: "membro" }} size={46} ring="#fbbf24" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold">{account.name}</p>
          <p className="truncate text-[12px] text-zinc-500">{[account.position, category].filter(Boolean).join(" · ") || "Atleta Zyron"}</p>
        </div>
      </div>
      <NavLink to={`${CLIENT_BASE}/conquistas`} className="gm-side-level" aria-label={`Nível ${game.level}, ${game.title}. Ver conquistas`}>
        <span className="gm-lvl">{game.level}</span>
        <span className="min-w-0 flex-1">
          <b>{game.title}</b>
          <i><span style={{ width: `${game.pct}%` }} /></i>
        </span>
        <small className="tnum">{game.xp} XP</small>
      </NavLink>

      <p className="vx-nav-label">Minha área</p>
      <nav ref={navRef} className="vx-nav">
        <span className="vx-nav-pill" style={{ transform: `translateY(${pill.y}px)`, opacity: pill.visible ? 1 : 0 }} aria-hidden="true" />
        {NAV.map(({ to, label, icon: Icon, end, needsMember }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `vx-nav-item ${isActive ? "is-active" : ""}`}>
            <Icon />{label}
            {needsMember && !member && <Lock className="ml-auto !h-3.5 !w-3.5 text-zinc-500" aria-label="Disponível quando a equipe liberar a análise dos seus jogos" />}
          </NavLink>
        ))}
      </nav>

      <div className="vx-side-foot">
        <div className="vx-user">
          <div className="min-w-0 flex-1">
            <div className="vx-user-email">{email}</div>
            <div className="vx-user-role">{member ? "Membro Zyron" : "Atleta Zyron"}</div>
          </div>
          {onSignOut && <button type="button" className="vx-icon-btn" onClick={onSignOut} aria-label="Sair" title="Sair"><LogOut /></button>}
        </div>
      </div>
    </aside>
  )
}
