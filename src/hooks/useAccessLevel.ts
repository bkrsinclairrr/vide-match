import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { levelFromRoles, type AccessLevel } from "@/pages/voxen/access"

type State = { userId: string | null; level: AccessLevel | null; failed: boolean }

/**
 * Nível de acesso de quem está logado: admin, executivo ou atleta. Lê os papéis
 * da própria conta (a RLS libera) e fica com o maior. `level` é null enquanto
 * carrega, sem sessão ou se a consulta falhar (`failed`): nunca se assume
 * "atleta" por erro de rede, para não mostrar à equipe a tela errada.
 */
export function useAccessLevel(): { level: AccessLevel | null; loading: boolean; failed: boolean; retry: () => void } {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<State>({ userId: null, level: null, failed: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        setState(error
          ? { userId: user.id, level: null, failed: true }
          : { userId: user.id, level: levelFromRoles((data ?? []).map((r) => String(r.role))), failed: false })
      })
    return () => { cancelled = true }
  }, [user, attempt])

  const retry = useCallback(() => {
    setState({ userId: null, level: null, failed: false })
    setAttempt((n) => n + 1)
  }, [])

  const ready = Boolean(user) && state.userId === user?.id
  return {
    level: ready ? state.level : null,
    loading: authLoading || (Boolean(user) && !ready),
    failed: ready && state.failed,
    retry,
  }
}
