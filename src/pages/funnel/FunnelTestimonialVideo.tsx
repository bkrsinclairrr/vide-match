import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

/**
 * Player de depoimento da /avaliacao. Exclusivo desta página.
 *
 * O vídeo não pode ser adiantado: o controle de progresso do Wistia fica
 * desligado, a UI abaixo não expõe seek e um laço de vigilância devolve o
 * relógio para trás caso algum caminho residual (API, atalho, retomada de
 * sessão) empurre o tempo para frente.
 */

// Ponto único de troca do vídeo.
const WISTIA_MEDIA_ID = "pr8vrpryrr"

const SWATCH_URL = `https://fast.wistia.com/embed/medias/${WISTIA_MEDIA_ID}/swatch`

// Buffering e variação de frame movem o relógio alguns décimos sem que tenha
// havido salto, então só tempos acima desta folga contam como seek.
const SEEK_TOLERANCE_SECONDS = 0.75

type WistiaPlayer = HTMLElement & {
    play?: () => void
    pause?: () => void
    paused?: boolean
    currentTime?: number
    volume?: number
    muted?: boolean
}

/**
 * O <wistia-player> responde `paused: false` desde o carregamento, antes de
 * qualquer reprodução, então perguntar a ele se está tocando esconderia o
 * botão de play inicial. O <video> que ele monta por dentro responde certo, e
 * é sobre esse elemento que a UI abaixo lê e escreve.
 */
function getMedia(host: WistiaPlayer | null): HTMLVideoElement | null {
    if (!host) return null
    return (
        host.querySelector("video") ??
        (host.shadowRoot?.querySelector("video") as HTMLVideoElement | null)
    )
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "wistia-player": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                "media-id"?: string
                aspect?: string
                playbar?: string
                "big-play-button"?: string
                "small-play-button"?: string
                "volume-control"?: string
                "settings-control"?: string
                "fullscreen-button"?: string
                "playbackrate-control"?: string
                "quality-control"?: string
                "captions-control"?: string
                "chapters-control"?: string
                "keyboard-shortcuts"?: string
                "wistia-branding"?: string
                class?: string
                resumable?: string
                preload?: string
                "do-not-track"?: string
            }
        }
    }
}

function loadWistiaScripts() {
    const sources: { src: string; module: boolean }[] = [
        { src: "https://fast.wistia.com/player.js", module: false },
        { src: `https://fast.wistia.com/embed/${WISTIA_MEDIA_ID}.js`, module: true },
    ]

    for (const { src, module } of sources) {
        if (document.querySelector(`script[src="${src}"]`)) continue
        const script = document.createElement("script")
        script.src = src
        script.async = true
        if (module) script.type = "module"
        document.head.appendChild(script)
    }
}

/** Fecha as portas de seek que o elemento <video> interno abriria sozinho. */
function hardenNativeVideo(video: HTMLVideoElement) {
    video.disablePictureInPicture = true
    video.removeAttribute("controls")
    video.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback")
}

/**
 * O botão de capítulos salta para pontos do vídeo — é seek com outro nome — e
 * o Wistia o mantém mesmo com `chapters-control="false"`. Ele vive no shadow
 * DOM, fora do alcance da folha de estilo da página, então a regra entra por
 * dentro. O logo do Wistia ao lado é um <a> e fica onde está.
 */
function hideChaptersControl(host: HTMLElement) {
    const root = host.shadowRoot
    if (!root || root.querySelector("style[data-zyron-no-seek]")) return

    const style = document.createElement("style")
    style.setAttribute("data-zyron-no-seek", "")
    style.textContent = ".w-bottom-bar-right button { display: none !important; }"
    root.appendChild(style)
}

export default function FunnelTestimonialVideo() {
    const playerRef = useRef<WistiaPlayer>(null)
    const maxWatchedRef = useRef(0)

    const [started, setStarted] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [volume, setVolume] = useState(1)

    useEffect(loadWistiaScripts, [])

    // Sincroniza a UI lendo o player e reverte qualquer avanço de tempo. Ler a
    // cada frame mantém a trava eficaz sem depender dos nomes de evento do
    // Wistia, que variam entre versões do web component.
    useEffect(() => {
        let frame = 0
        let hardened: HTMLVideoElement | null = null

        const tick = () => {
            frame = requestAnimationFrame(tick)

            if (playerRef.current) hideChaptersControl(playerRef.current)

            const media = getMedia(playerRef.current)
            if (!media) {
                // Sem o <video> não há estado confiável; o poster e o play
                // grande continuam à mostra.
                setPlaying(false)
                return
            }

            if (hardened !== media) {
                hardenNativeVideo(media)
                hardened = media
            }

            if (media.currentTime > maxWatchedRef.current + SEEK_TOLERANCE_SECONDS) {
                media.currentTime = maxWatchedRef.current
            } else if (media.currentTime > maxWatchedRef.current) {
                maxWatchedRef.current = media.currentTime
            }

            setPlaying(!media.paused)
            setMuted(media.muted)
            setVolume(media.volume)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [])

    const togglePlay = useCallback(() => {
        const media = getMedia(playerRef.current)
        if (media) {
            if (media.paused) {
                void media.play()
                setStarted(true)
            } else {
                media.pause()
            }
            return
        }

        playerRef.current?.play?.()
        setStarted(true)
    }, [])

    const toggleMute = useCallback(() => {
        const media = getMedia(playerRef.current)
        if (media) media.muted = !media.muted
    }, [])

    const changeVolume = useCallback((next: number) => {
        const media = getMedia(playerRef.current)
        if (!media) return
        media.volume = next
        if (next > 0) media.muted = false
        setVolume(next)
    }, [])

    const showPlayOverlay = !playing

    return (
        <div
            data-anim="up"
            className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.045] transition-all duration-300 hover:border-amber-400/30"
        >
            <div
                className="relative w-full bg-black/40"
                style={{
                    aspectRatio: "16 / 9",
                    backgroundImage: started ? undefined : `url('${SWATCH_URL}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <wistia-player
                    ref={playerRef}
                    media-id={WISTIA_MEDIA_ID}
                    aspect="1.7777777777777777"
                    playbar="false"
                    big-play-button="false"
                    small-play-button="false"
                    volume-control="false"
                    settings-control="false"
                    fullscreen-button="false"
                    playbackrate-control="false"
                    quality-control="false"
                    captions-control="false"
                    chapters-control="false"
                    keyboard-shortcuts="false"
                    wistia-branding="false"
                    resumable="false"
                    preload="metadata"
                    do-not-track="true"
                    class="block h-full w-full"
                />

                {/* Captura o clique antes do player: sem duplo-toque, sem menu
                    de contexto e sem gesto que devolva o seek nativo. */}
                <button
                    type="button"
                    onClick={togglePlay}
                    onDoubleClick={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={playing ? "Pausar depoimento" : "Reproduzir depoimento"}
                    className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                >
                    <span
                        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-black shadow-[0_0_40px_-6px_rgba(251,191,36,0.85)] transition-all duration-300 ${
                            showPlayOverlay
                                ? "h-20 w-20 scale-100 opacity-100 md:h-24 md:w-24"
                                : "h-20 w-20 scale-75 opacity-0 md:h-24 md:w-24"
                        }`}
                    >
                        <Play className="ml-1 h-8 w-8 fill-current md:h-10 md:w-10" />
                    </span>
                </button>
            </div>

            <div className="flex items-center gap-3 border-t border-foreground/10 bg-background/60 px-4 py-3">
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pausar" : "Reproduzir"}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/14 border border-amber-400/25 text-amber-400 transition-colors hover:bg-amber-500/22"
                >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>

                <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Ativar som" : "Desativar som"}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-foreground/10 bg-foreground/[0.04] text-foreground/75 transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
                >
                    {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="h-1 w-28 max-w-[40%] cursor-pointer appearance-none rounded-full bg-foreground/15 accent-amber-400 md:w-36 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                />

                <span className="ml-auto text-[11px] font-medium uppercase tracking-widest text-foreground/45">
                    Depoimento
                </span>
            </div>
        </div>
    )
}
