import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, Check, ClipboardList, Copy, GitCompareArrows, Mail, NotebookPen, Pencil, Printer, Radar, Save,
  UserRoundSearch, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { useVoxen } from "../store"
import {
  LINES, SCOUT_ATTRS, STAGES, dimensionScores, formatDate, formatDateTime, formatPhone, pctTone, placeOf,
  positionOf, scoreTone, scoutAverage, scoutTone, timeAgo, whatsappLink, type Player,
} from "../data"
import { Meter, Pitch, RadarChart, Ring, CountUp } from "../charts"
import { Avatar, CardHead, Empty, PosBadge, ScoreChip } from "../ui"

const norm = (score: number) => (score - 64) / 34

function Header({ p }: { p: Player }) {
  const { updateMeta } = useVoxen()
  const { toast } = useToast()
  const navigate = useNavigate()
  const wa = whatsappLink(p)

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(formatPhone(p.phone))
      toast({ title: "Telefone copiado", description: formatPhone(p.phone) })
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" })
    }
  }

  const chips = [
    p.profile.category,
    p.profile.age ? `${p.profile.age} anos` : null,
    placeOf(p),
    p.profile.foot ? `Pé ${p.profile.foot.toLowerCase()}` : null,
  ].filter(Boolean) as string[]

  return (
    <section className="vx-card mb-[18px] overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 220px at 10% 0%, rgba(251,191,36,0.12), transparent 70%)" }} />
      <div className="relative flex flex-wrap items-center gap-5">
        <Link to="/voxen/jogadores" className="vx-icon-btn vx-no-print vx-back-btn" aria-label="Voltar para jogadores"><ArrowLeft /></Link>
        <Avatar name={p.name} size={76} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-[22px] font-bold leading-tight tracking-[-0.02em] sm:text-[26px]">{p.name}</h2>
            <PosBadge player={p} />
          </div>
          <p className="mt-1 text-[13.5px] text-zinc-400">{p.profile.position ?? "Posição não informada"}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {chips.map((c) => <span key={c} className="vx-chip h-7 cursor-default">{c}</span>)}
            <span className="vx-chip h-7 cursor-default">Origem: {p.origin}</span>
          </div>
        </div>
        <div className="vx-no-print flex flex-wrap items-center gap-2">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="vx-btn vx-btn--wpp"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>}
          {p.phone && <button type="button" className="vx-btn" onClick={() => void copyPhone()}><Copy /> {formatPhone(p.phone)}</button>}
          {p.email && <a href={`mailto:${p.email}`} className="vx-icon-btn" aria-label={`E-mail para ${p.email}`} title={p.email}><Mail /></a>}
          <button type="button" className="vx-icon-btn" aria-label="Comparar com outros" title="Comparar" onClick={() => navigate(`/voxen/comparativo?p=${encodeURIComponent(p.key)}`)}><GitCompareArrows /></button>
          <button type="button" className="vx-icon-btn" aria-label="Imprimir ficha" title="Imprimir ficha" onClick={() => window.print()}><Printer /></button>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Etapa</span>
        <div className="vx-stages" role="radiogroup" aria-label="Etapa do atleta">
          {STAGES.map((s) => {
            const on = p.meta.stage === s.key
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={on}
                className="vx-stage-btn"
                style={on ? { color: s.color, borderColor: `${s.color}66`, background: `${s.color}17`, boxShadow: `0 0 18px -6px ${s.color}` } : undefined}
                onClick={() => void updateMeta(p.key, { stage: s.key })}
              >
                <span className="vx-stage-dot" style={{ background: s.color }} />{s.label}
              </button>
            )
          })}
        </div>
        <span className="ml-auto text-[12px] text-zinc-500">
          Entrou {timeAgo(p.createdAt)} · {formatDateTime(p.createdAt)}
          {p.meta.updatedAt && <> · atualizado {timeAgo(p.meta.updatedAt)}</>}
        </span>
      </div>
    </section>
  )
}

function ScoutCard({ p }: { p: Player }) {
  const { updateMeta } = useVoxen()
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
            {editing ? (
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
          <div className="mt-4"><button type="button" className="vx-btn vx-btn--gold" onClick={startEdit}><Pencil /> Avaliar agora</button></div>
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
  const { updateMeta, data, demo } = useVoxen()
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
        sub={demo ? "Demonstração: as notas não são gravadas" : data?.sharedMeta ? "Compartilhadas com todos os admins" : "Salvas neste navegador até a atualização do banco"}
        actions={<span className="text-[12px] text-zinc-500" aria-live="polite">{saved ? <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3.5 w-3.5" /> Salvo</span> : "Salvando..."}</span>}
      />
      <textarea
        className="vx-input vx-textarea"
        value={text}
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
  const { byKey, percentile } = useVoxen()
  const p = byKey.get(decodeURIComponent(key))

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
  const overallPct = percentile("overall", p.overall)
  const tone = scoreTone(p.overall)
  const line = LINES.find((l) => l.key === pos?.line)

  return (
    <>
      <Header p={p} />

      <div className="vx-grid mb-[18px] lg:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <section className="vx-card">
          <CardHead
            title="Nota geral"
            sub={p.reportFromFunnel ? "Mesmo relatório exibido ao atleta no resultado" : "Relatório gerado pela plataforma (lead sem relatório salvo)"}
          />
          <div className="flex flex-col items-center gap-5">
            <Ring value={p.overall - 50} max={50} size={170} stroke={12} color={tone.color}>
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
                  <Meter value={((d.score - 64) / 34) * 100} color={scoreTone(d.score).color} delay={i * 70} />
                  <span className="text-right font-bold tnum" style={{ color: scoreTone(d.score).color }}>{d.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><Radar className="h-4 w-4 text-amber-300" /> Radar do relatório</span>} sub="Os 10 indicadores individuais" />
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
          <CardHead title="Posição em campo" sub={pos ? `${p.profile.position} · ${line?.label ?? ""}` : "Posição não informada no funil"} />
          <div className="mx-auto max-w-[270px]">
            <Pitch
              markers={pos ? [{ x: pos.x, y: pos.y, label: pos.code, name: p.name.split(" ")[0], highlight: true }] : []}
              heat={pos ? [{ x: pos.x, y: pos.y }, { x: Math.min(92, Math.max(8, pos.x + (pos.x > 50 ? -8 : 8))), y: Math.max(8, pos.y - 9) }] : []}
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

      <section className="vx-card mb-[18px]">
        <CardHead title="Indicadores individuais" sub="Nota do relatório e posição do atleta dentro da base da Zyron" />
        <div className="vx-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {[...p.stats].sort((a, b) => b.score - a.score).map((s, i) => {
            const pct = percentile(s.key, s.score)
            const t = pctTone(pct)
            return (
              <div key={s.key} className="vx-stat" style={{ "--i": i } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold text-zinc-200">{s.label}</span>
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

      <div className="vx-grid xl:grid-cols-2">
        <section className="vx-card">
          <CardHead title="Dados do atleta" sub="Informados pelo próprio atleta no funil" />
          <dl className="vx-dl">
            {[
              ["Nome", p.name],
              ["E-mail", p.email ?? "—"],
              ["WhatsApp", formatPhone(p.phone)],
              ["Idade", p.profile.age ? `${p.profile.age} anos` : "—"],
              ["Categoria", p.profile.category ?? "—"],
              ["Posição", p.profile.position ?? "—"],
              ["Melhor pé", p.profile.foot ?? "—"],
              ["Altura", p.profile.height ? `${p.profile.height} cm` : "—"],
              ["Peso", p.profile.weight ? `${p.profile.weight} kg` : "—"],
              ["Nacionalidade", p.profile.nationality ?? "—"],
              ["Dupla cidadania", p.profile.dualCitizenship ?? "—"],
              ["Cidade", placeOf(p) ?? "—"],
              ["Origem", p.origin],
              ["Campanha", p.utm.campaign ?? "—"],
              ["Mídia", p.utm.medium ?? "—"],
              ["Entrada", formatDate(p.createdAt)],
            ].map(([dt, dd]) => (
              <div key={dt}><dt>{dt}</dt><dd title={dd}>{dd}</dd></div>
            ))}
          </dl>
          {!p.hasProfile && (
            <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
              Este lead chegou só com nome e contato. Posição, categoria e cidade passam a ser gravados para os próximos
              atletas que concluírem o formulário do funil.
            </p>
          )}
        </section>
        <NotesCard p={p} />
      </div>
    </>
  )
}
