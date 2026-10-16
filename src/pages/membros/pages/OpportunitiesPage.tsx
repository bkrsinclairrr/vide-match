import { useMemo } from "react"
import { Globe2, MapPin, Target, Users } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CountUp } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { opportunitiesFor, portfolio, teamMessage, whatsappLink } from "../game"
import { useJustUnlocked } from "../news"
import { ClubCard, TeamCta } from "../components/Gamify"
import { LockTag, LockedClubGrid, RevealSeal } from "../components/Locks"

export default function OpportunitiesPage() {
  const { account, category, adminPreview, game, fresh } = useAthlete()
  const opp = useMemo(() => opportunitiesFor(account, category), [account, category])
  const pf = useMemo(portfolio, [])
  const open = game.gates.opportunities
  const reveal = useJustUnlocked(fresh, "perfil", "oportunidades")
  const { highlight } = opp

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

      {open && highlight && (
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
        title={<span className="inline-flex items-center gap-2">Outros clubes para o seu perfil {!open && <LockTag />}</span>}
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
