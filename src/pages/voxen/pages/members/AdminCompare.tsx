import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { GitCompareArrows, Plus, X } from "lucide-react"
import { Empty, PageSkeleton, Skeleton } from "@/pages/voxen/ui"
import type { Bundle } from "@/pages/membros/model"
import type { DataSource } from "@/pages/membros/api"
import { summarizeProfile } from "@/pages/membros/metrics"
import { Board, BOARD_COLORS, type BoardCol } from "@/pages/membros/components/Board"
import { PERIODS, ProfileHeader } from "@/pages/membros/components/Stats"
import { SetupNotice, useAdminSource, useSourceData } from "./shared"

const SLOTS = 3

export default function AdminCompare() {
  const source = useAdminSource()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const key = params.get("p") ?? ""
  const ids = useMemo(() => [...new Set(key.split(",").filter(Boolean))].slice(0, SLOTS), [key])
  const [period, setPeriod] = useState<number>(10)
  const list = useSourceData(source, (s) => s.listProfiles(), [])
  const [bundles, setBundles] = useState<Record<string, Bundle | null>>({})
  const cache = useRef<{ source: DataSource | null; requested: Set<string> }>({ source: null, requested: new Set() })

  useEffect(() => {
    if (!source) return
    if (cache.current.source !== source) {
      cache.current = { source, requested: new Set() }
      setBundles({})
    }
    for (const id of ids) {
      if (cache.current.requested.has(id)) continue
      cache.current.requested.add(id)
      source.getBundle(id, false).then(
        (b) => setBundles((x) => ({ ...x, [id]: b })),
        () => setBundles((x) => ({ ...x, [id]: null })),
      )
    }
  }, [source, ids])

  const cols = useMemo<BoardCol[]>(() => ids.flatMap((id, i) => {
    const b = bundles[id]
    if (!b) return []
    return [{ summary: summarizeProfile(b, period || undefined), color: BOARD_COLORS[i], tag: b.member.kind === "referencia" ? "Referência" : "Membro" }]
  }), [ids, bundles, period])

  if (list.error) return <SetupNotice error={list.error} />
  if (!list.data) return <PageSkeleton />

  const setIds = (next: string[]) => setParams(next.length ? { p: next.join(",") } : {}, { replace: true })
  const available = list.data.filter((m) => !ids.includes(m.id))
  const members = available.filter((m) => m.kind === "membro")
  const references = available.filter((m) => m.kind === "referencia")

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] leading-relaxed text-zinc-400">
          Compare até três perfis, membros ou referências, com as mesmas seções que o membro vê. Aqui entram também as partidas
          em rascunho.
        </p>
        <div className="vx-tabs" role="tablist" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={period === p.key} className={`vx-tab ${period === p.key ? "is-on" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="vx-grid mb-[18px] md:grid-cols-3">
        {Array.from({ length: SLOTS }, (_, slot) => {
          const id = ids[slot]
          const color = BOARD_COLORS[slot]
          if (id) {
            const b = bundles[id]
            if (b === undefined) {
              return <section key={id} className="vx-card flex items-center gap-4"><Skeleton h={64} w={64} r={99} /><div className="flex-1"><Skeleton h={14} w="70%" /><div className="mt-2"><Skeleton h={12} w="45%" /></div></div></section>
            }
            if (b === null) {
              return (
                <section key={id} className="vx-card flex items-center justify-between gap-3">
                  <span className="text-[13px] text-zinc-400">Perfil não encontrado.</span>
                  <button type="button" className="vx-icon-btn" onClick={() => setIds(ids.filter((x) => x !== id))} aria-label="Remover"><X /></button>
                </section>
              )
            }
            return (
              <ProfileHeader key={id} member={b.member} color={color} tag={b.member.kind === "referencia" ? "Referência" : "Membro"}
                summary={cols.find((c) => c.summary.bundle.member.id === id)?.summary} onRemove={() => setIds(ids.filter((x) => x !== id))} />
            )
          }
          return (
            <section key={`slot-${slot}`} className="vx-card flex flex-col justify-center gap-3" style={{ borderStyle: "dashed", minHeight: 132 }}>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400"><Plus className="h-4 w-4" style={{ color }} /> Perfil {slot + 1}</span>
              {slot === ids.length && available.length > 0 ? (
                <select className="vx-input vx-select" value="" onChange={(e) => e.target.value && setIds([...ids, e.target.value])} aria-label={`Escolher o perfil ${slot + 1}`}>
                  <option value="">Escolha um perfil</option>
                  {members.length > 0 && <optgroup label="Membros">{members.map((m) => <option key={m.id} value={m.id}>{m.fullName}{m.position ? ` · ${m.position}` : ""}</option>)}</optgroup>}
                  {references.length > 0 && <optgroup label="Referências">{references.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}</optgroup>}
                </select>
              ) : (
                <p className="text-[12.5px] text-zinc-500">{available.length ? "Escolha o perfil anterior primeiro." : "Não há outros perfis cadastrados."}</p>
              )}
            </section>
          )
        })}
      </div>

      {cols.length ? (
        <div className="mb-scroll-x">
          <Board key={`${period}-${cols.map((c) => c.summary.bundle.member.id).join(",")}`} cols={cols}
            onOpenMatch={(m) => navigate(`/voxen/membros/${m.match.memberId}/partidas/${m.match.id}`)} />
        </div>
      ) : (
        <div className="vx-card">
          <Empty icon={<GitCompareArrows className="h-6 w-6" />} title="Escolha os perfis para comparar">
            Posições em campo, mapa de calor, últimas partidas, estatísticas, índices Zyron e a avaliação do scout, lado a lado.
          </Empty>
        </div>
      )}
    </>
  )
}
