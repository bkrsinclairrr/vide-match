import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { passwordSchema } from "@/lib/security"
import { friendlyAuthError } from "@/lib/funnel"

/**
 * Destino do e-mail de recuperação de senha (Login e Dashboard mandam pra
 * cá). O link do Supabase chega com um token de recovery no hash da URL；
 * o client processa esse hash sozinho (detectSessionInUrl, ligado por
 * padrão) e dispara PASSWORD_RECOVERY — não há nada pra ler da URL aqui.
 *
 * Também é o caminho que dá senha a uma conta criada só com Google: o
 * updateUser abaixo funciona igual nos dois casos.
 */
export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Sinal de que a pessoa veio do link do e-mail. Sem isso, uma sessão
    // comum já ativa no navegador (ex: login normal numa aba) faria esta
    // página liberar o formulário mesmo sem vir de um link de recovery.
    const isRecoveryLink = window.location.hash.includes("type=recovery")
    if (!isRecoveryLink) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    // Se o hash já foi processado antes deste efeito rodar, o evento acima
    // não dispara mais; a sessão de recovery já existe.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validPassword = passwordSchema.safeParse(password)
    if (!validPassword.success) {
      toast({ title: "Senha muito curta", description: "A senha precisa ter pelo menos 6 caracteres.", variant: "destructive" })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", description: "Digite a mesma senha nos dois campos.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password: validPassword.data })
    setIsLoading(false)
    if (error) {
      toast({ title: "Erro ao salvar", description: friendlyAuthError(error.message), variant: "destructive" })
    } else {
      toast({ title: "Senha atualizada!", description: "Você já pode entrar com a nova senha." })
      navigate("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background font-sans p-6">
      <div className="w-full max-w-[400px] space-y-8 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
          {ready ? (
            <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta Zyron.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Abra esta página a partir do link que chegou no seu e-mail. Se o link expirou, peça um novo em "Esqueceu a senha?" na tela de login.
            </p>
          )}
        </div>

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">A senha deve ter pelo menos 6 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : "Salvar nova senha"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm">
          <a href="/login" className="text-primary font-medium hover:underline">Voltar para o login</a>
        </p>
      </div>
    </div>
  )
}
