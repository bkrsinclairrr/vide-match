import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Crown, LockOpen, Trophy, X } from "lucide-react"
import { CLIENT_BASE } from "../paths"
import type { Game, Mission } from "../game"
import type { News } from "../news"

/*
 * Aviso de "missão cumprida": o que foi concluído desde a última visita (news.ts), o XP ganho,
 * o nível novo e o que acabou de abrir na área. Some sozinho em 12 s (pausa com o mouse em cima).
 */

/** O que cada missão abre na área, para o aviso dizer e levar até lá. */
const OPENS: Record<string, { text: string; to?: string; label?: string }> = {
  perfil: { text: "as oportunidades, o comparativo e a análise dos seus jogos.", to: "/oportunidades", label: "Ver oportunidades" },
  analise: { text: "Partidas e Desempenho, com cada lance seu.", to: "/partidas", label: "Ver a análise" },
  tres: { text: "a seleção para a assessoria da Zyron.", to: "/conquistas", label: "Ver a jornada" },
  selecionado: { text: "o encaminhamento para um clube.", to: "/conquistas", label: "Ver a jornada" },
  encaminhado: { text: "o fechamento de contrato.", to: "/conquistas", label: "Ver a jornada" },
}

const SHOW_MS = 12_000

export function JourneyToast({ news, game, onClose }: { news: News; game: Game; onClose: () => void }) {
  const items = news.keys.map((k) => game.missions.find((m) => m.key === k)).filter((m): m is Mission => Boolean(m))
  const [paused, setPaused] = useState(false)
  const timer = useRef<number>()
  const close = useRef(onClose)
  close.current = onClose

  const newsKey = news.keys.join(",")
  useEffect(() => {
    if (paused) return
    timer.current = window.setTimeout(() => close.current(), SHOW_MS)
    return () => window.clearTimeout(timer.current)
  }, [paused, newsKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close.current() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!items.length) return null
  const finished = items.some((m) => m.key === "contrato")
  // Vale o que abriu por último na jornada (é o passo seguinte da pessoa).
  const open = [...items].reverse().map((m) => OPENS[m.key]).find(Boolean)
  const Icon = finished ? Crown : Trophy

  return (
    <div className={`cl-toast ${finished ? "is-final" : ""}`} role="status" aria-live="polite" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="cl-burst" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}
      </div>
      <span className="cl-medal" aria-hidden="true"><Icon /></span>
      <div className="min-w-0 flex-1">
        <p className="cl-kicker">{finished ? "Jornada completa" : items.length > 1 ? `${items.length} missões cumpridas` : "Missão cumprida"}</p>
        <p className="cl-title">{items.map((m) => m.title).join(" · ")}</p>
        {(news.xpGained > 0 || news.levelUp) && (
          <p className="cl-xp">
            {news.xpGained > 0 && <b className="tnum">+{news.xpGained} XP</b>}
            {news.levelUp && <span>{news.xpGained > 0 ? " · " : ""}subiu para o nível {game.level}, <b>{game.title}</b></span>}
          </p>
        )}
        {finished
          ? <p className="cl-open"><Crown /> Do primeiro cadastro ao contrato: você fez a jornada inteira.</p>
          : open && <p className="cl-open"><LockOpen /> Liberado agora: {open.text}</p>}
        {!finished && open?.to && open.label && (
          <Link to={`${CLIENT_BASE}${open.to}`} className="vx-btn vx-btn--gold cl-cta" onClick={onClose}>{open.label} <ArrowRight /></Link>
        )}
      </div>
      <button type="button" className="vx-icon-btn cl-close" onClick={onClose} aria-label="Fechar aviso"><X /></button>
      {!paused && <span key={newsKey} className="cl-timer" style={{ animationDuration: `${SHOW_MS}ms` }} aria-hidden="true" />}
    </div>
  )
}
