import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, Lock } from "lucide-react"

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (senha === import.meta.env.VITE_SITE_PASSWORD) {
      localStorage.setItem("autenticado", "true")
      onLogin()
    } else {
      alert("Senha incorreta")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-elite">
      <div className="bg-card border border-border p-8 rounded-2xl shadow-strong w-80 text-center">
        <div className="w-14 h-14 bg-gradient-golden rounded-xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-background" />
        </div>
        <h1 className="text-xl font-bold mb-1 text-foreground">Zyron</h1>
        <p className="text-xs text-muted-foreground mb-6">Área restrita</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className="pl-10 bg-muted border-border"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-golden text-background font-semibold">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
