import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ExternalLink, Film, Play } from "lucide-react"
import {
  GROUPS, actionInfo, eventTone, formatClock, parseVideo, type ActionGroup, type MatchEvent, type VideoSource,
} from "../model"
import { PitchLines } from "./Field"

/* ------------------------------------------------------------------ */
/* Player (YouTube pela IFrame API, arquivo pelo <video>, Vimeo/Drive) */
/* ------------------------------------------------------------------ */

export type PlayerApi = {
  /** O tempo atual pode ser lido (YouTube e arquivo). Vimeo e Drive só exibem. */
  canTrack: boolean
  getTime(): number
  getDuration(): number | null
  /** Vai para `t` segundos; `play: false` mantém o vídeo pausado. */
  seek(t: number, play?: boolean): void
  togglePlay(): void
  setRate(rate: number): void
}

type YTPlayer = {
  getCurrentTime(): number
  getDuration(): number
  seekTo(t: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  getPlayerState(): number
  setPlaybackRate(r: number): void
  destroy(): void
}

type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytPromise: Promise<YTNamespace> | null = null

function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!ytPromise) {
    ytPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        if (window.YT) resolve(window.YT)
      }
      const s = document.createElement("script")
      s.src = "https://www.youtube.com/iframe_api"
      s.async = true
      s.onerror = () => {
        ytPromise = null
        reject(new Error("Não foi possível carregar o player do YouTube."))
      }
      document.head.appendChild(s)
    })
  }
  return ytPromise
}

type PlayerProps = {
  url: string | null
  onTime?: (t: number) => void
  onDuration?: (d: number) => void
  onPlaying?: (playing: boolean) => void
  title?: string
}

const NOOP_API: PlayerApi = { canTrack: false, getTime: () => 0, getDuration: () => null, seek: () => undefined, togglePlay: () => undefined, setRate: () => undefined }

const YouTubeFrame = forwardRef<PlayerApi, { id: string } & PlayerProps>(function YouTubeFrame({ id, onTime, onDuration, onPlaying, title }, ref) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const playingRef = useRef(onPlaying)
  playingRef.current = onPlaying
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    const mount = document.createElement("div")
    host.appendChild(mount)
    loadYouTube()
      .then((YT) => {
        if (disposed) return
        playerRef.current = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: id,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
          events: {
            onReady: () => {
              const d = playerRef.current?.getDuration()
              if (d) onDuration?.(d)
            },
            onStateChange: (e: { data: number }) => playingRef.current?.(e.data === 1),
          },
        })
      })
      .catch(() => setFailed(true))
    return () => {
      disposed = true
      try {
        playerRef.current?.destroy()
      } catch {
        /* player já removido */
      }
      playerRef.current = null
      host.innerHTML = ""
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const iv = window.setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      onTime?.(p.getCurrentTime())
      const d = p.getDuration?.()
      if (d) onDuration?.(d)
    }, 250)
    return () => window.clearInterval(iv)
  }, [onTime, onDuration])

  useImperativeHandle(ref, () => ({
    canTrack: true,
    getTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    getDuration: () => playerRef.current?.getDuration?.() || null,
    seek: (t, play = true) => {
      const p = playerRef.current
      if (!p) return
      p.seekTo(Math.max(0, t), true)
      if (play) p.playVideo()
    },
    togglePlay: () => {
      const p = playerRef.current
      if (!p) return
      if (p.getPlayerState() === 1) p.pauseVideo()
      else p.playVideo()
    },
    setRate: (r) => playerRef.current?.setPlaybackRate?.(r),
  }), [])

  if (failed) {
    return (
      <div className="mb-video-fallback">
        <Film className="h-7 w-7 text-amber-300" />
        <p>O player do YouTube não carregou nesta rede.</p>
        <a className="vx-btn" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir no YouTube</a>
      </div>
    )
  }
  return <div ref={hostRef} className="mb-video-host" title={title} />
})

const FileVideo = forwardRef<PlayerApi, { url: string } & PlayerProps>(function FileVideo({ url, onTime, onDuration, onPlaying, title }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useImperativeHandle(ref, () => ({
    canTrack: true,
    getTime: () => videoRef.current?.currentTime ?? 0,
    getDuration: () => (videoRef.current && Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : null),
    seek: (t, play = true) => {
      const v = videoRef.current
      if (!v) return
      v.currentTime = Math.max(0, t)
      if (play) void v.play().catch(() => undefined)
    },
    togglePlay: () => {
      const v = videoRef.current
      if (!v) return
      if (v.paused) void v.play().catch(() => undefined)
      else v.pause()
    },
    setRate: (r) => {
      if (videoRef.current) videoRef.current.playbackRate = r
    },
  }), [])
  return (
    <video
      ref={videoRef}
      className="mb-video-el"
      src={url}
      controls
      playsInline
      preload="metadata"
      title={title}
      onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && onDuration?.(e.currentTarget.duration)}
      onPlay={() => onPlaying?.(true)}
      onPause={() => onPlaying?.(false)}
    />
  )
})

function EmbedOnly({ src, title }: { src: Extract<VideoSource, { kind: "vimeo" | "drive" }>; title?: string }) {
  const url = src.kind === "vimeo" ? `https://player.vimeo.com/video/${src.id}?dnt=1` : `https://drive.google.com/file/d/${src.id}/preview`
  return <iframe className="mb-video-el" src={url} title={title ?? "Vídeo da partida"} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
}

/** Player da partida. Sem vídeo, mostra o campo com um aviso. */
export const VideoPlayer = forwardRef<PlayerApi, PlayerProps>(function VideoPlayer(props, ref) {
  const src = useMemo(() => parseVideo(props.url), [props.url])
  const inner = useRef<PlayerApi>(null)
  // Delega na hora da chamada: o player de dentro troca quando o vídeo muda.
  useImperativeHandle(ref, () => ({
    get canTrack() { return inner.current?.canTrack ?? false },
    getTime: () => (inner.current ?? NOOP_API).getTime(),
    getDuration: () => (inner.current ?? NOOP_API).getDuration(),
    seek: (t, play) => (inner.current ?? NOOP_API).seek(t, play),
    togglePlay: () => (inner.current ?? NOOP_API).togglePlay(),
    setRate: (r) => (inner.current ?? NOOP_API).setRate(r),
  }), [])

  return (
    <div className="mb-video">
      {src?.kind === "youtube" && <YouTubeFrame ref={inner} id={src.id} {...props} />}
      {src?.kind === "file" && <FileVideo ref={inner} url={src.url} {...props} />}
      {(src?.kind === "vimeo" || src?.kind === "drive") && <EmbedOnly src={src} title={props.title} />}
      {!src && (
        <div className="mb-video-empty">
          <div className="mb-field mb-field--ghost"><PitchLines /></div>
          <div className="mb-video-empty-text">
            <span className="vx-empty-icon"><Film className="h-6 w-6" /></span>
            <strong>{props.url ? "Link de vídeo não reconhecido" : "Vídeo ainda não enviado"}</strong>
            <span>{props.url ? "Use um link do YouTube ou de um arquivo .mp4." : "As métricas desta partida vêm das ações marcadas pela equipe."}</span>
          </div>
        </div>
      )}
    </div>
  )
})

/* ------------------------------------------------------------------ */
/* Linha do tempo e lista de lances                                    */
/* ------------------------------------------------------------------ */

/** Ação "atual": a última que começou até 4 s antes do tempo do vídeo. */
export function currentEventId(events: MatchEvent[], time: number | null) {
  if (time === null) return null
  let found: MatchEvent | null = null
  for (const e of events) {
    if (e.t <= time + 0.25) found = e
    else break
  }
  return found && time - found.t < 4 ? found.id : null
}

export function EventTimeline({
  events, duration, time, onSeek,
}: {
  events: MatchEvent[]
  duration: number | null
  time: number | null
  onSeek?: (t: number) => void
}) {
  const last = events.at(-1)?.t ?? 0
  const span = duration ? Math.max(duration, last) : Math.max(last + 5, 10)
  const trackRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const timeAt = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * span
  }, [span])

  return (
    <div className="mb-timeline">
      <div
        ref={trackRef}
        className={`mb-timeline-track ${onSeek ? "is-seekable" : ""}`}
        onPointerMove={(e) => setHover(timeAt(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => onSeek?.(timeAt(e.clientX))}
        role="presentation"
      >
        {events.map((e, i) => {
          const tone = eventTone(e)
          return (
            <span
              key={e.id}
              className={`mb-tl-mark is-${tone}`}
              style={{ left: `${(e.t / span) * 100}%`, background: GROUPS[actionInfo(e.action).group].color, animationDelay: `${Math.min(i, 80) * 8}ms` }}
              title={`${formatClock(e.t)} · ${actionInfo(e.action).label}${tone === "fail" ? " (errada)" : ""}`}
            />
          )
        })}
        {time !== null && <span className="mb-tl-head" style={{ left: `${Math.min(100, (time / span) * 100)}%` }} />}
        {hover !== null && <span className="mb-tl-hover" style={{ left: `${(hover / span) * 100}%` }}>{formatClock(hover)}</span>}
      </div>
      <div className="mb-timeline-scale">
        <span>0:00</span>
        <span>{formatClock(span / 2)}</span>
        <span>{formatClock(span)}</span>
      </div>
    </div>
  )
}

const GROUP_FILTERS: { key: ActionGroup | "todas"; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "ofensivo", label: "Ofensivas" },
  { key: "construcao", label: "Construção" },
  { key: "defensivo", label: "Defensivas" },
  { key: "disciplina", label: "Disciplina" },
]

export function EventList({
  events, time, onSeek, onDelete, maxHeight = 420,
}: {
  events: MatchEvent[]
  time: number | null
  onSeek?: (t: number) => void
  onDelete?: (e: MatchEvent) => void
  maxHeight?: number
}) {
  const [group, setGroup] = useState<ActionGroup | "todas">("todas")
  const list = group === "todas" ? events : events.filter((e) => actionInfo(e.action).group === group)
  const active = currentEventId(events, time)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!active) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-event="${active}"]`)
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [active])

  return (
    <div className="mb-events">
      <div className="vx-chips mb-3">
        {GROUP_FILTERS.map((g) => {
          const count = g.key === "todas" ? events.length : events.filter((e) => actionInfo(e.action).group === g.key).length
          if (!count && g.key !== "todas") return null
          return (
            <button key={g.key} type="button" className={`vx-chip h-7 ${group === g.key ? "is-on" : ""}`} onClick={() => setGroup(g.key)}>
              {g.key !== "todas" && <i className="mb-swatch" style={{ background: GROUPS[g.key].color }} />}
              {g.label} <span className="tnum text-zinc-500">{count}</span>
            </button>
          )
        })}
      </div>
      <ol ref={listRef} className="mb-event-list" style={{ maxHeight }} data-lenis-prevent>
        {list.map((e) => {
          const info = actionInfo(e.action)
          const tone = eventTone(e)
          return (
            <li key={e.id} data-event={e.id} className={`mb-event ${active === e.id ? "is-active" : ""}`}>
              <button type="button" className="mb-event-main" onClick={() => onSeek?.(e.t)} disabled={!onSeek}>
                <span className="mb-event-time tnum">{formatClock(e.t)}</span>
                <i className="mb-swatch" style={{ background: GROUPS[info.group].color }} />
                <span className="mb-event-label">{info.label}</span>
                {info.outcome && (
                  <span className={`mb-event-tag is-${tone}`}>{tone === "fail" ? info.failLabel ?? "Errado" : info.okLabel ?? "Certo"}</span>
                )}
                {onSeek && <Play className="mb-event-play" />}
              </button>
              {onDelete && (
                <button type="button" className="mb-event-del" onClick={() => onDelete(e)} aria-label={`Apagar ${info.label} em ${formatClock(e.t)}`}>×</button>
              )}
            </li>
          )
        })}
        {!list.length && <li className="py-6 text-center text-[12.5px] text-zinc-500">Nenhuma ação{group !== "todas" ? " neste grupo" : " marcada ainda"}.</li>}
      </ol>
    </div>
  )
}
