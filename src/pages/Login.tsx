import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Mail, Lock, User, ArrowRight, Github, Chrome } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, allow any login to pass to demonstrate the premium flow
    localStorage.setItem("autenticado", "true")
    setIsLoading(false)
    toast({
      title: type === 'login' ? "Bem-vindo de volta!" : "Conta criada com sucesso!",
      description: "Redirecionando para o seu painel...",
    })
    navigate("/")
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans">
      {/* Esquerda - Conteúdo Visual (Apenas Desktop) */}
      <div className="hidden md:flex flex-col flex-1 bg-muted/40 relative overflow-hidden border-r border-border">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-40 blur-[100px]"></div>

        <div className="relative z-10 flex flex-col justify-between h-full p-12 lg:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Zyron</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              O futuro da sua <span className="text-primary block mt-2">carreira no futebol.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Junte-se a milhares de atletas e conecte-se com os maiores clubes do Brasil e do mundo em uma plataforma exclusiva.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p>Mais de 5.000+ atletas<br />já fazem parte</p>
          </div>
        </div>
      </div>

      {/* Direita - Formulário de Auth */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8 animate-fade-in">

          {/* Mobile Header (Apenas aparece no mobile) */}
          <div className="md:hidden flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Zyron</h1>
            <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
          </div>

          <div className="text-center md:text-left hidden md:block space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Bem-vindo(a)</h2>
            <p className="text-muted-foreground text-sm">Insira seus dados para acessar sua conta</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Criar conta</TabsTrigger>
            </TabsList>

            {/* TAB: LOGIN */}
            <TabsContent value="login" className="space-y-6 mt-0">
              <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="nome@exemplo.com" className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <a href="#" className="text-xs text-primary font-medium hover:underline">Esqueceu a senha?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all" required />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98] mt-2">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Acessar plataforma
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* TAB: REGISTER */}
            <TabsContent value="register" className="space-y-6 mt-0">
              <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="João Silva" className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="reg-email" type="email" placeholder="nome@exemplo.com" className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Criar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="reg-password" type="password" placeholder="••••••••" className="pl-10 bg-background/50 focus:bg-background h-12 rounded-xl transition-all" required minLength={8} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">A senha deve ter pelo menos 8 caracteres.</p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98] mt-2">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Criando conta...
                    </div>
                  ) : (
                    "Criar minha conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground uppercase font-medium">Ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 rounded-xl bg-background/50 hover:bg-muted border-border font-medium flex items-center gap-2 transition-all">
              <Chrome className="w-4 h-4" /> Google
            </Button>
            <Button variant="outline" className="h-12 rounded-xl bg-background/50 hover:bg-muted border-border font-medium flex items-center gap-2 transition-all">
              <Github className="w-4 h-4" /> GitHub
            </Button>
          </div>

        </div>

        {/* Footer Link */}
        <p className="absolute bottom-8 text-sm text-muted-foreground text-center">
          Ao continuar, você concorda com nossos <br className="sm:hidden" />
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Termos de Serviço</a> e{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Política de Privacidade</a>.
        </p>

      </div>
    </div>
  )
}
