import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shirt, Trophy } from "lucide-react"
import { useVoxen } from "../store"
import { LINES, POSITIONS, placeOf, scoutAverage, shortName, type Player } from "../data"
import { Pitch } from "../charts"
import { Avatar, CardHead, Empty, PosBadge, ScoreChip, playerPath } from "../ui"

/** 4-3-3: cada vaga aceita uma posição, na ordem em que é preenchida. */
const FORMATION: { position: string; x: number; y: number }[] = [
  { position: "Goleiro", x: 50, y: 91 },
  { position: "Zagueiro", x: 36, y: 76 },
  { position: "Zagueiro", x: 64, y: 76 },
  { position: "Lateral Direito", x: 86, y: 68 },
  { position: "Lateral Esquerdo", x: 14, y: 68 },
  { position: "Volante", x: 50, y: 57 },
  { position: "Meio-Campo", x: 28, y: 45 },
  { position: "Meia-Atacante", x: 72, y: 40 },
  { position: "Ponta Esquerda", x: 17, y: 20 },
  { position: "Centroavante", x: 50, y: 12 },
  { position: "Ponta Direita", x: 83, y: 20 },
]

type Rank = "relatorio" | "scout"

function categoryOrder(c: string) {
  return Number.parseInt(c.replace(/\D/g, ""), 10) || 99
}

export default function Squad() {
  const { players } = useVoxen()
  const navigate = useNavigate()
  const [category, setCategory] = useState("Todas")
  const [rank, setRank] = useState<Rank>("relatorio")

  const categories = useMemo(
    () => ["Todas", ...[...new Set(players.map((p) => p.profile.category).filter(Boolean) as string[])].sort((a, b) => categoryOrder(a) - categoryOrder(b))],
    [players],
  )

  const list = useMemo(
    () => players.filter((p) => p.profile.position && POSITIONS[p.profile.position] && (category === "Todas" || p.profile.category === category)),
    [players, category],
  )

  const score = (p: Player) => (rank === "scout" ? (scoutAverage(p.meta.scout) ?? -1) * 20 : p.overall)

  const lineup = useMemo(() => {
    const used = new Set<string>()
    return FORMATION.map((slot) => {
      const best = list
        .filter((p) => p.profile.position === slot.position && !used.has(p.key) && (rank === "relatorio" || p.meta.scout))
        .sort((a, b) => score(b) - score(a))[0]
      if (best) used.add(best.key)
      return { ...slot, player: best }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, rank])

  const groups = useMemo(() => LINES.map((line) => ({
    ...line,
    players: list
      .filter((p) => POSITIONS[p.profile.position as string].line === line.key)
      .sort((a, b) => score(b) - score(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [list, rank])

  const withoutPosition = players.filter((p) => !p.profile.position).length

  if (!list.length && category === "Todas") {
    return (
      <section className="vx-card">
        <Empty icon={<Shirt className="h-6 w-6" />} title="O elenco aparece quando os atletas informarem a posição">
          {withoutPosition} atleta{withoutPosition === 1 ? "" : "s"} ainda sem posição. Com a atualização do banco, todo atleta
          que concluir o formulário do funil entra aqui automaticamente.
        </Empty>
      </section>
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="vx-chips" role="tablist" aria-label="Categoria">
          {categories.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={c === category} className={`vx-chip ${c === category ? "is-on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div className="vx-tabs" aria-label="Critério">
          <button type="button" className={`vx-tab ${rank === "relatorio" ? "is-on" : ""}`} onClick={() => setRank("relatorio")}>Nota do relatório</button>
          <button type="button" className={`vx-tab ${rank === "scout" ? "is-on" : ""}`} onClick={() => setRank("scout")}>Avaliação do scout</button>
        </div>
      </div>

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Seleção ideal · 4-3-3</span>}
            sub={`Melhor ${rank === "scout" ? "avaliação do scout" : "nota do relatório"} em cada posição${category === "Todas" ? "" : ` · ${category}`}`}
          />
          <div className="mx-auto max-w-[400px]">
            <Pitch
              key={category + rank}
              markers={lineup.map((s) => ({
                x: s.x, y: s.y,
                label: s.player ? String(rank === "scout" ? scoutAverage(s.player.meta.scout)?.toFixed(1) : s.player.overall) : POSITIONS[s.position].code,
                name: s.player ? shortName(s.player.name) : "vaga aberta",
                highlight: Boolean(s.player),
                color: s.player ? undefined : "rgba(255,255,255,0.25)",
                title: s.player ? `${s.player.name} · ${s.position}` : `${s.position}: sem atleta`,
                onClick: s.player ? () => navigate(playerPath(s.player as Player)) : undefined,
              }))}
            />
          </div>
          <p className="mt-3 text-center text-[12px] text-zinc-500">
            {lineup.filter((s) => s.player).length} de 11 vagas preenchidas · toque num atleta para abrir o perfil
          </p>
        </section>

        <section className="vx-card">
          <CardHead title="Destaques por setor" sub="O melhor de cada linha" />
          <div className="flex flex-col gap-3">
            {groups.map((g) => {
              const top = g.players[0]
              return (
                <div key={g.key} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="w-[118px] shrink-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{g.label}</p>
                    <p className="mt-0.5 text-[20px] font-bold tnum">{g.players.length}</p>
                  </div>
                  {top ? (
                    <Link to={playerPath(top)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-white/[0.04]">
                      <Avatar name={top.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold">{top.name}</p>
                        <p className="truncate text-[12px] text-zinc-500">{top.profile.position} · {top.profile.category ?? "—"}</p>
                      </div>
                      <ScoreChip score={top.overall} />
                    </Link>
                  ) : <span className="text-[12.5px] text-zinc-600">Sem atletas</span>}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {groups.map((g) => (
        <section key={g.key} className="vx-card mb-[18px]">
          <CardHead title={g.label} sub={`${g.players.length} atleta${g.players.length === 1 ? "" : "s"}`} />
          {g.players.length ? (
            <div className="vx-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {g.players.slice(0, 24).map((p, i) => (
                <Link key={p.key} to={playerPath(p)} className="vx-pcard" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                  <span className="vx-pcard-ovr"><ScoreChip score={p.overall} size="sm" /></span>
                  <Avatar name={p.name} size={54} />
                  <span className="vx-pcard-name">{shortName(p.name)}</span>
                  <span className="flex items-center gap-1.5"><PosBadge player={p} /><span className="vx-pcard-meta">{p.profile.category ?? "—"}</span></span>
                  <span className="vx-pcard-meta max-w-full truncate">{placeOf(p) ?? "—"}</span>
                </Link>
              ))}
            </div>
          ) : <p className="text-[13px] text-zinc-500">Nenhum atleta nesta linha{category === "Todas" ? "" : ` na categoria ${category}`}.</p>}
          {g.players.length > 24 && (
            <Link to={`/voxen/jogadores`} className="mt-4 inline-flex text-[12.5px] font-semibold text-amber-300 hover:underline">
              Ver os {g.players.length} na lista de jogadores →
            </Link>
          )}
        </section>
      ))}
    </>
  )
}
