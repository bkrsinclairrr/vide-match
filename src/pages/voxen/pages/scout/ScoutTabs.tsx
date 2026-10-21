import "../opportunities/opportunities.css"
import "./scout.css"

import { useState, type ReactNode } from "react"
import {
  BadgeCheck, CalendarClock, Check, CheckCircle2, Clapperboard, Database, Eye, History, Lock, LockOpen, Pencil, RefreshCw, Sparkles, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Empty, Skeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { LOCK_KEYS, LOCK_LABEL, youtubeThumb, type LockKey, type LockState } from "@/pages/membros/scoutLayer"
import { formatMatchDate, type Match, type Member } from "@/pages/membros/model"
import { memberAreaUrl } from "../members/shared"
import { MemberOpportunities } from "../opportunities/OpportunityParts"
import { STATUS_LABEL } from "../opportunities/model"
import { BodyPhotoEditor } from "./BodyPhotoEditor"
import { ScoutSetupNotice } from "./parts"
import {
  FIELD_LABEL, errMsg, useLoad, useScoutApi, type Club, type Conflict, type ContextPatch, type Controls, type MemberContext,
} from "./api"

const Loading = () => <div className="vx-card"><Skeleton h={18} w="40%" /><div className="mt-4"><Skeleton h={120} /></div></div>

/* ------------------------------------------------------------------ */
/* Oportunidades                                                       */
/* ------------------------------------------------------------------ */

export function OpportunitiesTab({ member }: { member: Member }) {
  const { demo } = useVoxen()
  const api = useScoutApi(demo)
  const data = useLoad(api, async (a) => ({ opportunities: await a.opportunities(member.id), clubs: await a.clubs() }), [member.id])
  if (data.error) return <ScoutSetupNotice error={data.error} />
  if (!api || !data.data) return <Loading />
  return (
    <MemberOpportunities api={api} member={member} opportunities={data.data.opportunities} clubs={data.data.clubs}
      onChanged={(opportunities) => data.set((d) => (d ? { ...d, opportunities } : d))}
      onClubsChanged={(c) => data.set((d) => (d ? { ...d, clubs: d.clubs.some((x) => x.id === c.id) ? d.clubs.map((x) => (x.id === c.id ? c : x)) : [...d.clubs, c] } : d))} />
  )
}

/* ------------------------------------------------------------------ */
/* Acessos: travar e destravar cada parte da área do atleta            */
/* ------------------------------------------------------------------ */

const STATES: { key: LockState | "auto"; label: string; icon: typeof Lock }[] = [
  { key: "auto", label: "Automático", icon: Sparkles },
  { key: "open", label: "Aberto", icon: LockOpen },
  { key: "locked", label: "Trancado", icon: Lock },
]

export function AccessTab({ member }: { member: Member }) {
  const { demo, canScout } = useVoxen()
  const { user } = useAuth()
  const { toast } = useToast()
  const api = useScoutApi(demo)
  const data = useLoad(api, (a) => a.controlsFor(member.id), [member.id])
  const [busy, setBusy] = useState<string | null>(null)

  if (data.error) return <ScoutSetupNotice error={data.error} />
  if (!api || !data.data) return <Loading />
  const c = data.data
  const me = demo ? "demo-scout" : user?.id ?? null

  const save = async (key: string, patch: Partial<Controls>, done: string) => {
    setBusy(key)
    try {
      data.set(() => ({ ...c, ...patch }))
      const saved = await api.saveControls(member.id, patch)
      data.set(() => saved)
      toast({ title: done })
    } catch (e) {
      data.set(() => c)
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  const setLock = (key: LockKey, state: LockState | "auto") => {
    const locks = { ...c.locks }
    if (state === "auto") delete locks[key]
    else locks[key] = state
    void save(key, { locks }, `${LOCK_LABEL[key].label}: ${state === "auto" ? "automático" : state === "open" ? "aberto" : "trancado"}`)
  }

  return (
    <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="vx-card">
        <h3 className="vx-card-title">O que {member.fullName.split(" ")[0]} vê na área</h3>
        <p className="vx-card-sub mb-4">“Automático” segue a jornada (perfil completo, jogo analisado...). “Aberto” e “Trancado” valem por cima dela até você voltar ao automático.</p>
        <ul className="sc-locks">
          {LOCK_KEYS.map((key) => {
            const current: LockState | "auto" = c.locks[key] ?? "auto"
            return (
              <li key={key} className={`is-${current}`}>
                <div className="min-w-0 flex-1">
                  <b>{LOCK_LABEL[key].label}</b>
                  <small>{LOCK_LABEL[key].text}</small>
                </div>
                <div className="sc-seg" role="radiogroup" aria-label={LOCK_LABEL[key].label}>
                  {STATES.map((s) => (
                    <button key={s.key} type="button" role="radio" aria-checked={current === s.key} disabled={!canScout || busy !== null}
                      className={`is-${s.key} ${current === s.key ? "is-on" : ""}`} onClick={() => current !== s.key && setLock(key, s.key)}>
                      <s.icon aria-hidden="true" /> {s.label}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid content-start gap-[18px]">
        <section className="vx-card">
          <h3 className="vx-card-title">Conferir</h3>
          <p className="vx-card-sub mb-4">Abre a área exatamente como o atleta vê, com as travas de agora.</p>
          <a className="vx-btn vx-btn--gold w-full" href={memberAreaUrl(member.id, "", demo)} target="_blank" rel="noopener noreferrer"><Eye /> Ver como {member.fullName.split(" ")[0]}</a>
        </section>
        <section className="vx-card">
          <h3 className="vx-card-title">Acompanhamento</h3>
          <p className="vx-card-sub mb-4">Quem acompanha o jogador vê ele em “Meus jogadores”, na Mesa do Scout.</p>
          {c.scoutId && c.scoutId === me
            ? <button type="button" className="vx-btn w-full" disabled={!canScout || busy !== null} onClick={() => void save("scout", { scoutId: null }, "Você deixou de acompanhar")}><X /> Deixar de acompanhar</button>
            : <button type="button" className="vx-btn w-full" disabled={!canScout || busy !== null || !me} onClick={() => void save("scout", { scoutId: me }, "Agora você acompanha este jogador")}><BadgeCheck /> {c.scoutId ? "Passar a acompanhar (no lugar de outra pessoa)" : "Eu acompanho este jogador"}</button>}
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Foto de corpo inteiro                                               */
/* ------------------------------------------------------------------ */

export function BodyTab({ member }: { member: Member }) {
  const { demo } = useVoxen()
  const api = useScoutApi(demo)
  const data = useLoad(api, async (a) => ({ controls: await a.controlsFor(member.id), clubs: await a.clubs() }), [member.id])
  if (data.error) return <ScoutSetupNotice error={data.error} />
  if (!api || !data.data) return <Loading />
  return (
    <BodyPhotoEditor api={api} member={member} controls={data.data.controls} clubs={data.data.clubs}
      onControls={(controls) => data.set((d) => (d ? { ...d, controls } : d))}
      onClubsChanged={(c: Club) => data.set((d) => (d ? { ...d, clubs: d.clubs.some((x) => x.id === c.id) ? d.clubs.map((x) => (x.id === c.id ? c : x)) : [...d.clubs, c] } : d))} />
  )
}

/* ------------------------------------------------------------------ */
/* Contexto do CRM (só equipe)                                         */
/* ------------------------------------------------------------------ */

const CONTEXT_FIELDS: { key: keyof ContextPatch & keyof MemberContext; label: string; rows: number }[] = [
  { key: "currentClub", label: "Clube atual", rows: 1 },
  { key: "pastClubs", label: "Clubes que já representou", rows: 2 },
  { key: "trials", label: "Avaliações e peneiras (e o resultado)", rows: 3 },
  { key: "opportunitiesReceived", label: "Oportunidades que já recebeu", rows: 2 },
  { key: "goal", label: "Objetivo", rows: 2 },
  { key: "blocker", label: "O que impede hoje", rows: 2 },
]

const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "")

export function ContextTab({ member, onMemberChanged }: { member: Member; onMemberChanged: () => void }) {
  const { demo, canScout } = useVoxen()
  const { toast } = useToast()
  const api = useScoutApi(demo)
  const data = useLoad(api, async (a) => ({ context: await a.context(member.id), conflicts: await a.conflicts(member.id) }), [member.id])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ContextPatch>({})
  const [saving, setSaving] = useState(false)

  if (data.error) return <ScoutSetupNotice error={data.error} />
  if (!api || !data.data) return <Loading />
  const { context, conflicts } = data.data

  const startEdit = () => {
    setDraft(Object.fromEntries(CONTEXT_FIELDS.map((f) => [f.key, context?.[f.key] ?? ""])) as ContextPatch)
    setEditing(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      const saved = await api.saveContext(member.id, draft)
      data.set((d) => (d ? { ...d, context: saved } : d))
      setEditing(false)
      toast({ title: "Contexto salvo", description: "A partir de agora a ponte do CRM não sobrescreve estes textos." })
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="vx-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="vx-card-title">Quem é {member.fullName.split(" ")[0]}</h3>
            <p className="vx-card-sub">
              <Lock className="inline h-3 w-3" /> Só a equipe vê. {context?.source === "crm" && context.importedAt ? `Veio do CRM (wsltda.com) em ${dateTime(context.importedAt)}.` : context ? "Editado pela equipe." : ""}
            </p>
          </div>
          {canScout && !editing && <button type="button" className="vx-btn h-8" onClick={startEdit}><Pencil /> Editar</button>}
        </div>

        {editing ? (
          <div className="mt-4 grid gap-3">
            {CONTEXT_FIELDS.map((f) => (
              <label key={f.key} className="op-field">
                <span>{f.label}</span>
                {f.rows === 1
                  ? <input className="vx-input" value={(draft[f.key] as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} maxLength={120} />
                  : <textarea className="vx-input vx-textarea op-textarea" value={(draft[f.key] as string) ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} maxLength={2000} />}
              </label>
            ))}
            <label className="op-field">
              <span>Quem preencheu o formulário</span>
              <select className="vx-input vx-select" value={draft.filledBy ?? ""} onChange={(e) => setDraft((d) => ({ ...d, filledBy: (e.target.value || null) as ContextPatch["filledBy"] }))}>
                <option value="">Não sei</option>
                <option value="atleta">O próprio atleta</option>
                <option value="responsavel">O responsável</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="vx-btn" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="button" className="vx-btn vx-btn--gold" onClick={() => void save()} disabled={saving}><Check /> Salvar</button>
            </div>
          </div>
        ) : context ? (
          <dl className="sc-context">
            {CONTEXT_FIELDS.map((f) => (
              <div key={f.key} className={context[f.key] ? "" : "is-empty"}>
                <dt>{f.label}</dt>
                <dd>{(context[f.key] as string | null) ?? "Não informado"}</dd>
              </div>
            ))}
            <div>
              <dt>Quem preencheu</dt>
              <dd>{context.filledBy === "atleta" ? "O próprio atleta" : context.filledBy === "responsavel" ? "O responsável" : "Não informado"}</dd>
            </div>
          </dl>
        ) : (
          <Empty icon={<Database className="h-6 w-6" />} title="Ainda sem contexto">
            Quando a ponte com o CRM (wsltda.com) estiver ligada, a carreira, as avaliações, o objetivo e o obstáculo chegam sozinhos. Você também pode escrever aqui.
          </Empty>
        )}

        {context && context.answers.length > 0 && !editing && (
          <details className="sc-answers">
            <summary>Perguntas e respostas do formulário ({context.answers.length})</summary>
            <dl>{context.answers.map((a, i) => <div key={i}><dt>{a.question}</dt><dd>{a.answer}</dd></div>)}</dl>
          </details>
        )}
      </section>

      <ConflictList conflicts={conflicts} onResolved={(id) => { data.set((d) => (d ? { ...d, conflicts: d.conflicts.filter((c) => c.id !== id) } : d)); onMemberChanged() }} />
    </div>
  )
}

/** Conflitos da ponte: o CRM trouxe um valor diferente ou um texto que não deu para interpretar. */
export function ConflictList({ conflicts, onResolved, names }: { conflicts: Conflict[]; onResolved: (id: string) => void; names?: Map<string, string> }) {
  const { demo, canScout } = useVoxen()
  const { toast } = useToast()
  const api = useScoutApi(demo)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const resolve = async (c: Conflict, accept: boolean) => {
    if (!api) return
    setBusy(c.id)
    try {
      await api.resolveConflict(c.id, accept, values[c.id])
      onResolved(c.id)
      toast({ title: accept ? `${FIELD_LABEL[c.field]} atualizado` : "Conflito descartado" })
    } catch (e) {
      toast({ title: "Não foi possível resolver", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="vx-card">
      <h3 className="vx-card-title">Para revisar</h3>
      <p className="vx-card-sub mb-4">O que veio do CRM e não entrou sozinho: valor diferente do que já está na ficha, ou texto que não deu para interpretar com segurança.</p>
      {conflicts.length ? (
        <ul className="sc-conflicts">
          {conflicts.map((c) => (
            <li key={c.id}>
              <div className="flex flex-wrap items-center gap-2">
                <b>{FIELD_LABEL[c.field]}</b>
                {names?.get(c.memberId) && <span className="text-[12px] text-zinc-400">· {names.get(c.memberId)}</span>}
                <span className={`sc-kind is-${c.kind}`}>{c.kind === "divergente" ? "Diferente" : "Interpretar"}</span>
              </div>
              {c.kind === "divergente"
                ? <p>Na ficha: <s>{c.currentValue}</s> · No CRM: <strong>{c.proposedValue}</strong></p>
                : <p>O CRM diz: “{c.rawValue}”</p>}
              {canScout && (
                <div className="sc-conflict-actions">
                  <input className="vx-input h-9" placeholder={c.field === "birth_date" ? "AAAA-MM-DD" : c.kind === "revisar" ? "Valor certo" : "Ou corrija aqui"}
                    value={values[c.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))} aria-label={`Valor de ${FIELD_LABEL[c.field]}`} />
                  <button type="button" className="vx-btn vx-btn--gold h-9" disabled={busy === c.id || (c.kind === "revisar" && !values[c.id]?.trim())} onClick={() => void resolve(c, true)}>
                    <Check /> {values[c.id]?.trim() ? "Usar este" : "Aceitar"}
                  </button>
                  <button type="button" className="vx-btn h-9" disabled={busy === c.id} onClick={() => void resolve(c, false)}><X /> Descartar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="sc-allclear"><CheckCircle2 /> Nada para revisar.</p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Histórico                                                           */
/* ------------------------------------------------------------------ */

type Event = { at: string; icon: typeof History; text: ReactNode; tone?: "gold" | "green" | "sky" }

export function HistoryTab({ member, matches }: { member: Member; matches: Match[] }) {
  const { demo } = useVoxen()
  const api = useScoutApi(demo)
  const data = useLoad(api, async (a) => {
    const [opps, subs, controls, context] = await Promise.all([a.opportunities(member.id), a.submissions(), a.controlsFor(member.id), a.context(member.id)])
    return { opps, subs: subs.filter((s) => s.memberId === member.id || (member.userId && s.userId === member.userId)), controls, context }
  }, [member.id])

  const events: Event[] = [
    { at: member.createdAt, icon: BadgeCheck, text: <>Entrou na base{member.autoSync ? " (sincronização automática)" : ""}</> },
    ...matches.map<Event>((m) => ({ at: `${m.playedOn}T12:00:00`, icon: Clapperboard, text: <>Partida contra <b>{m.opponent}</b>{m.published ? " (publicada)" : " (rascunho)"}</>, tone: m.published ? "green" : undefined })),
  ]
  if (member.crmSyncedAt) events.push({ at: member.crmSyncedAt, icon: RefreshCw, text: <>Ficha completada pela ponte do CRM</>, tone: "sky" })
  if (data.data) {
    for (const o of data.data.opps) {
      events.push({ at: o.createdAt, icon: Sparkles, text: <>Oportunidade criada: <b>{o.club?.name ?? "clube"}</b> ({o.compatibility}%)</>, tone: "gold" })
      if (o.publishedAt) events.push({ at: o.publishedAt, icon: Eye, text: <>Oportunidade publicada: <b>{o.club?.name ?? "clube"}</b> · {STATUS_LABEL[o.status].toLowerCase()}</>, tone: "green" })
    }
    for (const s of data.data.subs) {
      events.push({ at: s.createdAt, icon: Clapperboard, text: <span className="inline-flex items-center gap-2">{youtubeThumb(s.videoId) && <img src={youtubeThumb(s.videoId) as string} alt="" width={40} height={22} className="rounded" />} Mandou um jogo{s.opponent ? ` contra ${s.opponent}` : ""}</span> })
    }
    if (data.data.controls.shortlistedAt) events.push({ at: data.data.controls.shortlistedAt, icon: CalendarClock, text: <>Entrou na lista de oportunidades</> })
    if (data.data.context?.importedAt) events.push({ at: data.data.context.importedAt, icon: Database, text: <>Contexto recebido do CRM</>, tone: "sky" })
  }
  events.sort((a, b) => b.at.localeCompare(a.at))

  return (
    <section className="vx-card">
      <h3 className="vx-card-title">Histórico</h3>
      <p className="vx-card-sub mb-4">O que aconteceu com {member.fullName.split(" ")[0]} na Zyron, do mais novo para o mais antigo.</p>
      {data.error && !(data.error.name === "ScoutSetupMissingError") && <p className="mb-3 text-[12.5px] text-red-300">{data.error.message}</p>}
      <ol className="sc-timeline vx-stagger">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className={e.tone ? `is-${e.tone}` : ""} style={{ "--i": Math.min(i, 14) } as React.CSSProperties}>
            <span className="sc-dot"><e.icon aria-hidden="true" /></span>
            <div><p>{e.text}</p><small>{formatMatchDate(e.at.slice(0, 10))}</small></div>
          </li>
        ))}
      </ol>
    </section>
  )
}
