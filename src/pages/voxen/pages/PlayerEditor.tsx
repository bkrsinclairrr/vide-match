import { useMemo, useState, type FormEvent } from "react"
import { ChevronRight, Info, Save, Sparkles, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CATEGORIES, POSITIONS, STATES } from "@/data/football"
import { useVoxen } from "../store"
import { editFromPlayer, type Player, type PlayerEdit, type ProfileEdit } from "../data"
import { isEst } from "../estimated"
import { ageFromBirth } from "../people"
import { FormField } from "./members/shared"

const FEET = [["destro", "Destro"], ["canhoto", "Canhoto"], ["ambidestro", "Ambidestro"]]

const num = (s: string) => (s.trim() && /^\d+$/.test(s.trim()) ? Number(s.trim()) : null)
const text = (v: string) => v.trim() || null
const today = () => new Date().toISOString().slice(0, 10)

type Draft = {
  name: string; email: string; phone: string; age: string; height: string; weight: string
  foot: string; nationality: string; position: string; category: string; state: string; city: string
  team: string; birthDate: string
}

const draftOf = (p: Player): Draft => {
  const e = editFromPlayer(p)
  const f = e.profile
  return {
    name: p.name, email: p.email ?? "", phone: p.phone ?? "",
    age: f.age?.toString() ?? "", height: f.height?.toString() ?? "", weight: f.weight?.toString() ?? "",
    foot: (f.foot ?? "").toLowerCase(), nationality: f.nationality ?? "", position: f.position ?? "", category: f.category ?? "",
    state: f.state ?? "", city: f.city ?? "", team: f.team ?? "", birthDate: f.birthDate ?? "",
  }
}

/** O texto do valor estimado de cada campo (vira dica no campo e é o que "Usar os valores estimados" preenche). */
const estimatedDraft = (p: Player): Partial<Draft> => {
  const pr = p.profile
  const pick = (k: keyof typeof pr) => (isEst(p, k) ? String(pr[k] ?? "") : "")
  return {
    age: pick("age"), height: pick("height"), weight: pick("weight"), foot: pick("foot").toLowerCase(), nationality: pick("nationality"),
    position: pick("position"), category: pick("category"), state: pick("state"), city: pick("city"), team: pick("team"),
  }
}

/**
 * Formulário de edição do cadastro. Edita a PESSOA: o que muda vale para o lead do funil, para a conta de atleta e para o
 * membro dela. Os campos mostram o que a pessoa de fato informou; o valor estimado pela VOXEN aparece só como dica no campo
 * vazio (e "Usar os valores estimados" o leva para o formulário, para você conferir e salvar).
 */
export default function PlayerEditor({ p, onClose, onSaved, onNext, nextLabel = "Salvar e ir para o próximo" }: {
  p: Player
  onClose: () => void
  /** Chamado depois de salvar (com quantos campos mudaram). */
  onSaved?: (changed: number) => void
  /** Se vier, aparece o botão que salva e passa para o próximo cadastro da lista. */
  onNext?: () => void
  nextLabel?: string
}) {
  const { editPlayer } = useVoxen()
  const { toast } = useToast()
  const hasLead = p.source === "funil"
  const hasAccount = p.source === "conta" || p.aliases.some((a) => a.startsWith("atleta:"))
  const canTeamAndBirth = hasLead || Boolean(p.memberId)
  const [saving, setSaving] = useState(false)
  const [d, setD] = useState<Draft>(() => draftOf(p))
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const estimates = useMemo(() => estimatedDraft(p), [p])
  const hint = (k: keyof Draft) => (d[k] === "" && estimates[k] ? `Estimado: ${estimates[k]}` : undefined)
  const pending = (Object.keys(estimates) as (keyof Draft)[]).filter((k) => estimates[k] && d[k] === "")

  const digits = d.phone.replace(/\D/g, "")
  const emailOk = !hasLead || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())
  const phoneOk = !hasLead || digits.length === 10 || digits.length === 11 || digits.length === 13
  const birthOk = !d.birthDate || (/^\d{4}-\d{2}-\d{2}$/.test(d.birthDate) && d.birthDate <= today() && d.birthDate >= "1960-01-01")
  const valid = d.name.trim().length >= 2 && emailOk && phoneOk && birthOk
  const emailChanged = hasLead && hasAccount && d.email.trim().toLowerCase() !== (p.email ?? "")

  const categories = d.category && !CATEGORIES.includes(d.category) ? [...CATEGORIES, d.category] : CATEGORIES
  const positions = d.position && !POSITIONS.includes(d.position) ? [...POSITIONS, d.position] : POSITIONS

  const useEstimates = () => setD((x) => {
    const next = { ...x }
    for (const k of Object.keys(estimates) as (keyof Draft)[]) if (estimates[k] && next[k] === "") next[k] = estimates[k] as string
    return next
  })

  const submit = async (e: FormEvent | null, goNext = false) => {
    e?.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    const profile: ProfileEdit = {
      age: d.birthDate ? null : num(d.age), height: num(d.height), weight: num(d.weight), foot: text(d.foot), nationality: text(d.nationality),
      position: text(d.position), category: hasLead || p.memberId ? text(d.category) : null, state: hasLead ? text(d.state) : null, city: text(d.city),
      team: canTeamAndBirth ? text(d.team) : null, birthDate: canTeamAndBirth ? text(d.birthDate) : null,
    }
    // Com o nascimento, a idade é calculada: o que estava digitado não volta.
    if (d.birthDate) profile.age = editFromPlayer(p).profile.age
    const edit: PlayerEdit = { name: d.name, ...(hasLead ? { email: d.email, phone: d.phone } : {}), profile }
    try {
      const r = await editPlayer(p.key, edit)
      if (!r.changed) toast({ title: "Nada mudou", description: "Os dados já estavam assim." })
      else toast({
        title: "Cadastro atualizado",
        description: r.partial ? "Contato salvo. O perfil só pode ser editado depois que a migração da VOXEN rodar no banco." : p.name,
      })
      if (r.warnings.length) toast({ title: "Salvo, mas com um aviso", description: r.warnings.join(" "), variant: "destructive" })
      onSaved?.(r.changed)
      if (goNext && onNext) onNext()
      else onClose()
    } catch (err) {
      toast({ title: "Não foi possível salvar", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="vx-card mb-[18px]">
      <h2 className="vx-card-title">Editar cadastro</h2>
      <p className="vx-card-sub mb-5">
        {hasLead && hasAccount ? "Esta pessoa tem o cadastro do funil e a conta de atleta: o que você mudar vale para os dois."
          : hasLead ? "Contato e perfil que o atleta informou no funil."
          : "Perfil que o atleta preencheu ao criar a conta."}
        {p.memberId ? " A ficha de membro dela também é atualizada." : ""}
      </p>

      {pending.length > 0 && (
        <div className="pe-est" role="note">
          <Sparkles aria-hidden="true" />
          <span>{pending.length === 1 ? "Um campo está" : `${pending.length} campos estão`} vazio{pending.length === 1 ? "" : "s"} e aparece{pending.length === 1 ? "" : "m"} com valor estimado nas listas. Só o que você preencher e salvar vira dado de verdade.</span>
          <button type="button" className="vx-btn h-8" onClick={useEstimates}>Usar os valores estimados</button>
        </div>
      )}

      <form className="mb-admin-form" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="Nome *" wide>
          <input className="vx-input" value={d.name} maxLength={120} onChange={(e) => set("name", e.target.value)} required />
        </FormField>
        {hasLead && (
          <>
            <FormField label="E-mail *" error={d.email && !emailOk ? "Informe um e-mail válido." : undefined}
              hint={emailChanged ? "Trocar o e-mail separa o cadastro da conta de login (que continua com o e-mail antigo)." : undefined}>
              <input className="vx-input" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} required />
            </FormField>
            <FormField label="Telefone *" error={d.phone && !phoneOk ? "Use DDD + número." : undefined}>
              <input className="vx-input" inputMode="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} required />
            </FormField>
          </>
        )}
        <FormField label="Posição" hint={hint("position")}>
          <select className="vx-input vx-select" value={d.position} onChange={(e) => set("position", e.target.value)}>
            <option value="">—</option>
            {positions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </FormField>
        {(hasLead || p.memberId) && (
          <FormField label="Categoria" hint={hint("category")}>
            <select className="vx-input vx-select" value={d.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">—</option>
              {categories.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FormField>
        )}
        {canTeamAndBirth && (
          <FormField label="Nascimento" error={d.birthDate && !birthOk ? "Data inválida." : undefined} hint={d.birthDate ? "A idade é calculada por esta data." : undefined}>
            <input className="vx-input" type="date" value={d.birthDate} min="1960-01-01" max={today()} onChange={(e) => set("birthDate", e.target.value)} />
          </FormField>
        )}
        <FormField label="Idade" hint={d.birthDate ? "Calculada pelo nascimento." : hint("age")}>
          <input className="vx-input" inputMode="numeric" value={d.birthDate ? String(ageFromBirth(d.birthDate) ?? "") : d.age}
            disabled={Boolean(d.birthDate)} onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))} />
        </FormField>
        {canTeamAndBirth && (
          <FormField label="Time atual" hint={hint("team")}>
            <input className="vx-input" value={d.team} maxLength={80} onChange={(e) => set("team", e.target.value)} />
          </FormField>
        )}
        <FormField label="Melhor pé" hint={hint("foot")}>
          <select className="vx-input vx-select" value={d.foot} onChange={(e) => set("foot", e.target.value)}>
            <option value="">—</option>
            {FEET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Altura (cm)" hint={hint("height")}><input className="vx-input" inputMode="numeric" value={d.height} onChange={(e) => set("height", e.target.value.replace(/\D/g, "").slice(0, 3))} /></FormField>
        <FormField label="Peso (kg)" hint={hint("weight")}><input className="vx-input" inputMode="numeric" value={d.weight} onChange={(e) => set("weight", e.target.value.replace(/\D/g, "").slice(0, 3))} /></FormField>
        <FormField label="Nacionalidade" hint={hint("nationality")}><input className="vx-input" value={d.nationality} maxLength={80} onChange={(e) => set("nationality", e.target.value)} /></FormField>
        {hasLead && (
          <FormField label="Estado" hint={hint("state")}>
            <select className="vx-input vx-select" value={d.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">—</option>
              {STATES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Cidade" hint={hint("city")}><input className="vx-input" value={d.city} maxLength={80} onChange={(e) => set("city", e.target.value)} /></FormField>
        {!canTeamAndBirth && (
          <p className="pe-note"><Info aria-hidden="true" /> Conta de atleta sem cadastro de funil nem ficha de membro: time, nascimento e categoria não têm onde ficar guardados.</p>
        )}
        <div className="mb-admin-form-actions">
          <button type="button" className="vx-btn" onClick={onClose}><X /> Cancelar</button>
          {onNext && (
            <button type="button" className="vx-btn" disabled={!valid || saving} onClick={() => void submit(null, true)}>{nextLabel} <ChevronRight /></button>
          )}
          <button type="submit" className="vx-btn vx-btn--gold" disabled={!valid || saving}><Save /> {saving ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </section>
  )
}
