import { useState, type FormEvent } from "react"
import { Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CATEGORIES, POSITIONS, STATES } from "@/data/football"
import { useVoxen } from "../store"
import type { Player, PlayerEdit } from "../data"
import { FormField } from "./members/shared"

const FEET = [["destro", "Destro"], ["canhoto", "Canhoto"], ["ambidestro", "Ambidestro"]]

const num = (s: string) => (s.trim() && /^\d+$/.test(s.trim()) ? Number(s.trim()) : null)
const text = (v: string) => v.trim() || null

type Draft = {
  name: string; email: string; phone: string; age: string; height: string; weight: string
  foot: string; nationality: string; position: string; category: string; state: string; city: string
}

/** Formulário de edição do cadastro (só administrador). Lead: contato e perfil. Conta: perfil de `Atletas`. */
export default function PlayerEditor({ p, onClose }: { p: Player; onClose: () => void }) {
  const { editPlayer } = useVoxen()
  const { toast } = useToast()
  const isLead = p.source === "funil"
  const [saving, setSaving] = useState(false)
  const [d, setD] = useState<Draft>({
    name: p.name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    age: p.profile.age?.toString() ?? "",
    height: p.profile.height?.toString() ?? "",
    weight: p.profile.weight?.toString() ?? "",
    foot: (p.profile.foot ?? "").toLowerCase(),
    nationality: p.profile.nationality ?? "",
    position: p.profile.position ?? "",
    category: p.profile.category ?? "",
    state: p.profile.state ?? "",
    city: p.profile.city ?? "",
  })
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  const digits = d.phone.replace(/\D/g, "")
  const emailOk = !isLead || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())
  const phoneOk = !isLead || digits.length === 10 || digits.length === 11 || digits.length === 13
  const valid = d.name.trim().length >= 2 && emailOk && phoneOk

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    const edit: PlayerEdit = {
      name: d.name,
      ...(isLead ? { email: d.email, phone: d.phone } : {}),
      profile: {
        age: num(d.age), height: num(d.height), weight: num(d.weight), foot: text(d.foot), nationality: text(d.nationality),
        position: text(d.position), category: isLead ? text(d.category) : null, state: isLead ? text(d.state) : null, city: text(d.city),
      },
    }
    try {
      const r = await editPlayer(p.key, edit)
      toast({
        title: "Cadastro atualizado",
        description: r.partial ? "Contato salvo. O perfil só pode ser editado depois que a migração da VOXEN rodar no banco." : p.name,
      })
      onClose()
    } catch (err) {
      toast({ title: "Não foi possível salvar", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="vx-card mb-[18px]">
      <h2 className="vx-card-title">Editar cadastro</h2>
      <p className="vx-card-sub mb-5">{isLead ? "Contato e perfil que o atleta informou no funil." : "Perfil que o atleta preencheu ao criar a conta."}</p>
      <form className="mb-admin-form" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="Nome *" wide>
          <input className="vx-input" value={d.name} maxLength={120} onChange={(e) => set("name", e.target.value)} required />
        </FormField>
        {isLead && (
          <>
            <FormField label="E-mail *" error={d.email && !emailOk ? "Informe um e-mail válido." : undefined}>
              <input className="vx-input" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} required />
            </FormField>
            <FormField label="Telefone *" error={d.phone && !phoneOk ? "Use DDD + número." : undefined}>
              <input className="vx-input" inputMode="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} required />
            </FormField>
          </>
        )}
        <FormField label="Posição">
          <select className="vx-input vx-select" value={d.position} onChange={(e) => set("position", e.target.value)}>
            <option value="">—</option>
            {POSITIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </FormField>
        {isLead && (
          <FormField label="Categoria">
            <select className="vx-input vx-select" value={d.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Idade"><input className="vx-input" inputMode="numeric" value={d.age} onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))} /></FormField>
        <FormField label="Melhor pé">
          <select className="vx-input vx-select" value={d.foot} onChange={(e) => set("foot", e.target.value)}>
            <option value="">—</option>
            {FEET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Altura (cm)"><input className="vx-input" inputMode="numeric" value={d.height} onChange={(e) => set("height", e.target.value.replace(/\D/g, "").slice(0, 3))} /></FormField>
        <FormField label="Peso (kg)"><input className="vx-input" inputMode="numeric" value={d.weight} onChange={(e) => set("weight", e.target.value.replace(/\D/g, "").slice(0, 3))} /></FormField>
        <FormField label="Nacionalidade"><input className="vx-input" value={d.nationality} maxLength={80} onChange={(e) => set("nationality", e.target.value)} /></FormField>
        {isLead && (
          <FormField label="Estado">
            <select className="vx-input vx-select" value={d.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">—</option>
              {STATES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Cidade"><input className="vx-input" value={d.city} maxLength={80} onChange={(e) => set("city", e.target.value)} /></FormField>
        <div className="mb-admin-form-actions">
          <button type="button" className="vx-btn" onClick={onClose}><X /> Cancelar</button>
          <button type="submit" className="vx-btn vx-btn--gold" disabled={!valid || saving}><Save /> {saving ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </section>
  )
}
