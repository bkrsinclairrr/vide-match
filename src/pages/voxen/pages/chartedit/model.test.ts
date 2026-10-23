import assert from "node:assert/strict"
import { test } from "node:test"
import {
  MAX_HEAT, NO_EDIT, STAT_IDS, applyChartEdit, applyStats, autoHeat, autoOverall, clampScore, draftOf, editFromDraft, editFromRow, finalOverall,
  isEdited, meanScore, nudge, originalOf, pitchOf, pointFromRect, rowFromEdit, scoreRange, summaryOf, toggleHeat, type ChartEdit, type Editable,
} from "./model.ts"

const stats = (scores: number[]) => STAT_IDS.map((key, i) => ({ key, label: key, desc: "", score: scores[i] }))
const BASE = stats([80, 82, 84, 86, 88, 90, 85, 87, 89, 91]) // média 86,2 → 86

const player = (): Editable => ({ stats: BASE, overall: 86 })

test("nota: só o que a equipe mudou muda; o resto segue o relatório", () => {
  const edit: ChartEdit = { ...NO_EDIT, stats: { passe: 95, defesa: 70 } }
  const out = applyStats(BASE, edit)
  assert.equal(out.find((s) => s.key === "passe")?.score, 95)
  assert.equal(out.find((s) => s.key === "defesa")?.score, 70)
  assert.equal(out.find((s) => s.key === "ataque")?.score, 80)
  assert.equal(BASE.find((s) => s.key === "passe")?.score, 87, "o original não é alterado")
  assert.equal(applyStats(BASE, null), BASE)
})

test("nota geral: fixada à mão, senão a média quando algo mudou, senão a original", () => {
  const some: ChartEdit = { ...NO_EDIT, stats: { ataque: 100 } }
  const finalStats = applyStats(BASE, some)
  assert.equal(meanScore(BASE), 86)
  assert.equal(finalOverall(finalStats, some, 80), meanScore(finalStats))
  assert.equal(finalOverall(finalStats, { ...some, overall: 99 }, 80), 99)
  assert.equal(finalOverall(BASE, { ...NO_EDIT, marker: { x: 1, y: 1 } }, 77), 77, "mudar só o campo não mexe na nota geral")
  assert.equal(finalOverall(BASE, null, 77), 77)
})

test("aplicar: parte sempre do original, então repetir não acumula e dá para voltar", () => {
  const p = player()
  const once = applyChartEdit(p, { ...NO_EDIT, stats: { passe: 99 } })
  assert.equal(once.stats.find((s) => s.key === "passe")?.score, 99)
  assert.equal(once.overall, meanScore(once.stats))
  assert.deepEqual(originalOf(once).stats, BASE)
  const twice = applyChartEdit(once, { ...NO_EDIT, stats: { defesa: 60 } })
  assert.equal(twice.stats.find((s) => s.key === "passe")?.score, 87, "a mudança anterior não fica")
  assert.equal(twice.stats.find((s) => s.key === "defesa")?.score, 60)
  const back = applyChartEdit(twice, null)
  assert.deepEqual(back.stats, BASE)
  assert.equal(back.overall, 86)
  assert.equal(back.chart, null)
  assert.equal(back.original, undefined)
  // Uma mudança vazia é o mesmo que nenhuma.
  assert.deepEqual(applyChartEdit(once, NO_EDIT).stats, BASE)
})

test("o que mudou, em palavras", () => {
  assert.deepEqual(summaryOf(NO_EDIT), [])
  assert.deepEqual(summaryOf({ ...NO_EDIT, stats: { passe: 90 } }), ["1 indicador"])
  assert.deepEqual(summaryOf({ ...NO_EDIT, stats: { passe: 90, drible: 80 }, overall: 90, marker: { x: 1, y: 2 }, heat: [] }), ["2 indicadores", "nota geral", "posição no campo", "sem mapa de calor"])
  assert.deepEqual(summaryOf({ ...NO_EDIT, heat: [{ x: 1, y: 1 }] }), ["mapa de calor"])
  assert.equal(isEdited({ ...NO_EDIT, note: "só o motivo" }), false)
})

test("escala do controle de nota", () => {
  assert.deepEqual(scoreRange(88), { min: 20, max: 100 })
  assert.deepEqual(scoreRange(12), { min: 12, max: 100 })
  assert.equal(clampScore(101), 100)
  assert.equal(clampScore(0), 1)
  assert.equal(clampScore(87.6), 88)
  assert.equal(clampScore(Number.NaN, 64), 64)
})

test("campo: sem mudança vale a posição do cadastro; com mudança, a da equipe", () => {
  const pos = { x: 50, y: 34 }
  assert.deepEqual(pitchOf(pos, null), { marker: pos, heat: autoHeat(pos), custom: false })
  assert.deepEqual(pitchOf(null, null), { marker: null, heat: [], custom: false })
  const moved = pitchOf(pos, { ...NO_EDIT, marker: { x: 20, y: 60 } })
  assert.deepEqual(moved.marker, { x: 20, y: 60 })
  assert.deepEqual(moved.heat, autoHeat({ x: 20, y: 60 }), "o calor automático acompanha o marcador")
  assert.equal(moved.custom, true)
  // Sem posição no cadastro, a equipe ainda pode desenhar o calor.
  const heat = [{ x: 30, y: 30 }]
  assert.deepEqual(pitchOf(null, { ...NO_EDIT, heat }).heat, heat)
  assert.deepEqual(pitchOf(pos, { ...NO_EDIT, heat: [] }).heat, [], "lista vazia = sem calor, não automático")
  assert.deepEqual(autoHeat({ x: 85, y: 70 }), [{ x: 85, y: 70 }, { x: 77, y: 61 }])
  assert.deepEqual(autoHeat({ x: 50, y: 5 }), [{ x: 50, y: 5 }, { x: 58, y: 8 }])
})

test("calor: clicar numa mancha apaga, clicar no vazio pinta, até o limite", () => {
  let list = toggleHeat([], { x: 50, y: 50 })
  assert.deepEqual(list, [{ x: 50, y: 50 }])
  list = toggleHeat(list, { x: 52, y: 51 }) // em cima da mancha
  assert.deepEqual(list, [])
  list = toggleHeat(list, { x: 10, y: 10 })
  list = toggleHeat(list, { x: 90, y: 90 })
  assert.equal(list.length, 2)
  // O mais perto sai quando há duas por perto.
  const two = [{ x: 50, y: 50 }, { x: 56, y: 50 }]
  assert.deepEqual(toggleHeat(two, { x: 55, y: 50 }), [{ x: 50, y: 50 }])
  let many: { x: number; y: number }[] = []
  for (let i = 0; i < MAX_HEAT + 3; i++) many = toggleHeat(many, { x: 8 + i * 10, y: i % 2 ? 20 : 80 })
  assert.equal(many.length, MAX_HEAT)
  // Distância em unidades do campo (68 × 105): 10% na horizontal é menos que 10% na vertical.
  assert.equal(toggleHeat([{ x: 50, y: 50 }], { x: 60, y: 50 }).length, 0, "10% de lado = 6,8 unidades: apaga")
  assert.equal(toggleHeat([{ x: 50, y: 50 }], { x: 50, y: 60 }).length, 2, "10% de altura = 10,5 unidades: pinta outra")
})

test("campo: o toque vira ponto dentro do gramado, e as setas movem o marcador", () => {
  const rect = { left: 100, top: 200, width: 300, height: 450 }
  assert.deepEqual(pointFromRect(rect, 250, 425), { x: 50, y: 50 })
  assert.deepEqual(pointFromRect(rect, 0, 0), { x: 3, y: 3 })
  assert.deepEqual(pointFromRect(rect, 9999, 9999), { x: 97, y: 97 })
  assert.deepEqual(pointFromRect({ left: 0, top: 0, width: 0, height: 0 }, 5, 5), { x: 50, y: 50 })
  assert.deepEqual(nudge({ x: 50, y: 50 }, 2, -2), { x: 52, y: 48 })
  assert.deepEqual(nudge({ x: 96, y: 4 }, 5, -5), { x: 97, y: 3 })
})

test("janela: o rascunho começa no que vale hoje e só grava o que difere do original", () => {
  const p = player()
  const d = draftOf(p)
  assert.equal(d.stats.passe, 87)
  assert.equal(d.overallMode, "auto")
  assert.equal(editFromDraft(d, originalOf(p)), null, "nada mudou: nada a gravar")

  d.stats.passe = 95
  d.stats.drible = 85 // igual ao original
  const edit = editFromDraft(d, originalOf(p))
  assert.deepEqual(edit?.stats, { passe: 95 })
  assert.equal(edit?.overall, null)

  // Fixar a nota geral no mesmo valor da média não grava nada de fixo.
  d.overallMode = "fixed"
  d.overall = autoOverall(d, originalOf(p))
  assert.equal(editFromDraft(d, originalOf(p))?.overall, null)
  d.overall = 99
  assert.equal(editFromDraft(d, originalOf(p))?.overall, 99)

  // Só a nota geral e só o campo também são mudanças.
  const only = draftOf(p)
  only.overallMode = "fixed"
  only.overall = 92
  assert.equal(editFromDraft(only, originalOf(p))?.overall, 92)
  const field = draftOf(p)
  field.marker = { x: 33.33, y: 44.44 }
  field.heat = [{ x: 10, y: 10 }]
  field.note = "  Jogou de ponta no último jogo  "
  const fe = editFromDraft(field, originalOf(p))
  assert.deepEqual(fe?.marker, { x: 33.3, y: 44.4 })
  assert.deepEqual(fe?.heat, [{ x: 10, y: 10 }])
  assert.equal(fe?.note, "Jogou de ponta no último jogo")
  // O motivo sozinho não é uma mudança.
  const noteOnly = draftOf(p)
  noteOnly.note = "só um motivo"
  assert.equal(editFromDraft(noteOnly, originalOf(p)), null)
})

test("janela: reabrir a edição mostra o que já foi mudado, e a média acompanha", () => {
  const edited = applyChartEdit(player(), { ...NO_EDIT, stats: { passe: 99 }, overall: 91, marker: { x: 20, y: 30 }, heat: [], note: "motivo" })
  const d = draftOf(edited)
  assert.equal(d.stats.passe, 99)
  assert.equal(d.overallMode, "fixed")
  assert.equal(d.overall, 91)
  assert.deepEqual(d.marker, { x: 20, y: 30 })
  assert.deepEqual(d.heat, [])
  assert.equal(d.note, "motivo")
  // Voltar um indicador ao valor original tira a mudança dele.
  d.stats.passe = 87
  d.overallMode = "auto"
  d.marker = null
  d.heat = null
  assert.equal(editFromDraft(d, originalOf(edited)), null)
})

test("banco: lê a linha com tolerância e escreve só o que importa", () => {
  const edit = editFromRow({
    stats: { passe: 95, ataque: "88", inventado: 70, defesa: 0, drible: 101, chute: 80.5 }, overall: 90, marker: { x: 20, y: 30 },
    heat: [{ x: 10, y: 10 }, { x: 200, y: 5 }, "lixo", { x: 1, y: 2 }], note: "  motivo  ", updated_at: "2026-10-23T10:00:00Z",
  })
  assert.deepEqual(edit.stats, { ataque: 88, passe: 95 }, "fora da lista, fora da escala ou quebrado é ignorado")
  assert.equal(edit.overall, 90)
  assert.deepEqual(edit.marker, { x: 20, y: 30 })
  assert.deepEqual(edit.heat, [{ x: 10, y: 10 }, { x: 1, y: 2 }])
  assert.equal(edit.note, "motivo")
  assert.equal(edit.updatedAt, "2026-10-23T10:00:00Z")
  const empty = editFromRow({ stats: null, overall: null, marker: null, heat: null, note: null })
  assert.deepEqual({ ...empty, updatedAt: null }, NO_EDIT)
  assert.equal(editFromRow({ stats: {}, overall: 0 }).overall, null)
  assert.deepEqual(rowFromEdit({ ...NO_EDIT, stats: { passe: 90 }, note: "n" }), { stats: { passe: 90 }, overall: null, marker: null, heat: null, note: "n" })
})
