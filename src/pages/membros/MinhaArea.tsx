import "@fontsource-variable/inter"

import { useEffect, useMemo } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useAccessLevel } from "@/hooks/useAccessLevel"
import { useDevPreview } from "@/lib/devPreview"
import { ZyronMark } from "@/pages/site/ZyronMark"
import { AccessCheckError } from "@/pages/voxen/StaffGate"
import ClientArea from "./ClientArea"
import { readAsMember } from "./paths"

function Splash() {
  return (
    <div className="vx-splash relative z-[1]">
      <div className="vx-splash-mark"><ZyronMark size={56} /></div>
    </div>
  )
}

/**
 * /minha-area: a casa de quem entra com a conta do Zyron (login em /login).
 * Cada atleta vê só o que é dele. A equipe também abre esta área, mas só com
 * `?como=` ("ver como", em leitura); sem isso, vai para a VOXEN (/voxen).
 */
export default function MinhaArea() {
  const { pathname, search } = useLocation()
  const { session, loading } = useAuth()
  const { level, loading: levelLoading, failed, retry } = useAccessLevel()
  const dev = useDevPreview()
  const stored = useMemo(() => readAsMember(search), [search])

  useEffect(() => { document.documentElement.classList.add("dark") }, [])

  let body
  if (dev.demo) {
    // ?como=conta e ?como=novo são o próprio atleta (sem análise / recém-chegado); um id de membro é a equipe vendo como ele.
    body = <ClientArea preview asMember={stored} isAdmin={stored !== "conta" && stored !== "novo"} />
  } else if (loading) {
    body = <Splash />
  } else if (!session) {
    body = <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  } else if (failed) {
    body = <AccessCheckError onRetry={retry} />
  } else if (levelLoading || !level) {
    body = <Splash />
  } else if (level === "user") {
    body = <ClientArea preview={false} asMember={null} isAdmin={false} />
  } else {
    body = stored ? <ClientArea preview={false} asMember={stored} isAdmin /> : <Navigate to="/voxen" replace />
  }

  return (
    <div className="vx">
      <div className="vx-backdrop" aria-hidden="true">
        <span className="vx-aurora vx-aurora--a" />
        <span className="vx-aurora vx-aurora--b" />
        <span className="vx-aurora vx-aurora--c" />
      </div>
      {body}
    </div>
  )
}
