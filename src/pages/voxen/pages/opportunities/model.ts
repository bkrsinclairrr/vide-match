import { useEffect, useState } from "react"
import { affinity } from "@/pages/membros/game"
import { deadlineInfo, type OpportunityStatus } from "@/pages/membros/scoutLayer"
import type { Opportunity } from "../scout/api"
import { isLiveStatus } from "./proposal"

/** Relógio que anda sozinho (a contagem regressiva dos prazos). */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

/** "4d 03h 12min" até o fim do dia do prazo; null sem prazo ou vencido. */
export function countdown(deadline: string | null, now: Date) {
  if (!deadline) return null
  const left = new Date(`${deadline}T23:59:59`).getTime() - now.getTime()
  if (left <= 0) return null
  const d = Math.floor(left / 86_400_000)
  const h = Math.floor((left % 86_400_000) / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  return d > 0 ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min` : `${h}h ${String(m).padStart(2, "0")}min`
}

export const STATUS_LABEL: Record<OpportunityStatus, string> = {
  aberta: "Aberta",
  enviada: "Perfil enviado",
  negociacao: "Em negociação",
  aceita: "Aceita",
  encerrada: "Encerrada",
  recusada: "Recusada",
}

/** Os passos do caminho feliz, na ordem em que acontecem (encerrada e recusada são saídas). */
export const STEPS: OpportunityStatus[] = ["aberta", "enviada", "negociacao", "aceita"]

/** Em andamento: aberta, enviada ao clube ou em negociação. */
export const isLive = (o: Pick<Opportunity, "status">) => isLiveStatus(o.status)

/** O prazo mais próximo entre as oportunidades em andamento (para ordenar e marcar "vencendo"). */
export function nearest(opps: Opportunity[], now = new Date()) {
  const live = opps.filter((o) => isLive(o) && o.deadline && deadlineInfo(o.deadline, now).tone !== "over")
  return live.sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))[0] ?? null
}

/**
 * Sugestão de compatibilidade (só sugestão: quem decide é o Scout). Vem da função que o clube
 * procura no catálogo da Zyron comparada com a posição do jogador.
 */
export function suggestCompatibility(position: string | null, preferredStyle: string | null) {
  if (!position || !preferredStyle) return null
  const a = affinity(position, preferredStyle)
  return {
    value: a === 2 ? 92 : a === 1 ? 84 : 72,
    why: a === 2 ? "o clube procura exatamente a posição dele" : a === 1 ? "o clube procura uma função próxima" : "a função que o clube procura é outra",
  }
}
