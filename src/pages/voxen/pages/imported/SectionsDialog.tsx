import { useState, type CSSProperties, type FormEvent } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { errMsg } from "../scout/api"
import type { ImportedApi } from "./api"
import { SECTION_COLORS, SECTION_IDEAS, plural, type ImportSection } from "./model"

type Draft = { name: string; note: string; color: string }

const blank = (color = SECTION_COLORS[0]): Draft => ({ name: "", note: "", color })

/** Formulário de uma subseção (nova ou em edição). */
export function SectionForm({ initial, onSubmit, onCancel, busy, submitLabel = "Salvar", compact = false }: {
  initial: Draft
  onSubmit: (d: Draft) => void
  onCancel: () => void
  busy: boolean
  submitLabel?: string
  compact?: boolean
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const valid = draft.name.trim().length >= 2
  const submit = (e: FormEvent) => { e.preventDefault(); if (valid && !busy) onSubmit(draft) }
  return (
    <form className={`im-secform ${compact ? "is-compact" : ""}`} onSubmit={submit}>
      <label className="op-field">
        <span>Nome da subseção</span>
        <input className="vx-input" value={draft.name} maxLength={60} autoFocus placeholder="Ex.: Instagram, Peneira de Goiânia, Indicação do João"
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Nome da subseção" />
      </label>
      {!compact && (
        <label className="op-field">
          <span>Nota <em>(opcional: de onde exatamente, o que esse grupo tem em comum)</em></span>
          <input className="vx-input" value={draft.note} maxLength={300} placeholder="Ex.: quem respondeu o formulário do story do dia 12"
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} aria-label="Nota da subseção" />
        </label>
      )}
      <div className="im-colors" role="radiogroup" aria-label="Cor da subseção">
        {SECTION_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={draft.color === c} aria-label={`Cor ${c}`}
            className={draft.color === c ? "is-on" : ""} style={{ "--c": c } as CSSProperties} onClick={() => setDraft((d) => ({ ...d, color: c }))}>
            {draft.color === c && <Check strokeWidth={3} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="im-secform-actions">
        <button type="button" className="vx-btn h-9" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="submit" className="vx-btn vx-btn--gold h-9" disabled={!valid || busy}><Check /> {submitLabel}</button>
      </div>
    </form>
  )
}

/** Criar, renomear, trocar a cor e excluir as subseções ("de onde especificamente veio"). */
export function SectionsDialog({ open, onOpenChange, api, sections, counts, canAdmin, canScout, onSaved, onDeleted }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  api: ImportedApi
  sections: ImportSection[]
  counts: Map<string, number>
  canAdmin: boolean
  canScout: boolean
  onSaved: (s: ImportSection) => void
  onDeleted: (id: string) => void
}) {
  const { toast } = useToast()
  const [editing, setEditing] = useState<string | "new" | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = (v: boolean) => { if (!v) { setEditing(null); setAsking(null); setError(null) } onOpenChange(v) }

  const save = async (id: string | undefined, d: Draft) => {
    setBusy(true)
    setError(null)
    try {
      const saved = await api.saveSection({ id, name: d.name, note: d.note || null, color: d.color })
      onSaved(saved)
      setEditing(null)
      toast({ title: id ? "Subseção atualizada" : "Subseção criada", description: saved.name })
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (s: ImportSection) => {
    setBusy(true)
    setError(null)
    try {
      await api.deleteSection(s.id)
      onDeleted(s.id)
      setAsking(null)
      toast({ title: "Subseção excluída", description: `${s.name}. Ninguém foi apagado.` })
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const nextColor = SECTION_COLORS[sections.length % SECTION_COLORS.length]

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="vx-portal im-dialog max-w-xl p-0" aria-describedby={undefined}>
        <div className="im-dialog-head">
          <DialogTitle>Subseções dos importados</DialogTitle>
          <p>Aqui você diz de onde especificamente cada importado veio. Crie as subseções que fizerem sentido e, na lista, marque quem pertence a cada uma. Trocar o nome ou a cor não muda quem está dentro.</p>
        </div>

        <div className="im-dialog-body">
          {error && <p className="im-error" role="alert">{error}</p>}

          {editing === "new" ? (
            <SectionForm key="new" initial={blank(nextColor)} busy={busy} submitLabel="Criar subseção" onCancel={() => setEditing(null)} onSubmit={(d) => void save(undefined, d)} />
          ) : canScout ? (
            <button type="button" className="vx-btn vx-btn--gold" onClick={() => { setEditing("new"); setAsking(null); setError(null) }}><Plus /> Nova subseção</button>
          ) : null}

          {sections.length === 0 && editing !== "new" && (
            <div className="im-ideas">
              <p>Ainda não há nenhuma. Comece por uma sugestão (um clique cria) ou crie a sua:</p>
              {canScout && (
                <div>
                  {SECTION_IDEAS.map((name, i) => (
                    <button key={name} type="button" className="vx-chip" disabled={busy}
                      onClick={() => void save(undefined, { name, note: "", color: SECTION_COLORS[i % SECTION_COLORS.length] })}>
                      <Plus className="h-3.5 w-3.5" /> {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <ul className="im-seclist">
            {sections.map((s) => {
              const n = counts.get(s.id) ?? 0
              return (
                <li key={s.id} style={{ "--c": s.color } as CSSProperties}>
                  {editing === s.id ? (
                    <SectionForm initial={{ name: s.name, note: s.note ?? "", color: s.color }} busy={busy} onCancel={() => setEditing(null)} onSubmit={(d) => void save(s.id, d)} />
                  ) : (
                    <>
                      <div className="im-seclist-row">
                        <i aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <b className="block truncate">{s.name}</b>
                          <small>{plural(n, "importado", "importados")}{s.note ? ` · ${s.note}` : ""}</small>
                        </div>
                        {canScout && (
                          <button type="button" className="vx-icon-btn" aria-label={`Editar ${s.name}`} title="Editar" onClick={() => { setEditing(s.id); setAsking(null); setError(null) }}><Pencil /></button>
                        )}
                        {canAdmin && (
                          <button type="button" className="vx-icon-btn op-danger-icon" aria-label={`Excluir ${s.name}`} title="Excluir" onClick={() => { setAsking(s.id); setEditing(null); setError(null) }}><Trash2 /></button>
                        )}
                      </div>
                      {asking === s.id && (
                        <div className="bp-confirm" role="alertdialog" aria-label={`Excluir ${s.name}`}>
                          <p>Excluir <strong>{s.name}</strong>? {n > 0 ? `${plural(n, "importado volta", "importados voltam")} para “Sem subseção”. ` : ""}<strong>Ninguém é apagado</strong>, só a etiqueta.</p>
                          <div>
                            <button type="button" className="vx-btn h-8" onClick={() => setAsking(null)} disabled={busy}>Cancelar</button>
                            <button type="button" className="vx-btn op-danger h-8" onClick={() => void remove(s)} disabled={busy}>Excluir a subseção</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          {!canAdmin && sections.length > 0 && <p className="im-note">Só o administrador exclui subseções.</p>}
        </div>

        <div className="im-dialog-foot">
          <button type="button" className="vx-btn" onClick={() => close(false)}><X /> Fechar</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
