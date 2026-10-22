import { useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { IMPORTED_EVENT, useImportedApi } from "./api"

/**
 * Quantos importados esperam conferência, para o número ao lado de "Importados" no menu. Lê de novo a cada
 * troca de página e quando a tela de Importados avisa que mudou algo. Se o banco ainda não tem a migração,
 * devolve undefined e o menu fica sem número.
 */
export function useImportedPending(demo: boolean): number | undefined {
  const api = useImportedApi(demo)
  const { pathname } = useLocation()
  const [pending, setPending] = useState<number | undefined>(undefined)

  const load = useCallback(() => {
    if (!api) return
    api.pending().then(setPending).catch(() => setPending(undefined))
  }, [api])

  useEffect(() => { load() }, [load, pathname])

  useEffect(() => {
    window.addEventListener(IMPORTED_EVENT, load)
    return () => window.removeEventListener(IMPORTED_EVENT, load)
  }, [load])

  return pending
}
