import { useMemo, type CSSProperties, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Globe2, Lock, LockOpen, MapPin, Play } from "lucide-react"
import { CountUp } from "@/pages/voxen/charts"
import { useAthlete } from "../ClientArea"
import { lockedClubs, portfolio, profileLink } from "../game"

/*
 * O que ainda está trancado na jornada. A tela aparece "preenchida" (clubes, análise,
 * comparativo), mas borrada e com o cadeado, e o botão leva ao passo que libera.
 * Nada real fica escondido atrás do borrado: nomes e textos dos clubes são trocados por
 * letras aleatórias antes de chegar à tela; só o escudo (borrado) e as vagas são da base.
 */

/** Selo "Trancado" para cabeçalhos. */
export function LockTag({ children = "Trancado" }: { children?: ReactNode }) {
  return <span className="lk-tag"><Lock /> {children}</span>
}

function Seal({ big = false }: { big?: boolean }) {
  return (
    <span className={`lk-seal ${big ? "is-big" : ""}`} aria-hidden="true">
      <span className="lk-seal-ring" />
      <span className="lk-seal-ring is-late" />
      <Lock />
    </span>
  )
}

/** Cadeado que abre e some quando a área acabou de ser liberada (vai dentro do cartão com `lk-reveal`). */
export function RevealSeal() {
  return <span className="lk-reveal-seal" aria-hidden="true"><span className="lk-reveal-icon"><LockOpen /></span></span>
}

type Step = { label: string; state: "done" | "now" | "locked" }

/** O que cobre a área trancada: cadeado, texto e o botão do passo que libera. */
export function LockPanel({ kicker, title, text, cta, steps, big = false }: {
  kicker?: ReactNode
  title: string
  text: ReactNode
  cta?: ReactNode
  steps?: Step[]
  big?: boolean
}) {
  return (
    <div className={`lk-panel ${big ? "is-big" : ""}`}>
      <Seal big={big} />
      {kicker && <p className="lk-kicker">{kicker}</p>}
      <h3>{title}</h3>
      <p className="lk-text">{text}</p>
      {steps && (
        <ol className="lk-steps">
          {steps.map((s, i) => (
            <li key={s.label} className={`is-${s.state}`}>
              <b>{s.state === "done" ? <Check strokeWidth={3} /> : s.state === "locked" ? <Lock /> : i + 1}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>
      )}
      {cta}
    </div>
  )
}

/** "Completar perfil": o passo que libera quase tudo. No "ver como" da equipe, desligado. */
export function ProfileCta({ label = "Completar perfil" }: { label?: string }) {
  const { account, adminPreview } = useAthlete()
  if (adminPreview) return <button type="button" className="vx-btn vx-btn--gold lk-cta" disabled title="Só o atleta faz isso na conta dele">{label}</button>
  return <Link to={profileLink(account)} className="vx-btn vx-btn--gold lk-cta">{label} <ArrowRight /></Link>
}

/** Texto borrado (para nomes e funções de clube). */
const X = ({ children }: { children: ReactNode }) => <span className="lk-x">{children}</span>

/* ------------------------------------------------------------------ */
/* Oportunidades                                                       */
/* ------------------------------------------------------------------ */

/** Lista de clubes do Início, trancada: escudo e nome borrados, vagas à mostra. */
export function LockedClubsMini({ rows = 12 }: { rows?: number }) {
  const { category } = useAthlete()
  const clubs = useMemo(() => lockedClubs(rows, category === "Sub 20"), [rows, category])
  const pf = useMemo(portfolio, [])
  return (
    <div className="lk-zone lk-zone--rows">
      <ul className="lk-rows" aria-hidden="true">
        {clubs.map((c, i) => (
          <li key={c.id} style={{ "--i": i } as CSSProperties}>
            <span className="gm-club-logo is-sm lk-crest"><span>{c.logo}</span></span>
            <span className="min-w-0 flex-1">
              <b className="block truncate"><X>{c.name}</X></b>
              <small className="block truncate"><X>{c.style}</X> · <span className="tnum">{c.vacancies}</span> vagas</small>
            </span>
          </li>
        ))}
      </ul>
      <LockPanel
        kicker={<><Globe2 /> <span className="tnum"><CountUp value={pf.clubs} /></span> clubes · {pf.countries} países</>}
        title="Tem clube procurando um jogador como você."
        text="Complete o seu perfil para revelar quais clubes do portfólio Zyron procuram o seu jogo."
        cta={<ProfileCta />}
      />
    </div>
  )
}

/** "Outros clubes para o seu perfil", trancado até o perfil ficar completo. */
export function LockedClubGrid({ count = 6 }: { count?: number }) {
  const { category, game } = useAthlete()
  const clubs = useMemo(() => lockedClubs(count, category === "Sub 20"), [count, category])
  const missing = game.completion.missing
  return (
    <div className="lk-zone lk-zone--grid">
      <div className="gm-clubs lk-grid" aria-hidden="true">
        {clubs.map((c, i) => (
          <article key={c.id} className="vx-card gm-club lk-club" style={{ "--i": i } as CSSProperties}>
            <header>
              <span className="gm-club-logo lk-crest"><span>{c.logo}</span></span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate"><X>{c.name}</X></h3>
                <p className="truncate"><MapPin className="inline h-3 w-3" /> <X>{c.place}</X></p>
              </div>
              <span className="gm-fit"><Lock className="inline h-3 w-3" /></span>
            </header>
            <dl>
              <div><dt>Perfil procurado</dt><dd className="truncate"><X>{c.style}</X></dd></div>
              <div><dt>Vagas abertas</dt><dd className="tnum">{c.vacancies}</dd></div>
            </dl>
            <p className="gm-club-desc"><X>{c.text}</X></p>
            <span className="vx-btn w-full lk-btn"><Lock /> Apresentar meu perfil</span>
          </article>
        ))}
      </div>
      <LockPanel
        big
        kicker={<><Lock /> Oportunidades trancadas</>}
        title="Complete o perfil e descubra quem procura o seu jogo."
        text={<>A Zyron cruza os seus dados com o portfólio inteiro e mostra primeiro os clubes que procuram a sua função.{missing.length ? <> Falta só: <strong>{missing.join(", ").toLowerCase()}</strong>.</> : null}</>}
        cta={<ProfileCta label="Completar o perfil e liberar as oportunidades" />}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Análise lance a lance                                               */
/* ------------------------------------------------------------------ */

const DOTS = [8, 15, 22, 31, 38, 47, 55, 63, 70, 78, 86, 92]
const BARS = [82, 64, 91, 48, 73]

/** Prévia borrada da análise (vídeo com lances, mapa de calor e números), só ilustrativa. */
function AnalysisMock() {
  return (
    <div className="lk-mock" aria-hidden="true">
      <div className="lk-mock-video">
        <span className="lk-mock-play"><Play /></span>
        <span className="lk-mock-line">{DOTS.map((d, i) => <i key={d} style={{ left: `${d}%`, "--i": i } as CSSProperties} />)}</span>
      </div>
      <div className="lk-mock-pitch">
        <span className="lk-mock-heat is-a" /><span className="lk-mock-heat is-b" /><span className="lk-mock-heat is-c" />
      </div>
      <div className="lk-mock-stats">
        <span className="lk-mock-score">8,4</span>
        {BARS.map((w, i) => <span key={i} className="lk-mock-bar"><i style={{ width: `${w}%` }} /></span>)}
      </div>
    </div>
  )
}

/**
 * A análise lance a lance trancada: aparece montada, borrada, com o cadeado e o passo a
 * passo para liberar (perfil → vídeo → análise).
 */
export function LockedAnalysis({ title = "Cada lance seu, marcado e medido.", text }: { title?: string; text?: string }) {
  const { game } = useAthlete()
  return (
    <section className="vx-card vx-card--flush lk-analysis">
      <div className="lk-zone lk-zone--analysis">
        <AnalysisMock />
        <LockPanel
          big
          kicker={<><Lock /> Análise lance a lance</>}
          title={title}
          text={text ?? "Libera depois do seu perfil: você manda o vídeo de um jogo e a equipe marca passes, dribles, desarmes e finalizações, com mapa de calor e a nota de cada partida."}
          steps={[
            { label: "Complete o seu perfil", state: game.gates.profile ? "done" : "now" },
            { label: "Envie o vídeo de um jogo", state: game.gates.profile ? "now" : "locked" },
            { label: "Receba a análise aqui", state: "locked" },
          ]}
          cta={<ProfileCta label="Completar perfil primeiro" />}
        />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Comparativo                                                         */
/* ------------------------------------------------------------------ */

const RADAR = [0.82, 0.64, 0.9, 0.58, 0.76, 0.7, 0.86, 0.6, 0.78, 0.68]
const REF = [0.88, 0.8, 0.84, 0.8, 0.86, 0.82, 0.9, 0.8, 0.84, 0.82]

function radarPath(values: number[], r = 92, c = 110) {
  return values.map((v, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2
    return `${i ? "L" : "M"} ${(c + Math.cos(a) * r * v).toFixed(1)} ${(c + Math.sin(a) * r * v).toFixed(1)}`
  }).join(" ") + " Z"
}

/** O comparativo trancado (sem perfil não existe relatório para comparar). */
export function LockedCompare() {
  return (
    <section className="vx-card vx-card--flush lk-analysis">
      <div className="lk-zone lk-zone--analysis">
        <div className="lk-mock lk-mock--compare" aria-hidden="true">
          <svg viewBox="0 0 220 220" className="lk-mock-radar">
            {[0.33, 0.66, 1].map((s) => <path key={s} d={radarPath(Array(10).fill(s))} className="lk-radar-grid" />)}
            <path d={radarPath(REF)} className="lk-radar-ref" />
            <path d={radarPath(RADAR)} className="lk-radar-you" />
          </svg>
          <div className="lk-mock-stats">
            {BARS.concat(BARS.slice(0, 2)).map((w, i) => <span key={i} className="lk-mock-bar"><i style={{ width: `${w}%` }} /></span>)}
          </div>
        </div>
        <LockPanel
          big
          kicker={<><Lock /> Comparativo</>}
          title="Veja o seu jogo lado a lado com a referência da sua posição."
          text="Crie o seu perfil e o comparativo mostra a sua divisão Zyron, os seus pontos fortes e onde subir primeiro."
          cta={<ProfileCta label="Criar meu perfil" />}
        />
      </div>
    </section>
  )
}
