import "./hero.css"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { Camera, ImagePlus, UserRoundPlus } from "lucide-react"
import { BodyStage } from "@/pages/membros/components/BodyStage"
import type { Player } from "../../data"
import { Avatar } from "../../ui"
import type { Look } from "../media/api"
import { choiceNote, type PhotoMode } from "../media/model"
import { MemberButton } from "./MemberButton"
import { PhotoSwitch } from "./PhotoSwitch"
import type { Visual } from "./model"

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files")

/** A foto redonda, grande: o anel dourado girando devagar e o brilho atrás. */
function HeroAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="ph-avatar">
      <span className="ph-avatar-halo" aria-hidden="true" />
      <span className="ph-avatar-ring" aria-hidden="true" />
      <span className="ph-avatar-face">
        {photoUrl ? <img src={photoUrl} alt={`Foto de ${name}`} referrerPolicy="no-referrer" draggable={false} /> : <Avatar name={name} size={164} />}
      </span>
    </div>
  )
}

/**
 * O lado direito do cabeçalho da ficha: a foto de corpo inteiro (o retrato) ou a redonda, e embaixo o que a equipe pode
 * fazer com ela: escolher entre as duas, trocar a foto ou, se ainda não há, adicionar. Soltar uma imagem em cima também
 * abre a troca.
 */
export function HeroVisual({ p, look, visual, busy, onMode, onEdit }: {
  p: Player
  look: Look | null
  visual: Visual
  busy: boolean
  onMode: (mode: PhotoMode) => void
  /** Abre a janela de trocar a foto (com a imagem que foi solta, se houver). */
  onEdit: (file?: File | null) => void
}) {
  const [broken, setBroken] = useState(false)
  const [drag, setDrag] = useState(false)
  const depth = useRef(0)
  const body = look?.body ?? null

  // Foto nova (ou outra pessoa): a imagem tem nova chance de carregar.
  useEffect(() => { setBroken(false) }, [body?.url])

  const portrait = visual.kind === "portrait" && !broken && body
  const mode: PhotoMode = portrait ? "corpo" : "perfil"
  const note = look && p.memberId ? choiceNote(look.choiceBy, look.choiceAt) : ""
  const dropOk = visual.canUpload

  const over = (e: DragEvent) => {
    if (!dropOk || !hasFiles(e)) return
    e.preventDefault()
    if (e.type === "dragenter") { depth.current += 1; setDrag(true) }
  }
  const leave = (e: DragEvent) => {
    if (!dropOk || !hasFiles(e)) return
    depth.current = Math.max(0, depth.current - 1)
    if (!depth.current) setDrag(false)
  }
  const drop = (e: DragEvent) => {
    if (!dropOk || !hasFiles(e)) return
    e.preventDefault()
    depth.current = 0
    setDrag(false)
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))
    if (file) onEdit(file)
  }

  const showBar = visual.canSwitch || (visual.canUpload && Boolean(body)) || visual.invite || visual.needsMember

  return (
    <div className={`ph-visual is-${portrait ? "portrait" : visual.kind === "loading" ? "loading" : "avatar"} ${drag ? "is-drag" : ""}`}
      onDragEnter={over} onDragOver={over} onDragLeave={leave} onDrop={drop}>
      <div className="ph-stage-slot">
        {visual.kind === "loading" ? (
          <span className="ph-skel" aria-hidden="true" />
        ) : portrait ? (
          <div className="ph-portrait" key="portrait">
            <BodyStage photo={body} name={p.name} chips={[]} avatarUrl={look?.avatarUrl ?? null} variant="hero" seal={false} onFail={() => setBroken(true)} />
          </div>
        ) : (
          <div className={`ph-avatar-wrap ${visual.invite ? "has-hint" : ""}`} key="avatar">
            {visual.invite && <span className="ph-silhouette" aria-hidden="true" />}
            <HeroAvatar name={p.name} photoUrl={look?.avatarUrl ?? null} />
          </div>
        )}
      </div>

      {showBar && (
        <div className="ph-bar vx-no-print">
          {visual.canSwitch && (
            <PhotoSwitch mode={mode} bodyReady={Boolean(body)} disabled={busy} onPick={onMode} label={`Como ${p.name.split(" ")[0]} aparece`} />
          )}
          {visual.canUpload && body && (
            <div className="ph-sub">
              <button type="button" className="ph-link" onClick={() => onEdit()} title="Trocar a foto de corpo inteiro, o recorte e o clube do uniforme">
                <Camera /> Trocar foto em pé
              </button>
              {note && visual.canSwitch && <small>{note}</small>}
            </div>
          )}
          {visual.invite && (
            <button type="button" className="ph-add" onClick={() => onEdit()}>
              <span className="ph-add-icon"><ImagePlus /></span>
              <span><b>Adicionar foto em pé</b><small>Solte uma imagem aqui ou escolha no computador. Ela aparece grande na ficha e no Início dele.</small></span>
            </button>
          )}
          {visual.needsMember && (
            <div className="ph-need">
              <span className="ph-add-icon"><UserRoundPlus /></span>
              <span><b>A foto em pé fica na ficha de membro</b><small>Cadastre {p.name.split(" ")[0]} como membro para enviar a foto e escolher como ele aparece.</small></span>
              <MemberButton p={p} className="vx-btn vx-btn--gold" />
            </div>
          )}
        </div>
      )}

      {drag && (
        <div className="ph-drop" aria-hidden="true">
          <ImagePlus />
          <b>Solte a foto para trocar</b>
          <small>Ela abre no recorte, para você conferir antes de salvar.</small>
        </div>
      )}
    </div>
  )
}
