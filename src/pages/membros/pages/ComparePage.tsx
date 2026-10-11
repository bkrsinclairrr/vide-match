import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GitCompareArrows, Plus } from "lucide-react"
import { Empty } from "@/pages/voxen/ui"
import { useMember } from "../MembersApp"
import type { Bundle } from "../model"
import { summarizeProfile } from "../metrics"
import { Board, BOARD_COLORS, type BoardCol } from "../components/Board"
import { PERIODS, ProfileHeader } from "../components/Stats"

export default function ComparePage() {
  const { bundle, references, loadReference } = useMember()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<number>(10)
  const sameRole = references.find((r) => r.position && r.position === bundle.member.position)
  const [chosen, setChosen] = useState<string[]>(sameRole ? [sameRole.id] : [])
  const [loaded, setLoaded] = useState<Record<string, Bundle>>({})

  useEffect(() => {
    let cancelled = false
    for (const id of chosen) {
      if (loaded[id]) continue
      void loadReference(id).then((b) => {
        if (!cancelled && b) setLoaded((l) => ({ ...l, [id]: b }))
      })
    }
    return () => { cancelled = true }
  }, [chosen, loaded, loadReference])

  const cols = useMemo<BoardCol[]>(() => {
    const out: BoardCol[] = [{ summary: summarizeProfile(bundle, period || undefined), color: BOARD_COLORS[0], tag: "Você" }]
    chosen.forEach((id, i) => {
      const b = loaded[id]
      if (b) out.push({ summary: summarizeProfile(b, period || undefined), color: BOARD_COLORS[i + 1], tag: "Referência" })
    })
    return out
  }, [bundle, chosen, loaded, period])

  const available = references.filter((r) => !chosen.includes(r.id))

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] leading-relaxed text-zinc-400">
          Compare o seu jogo com <strong className="text-zinc-200">perfis de referência</strong> montados pela equipe Zyron a partir de
          jogos analisados de atletas da sua posição.
        </p>
        <div className="vx-tabs" role="tablist" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={period === p.key} className={`vx-tab ${period === p.key ? "is-on" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="vx-grid mb-[18px] md:grid-cols-3">
        <ProfileHeader member={bundle.member} color={BOARD_COLORS[0]} tag="Você" summary={cols[0].summary} />
        {[0, 1].map((slot) => {
          const id = chosen[slot]
          const ref = references.find((r) => r.id === id)
          if (ref) {
            return (
              <ProfileHeader key={ref.id} member={ref} color={BOARD_COLORS[slot + 1]} tag="Referência" summary={cols.find((c) => c.summary.bundle.member.id === ref.id)?.summary}
                onRemove={() => setChosen((c) => c.filter((x) => x !== ref.id))} />
            )
          }
          return (
            <section key={`slot-${slot}`} className="vx-card flex flex-col justify-center gap-3" style={{ borderStyle: "dashed", minHeight: 132 }}>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400"><Plus className="h-4 w-4 text-amber-300" /> Comparar com</span>
              {available.length > 0 && slot === chosen.length ? (
                <select className="vx-input vx-select" value="" onChange={(e) => e.target.value && setChosen((c) => [...c, e.target.value])} aria-label="Escolher referência">
                  <option value="">Escolha uma referência</option>
                  {available.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                </select>
              ) : (
                <p className="text-[12.5px] text-zinc-500">{references.length ? "Escolha a referência anterior primeiro." : "A equipe ainda não publicou referências."}</p>
              )}
            </section>
          )
        })}
      </div>

      {cols.length < 2 && !chosen.length ? (
        <div className="vx-card">
          <Empty icon={<GitCompareArrows className="h-6 w-6" />} title="Escolha uma referência para comparar">
            O comparativo mostra, lado a lado, posições em campo, mapa de calor, últimas partidas, estatísticas, índices e a
            avaliação do scout.
          </Empty>
        </div>
      ) : (
        <div className="mb-scroll-x">
          <Board key={`${period}-${cols.length}`} cols={cols} onOpenMatch={(m) => m.match.memberId === bundle.member.id && navigate(`/membros/partidas/${m.match.id}`)} />
        </div>
      )}
    </>
  )
}
