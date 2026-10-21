import { useState } from "react"
import type { ClubRef, DeadlineTone } from "../scoutLayer"

/** Iniciais do clube (até 3 letras), para quando não há escudo nenhum. */
function monogram(name: string) {
  const words = name.replace(/\b(fc|ec|sc|ac|esporte|clube|futebol|de|da|do)\b/gi, " ").trim().split(/[\s-]+/).filter(Boolean)
  return (words.length > 1 ? words.slice(0, 3).map((w) => w[0]) : [...(words[0] ?? "?")].slice(0, 3)).join("").toUpperCase()
}

/**
 * Escudo do clube: a imagem que a equipe enviou; sem ela, o escudo do catálogo (emoji);
 * sem nenhum, as iniciais na cor do clube. `pop` anima a entrada.
 */
export function ClubCrest({ club, size = 46, pop = false }: { club: Pick<ClubRef, "name" | "crestUrl" | "emblem" | "color">; size?: number; pop?: boolean }) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.3), fontSize: Math.round(size * 0.34) }
  const cls = `gm-club-logo cc-crest ${pop ? "cc-pop" : ""}`
  if (club.crestUrl && !failed) {
    return (
      <span className={`${cls} cc-img`} style={style}>
        <img src={club.crestUrl} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </span>
    )
  }
  if (club.emblem) return <span className={cls} style={style} aria-hidden="true">{club.emblem}</span>
  return (
    <span className={`${cls} cc-mono`} style={{ ...style, fontSize: Math.round(size * 0.3), color: club.color ?? "#fde68a", borderColor: club.color ? `${club.color}66` : undefined }} aria-hidden="true">
      {monogram(club.name)}
    </span>
  )
}

/** Selo do prazo: dias que faltam na cor da urgência. */
export function DeadlineChip({ tone, label }: { tone: DeadlineTone; label: string }) {
  return <span className={`cc-deadline is-${tone}`}><i aria-hidden="true" />{label}</span>
}
