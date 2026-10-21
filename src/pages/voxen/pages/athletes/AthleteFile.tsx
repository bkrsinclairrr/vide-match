import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, Check, CheckCircle2, FileSignature, Mail, MessageCircle, RefreshCw, Send, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar } from "@/pages/voxen/ui"
import { formatDate, timeAgo } from "@/pages/voxen/data"
import { DangerConfirm } from "@/pages/admin/console/parts"
import { JOURNEY_MIGRATION, type AthletesHook } from "./api"
import { AthleteForm } from "./AthleteForm"
import { TempPicker } from "./bits"
import {
  DATA_LABEL, ORIGIN_LABEL, addDays, ageOf, dataOf, dayLabel, dayRelative, isOverdue, isoDay, originChanges, tempInfo, whatsappOf,
  type Athlete, type AthleteData, type AthletePatch,
} from "./model"

export type OriginInfo = { data: AthleteData | null; links: { label: string; to: string }[] }

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Textos digitados viram uma gravação só, 700 ms depois da última tecla (e na hora de fechar). */
function useAutosave(id: string, update: AthletesHook["update"]) {
  const { toast } = useToast()
  const pending = useRef<AthletePatch>({})
  const timer = useRef<number>()
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle")

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    const patch = pending.current
    if (!Object.keys(patch).length) return
    pending.current = {}
    setState("saving")
    try {
      await update(id, patch)
      setState("saved")
    } catch (e) {
      setState("idle")
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
    }
  }, [id, update, toast])

  const queue = useCallback((patch: AthletePatch) => {
    pending.current = { ...pending.current, ...patch }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), 700)
  }, [flush])

  const flushRef = useRef(flush)
  flushRef.current = flush
  useEffect(() => () => { void flushRef.current() }, [])

  return { queue, flush, state, drop: () => { pending.current = {}; window.clearTimeout(timer.current) } }
}

/** Ficha do atleta no setor: situação, próximo passo, notas, dados e origem. */
export function AthleteFile({ a, sector, origin, onRemoved }: { a: Athlete; sector: AthletesHook; origin: OriginInfo; onRemoved: () => void }) {
  const { toast } = useToast()
  const ro = !sector.canEdit
  const auto = useAutosave(a.id, sector.update)
  const [notes, setNotes] = useState(a.notes ?? "")
  const [nextStep, setNextStep] = useState(a.nextStep ?? "")
  const [forwardedTo, setForwardedTo] = useState(a.forwardedTo ?? "")
  const [contractClub, setContractClub] = useState(a.contractClub ?? "")
  const [savingData, setSavingData] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const [asking, setAsking] = useState(false)
  const [removing, setRemoving] = useState(false)

  const info = tempInfo(a.temperature)
  const age = ageOf(a)
  const wa = whatsappOf(a)
  const changes = originChanges(a, origin.data)
  const changed = Object.keys(changes) as (keyof AthleteData)[]

  const save = (patch: AthletePatch, ok?: string) => {
    sector.update(a.id, patch)
      .then(() => { if (ok) toast({ title: ok }) })
      .catch((e) => toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" }))
  }

  const setForwarded = (on: boolean) => {
    void auto.flush()
    save(on ? { forwarded: true, forwardedOn: a.forwardedOn ?? isoDay() } : { forwarded: false }, on ? "Marcado como encaminhado" : "Encaminhamento desmarcado")
  }
  const setAdvisory = (on: boolean) => save(on ? { advisory: true, advisorySince: a.advisorySince ?? isoDay() } : { advisory: false }, on ? "Em trabalho de assessoria" : "Assessoria desmarcada")
  const setContract = (on: boolean) => {
    void auto.flush()
    save(on ? { contractSigned: true, contractOn: a.contractOn ?? isoDay() } : { contractSigned: false }, on ? "Contrato fechado: o atleta vê a jornada completa" : "Contrato desmarcado")
  }

  const completeStep = () => {
    const step = nextStep.trim()
    if (!step) return
    const line = `${dayLabel(isoDay())} · Feito: ${step}`
    const merged = [line, notes.trim()].filter(Boolean).join("\n").slice(0, 4000)
    auto.drop()
    setNotes(merged)
    setNextStep("")
    save({ nextStep: null, nextStepOn: null, notes: merged }, "Passo concluído e anotado")
  }

  const saveData = async (data: AthleteData) => {
    setSavingData(true)
    try {
      await sector.update(a.id, data)
      toast({ title: "Dados salvos", description: data.fullName })
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
    } finally {
      setSavingData(false)
    }
  }

  const bringFromOrigin = async () => {
    try {
      await sector.update(a.id, changes)
      setFormVersion((v) => v + 1)
      toast({ title: "Dados atualizados com a origem", description: changed.map((k) => DATA_LABEL[k]).join(", ") })
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: errMsg(e), variant: "destructive" })
    }
  }

  const remove = async () => {
    setRemoving(true)
    try {
      auto.drop()
      await sector.remove(a.id)
      toast({ title: "Tirado do setor Atletas", description: `${a.fullName}. O cadastro de origem continua.` })
      onRemoved()
    } catch (e) {
      toast({ title: "Não foi possível tirar do setor", description: errMsg(e), variant: "destructive" })
      setRemoving(false)
    }
  }

  return (
    <div className="cn-editor at-file" style={{ "--c": info.color } as CSSProperties}>
      <section className="vx-card at-hero">
        <div className="at-hero-avatar"><Avatar name={a.fullName} size={58} /></div>
        <div className="min-w-0 flex-1">
          <p className="at-hero-meta">
            {[a.position, a.category, age !== null ? `${age} anos` : null, a.city].filter(Boolean).join(" · ") || "Perfil esportivo ainda em branco"}
          </p>
          <p className="at-hero-dates">
            <span className="vx-tag">{ORIGIN_LABEL[a.origin]}</span>
            <span>No setor desde {formatDate(a.createdAt)}</span>
            {a.sourceCreatedAt && <span>· cadastro em {formatDate(a.sourceCreatedAt)}</span>}
            <span>· atualizado {timeAgo(a.updatedAt)}</span>
          </p>
          <div className="at-hero-actions">
            {wa && <a className="vx-btn at-wa" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp</a>}
            {a.email && <a className="vx-btn" href={`mailto:${a.email}`}><Mail /> E-mail</a>}
            {!wa && !a.email && <span className="text-[12px] text-zinc-500">Sem contato na ficha: preencha em Dados do atleta.</span>}
          </div>
        </div>
      </section>

      <section className="vx-card">
        <div className="at-sec-head">
          <h3 className="vx-card-title">Situação</h3>
          <span className={`at-autosave is-${auto.state}`} aria-live="polite">{auto.state === "saving" ? "Salvando…" : auto.state === "saved" ? <><Check /> Salvo</> : null}</span>
        </div>
        <p className="vx-card-sub mb-4">Quão perto está de fechar, se já foi encaminhado, se está em assessoria e se fechou contrato.</p>
        <TempPicker big value={a.temperature} disabled={ro} onChange={(t) => save({ temperature: t }, `Agora está ${tempInfo(t).label.toLowerCase()}`)} />

        <div className="at-toggle-row">
          <div className="at-toggle-label">
            <span className="at-toggle-icon is-fwd"><Send /></span>
            <div>
              <b>Encaminhado</b>
              <small>{a.forwarded ? `Desde ${dayLabel(a.forwardedOn) || "—"}` : "Para clube, peneira, avaliação ou empresário"}</small>
            </div>
          </div>
          <button type="button" role="switch" aria-checked={a.forwarded} disabled={ro} className={`cn-switch ${a.forwarded ? "is-on" : ""}`} onClick={() => setForwarded(!a.forwarded)} aria-label="Encaminhado">
            <span /> <em>{a.forwarded ? "Sim" : "Não"}</em>
          </button>
        </div>
        {a.forwarded && (
          <div className="at-toggle-detail">
            <label className="at-field">
              <span>Para onde</span>
              <input className="vx-input" value={forwardedTo} disabled={ro} maxLength={120} placeholder="Ex.: Peneira do Gama · Sub 17"
                onChange={(e) => { setForwardedTo(e.target.value); auto.queue({ forwardedTo: e.target.value }) }} onBlur={() => void auto.flush()} />
            </label>
            <label className="at-field at-field--date">
              <span>Quando</span>
              <input className="vx-input" type="date" value={a.forwardedOn ?? ""} disabled={ro} onChange={(e) => save({ forwardedOn: e.target.value || null })} />
            </label>
          </div>
        )}

        <div className="at-toggle-row">
          <div className="at-toggle-label">
            <span className="at-toggle-icon is-adv"><BriefcaseBusiness /></span>
            <div>
              <b>Em trabalho de assessoria</b>
              <small>{a.advisory ? `Desde ${dayLabel(a.advisorySince) || "—"}` : "A Zyron cuida da carreira dele"}</small>
            </div>
          </div>
          <button type="button" role="switch" aria-checked={a.advisory} disabled={ro} className={`cn-switch ${a.advisory ? "is-on" : ""}`} onClick={() => setAdvisory(!a.advisory)} aria-label="Em trabalho de assessoria">
            <span /> <em>{a.advisory ? "Sim" : "Não"}</em>
          </button>
        </div>
        {a.advisory && (
          <div className="at-toggle-detail">
            <label className="at-field at-field--date">
              <span>Desde</span>
              <input className="vx-input" type="date" value={a.advisorySince ?? ""} disabled={ro} onChange={(e) => save({ advisorySince: e.target.value || null })} />
            </label>
          </div>
        )}

        <div className="at-toggle-row">
          <div className="at-toggle-label">
            <span className="at-toggle-icon is-ctr"><FileSignature /></span>
            <div>
              <b>Contrato fechado</b>
              <small>
                {!a.contractReady
                  ? <>Para marcar, rode <code className="text-amber-200">{JOURNEY_MIGRATION}</code> no editor SQL</>
                  : a.contractSigned ? `Assinado em ${dayLabel(a.contractOn) || "—"}` : "A última etapa da jornada que o atleta acompanha na área dele"}
              </small>
            </div>
          </div>
          <button type="button" role="switch" aria-checked={a.contractSigned} disabled={ro || !a.contractReady} className={`cn-switch ${a.contractSigned ? "is-on" : ""}`} onClick={() => setContract(!a.contractSigned)} aria-label="Contrato fechado">
            <span /> <em>{a.contractSigned ? "Sim" : "Não"}</em>
          </button>
        </div>
        {a.contractSigned && (
          <div className="at-toggle-detail">
            <label className="at-field">
              <span>Com qual clube</span>
              <input className="vx-input" value={contractClub} disabled={ro} maxLength={120} placeholder="Ex.: Botafogo-SP"
                onChange={(e) => { setContractClub(e.target.value); auto.queue({ contractClub: e.target.value }) }} onBlur={() => void auto.flush()} />
            </label>
            <label className="at-field at-field--date">
              <span>Quando</span>
              <input className="vx-input" type="date" value={a.contractOn ?? ""} disabled={ro} onChange={(e) => save({ contractOn: e.target.value || null })} />
            </label>
          </div>
        )}
        <p className="at-journey-note">O atleta vê na área dele, como etapas da jornada: estar no setor (selecionado), o encaminhamento e o contrato. Só as datas e o clube do contrato; as notas da equipe nunca aparecem.</p>
      </section>

      <section className={`vx-card at-next-card ${isOverdue(a) ? "is-late" : ""}`}>
        <h3 className="vx-card-title"><CalendarClock /> Próximo passo</h3>
        <p className="vx-card-sub mb-4">
          {a.nextStepOn ? <>Para {dayLabel(a.nextStepOn)} ({isOverdue(a) ? <strong className="text-rose-300">atrasado, {dayRelative(a.nextStepOn)}</strong> : dayRelative(a.nextStepOn)}).</> : "O que a equipe faz a seguir e quando."}
        </p>
        <input className="vx-input" value={nextStep} disabled={ro} maxLength={200} placeholder="Ex.: Ligar para a família e marcar a reunião"
          onChange={(e) => { setNextStep(e.target.value); auto.queue({ nextStep: e.target.value }) }} onBlur={() => void auto.flush()} />
        <div className="at-next-when">
          {([["Hoje", 0], ["Amanhã", 1], ["Em 3 dias", 3], ["Em 1 semana", 7]] as const).map(([label, n]) => (
            <button key={label} type="button" disabled={ro} className={`vx-chip ${a.nextStepOn === addDays(n) ? "is-on" : ""}`} onClick={() => save({ nextStepOn: addDays(n) })}>{label}</button>
          ))}
          <input className="vx-input at-date" type="date" value={a.nextStepOn ?? ""} disabled={ro} onChange={(e) => save({ nextStepOn: e.target.value || null })} aria-label="Data do próximo passo" />
          {!ro && nextStep.trim() && (
            <button type="button" className="vx-btn at-done" onClick={completeStep} title="Anota nas notas com a data de hoje e limpa o passo"><CheckCircle2 /> Concluído</button>
          )}
        </div>
      </section>

      <section className="vx-card">
        <h3 className="vx-card-title">Notas da equipe</h3>
        <p className="vx-card-sub mb-3">Conversas, impressões do scout, combinados com a família. Salva sozinho.</p>
        <textarea className="vx-input vx-textarea" style={{ minHeight: 130 }} maxLength={4000} value={notes} disabled={ro}
          placeholder="Ex.: Pai prefere contato à noite. Jogou bem a final do Candangão."
          onChange={(e) => { setNotes(e.target.value); auto.queue({ notes: e.target.value }) }} onBlur={() => void auto.flush()} />
      </section>

      <section className="vx-card">
        <h3 className="vx-card-title">Dados do atleta</h3>
        <p className="vx-card-sub mb-4">Cópia da ficha: corrigir aqui não muda o cadastro de origem.</p>
        {changed.length > 0 && (
          <div className="at-origin-diff">
            <RefreshCw />
            <p><b>{changed.length} dado{changed.length === 1 ? "" : "s"} diferente{changed.length === 1 ? "" : "s"} no cadastro de origem:</b> {changed.map((k) => DATA_LABEL[k]).join(", ")}.</p>
            {!ro && <button type="button" className="vx-btn" onClick={() => void bringFromOrigin()}>Trazer da origem</button>}
          </div>
        )}
        <AthleteForm key={`${a.id}-${formVersion}`} initial={dataOf(a)} saving={savingData} readOnly={ro} onSave={saveData} />
      </section>

      {origin.links.length > 0 && (
        <section className="vx-card">
          <h3 className="vx-card-title">Origem</h3>
          <p className="vx-card-sub mb-4">De onde este atleta veio para o setor.</p>
          <div className="flex flex-wrap gap-2">
            {origin.links.map((l) => <Link key={l.to} className="vx-btn" to={l.to}><ArrowUpRight /> {l.label}</Link>)}
          </div>
        </section>
      )}

      {sector.canRemove && (
        <section className="vx-card cn-risk">
          <h3 className="vx-card-title">Zona de risco</h3>
          {asking ? (
            <div className="mt-4">
              <DangerConfirm title={`Tirar ${a.fullName} do setor?`} confirmLabel="Tirar do setor" busy={removing} onCancel={() => setAsking(false)} onConfirm={() => void remove()}>
                A ficha, o próximo passo e as notas do setor são apagados. O cadastro de origem e o membro continuam.
              </DangerConfirm>
            </div>
          ) : (
            <div className="cn-risk-row">
              <p>Tirar do setor apaga só a ficha daqui. O cadastro e o membro de origem continuam.</p>
              <button type="button" className="vx-btn cn-btn-danger" onClick={() => setAsking(true)}><Trash2 /> Tirar do setor</button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
