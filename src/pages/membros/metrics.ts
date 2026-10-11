/**
 * Métricas da área de membros. Tudo sai das ações marcadas no vídeo pela
 * equipe (zyron_match_events) e dos minutos jogados — nada é estimado.
 * As fórmulas dos índices e da nota automática ficam documentadas aqui para
 * a equipe saber exatamente o que cada número significa.
 */
import { eventTone, sortMatchesDesc, type Bundle, type Match, type MatchEvent } from "./model"

export type StatLine = {
  matches: number
  minutes: number
  goals: number
  assists: number
  keyPasses: number
  shots: number
  shotsOnTarget: number
  passes: number
  passesOk: number
  dribbles: number
  dribblesOk: number
  crosses: number
  crossesOk: number
  carries: number
  carriesOk: number
  tackles: number
  tacklesOk: number
  interceptions: number
  recoveries: number
  groundDuels: number
  groundDuelsWon: number
  aerials: number
  aerialsWon: number
  blocks: number
  saves: number
  foulsWon: number
  foulsCommitted: number
  losses: number
  yellow: number
  red: number
  actions: number
  actionsOk: number
  actionsFail: number
}

export const emptyLine = (): StatLine => ({
  matches: 0, minutes: 0, goals: 0, assists: 0, keyPasses: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesOk: 0,
  dribbles: 0, dribblesOk: 0, crosses: 0, crossesOk: 0, carries: 0, carriesOk: 0, tackles: 0, tacklesOk: 0,
  interceptions: 0, recoveries: 0, groundDuels: 0, groundDuelsWon: 0, aerials: 0, aerialsWon: 0, blocks: 0, saves: 0,
  foulsWon: 0, foulsCommitted: 0, losses: 0, yellow: 0, red: 0, actions: 0, actionsOk: 0, actionsFail: 0,
})

/** Totais de uma partida a partir das ações marcadas no vídeo. */
export function lineFromEvents(events: MatchEvent[], minutes: number | null): StatLine {
  const l = emptyLine()
  l.matches = 1
  l.minutes = minutes ?? 90
  for (const e of events) {
    const ok = e.success !== false
    switch (e.action) {
      case "passe": l.passes++; if (ok) l.passesOk++; break
      case "passe_chave": l.keyPasses++; l.passes++; l.passesOk++; break
      case "assistencia": l.assists++; l.keyPasses++; l.passes++; l.passesOk++; break
      case "finalizacao": l.shots++; if (ok) l.shotsOnTarget++; break
      case "gol": l.goals++; l.shots++; l.shotsOnTarget++; break
      case "drible": l.dribbles++; if (ok) l.dribblesOk++; break
      case "cruzamento": l.crosses++; if (ok) l.crossesOk++; break
      case "conducao": l.carries++; if (ok) l.carriesOk++; break
      case "falta_sofrida": l.foulsWon++; break
      case "desarme": l.tackles++; if (ok) l.tacklesOk++; break
      case "interceptacao": l.interceptions++; break
      case "recuperacao": l.recoveries++; break
      case "duelo_chao": l.groundDuels++; if (ok) l.groundDuelsWon++; break
      case "duelo_aereo": l.aerials++; if (ok) l.aerialsWon++; break
      case "bloqueio": l.blocks++; break
      case "defesa_goleiro": l.saves++; break
      case "perda": l.losses++; break
      case "falta_cometida": l.foulsCommitted++; break
      case "cartao_amarelo": l.yellow++; break
      case "cartao_vermelho": l.red++; break
    }
    if (e.action === "cartao_amarelo" || e.action === "cartao_vermelho") continue
    l.actions++
    const tone = eventTone(e)
    if (tone === "ok") l.actionsOk++
    else if (tone === "fail") l.actionsFail++
  }
  return l
}

export function sumLines(lines: StatLine[]): StatLine {
  const total = emptyLine()
  for (const l of lines) for (const k of Object.keys(total) as (keyof StatLine)[]) total[k] += l[k]
  return total
}

export const pct = (ok: number, total: number) => (total > 0 ? (ok / total) * 100 : null)
export const per90 = (value: number, minutes: number) => (minutes > 0 ? (value * 90) / minutes : null)

export const duels = (l: StatLine) => ({ total: l.groundDuels + l.aerials, won: l.groundDuelsWon + l.aerialsWon })

/**
 * Índices Zyron (0 a 5). Cada um soma contribuições por 90 minutos e passa
 * por uma curva que satura (5 · (1 − e^(−s/k))): volume alto vale mais, mas
 * nunca estoura a escala.
 *
 * Ofensivo:   gols·1,4 + assistências·1,1 + passes-chave·0,45 + finalizações no alvo·0,35
 *             + dribles certos·0,3 + cruzamentos certos·0,2 + faltas sofridas·0,1   (k = 1,6)
 * Construção: (passes certos/30 + conduções certas·0,15 + passes-chave·0,2) × (% de passe)²   (k = 1,1)
 * Defensivo:  desarmes certos·0,45 + interceptações·0,45 + bloqueios·0,4 + defesas·0,5
 *             + recuperações·0,25 + duelos ganhos·0,2 − faltas cometidas·0,1   (k = 2)
 */
export function indices(l: StatLine) {
  const m = l.minutes
  const p = (v: number) => per90(v, m) ?? 0
  const curve = (s: number, k: number) => 5 * (1 - Math.exp(-Math.max(0, s) / k))
  const passAcc = (pct(l.passesOk, l.passes) ?? 0) / 100
  const d = duels(l)
  return {
    ofensivo: curve(p(l.goals) * 1.4 + p(l.assists) * 1.1 + p(l.keyPasses) * 0.45 + p(l.shotsOnTarget) * 0.35 + p(l.dribblesOk) * 0.3 + p(l.crossesOk) * 0.2 + p(l.foulsWon) * 0.1, 1.6),
    construcao: curve((p(l.passesOk) / 30 + p(l.carriesOk) * 0.15 + p(l.keyPasses) * 0.2) * passAcc * passAcc, 1.1),
    defensivo: curve(p(l.tacklesOk) * 0.45 + p(l.interceptions) * 0.45 + p(l.blocks) * 0.4 + p(l.saves) * 0.5 + p(l.recoveries) * 0.25 + p(d.won) * 0.2 - p(l.foulsCommitted) * 0.1, 2),
  }
}

/**
 * Nota automática da partida (0 a 10), usada quando a equipe não define a
 * nota. Parte de 6,0 e soma o que o atleta fez no jogo:
 * +1,0 gol · +0,7 assistência · +0,25 passe-chave · +0,2 finalização no alvo
 * +0,15 drible certo · −0,1 drible errado · +0,15 por desarme certo,
 * interceptação ou recuperação · +0,1 duelo ganho · −0,08 duelo perdido
 * +0,5 × (% de passe − 75)/25 (com 10+ passes) · −0,12 perda de posse
 * −0,5 cartão amarelo · −2 cartão vermelho. Limitada entre 3 e 10.
 */
export function autoRating(l: StatLine) {
  const d = duels(l)
  let r = 6
  r += l.goals * 1 + l.assists * 0.7 + (l.keyPasses - l.assists) * 0.25 + (l.shotsOnTarget - l.goals) * 0.2
  r += l.dribblesOk * 0.15 - (l.dribbles - l.dribblesOk) * 0.1
  r += (l.tacklesOk + l.interceptions + l.recoveries) * 0.15
  r += d.won * 0.1 - (d.total - d.won) * 0.08
  const acc = pct(l.passesOk, l.passes)
  if (acc !== null && l.passes >= 10) r += ((acc - 75) / 25) * 0.5
  r -= l.losses * 0.12 + l.yellow * 0.5 + l.red * 2
  return Math.round(Math.min(10, Math.max(3, r)) * 10) / 10
}

export type MatchSummary = {
  match: Match
  events: MatchEvent[]
  line: StatLine
  rating: number
  ratingFromTeam: boolean
}

export function summarizeMatch(match: Match, events: MatchEvent[]): MatchSummary {
  const own = events.filter((e) => e.matchId === match.id).sort((a, b) => a.t - b.t)
  const line = lineFromEvents(own, match.minutes)
  return {
    match,
    events: own,
    line,
    rating: match.rating ?? autoRating(line),
    ratingFromTeam: match.rating !== null,
  }
}

export type ProfileSummary = {
  bundle: Bundle
  /** Partidas consideradas, da mais recente para a mais antiga. */
  matches: MatchSummary[]
  total: StatLine
  avgRating: number | null
  idx: ReturnType<typeof indices>
  events: MatchEvent[]
  /** Posições jogadas e quantas vezes (cai para a posição do perfil). */
  positions: { position: string; count: number }[]
}

export function summarizeProfile(bundle: Bundle, limit?: number): ProfileSummary {
  const ordered = sortMatchesDesc(bundle.matches)
  const chosen = typeof limit === "number" ? ordered.slice(0, limit) : ordered
  const matches = chosen.map((m) => summarizeMatch(m, bundle.events))
  const total = sumLines(matches.map((m) => m.line))
  const avgRating = matches.length ? matches.reduce((a, m) => a + m.rating, 0) / matches.length : null
  const freq = new Map<string, number>()
  for (const m of chosen) {
    const pos = m.position ?? bundle.member.position
    if (pos) freq.set(pos, (freq.get(pos) ?? 0) + 1)
  }
  if (!freq.size && bundle.member.position) freq.set(bundle.member.position, 1)
  return {
    bundle,
    matches,
    total,
    avgRating,
    idx: indices(total),
    events: matches.flatMap((m) => m.events),
    positions: [...freq.entries()].map(([position, count]) => ({ position, count })).sort((a, b) => b.count - a.count),
  }
}

/* ------------------------------------------------------------------ */
/* Zonas do campo                                                      */
/* ------------------------------------------------------------------ */

export const THIRDS = ["Terço defensivo", "Terço médio", "Terço ofensivo"]
export const CORRIDORS = ["Corredor esquerdo", "Corredor central", "Corredor direito"]

export function zoneInsights(points: { x: number; y: number }[]) {
  if (!points.length) return null
  const third = [0, 0, 0]
  const corridor = [0, 0, 0]
  const grid = new Map<string, number>()
  let sumX = 0
  for (const p of points) {
    const t = Math.min(2, Math.floor(p.x / (100 / 3)))
    const c = Math.min(2, Math.floor(p.y / (100 / 3)))
    third[t]++
    corridor[c]++
    grid.set(`${t}-${c}`, (grid.get(`${t}-${c}`) ?? 0) + 1)
    sumX += p.x
  }
  const n = points.length
  const [topKey, topCount] = [...grid.entries()].sort((a, b) => b[1] - a[1])[0]
  const [t, c] = topKey.split("-").map(Number)
  const bestCorridor = corridor.indexOf(Math.max(...corridor))
  return {
    topZone: `${THIRDS[t]} · ${CORRIDORS[c].toLowerCase()}`,
    topZoneShare: Math.round((topCount / n) * 100),
    finalThird: Math.round((third[2] / n) * 100),
    corridor: CORRIDORS[bestCorridor],
    corridorShare: Math.round((corridor[bestCorridor] / n) * 100),
    avgMeters: Math.round(((sumX / n) / 100) * 105),
  }
}
