import { useState } from "react"
import { Trash2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "../store"
import type { Player } from "../data"
import PlayerEditor from "./PlayerEditor"

/** Editar o cadastro de um jogador sem sair da lista (janela por cima da página). */
export function PlayerEditDialog({ player, onClose }: { player: Player | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(player)} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="vx-portal pd-dialog max-w-3xl p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Editar cadastro</DialogTitle>
        <div className="pd-body">{player && <PlayerEditor key={player.key} p={player} onClose={onClose} />}</div>
      </DialogContent>
    </Dialog>
  )
}

/** O que a exclusão apaga e o que continua, em palavras simples (uma pessoa pode ter funil, conta e ficha de membro). */
export function deleteSummary(p: Pick<Player, "key" | "aliases" | "userId" | "source" | "memberId">): { erased: string; kept: string } {
  const lead = p.source === "funil"
  const account = p.source === "conta" || p.aliases.some((a) => a.startsWith("atleta:"))
  const erased = [lead ? "o cadastro do funil (contato e perfil)" : "", account ? "o perfil de atleta" : "", "as notas e a etapa da equipe"].filter(Boolean)
  const kept = [p.userId ? "a conta de login" : "", p.memberId ? "a ficha de membro, com as partidas" : ""].filter(Boolean)
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}` : xs[0] ?? "")
  return { erased: list(erased), kept: kept.length ? list(kept) : "" }
}

/** Confirmação de exclusão (só administrador). */
export function PlayerDeleteDialog({ player, onClose, onDeleted }: { player: Player | null; onClose: () => void; onDeleted?: () => void }) {
  const { removePlayer } = useVoxen()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const s = player ? deleteSummary(player) : null

  const remove = async () => {
    if (!player) return
    setBusy(true)
    try {
      await removePlayer(player.key)
      toast({ title: "Cadastro excluído", description: player.name })
      onDeleted?.()
      onClose()
    } catch (err) {
      toast({ title: "Não foi possível excluir", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(player)} onOpenChange={(v) => { if (!v && !busy) onClose() }}>
      <DialogContent className="vx-portal pd-dialog max-w-md p-0" aria-describedby={undefined}>
        <div className="pd-confirm" role="alertdialog" aria-label="Confirmar exclusão">
          <DialogTitle>Excluir {player?.name}?</DialogTitle>
          {s && (
            <p>
              Apaga {s.erased}. {s.kept ? <>Continuam: {s.kept} (se quiser, exclua em <b>Contas e acessos</b> ou na tela do membro). </> : null}
              <strong>Não dá para desfazer.</strong>
            </p>
          )}
          <div>
            <button type="button" className="vx-btn" onClick={onClose} disabled={busy}><X /> Cancelar</button>
            <button type="button" className="vx-btn pp-danger-solid" onClick={() => void remove()} disabled={busy}><Trash2 /> {busy ? "Excluindo..." : "Excluir de vez"}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
