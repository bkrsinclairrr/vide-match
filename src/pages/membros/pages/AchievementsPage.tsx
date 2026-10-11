import { Medal, Trophy } from "lucide-react"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { LEVELS } from "../game"
import { BadgeGrid, LevelChip, MissionList, TeamCta, XpBar } from "../components/Gamify"

export default function AchievementsPage() {
  const { game } = useAthlete()
  const earned = game.badges.filter((b) => b.earned).length

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

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Missões</span>} sub="Cada missão concluída soma XP e fortalece o seu perfil." />
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
        text="Mande o vídeo de um jogo: cada partida analisada vale XP e abre as conquistas de jogo."
        label="Enviar vídeo para a equipe"
        topic="Quero enviar o vídeo de um jogo para a análise."
      />
    </>
  )
}
