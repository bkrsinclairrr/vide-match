import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowDown, ArrowUp, Check, Download, GitCompareArrows, Search, SlidersHorizontal, Users, X } from "lucide-react"
import { STAT_KEYS } from "@/lib/funnel"
import { useVoxen } from "../store"
import {
  POSITIONS, STAGES, STAT_ABBR, formatDate, formatPhone, placeOf, positionCode, scoutAverage, scoutTone, type Player,
} from "../data"
import { Avatar, Empty, PosBadge, ScoreChip, StageTag, comparePath, playerPath } from "../ui"

type SortKey = "name" | "pos" | "category" | "age" | "overall" | "created" | "scout" | (typeof STAT_KEYS)[number]["key"]
const PAGE = 50

function categoryNum(p: Player) {
  const n = Number.parseInt((p.profile.category ?? "").replace(/\D/g, ""), 10)
  return Number.isFinite(n) ? n : 0
}

function sortValue(p: Player, key: SortKey): number | string {
  switch (key) {
    case "name": return p.name.toLowerCase()
    case "pos": return positionCode(p)
    case "category": return categoryNum(p)
    case "age": return p.profile.age ?? 0
    case "overall": return p.overall
    case "created": return p.createdAt
    case "scout": return scoutAverage(p.meta.scout) ?? -1
    default: return p.stats.find((s) => s.key === key)?.score ?? 0
  }
}

function toCsv(rows: Player[]) {
  const head = ["Nome", "E-mail", "Telefone", "Posição", "Categoria", "Idade", "Altura", "Peso", "Pé", "Cidade", "Etapa", "Origem", "Campanha", "Nota geral", ...STAT_KEYS.map((s) => s.label), "Média do scout", "Entrada"]
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = rows.map((p) => [
    p.name, p.email, formatPhone(p.phone), p.profile.position, p.profile.category, p.profile.age, p.profile.height,
    p.profile.weight, p.profile.foot, placeOf(p), STAGES.find((s) => s.key === p.meta.stage)?.label, p.origin,
    p.utm.campaign, p.overall, ...p.stats.map((s) => s.score), scoutAverage(p.meta.scout)?.toFixed(1),
    formatDate(p.createdAt),
  ].map(esc).join(";"))
  return "﻿" + [head.join(";"), ...lines].join("\n")
}

export default function PlayersPage() {
  const { players } = useVoxen()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created", dir: -1 })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const category = params.get("categoria") ?? ""
  const position = params.get("posicao") ?? ""
  const stage = params.get("etapa") ?? ""
  const origin = params.get("origem") ?? ""
  const onlyProfile = params.get("perfil") === "1"

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const options = useMemo(() => ({
    categories: [...new Set(players.map((p) => p.profile.category).filter(Boolean) as string[])]
      .sort((a, b) => Number.parseInt(a.replace(/\D/g, ""), 10) - Number.parseInt(b.replace(/\D/g, ""), 10)),
    origins: [...new Set(players.map((p) => p.origin))].sort(),
  }), [players])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    const digits = q.replace(/\D/g, "")
    return players.filter((p) => {
      if (category && p.profile.category !== category) return false
      if (position && p.profile.position !== position) return false
      if (stage && p.meta.stage !== stage) return false
      if (origin && p.origin !== origin) return false
      if (onlyProfile && !p.hasProfile) return false
      if (!q) return true
      const hay = `${p.name} ${p.email ?? ""} ${p.profile.city ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      return hay.includes(q) || (digits.length >= 4 && (p.phone ?? "").includes(digits))
    })
  }, [players, query, category, position, stage, origin, onlyProfile])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const va = sortValue(a, sort.key)
      const vb = sortValue(b, sort.key)
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir
    })
    return arr
  }, [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE))
  const current = Math.min(page, pages)
  const rows = sorted.slice((current - 1) * PAGE, current * PAGE)
  const activeFilters = [category, position, stage, origin, onlyProfile ? "1" : ""].filter(Boolean).length

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "pos" ? 1 : -1 }))

  const toggleSelect = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : s.length >= 3 ? [...s.slice(1), key] : [...s, key]))

  const exportCsv = () => {
    const blob = new Blob([toCsv(sorted)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `voxen-atletas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const Th = ({ k, children, className = "", title }: { k: SortKey; children: React.ReactNode; className?: string; title?: string }) => (
    <th
      className={`is-sortable ${sort.key === k ? "is-sorted" : ""} ${className}`}
      onClick={() => toggleSort(k)}
      title={title}
      aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sort.key === k && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </th>
  )

  return (
    <>
      <section className="vx-card mb-[18px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 basis-full xl:basis-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Buscar por nome, e-mail, cidade ou telefone"
              className="vx-input vx-input--icon"
              aria-label="Buscar atletas"
            />
          </div>
          <select className="vx-input vx-select vx-filter" value={category} onChange={(e) => setFilter("categoria", e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="vx-input vx-select vx-filter" value={position} onChange={(e) => setFilter("posicao", e.target.value)} aria-label="Posição">
            <option value="">Todas as posições</option>
            {Object.entries(POSITIONS).map(([name, p]) => <option key={name} value={name}>{p.code} · {name}</option>)}
          </select>
          <select className="vx-input vx-select vx-filter" value={stage} onChange={(e) => setFilter("etapa", e.target.value)} aria-label="Etapa">
            <option value="">Todas as etapas</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="vx-input vx-select vx-filter" value={origin} onChange={(e) => setFilter("origem", e.target.value)} aria-label="Origem">
            <option value="">Todas as origens</option>
            {options.origins.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button type="button" className={`vx-chip ${onlyProfile ? "is-on" : ""}`} onClick={() => setFilter("perfil", onlyProfile ? "" : "1")}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Só perfil completo
          </button>
          {activeFilters > 0 && (
            <button type="button" className="vx-chip" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setPage(1) }}>
              <X className="h-3.5 w-3.5" /> Limpar ({activeFilters})
            </button>
          )}
          <button type="button" className="vx-btn ml-auto" onClick={exportCsv} disabled={!sorted.length}>
            <Download /> Exportar CSV
          </button>
        </div>
      </section>

      <section className="vx-card vx-card--flush">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3.5">
          <p className="text-[13px] text-zinc-400">
            <strong className="text-white tnum">{sorted.length}</strong> atleta{sorted.length === 1 ? "" : "s"}
            {sorted.length !== players.length && <> de <span className="tnum">{players.length}</span></>}
            <span className="ml-2 hidden text-zinc-500 sm:inline">· marque até 3 para comparar</span>
          </p>
          <p className="text-[12px] text-zinc-500">Notas do relatório: <span style={{ color: "#34d399" }}>90+</span> · <span style={{ color: "#a3e635" }}>86+</span> · <span style={{ color: "#fbbf24" }}>81+</span> · <span style={{ color: "#fb923c" }}>até 80</span></p>
        </div>

        {rows.length ? (
          <div className="vx-table-wrap">
            <table className="vx-table">
              <thead>
                <tr>
                  <th className="vx-col-sticky w-[300px]" style={{ paddingLeft: 20 }}>
                    <span className="is-sortable inline-flex cursor-pointer items-center gap-1" onClick={() => toggleSort("name")}>
                      Jogador {sort.key === "name" && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </span>
                  </th>
                  <Th k="pos">Pos</Th>
                  <Th k="category">Categoria</Th>
                  <Th k="age">Idade</Th>
                  <th>Cidade</th>
                  <Th k="overall">Geral</Th>
                  {STAT_KEYS.map((s) => <Th key={s.key} k={s.key} title={s.label} className="text-center">{STAT_ABBR[s.key]}</Th>)}
                  <Th k="scout" title="Média da avaliação do scout (1 a 5)">Scout</Th>
                  <th>Etapa</th>
                  <th>Origem</th>
                  <Th k="created">Entrada</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const isSel = selected.includes(p.key)
                  const scout = scoutAverage(p.meta.scout)
                  return (
                    <tr
                      key={p.key}
                      className={isSel ? "is-selected" : ""}
                      style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }}
                      onClick={() => navigate(playerPath(p))}
                    >
                      <td className="vx-col-sticky" style={{ paddingLeft: 20 }}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`vx-check ${isSel ? "is-on" : ""}`}
                            onClick={(e) => { e.stopPropagation(); toggleSelect(p.key) }}
                            aria-label={isSel ? `Desmarcar ${p.name}` : `Marcar ${p.name} para comparar`}
                            aria-pressed={isSel}
                          >
                            {isSel && <Check strokeWidth={3} />}
                          </button>
                          <Avatar name={p.name} size={32} />
                          <div className="min-w-0 max-w-[200px]">
                            <Link to={playerPath(p)} onClick={(e) => e.stopPropagation()} className="block truncate text-[13.5px] font-semibold text-white hover:text-amber-300">{p.name}</Link>
                            <div className="truncate text-[11.5px] text-zinc-500">{p.email ?? (p.source === "conta" ? "Conta Zyron" : "—")}</div>
                          </div>
                        </div>
                      </td>
                      <td><PosBadge player={p} /></td>
                      <td className="text-zinc-300">{p.profile.category ?? <span className="text-zinc-600">—</span>}</td>
                      <td className="tnum text-zinc-300">{p.profile.age ?? <span className="text-zinc-600">—</span>}</td>
                      <td className="max-w-[160px] truncate text-zinc-400">{placeOf(p) ?? <span className="text-zinc-600">—</span>}</td>
                      <td><ScoreChip score={p.overall} /></td>
                      {p.stats.map((s) => <td key={s.key} className="text-center"><ScoreChip score={s.score} size="sm" /></td>)}
                      <td>
                        {scout === null ? <span className="text-zinc-600">—</span> : (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                              <span className="block h-full rounded-full" style={{ width: `${(scout / 5) * 100}%`, background: scoutTone(scout) }} />
                            </span>
                            <span className="text-[12px] font-bold tnum" style={{ color: scoutTone(scout) }}>{scout.toFixed(1)}</span>
                          </span>
                        )}
                      </td>
                      <td><StageTag stage={p.meta.stage} /></td>
                      <td className="text-zinc-400">{p.origin}</td>
                      <td className="tnum text-zinc-400">{formatDate(p.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<Users className="h-6 w-6" />} title="Nenhum atleta com esses filtros">
            Ajuste a busca ou limpe os filtros para ver a base inteira.
          </Empty>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-3 text-[12.5px] text-zinc-400">
            <span>Página <strong className="text-white tnum">{current}</strong> de <span className="tnum">{pages}</span></span>
            <div className="flex gap-2">
              <button type="button" className="vx-btn" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</button>
              <button type="button" className="vx-btn" disabled={current === pages} onClick={() => setPage(current + 1)}>Próxima</button>
            </div>
          </div>
        )}
      </section>

      {selected.length > 0 && (
        <div className="vx-floatbar" role="region" aria-label="Atletas selecionados">
          <div className="flex -space-x-2">
            {selected.map((k) => {
              const p = players.find((x) => x.key === k)
              return p ? <Avatar key={k} name={p.name} size={30} /> : null
            })}
          </div>
          <span className="text-[13px] text-zinc-300"><strong className="text-white">{selected.length}</strong> de 3 selecionados</span>
          <button type="button" className="vx-btn" onClick={() => setSelected([])}>Limpar</button>
          <button
            type="button"
            className="vx-btn vx-btn--gold"
            disabled={selected.length < 2}
            onClick={() => navigate(comparePath(selected))}
          >
            <GitCompareArrows /> Comparar
          </button>
        </div>
      )}
    </>
  )
}
