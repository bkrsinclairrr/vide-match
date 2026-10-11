import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, Check, ExternalLink, Eye, EyeOff, FastForward, Film, Keyboard, MapPin, MousePointerClick, Pause, Pencil, Play,
  Rewind, Save, Trash2, Undo2, X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { POSITIONS } from "@/data/football"
import { CardHead, Empty, PageSkeleton } from "@/pages/voxen/ui"
import { CountUp, Ring } from "@/pages/voxen/charts"
import { useVoxen } from "@/pages/voxen/store"
import {
  ACTION_KEYS, GROUPS, actionInfo, eventTone, fmt1, formatClock, formatMatchDate, parseClock, parseVideo, ratingColor, scoreline,
  type ActionGroup, type ActionKey, type Match, type MatchEvent, type Member,
} from "@/pages/membros/model"
import { CORRIDORS, THIRDS, autoRating, summarizeMatch, type MatchSummary } from "@/pages/membros/metrics"
import type { EventInput, MatchInput } from "@/pages/membros/api"
import { HeatMap, PitchLines } from "@/pages/membros/components/Field"
import { EventList, EventTimeline, VideoPlayer, type PlayerApi } from "@/pages/membros/components/Video"
import { MemberAvatar, RatingChip } from "@/pages/membros/components/bits"
import { IndexBars, StatGrid } from "@/pages/membros/components/Stats"
import { FormField, SetupNotice, memberAreaUrl, useAdminSource, useSourceData } from "./shared"

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

const toInput = (e: MatchEvent): EventInput => ({
  matchId: e.matchId, t: e.t, half: e.half, action: e.action, success: e.success, x: e.x, y: e.y, note: e.note,
})

export default function AdminMatch() {
  const { id = "", matchId = "" } = useParams()
  const isNew = matchId === "nova"
  const source = useAdminSource()
  const { demo } = useVoxen()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, error, loading, setData } = useSourceData(source, (s) => s.getBundle(id, false), [id])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Lances marcados nesta sessão, para o Ctrl+Z. Ids "tmp-" ainda estão sendo gravados.
  const stack = useRef<string[]>([])
  const cancelled = useRef(new Set<string>())
  const seq = useRef(0)

  const match = isNew ? null : data?.matches.find((m) => m.id === matchId) ?? null
  const summary = useMemo(() => (match && data ? summarizeMatch(match, data.events) : null), [match, data])

  useEffect(() => {
    stack.current = []
    cancelled.current.clear()
  }, [matchId])

  useEffect(() => {
    if (!confirmDelete) return
    const t = window.setTimeout(() => setConfirmDelete(false), 5000)
    return () => window.clearTimeout(t)
  }, [confirmDelete])

  if (error) return <SetupNotice error={error} />
  if (!data) {
    if (loading) return <PageSkeleton />
    return <div className="vx-card"><Empty icon={<ArrowLeft className="h-6 w-6" />} title="Perfil não encontrado"><Link to="/voxen/membros" className="text-amber-300 underline">Voltar para membros</Link></Empty></div>
  }
  if (!isNew && !match) {
    return <div className="vx-card"><Empty icon={<Film className="h-6 w-6" />} title="Partida não encontrada"><Link to={`/voxen/membros/${id}`} className="text-amber-300 underline">Voltar para o perfil</Link></Empty></div>
  }

  const member = data.member
  const setEvents = (fn: (list: MatchEvent[]) => MatchEvent[]) => setData((b) => (b ? { ...b, events: fn(b.events) } : b))
  const putMatch = (saved: Match) => setData((b) => (b ? {
    ...b,
    matches: b.matches.some((m) => m.id === saved.id) ? b.matches.map((m) => (m.id === saved.id ? saved : m)) : [saved, ...b.matches],
  } : b))

  const saveMatch = async (input: MatchInput) => {
    if (!source) return false
    setSaving(true)
    try {
      const saved = await source.saveMatch(input)
      putMatch(saved)
      toast({ title: isNew ? "Partida criada" : "Partida salva", description: isNew ? "Agora marque as ações no vídeo." : `${saved.team} × ${saved.opponent}` })
      if (isNew) navigate(`/voxen/membros/${member.id}/partidas/${saved.id}`, { replace: true })
      return true
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: errMsg(e), variant: "destructive" })
      return false
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async () => {
    if (!source || !match) return
    try {
      const saved = await source.saveMatch({ ...match, published: !match.published })
      putMatch(saved)
      toast({
        title: saved.published ? "Partida publicada" : "Partida voltou para rascunho",
        description: saved.published ? "O membro já vê esta partida." : "O membro deixa de ver esta partida.",
      })
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: errMsg(e), variant: "destructive" })
    }
  }

  const removeMatch = async () => {
    if (!source || !match) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await source.deleteMatch(match.id)
      toast({ title: "Partida excluída", description: `${match.team} × ${match.opponent}` })
      navigate(`/voxen/membros/${member.id}`)
    } catch (e) {
      setConfirmDelete(false)
      toast({ title: "Não foi possível excluir", description: errMsg(e), variant: "destructive" })
    }
  }

  /** Marca na hora (otimista) e grava em seguida; se falhar, desfaz e avisa. */
  const addEvent = (input: EventInput) => {
    if (!source) return
    const tempId = `tmp-${++seq.current}`
    stack.current.push(tempId)
    setEvents((list) => [...list, { ...input, id: tempId }])
    source.addEvent(input).then(
      (saved) => {
        const i = stack.current.indexOf(tempId)
        if (i >= 0) stack.current[i] = saved.id
        if (cancelled.current.delete(tempId)) {
          void source.deleteEvent(saved.id).catch(() => undefined)
          return
        }
        setEvents((list) => list.map((e) => (e.id === tempId ? saved : e)))
      },
      (e) => {
        stack.current = stack.current.filter((x) => x !== tempId)
        setEvents((list) => list.filter((x) => x.id !== tempId))
        toast({ title: "Não foi possível marcar o lance", description: errMsg(e), variant: "destructive" })
      },
    )
  }

  const deleteEvent = (ev: MatchEvent, offerUndo: boolean) => {
    if (!source) return
    stack.current = stack.current.filter((x) => x !== ev.id)
    setEvents((list) => list.filter((x) => x.id !== ev.id))
    if (ev.id.startsWith("tmp-")) {
      cancelled.current.add(ev.id)
      return
    }
    source.deleteEvent(ev.id).then(
      () => {
        if (!offerUndo) return
        toast({
          title: "Lance apagado",
          description: `${actionInfo(ev.action).label} · ${formatClock(ev.t)}`,
          action: <ToastAction altText="Desfazer" onClick={() => addEvent(toInput(ev))}>Desfazer</ToastAction>,
        })
      },
      (e) => {
        setEvents((list) => [...list, ev])
        toast({ title: "Não foi possível apagar", description: errMsg(e), variant: "destructive" })
      },
    )
  }

  const undo = (): MatchEvent | null => {
    const last = stack.current.pop()
    if (!last) return null
    const ev = data.events.find((x) => x.id === last)
    if (!ev) {
      stack.current.push(last)
      return null
    }
    deleteEvent(ev, false)
    return ev
  }

  const sl = match ? scoreline(match) : null

  return (
    <>
      <section className="vx-card mb-[18px] mb-admin-head">
        <Link to={`/voxen/membros/${member.id}`} className="vx-icon-btn" aria-label={`Voltar para ${member.fullName}`}><ArrowLeft /></Link>
        <MemberAvatar member={member} size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">{member.fullName}</p>
          <h2 className="mt-0.5 truncate text-[20px] font-bold tracking-[-0.01em]">
            {sl ? <>{sl.left} <span className="tnum text-amber-300">{sl.leftGoals} × {sl.rightGoals}</span> {sl.right}</> : "Nova partida"}
          </h2>
          {match && <p className="mt-0.5 text-[12.5px] text-zinc-400">{formatMatchDate(match.playedOn)}{match.competition ? ` · ${match.competition}` : ""}</p>}
        </div>
        {match && summary && (
          <div className="flex flex-wrap items-center gap-2">
            <RatingChip rating={summary.rating} />
            <button type="button" className={`vx-chip ${match.published ? "is-on" : ""}`} aria-pressed={match.published} onClick={() => void togglePublished()}
              title={match.published ? "O membro vê esta partida. Clique para voltar a rascunho." : "Só a equipe vê. Clique para publicar para o membro."}>
              {match.published ? <><Eye className="h-3.5 w-3.5" /> Publicada</> : <><EyeOff className="h-3.5 w-3.5" /> Rascunho · publicar</>}
            </button>
            {member.kind === "membro" && match.published && (
              <a className="vx-btn" href={memberAreaUrl(member.id, `/partidas/${match.id}`, demo)} target="_blank" rel="noopener noreferrer"><ExternalLink /> Ver como membro</a>
            )}
            <button type="button" className={`vx-btn ${confirmDelete ? "mb-btn-danger" : ""}`} onClick={() => void removeMatch()}>
              <Trash2 /> {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </button>
          </div>
        )}
      </section>

      <MatchForm key={match?.id ?? "nova"} member={member} matches={data.matches} match={match}
        autoNow={summary ? autoRating(summary.line) : null} saving={saving} onSave={saveMatch} />

      {match && summary ? (
        <>
          <Tagger key={match.id} match={match} events={summary.events} canUndo={stack.current.length > 0}
            onAdd={addEvent} onDelete={(ev) => deleteEvent(ev, true)} onUndo={undo} />
          <Preview summary={summary} />
        </>
      ) : (
        <section className="vx-card">
          <Empty icon={<Film className="h-6 w-6" />} title="Salve a partida para marcar as ações">
            Com a partida salva, o vídeo abre ao lado de um campo e da paleta de ações. Cada lance marcado vira estatística,
            mapa de calor e nota.
          </Empty>
        </section>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Dados da partida                                                    */
/* ------------------------------------------------------------------ */

type Draft = {
  playedOn: string
  competition: string
  team: string
  opponent: string
  isHome: boolean
  goalsFor: string
  goalsAgainst: string
  minutes: string
  position: string
  videoUrl: string
  rating: string
  summary: string
  published: boolean
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const draftFrom = (m: Match | null, member: Member): Draft => ({
  playedOn: m?.playedOn ?? today(),
  competition: m?.competition ?? "",
  team: m?.team ?? member.team ?? "",
  opponent: m?.opponent ?? "",
  isHome: m?.isHome ?? true,
  goalsFor: m?.goalsFor?.toString() ?? "",
  goalsAgainst: m?.goalsAgainst?.toString() ?? "",
  minutes: m ? m.minutes?.toString() ?? "" : "90",
  position: m?.position ?? member.position ?? "",
  videoUrl: m?.videoUrl ?? "",
  rating: m?.rating?.toString().replace(".", ",") ?? "",
  summary: m?.summary ?? "",
  published: m?.published ?? false,
})

const VIDEO_KINDS = {
  youtube: { label: "YouTube", track: true },
  file: { label: "Arquivo de vídeo", track: true },
  vimeo: { label: "Vimeo", track: false },
  drive: { label: "Google Drive", track: false },
} as const

function draftErrors(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {}
  const intIn = (s: string, max: number) => !s.trim() || (/^\d+$/.test(s.trim()) && Number(s) <= max)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.playedOn)) e.playedOn = "Informe a data do jogo."
  if (!d.team.trim()) e.team = "Informe o time do atleta."
  if (!d.opponent.trim()) e.opponent = "Informe o adversário."
  if (!intIn(d.goalsFor, 99)) e.goalsFor = "De 0 a 99."
  if (!intIn(d.goalsAgainst, 99)) e.goalsAgainst = "De 0 a 99."
  if (!intIn(d.minutes, 130)) e.minutes = "De 0 a 130."
  const r = d.rating.trim().replace(",", ".")
  if (r && !(/^\d{1,2}(\.\d)?$/.test(r) && Number(r) <= 10)) e.rating = "De 0 a 10, com até uma casa decimal."
  const url = d.videoUrl.trim()
  if (url && (!url.startsWith("https://") || url.length > 1000)) e.videoUrl = "Use um link que comece com https://"
  else if (url && !parseVideo(url)) e.videoUrl = "Link não reconhecido. Use YouTube, Vimeo, Google Drive ou um arquivo .mp4/.webm."
  return e
}

function toMatchInput(d: Draft, memberId: string, base: Match | null): MatchInput {
  const int = (s: string) => (s.trim() ? Number(s) : null)
  return {
    id: base?.id,
    memberId,
    playedOn: d.playedOn,
    competition: d.competition.trim() || null,
    team: d.team.trim(),
    opponent: d.opponent.trim(),
    isHome: d.isHome,
    goalsFor: int(d.goalsFor),
    goalsAgainst: int(d.goalsAgainst),
    minutes: int(d.minutes),
    position: d.position || null,
    videoUrl: d.videoUrl.trim() || null,
    rating: d.rating.trim() ? Number(d.rating.trim().replace(",", ".")) : null,
    summary: d.summary.trim() || null,
    // Numa partida existente, quem publica é o botão do topo.
    published: base ? base.published : d.published,
  }
}

const uniq = (values: (string | null | undefined)[]) => [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))]

function MatchForm({ member, matches, match, autoNow, saving, onSave }: {
  member: Member
  matches: Match[]
  match: Match | null
  autoNow: number | null
  saving: boolean
  onSave: (input: MatchInput) => Promise<boolean>
}) {
  const [d, setD] = useState<Draft>(() => draftFrom(match, member))
  const [open, setOpen] = useState(!match)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const errors = draftErrors(d)
  const valid = Object.keys(errors).length === 0
  const dirty = JSON.stringify(d) !== JSON.stringify(draftFrom(match, member))
  const video = parseVideo(d.videoUrl.trim() || null)
  const lists = useMemo(() => ({
    competitions: uniq(matches.map((m) => m.competition)),
    teams: uniq([member.team, ...matches.map((m) => m.team)]),
    opponents: uniq(matches.map((m) => m.opponent)),
  }), [matches, member.team])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || saving) return
    const ok = await onSave(toMatchInput(d, member.id, match))
    if (ok && match) setOpen(false)
  }

  if (match && !open) {
    const kind = parseVideo(match.videoUrl)
    return (
      <section className="vx-card mb-[18px] mb-match-facts">
        <dl>
          <div><dt>Data</dt><dd>{formatMatchDate(match.playedOn)}</dd></div>
          <div><dt>Competição</dt><dd>{match.competition ?? "—"}</dd></div>
          <div><dt>Mando</dt><dd>{match.isHome ? "Casa" : "Fora"}</dd></div>
          <div><dt>Minutos</dt><dd className="tnum">{match.minutes ?? "—"}</dd></div>
          <div><dt>Posição</dt><dd>{match.position ?? member.position ?? "—"}</dd></div>
          <div><dt>Vídeo</dt><dd>{kind ? VIDEO_KINDS[kind.kind].label : "Sem vídeo"}</dd></div>
          <div><dt>Nota</dt><dd>{match.rating !== null ? `${fmt1(match.rating)} (equipe)` : "Calculada"}</dd></div>
        </dl>
        <button type="button" className="vx-btn" onClick={() => setOpen(true)}><Pencil /> Editar dados</button>
      </section>
    )
  }

  return (
    <section className="vx-card mb-[18px]">
      <CardHead
        title={match ? "Dados da partida" : "Cadastrar partida"}
        sub={match ? "O placar, os minutos e o vídeo aparecem para o membro na página da partida." : "Preencha o básico e salve. Depois é só marcar as ações no vídeo."}
        actions={match ? <button type="button" className="vx-icon-btn" aria-label="Fechar sem salvar" onClick={() => { setD(draftFrom(match, member)); setOpen(false) }}><X /></button> : undefined}
      />
      <form className="mb-admin-form" onSubmit={(e) => void submit(e)} noValidate>
        <FormField label="Data do jogo *" error={errors.playedOn}>
          <input className="vx-input" type="date" value={d.playedOn} max={today()} onChange={(e) => set("playedOn", e.target.value)} required />
        </FormField>
        <FormField label="Competição">
          <input className="vx-input" list="mb-dl-competitions" value={d.competition} maxLength={80} onChange={(e) => set("competition", e.target.value)} placeholder="Ex.: Copa Brasília Sub-17" />
        </FormField>
        <FormField label="Time do atleta *" error={d.team || !dirty ? undefined : errors.team}>
          <input className="vx-input" list="mb-dl-teams" value={d.team} maxLength={80} onChange={(e) => set("team", e.target.value)} placeholder="Time em que jogou" required />
        </FormField>
        <FormField label="Adversário *" error={d.opponent || !dirty ? undefined : errors.opponent}>
          <input className="vx-input" list="mb-dl-opponents" value={d.opponent} maxLength={80} onChange={(e) => set("opponent", e.target.value)} placeholder="Nome do adversário" required />
        </FormField>

        <FormField label="Mando">
          <div className="vx-tabs mb-seg" role="group" aria-label="Mando de campo">
            <button type="button" className={`vx-tab ${d.isHome ? "is-on" : ""}`} aria-pressed={d.isHome} onClick={() => set("isHome", true)}>Casa</button>
            <button type="button" className={`vx-tab ${!d.isHome ? "is-on" : ""}`} aria-pressed={!d.isHome} onClick={() => set("isHome", false)}>Fora</button>
          </div>
        </FormField>
        <FormField label="Gols do time" error={errors.goalsFor}>
          <input className="vx-input tnum" inputMode="numeric" value={d.goalsFor} onChange={(e) => set("goalsFor", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="0" />
        </FormField>
        <FormField label="Gols do adversário" error={errors.goalsAgainst}>
          <input className="vx-input tnum" inputMode="numeric" value={d.goalsAgainst} onChange={(e) => set("goalsAgainst", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="0" />
        </FormField>
        <FormField label="Minutos jogados" error={errors.minutes} hint="Base das métricas por 90 minutos.">
          <input className="vx-input tnum" inputMode="numeric" value={d.minutes} onChange={(e) => set("minutes", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="90" />
        </FormField>

        <FormField label="Posição na partida">
          <select className="vx-input vx-select" value={d.position} onChange={(e) => set("position", e.target.value)}>
            <option value="">—</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Nota da equipe" error={errors.rating}
          hint={`Em branco, vale a nota calculada pelas ações${autoNow !== null ? ` (agora ${fmt1(autoNow)})` : ""}.`}>
          <input className="vx-input tnum" inputMode="decimal" value={d.rating} onChange={(e) => set("rating", e.target.value.replace(/[^\d,.]/g, "").slice(0, 4))} placeholder="Ex.: 7,5" />
        </FormField>
        <FormField label="Link do vídeo" wide error={errors.videoUrl}
          hint={video
            ? <span className={VIDEO_KINDS[video.kind].track ? "text-emerald-300" : "text-sky-300"}>
                {VIDEO_KINDS[video.kind].label} · {VIDEO_KINDS[video.kind].track ? "o tempo de cada lance é lido do vídeo" : "só exibição: digite o tempo de cada lance"}
              </span>
            : "YouTube (pode ser não listado), arquivo .mp4/.webm, Vimeo ou Google Drive."}>
          <input className="vx-input" type="url" value={d.videoUrl} maxLength={1000} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        </FormField>

        <FormField label="Comentário da equipe" full hint="O membro lê este comentário na página da partida.">
          <textarea className="vx-input vx-textarea" style={{ minHeight: 96 }} maxLength={4000} value={d.summary} onChange={(e) => set("summary", e.target.value)}
            placeholder="Pontos fortes do jogo, o que melhorar e o que observar no próximo." />
        </FormField>

        <div className="mb-admin-form-actions">
          {!match && (
            <button type="button" className={`vx-chip mr-auto ${d.published ? "is-on" : ""}`} aria-pressed={d.published} onClick={() => set("published", !d.published)}>
              {d.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {d.published ? "Publicar já para o membro" : "Salvar como rascunho"}
            </button>
          )}
          {match && dirty && <span className="mr-auto self-center text-[12px] text-amber-300">Alterações não salvas</span>}
          {match && <button type="button" className="vx-btn" onClick={() => { setD(draftFrom(match, member)); setOpen(false) }}>Cancelar</button>}
          <button type="submit" className="vx-btn vx-btn--gold" disabled={!valid || saving || (Boolean(match) && !dirty)}>
            <Save /> {saving ? "Salvando..." : match ? "Salvar alterações" : "Salvar e marcar ações"}
          </button>
        </div>

        <datalist id="mb-dl-competitions">{lists.competitions.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="mb-dl-teams">{lists.teams.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="mb-dl-opponents">{lists.opponents.map((v) => <option key={v} value={v} />)}</datalist>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Marcação de lances                                                  */
/* ------------------------------------------------------------------ */

type Spot = { x: number; y: number }
type Pending = { action: ActionKey; fail: boolean; t: number; half: 1 | 2; note: string | null }
type Last = { e: EventInput; n: number; undone: boolean }

const KEYMAP = new Map(ACTION_KEYS.map((a) => [actionInfo(a).key, a]))
const PALETTE: { group: ActionGroup; actions: ActionKey[] }[] = (["construcao", "ofensivo", "defensivo", "disciplina"] as ActionGroup[])
  .map((group) => ({ group, actions: ACTION_KEYS.filter((a) => actionInfo(a).group === group) }))
const RATES = [0.5, 1, 1.5, 2]

const round1 = (v: number) => Math.round(v * 10) / 10
const zoneName = (s: Spot) =>
  `${THIRDS[Math.min(2, Math.floor(s.x / (100 / 3)))]} · ${CORRIDORS[Math.min(2, Math.floor(s.y / (100 / 3)))].toLowerCase()}`

function outcomeText(e: Pick<EventInput, "action" | "success">) {
  const info = actionInfo(e.action)
  if (!info.outcome) return ""
  return e.success === false ? (info.failLabel ?? "errado").toLowerCase() : (info.okLabel ?? "certo").toLowerCase()
}

function Tagger({ match, events, canUndo, onAdd, onDelete, onUndo }: {
  match: Match
  events: MatchEvent[]
  canUndo: boolean
  onAdd: (input: EventInput) => void
  onDelete: (e: MatchEvent) => void
  onUndo: () => MatchEvent | null
}) {
  const player = useRef<PlayerApi>(null)
  const video = parseVideo(match.videoUrl)
  const trackable = video?.kind === "youtube" || video?.kind === "file"
  const [time, setTime] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [manual, setManual] = useState(() => events.at(-1)?.t ?? 0)
  const [manualText, setManualText] = useState(() => formatClock(events.at(-1)?.t ?? 0))
  const [spot, setSpot] = useState<Spot | null>(null)
  const [hover, setHover] = useState<Spot | null>(null)
  const [fail, setFail] = useState(false)
  const [half, setHalf] = useState<1 | 2>(() => events.at(-1)?.half ?? 1)
  const [keepSpot, setKeepSpot] = useState(false)
  const [note, setNote] = useState("")
  const [pending, setPending] = useState<Pending | null>(null)
  const [last, setLast] = useState<Last | null>(null)
  const [kbdLost, setKbdLost] = useState(false)
  const counter = useRef(0)

  const counts = useMemo(() => {
    const m = new Map<ActionKey, number>()
    for (const e of events) m.set(e.action, (m.get(e.action) ?? 0) + 1)
    return m
  }, [events])

  const setManualTime = (t: number) => {
    const v = Math.max(0, Math.min(36000, t))
    setManual(v)
    setManualText(formatClock(v))
  }
  const commitManual = () => {
    const v = parseClock(manualText)
    if (v === null) setManualText(formatClock(manual))
    else setManualTime(v)
  }

  const now = () => (trackable ? player.current?.getTime() ?? 0 : manual)

  const step = (delta: number) => {
    if (!trackable) return setManualTime(manual + delta)
    const p = player.current
    if (p) p.seek(Math.max(0, p.getTime() + delta), playing)
  }

  const record = (p: Pending, at: Spot) => {
    const input: EventInput = {
      matchId: match.id,
      t: Math.round(p.t * 100) / 100,
      half: p.half,
      action: p.action,
      success: actionInfo(p.action).outcome ? !p.fail : null,
      x: round1(at.x),
      y: round1(at.y),
      note: p.note,
    }
    onAdd(input)
    setLast({ e: input, n: ++counter.current, undone: false })
    setPending(null)
    setFail(false)
    setNote("")
    setSpot(keepSpot ? at : null)
  }

  const trigger = (action: ActionKey, shift: boolean) => {
    const p: Pending = { action, fail: (fail || shift) && actionInfo(action).outcome, t: now(), half, note: note.trim() || null }
    if (spot) record(p, spot)
    else setPending(p)
  }

  const undo = () => {
    const removed = onUndo()
    if (removed) setLast({ e: removed, n: ++counter.current, undone: true })
  }

  // Atalhos: a função muda a cada render, o listener é um só.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined)
  keyRef.current = (e) => {
    const target = e.target as HTMLElement | null
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault()
      undo()
      return
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const onVideo = target?.tagName === "VIDEO"
    switch (e.key) {
      case " ":
        if (onVideo || !trackable) return
        e.preventDefault()
        player.current?.togglePlay()
        return
      case "ArrowLeft":
      case "ArrowRight":
        if (onVideo) return
        e.preventDefault()
        step((e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 1 : 5))
        return
      case "Escape":
        if (pending) setPending(null)
        return
      case "1":
      case "2":
        setHalf(e.key === "1" ? 1 : 2)
        return
    }
    if (e.repeat) return
    const action = KEYMAP.get(e.key.toLowerCase())
    if (action) {
      e.preventDefault()
      trigger(action, e.shiftKey)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e)
    // Com o foco dentro do player do YouTube, as teclas vão para o vídeo.
    const onBlur = () => window.setTimeout(() => setKbdLost(document.activeElement instanceof HTMLIFrameElement), 0)
    const onFocus = () => setKbdLost(false)
    window.addEventListener("keydown", onKey)
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  const spotAt = (e: ReactMouseEvent<HTMLElement>): Spot => {
    const r = e.currentTarget.getBoundingClientRect()
    const clamp = (v: number) => Math.max(0, Math.min(100, v))
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
  }

  const pick = (s: Spot) => {
    if (pending) record(pending, s)
    else setSpot(s)
  }

  // Clique com o mouse não deixa o botão com foco (o Espaço é do vídeo).
  const releaseFocus = (e: React.PointerEvent) => {
    const b = (e.target as HTMLElement).closest("button")
    if (b) requestAnimationFrame(() => b.blur())
  }

  const recent = events.slice(-12)
  const seekReview = (t: number) => player.current?.seek(Math.max(0, t - 2))

  return (
    <div onPointerUp={releaseFocus}>
      <div className="mb-tagger mb-[18px]">
        <section className="vx-card">
          <CardHead
            title="Vídeo"
            sub={video
              ? `${VIDEO_KINDS[video.kind].label} · ${trackable ? "o tempo de cada lance é lido do vídeo" : "digite o tempo de cada lance ao lado"}`
              : "Sem vídeo: digite o tempo de cada lance ao lado"}
          />
          <VideoPlayer ref={player} url={match.videoUrl} onTime={setTime} onDuration={setDuration} onPlaying={setPlaying} title={`${match.team} × ${match.opponent}`} />
          {trackable && (
            <div className="mb-transport">
              <button type="button" className="vx-icon-btn" onClick={() => step(-5)} aria-label="Voltar 5 segundos" title="Voltar 5 s (←)"><Rewind /></button>
              <button type="button" className="vx-btn vx-btn--gold mb-play" onClick={() => player.current?.togglePlay()}>
                {playing ? <><Pause /> Pausar</> : <><Play /> Play</>}
              </button>
              <button type="button" className="vx-icon-btn" onClick={() => step(5)} aria-label="Avançar 5 segundos" title="Avançar 5 s (→)"><FastForward /></button>
              <span className="mb-transport-time tnum">{formatClock(time ?? 0)}<small> / {duration ? formatClock(duration) : "--:--"}</small></span>
              <div className="vx-tabs mb-seg ml-auto" role="group" aria-label="Velocidade">
                {RATES.map((r) => (
                  <button key={r} type="button" className={`vx-tab ${rate === r ? "is-on" : ""}`} aria-pressed={rate === r}
                    onClick={() => { setRate(r); player.current?.setRate(r) }}>{String(r).replace(".", ",")}×</button>
                ))}
              </div>
            </div>
          )}
          {kbdLost && (
            <p className="mb-kbd-lost"><Keyboard className="h-4 w-4 shrink-0" /> O teclado está no vídeo. Clique fora dele (no campo, por exemplo) para voltar a marcar com as teclas.</p>
          )}
          <div className="mt-4">
            <EventTimeline events={events} duration={duration} time={trackable ? time : manual}
              onSeek={trackable ? (t) => player.current?.seek(t, playing) : setManualTime} />
          </div>
        </section>

        <section className="vx-card">
          <CardHead title="Marcar lance" sub="Toque no campo onde aconteceu e aperte a tecla da ação" />
          <div
            className={`mb-field mb-tag-pitch ${pending ? "is-pending" : ""}`}
            onClick={(e) => pick(spotAt(e))}
            onPointerMove={(e) => setHover(spotAt(e))}
            onPointerLeave={() => setHover(null)}
            role="application"
            aria-label="Campo: toque onde o lance aconteceu. O ataque é para a direita."
          >
            <PitchLines />
            {recent.map((e, i) => (
              <i key={e.id} className="mb-tag-recent" style={{ left: `${e.x}%`, top: `${e.y}%`, background: GROUPS[actionInfo(e.action).group].color, opacity: 0.25 + (i / recent.length) * 0.6 }} />
            ))}
            {hover && <i className="mb-tag-ghost" style={{ left: `${hover.x}%`, top: `${hover.y}%` }} />}
            {spot && <i key={`${spot.x}-${spot.y}`} className="mb-tag-spot" style={{ left: `${spot.x}%`, top: `${spot.y}%` }} />}
            <div className={`mb-tag-banner ${pending ? "is-pending" : ""}`}>
              {pending ? (
                <><MapPin className="h-4 w-4 text-amber-300" /> Onde foi? <b>{actionInfo(pending.action).label}{pending.fail ? " (errado)" : ""}</b> · {formatClock(pending.t)} <kbd>Esc</kbd></>
              ) : spot ? (
                <><MapPin className="h-4 w-4 text-amber-300" /> {zoneName(spot)} · agora a ação</>
              ) : (
                <><MousePointerClick className="h-4 w-4 text-zinc-400" /> Toque onde o lance aconteceu</>
              )}
            </div>
            <span className="mb-tag-dir">Ataque →</span>
          </div>

          <div className="mb-tag-controls">
            <div className="vx-tabs mb-seg" role="group" aria-label="Resultado da próxima ação">
              <button type="button" className={`vx-tab ${!fail ? "is-on" : ""}`} aria-pressed={!fail} onClick={() => setFail(false)}><Check /> Certo</button>
              <button type="button" className={`vx-tab is-fail ${fail ? "is-on" : ""}`} aria-pressed={fail} onClick={() => setFail(true)}><X /> Errado</button>
            </div>
            <div className="vx-tabs mb-seg" role="group" aria-label="Tempo de jogo">
              {([1, 2] as const).map((h) => (
                <button key={h} type="button" className={`vx-tab ${half === h ? "is-on" : ""}`} aria-pressed={half === h} onClick={() => setHalf(h)}>{h}º tempo</button>
              ))}
            </div>
            <button type="button" className={`vx-chip ${keepSpot ? "is-on" : ""}`} aria-pressed={keepSpot} onClick={() => setKeepSpot((k) => !k)}
              title="Mantém o mesmo local para as próximas ações">
              <MapPin className="h-3.5 w-3.5" /> Manter local
            </button>
          </div>

          {!trackable && (
            <div className="mb-manual-time">
              <span>Tempo do lance</span>
              <button type="button" className="vx-icon-btn" onClick={() => setManualTime(manual - 5)} aria-label="Menos 5 segundos"><Rewind /></button>
              <input className="vx-input tnum" value={manualText} onChange={(e) => setManualText(e.target.value)} onBlur={commitManual}
                onKeyDown={(e) => { if (e.key === "Enter") { commitManual(); e.currentTarget.blur() } }} aria-label="Tempo do lance em minutos e segundos" />
              <button type="button" className="vx-icon-btn" onClick={() => setManualTime(manual + 5)} aria-label="Mais 5 segundos"><FastForward /></button>
            </div>
          )}

          <input className="vx-input mt-3" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
            placeholder="Observação do próximo lance (opcional)" aria-label="Observação do próximo lance" />

          {last && (
            <div key={last.n} className={`mb-tag-last ${last.undone ? "is-undone" : eventTone(last.e) === "fail" ? "is-fail" : ""}`} role="status">
              {last.undone ? <Undo2 className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 flex-1">
                <b>{actionInfo(last.e.action).label}</b>{outcomeText(last.e) && ` ${outcomeText(last.e)}`} · {formatClock(last.e.t)} · {last.e.half}º tempo
                {last.undone && " · desfeito"}
              </span>
              {!last.undone && canUndo && <button type="button" className="vx-btn h-7 px-2.5 text-[12px]" onClick={undo}><Undo2 className="h-3.5 w-3.5" /> Desfazer</button>}
            </div>
          )}

          <div className="mb-kbd-hint">
            {trackable && <span><kbd>Espaço</kbd> play/pausa</span>}
            <span><kbd>←</kbd><kbd>→</kbd> 5 s <span className="text-zinc-600">(⇧ 1 s)</span></span>
            <span><kbd>⇧</kbd> + tecla = errado</span>
            <span><kbd>1</kbd><kbd>2</kbd> tempo</span>
            <span><kbd>Ctrl</kbd><kbd>Z</kbd> desfaz</span>
          </div>
        </section>
      </div>

      <section className="vx-card mb-[18px]">
        <CardHead title="Ações" sub="Clique ou use a tecla indicada. Passe-chave e assistência já contam como passe certo; gol já conta como finalização no alvo." />
        <div className="mb-palette">
          {PALETTE.map(({ group, actions }) => (
            <div key={group} className="mb-palette-group">
              <p><i className="mb-swatch" style={{ background: GROUPS[group].color }} />{GROUPS[group].label}</p>
              <div className="mb-palette-grid">
                {actions.map((a) => {
                  const info = actionInfo(a)
                  const n = counts.get(a) ?? 0
                  const flash = last && !last.undone && last.e.action === a
                  return (
                    <button
                      key={flash ? `${a}-${last.n}` : a}
                      type="button"
                      className={`mb-act ${pending?.action === a ? "is-pending" : ""} ${flash ? "is-flash" : ""}`}
                      style={{ "--c": GROUPS[group].color } as CSSProperties}
                      onClick={(e) => trigger(a, e.shiftKey)}
                      title={`${info.label} · tecla ${info.key.toUpperCase()}${info.outcome ? ` (Shift + ${info.key.toUpperCase()} = ${(info.failLabel ?? "errado").toLowerCase()})` : ""}`}
                    >
                      <span className="mb-act-label">{info.label}</span>
                      {n > 0 && <span className="mb-act-count tnum">{n}</span>}
                      <kbd>{info.key}</kbd>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="vx-card mb-[18px]">
        <CardHead title="Lances marcados" sub={`${events.length} ${events.length === 1 ? "ação" : "ações"} · toque para rever no vídeo, × para apagar`} />
        <EventList events={events} time={trackable ? time : null} onSeek={trackable ? seekReview : setManualTime} onDelete={onDelete} maxHeight={380} />
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Prévia do que o membro vê                                           */
/* ------------------------------------------------------------------ */

function Preview({ summary }: { summary: MatchSummary }) {
  const color = ratingColor(summary.rating)
  return (
    <>
      <div className="mb-preview-rule">
        <span><Eye className="h-3.5 w-3.5" /> Prévia do que o membro vê{summary.match.published ? "" : " quando a partida for publicada"}</span>
      </div>
      <div className="vx-grid mb-[18px] lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <section className="vx-card flex flex-col items-center justify-center gap-2">
          <Ring value={summary.rating} max={10} size={116} stroke={9} color={color}>
            <span className="text-[28px] font-extrabold leading-none tnum" style={{ color }}><CountUp value={summary.rating} decimals={1} /></span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500">Nota</span>
          </Ring>
          <small className="text-[11.5px] text-zinc-500">{summary.ratingFromTeam ? "definida pela equipe" : "calculada pelas ações"}</small>
        </section>
        <section className="vx-card">
          <CardHead title="Ofensivo × construção × defensivo" sub="Índices Zyron da partida, de 0 a 5, por 90 minutos" />
          <IndexBars line={summary.line} />
        </section>
      </div>
      <section className="vx-card mb-[18px]">
        <CardHead title="Estatísticas da partida" sub="Atualizam a cada lance marcado" />
        <StatGrid line={summary.line} />
      </section>
      <section className="vx-card">
        <CardHead title="Mapa de calor da partida" sub="Onde cada ação aconteceu, com o ataque para a direita" />
        <HeatMap events={summary.events} controls insights label={`${summary.match.team} × ${summary.match.opponent}`} />
      </section>
    </>
  )
}
