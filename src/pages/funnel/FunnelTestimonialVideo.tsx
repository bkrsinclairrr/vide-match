import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

/**
 * Player de depoimento da /avaliacao. Exclusivo desta página.
 *
 * O vídeo não pode ser adiantado porque não existe controle que faça isso: sem
 * barra de progresso, sem capítulos, sem atalhos de teclado, sem PiP e com os
 * cliques interceptados antes de chegarem ao player.
 *
 * Não tente reforçar isso vigiando `currentTime` e empurrando o relógio para
 * trás: em conexão instável o buffering avança o tempo sozinho, a correção
 * vira um seek, o seek provoca mais buffering e o vídeo trava em loop.
 */

// Ponto único de troca do vídeo.
const WISTIA_MEDIA_ID = "pr8vrpryrr"

const SWATCH_URL = `https://fast.wistia.com/embed/medias/${WISTIA_MEDIA_ID}/swatch`

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

    const [started, setStarted] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [volume, setVolume] = useState(1)

    useEffect(loadWistiaScripts, [])

    // Espelha o estado do player na UI. Ler a cada frame evita depender dos
    // nomes de evento do Wistia, que variam entre versões do web component.
    useEffect(() => {
        let frame = 0
        let hardened: HTMLVideoElement | null = null
        let chaptersHidden = false

        const tick = () => {
            frame = requestAnimationFrame(tick)

            if (!chaptersHidden && playerRef.current) {
                hideChaptersControl(playerRef.current)
                chaptersHidden = !!playerRef.current.shadowRoot
            }

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
            role="group"
            aria-label="Depoimento em vídeo"
            className="relative mx-auto w-full max-w-[22rem] sm:max-w-md overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-medium"
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
                    className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                    <span
                        className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-golden text-accent-foreground shadow-glow transition-all duration-300 motion-reduce:transition-none ${
                            showPlayOverlay
                                ? "scale-100 opacity-100"
                                : "scale-75 opacity-0"
                        }`}
                    >
                        <Play className="ml-0.5 h-6 w-6 fill-current sm:h-7 sm:w-7" />
                    </span>
                </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 border-t border-border bg-card px-2 py-1.5">
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pausar" : "Reproduzir"}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/25 text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                </button>

                <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Ativar som" : "Desativar som"}
                    aria-pressed={muted}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                    {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="h-11 w-16 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-transparent px-1 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-foreground/20 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-foreground/20 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent"
                />

                <span className="shrink-0 px-1 text-[10px] font-medium text-muted-foreground sm:text-xs">
                    Depoimento
                </span>
            </div>
        </div>
    )
}
