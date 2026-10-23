import "./chartedit.css"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import { Crosshair, Eraser, Flame, Loader2, MousePointer2, RotateCcw, Save, Sparkles, Undo2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { STAT_KEYS } from "@/lib/funnel"
import { POSITIONS, initials, scoreTone, type Player } from "../../data"
import { Pitch, RadarChart, Ring } from "../../charts"
import { useVoxen } from "../../store"
import {
  MAX_HEAT, MAX_NOTE, autoOverall, clampScore, draftOf, editFromDraft, nudge, originalOf, pitchOf, pointFromRect, scoreRange, summaryOf, toggleHeat,
  type ChartDraft, type Point, type StatId,
} from "./model"

export type ChartTab = "indicadores" | "campo"

const norm = (score: number) => (score - 64) / 34

type Mode = "marker" | "heat"

/** O campo em que se mexe: arrastar (ou usar as setas) para pôr o jogador, clicar para pintar ou apagar o calor. */
function PitchPad({ marker, heat, label, name, mode, onMarker, onHeat }: {
  marker: Point | null
  heat: Point[]
  label: string
  name: string
  mode: Mode
  onMarker: (p: Point) => void
  onHeat: (list: Point[]) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const at = (e: PointerEvent) => pointFromRect((ref.current as HTMLDivElement).getBoundingClientRect(), e.clientX, e.clientY)

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if (mode === "marker") {
      dragging.current = true
      onMarker(at(e))
    } else {
      onHeat(toggleHeat(heat, at(e)))
    }
  }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging.current && mode === "marker") onMarker(at(e)) }
  const up = () => { dragging.current = false }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "marker") return
    const step = e.shiftKey ? 5 : 2
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const delta = d[e.key]
    if (!delta) return
    e.preventDefault()
    onMarker(nudge(marker ?? { x: 50, y: 50 }, delta[0], delta[1]))
  }

  return (
    <div ref={ref} className={`ce-pitch is-${mode}`} tabIndex={0} role="application"
      aria-label={mode === "marker" ? "Campo: arraste ou use as setas para mudar a posição do jogador" : "Campo: clique para pintar ou apagar uma mancha de calor"}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
      <Pitch markers={marker ? [{ x: marker.x, y: marker.y, label, name, highlight: true }] : []} heat={heat} />
    </div>
  )
}

/**
 * Editar os gráficos da ficha do jogador: as 10 notas do radar, a nota geral, o lugar no campo e o mapa de calor. Tudo
 * por cima do relatório original, que não é apagado: "Voltar ao original" desfaz. Vale em todo o painel (listas,
 * comparativo, elenco); o atleta continua vendo o relatório que recebeu no funil.
 */
export function ChartEditor({ open, tab, onTab, p, onClose }: {
  open: boolean
  tab: ChartTab
  onTab: (t: ChartTab) => void
  p: Player
  onClose: () => void
}) {
  const { saveChart } = useVoxen()
  const { toast } = useToast()
  const original = useMemo(() => originalOf(p), [p])
  const [draft, setDraft] = useState<ChartDraft>(() => draftOf(p))
  const [mode, setMode] = useState<Mode>("marker")
  const [saving, setSaving] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const first = p.name.trim().split(/\s+/)[0] || p.name
  const bodyRef = useRef<HTMLDivElement>(null)

  // Ao trocar de aba, volta ao topo (no celular a outra aba começava rolada até o fim).
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [tab])

  // Cada vez que a janela abre: parte do que vale hoje.
  useEffect(() => {
    if (!open) return
    setDraft(draftOf(p))
    setMode("marker")
    setSaving(false)
    setAsking(false)
    setError(null)
    // `p` muda quando salvamos; só queremos reiniciar ao abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (patch: Partial<ChartDraft>) => { setDraft((d) => ({ ...d, ...patch })); setError(null) }
  const setStat = (id: StatId, value: number, min = 1) => set({ stats: { ...draft.stats, [id]: clampScore(value, min) } })

  const auto = autoOverall(draft, original)
  const overall = draft.overallMode === "fixed" ? clampScore(draft.overall) : auto
  const tone = scoreTone(overall)
  const next = editFromDraft(draft, original)
  const unchanged = next === null && !p.chart

  const pos = p.profile.position ? POSITIONS[p.profile.position] : undefined
  const base = pos ? { x: pos.x, y: pos.y } : null
  const shown = pitchOf(base, { stats: {}, overall: null, marker: draft.marker, heat: draft.heat, note: null, updatedAt: null })
  const code = pos?.code ?? initials(p.name)
  const heatCount = shown.heat.length

  const submit = async (edit: typeof next, message: string) => {
    setSaving(true)
    try {
      await saveChart(p.key, edit)
      toast({ title: message, description: edit ? `Mudou: ${summaryOf(edit).join(", ")}. Vale em todo o painel.` : `${first} voltou ao relatório original.` })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.")
      setSaving(false)
    }
  }

  const radarValues = STAT_KEYS.map((s) => draft.stats[s.key as StatId])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose() }}>
      <DialogContent className="vx-portal ce-dialog max-w-4xl p-0" aria-describedby={undefined}>
        <div className="ce-head">
          <DialogTitle>Editar os gráficos de {first}</DialogTitle>
          <p>Mude as notas, a nota geral e a posição em campo. A mudança vale em todo o painel (ficha, listas, comparativo). O relatório que {first} recebeu no funil continua como estava.</p>
          <div className="vx-tabs" role="tablist" aria-label="O que editar">
            {([["indicadores", "Notas"], ["campo", "Campo e calor"]] as [ChartTab, string][]).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={`vx-tab ${tab === k ? "is-on" : ""}`} onClick={() => onTab(k)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="ce-body" ref={bodyRef}>
          {tab === "indicadores" ? (
            <>
              <div className="ce-stats">
                {STAT_KEYS.map((s) => {
                  const id = s.key as StatId
                  const was = original.stats.find((x) => x.key === id)?.score ?? 0
                  const v = draft.stats[id]
                  const { min, max } = scoreRange(was)
                  const changed = v !== was
                  const color = scoreTone(v).color
                  return (
                    <div key={id} className={`ce-stat ${changed ? "is-changed" : ""}`}>
                      <div className="ce-stat-name" title={s.desc}>
                        <b>{s.label}</b>
                        <small>{changed ? `era ${was}` : s.desc}</small>
                      </div>
                      <div className="ce-range-wrap">
                        <input type="range" className="ce-range" min={min} max={max} step={1} value={Math.max(min, Math.min(max, v))}
                          style={{ "--v": `${((Math.max(min, v) - min) / (max - min)) * 100}%`, "--c": color } as CSSProperties}
                          onChange={(e) => setStat(id, Number(e.target.value), min)} aria-label={`${s.label}: ${v}`} />
                        <i className="ce-tick" style={{ left: `${((was - min) / (max - min)) * 100}%` }} title={`Nota original: ${was}`} aria-hidden="true" />
                      </div>
                      <input className="ce-num vx-input" inputMode="numeric" maxLength={3} value={v} style={{ color }}
                        onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); set({ stats: { ...draft.stats, [id]: Number.isFinite(n) ? Math.min(100, n) : 0 } }) }}
                        onBlur={() => setStat(id, draft.stats[id] || was, 1)} aria-label={`Nota de ${s.label}`} />
                      <button type="button" className="ce-undo" disabled={!changed} onClick={() => setStat(id, was)} title={`Voltar para ${was}`} aria-label={`Voltar ${s.label} para ${was}`}><Undo2 /></button>
                    </div>
                  )
                })}
              </div>

              <aside className="ce-preview" aria-label="Prévia">
                <div className="ce-ring">
                  <Ring value={overall - 50} max={50} size={132} stroke={10} color={tone.color}>
                    <span className="ce-ring-n tnum" style={{ color: tone.color }}>{overall}</span>
                    <span className="ce-ring-l">Geral</span>
                  </Ring>
                  <div className="ce-overall">
                    <span className="ce-eyebrow">Nota geral</span>
                    <div className="ce-seg" role="radiogroup" aria-label="Como calcular a nota geral">
                      <button type="button" role="radio" aria-checked={draft.overallMode === "auto"} className={draft.overallMode === "auto" ? "is-on" : ""}
                        onClick={() => set({ overallMode: "auto" })}>Automática</button>
                      <button type="button" role="radio" aria-checked={draft.overallMode === "fixed"} className={draft.overallMode === "fixed" ? "is-on" : ""}
                        onClick={() => set({ overallMode: "fixed", overall: draft.overallMode === "fixed" ? draft.overall : auto })}>Fixar</button>
                    </div>
                    {draft.overallMode === "auto"
                      ? <small>A média dos indicadores{auto !== original.overall ? ` (era ${original.overall})` : ""}.</small>
                      : (
                        <div className="ce-fixed">
                          <input type="range" className="ce-range" min={50} max={100} value={Math.max(50, clampScore(draft.overall))}
                            style={{ "--v": `${((Math.max(50, clampScore(draft.overall)) - 50) / 50) * 100}%`, "--c": tone.color } as CSSProperties}
                            onChange={(e) => set({ overall: Number(e.target.value) })} aria-label={`Nota geral fixada: ${clampScore(draft.overall)}`} />
                          <small>Fica {clampScore(draft.overall)} mesmo se as notas mudarem. A média seria {auto}.</small>
                        </div>
                      )}
                  </div>
                </div>
                <div className="ce-radar">
                  <RadarChart axes={STAT_KEYS.map((s) => s.label)} series={[{ name: p.name, color: "#fbbf24", values: radarValues.map(norm) }]} size={300} showValues={radarValues} />
                </div>
              </aside>
            </>
          ) : (
            <>
              <div className="ce-field">
                <PitchPad marker={shown.marker} heat={shown.heat} label={code} name={first} mode={mode}
                  onMarker={(pt) => set({ marker: pt })} onHeat={(list) => set({ heat: list })} />
                <p className="ce-field-note" aria-live="polite">
                  {mode === "marker"
                    ? "Arraste o jogador no campo (ou clique no campo e use as setas)."
                    : `Clique no campo para pintar uma mancha de calor; clique em cima de uma mancha para apagar. ${heatCount} de ${MAX_HEAT}.`}
                </p>
              </div>

              <div className="ce-field-tools">
                <div className="ce-seg" role="radiogroup" aria-label="O que mexer no campo">
                  <button type="button" role="radio" aria-checked={mode === "marker"} className={mode === "marker" ? "is-on" : ""} onClick={() => setMode("marker")}><MousePointer2 /> Posição</button>
                  <button type="button" role="radio" aria-checked={mode === "heat"} className={mode === "heat" ? "is-on" : ""} onClick={() => setMode("heat")}><Flame /> Mapa de calor</button>
                </div>

                <div className="ce-tool">
                  <span className="ce-eyebrow"><Crosshair /> Posição do jogador</span>
                  <select className="vx-input vx-select" value="" aria-label="Colocar na posição"
                    onChange={(e) => { const q = POSITIONS[e.target.value]; if (q) set({ marker: { x: q.x, y: q.y } }) }}>
                    <option value="">Colocar numa posição…</option>
                    {Object.keys(POSITIONS).map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button type="button" className="vx-btn" disabled={!draft.marker} onClick={() => set({ marker: null })}>
                    <RotateCcw /> {pos ? `Voltar à posição do cadastro (${pos.code})` : "Tirar o jogador do campo"}
                  </button>
                  {!pos && !draft.marker && <small>O cadastro não tem posição conhecida: escolha uma acima ou arraste no campo.</small>}
                </div>

                <div className="ce-tool">
                  <span className="ce-eyebrow"><Flame /> Mapa de calor</span>
                  <small>{draft.heat === null ? "Automático: em volta da posição do jogador." : heatCount ? `${heatCount} ${heatCount > 1 ? "manchas pintadas" : "mancha pintada"} à mão.` : "Sem calor no campo."}</small>
                  <div className="ce-tool-row">
                    <button type="button" className="vx-btn" disabled={draft.heat === null} onClick={() => set({ heat: null })}><Sparkles /> Automático</button>
                    <button type="button" className="vx-btn" disabled={draft.heat !== null && draft.heat.length === 0} onClick={() => set({ heat: [] })}><Eraser /> Apagar tudo</button>
                  </div>
                  <small>Para começar do desenho automático e ajustar, escolha “Mapa de calor” e clique no campo.</small>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ce-foot">
          <label className="ce-note">
            <span>Motivo da mudança <em>opcional, só a equipe lê</em></span>
            <input className="vx-input" value={draft.note} maxLength={MAX_NOTE} placeholder="Ex.: Reavaliado depois do jogo de sábado" onChange={(e) => set({ note: e.target.value })} />
          </label>
          {error && <p className="ce-error" role="alert">{error}</p>}
          <div className="ce-actions">
            {p.chart && (asking ? (
              <span className="ce-ask">Apagar todas as mudanças de {first}?
                <button type="button" className="vx-btn ce-danger" disabled={saving} onClick={() => void submit(null, "Gráficos restaurados")}>Voltar ao original</button>
                <button type="button" className="vx-btn" onClick={() => setAsking(false)}>Não</button>
              </span>
            ) : (
              <button type="button" className="vx-btn ce-reset" disabled={saving} onClick={() => setAsking(true)}><RotateCcw /> Voltar tudo ao original</button>
            ))}
            <span className="ce-spacer" />
            <button type="button" className="vx-btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="button" className="vx-btn vx-btn--gold" disabled={saving || unchanged} onClick={() => void submit(next, "Gráficos atualizados")}>
              {saving ? <Loader2 className="ce-spin" /> : <Save />} Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
