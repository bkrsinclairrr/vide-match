import { useMemo, useState } from "react"
import { Check as CheckIcon, ChevronLeft, ChevronRight, Loader2, Pencil, X } from "lucide-react"
import { CATEGORIES, POSITIONS, STATES } from "@/data/football"
import type { Player, Profile, ProfileEdit } from "@/pages/voxen/data"
import { EST_HINT, isEst } from "@/pages/voxen/estimated"
import { realProfileOf } from "@/pages/voxen/people"

/** Escolher o valor de um campo direto na linha: mostra o valor (em itálico se for estimado) e grava ao escolher. */
export function InlinePick({ p, field, options, disabled, label, onPick }: {
  p: Player
  field: "position" | "category"
  options: readonly string[]
  disabled?: boolean
  label: string
  onPick: (value: string | null) => void
}) {
  const real = realProfileOf(p)[field] ?? ""
  const shown = p.profile[field] ?? ""
  const est = isEst(p, field)
  const list = real && !options.includes(real) ? [...options, real] : options
  return (
    <select
      className={`cn-pick ${est ? "is-est" : ""} ${!shown ? "is-empty" : ""}`}
      value={real}
      disabled={disabled}
      aria-label={`${label} de ${p.name}`}
      title={est ? EST_HINT : undefined}
      onChange={(e) => onPick(e.target.value || null)}
      onClick={(e) => e.stopPropagation()}
    >
      <option value="">{shown ? `${shown} (est.)` : "—"}</option>
      {list.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  )
}

type FieldKey = "position" | "category" | "state" | "city" | "team" | "foot" | "nationality" | "age"

const FIELDS: { key: FieldKey; label: string; options?: readonly string[]; numeric?: boolean }[] = [
  { key: "position", label: "Posição", options: POSITIONS },
  { key: "category", label: "Categoria", options: CATEGORIES },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado", options: STATES },
  { key: "team", label: "Time atual" },
  { key: "age", label: "Idade", numeric: true },
  { key: "foot", label: "Melhor pé", options: ["destro", "canhoto", "ambidestro"] },
  { key: "nationality", label: "Nacionalidade" },
]

/**
 * Muda UM campo de vários cadastros de uma vez. Por padrão só onde o campo está vazio (preencher lacunas sem pisar no que o
 * atleta informou). Vale para o funil, a conta e a ficha de membro de cada pessoa.
 */
export function BulkEditForm({ picked, busy, onCancel, onApply }: {
  picked: Player[]
  busy: boolean
  onCancel: () => void
  onApply: (field: FieldKey, value: string | number | null, onlyEmpty: boolean) => void
}) {
  const [field, setField] = useState<FieldKey>("position")
  const [value, setValue] = useState("")
  const [onlyEmpty, setOnlyEmpty] = useState(true)
  const def = FIELDS.find((f) => f.key === field) as (typeof FIELDS)[number]

  const willChange = useMemo(() => {
    if (!onlyEmpty) return picked.length
    return picked.filter((p) => { const v = (realProfileOf(p) as Profile)[field]; return v === undefined || v === null || v === "" }).length
  }, [picked, field, onlyEmpty])

  const valid = def.numeric ? /^\d{1,2}$/.test(value) && Number(value) >= 4 : value.trim().length > 0
  const apply = () => onApply(field, def.numeric ? Number(value) : value.trim(), onlyEmpty)

  return (
    <div className="cn-bulkedit" role="group" aria-label="Mudar um campo dos selecionados">
      <div className="cn-bulkedit-row">
        <span className="cn-bulkedit-title"><Pencil /> Mudar um campo de {picked.length} cadastro{picked.length === 1 ? "" : "s"}</span>
        <select className="vx-input vx-select cn-bulk-select" value={field} onChange={(e) => { setField(e.target.value as FieldKey); setValue("") }} aria-label="Campo">
          {FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        {def.options ? (
          <select className="vx-input vx-select cn-bulk-select" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Novo valor">
            <option value="">Escolha…</option>
            {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="vx-input cn-bulk-select" value={value} inputMode={def.numeric ? "numeric" : "text"} maxLength={def.numeric ? 2 : 80} placeholder={def.numeric ? "Ex.: 16" : "Novo valor"}
            onChange={(e) => setValue(def.numeric ? e.target.value.replace(/\D/g, "") : e.target.value)} aria-label="Novo valor" />
        )}
      </div>
      <label className="cn-bulkedit-only">
        <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
        <span>Só onde está vazio <em>(não mexe no que o atleta informou)</em></span>
      </label>
      <p className="cn-bulkedit-note">Vai mudar <strong className="tnum">{willChange}</strong> de {picked.length}. Vale para o funil, a conta e a ficha de membro de cada pessoa.</p>
      <div className="cn-bulkedit-actions">
        <button type="button" className="vx-btn" onClick={onCancel} disabled={busy}><X /> Cancelar</button>
        <button type="button" className="vx-btn vx-btn--gold" onClick={apply} disabled={busy || !valid || willChange === 0}>
          {busy ? <><Loader2 className="cn-spin" /> Aplicando…</> : <><CheckIcon /> Aplicar em {willChange}</>}
        </button>
      </div>
    </div>
  )
}

/** Anterior / próximo cadastro da lista, junto do título da gaveta (no alto, onde o aviso de "salvo" não cobre). */
export function DrawerNav({ index, total, onPrev, onNext }: { index: number; total: number; onPrev: () => void; onNext: () => void }) {
  return (
    <span className="cn-drawer-nav" role="group" aria-label="Navegar entre os cadastros">
      <button type="button" className="vx-icon-btn" onClick={onPrev} disabled={index <= 0} aria-label="Cadastro anterior" title="Cadastro anterior"><ChevronLeft /></button>
      <span className="tnum">{index + 1} de {total}</span>
      <button type="button" className="vx-icon-btn" onClick={onNext} disabled={index >= total - 1} aria-label="Próximo cadastro" title="Próximo cadastro"><ChevronRight /></button>
    </span>
  )
}

export type { ProfileEdit }
