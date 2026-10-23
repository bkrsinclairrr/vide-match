import "./photoChoice.css"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { useLocation } from "react-router-dom"
import { Camera, Check, Lock } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { useToast } from "@/hooks/use-toast"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import type { PhotoMode } from "../scoutLayer"
import { BodyStage } from "./BodyStage"
import { MemberAvatar } from "./bits"

/** Silhueta de quem ainda não tem a foto de corpo inteiro. */
function Silhouette() {
  const id = useId().replace(/:/g, "")
  return (
    <svg className="ph-ghost" viewBox="0 0 120 200" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="27" r="17" fill={`url(#${id}-g)`} />
      <path d="M31 57q29-12 58 0l9 60-15 3-5-33-3 54H45l-3-54-5 33-15-3z" fill={`url(#${id}-g)`} />
      <path d="M45 145h13l-2 47H46zM62 145h13l-1 47H64z" fill={`url(#${id}-g)`} />
    </svg>
  )
}

/**
 * "Como você aparece" (Perfil do atleta): a foto de perfil, redonda, ou a de corpo inteiro, como nas páginas dos
 * clubes. A de corpo inteiro é feita pela equipe; sem ela, a opção mostra como pedir. A escolha vale na hora, no Início
 * e para a equipe (que também pode trocar pela ficha do jogador).
 */
export function PhotoChoice() {
  const { account, layer, choosePhoto, pickPhoto, photoBusy, whatsapp, adminPreview } = useAthlete()
  const { toast } = useToast()
  const { hash } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState<PhotoMode | null>(null)
  const option = layer.bodyPhotoOption
  const mode = layer.photoMode

  useEffect(() => {
    if (hash === "#foto") ref.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [hash])

  const pick = async (m: PhotoMode) => {
    if (!choosePhoto || m === mode || busy || (m === "corpo" && !option)) return
    setBusy(m)
    try {
      await choosePhoto(m)
      toast({
        title: m === "corpo" ? "Pronto: você aparece de corpo inteiro" : "Pronto: você aparece com a foto de perfil",
        description: "No seu Início e para a equipe da Zyron. Dá para trocar quando quiser.",
      })
    } catch (e) {
      toast({ title: "Não foi possível trocar a foto", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  const keyPick = (m: PhotoMode) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      void pick(m)
    }
  }

  const locked = !option
  const off = !choosePhoto || busy !== null

  return (
    <section ref={ref} id="foto" className="vx-card mb-[18px] ph-card" aria-label="Como você aparece">
      <CardHead
        title={<span className="inline-flex items-center gap-2"><Camera className="h-4 w-4 text-amber-300" /> Como você aparece</span>}
        sub="Escolha a foto que aparece no seu Início e para a equipe da Zyron."
      />
      <div className="ph-choices" role="radiogroup" aria-label="Como você aparece">
        <div role="radio" aria-checked={mode === "perfil"} aria-disabled={off || undefined} tabIndex={off ? -1 : 0}
          className={`ph-choice ${mode === "perfil" ? "is-on" : ""}`} onClick={() => void pick("perfil")} onKeyDown={keyPick("perfil")}>
          <span className="ph-check" aria-hidden="true">{mode === "perfil" && <Check strokeWidth={3} />}</span>
          <span className="ph-stage is-round">
            <MemberAvatar member={{ fullName: account.name, photoUrl: account.avatarUrl, kind: "membro" }} size={96} ring="#fbbf24" />
          </span>
          <span className="ph-label"><b>Foto de perfil</b><small>Redonda, como nas redes sociais.</small></span>
        </div>

        <div role="radio" aria-checked={mode === "corpo"} aria-disabled={off || locked || undefined} tabIndex={off || locked ? -1 : 0}
          className={`ph-choice ${mode === "corpo" ? "is-on" : ""} ${locked ? "is-locked" : ""}`} onClick={() => void pick("corpo")} onKeyDown={keyPick("corpo")}>
          <span className="ph-check" aria-hidden="true">{mode === "corpo" ? <Check strokeWidth={3} /> : locked ? <Lock /> : null}</span>
          <span className="ph-stage is-body">
            {option
              ? <BodyStage photo={option} name={account.name} chips={[]} avatarUrl={account.avatarUrl} variant="desktop" zoomable={false} />
              : <Silhouette />}
          </span>
          <span className="ph-label">
            <b>Corpo inteiro</b>
            <small>{option ? "Em pé, de uniforme, como nas páginas dos clubes." : "A equipe da Zyron faz a sua foto de corpo inteiro."}</small>
          </span>
        </div>
      </div>

      <div className="ph-actions">
        {pickPhoto && (
          <button type="button" className="vx-btn" onClick={pickPhoto} disabled={photoBusy}>
            <Camera /> {account.avatarUrl ? "Trocar a foto de perfil" : "Colocar a foto de perfil"}
          </button>
        )}
        {locked && !adminPreview && (
          <a className="vx-btn vx-btn--wpp" href={whatsapp("Olá! Quero fazer a minha foto de corpo inteiro para a Zyron.")} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" /> Pedir a foto de corpo inteiro
          </a>
        )}
        {adminPreview && <p className="ph-note">Você está vendo como o atleta: a escolha é dele, ou pela ficha do jogador no painel.</p>}
      </div>
    </section>
  )
}
