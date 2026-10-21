import { useMemo } from "react"
import { CalendarClock, Globe2, MapPin, Target, Users } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CountUp } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { opportunitiesFor, portfolio, teamMessage, whatsappLink } from "../game"
import { useJustUnlocked } from "../news"
import { ClubCard, TeamCta } from "../components/Gamify"
import { LockTag, LockedClubGrid, RevealSeal } from "../components/Locks"
import { ClubCrest, DeadlineChip } from "../components/ClubCrest"
import { deadlineInfo, shortDay, type RealOpportunity } from "../scoutLayer"
import type { AthleteAccount } from "../account"

/** O botão de agir numa oportunidade real (desligado no "ver como" da equipe). */
function ActButton({ account, category, opp, adminPreview, big = false }: { account: AthleteAccount; category: string | null; opp: RealOpportunity; adminPreview: boolean; big?: boolean }) {
  const label = opp.status === "enviada" ? "Falar com a equipe sobre isso" : "Quero agir"
  const cls = `vx-btn ${big ? "vx-btn--gold mt-4" : ""}`
  if (adminPreview) return <button type="button" className={cls} disabled title="Só o atleta faz isso na conta dele"><WhatsAppIcon className="h-4 w-4" /> {label}</button>
  const topic = opp.status === "enviada"
    ? `Quero saber como está a oportunidade no ${opp.club.name}.`
    : `Vi a oportunidade no ${opp.club.name}${opp.deadline ? ` (prazo ${shortDay(opp.deadline)})` : ""} e quero agir.`
  return <a className={cls} href={whatsappLink(teamMessage(account, category, topic))} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4" /> {label}</a>
}

export default function OpportunitiesPage() {
  const { account, category, adminPreview, game, fresh, layer } = useAthlete()
  const opp = useMemo(() => opportunitiesFor(account, category), [account, category])
  const pf = useMemo(portfolio, [])
  const open = game.gates.opportunities
  const reveal = useJustUnlocked(fresh, "perfil", "oportunidades")
  const { highlight } = opp
  // Oportunidade real da equipe vem primeiro; as do portfólio viram "Outros clubes".
  const [top, ...more] = layer.opportunities

  return (
    <>
      <section className="vx-card gm-pitch">
        <div aria-hidden="true" className="gm-hero-glow" />
        <div className="relative min-w-0 flex-1">
          <p className="gm-eyebrow">Para o seu perfil</p>
          <h2>Em algum lugar, um clube precisa de um jogador exatamente como você.</h2>
          <p>
            Toda temporada, clubes abrem vagas atrás de características bem específicas: a posição, o pé, a altura,
            o jeito de jogar. Com centenas de clubes no portfólio da Zyron, a vaga que tem a sua cara já existe. O que
            decide quem é chamado é quanto do seu jogo o clube consegue enxergar, e é isso que a Zyron documenta e leva
            até eles.
          </p>
        </div>
        <dl className="gm-pitch-stats is-3">
          <div><dt><Globe2 className="h-3.5 w-3.5" /> Clubes no portfólio</dt><dd className="tnum"><CountUp value={pf.clubs} /></dd><small>em {pf.countries} países</small></div>
          <div><dt><Target className="h-3.5 w-3.5" /> Vagas abertas</dt><dd className="tnum"><CountUp value={pf.vacancies} /></dd><small>em toda a base Zyron</small></div>
          {open
            ? <div className="is-you"><dt><Users className="h-3.5 w-3.5" /> Procuram a sua função</dt><dd className="tnum"><CountUp value={opp.related.clubs} /></dd><small>{opp.international ? "clubes internacionais" : "clubes do Brasil"}, {opp.related.vacancies} vagas</small></div>
            : <div className="is-locked"><dt><Users className="h-3.5 w-3.5" /> Procuram a sua função</dt><dd><LockTag>Complete o perfil</LockTag></dd><small>o número que importa para você</small></div>}
        </dl>
      </section>

      {open && top && (
        <section className={`vx-card gm-feature ${reveal ? "lk-reveal" : ""}`}>
          <div aria-hidden="true" className="gm-hero-glow" />
          <ClubCrest club={top.club} size={76} pop />
          <div className="relative min-w-0 flex-1">
            <p className="gm-eyebrow">Seu melhor encaixe <span className="gm-team-tag">Da equipe</span></p>
            <h2>{top.club.name}</h2>
            <p className="gm-feature-meta">
              {[top.club.country, top.club.league].filter(Boolean).length > 0 && <><MapPin className="inline h-3.5 w-3.5" /> {[top.club.country, top.club.league].filter(Boolean).join(" · ")} · </>}
              {top.status === "enviada" ? "Seu perfil já foi enviado ao clube" : "Oportunidade aberta pela equipe"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DeadlineChip {...deadlineInfo(top.deadline)} />
              {top.deadline && <span className="text-[12px] text-zinc-500"><CalendarClock className="inline h-3.5 w-3.5" /> até {shortDay(top.deadline)}</span>}
            </div>
            {top.athleteNote && <p className="gm-feature-text">{top.athleteNote}</p>}
            <ActButton account={account} category={category} opp={top} adminPreview={adminPreview} big />
          </div>
          <span className="gm-compat is-big tnum">{top.compatibility}%<small>de encaixe segundo a equipe</small></span>
          {reveal && <RevealSeal />}
        </section>
      )}

      {open && more.length > 0 && (
        <>
          <CardHead title="Da equipe, com prazo" sub="Oportunidades que a equipe abriu para você. Fique de olho no prazo de cada uma." />
          <div className="gm-real">
            {more.map((o, i) => (
              <article key={o.id} className="gm-real-card" style={{ "--i": i } as React.CSSProperties}>
                <ClubCrest club={o.club} size={46} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate">{o.club.name}</h3>
                  <p>{o.athleteNote ?? (o.status === "enviada" ? "Seu perfil já foi enviado ao clube." : "Oportunidade aberta pela equipe.")}</p>
                  <div className="mt-2"><DeadlineChip {...deadlineInfo(o.deadline)} /></div>
                </div>
                <span className="gm-compat tnum">{o.compatibility}%<small>encaixe</small></span>
                <ActButton account={account} category={category} opp={o} adminPreview={adminPreview} />
              </article>
            ))}
          </div>
        </>
      )}

      {open && !top && highlight && (
        <section className={`vx-card gm-feature ${reveal ? "lk-reveal" : ""}`}>
          <div aria-hidden="true" className="gm-hero-glow" />
          <span className="gm-club-logo is-lg" aria-hidden="true">{highlight.club.logo}</span>
          <div className="relative min-w-0 flex-1">
            <p className="gm-eyebrow">Seu melhor encaixe</p>
            <h2>{highlight.club.name}</h2>
            <p className="gm-feature-meta"><MapPin className="inline h-3.5 w-3.5" /> {highlight.club.country} · {highlight.club.league} · {highlight.club.openPositions} vagas abertas</p>
            <p className="gm-feature-text">{highlight.club.description} Procura {highlight.club.preferredStyle.toLowerCase()}.</p>
            {adminPreview ? (
              <button type="button" className="vx-btn vx-btn--gold mt-4" disabled title="Só o atleta faz isso na conta dele"><WhatsAppIcon className="h-4 w-4" /> Quero que a equipe me apresente</button>
            ) : (
              <a className="vx-btn vx-btn--gold mt-4" href={whatsappLink(teamMessage(account, category, `Quero que a equipe apresente o meu perfil ao ${highlight.club.name}.`))} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> Quero que a equipe me apresente
              </a>
            )}
          </div>
          <span className="gm-compat is-big tnum">{highlight.compatibility}%<small>de encaixe com o seu perfil</small></span>
          {reveal && <RevealSeal />}
        </section>
      )}

      <CardHead
        title={<span className="inline-flex items-center gap-2">{top ? "Outros clubes do portfólio" : "Outros clubes para o seu perfil"} {!open && <LockTag />}</span>}
        sub={open ? "Primeiro quem procura a sua função; depois quem tem mais vagas abertas." : "Os clubes aparecem quando o seu perfil estiver completo."}
      />
      {open ? (
        <div className={`gm-clubs ${reveal ? "lk-reveal-list" : ""}`}>
          {opp.list.map((fit, i) => <ClubCard key={fit.club.id} fit={fit} rank={i} />)}
        </div>
      ) : (
        <LockedClubGrid />
      )}

      <p className="gm-disclaimer">
        Os clubes mostrados fazem parte do portfólio de referência da Zyron e indicam onde o seu perfil tem mais espaço. A
        Zyron apresenta o seu perfil, mas não garante teste, vaga ou contrato: isso depende do seu desempenho e da decisão
        de cada clube.
      </p>

      <TeamCta
        title="Quanto mais forte o perfil, mais portas se abrem."
        text="Complete os dados, libere a análise dos seus jogos e fale com a equipe: ela escolhe com você os clubes certos."
        label="Falar com a equipe"
        topic="Quero escolher com a equipe os clubes certos para o meu perfil."
      />
    </>
  )
}
