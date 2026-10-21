import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react"
import {
  Archive, CalendarClock, Check, Eye, EyeOff, Loader2, Lock, Pencil, Plus, RotateCcw, Send, Sparkles, Trash2, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Ring } from "@/pages/voxen/charts"
import { Empty } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import type { Club as CatalogClub } from "@/data/clubs"
import { ClubCrest, DeadlineChip } from "@/pages/membros/components/ClubCrest"
import { deadlineInfo, shortDay, type OpportunityStatus } from "@/pages/membros/scoutLayer"
import type { Member } from "@/pages/membros/model"
import { errMsg, type Club, type Opportunity, type OpportunityInput, type ScoutApi } from "../scout/api"
import { ClubPicker, loadCatalog } from "./ClubPicker"
import { STATUS_LABEL, countdown, isLive, suggestCompatibility, useNow } from "./model"

const compatColor = (v: number) => (v >= 90 ? "#34d399" : v >= 80 ? "#fbbf24" : v >= 70 ? "#fb923c" : "#a1a1aa")

/** Uma oportunidade: escudo, clube, anel de compatibilidade, prazo vivo e as ações da equipe. */
export function OpportunityCard({ o, index, busy, onAction, onEdit }: {
  o: Opportunity
  index: number
  busy: boolean
  onAction: (o: Opportunity, patch: Partial<OpportunityInput> | "excluir") => void
  onEdit: (o: Opportunity) => void
}) {
  const { canScout, canAdmin } = useVoxen()
  const now = useNow()
  const info = deadlineInfo(o.deadline, now)
  const clock = isLive(o) ? countdown(o.deadline, now) : null
  const [asking, setAsking] = useState(false)
  const club = o.club ?? { name: "Clube", crestUrl: null, emblem: null, color: null }

  return (
    <article className={`op-card is-${o.status} ${o.published ? "is-pub" : ""}`} style={{ "--i": Math.min(index, 10) } as CSSProperties}>
      <div className="op-card-main">
        <ClubCrest club={club} size={52} pop />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate">{club.name}</h3>
            <span className={`op-status is-${o.status}`}>{STATUS_LABEL[o.status]}</span>
            <span className={`op-pub ${o.published ? "is-on" : ""}`}>{o.published ? <><Eye /> O atleta vê</> : <><EyeOff /> Rascunho</>}</span>
          </div>
          <p className="op-card-meta">{[o.club?.country, o.club?.league].filter(Boolean).join(" · ") || "Clube da equipe"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DeadlineChip {...info} />
            {o.deadline && <span className="op-date"><CalendarClock /> {shortDay(o.deadline)}</span>}
            {clock && info.tone !== "ok" && <span className={`op-clock is-${info.tone}`} aria-live="off">{clock}</span>}
          </div>
        </div>
        <Ring value={o.compatibility} max={100} size={70} stroke={6} color={compatColor(o.compatibility)}>
          <span className="op-ring-n tnum">{o.compatibility}<small>%</small></span>
        </Ring>
      </div>

      {(o.athleteNote || o.internalNote) && (
        <div className="op-notes">
          {o.athleteNote && <p><b>Para o atleta:</b> {o.athleteNote}</p>}
          {o.internalNote && <p className="is-internal"><Lock /> <b>Só a equipe:</b> {o.internalNote}</p>}
        </div>
      )}

      {canScout && (
        <div className="op-actions">
          <button type="button" className={`vx-btn h-8 ${o.published ? "" : "vx-btn--gold"}`} disabled={busy || !isLive(o)} onClick={() => onAction(o, { published: !o.published })}
            title={isLive(o) ? undefined : "Reabra para publicar"}>
            {o.published ? <><EyeOff /> Despublicar</> : <><Eye /> Publicar</>}
          </button>
          {o.status === "aberta" && <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "enviada" })}><Send /> Marcar como enviada</button>}
          {isLive(o)
            ? <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "encerrada", published: false })}><Archive /> Encerrar</button>
            : <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "aberta" })}><RotateCcw /> Reabrir</button>}
          <button type="button" className="vx-icon-btn h-8 w-8" disabled={busy} onClick={() => onEdit(o)} aria-label="Editar oportunidade" title="Editar"><Pencil /></button>
          {canAdmin && (asking
            ? <span className="op-confirm">Excluir? <button type="button" className="vx-btn h-8 op-danger" onClick={() => onAction(o, "excluir")}>Excluir</button><button type="button" className="vx-btn h-8" onClick={() => setAsking(false)}>Não</button></span>
            : <button type="button" className="vx-icon-btn h-8 w-8 op-danger-icon" disabled={busy} onClick={() => setAsking(true)} aria-label="Excluir oportunidade" title="Excluir"><Trash2 /></button>)}
          {busy && <Loader2 className="op-spin text-zinc-500" />}
        </div>
      )}
    </article>
  )
}

/** Criar ou editar uma oportunidade. A compatibilidade sugerida é só sugestão: o Scout decide. */
export function OpportunityForm({ api, member, clubs, initial, onClubsChanged, onSaved, onCancel }: {
  api: ScoutApi
  member: Pick<Member, "id" | "fullName" | "position">
  clubs: Club[]
  initial: Opportunity | null
  onClubsChanged: (c: Club) => void
  onSaved: (o: Opportunity) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [club, setClub] = useState<Club | null>(initial?.club ?? null)
  const [compat, setCompat] = useState(initial?.compatibility ?? 85)
  const [deadline, setDeadline] = useState(initial?.deadline ?? "")
  const [status, setStatus] = useState<OpportunityStatus>(initial?.status ?? "aberta")
  const [published, setPublished] = useState(initial?.published ?? false)
  const [athleteNote, setAthleteNote] = useState(initial?.athleteNote ?? "")
  const [internalNote, setInternalNote] = useState(initial?.internalNote ?? "")
  const [saving, setSaving] = useState(false)
  const [catalog, setCatalog] = useState<CatalogClub[]>([])

  useEffect(() => { void loadCatalog().then(setCatalog) }, [])
  const style = useMemo(() => (club?.catalogId ? catalog.find((c) => c.id === club.catalogId)?.preferredStyle ?? null : null), [club, catalog])
  const suggestion = suggestCompatibility(member.position, style)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!club || saving) return
    setSaving(true)
    try {
      const saved = await api.saveOpportunity({
        id: initial?.id, memberId: member.id, clubId: club.id, compatibility: compat, deadline: deadline || null,
        status, published: published && (status === "aberta" || status === "enviada"), athleteNote, internalNote,
      })
      toast({ title: initial ? "Oportunidade salva" : "Oportunidade criada", description: saved.published ? `${member.fullName} já vê no Início e em Oportunidades.` : "Ainda é rascunho: só a equipe vê." })
      onSaved(saved)
    } catch (err) {
      toast({ title: "Não foi possível salvar", description: errMsg(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="op-form" onSubmit={(e) => void submit(e)}>
      <div className="op-form-head">
        <h3>{initial ? "Editar oportunidade" : "Nova oportunidade"}</h3>
        <button type="button" className="vx-icon-btn h-8 w-8" onClick={onCancel} aria-label="Fechar"><X /></button>
      </div>

      <label className="op-field">
        <span>Clube</span>
        <ClubPicker api={api} clubs={clubs} value={club} onPick={setClub} onClubsChanged={onClubsChanged} />
      </label>

      <div className="op-field">
        <span className="flex items-center justify-between">
          <span>Compatibilidade</span>
          <b className="tnum" style={{ color: compatColor(compat) }}>{compat}%</b>
        </span>
        <input type="range" min={0} max={100} value={compat} onChange={(e) => setCompat(Number(e.target.value))} className="op-range" aria-label="Compatibilidade"
          style={{ "--v": `${compat}%`, "--c": compatColor(compat) } as CSSProperties} />
        {suggestion && (
          <p className="op-suggest">
            <Sparkles /> Sugestão: <b>{suggestion.value}%</b>, porque {suggestion.why}.
            {suggestion.value !== compat && <button type="button" onClick={() => setCompat(suggestion.value)}>Usar a sugestão</button>}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="op-field">
          <span>Prazo</span>
          <input className="vx-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        {initial && (
          <label className="op-field">
            <span>Situação</span>
            <select className="vx-input vx-select" value={status} onChange={(e) => setStatus(e.target.value as OpportunityStatus)}>
              {(Object.keys(STATUS_LABEL) as OpportunityStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
        )}
      </div>

      <label className="op-field">
        <span>Recado para o atleta <em>aparece na área dele</em></span>
        <textarea className="vx-input vx-textarea op-textarea" value={athleteNote} onChange={(e) => setAthleteNote(e.target.value)} maxLength={600} placeholder="Ex.: A base procura um meia canhoto para a avaliação de novembro." />
      </label>
      <label className="op-field">
        <span><Lock className="inline h-3 w-3" /> Nota interna <em>só a equipe vê</em></span>
        <textarea className="vx-input vx-textarea op-textarea" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} maxLength={2000} placeholder="Contato no clube, combinados, próximos passos..." />
      </label>

      <label className={`op-publish ${published ? "is-on" : ""}`}>
        <input type="checkbox" className="sr-only" checked={published} onChange={(e) => setPublished(e.target.checked)} disabled={status === "encerrada" || status === "recusada"} />
        <span className="op-switch" aria-hidden="true"><i /></span>
        <span><b>{published ? "Publicada" : "Rascunho"}</b><small>{published ? "O atleta vê esta oportunidade no Início e em Oportunidades." : "Só a equipe vê até você publicar."}</small></span>
      </label>
      <p className="op-disclaimer">A compatibilidade é o julgamento da equipe. A Zyron não garante teste, vaga ou contrato.</p>

      <div className="flex justify-end gap-2">
        <button type="button" className="vx-btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="vx-btn vx-btn--gold" disabled={!club || saving}>{saving ? <Loader2 className="op-spin" /> : <Check />} {initial ? "Salvar" : "Criar oportunidade"}</button>
      </div>
    </form>
  )
}

/** As oportunidades de um jogador, com o formulário: o painel da aba Oportunidades e a aba da ficha. */
export function MemberOpportunities({ api, member, opportunities, clubs, onChanged, onClubsChanged }: {
  api: ScoutApi
  member: Pick<Member, "id" | "fullName" | "position">
  opportunities: Opportunity[]
  clubs: Club[]
  onChanged: (next: Opportunity[]) => void
  onClubsChanged: (c: Club) => void
}) {
  const { canScout } = useVoxen()
  const { toast } = useToast()
  const [editing, setEditing] = useState<Opportunity | "nova" | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const mine = opportunities.filter((o) => o.memberId === member.id)
  const ordered = [...mine].sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))

  const act = async (o: Opportunity, patch: Partial<OpportunityInput> | "excluir") => {
    setBusy(o.id)
    try {
      if (patch === "excluir") {
        await api.deleteOpportunity(o.id)
        onChanged(opportunities.filter((x) => x.id !== o.id))
        toast({ title: "Oportunidade excluída" })
        return
      }
      const saved = await api.saveOpportunity({
        id: o.id, memberId: o.memberId, clubId: o.clubId, compatibility: o.compatibility, deadline: o.deadline, status: o.status,
        published: o.published, athleteNote: o.athleteNote, internalNote: o.internalNote, ...patch,
      })
      onChanged(opportunities.map((x) => (x.id === saved.id ? saved : x)))
      toast({
        title: patch.published === true ? "Publicada" : patch.published === false && patch.status === undefined ? "Voltou para rascunho"
          : patch.status === "enviada" ? "Marcada como enviada" : patch.status === "encerrada" ? "Oportunidade encerrada" : "Oportunidade reaberta",
        description: patch.published === true ? `${member.fullName} já vê no Início.` : undefined,
      })
    } catch (err) {
      toast({ title: "Não foi possível atualizar", description: errMsg(err), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="op-member">
      {editing && (
        <OpportunityForm key={editing === "nova" ? "nova" : editing.id} api={api} member={member} clubs={clubs} initial={editing === "nova" ? null : editing}
          onClubsChanged={onClubsChanged} onCancel={() => setEditing(null)}
          onSaved={(saved) => {
            onChanged(opportunities.some((x) => x.id === saved.id) ? opportunities.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...opportunities])
            setEditing(null)
          }} />
      )}
      {!editing && canScout && <button type="button" className="vx-btn vx-btn--gold mb-4" onClick={() => setEditing("nova")}><Plus /> Nova oportunidade</button>}
      {ordered.length ? (
        <div className="op-cards">
          {ordered.map((o, i) => <OpportunityCard key={o.id} o={o} index={i} busy={busy === o.id} onAction={(x, p) => void act(x, p)} onEdit={setEditing} />)}
        </div>
      ) : !editing && (
        <div className="vx-card">
          <Empty icon={<Sparkles className="h-6 w-6" />} title="Nenhuma oportunidade ainda">
            Crie a primeira: escolha o clube, a compatibilidade e o prazo. Ela só aparece para o atleta quando você publicar.
          </Empty>
        </div>
      )}
    </div>
  )
}
