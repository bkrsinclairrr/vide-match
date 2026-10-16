import "./athletes.css"

import type { CSSProperties } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowRight, BriefcaseBusiness, CalendarClock, Copy, Database, FileSignature, Loader2, Medal, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ATHLETES_MIGRATION } from "./api"
import { TEMPS, dayLabel, dayRelative, isOverdue, sectorPath, tempInfo, type Athlete, type Temperature } from "./model"

/** Peças do setor Atletas usadas no próprio setor e em Cadastros e Membros. */

const tone = (t: Temperature) => ({ "--c": tempInfo(t).color }) as CSSProperties

/** Selo da temperatura: frio, morno ou quente. */
export function TempPill({ t, size = "md" }: { t: Temperature; size?: "sm" | "md" }) {
  const info = tempInfo(t)
  const Icon = info.icon
  return <span className={`at-temp at-temp--${t} ${size === "sm" ? "is-sm" : ""}`} style={tone(t)}><Icon aria-hidden="true" /> {info.label}</span>
}

/** Três botões para trocar a temperatura (no cartão, na lista e na ficha). */
export function TempPicker({ value, onChange, disabled, big = false, label = "Temperatura" }: {
  value: Temperature
  onChange: (t: Temperature) => void
  disabled?: boolean
  big?: boolean
  label?: string
}) {
  return (
    <div className={`at-picker ${big ? "is-big" : ""}`} role="radiogroup" aria-label={label}>
      {TEMPS.map(({ key, label: name, hint, icon: Icon }) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} disabled={disabled}
          className={value === key ? "is-on" : ""} style={tone(key)} title={hint}
          onClick={(e) => { e.stopPropagation(); if (value !== key) onChange(key) }}>
          <Icon aria-hidden="true" />
          <span>{name}</span>
          {big && <small>{hint}</small>}
        </button>
      ))}
    </div>
  )
}

const FLAG_ICON = { fwd: Send, adv: BriefcaseBusiness, ctr: FileSignature } as const

/** Situação sim/não com o detalhe: "Encaminhado · Peneira X" ou "Não encaminhado". */
export function Flag({ on, onLabel, offLabel, detail, kind }: { on: boolean; onLabel: string; offLabel: string; detail?: string | null; kind: keyof typeof FLAG_ICON }) {
  const Icon = FLAG_ICON[kind]
  return (
    <span className={`at-flag at-flag--${kind} ${on ? "is-on" : ""}`} title={on && detail ? `${onLabel}: ${detail}` : undefined}>
      <Icon aria-hidden="true" />
      <span className="truncate">{on ? onLabel : offLabel}{on && detail ? <em> · {detail}</em> : null}</span>
    </span>
  )
}

export function NextStep({ a, compact = false }: { a: Athlete; compact?: boolean }) {
  if (!a.nextStep && !a.nextStepOn) return compact ? null : <span className="at-next is-empty"><CalendarClock aria-hidden="true" /> Sem próximo passo</span>
  const late = isOverdue(a)
  return (
    <span className={`at-next ${late ? "is-late" : ""}`} title={a.nextStepOn ? dayLabel(a.nextStepOn) : undefined}>
      <CalendarClock aria-hidden="true" />
      <span className="truncate">{a.nextStep ?? "Próximo passo"}</span>
      {a.nextStepOn && <b>{late ? `atrasado ${dayRelative(a.nextStepOn).replace("há ", "")}` : dayRelative(a.nextStepOn)}</b>}
    </span>
  )
}

/** Marca discreta nas listas de Cadastros e Membros para quem já está no setor. */
export function SectorBadge({ a }: { a: Athlete | null }) {
  const { pathname } = useLocation()
  if (!a) return null
  const info = tempInfo(a.temperature)
  const parts = [`No setor Atletas · ${info.label}`, a.advisory && "em assessoria", a.forwarded && "encaminhado", a.contractSigned && "contrato fechado"].filter(Boolean).join(" · ")
  return (
    <Link to={sectorPath(pathname, a.id)} className="at-badge" style={tone(a.temperature)} title={parts} aria-label={parts} onClick={(e) => e.stopPropagation()}>
      <Medal aria-hidden="true" /> Atletas <span className="at-badge-dot" />
    </Link>
  )
}

/**
 * Cartão "Setor Atletas" nas gavetas de Cadastros e Membros: mostra a situação de quem já
 * está lá ou oferece "Enviar para Atletas".
 */
export function SectorCard({ a, missing, canEdit, sending, onSend }: {
  a: Athlete | null
  missing: boolean
  canEdit: boolean
  sending: boolean
  onSend: () => void
}) {
  const { pathname } = useLocation()
  return (
    <section className={`vx-card at-sector-card ${a ? "is-in" : ""}`} style={a ? tone(a.temperature) : undefined}>
      <div className="at-sector-card-head">
        <span className="at-sector-card-icon"><Medal /></span>
        <div className="min-w-0 flex-1">
          <h3 className="vx-card-title">Setor Atletas</h3>
          <p className="vx-card-sub">{a ? "Está no setor. Acompanhe por lá a temperatura, o encaminhamento e a assessoria." : "Para os atletas que a equipe vai trabalhar com mais cuidado."}</p>
        </div>
      </div>
      {a ? (
        <>
          <div className="at-sector-card-flags">
            <TempPill t={a.temperature} />
            <Flag kind="fwd" on={a.forwarded} onLabel="Encaminhado" offLabel="Não encaminhado" detail={a.forwardedTo} />
            <Flag kind="adv" on={a.advisory} onLabel="Em assessoria" offLabel="Sem assessoria" />
            {a.contractSigned && <Flag kind="ctr" on onLabel="Contrato fechado" offLabel="" detail={a.contractClub} />}
          </div>
          <NextStep a={a} />
          <Link className="vx-btn vx-btn--gold mt-4" to={sectorPath(pathname, a.id)}>Abrir a ficha <ArrowRight /></Link>
        </>
      ) : missing ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-400">O setor ainda não foi ativado no banco: rode <code className="text-amber-200">{ATHLETES_MIGRATION}</code> no editor SQL do Supabase.</p>
      ) : canEdit ? (
        <button type="button" className="vx-btn vx-btn--gold mt-4" onClick={onSend} disabled={sending}>
          {sending ? <><Loader2 className="cn-spin" /> Enviando...</> : <><Medal /> Enviar para Atletas</>}
        </button>
      ) : (
        <p className="mt-3 text-[12.5px] text-zinc-500">Ainda não está no setor.</p>
      )}
    </section>
  )
}

/** Aviso quando a tabela do setor ainda não existe no banco. */
export function SectorSetup() {
  const { toast } = useToast()
  return (
    <section className="vx-card at-setup">
      <span className="vx-empty-icon shrink-0"><Database className="h-6 w-6" /></span>
      <div className="min-w-0">
        <h2>Ative o setor Atletas no banco de dados</h2>
        <p>
          É uma vez só: abra o editor SQL do Supabase, cole o conteúdo de <code>{ATHLETES_MIGRATION}</code> e clique em <strong>Run</strong>.
          Ele cria a tabela das fichas (temperatura, encaminhamento, assessoria, próximos passos e notas). Nada que já existe é alterado.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="vx-btn vx-btn--gold" href="https://supabase.com/dashboard/project/mehmqibxzxfqdxqjnjad/sql/new" target="_blank" rel="noopener noreferrer">Abrir o editor SQL</a>
          <button type="button" className="vx-btn" onClick={() => { void navigator.clipboard.writeText(ATHLETES_MIGRATION); toast({ title: "Caminho copiado", description: ATHLETES_MIGRATION }) }}>
            <Copy /> Copiar caminho do arquivo
          </button>
        </div>
      </div>
    </section>
  )
}
