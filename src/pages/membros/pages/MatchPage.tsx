import { useCallback, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, MessageSquareQuote, Timer } from "lucide-react"
import { Ring, CountUp } from "@/pages/voxen/charts"
import { CardHead, Empty } from "@/pages/voxen/ui"
import { useMember } from "../MembersApp"
import { formatMatchDate, positionCodeOf, ratingColor, scoreline } from "../model"
import { summarizeMatch } from "../metrics"
import { HeatMap } from "../components/Field"
import { EventList, EventTimeline, VideoPlayer, type PlayerApi } from "../components/Video"
import { Shield } from "../components/bits"
import { IndexBars, StatGrid } from "../components/Stats"

export default function MatchPage() {
  const { id = "" } = useParams()
  const { bundle, member } = useMember()
  const match = bundle.matches.find((m) => m.id === id)
  const summary = useMemo(() => (match ? summarizeMatch(match, bundle.events) : null), [match, bundle.events])
  const player = useRef<PlayerApi>(null)
  const [time, setTime] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const seek = useCallback((t: number) => player.current?.seek(Math.max(0, t - 2)), [])

  if (!match || !summary) {
    return <div className="vx-card"><Empty icon={<ArrowLeft className="h-6 w-6" />} title="Partida não encontrada"><Link to="/membros/partidas" className="text-amber-300 underline">Voltar para partidas</Link></Empty></div>
  }

  const sl = scoreline(match)
  const canSeek = Boolean(match.videoUrl)
  const color = ratingColor(summary.rating)

  return (
    <>
      <section className="vx-card mb-[18px] mb-scoreboard">
        <Link to="/membros/partidas" className="vx-icon-btn" aria-label="Voltar para partidas"><ArrowLeft /></Link>
        <div className="mb-score-team">
          <Shield name={sl.left} size={46} />
          <span>{sl.left}</span>
        </div>
        <div className="mb-score-mid">
          <span className="mb-score-comp">{match.competition ?? "Partida"}</span>
          <b className="tnum">{sl.leftGoals}<i>×</i>{sl.rightGoals}</b>
          <span className="mb-score-meta">{formatMatchDate(match.playedOn)} · <Timer className="inline h-3.5 w-3.5" /> {match.minutes ?? 90}' · {positionCodeOf(match.position ?? member.position)}</span>
        </div>
        <div className="mb-score-team is-right">
          <Shield name={sl.right} size={46} />
          <span>{sl.right}</span>
        </div>
        <div className="mb-score-rating">
          <Ring value={summary.rating} max={10} size={92} stroke={8} color={color}>
            <span className="text-[24px] font-extrabold leading-none tnum" style={{ color }}><CountUp value={summary.rating} decimals={1} /></span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500">Nota</span>
          </Ring>
          <small>{summary.ratingFromTeam ? "definida pela equipe" : "calculada pelas ações"}</small>
        </div>
      </section>

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="vx-card">
          <CardHead title="Vídeo da partida" sub={canSeek ? "Toque numa ação, na linha do tempo ou na lista, para ir direto ao lance" : "Ações marcadas pela equipe Zyron"} />
          <VideoPlayer ref={player} url={match.videoUrl} onTime={setTime} onDuration={setDuration} title={`${sl.left} × ${sl.right}`} />
          <div className="mt-4">
            <EventTimeline events={summary.events} duration={duration} time={canSeek ? time : null} onSeek={canSeek ? (t) => player.current?.seek(t) : undefined} />
          </div>
        </section>
        <section className="vx-card">
          <CardHead title="Lances marcados" sub={`${summary.events.length} ações neste jogo`} />
          <EventList events={summary.events} time={canSeek ? time : null} onSeek={canSeek ? seek : undefined} maxHeight={520} />
        </section>
      </div>

      {match.summary && (
        <section className="vx-card mb-[18px] mb-quote">
          <MessageSquareQuote className="h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Comentário da equipe</p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-zinc-200">{match.summary}</p>
          </div>
        </section>
      )}

      <section className="vx-card mb-[18px]">
        <CardHead title="Mapa de calor da partida" sub="Onde cada ação aconteceu, do ponto de vista do seu ataque" />
        <HeatMap events={summary.events} controls insights label={`${sl.left} × ${sl.right}`} />
      </section>

      <section className="vx-card mb-[18px]">
        <CardHead title="Estatísticas da partida" sub="Tudo contado a partir do vídeo" />
        <StatGrid line={summary.line} />
      </section>
      <section className="vx-card">
        <CardHead title="Ofensivo × construção × defensivo" sub="Índices Zyron da partida, de 0 a 5, por 90 minutos" />
        <IndexBars line={summary.line} />
      </section>
    </>
  )
}
