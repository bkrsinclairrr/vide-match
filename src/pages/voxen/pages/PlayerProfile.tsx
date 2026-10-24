import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Check, ClipboardList, NotebookPen, Pencil, PencilLine, Radar, Save, UserRoundSearch, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "../store"
import {
  LINES, SCOUT_ATTRS, dimensionScores, formatDate, formatPhone, initials, pctTone, placeOf,
  positionOf, scoreTone, scoreUnit, scoutAverage, scoutTone, type Player, type Profile,
} from "../data"
import { Est } from "../estimated"
import { isProspect } from "../prospects"
import { ChartEditor, type ChartTab } from "./chartedit/ChartEditor"
import { originalOf, pitchOf, summaryOf } from "./chartedit/model"
import { MaterialsSection } from "./media/MaterialsSection"
import { PlayerHero } from "./hero/PlayerHero"
import { PlayerOpportunities } from "./opportunities/PlayerOpportunities"
import { Meter, Pitch, RadarChart, Ring, CountUp } from "../charts"
import { CardHead, Empty, ScoreChip } from "../ui"

const PlayerEditor = lazy(() => import("./PlayerEditor"))

const norm = scoreUnit

type ChartPart = "geral" | "radar" | "campo" | "indicadores"

/** O lápis do canto de um gráfico: abre o editor (só para quem mantém jogador). */
function ChartButton({ tab, onEdit }: { tab: ChartTab; onEdit: (t: ChartTab) => void }) {
  const { canScout } = useVoxen()
  if (!canScout) return null
  return (
    <button type="button" className="vx-icon-btn ce-edit vx-no-print" onClick={() => onEdit(tab)} aria-label="Editar os gráficos" title="Editar as notas, a nota geral, a posição e o calor">
      <Pencil />
    </button>
  )
}

/** "Editado pela equipe", com o que mudou, o original e o motivo na dica; só aparece se este gráfico foi mudado. */
function ChartBadge({ p, part }: { p: Player; part: ChartPart }) {
  const c = p.chart
  const hasStats = Boolean(c && Object.keys(c.stats).length)
  const edited = Boolean(c && (part === "campo" ? c.marker || c.heat !== null : part === "geral" ? hasStats || c.overall !== null : hasStats))
  if (!c || !edited) return null
  const original = originalOf(p)
  const extra = [part === "geral" || part === "indicadores" ? `Nota geral original: ${original.overall}.` : null, c.note ? `Motivo: ${c.note}.` : null].filter(Boolean).join(" ")
  return (
    <div className="ce-badge-row">
      <span className="ce-badge" title={`Mudou: ${summaryOf(c).join(", ")}. ${extra} O atleta continua vendo o relatório que recebeu.`.replace(/\s+/g, " ")}>
        <PencilLine /> Editado pela equipe
      </span>
    </div>
  )
}

function ScoutCard({ p }: { p: Player }) {
  const { updateMeta, canScout } = useVoxen()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, number>>({})

  const scout = p.meta.scout
  const avg = scoutAverage(scout)

  const startEdit = () => {
    setDraft(Object.fromEntries(SCOUT_ATTRS.map((a) => [a.key, scout?.[a.key] ?? 3])))
    setEditing(true)
  }

  const save = async () => {
    await updateMeta(p.key, { scout: draft })
    setEditing(false)
    toast({ title: "Avaliação salva", description: `Média ${scoutAverage(draft)?.toFixed(1)} de 5.` })
  }

  const values = editing ? draft : scout
  const ordered = values
    ? [...SCOUT_ATTRS].sort((a, b) => (values[b.key] ?? 0) - (values[a.key] ?? 0))
    : []

  return (
    <section className="vx-card">
      <CardHead
        title={<span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-300" /> Avaliação do scout</span>}
        sub="Notas de 1 a 5 dadas pela equipe depois de ver os vídeos do atleta"
        actions={
          <div className="vx-no-print flex gap-2">
            {!canScout ? null : editing ? (
              <>
                <button type="button" className="vx-btn" onClick={() => setEditing(false)}><X /> Cancelar</button>
                <button type="button" className="vx-btn vx-btn--gold" onClick={() => void save()}><Save /> Salvar</button>
              </>
            ) : (
              <button type="button" className="vx-btn" onClick={startEdit}><Pencil /> {scout ? "Editar" : "Avaliar"}</button>
            )}
          </div>
        }
      />

      {!values ? (
        <Empty icon={<UserRoundSearch className="h-6 w-6" />} title="Ainda sem avaliação da equipe">
          Assista aos vídeos que o atleta enviar pelo WhatsApp e registre as notas aqui: elas viram o radar,
          entram no comparativo e ficam visíveis para todos os admins.
          {canScout && <div className="mt-4"><button type="button" className="vx-btn vx-btn--gold" onClick={startEdit}><Pencil /> Avaliar agora</button></div>}
        </Empty>
      ) : (
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="relative mx-auto w-full max-w-[400px]">
            <RadarChart
              key={editing ? "edit" : JSON.stringify(values)}
              axes={SCOUT_ATTRS.map((a) => a.label.replace("Oferecer linha de passe", "Linha de passe").replace("Movimento sem bola", "Mov. sem bola"))}
              series={[{ name: p.name, color: "#f97316", values: SCOUT_ATTRS.map((a) => (values[a.key] ?? 0) / 5) }]}
              size={380}
            />
            {avg !== null && !editing && (
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-white/10 bg-black/60 px-3 py-1.5">
                <span className="text-[20px] font-extrabold tnum leading-none" style={{ color: scoutTone(avg) }}>{avg.toFixed(1)}</span>
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-500">média</span>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {(editing ? SCOUT_ATTRS : ordered).map((a) => {
              const v = values[a.key] ?? 0
              const color = scoutTone(v)
              return (
                <div key={a.key} className="vx-attr" style={{ borderColor: `${color}33`, background: `linear-gradient(90deg, ${color}14, transparent)` }}>
                  <span className="vx-attr-label">{a.label}</span>
                  {editing ? (
                    <input
                      type="range" min={1} max={5} step={0.5} value={v}
                      onChange={(e) => setDraft((d) => ({ ...d, [a.key]: Number(e.target.value) }))}
                      className="vx-range" aria-label={`${a.label}: ${v}`}
                    />
                  ) : (
                    <Meter value={(v / 5) * 100} color={color} />
                  )}
                  <span className="vx-attr-value" style={{ color }}>{Number.isInteger(v) ? v : v.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function NotesCard({ p }: { p: Player }) {
  const { updateMeta, data, canScout } = useVoxen()
  const [text, setText] = useState(p.meta.notes)
  const [saved, setSaved] = useState(true)

  useEffect(() => { setText(p.meta.notes) }, [p.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (saved) return
    const t = window.setTimeout(() => setSaved(true), 900)
    return () => window.clearTimeout(t)
  }, [saved, text])

  return (
    <section className="vx-card">
      <CardHead
        title={<span className="inline-flex items-center gap-2"><NotebookPen className="h-4 w-4 text-amber-300" /> Notas da equipe</span>}
        sub={data?.sharedMeta ? "Compartilhadas com toda a equipe" : "Salvas neste navegador até a atualização do banco"}
        actions={!canScout ? <span className="text-[12px] text-zinc-500">Somente leitura</span> : <span className="text-[12px] text-zinc-500" aria-live="polite">{saved ? <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3.5 w-3.5" /> Salvo</span> : "Salvando..."}</span>}
      />
      <textarea
        className="vx-input vx-textarea"
        value={text}
        readOnly={!canScout}
        maxLength={5000}
        placeholder="Combinados com a família, impressões dos vídeos, próximos passos..."
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
          void updateMeta(p.key, { notes: e.target.value })
        }}
        aria-label="Notas da equipe"
      />
    </section>
  )
}

export default function PlayerProfile() {
  const { key = "" } = useParams()
  const { byKey, percentile, canScout } = useVoxen()
  const [editing, setEditing] = useState(false)
  const [chartTab, setChartTab] = useState<ChartTab | null>(null)
  const p = byKey.get(key)

  const dims = useMemo(() => (p ? dimensionScores(p) : []), [p])

  if (!p) {
    return (
      <div className="vx-card">
        <Empty icon={<UserRoundSearch className="h-6 w-6" />} title="Atleta não encontrado">
          Ele pode ter sido removido da base. <Link to="/voxen/jogadores" className="text-amber-300 underline">Voltar para jogadores</Link>
        </Empty>
      </div>
    )
  }

  const pos = positionOf(p)
  // O campo: a posição do cadastro, ou o que a equipe marcou à mão.
  const pitch = pitchOf(pos ? { x: pos.x, y: pos.y } : null, p.chart)
  const first = p.name.trim().split(/\s+/)[0] || p.name
  const overallPct = percentile("overall", p.overall)
  const tone = scoreTone(p.overall)
  const line = LINES.find((l) => l.key === pos?.line)

  return (
    <>
      <PlayerHero key={`hero-${p.key}`} p={p} editing={editing} onEdit={() => setEditing((v) => !v)} />
      {editing && (
        <Suspense fallback={null}>
          <PlayerEditor key={p.key} p={p} onClose={() => setEditing(false)} />
        </Suspense>
      )}

      <div className="vx-grid mb-[18px] lg:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <section className="vx-card">
          <CardHead
            title="Nota geral"
            sub={p.chart && (Object.keys(p.chart.stats).length || p.chart.overall !== null)
              ? "Ajustada pela equipe"
              : p.reportFromFunnel ? "Relatório do atleta na escala de iniciante" : "Relatório gerado pela plataforma, na escala de iniciante"}
            actions={<ChartButton tab="indicadores" onEdit={setChartTab} />}
          />
          <ChartBadge p={p} part="geral" />
          <div className="flex flex-col items-center gap-5">
            <Ring value={p.overall} max={100} size={170} stroke={12} color={tone.color}>
              <span className="text-[44px] font-extrabold leading-none tracking-[-0.04em] tnum" style={{ color: tone.color }}><CountUp value={p.overall} /></span>
              <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-zinc-500">Geral</span>
            </Ring>
            <div className="text-center">
              <span className="vx-tag" style={{ color: pctTone(overallPct).color, background: `${pctTone(overallPct).color}17` }}>{pctTone(overallPct).label}</span>
              <p className="mt-2 text-[13px] text-zinc-400">Melhor que <strong className="text-white tnum">{overallPct}%</strong> da base</p>
            </div>
            <div className="flex w-full flex-col gap-2.5">
              {dims.map((d, i) => (
                <div key={d.key} className="grid grid-cols-[78px_minmax(0,1fr)_28px] items-center gap-3 text-[12.5px]">
                  <span className="text-zinc-400">{d.label}</span>
                  <Meter value={scoreUnit(d.score) * 100} color={scoreTone(d.score).color} delay={i * 70} />
                  <span className="text-right font-bold tnum" style={{ color: scoreTone(d.score).color }}>{d.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Radar className="h-4 w-4 text-amber-300" /> Radar do relatório</span>}
            sub="Os 10 indicadores individuais"
            actions={<ChartButton tab="indicadores" onEdit={setChartTab} />}
          />
          <ChartBadge p={p} part="radar" />
          <div className="mx-auto max-w-[440px]">
            <RadarChart
              axes={p.stats.map((s) => s.label)}
              series={[{ name: p.name, color: "#fbbf24", values: p.stats.map((s) => norm(s.score)) }]}
              size={420}
              showValues={p.stats.map((s) => s.score)}
            />
          </div>
        </section>

        <section className="vx-card lg:col-span-2 xl:col-span-1">
          <CardHead
            title="Posição em campo"
            sub={pos ? `${p.profile.position} · ${line?.label ?? ""}` : pitch.marker ? "Posição marcada pela equipe" : "Posição não informada no funil"}
            actions={<ChartButton tab="campo" onEdit={setChartTab} />}
          />
          <ChartBadge p={p} part="campo" />
          <div className="mx-auto max-w-[270px]">
            <Pitch
              markers={pitch.marker ? [{ x: pitch.marker.x, y: pitch.marker.y, label: pos?.code ?? initials(p.name), name: first, highlight: true }] : []}
              heat={pitch.heat}
            />
          </div>
          {pos && (
            <dl className="vx-dl mt-4" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
              <div><dt>Pé</dt><dd>{p.profile.foot ?? "—"}</dd></div>
              <div><dt>Altura</dt><dd className="tnum">{p.profile.height ? `${p.profile.height} cm` : "—"}</dd></div>
              <div><dt>Peso</dt><dd className="tnum">{p.profile.weight ? `${p.profile.weight} kg` : "—"}</dd></div>
            </dl>
          )}
        </section>
      </div>

      <PlayerOpportunities key={`oportunidades-${p.key}`} p={p} />

      <section className="vx-card mb-[18px]">
        <CardHead
          title="Indicadores individuais"
          sub="Nota do relatório e posição do atleta dentro da base da Zyron"
          actions={<ChartButton tab="indicadores" onEdit={setChartTab} />}
        />
        <ChartBadge p={p} part="indicadores" />
        <div className="vx-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {[...p.stats].sort((a, b) => b.score - a.score).map((s, i) => {
            const pct = percentile(s.key, s.score)
            const t = pctTone(pct)
            return (
              <div key={s.key} className="vx-stat" style={{ "--i": i } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold text-zinc-200">
                    {s.label}
                    {p.chart?.stats[s.key as keyof typeof p.chart.stats] !== undefined && (
                      <i className="ce-dot" title={`Mudado pela equipe. Nota original: ${originalOf(p).stats.find((o) => o.key === s.key)?.score ?? "—"}`} />
                    )}
                  </span>
                  <ScoreChip score={s.score} size="sm" />
                </div>
                <div className="my-3"><Meter value={pct} color={t.color} height={5} delay={i * 50} /></div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                  <span className="text-[11.5px] text-zinc-500">Melhor que <span className="tnum text-zinc-300">{pct}%</span> da base</span>
                  <span className="vx-tag" style={{ color: t.color, background: `${t.color}14`, padding: "2px 7px", fontSize: 10 }}>{t.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="mb-[18px]"><ScoutCard p={p} /></div>

      <MaterialsSection key={`materiais-${p.key}`} p={p} />

      <div className="vx-grid xl:grid-cols-2">
        <section className="vx-card">
          <CardHead title="Dados do atleta" sub={isProspect(p) ? "Vieram do CRM (wsltda.com); o que está em itálico é estimado pela VOXEN" : "Informados pelo próprio atleta; o que está em itálico é estimado pela VOXEN"} />
          <dl className="vx-dl">
            {([
              ["Nome", p.name, null],
              ...(p.guardianName ? [["Responsável", p.guardianName, null]] as [string, string, null][] : []),
              ["E-mail", p.email ?? "—", null],
              ["WhatsApp", formatPhone(p.phone), null],
              ["Idade", p.profile.age ? `${p.profile.age} anos` : "—", "age"],
              ["Nascimento", p.profile.birthDate ? formatDate(`${p.profile.birthDate}T12:00:00`) : "—", "birthDate"],
              ["Categoria", p.profile.category ?? "—", "category"],
              ["Posição", p.profile.position ?? "—", "position"],
              ["Time atual", p.profile.team ?? "—", "team"],
              ["Melhor pé", p.profile.foot ?? "—", "foot"],
              ["Altura", p.profile.height ? `${p.profile.height} cm` : "—", "height"],
              ["Peso", p.profile.weight ? `${p.profile.weight} kg` : "—", "weight"],
              ["Nacionalidade", p.profile.nationality ?? "—", "nationality"],
              ["Dupla cidadania", p.profile.dualCitizenship ?? "—", null],
              ["Cidade", placeOf(p) ?? "—", "city"],
              ["Origem", p.origin, null],
              ["Campanha", p.utm.campaign ?? "—", null],
              ["Mídia", p.utm.medium ?? "—", null],
              ["Entrada", formatDate(p.createdAt), null],
            ] as [string, string, keyof Profile | null][]).map(([dt, dd, k]) => (
              <div key={dt}><dt>{dt}</dt><dd title={dd}>{k && dd !== "—" ? <Est p={p} k={k}>{dd}</Est> : dd}</dd></div>
            ))}
          </dl>
          {isProspect(p) ? (
            <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
              Pré-cadastro do CRM: a pessoa ainda não se cadastrou na plataforma, então não há e-mail nem telefone aqui e ninguém
              foi contatado. Os dados vêm da wsltda.com e se atualizam sozinhos quando o CRM manda uma versão nova.
            </p>
          ) : !p.hasProfile && (
            <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
              Este cadastro chegou só com nome e contato: posição, categoria, idade e cidade que aparecem aqui são estimados.
              {canScout ? " Use Editar para gravar os dados de verdade." : ""}
            </p>
          )}
        </section>
        <NotesCard p={p} />
      </div>

      {canScout && <ChartEditor key={p.key} open={chartTab !== null} tab={chartTab ?? "indicadores"} onTab={setChartTab} p={p} onClose={() => setChartTab(null)} />}
    </>
  )
}
