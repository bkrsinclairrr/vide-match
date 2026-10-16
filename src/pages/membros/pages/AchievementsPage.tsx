import { Medal, Route, Trophy } from "lucide-react"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { LEVELS } from "../game"
import { BadgeGrid, JourneyTrack, LevelChip, MissionList, TeamCta, XpBar } from "../components/Gamify"

export default function AchievementsPage() {
  const { game } = useAthlete()
  const earned = game.badges.filter((b) => b.earned).length
  const stepsDone = game.journey.filter((m) => m.done).length

  return (
    <>
      <section className="vx-card gm-hero gm-hero--slim">
        <div aria-hidden="true" className="gm-hero-glow" />
        <div className="gm-hero-who">
          <span className="gm-lvl is-xl">{game.level}</span>
          <div className="min-w-0">
            <p className="gm-eyebrow">Seu nível</p>
            <h2>{game.title}</h2>
            <div className="mt-3"><LevelChip game={game} /></div>
          </div>
        </div>
        <div className="gm-hero-xp"><XpBar game={game} /></div>
        <ol className="gm-levels" aria-label="Níveis">
          {LEVELS.map((l, i) => (
            <li key={l.title} className={i + 1 <= game.level ? "is-on" : ""} title={`${l.title} · ${l.at} XP`}><span>{i + 1}</span></li>
          ))}
        </ol>
      </section>

      <section className="vx-card mb-[18px] jr-card">
        <CardHead
          title={<span className="inline-flex items-center gap-2"><Route className="h-4 w-4 text-amber-300" /> Sua jornada</span>}
          sub={stepsDone === game.journey.length
            ? "Jornada completa: do primeiro cadastro ao contrato."
            : `${stepsDone} de ${game.journey.length} etapas. Cada etapa libera a próxima, do perfil ao contrato.`}
        />
        <JourneyTrack journey={game.journey} />
      </section>

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Missões</span>} sub="Cada missão concluída soma XP e abre a etapa seguinte." />
          <MissionList missions={game.missions} />
        </section>

        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Medal className="h-4 w-4 text-amber-300" /> Conquistas</span>}
            sub={`${earned} de ${game.badges.length} conquistadas`}
          />
          <BadgeGrid badges={game.badges} />
        </section>
      </div>

      <TeamCta
        title="Quer subir de nível mais rápido?"
        text={game.gates.analysis
          ? "Mande o vídeo de um jogo: cada partida analisada vale XP e abre as conquistas de jogo."
          : "Comece pelo perfil: ele vale XP na hora e abre as oportunidades e a análise dos seus jogos. A equipe te ajuda no que precisar."}
        label={game.gates.analysis ? "Enviar vídeo para a equipe" : "Falar com a equipe"}
        topic={game.gates.analysis ? "Quero enviar o vídeo de um jogo para a análise." : "Quero ajuda para começar a minha jornada na Zyron."}
      />
    </>
  )
}
