import { useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Clapperboard, Clock3, ExternalLink, Link2, Loader2, Send, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatMatchDate, parseVideo } from "../model"
import { CLIENT_BASE } from "../paths"
import { submitMatchVideo, youtubeThumb, youtubeWatch, type Submission, type SubmissionStatus } from "../scoutLayer"

const YT_ID = /^[A-Za-z0-9_-]{11}$/

/** Id do YouTube no link colado (só YouTube; o banco confere de novo). */
function youtubeIdOf(url: string) {
  const v = parseVideo(url.trim())
  return v?.kind === "youtube" && YT_ID.test(v.id) ? v.id : null
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * "Enviar um jogo": o atleta cola o link do YouTube e a equipe recebe na caixa de envios.
 * A miniatura e o link que aparecem na tela são refeitos a partir do id do vídeo, nunca do
 * texto colado. `disabled`: a equipe vendo a área como o atleta.
 */
export function SubmitMatchCard({ preview, disabled, onSent }: { preview: boolean; disabled: boolean; onSent: (s: Submission) => void }) {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [opponent, setOpponent] = useState("")
  const [playedOn, setPlayedOn] = useState("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const id = useMemo(() => youtubeIdOf(url), [url])
  const typed = url.trim().length > 0
  const thumb = id ? youtubeThumb(id) : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || sending || disabled) return
    setSending(true)
    try {
      const s = await submitMatchVideo({ url, opponent, playedOn, note }, preview)
      toast({ title: "Jogo enviado", description: "A equipe recebeu o link e avisa quando a análise ficar pronta." })
      setUrl("")
      setOpponent("")
      setPlayedOn("")
      setNote("")
      onSent(s)
    } catch (err) {
      toast({ title: "Não foi possível enviar", description: err instanceof Error ? err.message : "Tente de novo em instantes.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="enviar" className="vx-card sm-card">
      <div aria-hidden="true" className="gm-hero-glow" />
      <div className="sm-head">
        <span className="sm-icon"><Clapperboard /></span>
        <div className="min-w-0">
          <p className="gm-eyebrow">Análise lance a lance</p>
          <h2>Envie um jogo seu</h2>
          <p>Cole o link do vídeo no YouTube. A equipe marca cada lance seu e a análise aparece aqui, com mapa de calor e nota.</p>
        </div>
      </div>

      <form className="sm-form" onSubmit={(e) => void submit(e)} noValidate>
        <label className="sm-url">
          <span>Link do jogo no YouTube</span>
          <div className={`sm-url-box ${typed ? (id ? "is-ok" : "is-bad") : ""}`}>
            <Link2 aria-hidden="true" />
            <input
              className="vx-input" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://youtu.be/..."
              value={url} onChange={(e) => setUrl(e.target.value)} disabled={disabled} maxLength={500}
              aria-invalid={typed && !id} aria-describedby="sm-url-hint"
            />
            {typed && (id ? <CheckCircle2 className="sm-url-state is-ok" aria-label="Link válido" /> : <XCircle className="sm-url-state is-bad" aria-label="Link inválido" />)}
          </div>
          <small id="sm-url-hint" className={typed && !id ? "is-bad" : ""}>
            {typed && !id ? "Use um link do YouTube (youtube.com ou youtu.be)." : "Deixe o vídeo como “Não listado”: só quem tem o link consegue ver."}
          </small>
        </label>

        {thumb && (
          <div className="sm-preview">
            <img src={thumb} alt="Miniatura do vídeo" width={480} height={360} loading="lazy" decoding="async" />
            <span>Vídeo encontrado</span>
          </div>
        )}

        <div className="sm-row">
          <label>
            <span>Adversário <em>opcional</em></span>
            <input className="vx-input" value={opponent} onChange={(e) => setOpponent(e.target.value)} maxLength={80} placeholder="Ex.: Ceilândia Sub-17" disabled={disabled} />
          </label>
          <label>
            <span>Data do jogo <em>opcional</em></span>
            <input className="vx-input" type="date" value={playedOn} max={today()} min="2000-01-01" onChange={(e) => setPlayedOn(e.target.value)} disabled={disabled} />
          </label>
        </div>
        <label>
          <span>Recado para a equipe <em>opcional</em></span>
          <textarea className="vx-input vx-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ex.: Joguei de camisa 10, entrei no segundo tempo." disabled={disabled} />
        </label>

        <div className="sm-foot">
          <p>Até 5 jogos esperando a equipe por vez.</p>
          <button type="submit" className="vx-btn vx-btn--gold" disabled={!id || sending || disabled} title={disabled ? "Só o atleta envia, na conta dele" : undefined}>
            {sending ? <><Loader2 className="sm-spin" /> Enviando...</> : <><Send /> Enviar jogo</>}
          </button>
        </div>
      </form>
    </section>
  )
}

const STATUS: Record<SubmissionStatus, { label: string; icon: typeof Clock3 }> = {
  enviado: { label: "Na fila da equipe", icon: Clock3 },
  em_analise: { label: "Em análise", icon: Loader2 },
  analisado: { label: "Analisado", icon: CheckCircle2 },
  recusado: { label: "Não deu para analisar", icon: XCircle },
}

/** Os jogos que a pessoa mandou, com o andamento de cada um. */
export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) return null
  return (
    <section className="vx-card sm-list">
      <h3 className="vx-card-title">Meus envios</h3>
      <p className="vx-card-sub">O andamento de cada jogo que você mandou para a equipe.</p>
      <ul className="vx-stagger">
        {submissions.map((s, i) => {
          const st = STATUS[s.status]
          const watch = youtubeWatch(s.videoId)
          const thumb = youtubeThumb(s.videoId)
          return (
            <li key={s.id} className={`is-${s.status}`} style={{ "--i": Math.min(i, 10) } as React.CSSProperties}>
              {thumb && <img src={thumb} alt="" width={96} height={54} loading="lazy" decoding="async" />}
              <div className="min-w-0 flex-1">
                <b className="block truncate">{s.opponent ? `Jogo contra ${s.opponent}` : "Jogo enviado"}</b>
                <small className="block truncate">
                  {s.playedOn ? formatMatchDate(s.playedOn) : "Sem data"} · enviado em {formatMatchDate(s.createdAt.slice(0, 10))}
                </small>
                {s.status === "recusado" && s.reviewNote && <small className="sm-review">{s.reviewNote}</small>}
              </div>
              <span className={`sm-status is-${s.status}`}><st.icon aria-hidden="true" />{st.label}</span>
              {s.status === "analisado" && s.matchId
                ? <Link to={`${CLIENT_BASE}/partidas/${s.matchId}`} className="vx-btn h-8">Ver análise <ArrowRight /></Link>
                : watch && <a className="vx-icon-btn" href={watch} target="_blank" rel="noopener noreferrer" aria-label="Abrir o vídeo no YouTube" title="Abrir no YouTube"><ExternalLink /></a>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
