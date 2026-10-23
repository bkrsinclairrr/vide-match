import { useState, type CSSProperties } from "react"
import {
  Archive, Briefcase, CalendarClock, Check, ChevronDown, Copy, Eye, EyeOff, Flame, Loader2, Lock, Pencil, Plus, RotateCcw, Sparkles, ThumbsDown, Trash2, Wallet,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Ring } from "@/pages/voxen/charts"
import { POSITIONS } from "@/pages/voxen/data"
import { Empty } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { ClubCrest, DeadlineChip } from "@/pages/membros/components/ClubCrest"
import { deadlineInfo, shortDay, type OpportunityStatus } from "@/pages/membros/scoutLayer"
import { errMsg, proposalOf, type Club, type Opportunity, type OpportunityInput, type ScoutApi } from "../scout/api"
import { BENEFIT_ICON, KIND_ICON, OpportunityDialog, untilLabel, type OppMember } from "./OpportunityDialog"
import { STATUS_LABEL, STEPS, countdown, isLive, useNow } from "./model"
import {
  BENEFIT_LABEL, KIND_LABEL, URGENCY_COLOR, URGENCY_TAG, facts, formatMoney, formatShort, headline, monthlyEquivalent, proposalText, rankDeals,
  summarizeDeals, type DealSummary,
} from "./proposal"

const compatColor = (v: number) => (v >= 90 ? "#34d399" : v >= 80 ? "#fbbf24" : v >= 70 ? "#fb923c" : "#a1a1aa")

/** Os quatro passos do caminho de uma oportunidade; clicar leva a oportunidade até aquele passo. */
function Steps({ status, canEdit, busy, onPick }: { status: OpportunityStatus; canEdit: boolean; busy: boolean; onPick: (s: OpportunityStatus) => void }) {
  const idx = STEPS.indexOf(status)
  const closed = idx < 0
  const labels: Record<string, string> = { aberta: "Aberta", enviada: "Perfil enviado", negociacao: "Em negociação", aceita: "Aceita" }
  return (
    <ol className={`op-steps ${closed ? "is-closed" : ""}`} aria-label="Andamento da oportunidade">
      {STEPS.map((s, i) => {
        const done = !closed && i < idx
        const cur = !closed && i === idx
        return (
          <li key={s} className={`${done ? "is-done" : ""} ${cur ? "is-cur" : ""}`}>
            <button type="button" disabled={!canEdit || busy || cur} onClick={() => onPick(s)} aria-current={cur ? "step" : undefined}
              title={canEdit && !cur ? `Mover para “${labels[s]}”` : undefined}>
              <span className="op-step-dot">{done ? <Check /> : i + 1}</span>
              <span className="op-step-label">{labels[s]}</span>
            </button>
          </li>
        )
      })}
      {closed && <li className="op-step-end"><span className={`op-status is-${status}`}>{STATUS_LABEL[status]}</span></li>}
    </ol>
  )
}

/** Uma oportunidade: o clube, a proposta em destaque, a vaga, o prazo vivo, a urgência, o andamento e as ações da equipe. */
export function OpportunityCard({ o, index, busy, onAction, onEdit }: {
  o: Opportunity
  index: number
  busy: boolean
  onAction: (o: Opportunity, patch: Partial<OpportunityInput> | "excluir") => void
  onEdit: (o: Opportunity) => void
}) {
  const { canScout, canAdmin } = useVoxen()
  const { toast } = useToast()
  const now = useNow()
  const info = deadlineInfo(o.deadline, now)
  const live = isLive(o)
  const clock = live ? countdown(o.deadline, now) : null
  const [asking, setAsking] = useState(false)
  const club = o.club ?? { name: "Clube", crestUrl: null, emblem: null, color: null, country: null, league: null }
  const head = headline(o)
  const lines = facts(o)
  const monthly = monthlyEquivalent(o)
  const KindIcon = o.kind ? KIND_ICON[o.kind] : null
  const color = URGENCY_COLOR[o.urgency]
  const code = o.position ? POSITIONS[o.position]?.code ?? null : null
  const mustAct = live && o.urgency === "urgente"

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(proposalText(o))
      toast({ title: "Resumo copiado", description: "Cole numa conversa. O valor é só da equipe: confira para quem você manda." })
    } catch {
      toast({ title: "Não foi possível copiar", description: "O navegador bloqueou a cópia.", variant: "destructive" })
    }
  }

  const move = (s: OpportunityStatus) => onAction(o, s === "aceita" ? { status: s, published: false } : { status: s })

  return (
    <article className={`op-deal is-${o.status} ${o.published ? "is-pub" : ""} ${live ? "is-live" : ""}`} style={{ "--i": Math.min(index, 10), "--u": color } as CSSProperties}>
      <div className="op-deal-main">
        <ClubCrest club={club} size={54} pop />
        <div className="min-w-0 flex-1">
          <div className="op-deal-title">
            <h3 className="truncate">{club.name}</h3>
            <span className={`op-status is-${o.status}`}>{STATUS_LABEL[o.status]}</span>
            <span className={`op-pub ${o.published ? "is-on" : ""}`}>{o.published ? <><Eye /> O atleta vê</> : <><EyeOff /> Rascunho</>}</span>
          </div>
          <p className="op-card-meta">{[club.country, club.league].filter(Boolean).join(" · ") || "Clube da equipe"}</p>
        </div>
        <Ring value={o.compatibility} max={100} size={64} stroke={6} color={compatColor(o.compatibility)}>
          <span className="op-ring-n tnum">{o.compatibility}<small>%</small></span>
        </Ring>
      </div>

      <div className="op-offer">
        <div className="op-offer-money">
          <span className="op-offer-label"><Wallet /> Proposta</span>
          {head.value
            ? <b className="tnum">{head.value}<small>{head.unit}</small></b>
            : <b className="is-empty">A combinar</b>}
          {(lines.length > 0 || (head.value && o.period !== "mes" && monthly)) && (
            <span className="op-offer-lines">
              {[...lines, ...(head.value && o.period !== "mes" && monthly ? [`≈ ${formatMoney(monthly, o.currency)}/mês`] : [])].join(" · ")}
            </span>
          )}
        </div>
        <div className="op-offer-deadline">
          <span className="op-offer-label"><CalendarClock /> Prazo de resposta</span>
          <b className="tnum">{o.deadline ? shortDay(o.deadline) : "—"}</b>
          <span className="op-offer-lines" title={untilLabel(o.deadline)}>
            {o.deadline ? <><DeadlineChip {...info} />{clock && info.tone !== "ok" && <span className={`op-clock is-${info.tone}`} aria-live="off">{clock}</span>}</> : "Sem prazo para responder"}
          </span>
        </div>
      </div>

      <div className="op-facts">
        <span className={`op-urg ${mustAct ? "is-hot" : ""}`} style={{ "--c": color, "--cb": `${color}22`, "--cl": `${color}66` } as CSSProperties} title="Urgência definida pela equipe">
          {o.urgency === "urgente" || o.urgency === "alta" ? <Flame /> : <i aria-hidden="true" />} {URGENCY_TAG[o.urgency]}
        </span>
        {o.position && <span className="op-fact is-pos">{code && <i>{code}</i>}{o.position}</span>}
        {o.category && <span className="op-fact">{o.category}</span>}
        {o.kind && KindIcon && <span className="op-fact"><KindIcon /> {KIND_LABEL[o.kind]}</span>}
        {o.benefits.map((b) => {
          const Icon = BENEFIT_ICON[b]
          return <span key={b} className="op-fact is-benefit"><Icon /> {BENEFIT_LABEL[b]}</span>
        })}
      </div>

      <Steps status={o.status} canEdit={canScout} busy={busy} onPick={move} />

      {(o.athleteNote || o.internalNote) && (
        <div className="op-notes">
          {o.athleteNote && <p><b>Para o atleta:</b> {o.athleteNote}</p>}
          {o.internalNote && <p className="is-internal"><Lock /> <b>Só a equipe:</b> {o.internalNote}</p>}
        </div>
      )}

      {canScout && (
        <div className="op-actions vx-no-print">
          <button type="button" className={`vx-btn h-8 ${o.published ? "" : "vx-btn--gold"}`} disabled={busy || !live} onClick={() => onAction(o, { published: !o.published })}
            title={live ? undefined : "Reabra para publicar"}>
            {o.published ? <><EyeOff /> Despublicar</> : <><Eye /> Publicar</>}
          </button>
          {live
            ? <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "encerrada", published: false })}><Archive /> Encerrar</button>
            : <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "aberta" })}><RotateCcw /> Reabrir</button>}
          {live && <button type="button" className="vx-btn h-8" disabled={busy} onClick={() => onAction(o, { status: "recusada", published: false })} title="O clube ou o atleta disse não"><ThumbsDown /> Recusada</button>}
          <button type="button" className="vx-btn h-8" onClick={() => void copy()} title="Copiar o resumo para colar numa conversa"><Copy /> Copiar resumo</button>
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

/** Os números de cima: quantas estão andando, a maior proposta, o próximo prazo e quantas pedem atenção. */
export function DealKpis({ s, total }: { s: DealSummary; total: number }) {
  const best = s.best[0]
  const days = s.nextDeadline?.days ?? null
  return (
    <div className="op-kpis">
      <div className="op-kpi">
        <span><Briefcase /> Em andamento</span>
        <b className="tnum">{s.live}</b>
        <small>{total === s.live ? "todas" : `de ${total} no total`}</small>
      </div>
      <div className="op-kpi">
        <span><Wallet /> Maior proposta</span>
        <b className="tnum">{best ? formatShort(best.monthly, best.currency) : "—"}</b>
        <small>{best ? `por mês${s.best.length > 1 ? ` · mais ${s.best.length - 1} em outra moeda` : ""}` : "nenhum valor informado"}</small>
      </div>
      <div className={`op-kpi ${days !== null && days <= 3 ? "is-alert" : ""}`}>
        <span><CalendarClock /> Próximo prazo</span>
        <b className="tnum">{s.nextDeadline ? shortDay(s.nextDeadline.deadline) : "—"}</b>
        <small>{days === null ? "nenhum prazo em aberto" : days === 0 ? "é hoje" : days === 1 ? "amanhã" : `em ${days} dias`}</small>
      </div>
      <div className={`op-kpi ${s.urgent ? "is-alert" : ""}`}>
        <span><Flame /> Pedem atenção</span>
        <b className="tnum">{s.urgent}</b>
        <small>urgência alta ou prazo curto</small>
      </div>
    </div>
  )
}

const toastTitle = (patch: Partial<OpportunityInput>) =>
  patch.published === true ? "Publicada"
    : patch.status === "enviada" ? "Marcada como enviada"
      : patch.status === "negociacao" ? "Em negociação"
        : patch.status === "aceita" ? "Marcada como aceita"
          : patch.status === "recusada" ? "Marcada como recusada"
            : patch.status === "encerrada" ? "Oportunidade encerrada"
              : patch.status === "aberta" ? "Oportunidade reaberta"
                : "Voltou para rascunho"

/** As oportunidades de um jogador, com a janela de criar e editar: o painel da aba Oportunidades, a ficha do Scout e a ficha do jogador. */
export function MemberOpportunities({ api, member, opportunities, clubs, onChanged, onClubsChanged }: {
  api: ScoutApi
  member: OppMember
  opportunities: Opportunity[]
  clubs: Club[]
  onChanged: (next: Opportunity[]) => void
  onClubsChanged: (c: Club) => void
}) {
  const { canScout } = useVoxen()
  const { toast } = useToast()
  const now = useNow(60_000)
  const [editing, setEditing] = useState<Opportunity | "nova" | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const mine = opportunities.filter((o) => o.memberId === member.id)
  const ranked = rankDeals(mine)
  const going = ranked.filter(isLive)
  const closed = ranked.filter((o) => !isLive(o))
  const summary = summarizeDeals(mine, now)

  const act = async (o: Opportunity, patch: Partial<OpportunityInput> | "excluir") => {
    setBusy(o.id)
    try {
      if (patch === "excluir") {
        await api.deleteOpportunity(o.id)
        onChanged(opportunities.filter((x) => x.id !== o.id))
        toast({ title: "Oportunidade excluída" })
        return
      }
      // Sair das em andamento (aceita, recusada, encerrada) tira da área do atleta.
      const leaving = patch.status !== undefined && patch.status !== "aberta" && patch.status !== "enviada" && patch.status !== "negociacao"
      const saved = await api.saveOpportunity({
        ...proposalOf(o), id: o.id, memberId: o.memberId, clubId: o.clubId, compatibility: o.compatibility, deadline: o.deadline, status: o.status,
        published: o.published, athleteNote: o.athleteNote, internalNote: o.internalNote, ...patch, ...(leaving ? { published: false } : {}),
      })
      onChanged(opportunities.map((x) => (x.id === saved.id ? saved : x)))
      toast({ title: toastTitle(patch), description: patch.published === true ? `${member.fullName} já vê no Início.` : undefined })
    } catch (err) {
      toast({ title: "Não foi possível atualizar", description: errMsg(err), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  const saved = (list: Opportunity[]) => {
    const next = [...opportunities]
    for (const s of list) {
      const i = next.findIndex((x) => x.id === s.id)
      if (i >= 0) next[i] = s
      else next.unshift(s)
    }
    onChanged(next)
  }

  return (
    <div className="op-member">
      {mine.length > 0 && <DealKpis s={summary} total={mine.length} />}

      {canScout && (
        <div className="op-toolbar vx-no-print">
          <button type="button" className="vx-btn vx-btn--gold" onClick={() => setEditing("nova")}><Plus /> Nova oportunidade</button>
          <span>Escolha um clube ou vários, com valor, posição, urgência e prazo de resposta.</span>
        </div>
      )}

      {going.length > 0 && (
        <div className="op-cards">
          {going.map((o, i) => <OpportunityCard key={o.id} o={o} index={i} busy={busy === o.id} onAction={(x, p) => void act(x, p)} onEdit={setEditing} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="op-closed">
          <button type="button" className="op-closed-toggle" aria-expanded={showClosed} onClick={() => setShowClosed((v) => !v)}>
            <ChevronDown className={showClosed ? "is-open" : ""} /> Aceitas, encerradas e recusadas <span className="tnum">{closed.length}</span>
          </button>
          {showClosed && (
            <div className="op-cards">
              {closed.map((o, i) => <OpportunityCard key={o.id} o={o} index={i} busy={busy === o.id} onAction={(x, p) => void act(x, p)} onEdit={setEditing} />)}
            </div>
          )}
        </div>
      )}

      {!mine.length && (
        <div className="vx-card">
          <Empty icon={<Sparkles className="h-6 w-6" />} title="Nenhuma oportunidade ainda">
            Crie a primeira: escolha o clube, a proposta, a posição e o prazo de resposta. Ela só aparece para o atleta quando você publicar.
          </Empty>
        </div>
      )}

      {canScout && (
        <OpportunityDialog open={editing !== null} api={api} member={member} clubs={clubs} initial={editing && editing !== "nova" ? editing : null}
          onClubsChanged={onClubsChanged} onSaved={saved} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

