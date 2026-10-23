import "./media.css"

import { useState } from "react"
import { Link } from "react-router-dom"
import { CircleUserRound, PersonStanding } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "@/pages/voxen/store"
import { BodyStage } from "@/pages/membros/components/BodyStage"
import { MemberAvatar } from "@/pages/membros/components/bits"
import type { Player } from "../../data"
import { errMsg, useLoad } from "../scout/api"
import { useMediaApi, type Look, type MediaApi } from "./api"
import { choiceNote, type PhotoMode } from "./model"

/**
 * A foto do jogador no alto da ficha: a redonda (a que o atleta escolheu, ou a do cadastro) ou a de corpo inteiro, no
 * mesmo palco que o atleta vê no Início. Quem mantém jogador escolhe entre as duas aqui; o atleta escolhe na área dele.
 * Vale a última escolha, de um ou de outro.
 */
export function PlayerLook({ p }: { p: Player }) {
  const { demo, canScout } = useVoxen()
  const { toast } = useToast()
  const api = useMediaApi(demo)
  const q = useLoad<Look, MediaApi>(api, (a) => a.look(p.memberId, p.userId ?? null), [p.memberId, p.userId])
  const [busy, setBusy] = useState(false)
  const look = q.data
  const body = look?.mode === "corpo" ? look.body : null
  const first = p.name.trim().split(/\s+/)[0] || p.name

  const choose = async (mode: PhotoMode) => {
    if (!api || !p.memberId || !look || look.mode === mode) return
    setBusy(true)
    try {
      const choice = await api.setPhotoMode(p.memberId, mode)
      q.set((l) => (l ? { ...l, ...choice } : l))
      toast({
        title: mode === "corpo" ? `${first} aparece de corpo inteiro` : `${first} aparece com a foto de perfil`,
        description: "Na ficha e no Início da área dele. Ele também pode trocar por lá.",
      })
    } catch (e) {
      toast({ title: "Não foi possível trocar a foto", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const note = look && p.memberId ? choiceNote(look.choiceBy, look.choiceAt) : ""

  return (
    <div className="pl-look">
      <div className="pl-look-frame">
        {body
          ? <BodyStage photo={body} name={p.name} chips={[]} avatarUrl={look?.avatarUrl ?? null} variant="desktop" />
          : <MemberAvatar member={{ fullName: p.name, photoUrl: look?.avatarUrl ?? null, kind: "membro" }} size={84} ring="#fbbf24" />}
      </div>

      {canScout && p.memberId && look && (
        <>
          <div className="pl-look-switch vx-no-print" role="radiogroup" aria-label={`Como ${first} aparece`}>
            <button type="button" role="radio" aria-checked={look.mode === "perfil"} className={look.mode === "perfil" ? "is-on" : ""}
              disabled={busy} onClick={() => void choose("perfil")} title="Foto de perfil, redonda">
              <CircleUserRound /> Perfil
            </button>
            <button type="button" role="radio" aria-checked={look.mode === "corpo"} className={look.mode === "corpo" ? "is-on" : ""}
              disabled={busy || !look.body} onClick={() => void choose("corpo")}
              title={look.body ? "Corpo inteiro, como nas páginas dos clubes" : "Ainda sem foto de corpo inteiro"}>
              <PersonStanding /> Corpo inteiro
            </button>
          </div>
          <p className="pl-look-note">
            {look.body
              ? note || "Ele também escolhe na área dele."
              : <>Sem foto de corpo inteiro. <Link to={`/voxen/membros/${p.memberId}?aba=corpo`}>Enviar a foto</Link></>}
          </p>
        </>
      )}
    </div>
  )
}
