import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Clapperboard } from "lucide-react"
import { Empty } from "@/pages/voxen/ui"
import { useMember } from "../ClientArea"
import { CLIENT_BASE } from "../paths"
import { formatMatchDate, scoreline } from "../model"
import { pct } from "../metrics"
import { MatchThumb } from "../components/MatchThumb"
import { RatingChip, ResultBadge } from "../components/bits"
import { UnlockCard } from "../components/Gamify"

export default function MatchesPage() {
  const { summary } = useMember()
  const [comp, setComp] = useState("Todas")
  const comps = useMemo(() => ["Todas", ...new Set(summary.matches.map((m) => m.match.competition ?? "Outras"))], [summary.matches])
  const list = comp === "Todas" ? summary.matches : summary.matches.filter((m) => (m.match.competition ?? "Outras") === comp)

  if (!summary.matches.length) {
    return (
      <>
        <div className="vx-card mb-[18px]">
          <Empty icon={<Clapperboard className="h-6 w-6" />} title="Nenhuma partida analisada ainda">
            Assim que a equipe analisar o seu primeiro jogo, ele aparece aqui com o vídeo e cada lance marcado.
          </Empty>
        </div>
        <UnlockCard />
      </>
    )
  }

  return (
    <>
      <div className="vx-chips mb-5">
        {comps.map((c) => <button key={c} type="button" className={`vx-chip ${c === comp ? "is-on" : ""}`} onClick={() => setComp(c)}>{c}</button>)}
      </div>
      <div className="vx-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m, i) => {
          const sl = scoreline(m.match)
          const okPct = pct(m.line.actionsOk, m.line.actions)
          return (
            <Link key={m.match.id} to={`${CLIENT_BASE}/partidas/${m.match.id}`} className="vx-card vx-card--flush vx-card--hover mb-mcard" style={{ "--i": Math.min(i, 10) } as React.CSSProperties}>
              <MatchThumb match={m.match} />
              <div className="p-4">
                <div className="flex items-center gap-2 text-[11.5px] text-zinc-500">
                  <ResultBadge match={m.match} size={22} />
                  <span className="truncate">{m.match.competition ?? "Partida"} · {formatMatchDate(m.match.playedOn)}</span>
                  <span className="ml-auto"><RatingChip rating={m.rating} size="sm" /></span>
                </div>
                <p className="mt-2.5 truncate text-[15px] font-bold">
                  {sl.left} <span className="tnum text-amber-300">{sl.leftGoals} × {sl.rightGoals}</span> {sl.right}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <span className="mb-mini"><b className="tnum">{m.events.length}</b><small>ações</small></span>
                  <span className="mb-mini"><b className="tnum">{okPct === null ? "—" : `${Math.round(okPct)}%`}</b><small>certas</small></span>
                  <span className="mb-mini"><b className="tnum">{m.line.goals}/{m.line.assists}</b><small>G / A</small></span>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-amber-300">Ver análise <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
