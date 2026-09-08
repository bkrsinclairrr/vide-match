import { ReactNode } from "react"

interface GateKeeperProps {
  children: ReactNode
}

// Authorization belongs to Supabase Auth and ProtectedRoute, never to a browser-shipped password.
export default function GateKeeper({ children }: GateKeeperProps) {
  return <>{children}</>
}
