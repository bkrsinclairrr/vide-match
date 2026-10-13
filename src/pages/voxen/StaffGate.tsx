import "./staff.css"

import { AlertCircle, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

/** A consulta do nível de acesso falhou (rede, por exemplo): pede para tentar de novo em vez de adivinhar. */
export function AccessCheckError({ onRetry }: { onRetry: () => void }) {
  const { signOut } = useAuth()
  return (
    <div className="vx-splash relative z-[1] px-6">
      <div className="vx-card sl-only">
        <span className="sl-only-icon is-warn"><AlertCircle /></span>
        <h1>Não foi possível verificar o seu acesso</h1>
        <p>Confira a sua conexão e tente de novo. Se continuar assim, saia e entre outra vez.</p>
        <div className="sl-only-actions">
          <button type="button" className="vx-btn vx-btn--gold" onClick={onRetry}>Tentar de novo</button>
          <button type="button" className="vx-btn" onClick={() => void signOut()}><LogOut /> Sair</button>
        </div>
      </div>
    </div>
  )
}
