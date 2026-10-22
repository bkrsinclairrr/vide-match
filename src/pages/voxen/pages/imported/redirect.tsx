import { Navigate, useSearchParams } from "react-router-dom"

/**
 * O endereço antigo dos pré-cadastros (/voxen/pre-cadastros e /admin/pre-cadastros) leva para a lista de
 * Importados, já filtrada nos pré-cadastros (e no mesmo pré-cadastro, se o endereço trazia um).
 */
export function PreCadastrosRedirect({ to }: { to: string }) {
  const [params] = useSearchParams()
  const next = new URLSearchParams({ tipo: "pre" })
  const pre = params.get("pre")
  if (pre) next.set("item", `pre:${pre}`)
  return <Navigate to={`${to}?${next.toString()}`} replace />
}
