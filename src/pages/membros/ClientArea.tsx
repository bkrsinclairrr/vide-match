import "@/pages/voxen/voxen.css"
import "./membros.css"

import {
  createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type ChangeEvent, type ReactNode,
} from "react"
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3, Clapperboard, Compass, Eye, GitCompareArrows, Home, Lock, LogOut, Menu, Trophy, UserRound,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { WHATSAPP_NUMBER } from "@/lib/funnel"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { ZyronMark } from "@/pages/site/ZyronMark"
import { PageSkeleton } from "@/pages/voxen/ui"
import { SetupMissingError, getPreviewAccount, getSource, type DataSource } from "./api"
import { loadAccountByAtletaId, loadAccountByUserId, loadOwnAccount, withMember, type AthleteAccount } from "./account"
import { loadCareer } from "./career"
import { loadScoutLayer, setMyPhotoMode, type PhotoMode, type ScoutLayer } from "./scoutLayer"
import { categoryOf, gameOf, reportOf, type Career, type Game, type Gates, type Report } from "./game"
import { summarizeProfile, type ProfileSummary } from "./metrics"
import type { Bundle, Member } from "./model"
import { CLIENT_BASE, PROFILE_FORM_PATH, clearAsMember } from "./paths"
import { saveOwnPhoto, squarePhoto } from "./photo"
import { MemberAvatar } from "./components/bits"
import { JourneyToast } from "./components/Celebrate"
import { useJourneyNews } from "./news"

const StartPage = lazy(() => import("./pages/StartPage"))
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage"))
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"))
const AthleteComparePage = lazy(() => import("./pages/AthleteComparePage"))
const AthleteProfilePage = lazy(() => import("./pages/AthleteProfilePage"))
const MatchesPage = lazy(() => import("./pages/MatchesPage"))
const MatchPage = lazy(() => import("./pages/MatchPage"))
const PerformancePage = lazy(() => import("./pages/PerformancePage"))
const Locked = lazy(() => import("./pages/Locked"))
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"))

/** `open`: quando o item fica aberto; sem isso, o item mostra o cadeado (e a página explica como liberar). */
const NAV: { to: string; label: string; icon: typeof Home; end: boolean; open: ((g: Gates) => boolean) | null; hint?: string }[] = [
  { to: CLIENT_BASE, label: "Início", icon: Home, end: true, open: null },
  { to: `${CLIENT_BASE}/oportunidades`, label: "Oportunidades", icon: Compass, end: false, open: (g) => g.opportunities, hint: "Libera quando você completar o perfil" },
  { to: `${CLIENT_BASE}/conquistas`, label: "Conquistas", icon: Trophy, end: false, open: null },
  { to: `${CLIENT_BASE}/comparativo`, label: "Comparativo", icon: GitCompareArrows, end: false, open: (g) => g.compare, hint: "Libera depois que você enviar o vídeo de um jogo" },
  // Partidas abre já para enviar o primeiro jogo; a análise aparece quando a equipe terminar.
  { to: `${CLIENT_BASE}/partidas`, label: "Partidas", icon: Clapperboard, end: false, open: (g) => g.matches || g.analysis, hint: "Libera quando você completar o perfil" },
  { to: `${CLIENT_BASE}/desempenho`, label: "Desempenho", icon: BarChart3, end: false, open: (g) => g.performance, hint: "Libera com a análise dos seus jogos" },
  { to: `${CLIENT_BASE}/perfil`, label: "Perfil", icon: UserRound, end: false, open: null },
]

/** Itens do menu que uma missão recém-cumprida acabou de abrir (ganham o selo "Novo" até a pessoa visitar). */
const OPENS: Record<string, string[]> = {
  perfil: [`${CLIENT_BASE}/oportunidades`, `${CLIENT_BASE}/partidas`],
  analise: [`${CLIENT_BASE}/partidas`, `${CLIENT_BASE}/desempenho`],
}

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

/** O atleta: dados da conta, relatório, nível, jornada e, se liberado, a análise das partidas. */
type AthleteCtx = {
  account: AthleteAccount
  category: string | null
  report: Report | null
  game: Game
  career: Career
  /** O que a equipe publicou para a pessoa: travas, foto de corpo inteiro, oportunidades e os vídeos enviados. */
  layer: ScoutLayer
  member: MemberCtx | null
  adminPreview: boolean
  /** Dados locais do `npm run dev` (?demo). */
  preview: boolean
  whatsapp: (text?: string) => string
  /** Lê tudo de novo do banco sem piscar a tela (volta de outra aba, foto nova...). */
  refresh: () => Promise<void>
  /** Abre o seletor de foto (desligado no "ver como" da equipe). */
  pickPhoto: (() => void) | null
  photoBusy: boolean
  /** Escolhe como aparecer: foto de perfil ou corpo inteiro (desligado no "ver como" da equipe). Erro vem em português. */
  choosePhoto: ((mode: PhotoMode) => Promise<void>) | null
  /** Missões cumpridas desde a última visita (nesta sessão): as telas usam para animar o que acabou de abrir. */
  fresh: ReadonlySet<string>
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
  career: Career
  layer: ScoutLayer
}

type LoadState = { status: "loading" } | ({ status: "ok" } & Loaded) | { status: "erro"; message: string }

type LoadOpts = { preview: boolean; asMember: string | null; own: () => Promise<AthleteAccount> }

async function loadClient(opts: LoadOpts): Promise<Loaded> {
  const base = await loadBase(opts)
  const asStaff = Boolean(opts.asMember) && !opts.preview
  const memberId = base.membership?.bundle.member.id ?? null
  const [career, layer] = await Promise.all([
    loadCareer({ preview: opts.preview, asStaff, account: base.account, memberId }),
    loadScoutLayer({ preview: opts.preview, asStaff, memberId, userId: base.account.userId }),
  ])
  return { ...base, career, layer }
}

async function loadBase(opts: LoadOpts): Promise<Omit<Loaded, "career" | "layer">> {
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
    if (asMember === "conta" || asMember === "novo") {
      const account = await getPreviewAccount(asMember)
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
  const { toast } = useToast()
  // O formulário do perfil ocupa a tela inteira, sem o menu da área (e sem o aviso de missão cumprida por cima).
  const onProfileForm = useLocation().pathname.replace(/\/$/, "") === PROFILE_FORM_PATH
  const userRef = useRef(user)
  userRef.current = user
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const refCache = useRef(new Map<string, Promise<Bundle | null>>())
  const lastLoad = useRef(0)
  const photoInput = useRef<HTMLInputElement>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  // Foto recém-escolhida: aparece na hora, antes de o banco confirmar (e é a única forma no `npm run dev`).
  const [photoNow, setPhotoNow] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.title
    document.title = "Minha área · Zyron"
    return () => { document.title = prev }
  }, [])

  const load = useCallback(() => loadClient({
    preview,
    asMember,
    own: () => {
      const u = userRef.current
      if (!u) throw new Error("Sessão expirada. Entre de novo.")
      return loadOwnAccount(u)
    },
  }), [preview, asMember])

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    refCache.current.clear()
    load()
      .then((loaded) => { if (!cancelled) { lastLoad.current = Date.now(); setState({ status: "ok", ...loaded }) } })
      .catch((err) => { if (!cancelled) setState({ status: "erro", message: err instanceof Error ? err.message : "Erro inesperado." }) })
    return () => { cancelled = true }
  }, [load, user?.id])

  /** Busca de novo sem a tela de carregamento: se falhar, fica o que já estava na tela. */
  const refresh = useCallback(async () => {
    try {
      const loaded = await load()
      lastLoad.current = Date.now()
      setState((s) => (s.status === "ok" ? { status: "ok", ...loaded } : s))
    } catch {
      /* mantém a tela como está */
    }
  }, [load])

  // Sincronia: quem preencheu o perfil em outra aba, ou teve a ficha atualizada pela equipe,
  // vê a área mudar ao voltar para ela (no máximo uma busca a cada 30 s).
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState === "visible" && lastLoad.current && Date.now() - lastLoad.current > 30_000) void refresh()
    }
    document.addEventListener("visibilitychange", wake)
    window.addEventListener("focus", wake)
    return () => {
      document.removeEventListener("visibilitychange", wake)
      window.removeEventListener("focus", wake)
    }
  }, [refresh])

  const adminPreview = Boolean(asMember && isAdmin)
  const canPickPhoto = state.status === "ok" && !adminPreview && (state.source.preview || Boolean(user))
  const previewData = state.status === "ok" && state.source.preview

  /** A escolha vale na hora: o Início troca de foto sem buscar tudo de novo. */
  const choosePhoto = useCallback(async (mode: PhotoMode) => {
    const res = await setMyPhotoMode(mode, previewData)
    setState((s) => (s.status === "ok"
      ? { ...s, layer: { ...s.layer, photoMode: res.mode, bodyPhoto: res.mode === "corpo" ? s.layer.bodyPhotoOption : null, photoChoiceBy: res.choiceBy, photoChoiceAt: res.choiceAt } }
      : s))
  }, [previewData])

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || state.status !== "ok") return
    setPhotoBusy(true)
    try {
      const data = await squarePhoto(file)
      if (!state.source.preview) {
        if (!user) throw new Error("Sessão expirada. Entre de novo.")
        await saveOwnPhoto(user.id, data)
      }
      setPhotoNow(data)
      if (!state.source.preview) void refresh()
    } catch (err) {
      toast({ title: "Não foi possível salvar a foto", description: err instanceof Error ? err.message : "Tente outra imagem.", variant: "destructive" })
    } finally {
      setPhotoBusy(false)
    }
  }

  const value = useMemo(() => {
    if (state.status !== "ok") return null
    const { source, membership, career, layer } = state
    const account = photoNow ? { ...state.account, avatarUrl: photoNow } : state.account
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
    return { account, category, report: reportOf(account), game: gameOf(account, summary, career, layer), career, layer, member: memberCtx, whatsapp, source }
  }, [state, photoNow, adminPreview])

  // O que foi cumprido desde a última visita vira comemoração (a equipe vendo como o atleta não grava nada).
  const memoryKey = !value || adminPreview ? null : `zyron:jornada:${value.source.preview ? `teste:${asMember ?? "membro"}` : value.account.userId ?? value.account.seed}`
  const news = useJourneyNews(memoryKey, value?.game ?? null)

  const athlete = useMemo<AthleteCtx | null>(() => value && {
    account: value.account,
    category: value.category,
    report: value.report,
    game: value.game,
    career: value.career,
    layer: value.layer,
    member: value.member,
    adminPreview,
    preview: value.source.preview,
    whatsapp: value.whatsapp,
    refresh,
    pickPhoto: canPickPhoto ? () => photoInput.current?.click() : null,
    photoBusy,
    choosePhoto: canPickPhoto ? choosePhoto : null,
    fresh: news.fresh,
  }, [value, adminPreview, refresh, canPickPhoto, photoBusy, choosePhoto, news.fresh])

  if (state.status === "loading") return <Splash />
  if (state.status === "erro" || !value || !athlete) {
    return <Failure title="Não foi possível abrir a sua área">{state.status === "erro" ? state.message : ""}</Failure>
  }

  return (
    <AthleteContext.Provider value={athlete}>
      <MemberContext.Provider value={value.member}>
        {onProfileForm
          ? <Suspense fallback={<Splash />}><CompleteProfilePage /></Suspense>
          : <Shell asMember={asMember} previewing={value.source.preview} />}
        {news.current && !onProfileForm && <JourneyToast news={news.current} game={value.game} onClose={news.dismiss} />}
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => void onPhoto(e)} aria-hidden="true" tabIndex={-1} />
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

/**
 * Rotas que dependem da análise de partidas. Abrem com jogo analisado (ou com o acesso
 * liberado e o perfil pronto); antes disso mostram o passo que falta para liberar.
 */
function MemberOnly({ page, children }: { page: "partidas" | "desempenho"; children: ReactNode }) {
  const { member, game } = useAthlete()
  const open = page === "desempenho" ? game.gates.performance : game.gates.matches
  return member && open ? <>{children}</> : <Locked page={page} />
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
                <Route path="partidas" element={<MatchesPage />} />
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
  const { account, category, game, member, fresh } = useAthlete()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState({ y: 0, visible: false })
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set())
  const activeIndex = NAV.findIndex((n) => (n.end ? pathname === n.to || pathname === `${n.to}/` : pathname.startsWith(n.to)))
  const opened = useMemo(() => new Set([...fresh].flatMap((k) => OPENS[k] ?? [])), [fresh])

  // O selo "Novo" some depois que a pessoa abre a página que acabou de liberar.
  useEffect(() => {
    const hit = NAV.find((n) => !n.end && pathname.startsWith(n.to))
    if (hit && !visited.has(hit.to)) setVisited((v) => new Set(v).add(hit.to))
  }, [pathname, visited])

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
        {NAV.map(({ to, label, icon: Icon, end, open, hint }) => {
          const locked = open !== null && !open(game.gates)
          const isNew = !locked && opened.has(to) && !visited.has(to)
          return (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `vx-nav-item ${isActive ? "is-active" : ""} ${locked ? "is-locked" : ""}`}
              title={locked ? hint : undefined}>
              <Icon />{label}
              {locked && <span className="mb-nav-lock" aria-label={hint}><Lock /></span>}
              {isNew && <span className="mb-nav-new">Novo</span>}
            </NavLink>
          )
        })}
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
