import "./opportunities.css"

import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, Compass, ExternalLink, Plus, Search, UserMinus, UserPlus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { MemberAvatar } from "@/pages/membros/components/bits"
import { DeadlineChip } from "@/pages/membros/components/ClubCrest"
import { deadlineInfo } from "@/pages/membros/scoutLayer"
import { positionCodeOf, type Member } from "@/pages/membros/model"
import type { ProfileListItem } from "@/pages/membros/api"
import { SetupNotice, useAdminSource, useSourceData } from "../members/shared"
import { ScoutSetupNotice } from "../scout/parts"
import { errMsg, useLoad, useScoutApi, type Club, type Controls, type Opportunity } from "../scout/api"
import { MemberOpportunities } from "./OpportunityParts"
import { isLive, nearest, useNow } from "./model"

type Filter = "todos" | "abertas" | "vencendo" | "sem"

const FILTERS: [Filter, string][] = [["todos", "Todos"], ["abertas", "Com oportunidade"], ["vencendo", "Vencendo"], ["sem", "Sem oportunidade"]]

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/**
 * Oportunidades (/voxen/oportunidades): à esquerda, os jogadores que a equipe escolheu à mão;
 * à direita, as oportunidades do jogador selecionado (escudo, compatibilidade, prazo) e o
 * formulário. No celular, as duas partes viram telas que se alternam.
 */
export default function OpportunitiesPage() {
  const { demo, canScout } = useVoxen()
  const { toast } = useToast()
  const source = useAdminSource()
  const api = useScoutApi(demo)
  const [params, setParams] = useSearchParams()
  const selectedId = params.get("jogador")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [adding, setAdding] = useState(false)
  const now = useNow(60_000)

  const members = useSourceData(source, (s) => s.listProfiles(), [])
  const data = useLoad(api, async (a) => {
    const [controls, opportunities, clubs] = await Promise.all([a.controls(), a.opportunities(), a.clubs()])
    return { controls, opportunities, clubs }
  }, [])

  const byId = useMemo(() => new Map((members.data ?? []).map((m) => [m.id, m])), [members.data])

  // Na lista: escolhido à mão ou com alguma oportunidade.
  const listed = useMemo(() => {
    if (!data.data) return []
    const ids = new Set<string>([
      ...data.data.controls.filter((c) => c.shortlistedAt).map((c) => c.memberId),
      ...data.data.opportunities.map((o) => o.memberId),
    ])
    return [...ids].map((id) => byId.get(id)).filter((m): m is ProfileListItem => Boolean(m))
  }, [data.data, byId])

  const rows = useMemo(() => {
    const opps = data.data?.opportunities ?? []
    const q = norm(query.trim())
    return listed
      .map((m) => {
        const mine = opps.filter((o) => o.memberId === m.id)
        const near = nearest(mine, now)
        return { m, open: mine.filter(isLive).length, near, info: near ? deadlineInfo(near.deadline, now) : null }
      })
      .filter(({ m, open, info }) =>
        (!q || norm(`${m.fullName} ${m.position ?? ""} ${m.category ?? ""} ${m.team ?? ""}`).includes(q))
        && (filter === "todos" || (filter === "abertas" && open > 0) || (filter === "sem" && open === 0)
          || (filter === "vencendo" && info !== null && (info.tone === "urgent" || info.tone === "soon"))))
      .sort((a, b) => (a.near?.deadline ?? "9999").localeCompare(b.near?.deadline ?? "9999") || a.m.fullName.localeCompare(b.m.fullName))
  }, [listed, data.data, query, filter, now])

  const selected = selectedId ? byId.get(selectedId) ?? null : null
  const select = (id: string | null) => setParams(id ? { jogador: id } : {}, { replace: false })

  const setControls = (c: Controls) => data.set((d) => (d ? { ...d, controls: d.controls.some((x) => x.memberId === c.memberId) ? d.controls.map((x) => (x.memberId === c.memberId ? c : x)) : [...d.controls, c] } : d))
  const setOpps = (next: Opportunity[]) => data.set((d) => (d ? { ...d, opportunities: next } : d))
  const addClub = (c: Club) => data.set((d) => (d ? { ...d, clubs: d.clubs.some((x) => x.id === c.id) ? d.clubs.map((x) => (x.id === c.id ? c : x)) : [...d.clubs, c] } : d))

  const shortlist = async (m: Member, on: boolean) => {
    if (!api) return
    try {
      setControls(await api.saveControls(m.id, { shortlistedAt: on ? new Date().toISOString() : null }))
      if (on) select(m.id)
      else if (selectedId === m.id) select(null)
      toast({ title: on ? `${m.fullName} entrou na lista` : `${m.fullName} saiu da lista` })
    } catch (e) {
      toast({ title: "Não foi possível atualizar a lista", description: errMsg(e), variant: "destructive" })
    }
  }

  if (members.error) return <SetupNotice error={members.error} />
  if (data.error) return <ScoutSetupNotice error={data.error} />
  if (!api || !data.data || (members.loading && !members.data)) return <PageSkeleton />

  const selectedOpps = selected ? data.data.opportunities.filter((o) => o.memberId === selected.id) : []
  const canRemove = selected && !selectedOpps.some(isLive)

  return (
    <div className={`op-page ${selected ? "has-selection" : ""}`}>
      <aside className="vx-card vx-card--flush op-list" aria-label="Jogadores com oportunidades">
        <div className="op-list-head">
          <div className="flex items-center justify-between gap-2">
            <h2 className="vx-card-title">Jogadores</h2>
            {canScout && <button type="button" className="vx-btn vx-btn--gold h-8" onClick={() => setAdding(true)}><UserPlus /> Adicionar</button>}
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input className="vx-input vx-input--icon" placeholder="Buscar jogador" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar jogador" />
          </div>
          <div className="vx-chips mt-3" role="group" aria-label="Filtrar">
            {FILTERS.map(([k, label]) => <button key={k} type="button" className={`vx-chip ${filter === k ? "is-on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}
          </div>
        </div>
        {rows.length ? (
          <ul className="op-rows vx-stagger">
            {rows.map(({ m, open, info }, i) => (
              <li key={m.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <button type="button" className={`op-row ${selectedId === m.id ? "is-on" : ""}`} onClick={() => select(m.id)} aria-current={selectedId === m.id || undefined}>
                  <MemberAvatar member={m} size={38} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{m.fullName}</b>
                    <small className="block truncate">{[positionCodeOf(m.position), m.category].filter((x) => x && x !== "—").join(" · ") || "Sem posição"} · {open ? `${open} em andamento` : "sem oportunidade"}</small>
                  </span>
                  {info && info.tone !== "ok" && <DeadlineChip {...info} />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={<Compass className="h-6 w-6" />} title={listed.length ? "Ninguém neste filtro" : "Nenhum jogador na lista"}>
            {listed.length ? "Troque o filtro ou a busca." : "Use “Adicionar” para escolher os jogadores que a equipe vai trabalhar."}
          </Empty>
        )}
      </aside>

      <section className="op-detail" aria-live="polite">
        {selected ? (
          <div key={selected.id} className="op-detail-in">
            <div className="vx-card op-player">
              <button type="button" className="vx-icon-btn op-back" onClick={() => select(null)} aria-label="Voltar à lista"><ArrowLeft /></button>
              <MemberAvatar member={selected} size={56} ring="#fbbf24" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate">{selected.fullName}</h2>
                <p>{[selected.position, selected.category, selected.team, selected.city].filter(Boolean).join(" · ") || "Complete os dados na ficha"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/voxen/membros/${selected.id}?aba=oportunidades`} className="vx-btn h-8"><ExternalLink /> Ficha</Link>
                {canScout && canRemove && <button type="button" className="vx-btn h-8" onClick={() => void shortlist(selected, false)}><UserMinus /> Tirar da lista</button>}
              </div>
            </div>
            <MemberOpportunities api={api} member={selected} opportunities={data.data.opportunities} clubs={data.data.clubs} onChanged={setOpps} onClubsChanged={addClub} />
          </div>
        ) : (
          <div className="vx-card op-pick">
            <Empty icon={<Compass className="h-6 w-6" />} title="Escolha um jogador">
              Ao lado ficam os jogadores que a equipe escolheu. Selecione um para ver e criar as oportunidades dele: clube, compatibilidade e prazo.
            </Empty>
          </div>
        )}
      </section>

      <AddPlayer open={adding} onOpenChange={setAdding} members={members.data ?? []} listed={new Set(listed.map((m) => m.id))}
        onPick={(m) => { setAdding(false); void shortlist(m, true) }} />
    </div>
  )
}

/** Escolher um jogador da base para a lista de oportunidades. */
function AddPlayer({ open, onOpenChange, members, listed, onPick }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  members: ProfileListItem[]
  listed: Set<string>
  onPick: (m: Member) => void
}) {
  const [query, setQuery] = useState("")
  const q = norm(query.trim())
  const options = members
    .filter((m) => m.kind === "membro" && m.active && !listed.has(m.id))
    .filter((m) => !q || norm(`${m.fullName} ${m.email ?? ""} ${m.position ?? ""} ${m.city ?? ""} ${m.team ?? ""}`).includes(q))
    .slice(0, 60)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vx-portal op-add max-w-lg p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Adicionar jogador à lista</DialogTitle>
        <div className="op-add-head">
          <b>Adicionar jogador</b>
          <button type="button" className="vx-icon-btn h-8 w-8" onClick={() => onOpenChange(false)} aria-label="Fechar"><X /></button>
        </div>
        <div className="relative px-4">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" autoFocus placeholder="Nome, e-mail, posição, cidade ou time" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar na base" />
        </div>
        <ul className="op-add-list">
          {options.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onPick(m)}>
                <MemberAvatar member={m} size={34} />
                <span className="min-w-0 flex-1"><b className="block truncate">{m.fullName}</b><small className="block truncate">{[m.position, m.category, m.city].filter(Boolean).join(" · ") || m.email}</small></span>
                <Plus className="text-amber-300" />
              </button>
            </li>
          ))}
          {!options.length && <li className="op-picker-empty">Ninguém encontrado.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
