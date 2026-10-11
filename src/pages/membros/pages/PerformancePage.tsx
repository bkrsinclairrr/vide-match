import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3 } from "lucide-react"
import { Empty } from "@/pages/voxen/ui"
import { useMember } from "../MembersApp"
import { summarizeProfile } from "../metrics"
import { Board, BOARD_COLORS } from "../components/Board"
import { PERIODS } from "../components/Stats"

export default function PerformancePage() {
  const { bundle } = useMember()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<number>(10)
  const summary = useMemo(() => summarizeProfile(bundle, period || undefined), [bundle, period])

  if (!bundle.matches.length) {
    return <div className="vx-card"><Empty icon={<BarChart3 className="h-6 w-6" />} title="O desempenho aparece depois da primeira partida analisada" /></div>
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-400">
          Baseado em <strong className="text-white tnum">{summary.matches.length}</strong> partida{summary.matches.length === 1 ? "" : "s"} e{" "}
          <strong className="text-white tnum">{summary.events.length}</strong> ações marcadas nos vídeos.
        </p>
        <div className="vx-tabs" role="tablist" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={period === p.key} className={`vx-tab ${period === p.key ? "is-on" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>
      <Board key={period} cols={[{ summary, color: BOARD_COLORS[0] }]} onOpenMatch={(m) => navigate(`/membros/partidas/${m.match.id}`)} />
    </>
  )
}
