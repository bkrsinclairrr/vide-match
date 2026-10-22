import type { CSSProperties } from "react"
import { Check, Database, Minus } from "lucide-react"
import { IMPORTED_MIGRATIONS, isSetupMissing } from "./api"
import { KIND_LABEL, KIND_SHORT, statusOf, type ImportKind, type ImportRow, type ImportSection } from "./model"

/** Caixa de marcar. `onChange` recebe se o Shift estava apertado (marcar do último ao clicado). */
export function Tick({ on, partial = false, label, onChange, disabled = false }: {
  on: boolean
  partial?: boolean
  label: string
  onChange: (shift: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial && !on ? "mixed" : on}
      aria-label={label}
      disabled={disabled}
      className={`im-tick ${on || partial ? "is-on" : ""}`}
      onClick={(e) => { e.stopPropagation(); onChange(e.shiftKey) }}
    >
      {on ? <Check strokeWidth={3} aria-hidden="true" /> : partial ? <Minus strokeWidth={3} aria-hidden="true" /> : null}
    </button>
  )
}

/** A subseção como etiqueta colorida (ou "Sem subseção"). */
export function SectionChip({ section }: { section: ImportSection | null | undefined }) {
  if (!section) return <span className="im-chip is-none">Sem subseção</span>
  return (
    <span className="im-chip" style={{ "--c": section.color } as CSSProperties}>
      <i aria-hidden="true" />
      <span className="truncate">{section.name}</span>
    </span>
  )
}

const STATUS_SHORT = { pendente: "Conferir", aprovado: "Aprovado", mudou: "Mudou" } as const

export function StatusBadge({ row, long = false }: { row: ImportRow; long?: boolean }) {
  const st = statusOf(row)
  return (
    <span className={`im-status is-${st}`} title={st === "mudou" ? "O CRM mandou uma versão nova depois da aprovação" : undefined}>
      {long && st === "pendente" ? "Para conferir" : long && st === "mudou" ? "Mudou depois de aprovado" : STATUS_SHORT[st]}
    </span>
  )
}

export function KindBadge({ kind, short = false }: { kind: ImportKind; short?: boolean }) {
  return <span className={`im-kind is-${kind}`}>{short ? KIND_SHORT[kind] : KIND_LABEL[kind]}</span>
}

/** A migração das subseções e da aprovação ainda não foi aplicada no banco. */
export function ImportedNotice({ error }: { error: Error }) {
  if (!isSetupMissing(error)) {
    return <div className="vx-card"><p className="text-[13px] text-red-300">{error.message}</p></div>
  }
  return (
    <section className="vx-card">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="vx-empty-icon shrink-0"><Database className="h-6 w-6" /></span>
        <div>
          <h2 className="text-[17px] font-bold">Falta ativar os Importados no banco de dados</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
            A lista de importados, as subseções e a aprovação dependem desta migração. Nada que já existe é alterado.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12.5px] text-zinc-400">
            {IMPORTED_MIGRATIONS.map((m) => <li key={m}><code className="text-amber-200">{m}</code></li>)}
          </ol>
        </div>
      </div>
    </section>
  )
}
