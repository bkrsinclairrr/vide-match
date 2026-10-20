import "@fontsource-variable/inter"
import "@/pages/voxen/voxen.css"
import "@/pages/voxen/pages/accounts/accounts.css"
import "./console.css"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  BadgeCheck, LayoutDashboard, LogOut, Medal, MonitorCog, Plus, RefreshCw, ShieldAlert, ShieldCheck, UserPlus, Users, X,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VoxenProvider, useVoxen } from "@/pages/voxen/store"
import { positionCode } from "@/pages/voxen/data"
import { usePointerGlow } from "@/pages/voxen/motion"
import { AppShell, useCommandShortcut, type NavItem, type Shortcut, type TabItem } from "@/pages/voxen/shell"
import { Avatar, PageSkeleton, ScoreChip, VoxenMark } from "@/pages/voxen/ui"

const Dashboard = lazy(() => import("./Dashboard"))
const Records = lazy(() => import("./Records"))
const Members = lazy(() => import("./Members"))
const System = lazy(() => import("./System"))
const AccountsPage = lazy(() => import("@/pages/voxen/pages/accounts/AccountsPage"))
const AthletesPage = lazy(() => import("@/pages/voxen/pages/athletes/AthletesPage"))

const NAV: NavItem[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, end: true, section: "Gestão" },
  { to: "/admin/cadastros", label: "Cadastros", icon: Users, section: "Gestão" },
  { to: "/admin/membros", label: "Membros", icon: BadgeCheck, section: "Gestão" },
  { to: "/admin/atletas", label: "Atletas", icon: Medal, section: "Gestão" },
  { to: "/admin/contas", label: "Contas e acessos", icon: ShieldCheck, section: "Acessos" },
  { to: "/admin/sistema", label: "Sistema", icon: MonitorCog, section: "Manutenção" },
]

/** Abas do celular: as telas do dia a dia (Contas e Sistema ficam no menu completo). */
const TABS: TabItem[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/admin/cadastros", label: "Cadastros", icon: Users },
  { to: "/admin/membros", label: "Membros", icon: BadgeCheck },
  { to: "/admin/atletas", label: "Atletas", icon: Medal },
]

const SHORTCUTS: Shortcut[] = [
  { label: "Abrir a VOXEN", to: "/voxen" },
  { label: "Abrir o funil", href: "/avaliacao" },
  { label: "Site da Zyron", href: "/" },
]

const TITLES: [string, string, string][] = [
  ["/admin/cadastros", "Gestão", "Cadastros"],
  ["/admin/membros", "Gestão", "Membros e referências"],
  ["/admin/atletas", "Gestão", "Atletas"],
  ["/admin/contas", "Acessos", "Contas e acessos"],
  ["/admin/sistema", "Manutenção", "Sistema"],
]

/** Marca do painel: a mesma placa da VOXEN com o nome da central. */
function AdminWordmark() {
  return (
    <span className="flex items-center gap-3">
      <VoxenMark size={36} />
      <span>
        <span className="vx-brand-word block">ADMIN</span>
        <span className="vx-brand-sub block">Zyron · Central</span>
      </span>
    </span>
  )
}

/**
 * Central de administração (/admin): tudo que o administrador gerencia, com
 * edição, exclusão e ações em massa. Só administrador chega aqui (a entrada
 * confere o nível; o banco confere de novo em cada gravação, por RLS).
 */
export default function AdminApp({ demo = false }: { demo?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  usePointerGlow(rootRef)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "Administração · Zyron"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="vx cn-root" ref={rootRef}>
      <div className="vx-backdrop" aria-hidden="true">
        <span className="vx-aurora vx-aurora--a" />
        <span className="vx-aurora vx-aurora--b" />
        <span className="vx-aurora vx-aurora--c" />
      </div>
      <VoxenProvider demo={demo} role="admin">
        <Shell />
      </VoxenProvider>
    </div>
  )
}

function Shell() {
  const { players, loading, reload, demo, error } = useVoxen()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const { pathname } = useLocation()
  const [palette, setPalette] = useState(false)
  useCommandShortcut(() => setPalette((v) => !v))

  const [, kicker, title] = TITLES.find(([prefix]) => pathname.startsWith(prefix)) ?? ["", "Central", "Painel"]
  const standalone = pathname.startsWith("/admin/sistema") || pathname.startsWith("/admin/contas")

  const refresh = async () => {
    if (await reload()) toast({ title: "Dados atualizados", description: "Os cadastros foram recarregados agora." })
  }

  const nav = NAV.map((item) => (item.to === "/admin/cadastros" ? { ...item, badge: players.length } : item))
  const onSignOut = demo ? undefined : () => void signOut()

  return (
    <AppShell
      brand={<AdminWordmark />}
      nav={nav}
      tabs={TABS}
      shortcuts={SHORTCUTS}
      email={demo ? "equipe@aizyron.com" : user?.email ?? ""}
      roleLabel="Administrador"
      onSignOut={onSignOut}
      kicker={kicker}
      title={title}
      searchLabel="Buscar cadastro, e-mail ou telefone"
      onSearch={() => setPalette(true)}
      onRefresh={() => void refresh()}
      loading={loading}
      collapseKey="admin:menu-recolhido"
      ariaLabel="Navegação da central de administração"
      extra={<Palette open={palette} onOpenChange={setPalette} onRefresh={() => void refresh()} onSignOut={onSignOut} />}
    >
      {error && !standalone ? (
        <div className="vx-card">
          <div className="vx-empty">
            <span className="vx-empty-icon"><ShieldAlert className="h-6 w-6" /></span>
            <strong className="text-white">Não foi possível carregar os cadastros</strong>
            <span>{error}</span>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button type="button" className="vx-btn vx-btn--gold" onClick={() => void refresh()}>Tentar de novo</button>
              <Link to="/admin/sistema" className="vx-btn">Ver o estado do sistema</Link>
            </div>
          </div>
        </div>
      ) : loading && !players.length && !standalone ? (
        <PageSkeleton />
      ) : (
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="cadastros" element={<Records />} />
            <Route path="membros" element={<Members />} />
            <Route path="atletas" element={<AthletesPage />} />
            <Route path="contas" element={<AccountsPage />} />
            <Route path="sistema" element={<System />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      )}
    </AppShell>
  )
}

function Palette({
  open, onOpenChange, onRefresh, onSignOut,
}: { open: boolean; onOpenChange: (v: boolean) => void; onRefresh: () => void; onSignOut?: () => void }) {
  const { players } = useVoxen()
  const navigate = useNavigate()
  const go = (to: string) => { onOpenChange(false); navigate(to) }
  const run = (fn: () => void) => { onOpenChange(false); fn() }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vx-palette max-w-xl overflow-hidden p-0 shadow-2xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Buscar na central de administração</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
          <CommandInput placeholder="Buscar cadastro por nome, e-mail, telefone ou cidade..." />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Páginas">
              {NAV.map(({ to, label, icon: Icon }) => (
                <CommandItem key={to} value={`pagina ${label}`} onSelect={() => go(to)}>
                  <Icon className="mr-2 h-4 w-4" /> {label}
                </CommandItem>
              ))}
              <CommandItem value="pagina voxen plataforma" onSelect={() => go("/voxen")}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Abrir a VOXEN
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Ações">
              <CommandItem value="acao criar conta de equipe scout executivo administrador" onSelect={() => go("/admin/contas")}>
                <UserPlus className="mr-2 h-4 w-4" /> Criar conta de equipe
              </CommandItem>
              <CommandItem value="acao novo membro" onSelect={() => go("/admin/membros?novo=1")}>
                <Plus className="mr-2 h-4 w-4" /> Novo membro
              </CommandItem>
              <CommandItem value="acao adicionar atleta setor atletas" onSelect={() => go("/admin/atletas?novo=1")}>
                <Medal className="mr-2 h-4 w-4" /> Adicionar ao setor Atletas
              </CommandItem>
              <CommandItem value="acao atualizar dados recarregar" onSelect={() => run(onRefresh)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar dados
              </CommandItem>
              {onSignOut && (
                <CommandItem value="acao sair da conta" onSelect={() => run(onSignOut)}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair da conta
                </CommandItem>
              )}
            </CommandGroup>
            <CommandGroup heading="Cadastros (abre para editar)">
              {players.map((p) => (
                <CommandItem
                  key={p.key}
                  value={`${p.name} ${p.email ?? ""} ${p.phone ?? ""} ${p.profile.city ?? ""} ${p.profile.position ?? ""} ${p.key}`}
                  onSelect={() => go(`/admin/cadastros?editar=${encodeURIComponent(p.key)}`)}
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
