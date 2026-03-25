import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useIsAdmin } from "@/hooks/useAdmin"
import { useToast } from "@/hooks/use-toast"
import { Shield, Trash2, Ban, CheckCircle, ArrowLeft, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserInfo {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  full_name: string
  roles: string[]
}

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard")
    }
  }, [adminLoading, isAdmin, navigate])

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  const callAdmin = async (action: string, targetUserId?: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Not authenticated")

    const res = await supabase.functions.invoke("admin-users", {
      body: { action, targetUserId },
    })

    if (res.error) throw new Error(res.error.message)
    if (res.data?.error) throw new Error(res.data.error)
    return res.data
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await callAdmin("list_users")
      setUsers(data.users || [])
    } catch (err: any) {
      toast({ title: "Erro ao carregar usuários", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, targetId: string, label: string) => {
    if (!confirm(`Tem certeza que deseja ${label}?`)) return
    try {
      setActionLoading(targetId)
      await callAdmin(action, targetId)
      toast({ title: "Sucesso", description: `Ação "${label}" executada.` })
      await fetchUsers()
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg">Painel de Administração</h1>
          <span className="ml-auto text-sm text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" /> {users.length} usuários
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">Usuário</th>
                  <th className="text-left px-4 py-3 font-semibold">Roles</th>
                  <th className="text-left px-4 py-3 font-semibold">Criado em</th>
                  <th className="text-left px-4 py-3 font-semibold">Último login</th>
                  <th className="text-right px-4 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === user?.id
                  const isLoadingThis = actionLoading === u.id
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{u.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoadingThis}
                              onClick={() => handleAction("disable_user", u.id, "desabilitar usuário")}
                              className="text-yellow-600 border-yellow-600/30 hover:bg-yellow-600/10"
                            >
                              {isLoadingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoadingThis}
                              onClick={() => handleAction("enable_user", u.id, "reabilitar usuário")}
                              className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isLoadingThis}
                              onClick={() => handleAction("delete_user", u.id, "excluir usuário permanentemente")}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
