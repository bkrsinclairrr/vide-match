import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Compass, MapPin, Sparkles, Trophy } from "lucide-react"
import { CountUp, Ring } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { CLIENT_BASE } from "../paths"
import { opportunitiesFor, tierOf } from "../game"
import { MemberAvatar, SectionTitle } from "../components/bits"
import { LevelChip, MissionList, TeamCta, UnlockCard, XpBar } from "../components/Gamify"
import HomePage from "./HomePage"

export default function StartPage() {
  const { account, category, report, game, member } = useAthlete()
  const opp = useMemo(() => opportunitiesFor(account, category), [account, category])
  const tier = report ? tierOf(report.overall) : null
  const chips = [account.position, category, account.city].filter(Boolean) as string[]
  const near = opp.list.slice(0, 3)

  return (
    <>
      <section className="vx-card gm-hero">
        <div aria-hidden="true" className="gm-hero-glow" />
        <div className="gm-hero-who">
          <MemberAvatar member={{ fullName: account.name, photoUrl: account.avatarUrl, kind: "membro" }} size={84} ring="#fbbf24" />
          <div className="min-w-0">
            <p className="gm-eyebrow">Bem-vindo de volta</p>
            <h2>{account.firstName}, o seu jogo está em evolução.</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LevelChip game={game} />
              {chips.map((c) => <span key={c} className="vx-chip h-7 cursor-default">{c}</span>)}
            </div>
          </div>
        </div>

        <div className="gm-hero-xp">
          <XpBar game={game} />
          <p className="gm-hint">
            O XP cresce com o que você faz: perfil completo, foto, jogos analisados e conquistas. Quanto mais forte o
            perfil, mais fácil a equipe apresenta você aos clubes.
          </p>
        </div>

        <div className="gm-hero-score">
          {report && tier ? (
            <>
              <Ring value={report.overall - 50} max={50} size={120} stroke={10} color={tier.color}>
                <span className="text-[34px] font-extrabold leading-none tnum" style={{ color: tier.color }}><CountUp value={report.overall} /></span>
                <span className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-zinc-500">Nota geral</span>
              </Ring>
              <span className="vx-tag" style={{ color: tier.color, background: `${tier.color}17` }}>Divisão {tier.label}</span>
            </>
          ) : (
            <div className="gm-noreport">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <p>Crie o perfil e receba a sua análise.</p>
              <Link to="/onboarding" className="vx-btn vx-btn--gold">Criar meu perfil <ArrowRight /></Link>
            </div>
          )}
        </div>
      </section>

      <div className="vx-grid mb-[18px] lg:grid-cols-2">
        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Próximas missões</span>}
            sub="Cada missão vale XP e deixa o seu perfil mais forte."
            actions={<Link to={`${CLIENT_BASE}/conquistas`} className="whitespace-nowrap text-[12.5px] font-semibold text-amber-300 hover:underline">Ver conquistas</Link>}
          />
          <MissionList missions={game.missions} limit={3} />
        </section>

        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-amber-300" /> Clubes que procuram o seu perfil</span>}
            sub={account.position
              ? `${opp.related.clubs} clubes da base procuram uma função igual ou próxima da sua, com ${opp.related.vacancies} vagas abertas.`
              : "Informe a sua posição no perfil para ver quem procura o seu jogo."}
            actions={<Link to={`${CLIENT_BASE}/oportunidades`} className="whitespace-nowrap text-[12.5px] font-semibold text-amber-300 hover:underline">Ver todas</Link>}
          />
          {opp.highlight && (
            <div className="gm-spot">
              <span className="gm-club-logo" aria-hidden="true">{opp.highlight.club.logo}</span>
              <div className="min-w-0 flex-1">
                <p className="gm-spot-kicker">Seu melhor encaixe</p>
                <h3 className="truncate">{opp.highlight.club.name}</h3>
                <p className="truncate"><MapPin className="inline h-3 w-3" /> {opp.highlight.club.country} · {opp.highlight.club.league}</p>
              </div>
              <span className="gm-compat tnum">{opp.highlight.compatibility}%<small>encaixe</small></span>
            </div>
          )}
          <ul className="gm-minilist">
            {near.map((f) => (
              <li key={f.club.id}>
                <span className="gm-club-logo is-sm" aria-hidden="true">{f.club.logo}</span>
                <span className="min-w-0 flex-1"><b className="block truncate">{f.club.name}</b><small className="block truncate">{f.club.preferredStyle} · {f.club.openPositions} vagas</small></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {member ? (
        <>
          <SectionTitle sub="O que a equipe viu nos seus vídeos">Seus jogos</SectionTitle>
          <HomePage embedded />
        </>
      ) : (
        <div className="mb-[18px]"><UnlockCard /></div>
      )}

      <TeamCta
        title="Quer que a equipe apresente o seu perfil?"
        text="A Zyron leva o seu relatório e o seu jogo para os clubes que combinam com você. Fale com a equipe e comece agora."
        label="Falar com a equipe"
        topic="Quero que a equipe apresente o meu perfil aos clubes."
      />
    </>
  )
}
