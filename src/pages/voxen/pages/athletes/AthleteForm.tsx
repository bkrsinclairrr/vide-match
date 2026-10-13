import { useState, type FormEvent } from "react"
import { Save } from "lucide-react"
import { CATEGORIES, POSITIONS } from "@/data/football"
import { FormField } from "@/pages/voxen/pages/members/shared"
import { FEET, type AthleteData } from "./model"

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const digits = (s: string) => s.replace(/\D/g, "")
const numOrNull = (s: string) => (digits(s) ? Number(digits(s)) : null)

/** Erros de cada campo (vazio = tudo certo). Os limites são os mesmos do banco. */
function validateData(v: AthleteData) {
  const e: Partial<Record<keyof AthleteData, string>> = {}
  if (v.fullName.trim().length < 2) e.fullName = "Escreva o nome do atleta."
  if (v.email && !EMAIL.test(v.email.trim())) e.email = "E-mail inválido."
  if (v.phone && (digits(v.phone).length < 8 || digits(v.phone).length > 15)) e.phone = "Use DDD + número (8 a 15 dígitos)."
  if (v.heightCm !== null && (v.heightCm < 100 || v.heightCm > 230)) e.heightCm = "Entre 100 e 230 cm."
  if (v.weightKg !== null && (v.weightKg < 25 || v.weightKg > 160)) e.weightKg = "Entre 25 e 160 kg."
  if (v.age !== null && (v.age < 4 || v.age > 60)) e.age = "Entre 4 e 60 anos."
  if (v.birthDate && v.birthDate < "1950-01-01") e.birthDate = "Data muito antiga."
  return e
}

/** Dados do atleta na ficha: nome, contato, nascimento e perfil esportivo. */
export function AthleteForm({ initial, onSave, onCancel, saving, readOnly = false, submitLabel = "Salvar dados" }: {
  initial: AthleteData
  onSave: (data: AthleteData) => Promise<void> | void
  onCancel?: () => void
  saving?: boolean
  readOnly?: boolean
  submitLabel?: string
}) {
  const [v, setV] = useState<AthleteData>(initial)
  const set = <K extends keyof AthleteData>(k: K, val: AthleteData[K]) => setV((x) => ({ ...x, [k]: val }))
  const errors = validateData(v)
  const valid = Object.keys(errors).length === 0
  const dirty = JSON.stringify(v) !== JSON.stringify(initial)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || readOnly) return
    void onSave({
      ...v,
      fullName: v.fullName.trim().replace(/\s+/g, " "),
      email: v.email?.trim().toLowerCase() || null,
      phone: v.phone ? digits(v.phone) : null,
    })
  }

  return (
    <form className="mb-admin-form at-form" onSubmit={submit}>
      <fieldset disabled={readOnly} className="contents">
        <FormField label="Nome completo *" error={v.fullName && errors.fullName ? errors.fullName : undefined} wide>
          <input className="vx-input" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Nome e sobrenome" required autoComplete="off" />
        </FormField>
        <FormField label="E-mail" error={errors.email}>
          <input className="vx-input" type="email" value={v.email ?? ""} onChange={(e) => set("email", e.target.value || null)} placeholder="nome@gmail.com" autoComplete="off" />
        </FormField>
        <FormField label="WhatsApp / telefone" error={errors.phone}>
          <input className="vx-input" inputMode="tel" value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} placeholder="61 99999-9999" autoComplete="off" />
        </FormField>
        <FormField label="Nascimento" error={errors.birthDate}>
          <input className="vx-input" type="date" value={v.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value || null)} />
        </FormField>
        <FormField label="Idade informada" hint={v.birthDate ? "Com o nascimento preenchido, a idade é calculada." : undefined} error={errors.age}>
          <input className="vx-input" inputMode="numeric" value={v.age ?? ""} onChange={(e) => set("age", numOrNull(e.target.value))} placeholder="15" />
        </FormField>
        <FormField label="Posição">
          <select className="vx-input vx-select" value={v.position ?? ""} onChange={(e) => set("position", e.target.value || null)}>
            <option value="">—</option>
            {[...POSITIONS, ...(v.position && !POSITIONS.includes(v.position) ? [v.position] : [])].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Categoria">
          <select className="vx-input vx-select" value={v.category ?? ""} onChange={(e) => set("category", e.target.value || null)}>
            <option value="">—</option>
            {[...CATEGORIES, ...(v.category && !CATEGORIES.includes(v.category) ? [v.category] : [])].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Melhor pé">
          <select className="vx-input vx-select" value={v.foot ?? ""} onChange={(e) => set("foot", e.target.value || null)}>
            <option value="">—</option>
            {[...FEET, ...(v.foot && !FEET.includes(v.foot) ? [v.foot] : [])].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FormField>
        <FormField label="Altura (cm)" error={errors.heightCm}>
          <input className="vx-input" inputMode="numeric" value={v.heightCm ?? ""} onChange={(e) => set("heightCm", numOrNull(e.target.value))} placeholder="178" />
        </FormField>
        <FormField label="Peso (kg)" error={errors.weightKg}>
          <input className="vx-input" inputMode="numeric" value={v.weightKg ?? ""} onChange={(e) => set("weightKg", numOrNull(e.target.value))} placeholder="70" />
        </FormField>
        <FormField label="Cidade">
          <input className="vx-input" value={v.city ?? ""} onChange={(e) => set("city", e.target.value || null)} placeholder="Brasília - DF" maxLength={80} />
        </FormField>
        <FormField label="Time atual">
          <input className="vx-input" value={v.team ?? ""} onChange={(e) => set("team", e.target.value || null)} placeholder="Ex.: Real Brasília Sub-17" maxLength={80} />
        </FormField>
        <FormField label="Nacionalidade">
          <input className="vx-input" value={v.nationality ?? ""} onChange={(e) => set("nationality", e.target.value || null)} placeholder="Brasileira" maxLength={60} />
        </FormField>
      </fieldset>
      {!readOnly && (
        <div className="mb-admin-form-actions">
          {onCancel && <button type="button" className="vx-btn" onClick={onCancel}>Cancelar</button>}
          <button type="submit" className="vx-btn vx-btn--gold" disabled={!valid || saving || (!dirty && Boolean(initial.fullName))}><Save /> {saving ? "Salvando..." : submitLabel}</button>
        </div>
      )}
    </form>
  )
}
