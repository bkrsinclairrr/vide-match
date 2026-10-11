import { BarChart3, Clapperboard } from "lucide-react"
import { UnlockCard } from "../components/Gamify"

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

/** Partidas e Desempenho dependem de a equipe analisar os jogos: aqui a pessoa vê o que ganha ao liberar. */
export default function Locked({ page }: { page: keyof typeof COPY }) {
  const c = COPY[page]
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
