import assert from "node:assert/strict"
import { test } from "node:test"
import { BANDS, LEVA_BOAS, LEVA_TOTAL, assignBands, bandOf, levelPlayers, targetOverall, type BandKey, type Levelable } from "./scores.ts"

const KEYS = ["ataque", "defesa", "chute", "dominio", "marcacao", "finalizacao", "drible", "passe", "velocidade", "leitura"]

/** Relatório original (faixa 76–95) com um formato diferente para cada jogador. */
const original = (i: number) => KEYS.map((key, k) => ({ key, label: key, desc: "", score: 76 + ((i * 7 + k * 5) % 20) }))

function crowd(n: number, createdAt = "2026-10-10T12:00:00.000Z", from = 0): Levelable[] {
  return Array.from({ length: n }, (_, i) => {
    const stats = original(from + i)
    return { key: `lead:${from + i}-aaaa`, createdAt, stats, overall: Math.round(stats.reduce((a, s) => a + s.score, 0) / stats.length) }
  })
}

const count = (map: Map<string, BandKey>) => {
  const out: Record<string, number> = {}
  for (const b of map.values()) out[b] = (out[b] ?? 0) + 1
  return out
}

test("faixas: do muito baixo ao muito alto, cada nota cai numa só", () => {
  assert.deepEqual(BANDS.map((b) => b.name), ["Craque", "Destaque", "Em evolução", "Iniciante", "Estreante"])
  assert.equal(bandOf(100).key, "muito-alta")
  assert.equal(bandOf(75).key, "muito-alta")
  assert.equal(bandOf(74).key, "alta")
  assert.equal(bandOf(60).key, "alta")
  assert.equal(bandOf(59).key, "mediana")
  assert.equal(bandOf(45).key, "mediana")
  assert.equal(bandOf(44).key, "baixa")
  assert.equal(bandOf(30).key, "baixa")
  assert.equal(bandOf(29).key, "muito-baixa")
  assert.equal(bandOf(0).key, "muito-baixa")
})

test("a leva: 47 com nota alta ou muito alta e 60 medianos; o resto, baixa ou muito baixa", () => {
  const players = crowd(360)
  const c = count(assignBands(players))
  assert.equal(c["muito-alta"], 16)
  assert.equal(c["alta"], 31)
  assert.equal((c["muito-alta"] ?? 0) + (c["alta"] ?? 0), LEVA_BOAS)
  assert.equal(c["mediana"], 60)
  assert.equal(LEVA_TOTAL, 107)
  assert.equal((c["baixa"] ?? 0) + (c["muito-baixa"] ?? 0), 360 - 107)
  assert.ok((c["baixa"] ?? 0) > 0 && (c["muito-baixa"] ?? 0) > 0, "as duas faixas baixas existem")
})

test("quem entra na leva não muda ao recarregar nem com a ordem da lista", () => {
  const players = crowd(300)
  const a = assignBands(players)
  const b = assignBands([...players].reverse())
  for (const p of players) assert.equal(a.get(p.key), b.get(p.key), p.key)
})

test("quem chega depois do corte começa nas faixas baixas e não tira ninguém da leva", () => {
  const before = crowd(300)
  const late = crowd(40, "2026-11-05T12:00:00.000Z", 1000)
  const a = assignBands(before)
  const b = assignBands([...before, ...late])
  for (const p of before) assert.equal(b.get(p.key), a.get(p.key), `${p.key} manteve a faixa`)
  for (const p of late) assert.ok(["baixa", "muito-baixa"].includes(b.get(p.key) as string), `${p.key} entrou na faixa baixa`)
  assert.equal(count(b)["mediana"], 60)
})

test("escala: a nota geral cai na faixa do jogador e os indicadores seguem o formato do relatório", () => {
  const players = crowd(360)
  const bands = assignBands(players)
  const leveled = levelPlayers(players)
  for (const p of leveled) {
    const want = bands.get(p.key) as BandKey
    assert.equal(bandOf(p.overall).key, want, `${p.key}: nota ${p.overall} fora da faixa ${want}`)
    assert.equal(p.overall, Math.round(p.stats.reduce((a, s) => a + s.score, 0) / p.stats.length), "a nota geral é a média dos indicadores")
    for (const s of p.stats) assert.ok(s.score >= 1 && s.score <= 100)
  }
  // O melhor indicador do relatório original continua o melhor (ou empatado).
  const first = players[3]
  const out = leveled[3]
  const top = (stats: { key: string; score: number }[]) => stats.reduce((a, s) => (s.score > a.score ? s : a)).key
  assert.equal(top(out.stats), top(first.stats))
  assert.ok(out.overall < 91 && Math.max(...out.stats.map((s) => s.score)) <= 100)
})

test("escala: muda de verdade para baixo e é a mesma toda vez", () => {
  const players = crowd(360)
  const leveled = levelPlayers(players)
  const media = (list: Levelable[]) => list.reduce((a, p) => a + p.overall, 0) / list.length
  assert.ok(media(leveled) < media(players) - 25, `média ${media(leveled)} contra ${media(players)}`)
  assert.deepEqual(levelPlayers(players).map((p) => p.overall), leveled.map((p) => p.overall))
  assert.equal(targetOverall("lead:x", BANDS[0]), targetOverall("lead:x", BANDS[0]))
})
