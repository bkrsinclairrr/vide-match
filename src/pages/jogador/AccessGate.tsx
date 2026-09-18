import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, User, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ACCESS_SESSION_KEY = "jogador_access_granted"

/**
 * SHA-256 de "usuario:senha". Isto é uma trava contra quem só tropeça no
 * link, não segurança de verdade: qualquer pessoa que abra o bundle JS e
 * force a senha localmente (ou simplesmente grave a flag de sessionStorage
 * no console) contorna isto. Não há nada mais sensível atrás dela do que o
 * próprio funil público de /avaliacao.
 */
const ACCESS_HASH = "8a58b7c848c7e1d8113df9be8dee70939a3f2f5c6f444a59794ee9cfbf672459"

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function isJogadorAccessGranted(): boolean {
  return sessionStorage.getItem(ACCESS_SESSION_KEY) === "true"
}

interface AccessGateProps {
  onGranted: () => void
}

export default function AccessGate({ onGranted }: AccessGateProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const attempt = await sha256(`${username.trim()}:${password}`)
    setLoading(false)
    if (attempt === ACCESS_HASH) {
      sessionStorage.setItem(ACCESS_SESSION_KEY, "true")
      onGranted()
    } else {
      toast({ title: "Acesso negado", description: "Usuário ou senha incorretos.", variant: "destructive" })
    }
  }

  return (
    <div className="dark min-h-screen relative flex items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.06) 38%, transparent 68%)" }}
        />
        <div
          className="absolute bottom-0 -right-32 h-[420px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(129,140,248,0.09) 0%, rgba(129,140,248,0.04) 40%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_40px_-8px_rgba(251,191,36,0.75)]">
            <Lock className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Acesso Restrito</h1>
            <p className="mt-1 text-sm text-foreground/60">Esta área exige usuário e senha.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-foreground/10 bg-foreground/[0.04] p-6">
          <div className="space-y-2">
            <Label htmlFor="access-user">Usuário</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="access-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl bg-background/50 pl-10 focus:bg-background"
                required
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-pass">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="access-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-background/50 pl-10 focus:bg-background"
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-black transition-all hover:from-amber-300 hover:to-amber-400 active:scale-[0.98]"
          >
            {loading ? "Verificando..." : "Entrar"}
          </Button>
        </form>

        <p className="flex items-center justify-center gap-1.5 text-xs text-foreground/40">
          <ShieldCheck className="h-3.5 w-3.5" />
          Área privada — não é a área de login de contas Zyron.
        </p>
      </div>
    </div>
  )
}
