import "@fontsource-variable/inter"
import "./voxen.css"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useAccessLevel } from "@/hooks/useAccessLevel"
import { useDevPreview } from "@/lib/devPreview"
import { hasStoredSession } from "@/lib/authHint"
import { type StaffRole } from "./access"
import { usePointerGlow } from "./motion"
import { Splash } from "./shell"
import { AccessCheckError } from "./StaffGate"
import Entry from "./Entry"

/*
 * Porta da VOXEN (/voxen). Fica leve de propósito: só o necessário para mostrar a
 * entrada e conferir quem é a pessoa. O painel (gráficos, busca rápida, tabelas,
 * páginas) é outro arquivo, baixado só depois que a equipe entra.
 */
const Workspace = lazy(() => import("./Workspace"))
const warmWorkspace = () => { void import("./Workspace") }

export default function VoxenApp() {
  const dev = useDevPreview()
  const rootRef = useRef<HTMLDivElement>(null)
  usePointerGlow(rootRef)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const prev = document.title
    document.title = "VOXEN · Equipe Zyron"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="vx" ref={rootRef}>
      <div className="vx-backdrop" aria-hidden="true">
        <span className="vx-aurora vx-aurora--a" />
        <span className="vx-aurora vx-aurora--b" />
        <span className="vx-aurora vx-aurora--c" />
      </div>
      {dev.demo ? <Staff demo role={dev.role} /> : <AccessGate />}
    </div>
  )
}

function Staff({ demo, role }: { demo: boolean; role: StaffRole }) {
  return (
    <Suspense fallback={<Splash label="Carregando a VOXEN" />}>
      <Workspace demo={demo} role={role} />
    </Suspense>
  )
}

/**
 * A VOXEN é da equipe, mas a entrada serve às duas pontas: o atleta aparece
 * primeiro e a equipe logo abaixo. Atleta já logado vai direto para a área dele
 * (/minha-area). A RLS do banco é quem garante os dados; esta tela só evita telas
 * sem sentido.
 */
function AccessGate() {
  const { session, user, loading } = useAuth()
  const { level, loading: levelLoading, failed, retry } = useAccessLevel()
  // Sem login guardado neste navegador, o visitante vê a entrada na hora, sem esperar o provedor de login.
  const [stored] = useState(hasStoredSession)

  if (loading) return stored ? <Splash label="Carregando a VOXEN" /> : <Entry onTeamIntent={warmWorkspace} />
  if (!session || !user) return <Entry onTeamIntent={warmWorkspace} />
  if (failed) return <AccessCheckError onRetry={retry} />
  if (levelLoading || !level) return <Splash label="Carregando a VOXEN" />
  if (level === "user") return <Navigate to="/minha-area" replace />
  return <Staff demo={false} role={level} />
}
