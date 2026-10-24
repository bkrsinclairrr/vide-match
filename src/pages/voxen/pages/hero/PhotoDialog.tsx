import "./hero.css"
import "../scout/scout.css"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { ClubRef } from "@/pages/membros/scoutLayer"
import type { Player } from "../../data"
import type { Controls } from "../scout/api"
import { BodyTab } from "../scout/ScoutTabs"
import { splitName } from "./model"

/**
 * A janela de trocar a foto do jogador, aberta na própria ficha: enviar, recortar, escolher o estilo e o clube do
 * uniforme, ver como o atleta vai ver e escolher entre a foto de perfil e a de corpo inteiro. É o mesmo editor da aba
 * "Foto de corpo inteiro" do membro; só que sem sair da ficha.
 */
export function PhotoDialog({ open, onClose, p, avatarUrl, file, onChanged }: {
  open: boolean
  onClose: () => void
  p: Player
  avatarUrl: string | null
  /** Foto que a equipe soltou em cima do cabeçalho: já abre no recorte. */
  file: File | null
  onChanged: (controls: Controls, kit: ClubRef | null) => void
}) {
  const { first } = splitName(p.name)
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="vx-portal ph-dialog p-0" aria-describedby={undefined}>
        <div className="ph-dialog-head">
          <DialogTitle>Foto de {first}</DialogTitle>
          <p>
            Envie a foto em pé, ajuste o recorte e escolha o clube do uniforme. A prévia mostra como {first} vai aparecer na ficha e no Início da área dele.
          </p>
        </div>
        <div className="ph-dialog-body">
          {p.memberId && (
            <BodyTab
              member={{ id: p.memberId, fullName: p.name, position: p.profile.position ?? null, category: p.profile.category ?? null, photoUrl: avatarUrl }}
              initialFile={file}
              onChanged={onChanged}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
