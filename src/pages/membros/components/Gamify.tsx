import { Link } from "react-router-dom"
import { ArrowRight, Check, Lock, MapPin, Sparkles } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CountUp, Meter } from "@/pages/voxen/charts"
import { CLIENT_BASE } from "../paths"
import { useAthlete } from "../ClientArea"
import { whatsappLink, teamMessage, type Badge, type ClubFit, type Cta, type Game, type Mission } from "../game"

/** "Nível 3 · Promessa" com o número em destaque. */
export function LevelChip({ game }: { game: Game }) {
  return (
    <span className="gm-levelchip">
      <span className="gm-lvl">{game.level}</span>
      <span>Nível {game.level} · <b>{game.title}</b></span>
    </span>
  )
}

/** Barra de XP do nível atual, com o que falta para o próximo. */
export function XpBar({ game }: { game: Game }) {
  return (
    <div className="gm-xp">
      <div className="gm-xp-top">
        <span className="tnum"><b><CountUp value={game.xp} /></b> XP</span>
        <span>{game.next ? <>faltam <b className="tnum">{game.next.at - game.xp}</b> XP para <b>{game.next.title}</b></> : "Nível máximo"}</span>
      </div>
      <div className="gm-xp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={game.pct} aria-label="Progresso para o próximo nível">
        <span style={{ width: `${Math.max(3, game.pct)}%` }} />
      </div>
    </div>
  )
}

function CtaButton({ cta, className = "vx-btn" }: { cta: Cta; className?: string }) {
  if (cta.to) return <Link to={cta.to} className={className}>{cta.label} <ArrowRight /></Link>
  return (
    <a className={`${className} vx-btn--wpp`} href={whatsappLink(cta.whatsapp ?? "")} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon className="h-4 w-4" /> {cta.label}
    </a>
  )
}

export function MissionList({ missions, limit }: { missions: Mission[]; limit?: number }) {
  const list = limit ? missions.filter((m) => !m.done).slice(0, limit) : [...missions].sort((a, b) => Number(a.done) - Number(b.done))
  if (!list.length) {
    return <p className="gm-allclear"><Sparkles className="h-4 w-4" /> Todas as missões concluídas. Falta só a próxima partida.</p>
  }
  return (
    <ul className="gm-missions">
      {list.map((m, i) => (
        <li key={m.key} className={m.done ? "is-done" : ""} style={{ "--i": i } as React.CSSProperties}>
          <span className="gm-mission-icon">{m.done ? <Check strokeWidth={3} /> : <b className="tnum">{m.progress}/{m.target}</b>}</span>
          <div className="min-w-0 flex-1">
            <p className="gm-mission-title">{m.title}{m.xp > 0 && !m.done && <em>+{m.xp} XP</em>}</p>
            <p className="gm-mission-desc">{m.desc}</p>
            {!m.done && <div className="mt-2"><Meter value={(m.progress / m.target) * 100} color="#fbbf24" height={5} delay={i * 80} /></div>}
          </div>
          {!m.done && m.cta && <CtaButton cta={m.cta} className="vx-btn h-8 shrink-0 px-3 text-[12px]" />}
        </li>
      ))}
    </ul>
  )
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="gm-badges">
      {badges.map((b, i) => (
        <div key={b.key} className={`gm-badge ${b.earned ? "is-earned" : ""}`} style={{ "--i": i } as React.CSSProperties}>
          <span className="gm-badge-icon">{b.earned ? <b.icon /> : <Lock />}</span>
          <p className="gm-badge-title">{b.title}</p>
          <p className="gm-badge-desc">{b.desc}</p>
          {b.earned
            ? <span className="gm-badge-state">Conquistado{b.xp ? ` · +${b.xp} XP` : ""}</span>
            : <div className="w-full"><Meter value={(b.progress / b.target) * 100} color="#fbbf24" height={4} delay={i * 50} /><span className="gm-badge-progress tnum">{b.progress}/{b.target}</span></div>}
        </div>
      ))}
    </div>
  )
}

/** Faixa persuasiva que leva ao WhatsApp da equipe, já com o contexto da pessoa. */
export function TeamCta({ title, text, label, topic }: { title: string; text: string; label: string; topic: string }) {
  const { account, category } = useAthlete()
  return (
    <section className="vx-card gm-cta">
      <div aria-hidden="true" className="gm-cta-glow" />
      <div className="relative min-w-0 flex-1">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <a className="vx-btn vx-btn--gold relative" href={whatsappLink(teamMessage(account, category, topic))} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-4 w-4" /> {label}
      </a>
    </section>
  )
}

const FIT_LABEL = ["Possível", "Bom encaixe", "Encaixe direto"] as const

export function ClubCard({ fit, rank }: { fit: ClubFit; rank: number }) {
  const { account, category } = useAthlete()
  const { club } = fit
  return (
    <article className={`vx-card vx-card--hover gm-club is-fit-${fit.affinity}`} style={{ "--i": rank } as React.CSSProperties}>
      <header>
        <span className="gm-club-logo" aria-hidden="true">{club.logo}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate">{club.name}</h3>
          <p className="truncate"><MapPin className="inline h-3 w-3" /> {club.country} · {club.league}</p>
        </div>
        <span className="gm-fit">{FIT_LABEL[fit.affinity]}</span>
      </header>
      <dl>
        <div><dt>Perfil procurado</dt><dd>{club.preferredStyle}</dd></div>
        <div><dt>Vagas abertas</dt><dd className="tnum">{club.openPositions}</dd></div>
      </dl>
      <p className="gm-club-desc">{club.description}</p>
      <a className="vx-btn w-full" href={whatsappLink(teamMessage(account, category, `Quero que a equipe apresente o meu perfil ao ${club.name}.`))} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-4 w-4" /> Apresentar meu perfil
      </a>
    </article>
  )
}

/** Convite para liberar a análise lance a lance (quem ainda não tem acesso). */
export function UnlockCard({ compact = false }: { compact?: boolean }) {
  const { account, category } = useAthlete()
  const steps = [
    ["1", "Mande o vídeo", "Envie o vídeo de um jogo seu pelo WhatsApp da equipe."],
    ["2", "A equipe marca cada lance", "Passes, dribles, desarmes e finalizações, no minuto e no lugar do campo."],
    ["3", "Você vê tudo aqui", "Vídeo com linha do tempo, mapa de calor, notas e evolução jogo a jogo."],
  ]
  return (
    <section className="vx-card gm-unlock">
      <div aria-hidden="true" className="gm-cta-glow" />
      <div className="relative">
        <span className="gm-unlock-tag"><Lock className="h-3.5 w-3.5" /> Análise lance a lance</span>
        <h2>Mostre o seu jogo do jeito que o clube quer ver.</h2>
        <p>
          Quem tem o jogo documentado em vídeo e em números deixa de depender do olhômetro. A equipe da Zyron transforma
          cada partida sua em dados, e você acompanha tudo por aqui.
        </p>
        {!compact && (
          <ol className="gm-steps">
            {steps.map(([n, t, d]) => (
              <li key={n}><b>{n}</b><div><strong>{t}</strong><span>{d}</span></div></li>
            ))}
          </ol>
        )}
        <a className="vx-btn vx-btn--gold" href={whatsappLink(teamMessage(account, category, "Quero liberar a análise lance a lance dos meus jogos."))} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" /> Liberar a análise dos meus jogos
        </a>
      </div>
    </section>
  )
}

export const clientLink = (sub = "") => `${CLIENT_BASE}${sub}`
