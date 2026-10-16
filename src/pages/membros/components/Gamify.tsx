import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Camera, Check, Loader2, Lock, MapPin, Sparkles, type LucideIcon } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CountUp, Meter } from "@/pages/voxen/charts"
import { CLIENT_BASE } from "../paths"
import { useAthlete } from "../ClientArea"
import { whatsappLink, teamMessage, type Badge, type BadgeGroup, type ClubFit, type Cta, type Game, type Mission } from "../game"
import { MemberAvatar } from "./bits"

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

/**
 * Botão de uma missão: link da área, WhatsApp da equipe ou a foto. No "ver como" da equipe,
 * o que só o atleta pode fazer (perfil, foto, mensagem) aparece desligado.
 */
export function CtaButton({ cta, className = "vx-btn" }: { cta: Cta; className?: string }) {
  const { adminPreview, pickPhoto, photoBusy } = useAthlete()
  const internal = cta.to?.startsWith(CLIENT_BASE)
  if (adminPreview && !internal) {
    return <button type="button" className={className} disabled title="Só o atleta faz isso na conta dele">{cta.label}</button>
  }
  if (cta.action === "foto") {
    return (
      <button type="button" className={className} onClick={() => pickPhoto?.()} disabled={!pickPhoto || photoBusy}>
        {photoBusy ? <><Loader2 className="animate-spin" /> Salvando...</> : <><Camera /> {cta.label}</>}
      </button>
    )
  }
  if (cta.to) return <Link to={cta.to} className={className}>{cta.label} <ArrowRight /></Link>
  return (
    <a className={`${className} vx-btn--wpp`} href={whatsappLink(cta.whatsapp ?? "")} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon className="h-4 w-4" /> {cta.label}
    </a>
  )
}

/** Foto do atleta com o botão de trocar (desligado no "ver como" da equipe). */
export function PhotoButton({ size = 72 }: { size?: number }) {
  const { account, pickPhoto, photoBusy } = useAthlete()
  const avatar = <MemberAvatar member={{ fullName: account.name, photoUrl: account.avatarUrl, kind: "membro" }} size={size} ring="#fbbf24" />
  if (!pickPhoto) return avatar
  return (
    <button type="button" className="mb-photo-btn" onClick={pickPhoto} disabled={photoBusy}
      aria-label={account.avatarUrl ? "Trocar a foto do perfil" : "Adicionar foto ao perfil"} title={account.avatarUrl ? "Trocar foto" : "Adicionar foto"}>
      {avatar}
      <span className="mb-photo-cam">{photoBusy ? <Loader2 className="animate-spin" /> : <Camera />}</span>
    </button>
  )
}

/** Linha de cima da missão: a etapa da jornada (ou "Extra") e, se trancada, o que a libera. */
function missionKicker(m: Mission, game: Game) {
  if (!m.step) return <>Extra</>
  return <>Etapa {m.step.n} · {m.step.stage}{game.current?.key === m.key && <span className="gm-now">Agora</span>}</>
}

/**
 * Missões. `limit`: só as que faltam, na ordem da jornada (o Início); sem `limit`, todas, com
 * as concluídas no fim (Conquistas). As trancadas aparecem inteiras, sem censura, com o
 * cadeado e o passo que as libera.
 */
export function MissionList({ missions, limit }: { missions: Mission[]; limit?: number }) {
  const { game } = useAthlete()
  const list = limit ? missions.filter((m) => !m.done).slice(0, limit) : [...missions].sort((a, b) => Number(a.done) - Number(b.done))
  if (!list.length) {
    return <p className="gm-allclear"><Sparkles className="h-4 w-4" /> Todas as missões concluídas. A jornada inteira está feita.</p>
  }
  return (
    <ul className="gm-missions">
      {list.map((m, i) => {
        const current = game.current?.key === m.key
        const cls = m.done ? "is-done" : m.locked ? "is-locked" : current ? "is-current" : ""
        return (
          <li key={m.key} className={cls} style={{ "--i": i } as CSSProperties}
            title={m.locked && m.after ? `Libera depois de: ${m.after}` : undefined}>
            <span className="gm-mission-icon">
              {m.done ? <Check strokeWidth={3} /> : m.locked ? <Lock /> : <b className="tnum">{m.progress}/{m.target}</b>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="gm-mission-kicker">{missionKicker(m, game)}</p>
              <p className="gm-mission-title">{m.title}{m.xp > 0 && !m.done && <>{"\u200B"}<em>+{m.xp} XP</em></>}</p>
              {m.locked
                ? m.after && <p className="gm-mission-after"><Lock /> Libera depois de <b>{m.after}</b></p>
                : <p className="gm-mission-desc">{m.desc}</p>}
              {!m.done && !m.locked && m.target > 1 && <div className="mt-2"><Meter value={(m.progress / m.target) * 100} color="#fbbf24" height={5} delay={i * 80} /></div>}
            </div>
            {!m.done && !m.locked && m.cta && <CtaButton cta={m.cta} className={`vx-btn h-8 shrink-0 px-3 text-[12px] ${current ? "vx-btn--gold" : ""}`} />}
          </li>
        )
      })}
    </ul>
  )
}

const GROUP_HINT: Record<BadgeGroup, string> = {
  Conta: "O seu cadastro",
  Jogo: "Dos seus jogos analisados",
  Carreira: "O que a equipe conquista com você",
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const groups = (["Conta", "Jogo", "Carreira"] as BadgeGroup[]).map((g) => ({ g, list: badges.filter((b) => b.group === g) })).filter((x) => x.list.length)
  let n = 0
  return (
    <div className="gm-badge-groups">
      {groups.map(({ g, list }) => (
        <div key={g}>
          <p className="gm-badge-group"><b>{g}</b><span>{GROUP_HINT[g]}</span><i className="tnum">{list.filter((b) => b.earned).length}/{list.length}</i></p>
          <div className="gm-badges">
            {list.map((b) => {
              const i = n++
              return (
                <div key={b.key} className={`gm-badge ${b.earned ? "is-earned" : ""} ${g === "Carreira" ? "is-career" : ""}`} style={{ "--i": i } as CSSProperties}>
                  <span className="gm-badge-icon">{b.earned ? <b.icon /> : <Lock />}</span>
                  <p className="gm-badge-title">{b.title}</p>
                  <p className="gm-badge-desc">{b.desc}</p>
                  {b.earned
                    ? <span className="gm-badge-state">Conquistado{b.xp ? ` · +${b.xp} XP` : ""}</span>
                    : <div className="w-full"><Meter value={(b.progress / b.target) * 100} color="#fbbf24" height={4} delay={i * 50} /><span className="gm-badge-progress tnum">{b.progress}/{b.target}</span></div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A jornada inteira numa trilha: as seis etapas, com o nome de cada uma na jornada do herói.
 * O traço dourado vai até a etapa em que a pessoa está.
 */
export function JourneyTrack({ journey }: { journey: Mission[] }) {
  const at = journey.findIndex((m) => !m.done)
  // O traço vai até a etapa mais adiantada (a equipe pode marcar uma etapa antes de outra ficar pronta).
  const lastDone = journey.reduce((acc, m, i) => (m.done ? i : acc), -1)
  const reach = at === -1 ? journey.length - 1 : Math.max(at, lastDone)
  const fill = journey.length > 1 ? (reach / (journey.length - 1)) * 100 : 100
  return (
    <ol className="jr-track" style={{ "--fill": `${fill}%` } as CSSProperties} aria-label="Etapas da sua jornada">
      <span className="jr-line" aria-hidden="true"><span /></span>
      {journey.map((m, i) => {
        const state = m.done ? "is-done" : m.locked ? "is-locked" : "is-open"
        return (
          <li key={m.key} className={`${state} ${i === at ? "is-here" : ""}`} style={{ "--i": i } as CSSProperties}>
            <span className="jr-node">{m.done ? <Check strokeWidth={3} /> : m.locked ? <Lock /> : <b className="tnum">{i + 1}</b>}</span>
            <span className="jr-text">
              <small>{m.step?.stage}</small>
              <b>{m.title}</b>
              {m.xp > 0 && !m.done && <em className="tnum">+{m.xp} XP</em>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Faixa persuasiva que leva ao WhatsApp da equipe, já com o contexto da pessoa. */
export function TeamCta({ title, text, label, topic, icon: Icon, points }: {
  title: string
  text: ReactNode
  label: string
  topic: string
  icon?: LucideIcon
  points?: string[]
}) {
  const { account, category } = useAthlete()
  return (
    <section className={`vx-card gm-cta ${Icon ? "has-icon" : ""}`}>
      <div aria-hidden="true" className="gm-cta-glow" />
      {Icon && <span className="gm-cta-icon" aria-hidden="true"><Icon /></span>}
      <div className="relative min-w-0 flex-1">
        <h3>{title}</h3>
        <p>{text}</p>
        {points && (
          <ul className="gm-cta-points">
            {points.map((p) => <li key={p}><Check strokeWidth={3} /> {p}</li>)}
          </ul>
        )}
      </div>
      <a className="vx-btn vx-btn--gold relative" href={whatsappLink(teamMessage(account, category, topic))} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-4 w-4" /> {label}
      </a>
    </section>
  )
}

const FIT_LABEL = ["Possível", "Bom encaixe", "Encaixe direto"] as const

export function ClubCard({ fit, rank }: { fit: ClubFit; rank: number }) {
  const { account, category, adminPreview } = useAthlete()
  const { club } = fit
  return (
    <article className={`vx-card vx-card--hover gm-club is-fit-${fit.affinity}`} style={{ "--i": rank } as CSSProperties}>
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
      {adminPreview ? (
        <button type="button" className="vx-btn w-full" disabled title="Só o atleta faz isso na conta dele"><WhatsAppIcon className="h-4 w-4" /> Apresentar meu perfil</button>
      ) : (
        <a className="vx-btn w-full" href={whatsappLink(teamMessage(account, category, `Quero que a equipe apresente o meu perfil ao ${club.name}.`))} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" /> Apresentar meu perfil
        </a>
      )}
    </article>
  )
}

/** Convite para liberar a análise lance a lance (quem já completou o perfil e ainda não tem jogo analisado). */
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
        <span className="gm-unlock-tag is-open"><Sparkles className="h-3.5 w-3.5" /> Análise lance a lance · o seu próximo passo</span>
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
        <a className="vx-btn vx-btn--gold" href={whatsappLink(teamMessage(account, category, "Quero enviar o vídeo de um jogo para liberar a análise lance a lance."))} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" /> Enviar o vídeo de um jogo
        </a>
      </div>
    </section>
  )
}

export const clientLink = (sub = "") => `${CLIENT_BASE}${sub}`
