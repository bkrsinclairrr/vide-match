import { useMemo, useRef, useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Crown, GitCompareArrows, Plus, Search, X } from "lucide-react"
import { useVoxen } from "../store"
import {
  SCOUT_ATTRS, dimensionScores, placeOf, positionCode, positionOf, scoutAverage, stageInfo, type Player,
} from "../data"
import { Meter, Pitch, RadarChart } from "../charts"
import { Avatar, CardHead, Empty, PosBadge, ScoreChip, playerPath } from "../ui"

const COLORS = ["#fbbf24", "#38bdf8", "#f472b6"]
type Tab = "indicadores" | "dimensoes" | "scout"

function Picker({ exclude, onPick }: { exclude: string[]; onPick: (p: Player) => void }) {
  const { players } = useVoxen()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return players
      .filter((p) => !exclude.includes(p.key))
      .filter((p) => !term || `${p.name} ${p.profile.position ?? ""} ${p.profile.category ?? ""}`.toLowerCase().includes(term))
      .slice(0, 40)
  }, [players, exclude, q])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="vx-input vx-input--icon"
          placeholder="Buscar atleta para comparar"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          aria-label="Buscar atleta para comparar"
        />
      </div>
      {open && (
        <div className="vx-picker" role="listbox">
          {results.length ? results.map((p) => (
            <button key={p.key} type="button" role="option" aria-selected={false} onClick={() => { onPick(p); setOpen(false); setQ("") }}>
              <Avatar name={p.name} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                <span className="block text-[11.5px] text-zinc-500">{positionCode(p)} · {p.profile.category ?? "—"} · {placeOf(p) ?? "—"}</span>
              </span>
              <ScoreChip score={p.overall} size="sm" />
            </button>
          )) : <p className="p-3 text-[12.5px] text-zinc-500">Nenhum atleta encontrado.</p>}
        </div>
      )}
    </div>
  )
}

export default function Compare() {
  const { byKey } = useVoxen()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>("indicadores")

  const keys = (params.get("p") ?? "").split(",").map((k) => decodeURIComponent(k)).filter((k) => byKey.has(k)).slice(0, 3)
  const chosen = keys.map((k) => byKey.get(k) as Player)

  const setKeys = (next: string[]) => {
    const sp = new URLSearchParams(params)
    if (next.length) sp.set("p", next.map(encodeURIComponent).join(","))
    else sp.delete("p")
    setParams(sp, { replace: true })
  }

  const withScout = chosen.filter((p) => p.meta.scout)
  const radar = useMemo(() => {
    if (tab === "dimensoes") {
      const dims = chosen.map(dimensionScores)
      return {
        axes: dims[0]?.map((d) => d.label) ?? [],
        series: chosen.map((p, i) => ({ name: p.name, color: COLORS[i], values: dims[i].map((d) => (d.score - 64) / 34) })),
      }
    }
    if (tab === "scout") {
      return {
        axes: SCOUT_ATTRS.map((a) => a.label.replace("Oferecer linha de passe", "Linha de passe").replace("Movimento sem bola", "Mov. sem bola")),
        series: chosen.map((p, i) => ({ p, i })).filter(({ p }) => p.meta.scout).map(({ p, i }) => ({
          name: p.name, color: COLORS[i], values: SCOUT_ATTRS.map((a) => (p.meta.scout?.[a.key] ?? 0) / 5),
        })),
      }
    }
    return {
      axes: chosen[0]?.stats.map((s) => s.label) ?? [],
      series: chosen.map((p, i) => ({ name: p.name, color: COLORS[i], values: p.stats.map((s) => (s.score - 64) / 34) })),
    }
  }, [chosen, tab])

  const rows = chosen[0]?.stats.map((s, idx) => ({
    label: s.label,
    values: chosen.map((p) => p.stats[idx].score),
  })) ?? []

  const facts: { label: string; get: (p: Player) => string }[] = [
    { label: "Nota geral", get: (p) => String(p.overall) },
    { label: "Média do scout", get: (p) => scoutAverage(p.meta.scout)?.toFixed(1) ?? "—" },
    { label: "Categoria", get: (p) => p.profile.category ?? "—" },
    { label: "Idade", get: (p) => (p.profile.age ? `${p.profile.age} anos` : "—") },
    { label: "Altura", get: (p) => (p.profile.height ? `${p.profile.height} cm` : "—") },
    { label: "Peso", get: (p) => (p.profile.weight ? `${p.profile.weight} kg` : "—") },
    { label: "Melhor pé", get: (p) => p.profile.foot ?? "—" },
    { label: "Cidade", get: (p) => placeOf(p) ?? "—" },
    { label: "Etapa", get: (p) => stageInfo(p.meta.stage).label },
    { label: "Origem", get: (p) => p.origin },
  ]

  return (
    <>
      {/* Cabeçalhos */}
      <div className="vx-grid mb-[18px] md:grid-cols-3">
        {[0, 1, 2].map((slot) => {
          const p = chosen[slot]
          if (!p) {
            return (
              <section key={`empty-${slot}`} className="vx-card flex flex-col justify-center gap-3" style={{ borderStyle: "dashed", minHeight: 150 }}>
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400">
                  <Plus className="h-4 w-4 text-amber-300" /> Atleta {slot + 1}
                </span>
                {slot <= chosen.length && <Picker exclude={keys} onPick={(np) => setKeys([...keys, np.key])} />}
              </section>
            )
          }
          return (
            <section key={p.key} className="vx-card vx-card--hover" style={{ boxShadow: `inset 0 3px 0 ${COLORS[slot]}` }}>
              <button type="button" className="vx-icon-btn absolute right-3 top-3" aria-label={`Remover ${p.name}`} onClick={() => setKeys(keys.filter((k) => k !== p.key))}>
                <X />
              </button>
              <div className="flex items-center gap-4 pr-10">
                <Avatar name={p.name} size={56} />
                <div className="min-w-0">
                  <Link to={playerPath(p)} className="block truncate text-[16px] font-bold hover:text-amber-300">{p.name}</Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <PosBadge player={p} />
                    <span className="text-[12px] text-zinc-400">{p.profile.category ?? "—"} · {placeOf(p) ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ScoreChip score={p.overall} size="lg" />
                <span className="text-[12px] text-zinc-500">nota geral</span>
                <span className="ml-auto h-2.5 w-2.5 rounded-full" style={{ background: COLORS[slot], boxShadow: `0 0 10px ${COLORS[slot]}` }} />
              </div>
            </section>
          )
        })}
      </div>

      {chosen.length < 2 ? (
        <section className="vx-card">
          <Empty icon={<GitCompareArrows className="h-6 w-6" />} title="Escolha pelo menos dois atletas">
            Busque nos campos acima ou marque até 3 atletas na <Link to="/voxen/jogadores" className="text-amber-300 underline">lista de jogadores</Link>.
          </Empty>
        </section>
      ) : (
        <>
          <section className="vx-card mb-[18px]">
            <CardHead title="Posições em campo" sub="Onde cada atleta joga" />
            <div className="grid gap-5 sm:grid-cols-3">
              {chosen.map((p, i) => {
                const pos = positionOf(p)
                return (
                  <div key={p.key} className="mx-auto w-full max-w-[220px] text-center">
                    <Pitch
                      markers={pos ? [{ x: pos.x, y: pos.y, label: pos.code, highlight: true, color: COLORS[i] }] : []}
                      heat={pos ? [{ x: pos.x, y: pos.y }] : []}
                    />
                    <p className="mt-2 text-[12.5px] text-zinc-400">{p.profile.position ?? "Posição não informada"}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="vx-grid mb-[18px] items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <section className="vx-card xl:sticky xl:top-[88px]">
              <CardHead
                title="Comparação no radar"
                actions={
                  <div className="vx-tabs">
                    {([["indicadores", "Indicadores"], ["dimensoes", "Dimensões"], ["scout", "Scout"]] as [Tab, string][]).map(([k, label]) => (
                      <button key={k} type="button" className={`vx-tab ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)}>{label}</button>
                    ))}
                  </div>
                }
              />
              {radar.series.length ? (
                <div className="mx-auto max-w-[460px]">
                  <RadarChart key={tab + keys.join()} axes={radar.axes} series={radar.series} size={440} />
                </div>
              ) : (
                <Empty icon={<GitCompareArrows className="h-6 w-6" />} title="Nenhum destes atletas foi avaliado pelo scout">
                  Registre a avaliação no perfil de cada atleta para comparar aqui.
                </Empty>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {chosen.map((p, i) => (
                  <span key={p.key} className="inline-flex items-center gap-2 text-[12.5px] text-zinc-300" style={{ opacity: tab === "scout" && !p.meta.scout ? 0.4 : 1 }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />{p.name.split(" ")[0]}
                    {tab === "scout" && !p.meta.scout && <span className="text-zinc-500">(sem avaliação)</span>}
                  </span>
                ))}
              </div>
              {tab === "scout" && withScout.length > 0 && withScout.length < chosen.length && (
                <p className="mt-3 text-center text-[12px] text-zinc-500">Só aparecem no radar os atletas já avaliados pela equipe.</p>
              )}
            </section>

            <section className="vx-card">
              <CardHead title="Indicadores lado a lado" sub={<span className="inline-flex items-center gap-1"><Crown className="h-3 w-3 text-amber-300" /> marca o melhor em cada indicador</span>} />
              <div className="flex flex-col gap-3.5">
                {rows.map((row, r) => {
                  const best = Math.max(...row.values)
                  return (
                    <div key={row.label}>
                      <div className="mb-1.5 text-[12.5px] font-semibold text-zinc-300">{row.label}</div>
                      <div className="flex flex-col gap-1.5">
                        {row.values.map((v, i) => (
                          <div key={i} className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
                            <Meter value={((v - 64) / 34) * 100} color={COLORS[i]} height={7} delay={r * 40 + i * 60} />
                            <span className="inline-flex items-center justify-end gap-1 text-[12.5px] font-bold tnum" style={{ color: v === best ? COLORS[i] : "#a1a1aa" }}>
                              {v === best && <Crown className="h-3 w-3" />}{v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <section className="vx-card vx-card--flush">
            <div className="px-5 pt-5"><CardHead title="Perfil e andamento" sub="Dados informados e etapa com a equipe" /></div>
            <div className="overflow-x-auto">
              <table className="vx-table" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Dado</th>
                    {chosen.map((p, i) => (
                      <th key={p.key} style={{ color: COLORS[i] }}>{p.name.split(" ")[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facts.map((f) => (
                    <tr key={f.label} style={{ cursor: "default" }}>
                      <td style={{ paddingLeft: 20 }} className="text-zinc-400">{f.label}</td>
                      {chosen.map((p) => <td key={p.key} className="font-semibold tnum">{f.get(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}
