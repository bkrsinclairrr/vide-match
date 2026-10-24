import "./hero.css"

import { CircleUserRound, PersonStanding } from "lucide-react"
import type { PhotoMode } from "../media/model"

/**
 * Como o jogador aparece: foto de perfil (redonda) ou de corpo inteiro. Um seletor de duas opções com a "pílula" dourada
 * que desliza de uma para a outra. "Corpo inteiro" só liga quando a equipe já enviou a foto.
 */
export function PhotoSwitch({ mode, onPick, bodyReady, disabled = false, label }: {
  mode: PhotoMode
  onPick: (mode: PhotoMode) => void
  bodyReady: boolean
  disabled?: boolean
  label: string
}) {
  const pick = (next: PhotoMode) => { if (next !== mode) onPick(next) }
  return (
    <div className="ph-switch" role="radiogroup" aria-label={label} data-pos={mode === "corpo" ? 1 : 0}>
      <span className="ph-switch-thumb" aria-hidden="true" />
      <button type="button" role="radio" aria-checked={mode === "perfil"} disabled={disabled} onClick={() => pick("perfil")} title="Foto de perfil, a redonda">
        <CircleUserRound /> Perfil
      </button>
      <button type="button" role="radio" aria-checked={mode === "corpo"} disabled={disabled || !bodyReady} onClick={() => pick("corpo")}
        title={bodyReady ? "Corpo inteiro, como nas páginas dos clubes" : "Ainda sem foto de corpo inteiro"}>
        <PersonStanding /> Corpo inteiro
      </button>
    </div>
  )
}
