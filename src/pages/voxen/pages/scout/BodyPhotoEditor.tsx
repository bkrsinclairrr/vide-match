import "../media/media.css"

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent } from "react"
import {
  AlertTriangle, Camera, Check, CircleUserRound, Crosshair, Frame, ImagePlus, Loader2, Monitor, PersonStanding, RotateCcw, Scissors, Smartphone, Upload, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "@/pages/voxen/store"
import { BodyStage } from "@/pages/membros/components/BodyStage"
import type { BodyPhoto, BodyStyle } from "@/pages/membros/scoutLayer"
import type { Member } from "@/pages/membros/model"
import { ClubPicker, NewClubForm } from "../opportunities/ClubPicker"
import { choiceNote } from "../media/model"
import { errMsg, type Club, type Controls, type ScoutApi } from "./api"
import {
  centered, clampCrop, containScale, coverScale, encode, extOf, hasTransparency, luminance, openImage, previewUrl, render,
  type Crop, type Source,
} from "./image"

/** Moldura do recorte (4:5), em pixels de referência. */
const FW = 320
const FH = 400
const HEAD = 0.06
const FLOOR = 0.94

type Picked = { src: Source; alpha: boolean; warnings: string[]; name: string }

const TIPS = [
  "Pose de frente, corpo inteiro, com os pés aparecendo",
  "Uniforme do clube, luz uniforme, sem contraluz",
  "Foto vertical, com 900 px de altura ou mais",
  "PNG com fundo transparente libera o estilo “recorte”",
]

/** Confere a imagem antes de aceitar: deitada ou pequena demais bloqueia; o resto avisa. */
function inspect(src: Source): { block: string | null; warnings: string[]; alpha: boolean } {
  if (src.width > src.height * 1.1) return { block: "A foto está deitada. Use uma foto em pé (vertical), com o corpo inteiro.", warnings: [], alpha: false }
  if (src.height < 600) return { block: `A foto tem ${src.height} px de altura. O mínimo é 600 px (o ideal, 900 ou mais).`, warnings: [], alpha: false }
  const warnings: string[] = []
  if (src.height < 900) warnings.push(`Abaixo de 900 px de altura (${src.height} px): pode perder nitidez no computador.`)
  const alpha = hasTransparency(src)
  if (luminance(src) < 0.22) warnings.push("A foto está escura. Se puder, use uma com luz mais uniforme.")
  return { block: null, warnings, alpha }
}

/** Desenha a moldura de recorte com as linhas-guia de topo da cabeça e chão. */
function drawEditor(canvas: HTMLCanvasElement, src: Source, crop: Crop, alpha: boolean) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = FW * dpr
  canvas.height = FH * dpr
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (alpha) {
    for (let y = 0; y < FH; y += 16) for (let x = 0; x < FW; x += 16) {
      ctx.fillStyle = (x + y) % 32 === 0 ? "#1c1c20" : "#141417"
      ctx.fillRect(x, y, 16, 16)
    }
  } else {
    ctx.fillStyle = "#0b0b0d"
    ctx.fillRect(0, 0, FW, FH)
  }
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(src.bitmap, crop.x, crop.y, src.width * crop.scale, src.height * crop.scale)
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 1
  ctx.strokeStyle = "rgba(251, 191, 36, 0.9)"
  ctx.font = "600 10px Inter, system-ui, sans-serif"
  ctx.fillStyle = "rgba(253, 230, 138, 0.95)"
  for (const [y, label] of [[FH * HEAD, "topo da cabeça"], [FH * FLOOR, "chão"]] as const) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(FW, y)
    ctx.stroke()
    ctx.fillText(label, 8, y - 4)
  }
  ctx.setLineDash([])
}

/**
 * Foto de corpo inteiro (aba da ficha do Scout). Escolher, conferir, recortar em 4:5, escolher o
 * estilo e o clube do uniforme, ver ao vivo como o atleta vai ver (computador e celular) e
 * escolher como ele aparece: foto de perfil (redonda) ou corpo inteiro. O atleta também escolhe
 * na área dele; vale a última escolha. Sobe duas versões em WebP (1000 e 640 px de altura); a foto
 * anterior só sai do Storage quando uma terceira a substitui, e pode ser restaurada.
 */
export function BodyPhotoEditor({ api, member, controls, clubs, onControls, onClubsChanged }: {
  api: ScoutApi
  member: Pick<Member, "id" | "fullName" | "position" | "category" | "photoUrl">
  controls: Controls
  clubs: Club[]
  onControls: (c: Controls) => void
  onClubsChanged: (c: Club) => void
}) {
  const { canScout } = useVoxen()
  const { toast } = useToast()
  const [picked, setPicked] = useState<Picked | null>(null)
  const [crop, setCrop] = useState<Crop | null>(null)
  const [zoom, setZoom] = useState(1)
  const [style, setStyle] = useState<BodyStyle>(controls.bodyPhotoStyle)
  const [preview, setPreview] = useState<string | null>(null)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [stage, setStage] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const [editingClub, setEditingClub] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const first = member.fullName.split(" ")[0]
  const pointer = useRef<{ x: number; y: number; crop: Crop } | null>(null)

  const kit = clubs.find((c) => c.id === controls.kitClubId) ?? null
  const base = picked ? coverScale(picked.src, FW, FH) : 1
  const minZoom = picked?.alpha ? Math.min(1, containScale(picked.src, FW, FH) / base) : 1

  // Desenha o recorte a cada mudança e gera a pré-visualização (com folga, para não pesar).
  useEffect(() => {
    if (!picked || !crop || !canvasRef.current) return
    drawEditor(canvasRef.current, picked.src, crop, picked.alpha)
    const t = window.setTimeout(() => {
      setPreview(previewUrl(render(picked.src, FW, FH, crop, 400, 500, style === "moldura" && !picked.alpha)))
    }, 180)
    return () => window.clearTimeout(t)
  }, [picked, crop, style])

  const accept = useCallback(async (file: File) => {
    try {
      const src = await openImage(file)
      const check = inspect(src)
      if (check.block) {
        toast({ title: "Esta foto não serve", description: check.block, variant: "destructive" })
        return
      }
      const scale = coverScale(src, FW, FH)
      setPicked({ src, alpha: check.alpha, warnings: check.warnings, name: file.name })
      setStyle(check.alpha ? "recorte" : "moldura")
      setZoom(1)
      setCrop(clampCrop(src, FW, FH, { ...centered(src, FW, FH, scale), y: 0 }))
    } catch (e) {
      toast({ title: "Não foi possível abrir a foto", description: errMsg(e), variant: "destructive" })
    }
  }, [toast])

  // Colar uma imagem (Ctrl V) enquanto a aba está aberta.
  useEffect(() => {
    if (!canScout) return
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"))
      if (file) void accept(file)
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [accept, canScout])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) void accept(file)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"))
    if (file) void accept(file)
  }

  const setZoomTo = (z: number) => {
    if (!picked || !crop) return
    const scale = base * z
    // Mantém o centro da moldura no mesmo ponto da foto ao aproximar.
    const cx = (FW / 2 - crop.x) / crop.scale
    const cy = (FH / 2 - crop.y) / crop.scale
    setZoom(z)
    setCrop(clampCrop(picked.src, FW, FH, { scale, x: FW / 2 - cx * scale, y: FH / 2 - cy * scale }))
  }

  const ratio = () => FW / (canvasRef.current?.getBoundingClientRect().width || FW)
  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!crop) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointer.current = { x: e.clientX, y: e.clientY, crop }
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = pointer.current
    if (!p || !picked) return
    const k = ratio()
    setCrop(clampCrop(picked.src, FW, FH, { ...p.crop, x: p.crop.x + (e.clientX - p.x) * k, y: p.crop.y + (e.clientY - p.y) * k }))
  }
  const onUp = () => { pointer.current = null }

  const center = () => {
    if (!picked || !crop) return
    setCrop(clampCrop(picked.src, FW, FH, centered(picked.src, FW, FH, crop.scale)))
  }

  const save = async () => {
    if (!picked || !crop) return
    const opaque = style === "moldura" && !picked.alpha
    try {
      setStage("Preparando as imagens")
      const [big, small] = await Promise.all([
        encode(render(picked.src, FW, FH, crop, 800, 1000, opaque), 300 * 1024, picked.alpha),
        encode(render(picked.src, FW, FH, crop, 512, 640, opaque), 140 * 1024, picked.alpha),
      ])
      const ts = Date.now()
      setStage("Enviando 1 de 2")
      const url = await api.upload(`players/${member.id}/corpo-${ts}-1000.${extOf(big)}`, big)
      setStage("Enviando 2 de 2")
      const smallUrl = await api.upload(`players/${member.id}/corpo-${ts}-640.${extOf(small)}`, small)
      setStage("Salvando")
      const current = controls.bodyPhotoUrl ? { url: controls.bodyPhotoUrl, smallUrl: controls.bodyPhotoSmallUrl, style: controls.bodyPhotoStyle } : null
      const dropped = current ? controls.bodyPhotoPrev : null
      const saved = await api.saveControls(member.id, {
        bodyPhotoUrl: url, bodyPhotoSmallUrl: smallUrl, bodyPhotoStyle: style, bodyPhotoPrev: current ?? controls.bodyPhotoPrev,
      })
      // Só agora a foto que saiu da fila de restaurar deixa o Storage.
      if (dropped) void api.removeMedia([dropped.url, dropped.smallUrl])
      onControls(saved)
      setPicked(null)
      setCrop(null)
      setPreview(null)
      toast({
        title: "Foto salva",
        description: saved.bodyPhotoOn
          ? `${member.fullName} já aparece com a foto nova.`
          : `Escolha "Corpo inteiro" abaixo para ${first} aparecer assim (ele também pode escolher na área dele).`,
      })
    } catch (e) {
      toast({ title: "Não foi possível salvar a foto", description: `${errMsg(e)} A foto atual continua como estava.`, variant: "destructive" })
    } finally {
      setStage(null)
    }
  }

  const patch = async (p: Parameters<ScoutApi["saveControls"]>[1], done: string) => {
    try {
      onControls(await api.saveControls(member.id, p))
      toast({ title: done })
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: errMsg(e), variant: "destructive" })
    }
  }

  const restore = () => {
    const prev = controls.bodyPhotoPrev
    if (!prev) return
    const current = controls.bodyPhotoUrl ? { url: controls.bodyPhotoUrl, smallUrl: controls.bodyPhotoSmallUrl, style: controls.bodyPhotoStyle } : null
    void patch({ bodyPhotoUrl: prev.url, bodyPhotoSmallUrl: prev.smallUrl, bodyPhotoStyle: prev.style, bodyPhotoPrev: current }, "Foto anterior restaurada")
  }

  const shown: BodyPhoto | null = useMemo(() => {
    if (picked && preview) return { url: preview, smallUrl: null, style, kit }
    if (controls.bodyPhotoUrl) return { url: controls.bodyPhotoUrl, smallUrl: controls.bodyPhotoSmallUrl, style: controls.bodyPhotoStyle, kit }
    return null
  }, [picked, preview, style, kit, controls])

  const chips = [member.position, member.category].filter(Boolean) as string[]

  return (
    <div className="bp">
      <div className="bp-grid">
        <section className="vx-card bp-work">
          <h3 className="vx-card-title">{picked ? "Recorte a foto" : controls.bodyPhotoUrl ? "Trocar a foto" : "Enviar a foto"}</h3>

          {!picked ? (
            <label className={`bp-drop ${drag ? "is-drag" : ""} ${canScout ? "" : "is-off"}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
              <span className="bp-ghost" aria-hidden="true" />
              <ImagePlus />
              <b>Solte a foto aqui, cole (Ctrl V) ou escolha</b>
              <small>JPG, PNG ou WebP. Foto em pé, de corpo inteiro.</small>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} disabled={!canScout} />
            </label>
          ) : (
            <div className="bp-crop">
              <canvas ref={canvasRef} className="bp-canvas" style={{ aspectRatio: "4 / 5" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                aria-label="Arraste para posicionar a foto" role="img" />
              <div className="bp-crop-tools">
                <label className="bp-zoom">
                  <span>Zoom</span>
                  <input type="range" min={minZoom} max={3} step={0.01} value={zoom} onChange={(e) => setZoomTo(Number(e.target.value))} aria-label="Zoom" />
                </label>
                <button type="button" className="vx-btn h-8" onClick={center}><Crosshair /> Centralizar</button>
              </div>
              <p className="bp-hint">Arraste a foto. A cabeça encosta na linha de cima e os pés, na linha do chão.</p>
              {picked.warnings.map((w) => <p key={w} className="bp-warn"><AlertTriangle /> {w}</p>)}
            </div>
          )}

          {!picked && (
            <div className="bp-actions">
              <label className={`vx-btn ${canScout ? "" : "pointer-events-none opacity-50"}`}>
                <Upload /> Escolher foto
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} disabled={!canScout} />
              </label>
              <label className={`vx-btn bp-camera ${canScout ? "" : "pointer-events-none opacity-50"}`}>
                <Camera /> Tirar foto
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} disabled={!canScout} />
              </label>
            </div>
          )}

          <ul className="bp-tips">{TIPS.map((t) => <li key={t}><Check /> {t}</li>)}</ul>

          <div className="bp-section">
            <h4>Estilo</h4>
            <div className="bp-styles" role="radiogroup" aria-label="Estilo do palco">
              {([
                ["moldura", Frame, "Moldura", "Arco com borda dourada. Funciona com qualquer foto."],
                ["recorte", Scissors, "Recorte", "Sem moldura, com sombra e reflexo. Precisa de PNG com fundo transparente."],
              ] as const).map(([key, Icon, label, text]) => {
                const disabled = key === "recorte" && (picked ? !picked.alpha : controls.bodyPhotoStyle !== "recorte")
                const on = picked ? style === key : controls.bodyPhotoStyle === key
                return (
                  <button key={key} type="button" role="radio" aria-checked={on} disabled={disabled || !canScout} className={`bp-style ${on ? "is-on" : ""}`}
                    onClick={() => (picked ? setStyle(key) : void patch({ bodyPhotoStyle: key }, `Estilo: ${label.toLowerCase()}`))}>
                    <span className={`bp-style-thumb is-${key}`} aria-hidden="true"><i /></span>
                    <b><Icon /> {label}</b>
                    <small>{text}</small>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bp-section">
            <h4>Clube do uniforme</h4>
            <p className="bp-sub">Dá a cor do holofote e o escudo do selo.</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[220px] flex-1">
                <ClubPicker api={api} clubs={clubs} value={kit} disabled={!canScout} onClubsChanged={onClubsChanged}
                  onPick={(c) => void patch({ kitClubId: c.id }, `Uniforme: ${c.name}`)} />
              </div>
              {kit && canScout && <button type="button" className="vx-btn h-10" onClick={() => setEditingClub((v) => !v)}>Cor e escudo</button>}
              {kit && canScout && <button type="button" className="vx-icon-btn" onClick={() => void patch({ kitClubId: null }, "Sem clube no uniforme")} aria-label="Tirar o clube do uniforme"><X /></button>}
            </div>
            {editingClub && kit && <NewClubForm api={api} club={kit} onCancel={() => setEditingClub(false)} onSaved={(c) => { onClubsChanged(c); setEditingClub(false) }} />}
          </div>

          {picked && (
            <div className="bp-save">
              <button type="button" className="vx-btn" onClick={() => { setPicked(null); setCrop(null); setPreview(null) }} disabled={Boolean(stage)}><X /> Cancelar</button>
              <button type="button" className="vx-btn vx-btn--gold" onClick={() => void save()} disabled={Boolean(stage) || !preview}>
                {stage ? <><Loader2 className="op-spin" /> {stage}...</> : <><Check /> Salvar foto</>}
              </button>
            </div>
          )}
        </section>

        <section className="vx-card bp-preview">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="vx-card-title">Como o atleta vê</h3>
            <div className="vx-tabs" role="tablist" aria-label="Aparelho">
              <button type="button" role="tab" aria-selected={device === "desktop"} className={`vx-tab ${device === "desktop" ? "is-on" : ""}`} onClick={() => setDevice("desktop")}><Monitor className="mr-1 inline h-3.5 w-3.5" />Computador</button>
              <button type="button" role="tab" aria-selected={device === "mobile"} className={`vx-tab ${device === "mobile" ? "is-on" : ""}`} onClick={() => setDevice("mobile")}><Smartphone className="mr-1 inline h-3.5 w-3.5" />Celular</button>
            </div>
          </div>
          {shown ? (
            <div className={`bp-mock is-${device}`}>
              <div className="bp-mock-hero">
                <BodyStage key={`${device}-${shown.url.slice(-40)}`} photo={shown} name={member.fullName} chips={chips} avatarUrl={member.photoUrl} variant={device} zoomable={false} />
                {device === "desktop" && (
                  <div className="bp-mock-text">
                    <p className="gm-eyebrow">Bem-vindo de volta</p>
                    <h4>{member.fullName.split(" ")[0]}, o seu jogo está em evolução.</h4>
                    <span className="bp-mock-bar" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bp-empty"><span className="bp-ghost" aria-hidden="true" /><p>A pré-visualização aparece aqui assim que você escolher a foto.</p></div>
          )}

          {controls.bodyPhotoUrl && !picked && (
            <div className="bp-state">
              <div className="bp-mode">
                <span className="bp-mode-label">Como {first} aparece (no Início dele e na ficha)</span>
                <div className="pl-look-switch" role="radiogroup" aria-label={`Como ${first} aparece`}>
                  <button type="button" role="radio" aria-checked={!controls.bodyPhotoOn} className={controls.bodyPhotoOn ? "" : "is-on"} disabled={!canScout}
                    onClick={() => { if (controls.bodyPhotoOn) void patch({ bodyPhotoOn: false }, `${first} aparece com a foto de perfil`) }}>
                    <CircleUserRound /> Foto de perfil
                  </button>
                  <button type="button" role="radio" aria-checked={controls.bodyPhotoOn} className={controls.bodyPhotoOn ? "is-on" : ""} disabled={!canScout}
                    onClick={() => { if (!controls.bodyPhotoOn) void patch({ bodyPhotoOn: true }, `${first} aparece de corpo inteiro`) }}>
                    <PersonStanding /> Corpo inteiro
                  </button>
                </div>
                <small>{choiceNote(controls.photoChoiceBy, controls.photoChoiceAt) || `${first} também pode escolher na área dele. Vale a última escolha.`}</small>
              </div>
              {controls.bodyPhotoPrev && canScout && <button type="button" className="vx-btn h-8 justify-self-start" onClick={restore}><RotateCcw /> Restaurar a foto anterior</button>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
