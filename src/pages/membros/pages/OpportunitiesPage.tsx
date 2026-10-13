import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Compass, Globe2, MapPin, Target } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { opportunitiesFor, teamMessage, whatsappLink } from "../game"
import { ClubCard, TeamCta } from "../components/Gamify"

export default function OpportunitiesPage() {
  const { account, category } = useAthlete()
  const opp = useMemo(() => opportunitiesFor(account, category), [account, category])
  const { highlight } = opp

  return (
    <>
      <section className="vx-card gm-pitch">
        <div aria-hidden="true" className="gm-hero-glow" />
        <div className="relative min-w-0 flex-1">
          <p className="gm-eyebrow">Para o seu perfil</p>
          <h2>Existe clube que precisa do que você faz.</h2>
          <p>
            Todo clube tem vagas e funções em aberto. O que decide quem é visto é quanto do seu jogo eles conseguem enxergar,
            e é por isso que a Zyron documenta o seu perfil e leva até eles.
          </p>
        </div>
        <dl className="gm-pitch-stats">
          <div><dt><Globe2 className="h-3.5 w-3.5" /> {opp.international ? "Clubes internacionais" : "Clubes do Brasil"}</dt><dd className="tnum">{opp.related.clubs || "—"}</dd><small>com função igual ou próxima da sua</small></div>
          <div><dt><Target className="h-3.5 w-3.5" /> Vagas abertas</dt><dd className="tnum">{opp.related.vacancies || "—"}</dd><small>nesses clubes, na base Zyron</small></div>
        </dl>
      </section>

      {!account.position && (
        <section className="vx-card mb-[18px] gm-nudge">
          <Compass className="h-5 w-5 shrink-0 text-amber-300" />
          <p>Informe a sua <strong>posição</strong> no perfil para a lista mostrar primeiro os clubes que procuram o seu jogo.</p>
          <Link to="/onboarding" className="vx-btn vx-btn--gold">Completar perfil</Link>
        </section>
      )}

      {highlight && (
        <section className="vx-card gm-feature">
          <div aria-hidden="true" className="gm-hero-glow" />
          <span className="gm-club-logo is-lg" aria-hidden="true">{highlight.club.logo}</span>
          <div className="relative min-w-0 flex-1">
            <p className="gm-eyebrow">Seu melhor encaixe</p>
            <h2>{highlight.club.name}</h2>
            <p className="gm-feature-meta"><MapPin className="inline h-3.5 w-3.5" /> {highlight.club.country} · {highlight.club.league} · {highlight.club.openPositions} vagas abertas</p>
            <p className="gm-feature-text">{highlight.club.description} Procura {highlight.club.preferredStyle.toLowerCase()}.</p>
            <a className="vx-btn vx-btn--gold mt-4" href={whatsappLink(teamMessage(account, category, `Quero que a equipe apresente o meu perfil ao ${highlight.club.name}.`))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" /> Quero que a equipe me apresente
            </a>
          </div>
          <span className="gm-compat is-big tnum">{highlight.compatibility}%<small>de encaixe com o seu perfil</small></span>
        </section>
      )}

      <CardHead title="Outros clubes para o seu perfil" sub="Primeiro quem procura a sua função; depois quem tem mais vagas abertas." />
      <div className="gm-clubs">
        {opp.list.map((fit, i) => <ClubCard key={fit.club.id} fit={fit} rank={i} />)}
      </div>

      <p className="gm-disclaimer">
        Os clubes mostrados fazem parte da base de referência da Zyron e indicam onde o seu perfil tem mais espaço. A Zyron
        apresenta o seu perfil, mas não garante teste, vaga ou contrato: isso depende do seu desempenho e da decisão de cada clube.
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
