import { useState, type ReactNode } from "react"
import AccessGate, { isJogadorAccessGranted } from "./AccessGate"

/** Porta de senha na frente de todo o clone /jogador — ver AccessGate. */
export default function RequireJogadorAccess({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(() => isJogadorAccessGranted())
  if (!granted) return <AccessGate onGranted={() => setGranted(true)} />
  return <>{children}</>
}
