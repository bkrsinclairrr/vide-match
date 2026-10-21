import "./bodyStage.css"

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { prefersReducedMotion } from "@/lib/reducedMotion"
import type { BodyPhoto } from "../scoutLayer"
import { ClubCrest } from "./ClubCrest"
import { MemberAvatar } from "./bits"

/** "#0b6b3a" → "11, 107, 58" (para usar com transparência no CSS). */
function rgbOf(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

const GOLD = "#fbbf24"

/**
 * O retrato de estreia do atleta: a foto de corpo inteiro num palco escuro, com o holofote na
 * cor do clube do uniforme, o primeiro nome em contorno atrás e o rosto (avatar) com o escudo
 * no pé. O mesmo componente serve o Início do atleta e a pré-visualização do Scout, então o
 * que a equipe vê é exatamente o que o atleta vê.
 *
 * `variant`: "auto" segue a largura da tela; "desktop" e "mobile" forçam um dos dois (as abas
 * da pré-visualização). Se a imagem não carregar, chama `onFail` e o Início volta ao herói de sempre.
 */
export function BodyStage({
  photo, name, chips, avatarUrl, variant = "auto", zoomable = true, onFail,
}: {
  photo: BodyPhoto
  name: string
  chips: string[]
  avatarUrl: string | null
  variant?: "auto" | "desktop" | "mobile"
  zoomable?: boolean
  onFail?: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [calm] = useState(prefersReducedMotion)
  const first = name.trim().split(/\s+/)[0] || name
  const accent = photo.kit?.color ?? GOLD
  const srcSet = photo.smallUrl ? `${photo.smallUrl} 512w, ${photo.url} 800w` : undefined
  const sizes = variant === "mobile" ? "100vw" : variant === "desktop" ? "280px" : "(max-width: 760px) 100vw, 280px"

  // Troca de foto (pré-visualização do Scout): carrega de novo, com a entrada de novo.
  useEffect(() => { setLoaded(false) }, [photo.url])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // Paralaxe do ponteiro (até 6 px), só onde existe hover de verdade e sem "reduzir movimento".
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (calm || e.pointerType !== "mouse") return
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 2 - 1
    const y = ((e.clientY - box.top) / box.height) * 2 - 1
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--bs-px", x.toFixed(3))
      el.style.setProperty("--bs-py", y.toFixed(3))
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    ref.current?.style.setProperty("--bs-px", "0")
    ref.current?.style.setProperty("--bs-py", "0")
  }

  const img = (cls: string, decorative = false) => (
    <img
      className={cls}
      src={photo.url}
      srcSet={srcSet}
      sizes={sizes}
      width={800}
      height={1000}
      alt={decorative ? "" : `${name} em pé, de uniforme`}
      aria-hidden={decorative || undefined}
      decoding="async"
      draggable={false}
      {...(decorative ? { loading: "lazy" as const } : { fetchpriority: "high" })}
      onLoad={decorative ? undefined : () => setLoaded(true)}
      onError={decorative ? undefined : () => onFail?.()}
    />
  )

  const style = { "--bs-accent": accent, "--bs-accent-rgb": rgbOf(accent) } as CSSProperties

  return (
    <figure
      ref={ref}
      className={`bs bs--${photo.style} bs--${variant} ${loaded ? "is-ready" : "is-loading"} ${calm ? "is-calm" : ""}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="bs-stage">
        <div className="bs-back" aria-hidden="true">
          <span className="bs-light" />
          {/* O nome cabe na largura do palco, seja curto ou longo. */}
          <span className="bs-ghost" style={{ fontSize: `calc(var(--bs-w) * ${Math.min(0.34, 1.45 / Math.max(first.length, 3)).toFixed(3)})` }}>{first}</span>
          <span className="bs-grain" />
        </div>
        <span className="bs-floor" aria-hidden="true" />
        <button
          type="button"
          className="bs-frame"
          onClick={() => zoomable && setOpen(true)}
          tabIndex={zoomable ? 0 : -1}
          aria-label={zoomable ? `Ampliar a foto de ${name}` : undefined}
          disabled={!zoomable}
        >
          {img("bs-img")}
          <span className="bs-skeleton" aria-hidden="true" />
        </button>
        {photo.style === "recorte" && <span className="bs-reflection" aria-hidden="true">{img("bs-img", true)}</span>}
        <figcaption className="bs-caption">
          <b>{name}</b>
          {chips.length > 0 && <span>{chips.join(" · ")}</span>}
        </figcaption>
      </div>
      <div className="bs-seal">
        <span className="bs-seal-face"><MemberAvatar member={{ fullName: name, photoUrl: avatarUrl, kind: "membro" }} size={56} ring={GOLD} /></span>
        {photo.kit && <span className="bs-seal-crest" title={photo.kit.name}><ClubCrest club={photo.kit} size={28} /></span>}
      </div>
      {chips.length > 0 && <p className="bs-chips">{chips.map((c) => <span key={c}>{c}</span>)}</p>}

      {zoomable && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="vx-portal bs-zoom max-w-[min(92vw,560px)] border-0 bg-transparent p-0 shadow-none" aria-describedby={undefined}>
            <DialogTitle className="sr-only">Foto de corpo inteiro de {name}</DialogTitle>
            <div className={`bs-zoom-stage bs--${photo.style}`} style={style}>
              <img src={photo.url} alt={`${name} em pé, de uniforme`} width={800} height={1000} decoding="async" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </figure>
  )
}
