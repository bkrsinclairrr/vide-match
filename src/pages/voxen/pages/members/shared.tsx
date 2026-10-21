import "@/pages/membros/membros.css"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Copy, Database, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CATEGORIES, POSITIONS } from "@/data/football"
import { RadarChart } from "@/pages/voxen/charts"
import { useVoxen } from "@/pages/voxen/store"
import { SetupMissingError, getSource, type DataSource, type MemberInput } from "@/pages/membros/api"
import { CLIENT_BASE } from "@/pages/membros/paths"
import { SCOUT_GROUPS, fmt1, scoutGroupAverage, type Member, type MemberKind } from "@/pages/membros/model"

/** Fonte de dados da área de membros (testes locais quando a VOXEN está em ?demo/?preview). */
export function useAdminSource() {
  const { demo } = useVoxen()
  const [source, setSource] = useState<DataSource | null>(null)
  useEffect(() => {
    let cancelled = false
    void getSource(demo).then((s) => { if (!cancelled) setSource(s) })
    return () => { cancelled = true }
  }, [demo])
  return source
}

/** Área do cliente vista como o membro (só leitura, para admins). */
export function memberAreaUrl(memberId: string, path = "", demo = false) {
  const q = new URLSearchParams({ como: memberId })
  if (import.meta.env.DEV && demo) q.set("demo", "")
  return `${CLIENT_BASE}${path}?${q}`
}

export type Async<T> = { data: T | null; error: Error | null; loading: boolean; reload: () => void; setData: (fn: (d: T | null) => T | null) => void }

/** Carrega `fn(source)` quando a fonte fica pronta e sempre que `deps` mudam. */
export function useSourceData<T>(source: DataSource | null, fn: (s: DataSource) => Promise<T>, deps: unknown[]): Async<T> {
  const [data, setDataState] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!source) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef.current(source)
      .then((d) => { if (!cancelled) setDataState(d) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, tick, ...deps])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((f: (d: T | null) => T | null) => setDataState((d) => f(d)), [])
  return { data, error, loading, reload, setData }
}

const MIGRATION = "supabase/migrations/20261010000000_area_de_membros.sql"

/** Aviso para o admin quando as tabelas da área de membros ainda não existem. */
export function SetupNotice({ error }: { error: Error }) {
  const { toast } = useToast()
  if (!(error instanceof SetupMissingError)) {
    return <div className="vx-card"><p className="text-[13px] text-red-300">{error.message}</p></div>
  }
  return (
    <section className="vx-card">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="vx-empty-icon shrink-0"><Database className="h-6 w-6" /></span>
        <div>
          <h2 className="text-[18px] font-bold">Ative a área de membros no banco de dados</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
            Falta criar as tabelas de membros, partidas e ações. É uma vez só: abra o editor SQL do Supabase, cole o
            conteúdo do arquivo <code className="text-amber-200">{MIGRATION}</code> e clique em <strong className="text-white">Run</strong>.
            Nada que já existe é alterado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="vx-btn vx-btn--gold" href="https://supabase.com/dashboard/project/mehmqibxzxfqdxqjnjad/sql/new" target="_blank" rel="noopener noreferrer">Abrir o editor SQL</a>
            <button type="button" className="vx-btn" onClick={() => { void navigator.clipboard.writeText(MIGRATION); toast({ title: "Caminho copiado", description: MIGRATION }) }}>
              <Copy /> Copiar caminho do arquivo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Formulário de membro / referência                                   */
/* ------------------------------------------------------------------ */

const FEET = ["Destro", "Canhoto", "Ambidestro"]

const blank = (kind: MemberKind): MemberInput => ({
  kind, fullName: "", email: "", birthDate: null, position: null, category: null, foot: null,
  heightCm: null, weightKg: null, city: null, team: null, photoUrl: null, bio: null, active: true,
})

export const inputFromMember = (m: Member): MemberInput => ({
  id: m.id, kind: m.kind, fullName: m.fullName, email: m.email, birthDate: m.birthDate, position: m.position,
  category: m.category, foot: m.foot, heightCm: m.heightCm, weightKg: m.weightKg, city: m.city, team: m.team,
  photoUrl: m.photoUrl, bio: m.bio, scout: m.scout, leadId: m.leadId, active: m.active,
  // Telefone e nacionalidade só entram quando o banco já tem as colunas.
  ...(m.extended ? { phone: m.phone, nationality: m.nationality } : {}),
})

export function FormField({ label, children, hint, error, wide, full }: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
  error?: string
  wide?: boolean
  full?: boolean
}) {
  return (
    <label className={`mb-form-field ${wide ? "is-wide" : ""} ${full ? "is-full" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <small className="is-error">{error}</small> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function MemberForm({
  kind, initial, onSave, onCancel, saving,
}: {
  kind: MemberKind
  initial?: MemberInput
  onSave: (input: MemberInput) => Promise<void> | void
  onCancel?: () => void
  saving?: boolean
}) {
  const [v, setV] = useState<MemberInput>(initial ?? blank(kind))
  const set = <K extends keyof MemberInput>(k: K, val: MemberInput[K]) => setV((x) => ({ ...x, [k]: val }))
  const isMember = v.kind === "membro"
  const emailOk = !isMember || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v.email ?? "").trim())
  const photoOk = !v.photoUrl || /^https:\/\//.test(v.photoUrl)
  const phoneDigits = (v.phone ?? "").replace(/\D/g, "")
  const phoneOk = !phoneDigits || (phoneDigits.length >= 10 && phoneDigits.length <= 15)
  const valid = v.fullName.trim().length >= 2 && emailOk && photoOk && phoneOk

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) void onSave({ ...v, fullName: v.fullName.trim(), email: isMember ? (v.email ?? "").trim().toLowerCase() : null })
  }

  const num = (s: string) => (s.trim() ? Number(s) : null)

  return (
    <form className="mb-admin-form" onSubmit={submit}>
      <FormField label={isMember ? "Nome do atleta *" : "Nome da referência *"} wide>
        <input className="vx-input" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder={isMember ? "Nome completo" : "Ex.: Referência · Meia de elite Sub-20"} required />
      </FormField>
      {isMember && (
        <FormField label="E-mail de acesso *" hint="O atleta cria a conta em /login com este e-mail." wide>
          <input className="vx-input" type="email" value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="nome@gmail.com" required />
        </FormField>
      )}
      <FormField label="Posição">
        <select className="vx-input vx-select" value={v.position ?? ""} onChange={(e) => set("position", e.target.value || null)}>
          <option value="">—</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FormField>
      <FormField label="Categoria">
        <select className="vx-input vx-select" value={v.category ?? ""} onChange={(e) => set("category", e.target.value || null)}>
          <option value="">—</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </FormField>
      {isMember && (
        <FormField label="Nascimento">
          <input className="vx-input" type="date" value={v.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value || null)} />
        </FormField>
      )}
      <FormField label="Melhor pé">
        <select className="vx-input vx-select" value={v.foot ?? ""} onChange={(e) => set("foot", e.target.value || null)}>
          <option value="">—</option>
          {FEET.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </FormField>
      <FormField label="Altura (cm)">
        <input className="vx-input" inputMode="numeric" value={v.heightCm ?? ""} onChange={(e) => set("heightCm", num(e.target.value.replace(/\D/g, "")))} placeholder="178" />
      </FormField>
      <FormField label="Peso (kg)">
        <input className="vx-input" inputMode="numeric" value={v.weightKg ?? ""} onChange={(e) => set("weightKg", num(e.target.value.replace(/\D/g, "")))} placeholder="72" />
      </FormField>
      {isMember && v.phone !== undefined && (
        <FormField label="Telefone (WhatsApp)" hint="Com DDD. Ex.: 61 99999-0000" error={phoneOk ? undefined : "Use DDD e número (10 a 15 dígitos)."}>
          <input className="vx-input" inputMode="tel" value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value.replace(/[^\d\s()+-]/g, "") || null)} placeholder="61 99999-0000" />
        </FormField>
      )}
      {isMember && v.nationality !== undefined && (
        <FormField label="Nacionalidade">
          <input className="vx-input" value={v.nationality ?? ""} onChange={(e) => set("nationality", e.target.value || null)} placeholder="Brasil" maxLength={60} />
        </FormField>
      )}
      <FormField label={isMember ? "Time atual" : "Origem dos dados"}>
        <input className="vx-input" value={v.team ?? ""} onChange={(e) => set("team", e.target.value || null)} placeholder={isMember ? "Ex.: Real Brasília Sub-20" : "Ex.: Perfil de referência"} />
      </FormField>
      {isMember && (
        <FormField label="Cidade">
          <input className="vx-input" value={v.city ?? ""} onChange={(e) => set("city", e.target.value || null)} placeholder="Brasília - DF" />
        </FormField>
      )}
      <FormField label="Foto (link https)" error={photoOk ? undefined : "Use um link que comece com https://"} wide>
        <input className="vx-input" value={v.photoUrl ?? ""} onChange={(e) => set("photoUrl", e.target.value || null)} placeholder="https://..." />
      </FormField>
      {!isMember && (
        <FormField label="Descrição (aparece para os membros)" wide>
          <textarea className="vx-input vx-textarea" style={{ minHeight: 90 }} value={v.bio ?? ""} onChange={(e) => set("bio", e.target.value || null)} placeholder="De onde vêm os dados desta referência." />
        </FormField>
      )}
      <div className="mb-admin-form-actions">
        {onCancel && <button type="button" className="vx-btn" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="vx-btn vx-btn--gold" disabled={!valid || saving}><Save /> {saving ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Avaliação do scout                                                  */
/* ------------------------------------------------------------------ */

export function ScoutEditor({ member, onSave, saving }: { member: Member; onSave: (scout: Record<string, number>) => Promise<void> | void; saving?: boolean }) {
  const initial = () => Object.fromEntries(SCOUT_GROUPS.flatMap((g) => g.attrs.map(([k]) => [k, member.scout?.[k] ?? 3])))
  const [draft, setDraft] = useState<Record<string, number>>(initial)
  const dirty = JSON.stringify(draft) !== JSON.stringify(member.scout ?? {})

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="grid gap-4 sm:grid-cols-2">
        {SCOUT_GROUPS.map((g) => (
          <div key={g.key} className="mb-scout-group">
            <p>{g.label} <b className="tnum">{fmt1(scoutGroupAverage(draft, g.key) ?? 0)}</b></p>
            {g.attrs.map(([k, label]) => {
              const value = draft[k] ?? 3
              return (
                <label key={k} className="mb-scout-row">
                  <span>{label}</span>
                  <input type="range" min={1} max={5} step={0.5} value={value} className="vx-range"
                    onChange={(e) => setDraft((d) => ({ ...d, [k]: Number(e.target.value) }))} aria-label={`${label}: ${value}`} />
                  <b className="tnum">{fmt1(value)}</b>
                </label>
              )
            })}
          </div>
        ))}
      </div>
      <div className="vx-card vx-sticky-xl">
        <RadarChart
          axes={SCOUT_GROUPS.map((g) => g.label)}
          series={[{ name: member.fullName, color: "#f97316", values: SCOUT_GROUPS.map((g) => (scoutGroupAverage(draft, g.key) ?? 0) / 5) }]}
          size={380}
          levels={5}
          showValues={SCOUT_GROUPS.map((g) => fmt1(scoutGroupAverage(draft, g.key) ?? 0))}
        />
        <button type="button" className="vx-btn vx-btn--gold mt-4 w-full" disabled={!dirty || saving} onClick={() => void onSave(draft)}>
          <Save /> {saving ? "Salvando..." : dirty ? "Salvar avaliação" : "Avaliação salva"}
        </button>
        <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">O membro vê esta avaliação no Perfil, nas Métricas scout e no radar do comparativo.</p>
      </div>
    </div>
  )
}
