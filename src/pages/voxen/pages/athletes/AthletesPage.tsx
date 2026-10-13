import "@/pages/admin/console/console.css"
import "./athletes.css"

import { useEffect, useMemo, useState, type CSSProperties, type DragEvent } from "react"
import { useLocation, useSearchParams } from "react-router-dom"
import {
  AlertTriangle, BriefcaseBusiness, GripVertical, LayoutGrid, List, Medal, MessageCircle, Plus, RefreshCw, Search, Send, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { formatDate } from "@/pages/voxen/data"
import { useAdminSource, useSourceData } from "@/pages/voxen/pages/members/shared"
import { Drawer } from "@/pages/admin/console/parts"
import { useAthletes, type AthletesHook } from "./api"
import { AddAthlete } from "./AddAthlete"
import { AthleteFile, type OriginInfo } from "./AthleteFile"
import { Flag, NextStep, SectorSetup, TempPicker } from "./bits"
import {
  ORIGIN_LABEL, TEMPS, ageOf, byHeat, draftFromMember, draftFromPlayer, isOverdue, isoDay, mergeData, pickData, tempInfo, whatsappOf,
  type Athlete, type AthletePatch, type Temperature,
} from "./model"

type View = "quadro" | "lista"
type FlagFilter = "assessoria" | "encaminhados" | "atrasados" | null
const SORTS = [
  ["calor", "Mais quentes primeiro"],
  ["passo", "Próximo passo mais perto"],
  ["recentes", "Mais recentes no setor"],
  ["nome", "Nome (A–Z)"],
] as const
type Sort = (typeof SORTS)[number][0]

const VIEW_KEY = "atletas:vista"
const readView = (): View => {
  try { return localStorage.getItem(VIEW_KEY) === "lista" ? "lista" : "quadro" } catch { return "quadro" }
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
const metaOf = (a: Athlete) => {
  const age = ageOf(a)
  return [a.position, a.category, age !== null ? `${age} anos` : null, a.city].filter(Boolean).join(" · ")
}

/**
 * Setor Atletas: os atletas que a equipe escolheu para trabalhar com mais cuidado.
 * Quadro por temperatura (arrastar entre frio, morno e quente), lista com ações rápidas,
 * números que filtram e a ficha completa de cada um.
 */
export default function AthletesPage() {
  const sector = useAthletes({ fresh: true })
  const { players } = useVoxen()
  const { toast } = useToast()
  const { pathname } = useLocation()
  const [params, setParams] = useSearchParams()
  const source = useAdminSource()
  const membersRes = useSourceData(source, (s) => s.listProfiles(), [])
  const members = useMemo(() => (membersRes.data ?? []).filter((m) => m.kind === "membro"), [membersRes.data])

  const [view, setViewState] = useState<View>(readView)
  const [query, setQuery] = useState("")
  const [temps, setTemps] = useState<Set<Temperature>>(new Set())
  const [flag, setFlag] = useState<FlagFilter>(null)
  const [sort, setSort] = useState<Sort>("calor")
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Temperature | null>(null)

  const all = useMemo(() => sector.list ?? [], [sector.list])
  const fichaId = params.get("ficha")
  const ficha = fichaId ? all.find((a) => a.id === fichaId) ?? null : null
  const adding = params.get("novo") === "1" && sector.canEdit
  const inVoxen = pathname.startsWith("/voxen")

  // Ficha que não existe mais (tirada do setor em outra aba): fecha a gaveta.
  useEffect(() => {
    if (fichaId && sector.list && !ficha) setParams((p) => { p.delete("ficha"); return p }, { replace: true })
  }, [fichaId, ficha, sector.list, setParams])

  const setView = (v: View) => {
    setViewState(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* só nesta visita */ }
  }
  const openFicha = (id: string) => setParams((p) => { p.set("ficha", id); p.delete("novo"); return p }, { replace: true })
  const closeFicha = () => setParams((p) => { p.delete("ficha"); return p }, { replace: true })
  const openAdd = () => setParams((p) => { p.set("novo", "1"); p.delete("ficha"); return p }, { replace: true })
  const closeAdd = () => setParams((p) => { p.delete("novo"); return p }, { replace: true })

  const counts = useMemo(() => ({
    total: all.length,
    frio: all.filter((a) => a.temperature === "frio").length,
    morno: all.filter((a) => a.temperature === "morno").length,
    quente: all.filter((a) => a.temperature === "quente").length,
    assessoria: all.filter((a) => a.advisory).length,
    encaminhados: all.filter((a) => a.forwarded).length,
    atrasados: all.filter(isOverdue).length,
  }), [all])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = all.filter((a) => {
      if (temps.size && !temps.has(a.temperature)) return false
      if (flag === "assessoria" && !a.advisory) return false
      if (flag === "encaminhados" && !a.forwarded) return false
      if (flag === "atrasados" && !isOverdue(a)) return false
      if (!q) return true
      return `${a.fullName} ${a.email ?? ""} ${a.phone ?? ""} ${a.position ?? ""} ${a.category ?? ""} ${a.city ?? ""} ${a.team ?? ""} ${a.forwardedTo ?? ""} ${a.nextStep ?? ""}`.toLowerCase().includes(q)
    })
    if (sort === "calor") rows.sort(byHeat)
    else if (sort === "passo") rows.sort((a, b) => (a.nextStepOn ?? "9999").localeCompare(b.nextStepOn ?? "9999") || byHeat(a, b))
    else if (sort === "recentes") rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    else rows.sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"))
    return rows
  }, [all, temps, flag, query, sort])

  const filterCount = (temps.size ? 1 : 0) + (flag ? 1 : 0) + (query ? 1 : 0)
  const clearFilters = () => { setTemps(new Set()); setFlag(null); setQuery("") }
  const toggleTemp = (t: Temperature) => setTemps((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n })
  const toggleFlag = (f: Exclude<FlagFilter, null>) => setFlag((x) => (x === f ? null : f))

  const quick = (a: Athlete, patch: AthletePatch, ok?: string) => {
    sector.update(a.id, patch)
      .then(() => { if (ok) toast({ title: ok, description: a.fullName }) })
      .catch((e) => toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" }))
  }
  const setTemp = (a: Athlete, t: Temperature) => { if (a.temperature !== t) quick(a, { temperature: t }, `Agora está ${tempInfo(t).label.toLowerCase()}`) }

  /** Dados de origem da ficha (para "Trazer da origem") e os links para abrir o cadastro ou o membro. */
  const originOf = (a: Athlete): OriginInfo => {
    const lead = a.leadId ? players.find((p) => p.key === `lead:${a.leadId}`) : undefined
    const conta = a.athleteId !== null ? players.find((p) => p.key === `atleta:${a.athleteId}`) : undefined
    const member = a.memberId ? members.find((m) => m.id === a.memberId) : undefined
    const fromPlayer = lead ? pickData(draftFromPlayer(lead)) : conta ? pickData(draftFromPlayer(conta)) : null
    const fromMember = member ? pickData(draftFromMember(member)) : null
    const data = a.origin === "membro" ? mergeData(fromMember, fromPlayer) : mergeData(fromPlayer, fromMember)
    const enc = encodeURIComponent
    const links = [
      lead && { label: inVoxen ? "Abrir o lead na VOXEN" : "Abrir o lead em Cadastros", to: inVoxen ? `/voxen/jogadores/${enc(lead.key)}` : `/admin/cadastros?editar=${enc(lead.key)}` },
      conta && { label: inVoxen ? "Abrir a conta na VOXEN" : "Abrir a conta em Cadastros", to: inVoxen ? `/voxen/jogadores/${enc(conta.key)}` : `/admin/cadastros?editar=${enc(conta.key)}` },
      member && { label: "Abrir o membro", to: inVoxen ? `/voxen/membros/${member.id}` : `/admin/membros?editar=${member.id}` },
    ].filter(Boolean) as OriginInfo["links"]
    return { data, links }
  }

  /* Arrastar entre colunas (só quem pode editar) */
  const onDragStart = (e: DragEvent, a: Athlete) => {
    e.dataTransfer.setData("text/plain", a.id)
    e.dataTransfer.effectAllowed = "move"
    setDragId(a.id)
  }
  const onDrop = (e: DragEvent, t: Temperature) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain") || dragId
    setOverCol(null)
    setDragId(null)
    const a = all.find((x) => x.id === id)
    if (a) setTemp(a, t)
  }

  if (sector.missing) return <SectorSetup />
  if (sector.error && !sector.list) {
    return (
      <section className="vx-card">
        <div className="vx-empty">
          <span className="vx-empty-icon"><AlertTriangle className="h-6 w-6" /></span>
          <strong className="text-white">Não foi possível carregar o setor Atletas</strong>
          <span>{sector.error.message}</span>
          <button type="button" className="vx-btn vx-btn--gold mt-2" onClick={() => void sector.reload()}><RefreshCw /> Tentar de novo</button>
        </div>
      </section>
    )
  }
  if (!sector.list) return <PageSkeleton />

  const kpis: { key: string; label: string; value: number; icon: typeof Medal; color: string; on: boolean; onClick: () => void; warn?: boolean }[] = [
    { key: "total", label: "No setor", value: counts.total, icon: Medal, color: "#fbbf24", on: filterCount === 0, onClick: clearFilters },
    ...[...TEMPS].reverse().map((t) => ({ key: t.key, label: t.plural, value: counts[t.key], icon: t.icon, color: t.color, on: temps.has(t.key), onClick: () => toggleTemp(t.key) })),
    { key: "assessoria", label: "Em assessoria", value: counts.assessoria, icon: BriefcaseBusiness, color: "#34d399", on: flag === "assessoria", onClick: () => toggleFlag("assessoria") },
    { key: "encaminhados", label: "Encaminhados", value: counts.encaminhados, icon: Send, color: "#a78bfa", on: flag === "encaminhados", onClick: () => toggleFlag("encaminhados") },
    { key: "atrasados", label: "Passos atrasados", value: counts.atrasados, icon: AlertTriangle, color: "#f87171", on: flag === "atrasados", onClick: () => toggleFlag("atrasados"), warn: counts.atrasados > 0 },
  ]

  return (
    <>
      <section className="at-kpis" aria-label="Resumo do setor (clique para filtrar)">
        {kpis.map(({ key, label, value, icon: Icon, color, on, onClick, warn }, i) => (
          <button key={key} type="button" className={`at-kpi ${on ? "is-on" : ""} ${warn ? "is-warn" : ""}`} aria-pressed={on} onClick={onClick}
            style={{ "--c": color, "--i": i } as CSSProperties}>
            <span className="at-kpi-icon"><Icon /></span>
            <strong className="tnum">{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <section className="vx-card cn-filters at-toolbar">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" placeholder="Buscar por nome, posição, cidade, clube ou próximo passo" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar no setor" />
        </div>
        <select className="vx-input vx-select vx-filter" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar por">
          {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <div className="vx-tabs" role="group" aria-label="Forma de ver">
          <button type="button" aria-pressed={view === "quadro"} className={`vx-tab ${view === "quadro" ? "is-on" : ""}`} onClick={() => setView("quadro")}><LayoutGrid className="h-4 w-4" /> Quadro</button>
          <button type="button" aria-pressed={view === "lista"} className={`vx-tab ${view === "lista" ? "is-on" : ""}`} onClick={() => setView("lista")}><List className="h-4 w-4" /> Lista</button>
        </div>
        {filterCount > 0 && <button type="button" className="vx-chip" onClick={clearFilters}><X className="h-3.5 w-3.5" /> Limpar filtros</button>}
        {sector.canEdit && <button type="button" className="vx-btn vx-btn--gold" onClick={openAdd}><Plus /> Adicionar atleta</button>}
      </section>

      {all.length === 0 ? (
        <section className="vx-card at-empty">
          <span className="at-empty-icon"><Medal /></span>
          <h2>Nenhum atleta no setor ainda</h2>
          <p>Traga para cá os atletas que a equipe vai trabalhar com mais cuidado. Aqui você marca se cada um está frio, morno ou quente, se foi encaminhado e se está em assessoria.</p>
          {sector.canEdit && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" className="vx-btn vx-btn--gold" onClick={openAdd}><Plus /> Adicionar dos cadastros</button>
            </div>
          )}
          <small>Também dá para usar “Enviar para Atletas” em Cadastros e em Membros.</small>
        </section>
      ) : filtered.length === 0 ? (
        <section className="vx-card">
          <Empty icon={<Search className="h-6 w-6" />} title="Nenhum atleta com esses filtros">
            <button type="button" className="vx-btn mt-2" onClick={clearFilters}>Limpar filtros</button>
          </Empty>
        </section>
      ) : view === "quadro" ? (
        <section className="at-board" aria-label="Quadro por temperatura">
          {TEMPS.filter((t) => !temps.size || temps.has(t.key)).map((t) => {
            const items = filtered.filter((a) => a.temperature === t.key)
            const Icon = t.icon
            return (
              <div key={t.key} className={`at-col ${overCol === t.key ? "is-over" : ""}`} style={{ "--c": t.color } as CSSProperties}
                onDragOver={(e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overCol !== t.key) setOverCol(t.key) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null) }}
                onDrop={(e) => onDrop(e, t.key)}>
                <header className="at-col-head">
                  <span className="at-col-icon"><Icon /></span>
                  <div className="min-w-0 flex-1">
                    <b>{t.plural}</b>
                    <small>{t.hint}</small>
                  </div>
                  <span className="at-col-count tnum">{items.length}</span>
                </header>
                <div className="at-col-body">
                  {items.map((a, i) => (
                    <AthleteCard key={a.id} a={a} index={i} sector={sector} dragging={dragId === a.id} onOpen={() => openFicha(a.id)}
                      onTemp={(x) => setTemp(a, x)} onDragStart={(e) => onDragStart(e, a)} onDragEnd={() => { setDragId(null); setOverCol(null) }} />
                  ))}
                  {!items.length && <p className="at-col-empty">{sector.canEdit ? "Arraste um atleta para cá" : "Ninguém aqui"}</p>}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <section className="vx-card vx-card--flush">
          <div className="cn-tablehead">
            <p><strong className="tnum">{filtered.length}</strong> atleta{filtered.length === 1 ? "" : "s"}{filtered.length !== all.length && <> de <span className="tnum">{all.length}</span></>}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="vx-table cn-table at-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Atleta</th>
                  <th>Temperatura</th>
                  <th>Encaminhado</th>
                  <th>Assessoria</th>
                  <th>Próximo passo</th>
                  <th>No setor</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const wa = whatsappOf(a)
                  return (
                    <tr key={a.id} onClick={() => openFicha(a.id)} style={{ "--c": tempInfo(a.temperature).color } as CSSProperties}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="flex items-center gap-3">
                          <span className="at-avatar-ring"><Avatar name={a.fullName} size={34} /></span>
                          <div className="min-w-0 max-w-[240px]">
                            <button type="button" className="block max-w-full truncate text-left text-[13.5px] font-semibold text-white hover:text-amber-300" onClick={(e) => { e.stopPropagation(); openFicha(a.id) }}>{a.fullName}</button>
                            <div className="truncate text-[11.5px] text-zinc-500">{metaOf(a) || ORIGIN_LABEL[a.origin]}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}><TempPicker value={a.temperature} disabled={!sector.canEdit} onChange={(t) => setTemp(a, t)} label={`Temperatura de ${a.fullName}`} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="at-cell-switch">
                          <button type="button" role="switch" aria-checked={a.forwarded} disabled={!sector.canEdit} className={`cn-switch ${a.forwarded ? "is-on" : ""}`}
                            aria-label={`Encaminhado: ${a.fullName}`} onClick={() => quick(a, a.forwarded ? { forwarded: false } : { forwarded: true, forwardedOn: a.forwardedOn ?? isoDay() }, a.forwarded ? "Encaminhamento desmarcado" : "Marcado como encaminhado")}>
                            <span /> <em>{a.forwarded ? "Sim" : "Não"}</em>
                          </button>
                          {a.forwarded && a.forwardedTo && <small className="truncate" title={a.forwardedTo}>{a.forwardedTo}</small>}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" role="switch" aria-checked={a.advisory} disabled={!sector.canEdit} className={`cn-switch ${a.advisory ? "is-on" : ""}`}
                          aria-label={`Em assessoria: ${a.fullName}`} onClick={() => quick(a, a.advisory ? { advisory: false } : { advisory: true, advisorySince: a.advisorySince ?? isoDay() }, a.advisory ? "Assessoria desmarcada" : "Em trabalho de assessoria")}>
                          <span /> <em>{a.advisory ? "Sim" : "Não"}</em>
                        </button>
                      </td>
                      <td className="max-w-[260px]"><NextStep a={a} /></td>
                      <td className="tnum text-zinc-400" title={a.createdAt}>{formatDate(a.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="ac-actions">
                          {wa && <a className="vx-icon-btn" href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label={`WhatsApp de ${a.fullName}`}><MessageCircle /></a>}
                          <button type="button" className="vx-btn" onClick={() => openFicha(a.id)}>Ficha</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Drawer open={Boolean(ficha)} onClose={closeFicha} title={ficha?.fullName ?? "Ficha"}
        subtitle={ficha ? `${tempInfo(ficha.temperature).label} · ${ficha.advisory ? "em assessoria" : "sem assessoria"} · ${ficha.forwarded ? "encaminhado" : "não encaminhado"}` : undefined}>
        {ficha && <AthleteFile key={ficha.id} a={ficha} sector={sector} origin={originOf(ficha)} onRemoved={closeFicha} />}
      </Drawer>

      <Drawer open={adding} onClose={closeAdd} title="Adicionar ao setor Atletas" subtitle="De preferência quem já está nos cadastros e nos membros. Ou crie a ficha do zero.">
        {adding && <AddAthlete sector={sector} members={members} onOpen={openFicha} />}
      </Drawer>
    </>
  )
}

function AthleteCard({ a, index, sector, dragging, onOpen, onTemp, onDragStart, onDragEnd }: {
  a: Athlete
  index: number
  sector: AthletesHook
  dragging: boolean
  onOpen: () => void
  onTemp: (t: Temperature) => void
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
}) {
  const meta = metaOf(a)
  return (
    <article className={`at-card ${dragging ? "is-dragging" : ""} ${isOverdue(a) ? "is-late" : ""}`} style={{ "--i": Math.min(index, 12) } as CSSProperties}
      draggable={sector.canEdit} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen}>
      <header>
        <span className="at-avatar-ring"><Avatar name={a.fullName} size={38} /></span>
        <div className="min-w-0 flex-1">
          <button type="button" className="at-card-name" onClick={(e) => { e.stopPropagation(); onOpen() }}>{a.fullName}</button>
          <span className="at-card-meta">{meta || "Perfil em branco"}</span>
        </div>
        {sector.canEdit && <GripVertical className="at-grip" aria-hidden="true" />}
      </header>
      <div className="at-card-flags">
        <Flag kind="fwd" on={a.forwarded} onLabel="Encaminhado" offLabel="Não encaminhado" detail={a.forwardedTo} />
        <Flag kind="adv" on={a.advisory} onLabel="Em assessoria" offLabel="Sem assessoria" />
      </div>
      <NextStep a={a} compact />
      <footer>
        <TempPicker value={a.temperature} disabled={!sector.canEdit} onChange={onTemp} label={`Temperatura de ${a.fullName}`} />
        <span className="at-origin">{ORIGIN_LABEL[a.origin]}</span>
      </footer>
    </article>
  )
}
