import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Compass, MapPin, PersonStanding, Signpost, Sparkles, Trophy } from "lucide-react"
import { CountUp, Ring } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { CLIENT_BASE, PROFILE_FORM_PATH } from "../paths"
import { opportunitiesFor, tierOf } from "../game"
import { MemberAvatar, SectionTitle } from "../components/bits"
import { useJustUnlocked } from "../news"
import { LevelChip, MissionList, TeamCta, UnlockCard, XpBar } from "../components/Gamify"
import { LockTag, LockedAnalysis, LockedClubsMini, RevealSeal } from "../components/Locks"
import { BodyStage } from "../components/BodyStage"
import { ClubCrest, DeadlineChip } from "../components/ClubCrest"
import { deadlineInfo } from "../scoutLayer"
import HomePage from "./HomePage"

const ASK = "text-[12.5px] font-semibold text-amber-300 hover:underline whitespace-nowrap"

/** Clubes que combinam com o perfil (só depois do perfil completo). */
function OpportunitiesCard() {
  const { account, category, fresh, layer } = useAthlete()
  const opp = useMemo(() => opportunitiesFor(account, category), [account, category])
  const reveal = useJustUnlocked(fresh, "perfil", "inicio")
  const [real, ...moreReal] = layer.opportunities
  return (
    <section className={`vx-card ${reveal ? "lk-reveal" : ""}`}>
      <CardHead
        title={<span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-amber-300" /> Clubes que procuram o seu perfil</span>}
        sub={`${opp.related.clubs} clubes da base procuram uma função igual ou próxima da sua, com ${opp.related.vacancies} vagas abertas.`}
        actions={<Link to={`${CLIENT_BASE}/oportunidades`} className={ASK}>Ver todas</Link>}
      />
      {real ? (
        <div className="gm-spot">
          <ClubCrest club={real.club} size={46} pop />
          <div className="min-w-0 flex-1">
            <p className="gm-spot-kicker">Seu melhor encaixe · da equipe</p>
            <h3 className="truncate">{real.club.name}</h3>
            <div className="mt-1"><DeadlineChip {...deadlineInfo(real.deadline)} /></div>
          </div>
          <span className="gm-compat tnum">{real.compatibility}%<small>encaixe</small></span>
        </div>
      ) : opp.highlight && (
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
        {moreReal.map((o) => (
          <li key={o.id}>
            <ClubCrest club={o.club} size={32} />
            <span className="min-w-0 flex-1"><b className="block truncate">{o.club.name}</b><small className="block truncate">Da equipe · {deadlineInfo(o.deadline).label.toLowerCase()}</small></span>
          </li>
        ))}
        {opp.list.slice(0, Math.max(0, 5 - moreReal.length)).map((f) => (
          <li key={f.club.id}>
            <span className="gm-club-logo is-sm" aria-hidden="true">{f.club.logo}</span>
            <span className="min-w-0 flex-1"><b className="block truncate">{f.club.name}</b><small className="block truncate">{f.club.preferredStyle} · {f.club.openPositions} vagas</small></span>
          </li>
        ))}
      </ul>
      <Link to={`${CLIENT_BASE}/oportunidades`} className="vx-btn mt-3 w-full">Ver todas as oportunidades <ArrowRight /></Link>
      {reveal && <RevealSeal />}
    </section>
  )
}

/** Os jogos analisados (monta quando a análise abre, para a revelação tocar na hora certa). */
function GamesSection() {
  const { fresh } = useAthlete()
  const reveal = useJustUnlocked(fresh, "analise", "inicio")
  return (
    <div className={reveal ? "lk-reveal relative" : undefined}>
      <SectionTitle sub="O que a equipe viu nos seus vídeos">Seus jogos</SectionTitle>
      <HomePage embedded />
      {reveal && <RevealSeal />}
    </div>
  )
}

/** Primeiro contato: as oportunidades aparecem preenchidas, mas trancadas e borradas. */
function LockedOpportunitiesCard() {
  return (
    <section className="vx-card lk-card">
      <CardHead
        title={<span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-amber-300" /> Oportunidades</span>}
        sub="Libera quando você completar o perfil."
        actions={<LockTag />}
      />
      <LockedClubsMini />
    </section>
  )
}

export default function StartPage() {
  const { account, category, report, game, member, layer } = useAthlete()
  const tier = report ? tierOf(report.overall) : null
  const chips = [account.position, category, account.city].filter(Boolean) as string[]
  const { gates, newcomer, current } = game
  // A foto que não carrega some sem deixar buraco: volta o herói de sempre.
  const [bodyFailed, setBodyFailed] = useState<string | null>(null)
  const body = layer.bodyPhoto && bodyFailed !== layer.bodyPhoto.url ? layer.bodyPhoto : null

  return (
    <>
      <section className={`vx-card gm-hero ${body ? "has-body" : ""}`}>
        <div aria-hidden="true" className="gm-hero-glow" />
        {body && (
          <BodyStage photo={body} name={account.name} chips={[account.position, category].filter(Boolean) as string[]} avatarUrl={account.avatarUrl}
            onFail={() => setBodyFailed(body.url)} />
        )}
        <div className="gm-hero-who">
          {!body && <MemberAvatar member={{ fullName: account.name, photoUrl: account.avatarUrl, kind: "membro" }} size={84} ring="#fbbf24" />}
          <div className="min-w-0">
            <p className="gm-eyebrow">{newcomer ? "Bem-vindo à Zyron" : "Bem-vindo de volta"}</p>
            <h2>{newcomer ? `${account.firstName}, a sua jornada começa aqui.` : `${account.firstName}, o seu jogo está em evolução.`}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LevelChip game={game} />
              {chips.map((c) => <span key={c} className="vx-chip h-7 cursor-default">{c}</span>)}
              {layer.bodyPhotoOption && (
                <Link to={`${CLIENT_BASE}/perfil#foto`} className="vx-chip h-7" title="Escolha entre a foto de perfil e a de corpo inteiro">
                  <PersonStanding className="h-3.5 w-3.5" /> {body ? "Trocar a foto" : "Aparecer de corpo inteiro"}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="gm-hero-xp">
          <XpBar game={game} />
          <p className="gm-hint">
            {newcomer
              ? "A jornada é feita em etapas: cada uma vale XP e libera a próxima. A primeira é o seu perfil, e ela já abre as oportunidades nos clubes."
              : "O XP cresce com o que você faz: perfil completo, foto, jogos analisados e conquistas. Quanto mais forte o perfil, mais fácil a equipe apresenta você aos clubes."}
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
              <Link to={PROFILE_FORM_PATH} className="vx-btn vx-btn--gold">Criar meu perfil <ArrowRight /></Link>
              <small>Leva uns 2 minutos e já libera as oportunidades.</small>
            </div>
          )}
        </div>
      </section>

      <div className="vx-grid mb-[18px] lg:grid-cols-2">
        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Próximas missões</span>}
            sub={newcomer ? "Uma etapa de cada vez: cumpra a primeira e a próxima se abre." : "Cada missão vale XP e deixa o seu perfil mais forte."}
            actions={<Link to={`${CLIENT_BASE}/conquistas`} className={ASK}>Ver conquistas</Link>}
          />
          <MissionList missions={game.missions} limit={7} />
        </section>

        {gates.opportunities ? <OpportunitiesCard /> : <LockedOpportunitiesCard />}
      </div>

      {member && gates.matches ? (
        <GamesSection />
      ) : gates.analysis ? (
        <div className="mb-[18px]"><UnlockCard /></div>
      ) : (
        <div className="mb-[18px]"><LockedAnalysis /></div>
      )}

      <TeamCta
        icon={Signpost}
        title="Precisa de ajuda? Você não precisa fazer isso sozinho."
        text={<>
          A equipe da Zyron acompanha a sua jornada e mostra o caminho certo para o seu momento.
          {current?.step ? <> Você está na etapa {current.step.n}: <strong>{current.title}</strong>.</> : null}
          {" "}Uma conversa rápida e você sabe exatamente o que fazer.
        </>}
        points={["O que completar no perfil", "Qual jogo enviar para a análise", "Quais clubes combinam com o seu jogo"]}
        label="Quero uma direção"
        topic={current ? `Preciso de uma direção na minha jornada: estou na etapa "${current.title}".` : "Preciso de uma direção para os próximos passos da minha carreira."}
      />
    </>
  )
}
