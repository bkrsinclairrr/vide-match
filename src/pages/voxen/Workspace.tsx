import { lazy, Suspense, useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  BadgeCheck, ClipboardList, Compass, GitCompareArrows, Inbox, LayoutDashboard, LogOut, Medal, RefreshCw, ShieldAlert, ShieldCheck, Shirt, Users, X,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { clearAsMember } from "@/pages/membros/paths"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VoxenProvider, useVoxen } from "./store"
import { LEVEL_LABEL, canAdminAs, canSeeAccountsAs, type StaffRole } from "./access"
import { positionCode } from "./data"
import { AppShell, useCommandShortcut, type NavItem, type Shortcut, type TabItem } from "./shell"
import { Avatar, PageSkeleton, ScoreChip, VoxenWordmark, playerPath } from "./ui"

/*
 * Área de trabalho da VOXEN (equipe). Fica num arquivo à parte da entrada
 * (VoxenApp.tsx) para o login não baixar o painel inteiro: gráficos, busca
 * rápida, tabelas e páginas só chegam depois que a equipe entra.
 */

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
const AthletesPage = lazy(() => import("./pages/athletes/AthletesPage"))
const OpportunitiesPage = lazy(() => import("./pages/opportunities/OpportunitiesPage"))
const ScoutDesk = lazy(() => import("./pages/scout/ScoutDesk"))
const SubmissionsPage = lazy(() => import("./pages/scout/SubmissionsPage"))

const NAV: NavItem[] = [
  { to: "/voxen", label: "Visão geral", icon: LayoutDashboard, end: true, section: "Plataforma" },
  { to: "/voxen/mesa", label: "Mesa do Scout", icon: ClipboardList, section: "Plataforma" },
  { to: "/voxen/jogadores", label: "Jogadores", icon: Users, section: "Plataforma" },
  { to: "/voxen/oportunidades", label: "Oportunidades", icon: Compass, section: "Plataforma" },
  { to: "/voxen/envios", label: "Envios de vídeo", icon: Inbox, section: "Plataforma" },
  { to: "/voxen/membros", label: "Membros", icon: BadgeCheck, section: "Plataforma" },
  { to: "/voxen/atletas", label: "Atletas", icon: Medal, section: "Plataforma" },
  { to: "/voxen/elenco", label: "Elenco", icon: Shirt, section: "Plataforma" },
  { to: "/voxen/comparativo", label: "Comparativo", icon: GitCompareArrows, section: "Plataforma" },
  { to: "/voxen/contas", label: "Contas e acessos", icon: ShieldCheck, section: "Administração" },
]

/** O menu de cada cargo: o Scout não vê "Contas e acessos". */
const navFor = (role: StaffRole) => NAV.filter((item) => item.to !== "/voxen/contas" || canSeeAccountsAs(role))

const DEMO_EMAIL: Record<StaffRole, string> = {
  admin: "equipe@aizyron.com",
  executive: "executivo@aizyron.com",
  scout: "scout@aizyron.com",
}

/** Barra de abas do celular: as quatro telas mais usadas e o menu completo. */
const TABS: TabItem[] = [
  { to: "/voxen", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/voxen/jogadores", label: "Jogadores", icon: Users },
  { to: "/voxen/membros", label: "Membros", icon: BadgeCheck },
  { to: "/voxen/atletas", label: "Atletas", icon: Medal },
]

export default function Workspace({ demo, role }: { demo: boolean; role: StaffRole }) {
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
  if (pathname.startsWith("/voxen/mesa")) return { kicker: "Fila de trabalho", title: "Mesa do Scout" }
  if (pathname.startsWith("/voxen/oportunidades")) return { kicker: "Jogadores escolhidos", title: "Oportunidades" }
  if (pathname.startsWith("/voxen/envios")) return { kicker: "Enviados pelos atletas", title: "Envios de vídeo" }
  if (pathname.startsWith("/voxen/atletas")) return { kicker: "Plataforma", title: "Atletas" }
  if (pathname.startsWith("/voxen/membros/comparar")) return { kicker: "Área de membros", title: "Comparar perfis" }
  if (pathname.endsWith("/partidas/nova")) return { kicker: "Área de membros", title: "Nova partida" }
  if (pathname.includes("/partidas/")) return { kicker: "Área de membros", title: "Partida e lances" }
  if (pathname.startsWith("/voxen/membros/")) return { kicker: "Área de membros", title: "Perfil" }
  if (pathname.startsWith("/voxen/membros")) return { kicker: "Área de membros", title: "Membros" }
  return { kicker: "Painel", title: "Visão geral" }
}

function Shell() {
  const { players, loading, reload, demo, error, role } = useVoxen()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [palette, setPalette] = useState(false)
  const { kicker, title } = useTitle()
  useCommandShortcut(() => setPalette((v) => !v))

  const refresh = async () => {
    if (await reload()) toast({ title: "Dados atualizados", description: "A base de atletas foi recarregada agora." })
  }

  const email = demo ? DEMO_EMAIL[role] : user?.email ?? ""
  const onSignOut = demo ? undefined : () => void signOut()

  const nav = navFor(role).map((item) => (item.to === "/voxen/jogadores" ? { ...item, badge: players.length } : item))
  const shortcuts: Shortcut[] = [
    ...(canAdminAs(role) ? [{ label: "Painel de administração", to: "/admin" }] : []),
    { label: "Abrir o funil", href: "/avaliacao" },
    { label: "Site da Zyron", href: "/" },
  ]

  return (
    <AppShell
      brand={<VoxenWordmark />}
      nav={nav}
      tabs={TABS}
      shortcuts={shortcuts}
      email={email}
      roleLabel={LEVEL_LABEL[role]}
      onSignOut={onSignOut}
      kicker={kicker}
      title={title}
      searchLabel="Buscar atleta, e-mail ou telefone"
      onSearch={() => setPalette(true)}
      onRefresh={() => void refresh()}
      loading={loading}
      collapseKey="voxen:menu-recolhido"
      ariaLabel="Navegação da VOXEN"
      extra={<Palette open={palette} onOpenChange={setPalette} onRefresh={() => void refresh()} onSignOut={onSignOut} />}
    >
      {error ? (
        <div className="vx-card">
          <div className="vx-empty">
            <span className="vx-empty-icon"><ShieldAlert className="h-6 w-6" /></span>
            <strong className="text-white">Não foi possível carregar os atletas</strong>
            <span>{error}</span>
            <button type="button" className="vx-btn vx-btn--gold mt-2" onClick={() => void refresh()}>Tentar de novo</button>
          </div>
        </div>
      ) : loading && !players.length ? (
        <PageSkeleton />
      ) : (
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="jogadores" element={<PlayersPage />} />
            <Route path="jogadores/:key" element={<PlayerProfile />} />
            <Route path="elenco" element={<Squad />} />
            <Route path="comparativo" element={<Compare />} />
            <Route path="contas" element={canSeeAccountsAs(role) ? <AccountsPage /> : <Navigate to="/voxen" replace />} />
            <Route path="atletas" element={<AthletesPage />} />
            <Route path="mesa" element={<ScoutDesk />} />
            <Route path="oportunidades" element={<OpportunitiesPage />} />
            <Route path="envios" element={<SubmissionsPage />} />
            <Route path="membros" element={<AdminMembers />} />
            <Route path="membros/comparar" element={<AdminCompare />} />
            <Route path="membros/:id" element={<AdminMember />} />
            <Route path="membros/:id/partidas/:matchId" element={<AdminMatch />} />
            <Route path="*" element={<Navigate to="/voxen" replace />} />
          </Routes>
        </Suspense>
      )}
    </AppShell>
  )
}

function Palette({
  open, onOpenChange, onRefresh, onSignOut,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onRefresh: () => void
  onSignOut?: () => void
}) {
  const { players, role } = useVoxen()
  const navigate = useNavigate()
  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }
  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vx-palette max-w-xl overflow-hidden p-0 shadow-2xl" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Buscar atleta</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
          <CommandInput placeholder="Buscar atleta por nome, e-mail, telefone ou cidade..." />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>Nenhum atleta encontrado.</CommandEmpty>
            <CommandGroup heading="Páginas">
              {navFor(role).map(({ to, label, icon: Icon }) => (
                <CommandItem key={to} value={`pagina ${label}`} onSelect={() => go(to)}>
                  <Icon className="mr-2 h-4 w-4" /> {label}
                </CommandItem>
              ))}
              {canAdminAs(role) && (
                <CommandItem value="pagina painel de administracao admin" onSelect={() => go("/admin")}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Painel de administração
                </CommandItem>
              )}
            </CommandGroup>
            <CommandGroup heading="Ações">
              <CommandItem value="acao atualizar dados recarregar" onSelect={() => run(onRefresh)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar dados
              </CommandItem>
              {onSignOut && (
                <CommandItem value="acao sair da conta" onSelect={() => run(onSignOut)}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair da conta
                </CommandItem>
              )}
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
