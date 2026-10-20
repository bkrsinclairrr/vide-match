import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import type { StaffRole } from "@/pages/voxen/access"

const DEMO_KEY = "voxen:demo"
const ROLE_KEY = "voxen:demo-role"

/** ?papel= em português para o cargo. */
const PAPEL: Record<string, StaffRole> = { admin: "admin", executivo: "executive", scout: "scout" }

/**
 * Dados locais, sem login, só no `npm run dev` (liga com ?demo; ?papel=executivo
 * ou ?papel=scout testa a visão de cada cargo, ?papel=admin volta ao padrão).
 * Serve a VOXEN (/voxen) e a área do atleta (/minha-area). No build de produção
 * a condição vira `false` e o bloco some.
 */
export function useDevPreview(): { demo: boolean; role: StaffRole } {
  const { search } = useLocation()
  return useMemo(() => {
    if (!import.meta.env.DEV) return { demo: false, role: "admin" as StaffRole }
    try {
      const params = new URLSearchParams(search)
      if (params.has("demo")) sessionStorage.setItem(DEMO_KEY, "1")
      const papel = params.get("papel")
      if (papel) sessionStorage.setItem(ROLE_KEY, papel)
      return {
        demo: sessionStorage.getItem(DEMO_KEY) === "1",
        role: PAPEL[sessionStorage.getItem(ROLE_KEY) ?? ""] ?? "admin",
      }
    } catch {
      return { demo: false, role: "admin" as StaffRole }
    }
  }, [search])
}
