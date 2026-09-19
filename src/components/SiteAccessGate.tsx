import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, User, ShieldCheck } from "lucide-react"

const ACCESS_SESSION_KEY = "site_access_granted"
const JOGADOR_SESSION_KEY = "jogador_access_granted"

/**
 * SHA-256 de "usuario:senha" (admin:Alexgato10#). Trava contra quem só
 * tropeça no link — não segurança de verdade: um SPA não tem como esconder
 * conteúdo de verdade do cliente antes de autenticar (tudo já está no
 * bundle JS que o navegador baixou). Quem abrir o DevTools e gravar a flag
 * de sessionStorage manualmente, ou aguardar o prazo, contorna isto.
 */
const ACCESS_HASH = "8a58b7c848c7e1d8113df9be8dee70939a3f2f5c6f444a59794ee9cfbf672459"

/**
 * 20/09/2026 23:59 (horário de Brasília). Depois disso o site libera
 * sozinho — não precisa de nova ação para tirar o bloqueio.
 */
const ACCESS_DEADLINE = new Date("2026-09-20T23:59:59-03:00")

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function isPastDeadline(): boolean {
  return Date.now() >= ACCESS_DEADLINE.getTime()
}

function isGranted(): boolean {
  return sessionStorage.getItem(ACCESS_SESSION_KEY) === "true"
}

/**
 * Bloqueia TODO o site (raiz e todas as rotas) atrás de usuário e senha até
 * o prazo acima. Fica na raiz da árvore de rotas em Home.tsx, então nenhuma
 * página — incluindo /avaliacao, que recebe tráfego pago — renderiza antes
 * de autenticar.
 */
export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => isPastDeadline() || isGranted())
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Se a aba ficar aberta atravessando o prazo, libera sozinha sem precisar
  // recarregar. setTimeout tem teto de ~24.8 dias (int32 em ms); o prazo
  // real é de poucos dias, então não precisa de reagendamento em cadeia.
  useEffect(() => {
    if (unlocked) return
    const msLeft = ACCESS_DEADLINE.getTime() - Date.now()
    if (msLeft <= 0) { setUnlocked(true); return }
    const t = setTimeout(() => setUnlocked(true), msLeft)
    return () => clearTimeout(t)
  }, [unlocked])

  if (unlocked) return <>{children}</>

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const attempt = await sha256(`${username.trim()}:${password}`)
    setLoading(false)
    if (attempt === ACCESS_HASH) {
      sessionStorage.setItem(ACCESS_SESSION_KEY, "true")
      // Mesma credencial do clone /jogador — evita pedir a senha de novo
      // pra quem já autenticou aqui e depois entra em /jogador.
      sessionStorage.setItem(JOGADOR_SESSION_KEY, "true")
      setUnlocked(true)
    } else {
      setError(true)
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
            <p className="mt-1 text-sm text-foreground/60">Este site exige usuário e senha.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-foreground/10 bg-foreground/[0.04] p-6">
          <div className="space-y-2">
            <Label htmlFor="site-access-user">Usuário</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="site-access-user"
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
            <Label htmlFor="site-access-pass">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="site-access-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-background/50 pl-10 focus:bg-background"
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              Usuário ou senha incorretos.
            </p>
          )}
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
