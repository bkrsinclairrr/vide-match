import { Play } from "lucide-react"
import { parseVideo, videoThumb, type Match } from "../model"
import { PitchLines } from "./Field"

/**
 * Capa da partida: miniatura do YouTube, o primeiro quadro do arquivo de
 * vídeo, ou o campo estilizado quando não há vídeo.
 */
export function MatchThumb({ match, big = false }: { match: Match; big?: boolean }) {
  const src = parseVideo(match.videoUrl)
  const thumb = videoThumb(src)
  return (
    <div className={`mb-thumb ${big ? "is-big" : ""}`}>
      {thumb && <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />}
      {src?.kind === "file" && <video src={`${src.url}#t=1`} preload="metadata" muted playsInline aria-hidden="true" tabIndex={-1} />}
      {!src && <div className="mb-field mb-thumb-field"><PitchLines /></div>}
      <span className="mb-thumb-shade" />
      {src && <span className="mb-thumb-play"><Play /></span>}
      {!src && <span className="mb-thumb-badge">Análise sem vídeo</span>}
    </div>
  )
}
