import type { ReactNode } from "react"
import { Sparkles } from "lucide-react"
import type { Player, Profile } from "./data"
import { completenessOf, missingLabel, realProfileOf } from "./people"
import { useVoxen } from "./store"

/** Quatro pontinhos: quanto do perfil (idade, posição, categoria, cidade) veio da própria pessoa. O resto é estimado ou está vazio. */
export function DataDots({ p }: { p: Pick<Player, "profile" | "estimated"> }) {
  const c = completenessOf(realProfileOf(p))
  return (
    <span className="vx-dots" title={c.complete ? "Dados completos (idade, posição, categoria e cidade)" : `Dados de verdade: ${c.core} de 4 — ${missingLabel(c)}`} aria-label={`${c.core} de 4 dados`}>
      {[0, 1, 2, 3].map((i) => <i key={i} className={i < c.core ? "is-on" : ""} />)}
    </span>
  )
}

/** O campo foi estimado pela VOXEN (a pessoa ainda não informou)? */
export const isEst = (p: Pick<Player, "estimated">, k: keyof Profile) => p.estimated.includes(k)

export const EST_HINT = "Estimado pela VOXEN: o atleta ainda não informou. Edite o cadastro para gravar o valor de verdade."

/** O valor, em itálico e com a dica "estimado", quando ele não veio da pessoa. */
export function Est({ p, k, children }: { p: Pick<Player, "estimated">; k: keyof Profile; children: ReactNode }) {
  if (!isEst(p, k)) return <>{children}</>
  return <span className="vx-est" title={EST_HINT}>{children}</span>
}

/** Liga e desliga os valores estimados em todas as telas de jogadores (a escolha fica guardada neste navegador). */
export function EstimatedSwitch() {
  const { showEstimated, setShowEstimated, estimatedCount } = useVoxen()
  if (!estimatedCount) return null
  return (
    <button
      type="button"
      className={`vx-chip ${showEstimated ? "is-on" : ""}`}
      aria-pressed={showEstimated}
      onClick={() => setShowEstimated(!showEstimated)}
      title="Quem ainda não informou idade, time, cidade e o resto aparece com valores estimados (em itálico). Nada disso é gravado: o dado de verdade passa na frente sozinho quando chega."
    >
      <Sparkles className="h-3.5 w-3.5" /> Valores estimados: {showEstimated ? "ligados" : "desligados"} <span className="tnum text-zinc-500">({estimatedCount})</span>
    </button>
  )
}
