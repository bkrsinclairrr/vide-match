import "./media.css"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpToLine, ChevronLeft, ChevronRight, Clapperboard, Ellipsis, ExternalLink, Film, HardDrive, Instagram, Link2, Loader2, Music2,
  Pencil, Play, Plus, Trash2, UserRound, Video, Youtube,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "@/pages/voxen/store"
import { CardHead } from "@/pages/voxen/ui"
import type { Player } from "../../data"
import { keysOf } from "../../people"
import { errMsg, useLoad } from "../scout/api"
import { MEDIA_MIGRATION, MediaSetupMissingError, useMediaApi, type MediaApi, type MemberVideos } from "./api"
import {
  CATEGORIES, CATEGORY_LABEL, EMPTY_DRAFT, PROVIDER_LABEL, SOURCE_LABEL, buildTiles, checkDraft, draftOf, filterTiles, frontPosition, nextPosition,
  playsHere, slotCount, videoRef,
  type Material, type MaterialDraft, type MaterialValue, type Provider, type Tile, type TileFilter, type VideoRef,
} from "./model"

const NO_VIDEOS: MemberVideos = { matches: [], sent: [] }

/** Cor (r, g, b) e ícone de cada serviço, para o quadrado sem miniatura. */
const PROVIDER_ART: Record<Provider, { rgb: string; Icon: typeof Film }> = {
  youtube: { rgb: "255, 77, 77", Icon: Youtube },
  vimeo: { rgb: "56, 189, 248", Icon: Video },
  drive: { rgb: "52, 211, 153", Icon: HardDrive },
  arquivo: { rgb: "251, 191, 36", Icon: Film },
  instagram: { rgb: "244, 114, 182", Icon: Instagram },
  tiktok: { rgb: "34, 211, 238", Icon: Music2 },
  link: { rgb: "251, 191, 36", Icon: Link2 },
}

/* ------------------------------------------------------------------ */
/* A face do quadrado (a mesma na grade e na pré-visualização)         */
/* ------------------------------------------------------------------ */

function TileFace({ vref, title, meta, source }: { vref: VideoRef; title: string; meta: string[]; source: Tile["source"] }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [vref.thumb])
  const art = PROVIDER_ART[vref.provider]
  const thumb = vref.thumb && !broken
  const plays = playsHere(vref)
  const badge = source === "atleta"
    ? <span className="mt-badge is-atleta"><UserRound /> Do atleta</span>
    : source === "partida"
      ? <span className="mt-badge is-partida"><Clapperboard /> <span className="mt-l">Partida analisada</span><span className="mt-s">Partida</span></span>
      : <span className={`mt-badge is-${vref.provider}`}><art.Icon /> {PROVIDER_LABEL[vref.provider]}</span>
  return (
    <>
      {thumb
        // A miniatura do YouTube vem em 4:3 com faixas pretas: a classe recorta as faixas.
        ? <img className={`mt-thumb ${vref.provider === "youtube" ? "is-yt" : ""}`} src={vref.thumb ?? undefined} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} onError={() => setBroken(true)} />
        : <span className="mt-art" style={{ "--mt-c": art.rgb } as CSSProperties} aria-hidden="true"><em>{vref.host}</em></span>}
      <span className="mt-shade" aria-hidden="true" />
      {badge}
      {thumb ? (
        <span className={`mt-play ${plays ? "is-play" : ""}`} aria-hidden="true">{plays ? <Play /> : <ExternalLink />}</span>
      ) : (
        // Sem miniatura: o símbolo do serviço no centro, com o selo de tocar aqui ou abrir no site.
        <span className="mt-play is-art" style={{ "--mt-c": art.rgb } as CSSProperties} aria-hidden="true">
          <art.Icon />
          <i className="mt-play-mini">{plays ? <Play /> : <ExternalLink />}</i>
        </span>
      )}
      <span className="mt-info">
        <b>{title}</b>
        {meta.length > 0 && <small>{meta.map((m) => <span key={m}>{m}</span>)}</small>}
      </span>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Menu do quadrado (vídeos da equipe)                                 */
/* ------------------------------------------------------------------ */

function TileMenu({ title, first, canRemove, busy, onFeature, onEdit, onRemove }: {
  title: string
  first: boolean
  canRemove: boolean
  busy: boolean
  onFeature: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setAsking(false) } }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setAsking(false) } }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc) }
  }, [open])

  const run = (fn: () => void) => () => { setOpen(false); setAsking(false); fn() }

  return (
    <div ref={ref}>
      <button type="button" className="mt-menu-btn" aria-label={`Opções de ${title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Ellipsis />
      </button>
      {open && (
        <div className="mt-menu" role="menu">
          {asking ? (
            <div className="mt-menu-confirm">
              <p>Remover este vídeo dos materiais? O vídeo continua no site de origem.</p>
              <div>
                <button type="button" className="vx-btn h-8" onClick={() => setAsking(false)}>Cancelar</button>
                <button type="button" className="vx-btn op-danger h-8" disabled={busy} onClick={run(onRemove)}>Remover</button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" role="menuitem" disabled={first || busy} onClick={run(onFeature)}><ArrowUpToLine /> {first ? "Já é o primeiro" : "Destacar (primeiro)"}</button>
              <button type="button" role="menuitem" disabled={busy} onClick={run(onEdit)}><Pencil /> Editar</button>
              <button type="button" role="menuitem" className="is-danger" disabled={!canRemove || busy} title={canRemove ? undefined : "Só o administrador ou quem colocou o vídeo pode removê-lo"}
                onClick={() => setAsking(true)}><Trash2 /> Remover</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Colocar ou editar um vídeo                                          */
/* ------------------------------------------------------------------ */

function MaterialDialog({ open, material, others, playerName, onClose, onSave }: {
  open: boolean
  material: Material | null
  /** Os outros vídeos da pessoa (para não repetir). */
  others: { url: string }[]
  playerName: string
  onClose: () => void
  onSave: (value: MaterialValue) => Promise<void>
}) {
  const [draft, setDraft] = useState<MaterialDraft>(EMPTY_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft(material ? draftOf(material) : EMPTY_DRAFT)
    setError(null)
    setBusy(false)
  }, [open, material])

  const vref = videoRef(draft.url)
  const set = (patch: Partial<MaterialDraft>) => { setDraft((d) => ({ ...d, ...patch })); setError(null) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const checked = checkDraft(draft, others)
    if ("error" in checked) {
      setError(checked.error)
      return
    }
    setBusy(true)
    try {
      await onSave(checked.value)
      onClose()
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !busy) onClose() }}>
      <DialogContent className="vx-portal mt-dialog max-w-2xl p-0" aria-describedby={undefined}>
        <form onSubmit={(e) => void submit(e)} className="contents">
          <div className="mt-dialog-head">
            <DialogTitle>{material ? "Editar vídeo" : "Colocar vídeo"}</DialogTitle>
            <p>{material ? `Os materiais de ${playerName}.` : `Um quadrado novo nos materiais de ${playerName}. YouTube, Google Drive e Vimeo tocam aqui na VOXEN; Instagram, TikTok e outros sites abrem no site de origem.`}</p>
          </div>

          <div className="mt-dialog-body">
            <div className="mt-form">
              <label className="mt-field">
                <span>Link do vídeo</span>
                <input className="vx-input" value={draft.url} autoFocus inputMode="url" autoComplete="off" spellCheck={false}
                  placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => set({ url: e.target.value })} aria-label="Link do vídeo" />
                <small>{vref ? `${PROVIDER_LABEL[vref.provider]} · ${playsHere(vref) ? "toca aqui na VOXEN" : "abre no site de origem"}` : "Cole o endereço completo, começando com https://"}</small>
              </label>

              <div className="mt-field">
                <span>Tipo</span>
                <div className="mt-cats" role="radiogroup" aria-label="Tipo do vídeo">
                  {CATEGORIES.map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={draft.category === c} className={`vx-chip h-8 ${draft.category === c ? "is-on" : ""}`} onClick={() => set({ category: c })}>
                      {CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-field">
                <span>Título (opcional)</span>
                <input className="vx-input" value={draft.title} maxLength={80} placeholder={`Ex.: ${CATEGORY_LABEL[draft.category]} · ${new Date().getFullYear()}`}
                  onChange={(e) => set({ title: e.target.value })} aria-label="Título do vídeo" />
              </label>

              <label className="mt-field">
                <span>Data do vídeo (opcional)</span>
                <input className="vx-input" type="date" value={draft.recordedOn} min="2000-01-01" onChange={(e) => set({ recordedOn: e.target.value })} aria-label="Data do vídeo" />
              </label>
            </div>

            <div>
              <div className="mt-preview" aria-hidden="true">
                {vref ? (
                  <span className="mt-tile">
                    <TileFace vref={vref} title={draft.title.trim() || CATEGORY_LABEL[draft.category]} meta={[CATEGORY_LABEL[draft.category]]} source="equipe" />
                  </span>
                ) : (
                  <span className="mt-slot is-next"><span className="mt-slot-icon"><Clapperboard /></span><b>Pré-visualização</b><small>Aparece ao colar o link</small></span>
                )}
              </div>
              <p className="mt-preview-note">Assim fica o quadrado.</p>
            </div>
          </div>

          <div className="mt-dialog-foot">
            {error && <p className="mt-error" role="alert">{error}</p>}
            <button type="button" className="vx-btn h-10" onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" className="vx-btn vx-btn--gold h-10" disabled={busy}>
              {busy ? <><Loader2 className="op-spin" /> Salvando...</> : material ? "Salvar" : <><Plus /> Colocar vídeo</>}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* O player                                                            */
/* ------------------------------------------------------------------ */

function Lightbox({ tiles, index, memberId, onIndex, onClose }: {
  /** Só os quadrados que tocam aqui, na ordem da grade. */
  tiles: Tile[]
  index: number
  memberId: string | null
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const tile = tiles[index]
  const n = tiles.length
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex])

  useEffect(() => {
    if (n < 2) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest("input, textarea")) return
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, n])

  if (!tile?.ref.embed) return null
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="vx-portal mt-lightbox max-w-[min(92vw,1040px)] p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{tile.title}</DialogTitle>
        <div className="mt-lb">
          <div className="mt-lb-frame">
            {tile.ref.provider === "arquivo"
              ? <video key={tile.key} src={tile.ref.embed} controls autoPlay playsInline preload="metadata" />
              : <iframe key={tile.key} src={tile.ref.embed} title={tile.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          </div>
          {n > 1 && (
            <>
              <button type="button" className="mt-lb-nav is-prev" onClick={() => go(-1)} aria-label="Vídeo anterior"><ChevronLeft /></button>
              <button type="button" className="mt-lb-nav is-next" onClick={() => go(1)} aria-label="Próximo vídeo"><ChevronRight /></button>
            </>
          )}
          <div className="mt-lb-bar">
            <div className="min-w-0">
              <h3 className="truncate">{tile.title}</h3>
              <p>{[SOURCE_LABEL[tile.source], ...tile.meta].map((m) => <span key={m}>{m}</span>)}</p>
            </div>
            <div className="mt-lb-actions">
              {n > 1 && <span className="mt-lb-count self-center">{index + 1} de {n}</span>}
              {tile.matchId && memberId && (
                <Link className="vx-btn h-9" to={`/voxen/membros/${memberId}/partidas/${tile.matchId}`} onClick={onClose}><Clapperboard /> Abrir a análise</Link>
              )}
              <a className="vx-btn h-9" href={tile.ref.url} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir no {PROVIDER_LABEL[tile.ref.provider]}</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* A seção                                                             */
/* ------------------------------------------------------------------ */

const FILTERS: { key: TileFilter; label: string }[] = [
  { key: "todos", label: "Todos" }, { key: "equipe", label: "Da equipe" }, { key: "atleta", label: "Do atleta" }, { key: "partida", label: "Partidas" },
]

/**
 * Materiais (ficha do jogador): os vídeos dele em quadrados. Os que a equipe colocou vêm primeiro (na ordem dela),
 * depois as partidas analisadas e os jogos que o atleta enviou pela área dele. Os quadrados livres esperam o próximo
 * vídeo. YouTube, Drive, Vimeo e arquivo de vídeo tocam aqui; os outros sites abrem em outra aba.
 */
export function MaterialsSection({ p }: { p: Player }) {
  const { demo, canScout, canAdmin } = useVoxen()
  const { user } = useAuth()
  const { toast } = useToast()
  const api = useMediaApi(demo)
  const keys = useMemo(() => keysOf(p), [p])
  const keySig = keys.join(",")
  const mats = useLoad<Material[], MediaApi>(api, (a) => a.materials(keys), [keySig])
  const vids = useLoad<MemberVideos, MediaApi>(api, (a) => (p.memberId ? a.memberVideos(p.memberId) : Promise.resolve(NO_VIDEOS)), [p.memberId])
  const [filter, setFilter] = useState<TileFilter>("todos")
  const [editing, setEditing] = useState<Material | "new" | null>(null)
  const [playing, setPlaying] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const me = user?.id ?? api?.me ?? null

  const list = useMemo(() => mats.data ?? [], [mats.data])
  const all = useMemo(() => buildTiles(list, vids.data?.matches, vids.data?.sent), [list, vids.data])
  const tiles = useMemo(() => filterTiles(all, filter), [all, filter])
  const playable = useMemo(() => tiles.filter((t) => playsHere(t.ref)), [tiles])
  const counts = useMemo(() => ({
    todos: all.length, equipe: all.filter((t) => t.source === "equipe").length,
    atleta: all.filter((t) => t.source === "atleta").length, partida: all.filter((t) => t.source === "partida").length,
  }), [all])

  const missing = mats.error instanceof MediaSetupMissingError
  const loading = !mats.data && !mats.error
  const canAdd = canScout && !missing && (filter === "todos" || filter === "equipe")
  const slots = slotCount(tiles.length, canAdd)
  const firstName = p.name.trim().split(/\s+/)[0] || p.name
  const mixed = counts.atleta + counts.partida > 0

  // A lista mudou de tamanho (filtro, remoção): o player não aponta para um vídeo que sumiu.
  useEffect(() => { if (playing !== null && playing >= playable.length) setPlaying(null) }, [playing, playable.length])

  const open = (t: Tile) => {
    if (playsHere(t.ref)) setPlaying(playable.findIndex((x) => x.key === t.key))
    else window.open(t.ref.url, "_blank", "noopener,noreferrer")
  }

  const save = async (value: MaterialValue) => {
    if (!api) return
    if (editing && editing !== "new") {
      const saved = await api.updateMaterial(editing.id, value)
      mats.set((d) => (d ? d.map((m) => (m.id === saved.id ? saved : m)) : d))
      toast({ title: "Vídeo atualizado", description: saved.title ?? CATEGORY_LABEL[saved.category] })
    } else {
      const saved = await api.addMaterial(p.key, value, nextPosition(list))
      mats.set((d) => [...(d ?? []), saved])
      if (filter !== "todos" && filter !== "equipe") setFilter("todos")
      toast({ title: "Vídeo colocado nos materiais", description: `${saved.title ?? CATEGORY_LABEL[saved.category]} · ${firstName}` })
    }
  }

  const feature = async (m: Material) => {
    if (!api) return
    setBusy(true)
    try {
      const saved = await api.updateMaterial(m.id, { position: frontPosition(list) })
      mats.set((d) => (d ? d.map((x) => (x.id === saved.id ? saved : x)) : d))
      toast({ title: "Vídeo em destaque", description: "Agora ele é o primeiro quadrado." })
    } catch (e) {
      toast({ title: "Não foi possível destacar", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (m: Material) => {
    if (!api) return
    setBusy(true)
    try {
      await api.removeMaterial(m.id)
      mats.set((d) => (d ? d.filter((x) => x.id !== m.id) : d))
      toast({ title: "Vídeo removido dos materiais" })
    } catch (e) {
      toast({ title: "Não foi possível remover", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const firstStaff = list.length ? [...list].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))[0].id : null

  return (
    <section className="vx-card mb-[18px]" aria-label="Materiais">
      <CardHead
        title={<span className="inline-flex items-center gap-2"><Clapperboard className="h-4 w-4 text-amber-300" /> Materiais</span>}
        sub={`Os vídeos de ${firstName}: o que a equipe juntou${p.memberId ? ", os jogos que ele enviou e as partidas analisadas" : ""}.`}
        actions={canAdd && api ? (
          <div className="mt-head-actions vx-no-print">
            <button type="button" className="vx-btn vx-btn--gold" onClick={() => setEditing("new")}><Plus /> Colocar vídeo</button>
          </div>
        ) : undefined}
      />

      {missing ? (
        <p className="mt-error">Falta ativar os materiais no banco de dados (<code>{MEDIA_MIGRATION}</code>).</p>
      ) : mats.error ? (
        <p className="mt-error">{mats.error.message}</p>
      ) : (
        <>
          {mixed && (
            <div className="mt-filters" role="tablist" aria-label="Filtrar os materiais">
              {FILTERS.filter((f) => f.key === "todos" || counts[f.key] > 0).map((f) => (
                <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={`vx-chip h-7 ${filter === f.key ? "is-on" : ""}`} onClick={() => setFilter(f.key)}>
                  {f.label} <span className="tnum text-zinc-500">{counts[f.key]}</span>
                </button>
              ))}
            </div>
          )}
          {!loading && (
            <p className="mt-summary">
              {all.length
                ? <><strong className="tnum">{all.length}</strong> {all.length === 1 ? "vídeo" : "vídeos"}{canAdd ? <> · <span className="tnum">{slots - tiles.length}</span> {slots - tiles.length === 1 ? "quadrado livre" : "quadrados livres"}</> : null}</>
                : canAdd ? `Nenhum vídeo ainda. Cada quadrado espera um vídeo de ${firstName}: cole o link do YouTube, do Drive ou de outro site.` : "Nenhum vídeo ainda."}
            </p>
          )}

          <div className="mt-grid">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <div key={i} className="mt-cell" style={{ "--i": i } as CSSProperties}><span className="mt-skel" /></div>)
              : Array.from({ length: slots }, (_, i) => {
                  const t = tiles[i]
                  if (t) {
                    const m = t.material
                    return (
                      <div key={t.key} className="mt-cell" style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                        <button type="button" className="mt-tile" onClick={() => open(t)}
                          aria-label={`${playsHere(t.ref) ? "Assistir" : "Abrir"}: ${t.title}${t.meta.length ? ` (${t.meta.join(", ")})` : ""}`}>
                          <TileFace vref={t.ref} title={t.title} meta={t.meta} source={t.source} />
                        </button>
                        {m && canScout && (
                          <TileMenu title={t.title} first={m.id === firstStaff} busy={busy} canRemove={canAdmin || (Boolean(me) && m.createdBy === me)}
                            onFeature={() => void feature(m)} onEdit={() => setEditing(m)} onRemove={() => void remove(m)} />
                        )}
                      </div>
                    )
                  }
                  const next = canAdd && i === tiles.length
                  return (
                    <div key={`livre-${i}`} className="mt-cell" style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                      {canAdd ? (
                        <button type="button" className={`mt-slot ${next ? "is-next" : ""}`} onClick={() => setEditing("new")} aria-label={`Colocar um vídeo no quadrado ${i + 1}`}>
                          <span className="mt-slot-icon">{next ? <Plus /> : <Clapperboard />}</span>
                          <b>Colocar vídeo</b>
                          <small>YouTube, Drive ou link</small>
                        </button>
                      ) : (
                        <span className="mt-slot" aria-hidden="true"><span className="mt-slot-icon"><Clapperboard /></span></span>
                      )}
                    </div>
                  )
                })}
          </div>
        </>
      )}

      <MaterialDialog open={editing !== null} material={editing && editing !== "new" ? editing : null} playerName={firstName}
        others={list.filter((m) => !(editing && editing !== "new" && m.id === editing.id))}
        onClose={() => setEditing(null)} onSave={save} />

      {playing !== null && playable[playing] && (
        <Lightbox tiles={playable} index={playing} memberId={p.memberId} onIndex={setPlaying} onClose={() => setPlaying(null)} />
      )}
    </section>
  )
}
