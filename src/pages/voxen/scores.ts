/**
 * Faixas de nota dos jogadores e a escala de iniciante do painel, sem React e sem banco, para ser testada à parte
 * (`npm run test:notas`).
 *
 * São jogadores novos e inexperientes: a maioria fica nas faixas baixas, e só uma "leva" fixa fica acima:
 *   - 47 jogadores com nota alta ou muito alta (16 muito altas + 31 altas);
 *   - 60 jogadores com nota mediana;
 *   - o resto, muito baixa ou baixa.
 * Quem entra em cada leva sai de um hash estável da chave da pessoa (nunca Math.random): recarregar a página não troca
 * ninguém. Só entram nas levas os jogadores que já existiam em `LEVA_CORTE`; quem chega depois começa nas faixas baixas,
 * então uma nova entrada nunca tira alguém da leva. Isto vale só no painel; o relatório que o atleta recebe não muda.
 */

export type BandKey = "muito-baixa" | "baixa" | "mediana" | "alta" | "muito-alta"

export type Band = {
  key: BandKey
  /** O nome da faixa. */
  name: string
  /** Como a nota é descrita ("muito baixa"). */
  label: string
  /** Faixa da nota geral (inclusive). */
  min: number
  max: number
  /** Onde a nota geral dos jogadores desta faixa cai (sempre dentro da faixa, longe das bordas). */
  target: readonly [number, number]
  color: string
  bg: string
}

/** Da mais alta para a mais baixa (a ordem em que as faixas aparecem no filtro e na legenda). */
export const BANDS: readonly Band[] = [
  { key: "muito-alta", name: "Craque", label: "muito alta", min: 75, max: 100, target: [77, 90], color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { key: "alta", name: "Destaque", label: "alta", min: 60, max: 74, target: [62, 72], color: "#a3e635", bg: "rgba(163,230,53,0.11)" },
  { key: "mediana", name: "Em evolução", label: "mediana", min: 45, max: 59, target: [47, 57], color: "#fbbf24", bg: "rgba(251,191,36,0.11)" },
  { key: "baixa", name: "Iniciante", label: "baixa", min: 30, max: 44, target: [32, 42], color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  { key: "muito-baixa", name: "Estreante", label: "muito baixa", min: 0, max: 29, target: [16, 27], color: "#f87171", bg: "rgba(248,113,113,0.12)" },
]

export const bandOf = (overall: number): Band => BANDS.find((b) => overall >= b.min) ?? BANDS[BANDS.length - 1]

export const bandByKey = (key: string): Band | undefined => BANDS.find((b) => b.key === key)

/** Quantos jogadores têm cada faixa na leva. */
export const LEVA = { "muito-alta": 16, alta: 31, mediana: 60 } as const
export const LEVA_BOAS = LEVA["muito-alta"] + LEVA.alta
export const LEVA_TOTAL = LEVA_BOAS + LEVA.mediana

/** Só quem já existia até este momento (fim de 23/10/2026, horário de Brasília) pode entrar nas levas. */
export const LEVA_CORTE = "2026-10-24T00:00:00-03:00"

/** Dos que ficam de fora da leva, a parte que é "muito baixa" (o resto é "baixa"). */
const SHARE_MUITO_BAIXA = 0.4

/** Quanto das diferenças entre os 10 indicadores do relatório original sobrevive (o formato de cada um continua o dele). */
const SHAPE = 0.8

/* ------------------------------------------------------------------ */
/* Hash estável                                                        */
/* ------------------------------------------------------------------ */

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Um número de 0 (inclusive) a 1 (exclusive), sempre o mesmo para a mesma chave e o mesmo sal. */
export const unitOf = (key: string, salt: string) => hash(`${salt}:${key}`) / 4294967296

/* ------------------------------------------------------------------ */
/* Quem fica em qual faixa                                             */
/* ------------------------------------------------------------------ */

type Keyed = { key: string; createdAt: string }

/** A faixa de cada jogador (pela chave). */
export function assignBands(players: Keyed[]): Map<string, BandKey> {
  const cutoff = Date.parse(LEVA_CORTE)
  const eligible = players
    .filter((p) => Date.parse(p.createdAt) < cutoff)
    .sort((a, b) => unitOf(a.key, "leva") - unitOf(b.key, "leva") || a.key.localeCompare(b.key))

  const out = new Map<string, BandKey>()
  eligible.forEach((p, i) => {
    if (i < LEVA["muito-alta"]) out.set(p.key, "muito-alta")
    else if (i < LEVA_BOAS) out.set(p.key, "alta")
    else if (i < LEVA_TOTAL) out.set(p.key, "mediana")
  })
  for (const p of players) {
    if (!out.has(p.key)) out.set(p.key, unitOf(p.key, "base") < SHARE_MUITO_BAIXA ? "muito-baixa" : "baixa")
  }
  return out
}

/* ------------------------------------------------------------------ */
/* A escala                                                            */
/* ------------------------------------------------------------------ */

type StatLike = { key: string; score: number }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** A nota geral que a faixa dá a esta pessoa (sempre a mesma). */
export function targetOverall(key: string, band: Band): number {
  const [lo, hi] = band.target
  return lo + Math.floor(unitOf(key, "nota") * (hi - lo + 1))
}

/**
 * Os 10 indicadores na escala da faixa: a média vira a nota-alvo da pessoa e as diferenças entre os indicadores do
 * relatório original continuam (um pouco menores), então quem era forte no passe continua mais forte no passe.
 */
export function scaleStats<T extends StatLike>(key: string, band: Band, stats: T[]): T[] {
  if (!stats.length) return stats
  const target = targetOverall(key, band)
  const mean = stats.reduce((a, s) => a + s.score, 0) / stats.length
  return stats.map((s) => ({ ...s, score: clamp(Math.round(target + (s.score - mean) * SHAPE), 1, 100) }))
}

export type Levelable = Keyed & { stats: (StatLike & { label: string; desc: string })[]; overall: number }

/** Põe todos os jogadores na escala de iniciante: a nota geral é a média dos novos indicadores. */
export function levelPlayers<T extends Levelable>(players: T[]): T[] {
  const bands = assignBands(players)
  return players.map((p) => {
    const band = bandByKey(bands.get(p.key) ?? "baixa") ?? bandOf(0)
    const stats = scaleStats(p.key, band, p.stats)
    const overall = stats.length ? Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length) : p.overall
    return { ...p, stats, overall }
  })
}
