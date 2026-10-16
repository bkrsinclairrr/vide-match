import { BarChart3, Clapperboard } from "lucide-react"
import { useAthlete } from "../ClientArea"
import { UnlockCard } from "../components/Gamify"
import { LockedAnalysis } from "../components/Locks"

const COPY = {
  partidas: {
    icon: Clapperboard,
    title: "Os seus jogos, lance a lance",
    text: "Cada partida sua aparece aqui com o vídeo, a linha do tempo de lances (toque num lance e o vídeo vai até ele), mapa de calor, estatísticas e índices.",
  },
  desempenho: {
    icon: BarChart3,
    title: "O seu desempenho em números",
    text: "Posições em campo, mapa de calor da temporada, últimas partidas, estatísticas por 90 minutos, índices Zyron e comparação com perfis de referência.",
  },
} as const

/**
 * Partidas e Desempenho antes da análise dos jogos. Sem o perfil completo, a tela aparece
 * trancada e borrada (o primeiro passo é o perfil); com ele, vira o convite para mandar o vídeo.
 */
export default function Locked({ page }: { page: keyof typeof COPY }) {
  const { game } = useAthlete()
  const c = COPY[page]
  if (!game.gates.analysis) {
    return <LockedAnalysis title={c.title} text={`${c.text} Libera depois do seu perfil: complete os dados e envie o vídeo de um jogo.`} />
  }
  return (
    <>
      <section className="vx-card gm-locked">
        <span className="vx-empty-icon"><c.icon className="h-6 w-6" /></span>
        <h2>{c.title}</h2>
        <p>{c.text}</p>
      </section>
      <UnlockCard />
    </>
  )
}
