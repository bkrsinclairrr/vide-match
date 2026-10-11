import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { ArrowUpRight, ChevronsLeft, ChevronsRight, LogOut, Menu, RefreshCw, Search, type LucideIcon } from "lucide-react"
import { Avatar, VoxenMark } from "./ui"
import { useScrollReveal, useScrolled } from "./motion"

/*
 * Estrutura compartilhada da VOXEN (/voxen) e da central de administração
 * (/admin): menu lateral recolhível, barra do topo com progresso, abas do
 * celular e tela de carregamento. Cada app só diz o que vai em cada lugar.
 */

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number; section: string }
export type Shortcut = { label: string; href?: string; to?: string; external?: boolean }
export type TabItem = Pick<NavItem, "to" | "label" | "icon" | "end">

function readCollapsed(key: string) {
  try { return localStorage.getItem(key) === "1" } catch { return false }
}

/** Ctrl K / Cmd K abre e fecha a busca rápida. */
export function useCommandShortcut(toggle: () => void) {
  const ref = useRef(toggle)
  ref.current = toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        ref.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}

export function Splash({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="vx-splash relative z-[1]" role="status" aria-label={label}>
      <div className="vx-splash-inner">
        <div className="vx-splash-orbit">
          <span className="vx-splash-ring" aria-hidden="true" />
          <div className="vx-splash-mark"><VoxenMark size={52} /></div>
        </div>
        <span className="vx-splash-bar" aria-hidden="true" />
      </div>
    </div>
  )
}

export function AppShell({
  brand, nav, tabs, shortcuts, email, roleLabel, onSignOut, kicker, title, chip, searchLabel, onSearch, onRefresh, loading,
  collapseKey, ariaLabel, children, extra,
}: {
  brand: ReactNode
  nav: NavItem[]
  tabs: TabItem[]
  shortcuts: Shortcut[]
  email: string
  roleLabel: string
  onSignOut?: () => void
  kicker: string
  title: string
  chip?: ReactNode
  searchLabel: string
  onSearch: () => void
  onRefresh: () => void
  loading: boolean
  collapseKey: string
  ariaLabel: string
  children: ReactNode
  extra?: ReactNode
}) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => readCollapsed(collapseKey))
  const scrolled = useScrolled()
  const mainRef = useRef<HTMLElement>(null)
  useScrollReveal(mainRef)

  useEffect(() => { setOpen(false) }, [location.pathname])

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try { localStorage.setItem(collapseKey, v ? "0" : "1") } catch { /* sem armazenamento: só nesta visita */ }
      return !v
    })
  }

  return (
    <div className={`vx-shell ${collapsed ? "is-collapsed" : ""}`}>
      {open && <div className="vx-scrim" onClick={() => setOpen(false)} />}
      <Sidebar
        open={open} collapsed={collapsed} onToggle={toggleCollapsed} brand={brand} nav={nav} shortcuts={shortcuts}
        email={email} roleLabel={roleLabel} onSignOut={onSignOut} ariaLabel={ariaLabel}
      />

      <div className="vx-main">
        <header className={`vx-top ${scrolled ? "is-scrolled" : ""}`}>
          <button type="button" className="vx-icon-btn vx-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div key={title} className="vx-top-title">
            <span className="vx-top-kicker">{kicker}</span>
            <h1 className="vx-top-h1">{title}</h1>
          </div>
          {chip}
          <button type="button" className="vx-search" onClick={onSearch} aria-label="Buscar">
            <Search />
            <span>{searchLabel}</span>
            <span className="vx-kbd">Ctrl K</span>
          </button>
          <button
            type="button"
            className={`vx-icon-btn vx-refresh ${loading ? "vx-spin" : ""}`}
            onClick={onRefresh}
            aria-label="Atualizar dados"
            title="Atualizar dados"
          >
            <RefreshCw />
          </button>
          <RouteProgress busy={loading} routeKey={location.pathname} />
        </header>

        <main ref={mainRef} className="vx-page">
          <div key={location.pathname} className="vx-page-enter">{children}</div>
        </main>
      </div>

      <TabBar tabs={tabs} onMore={() => setOpen(true)} />
      {extra}
    </div>
  )
}

/**
 * Linha dourada sob a barra do topo: corre ao trocar de página e enquanto os
 * dados recarregam. Só um sinal visual; o conteúdo já tem esqueleto próprio.
 */
function RouteProgress({ busy, routeKey }: { busy: boolean; routeKey: string }) {
  const [phase, setPhase] = useState<"idle" | "run" | "done">(busy ? "run" : "idle")
  const busyRef = useRef(busy)
  const first = useRef(true)
  busyRef.current = busy

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setPhase("run")
    const t = window.setTimeout(() => { if (!busyRef.current) setPhase("done") }, 380)
    return () => window.clearTimeout(t)
  }, [routeKey])

  useEffect(() => {
    if (busy) setPhase("run")
    else setPhase((p) => (p === "run" ? "done" : p))
  }, [busy])

  useEffect(() => {
    if (phase !== "done") return
    const t = window.setTimeout(() => setPhase("idle"), 700)
    return () => window.clearTimeout(t)
  }, [phase])

  return <span className={`vx-progress is-${phase}`} aria-hidden="true" />
}

function Sidebar({
  open, collapsed, onToggle, brand, nav, shortcuts, email, roleLabel, onSignOut, ariaLabel,
}: {
  open: boolean
  collapsed: boolean
  onToggle: () => void
  brand: ReactNode
  nav: NavItem[]
  shortcuts: Shortcut[]
  email: string
  roleLabel: string
  onSignOut?: () => void
  ariaLabel: string
}) {
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ y: number; visible: boolean }>({ y: 0, visible: false })

  const activeIndex = nav.findIndex((item) => (item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)))

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const measure = () => {
      const item = el.querySelectorAll<HTMLElement>(".vx-nav-item")[activeIndex]
      if (!item) setPill((p) => ({ ...p, visible: false }))
      else setPill({ y: item.offsetTop, visible: true })
    }
    measure()
    // Recolher/expandir (ou cruzar a largura do celular) muda a altura dos rótulos: mede de novo.
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [activeIndex, collapsed])

  const sections = nav.reduce<{ name: string; items: NavItem[] }[]>((acc, item) => {
    const last = acc[acc.length - 1]
    if (last && last.name === item.section) last.items.push(item)
    else acc.push({ name: item.section, items: [item] })
    return acc
  }, [])

  return (
    <aside className={`vx-side ${open ? "is-open" : ""}`} aria-label={ariaLabel}>
      <div className="vx-brand">{brand}</div>
      <button
        type="button"
        className="vx-collapse-btn"
        onClick={onToggle}
        aria-label={collapsed ? "Expandir o menu" : "Recolher o menu"}
        title={collapsed ? "Expandir o menu" : "Recolher o menu"}
      >
        {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
      </button>

      <nav ref={navRef} className="vx-nav">
        <span className="vx-nav-pill" style={{ transform: `translateY(${pill.y}px)`, opacity: pill.visible ? 1 : 0 }} aria-hidden="true" />
        {sections.map((s) => (
          <Fragment key={s.name}>
            <p className="vx-nav-label">{s.name}</p>
            {s.items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} data-tip={label} className={({ isActive }) => `vx-nav-item ${isActive ? "is-active" : ""}`}>
                <Icon />
                <span className="vx-nav-text">{label}</span>
                {badge !== undefined && <span className="vx-nav-count tnum">{badge}</span>}
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>

      {shortcuts.length > 0 && (
        <>
          <p className="vx-nav-label">Atalhos</p>
          <nav className="vx-nav">
            {shortcuts.map((s) => s.to ? (
              <NavLink key={s.label} to={s.to} data-tip={s.label} className="vx-nav-item">
                <ArrowUpRight /> <span className="vx-nav-text">{s.label}</span>
              </NavLink>
            ) : (
              <a key={s.label} href={s.href} target={s.external === false ? undefined : "_blank"} rel="noopener noreferrer" className="vx-nav-item" data-tip={s.label}>
                <ArrowUpRight /> <span className="vx-nav-text">{s.label}</span>
              </a>
            ))}
          </nav>
        </>
      )}

      <div className="vx-side-foot">
        <div className="vx-user">
          <Avatar name={email || "Admin"} size={34} />
          <div className="vx-user-info min-w-0 flex-1">
            <div className="vx-user-email">{email}</div>
            <div className="vx-user-role">{roleLabel}</div>
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

/** Abas fixas no rodapé (só no celular). Some ao rolar para baixo e volta ao subir. */
function TabBar({ tabs, onMore }: { tabs: TabItem[]; onMore: () => void }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 6) return
      setHidden(y > lastY && y > 120)
      lastY = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className={`vx-tabbar ${hidden ? "is-hidden" : ""}`} aria-label="Navegação rápida">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `vx-tab-item ${isActive ? "is-active" : ""}`}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
      <button type="button" className="vx-tab-item" onClick={onMore} aria-label="Abrir o menu completo">
        <Menu />
        <span>Mais</span>
      </button>
    </nav>
  )
}
