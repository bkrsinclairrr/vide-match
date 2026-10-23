/**
 * Edição dos gráficos da ficha do jogador, sem React e sem banco, para ser testada à parte (`npm run test:graficos`).
 * A equipe pode mudar quatro coisas, e cada uma é uma "mudança por cima" do relatório original, que nunca é apagado:
 *   - os indicadores (as 10 notas do radar): só os que a equipe mudou ficam guardados, os outros seguem o relatório;
 *   - a nota geral: a média dos indicadores, ou um valor fixado à mão;
 *   - o lugar do jogador no campo (onde o marcador aparece);
 *   - as manchas do mapa de calor (até 8).
 * Voltar ao original é apagar a mudança. Os indicadores abaixo seguem os de `src/lib/funnel.ts` (STAT_KEYS) e os da
 * conferência do banco (voxen_valid_chart_stats).
 */

export const STAT_IDS = ["ataque", "defesa", "chute", "dominio", "marcacao", "finalizacao", "drible", "passe", "velocidade", "leitura"] as const

export type StatId = (typeof STAT_IDS)[number]

/** Um ponto no campo, em % (x da esquerda para a direita, y do ataque para a defesa). */
export type Point = { x: number; y: number }

export type ChartEdit = {
  /** Só os indicadores que a equipe mudou (notas inteiras de 1 a 100). */
  stats: Partial<Record<StatId, number>>
  /** Nota geral fixada à mão; null = a média dos indicadores. */
  overall: number | null
  /** Onde o jogador aparece no campo; null = pela posição do cadastro. */
  marker: Point | null
  /** As manchas do mapa de calor; null = automático (em volta do marcador); [] = sem calor. */
  heat: Point[] | null
  /** O motivo da mudança (só a equipe lê). */
  note: string | null
  updatedAt: string | null
}

export const NO_EDIT: ChartEdit = { stats: {}, overall: null, marker: null, heat: null, note: null, updatedAt: null }

export const MAX_HEAT = 8
export const MAX_NOTE = 300

/** O controle de nota vai de 20 até 100 (ou a partir da nota original, se ela for menor): os jogadores novos têm notas baixas. */
export const SCORE_FLOOR = 20

export const scoreRange = (original: number) => ({ min: Math.min(SCORE_FLOOR, Math.max(1, Math.round(original))), max: 100 })

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const round1 = (n: number) => Math.round(n * 10) / 10

export const clampScore = (n: number, min = 1) => clamp(Math.round(Number.isFinite(n) ? n : min), min, 100)

export const clampPoint = (p: Point): Point => ({ x: round1(clamp(p.x, 0, 100)), y: round1(clamp(p.y, 0, 100)) })

/** Algo foi mudado (a nota sozinha não conta: ela explica uma mudança, não é uma). */
export function isEdited(e: ChartEdit | null | undefined): boolean {
  return Boolean(e && (Object.keys(e.stats).length > 0 || e.overall !== null || e.marker !== null || e.heat !== null))
}

/** O que mudou, em palavras: "2 indicadores", "nota geral", "posição no campo", "mapa de calor". */
export function summaryOf(e: ChartEdit | null | undefined): string[] {
  if (!e || !isEdited(e)) return []
  const n = Object.keys(e.stats).length
  const out: string[] = []
  if (n) out.push(`${n} ${n > 1 ? "indicadores" : "indicador"}`)
  if (e.overall !== null) out.push("nota geral")
  if (e.marker) out.push("posição no campo")
  if (e.heat) out.push(e.heat.length ? "mapa de calor" : "sem mapa de calor")
  return out
}

/* ------------------------------------------------------------------ */
/* Notas                                                               */
/* ------------------------------------------------------------------ */

type StatLike = { key: string; score: number }

/** Os indicadores com as mudanças da equipe por cima. */
export function applyStats<T extends StatLike>(stats: T[], edit: ChartEdit | null | undefined): T[] {
  if (!edit) return stats
  return stats.map((s) => {
    const v = edit.stats[s.key as StatId]
    return v === undefined ? s : { ...s, score: v }
  })
}

/** A média dos indicadores, arredondada (a mesma conta de `overallFrom` em src/lib/funnel.ts). */
export const meanScore = (stats: StatLike[]) => (stats.length ? Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length) : 0)

/** A nota geral que vale: a fixada à mão; senão, a média dos indicadores (quando algum foi mudado); senão, a original. */
export function finalOverall(finalStats: StatLike[], edit: ChartEdit | null | undefined, originalOverall: number): number {
  if (edit && edit.overall !== null) return edit.overall
  if (edit && Object.keys(edit.stats).length) return meanScore(finalStats)
  return originalOverall
}

/** Um jogador com os gráficos editáveis (só os campos de que o modelo precisa). */
export type Editable = {
  stats: StatLike[]
  overall: number
  chart?: ChartEdit | null
  /** As notas do relatório antes da mudança (guardadas para mostrar o original e para poder voltar). */
  original?: { stats: StatLike[]; overall: number }
}

/** Põe (ou tira, com null) a mudança da equipe num jogador. Sempre parte do original, então repetir não acumula. */
export function applyChartEdit<T extends Editable>(p: T, edit: ChartEdit | null): T {
  const original = p.original ?? { stats: p.stats, overall: p.overall }
  if (!edit || !isEdited(edit)) return { ...p, stats: original.stats, overall: original.overall, chart: null, original: undefined }
  const stats = applyStats(original.stats, edit)
  return { ...p, stats, overall: finalOverall(stats, edit, original.overall), chart: edit, original }
}

export const originalOf = (p: Editable) => p.original ?? { stats: p.stats, overall: p.overall }

/* ------------------------------------------------------------------ */
/* Campo e calor                                                       */
/* ------------------------------------------------------------------ */

/** As manchas automáticas: uma no lugar do jogador e outra mais à frente, para o lado do meio (o que a ficha sempre mostrou). */
export const autoHeat = (p: Point): Point[] => [
  { x: p.x, y: p.y },
  { x: Math.min(92, Math.max(8, p.x + (p.x > 50 ? -8 : 8))), y: Math.max(8, p.y - 9) },
]

/** O marcador e o calor que a ficha desenha: o da equipe se houver, senão o da posição do cadastro. */
export function pitchOf(base: Point | null, edit: ChartEdit | null | undefined): { marker: Point | null; heat: Point[]; custom: boolean } {
  const marker = edit?.marker ?? base
  const heat = edit?.heat ?? (marker ? autoHeat(marker) : [])
  return { marker, heat, custom: Boolean(edit && (edit.marker || edit.heat)) }
}

const PITCH_W = 68
const PITCH_H = 105

/** Mancha perto do clique (até `radius` unidades do campo) sai; clique em lugar vazio pinta uma nova, até o limite. */
export function toggleHeat(list: Point[], at: Point, radius = 7): Point[] {
  let hit = -1
  let best = radius
  list.forEach((p, i) => {
    const d = Math.hypot(((p.x - at.x) * PITCH_W) / 100, ((p.y - at.y) * PITCH_H) / 100)
    if (d <= best) { best = d; hit = i }
  })
  if (hit >= 0) return list.filter((_, i) => i !== hit)
  return list.length >= MAX_HEAT ? list : [...list, clampPoint(at)]
}

/** O ponto do campo onde a pessoa tocou, a partir do retângulo do campo na tela (sempre dentro do gramado). */
export function pointFromRect(rect: { left: number; top: number; width: number; height: number }, clientX: number, clientY: number): Point {
  if (!rect.width || !rect.height) return { x: 50, y: 50 }
  return clampPoint({ x: clamp(((clientX - rect.left) / rect.width) * 100, 3, 97), y: clamp(((clientY - rect.top) / rect.height) * 100, 3, 97) })
}

export const nudge = (p: Point, dx: number, dy: number): Point => clampPoint({ x: clamp(p.x + dx, 3, 97), y: clamp(p.y + dy, 3, 97) })

/* ------------------------------------------------------------------ */
/* O que a pessoa mexe na janela                                       */
/* ------------------------------------------------------------------ */

export type ChartDraft = {
  stats: Record<StatId, number>
  /** "auto": a nota geral é a média dos indicadores; "fixed": vale o número escolhido. */
  overallMode: "auto" | "fixed"
  overall: number
  marker: Point | null
  heat: Point[] | null
  note: string
}

/** Começa pelo que vale hoje (o original com as mudanças já feitas). */
export function draftOf(p: Editable): ChartDraft {
  const stats = Object.fromEntries(STAT_IDS.map((id) => [id, p.stats.find((s) => s.key === id)?.score ?? 0])) as Record<StatId, number>
  const edit = p.chart ?? null
  return {
    stats,
    overallMode: edit && edit.overall !== null ? "fixed" : "auto",
    overall: p.overall,
    marker: edit?.marker ? { ...edit.marker } : null,
    heat: edit?.heat ? edit.heat.map((h) => ({ ...h })) : null,
    note: edit?.note ?? "",
  }
}

/** A nota geral "automática" do rascunho: a média quando algum indicador mudou em relação ao original; senão, a original. */
export function autoOverall(d: ChartDraft, original: { stats: StatLike[]; overall: number }): number {
  const changed = STAT_IDS.some((id) => d.stats[id] !== (original.stats.find((s) => s.key === id)?.score ?? d.stats[id]))
  return changed ? meanScore(STAT_IDS.map((id) => ({ key: id, score: d.stats[id] }))) : original.overall
}

/**
 * O que gravar a partir do rascunho: só o que é diferente do original. Se nada ficou diferente, devolve null
 * (nada a gravar: o jogador volta ao original).
 */
export function editFromDraft(d: ChartDraft, original: { stats: StatLike[]; overall: number }): ChartEdit | null {
  const stats: ChartEdit["stats"] = {}
  for (const id of STAT_IDS) {
    const base = original.stats.find((s) => s.key === id)?.score
    const now = clampScore(d.stats[id])
    if (base !== undefined && now !== base) stats[id] = now
  }
  const auto = autoOverall(d, original)
  const overall = d.overallMode === "fixed" && clampScore(d.overall) !== auto ? clampScore(d.overall) : null
  const marker = d.marker ? clampPoint(d.marker) : null
  const heat = d.heat ? d.heat.slice(0, MAX_HEAT).map(clampPoint) : null
  const note = d.note.trim().slice(0, MAX_NOTE) || null
  const edit: ChartEdit = { stats, overall, marker, heat, note, updatedAt: null }
  return isEdited(edit) ? edit : null
}

/* ------------------------------------------------------------------ */
/* Banco                                                               */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>

const point = (v: unknown): Point | null => {
  const r = v as Row | null
  const x = Number(r?.x)
  const y = Number(r?.y)
  return r && typeof r === "object" && Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100 ? { x, y } : null
}

/** A linha do banco como mudança (o que o banco tem de errado ou de fora da lista é ignorado, nada quebra). */
export function editFromRow(r: Row): ChartEdit {
  const stats: ChartEdit["stats"] = {}
  const raw = (r.stats && typeof r.stats === "object" ? r.stats : {}) as Row
  for (const id of STAT_IDS) {
    const n = Number(raw[id])
    if (raw[id] !== undefined && Number.isInteger(n) && n >= 1 && n <= 100) stats[id] = n
  }
  const overall = Number(r.overall)
  const heat = Array.isArray(r.heat) ? (r.heat.map(point).filter((p): p is Point => p !== null).slice(0, MAX_HEAT)) : null
  return {
    stats,
    overall: r.overall !== null && r.overall !== undefined && Number.isInteger(overall) && overall >= 1 && overall <= 100 ? overall : null,
    marker: point(r.marker),
    heat,
    note: typeof r.note === "string" && r.note.trim() ? r.note.trim() : null,
    updatedAt: typeof r.updated_at === "string" ? r.updated_at : null,
  }
}

/** O que mandar para o banco. */
export const rowFromEdit = (e: ChartEdit) => ({
  stats: e.stats,
  overall: e.overall,
  marker: e.marker,
  heat: e.heat,
  note: e.note,
})
