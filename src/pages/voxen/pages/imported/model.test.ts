import assert from "node:assert/strict"
import { test } from "node:test"
import {
  EMPTY_FILTERS, applyFilters, arrivalDays, countBySection, dayKey, dayLabel, displayName, gapsOf, matches, needsReview, norm,
  planApproval, pruneSelection, rangeKeys, readinessOf, rowKey, statusOf, subline, summarize, toItems,
  type Filters, type ImportRow,
} from "./model.ts"

let seq = 0
const local = (d: number, h = 12) => new Date(2026, 9, d, h, 0, 0).toISOString()

function row(p: Partial<ImportRow> = {}): ImportRow {
  seq += 1
  const kind = p.kind ?? "pre"
  const ref = p.ref ?? `ref-${String(seq).padStart(8, "0")}`
  return {
    key: rowKey(kind, ref), kind, ref, name: `Atleta ${seq}`, guardianName: null, position: null, category: null, city: null,
    answersCount: 3, notesCount: 0, hasContext: true, reviewCount: 0, revision: 1, firstAt: local(22), updatedAt: local(22),
    memberId: null, sectionId: null, approvedAt: null, approvedByName: null, approvedRevision: null, ...p,
  }
}

const approved = (p: Partial<ImportRow> = {}) => row({ approvedAt: local(23), approvedByName: "Ana", approvedRevision: 1, ...p })
const f = (p: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...p })

test("situação: para conferir, aprovado e mudou depois de aprovado", () => {
  assert.equal(statusOf(row()), "pendente")
  assert.equal(statusOf(approved()), "aprovado")
  assert.equal(statusOf(approved({ revision: 2 })), "mudou")
  assert.equal(statusOf(approved({ revision: 1, approvedRevision: 3 })), "aprovado")
  assert.equal(needsReview(approved()), false)
  assert.equal(needsReview(approved({ revision: 4 })), true)
  assert.equal(needsReview(row()), true)
})

test("contexto devido: o que falta em cada importado", () => {
  const ok = row({ sectionId: "s1" })
  assert.deepEqual(gapsOf(ok), [])
  assert.equal(readinessOf(ok), "completo")

  const semSecao = row()
  assert.deepEqual(gapsOf(semSecao).map((g) => g.key), ["secao"])
  assert.equal(readinessOf(semSecao), "sem_origem")

  const vazio = row({ hasContext: false, sectionId: "s1" })
  assert.deepEqual(gapsOf(vazio).map((g) => g.key), ["contexto"])
  assert.equal(readinessOf(vazio), "vazio")

  const semNome = row({ name: null, guardianName: "Carla", sectionId: "s1" })
  const g = gapsOf(semNome)
  assert.deepEqual(g.map((x) => x.key), ["nome"])
  assert.equal(g[0].level, "aviso")
  assert.match(g[0].label, /responsável/)
  assert.equal(readinessOf(semNome), "completo", "falta de nome é aviso, não impede")

  const revisar = row({ reviewCount: 2, sectionId: "s1" })
  assert.match(gapsOf(revisar)[0].label, /^2 textos/)
  assert.match(gapsOf(row({ reviewCount: 1, sectionId: "s1" }))[0].label, /^1 texto /)
})

test("nome e linha de apoio: sem nome, o responsável aparece", () => {
  assert.equal(displayName(row({ name: "  Enzo  " })), "Enzo")
  assert.equal(displayName(row({ name: null })), "Atleta sem nome")
  assert.equal(subline(row({ position: "Meia", category: "Sub 15", city: "Bahia" })), "Meia · Sub 15 · Bahia")
  assert.equal(subline(row({ name: null, guardianName: "Carla", position: "Zagueiro" })), "Resp.: Carla · Zagueiro")
  assert.equal(subline(row({ name: "Enzo", guardianName: "Carla" })), "")
})

test("filtros: tipo, subseção, situação e dia", () => {
  const a = row({ kind: "pre", sectionId: "s1" })
  const b = row({ kind: "conta", memberId: "m1" })
  const c = approved({ kind: "espera", sectionId: "s2", firstAt: local(21) })
  const d = approved({ kind: "pre", revision: 3, sectionId: "s1" })
  const all = [a, b, c, d]

  assert.equal(all.filter((r) => matches(r, f({ kind: "pre" }))).length, 2)
  assert.equal(all.filter((r) => matches(r, f({ section: "nenhuma" }))).length, 1)
  assert.deepEqual(all.filter((r) => matches(r, f({ section: "s1" }))).map((r) => r.key), [a.key, d.key])
  assert.equal(all.filter((r) => matches(r, f({ status: "conferir" }))).length, 3, "pendentes + mudou")
  assert.equal(all.filter((r) => matches(r, f({ status: "aprovados" }))).length, 1)
  assert.equal(all.filter((r) => matches(r, f({ status: "mudou" }))).length, 1)
  assert.equal(all.filter((r) => matches(r, f({ status: "incompletos" }))).length, 1, "só o b está sem subseção")
  assert.deepEqual(all.filter((r) => matches(r, f({ day: dayKey(local(21)) }))).map((r) => r.key), [c.key])
})

test("busca ignora acento e maiúscula e olha nome, responsável, posição, categoria e cidade", () => {
  const r = row({ name: "João Ávila", guardianName: "Maria Nunes", position: "Meia-Atacante", category: "Sub 15", city: "Brasília" })
  for (const q of ["joao", "AVILA", "nunes", "meia", "sub 15", "brasilia"]) assert.equal(matches(r, f({ query: q })), true, q)
  assert.equal(matches(r, f({ query: "goleiro" })), false)
  assert.equal(norm("Ação"), "acao")
})

test("ordenação: mais recentes, mais antigos e nome", () => {
  const velho = row({ name: "Bruno", firstAt: local(10) })
  const novo = row({ name: "Álvaro", firstAt: local(20) })
  const meio = row({ name: "Caio", firstAt: local(15) })
  const all = [velho, novo, meio]
  assert.deepEqual(applyFilters(all, f({ sort: "recentes" })).map((r) => r.name), ["Álvaro", "Caio", "Bruno"])
  assert.deepEqual(applyFilters(all, f({ sort: "antigos" })).map((r) => r.name), ["Bruno", "Caio", "Álvaro"])
  assert.deepEqual(applyFilters(all, f({ sort: "nome" })).map((r) => r.name), ["Álvaro", "Bruno", "Caio"])
  assert.equal(all[0], velho, "não muda a lista original")
})

test("números: resumo, por subseção e dias de chegada", () => {
  const rows = [
    row({ kind: "pre", sectionId: "s1" }),
    approved({ kind: "pre", sectionId: "s1" }),
    approved({ kind: "conta", revision: 2 }),
    row({ kind: "espera", hasContext: false, firstAt: local(21) }),
  ]
  const s = summarize(rows)
  assert.deepEqual(s.byKind, { pre: 2, conta: 1, espera: 1 })
  assert.equal(s.total, 4)
  assert.equal(s.approved, 1)
  assert.equal(s.toReview, 3)
  assert.equal(s.changed, 1)
  assert.equal(s.noSection, 2)
  assert.equal(s.empty, 1)

  const by = countBySection(rows)
  assert.equal(by.get("s1"), 2)
  assert.equal(by.get("nenhuma"), 2)

  assert.deepEqual(arrivalDays(rows), [{ day: dayKey(local(22)), count: 3 }, { day: dayKey(local(21)), count: 1 }])
  assert.equal(dayLabel("2026-10-22"), "22/10/2026")
  assert.equal(dayKey(null), "")
  assert.equal(dayKey("não é data"), "")
})

test("leva: o que a aprovação altera e o que falta nos outros", () => {
  const completo = row({ sectionId: "s1" })
  const semSecao = row()
  const vazio = row({ hasContext: false, sectionId: "s1" })
  const jaAprovado = approved({ sectionId: "s1" })
  const mudou = approved({ sectionId: "s1", revision: 5 })
  const plan = planApproval([completo, semSecao, vazio, jaAprovado, mudou])

  assert.equal(plan.toApprove.length, 4, "o já aprovado e sem mudança fica de fora")
  assert.deepEqual(plan.alreadyApproved, [jaAprovado])
  assert.deepEqual(plan.complete, [completo, mudou])
  assert.deepEqual(plan.noSection, [semSecao])
  assert.deepEqual(plan.empty, [vazio])
  assert.deepEqual(plan.changed, [mudou])
  assert.equal(plan.complete.length + plan.noSection.length + plan.empty.length, plan.toApprove.length)
})

test("seleção com Shift: do primeiro ao último, nos dois sentidos", () => {
  const list = ["a", "b", "c", "d", "e"].map((key) => ({ key }))
  assert.deepEqual(rangeKeys(list, "b", "d"), ["b", "c", "d"])
  assert.deepEqual(rangeKeys(list, "d", "b"), ["b", "c", "d"])
  assert.deepEqual(rangeKeys(list, "c", "c"), ["c"])
  assert.deepEqual(rangeKeys(list, "zzz", "c"), ["c"], "se o ponto de partida sumiu, marca só o clicado")
  assert.deepEqual(rangeKeys(list, "a", "zzz"), [])
})

test("a seleção nunca guarda o que saiu da lista visível", () => {
  const visible = [{ key: "a" }, { key: "b" }]
  const sel = new Set(["a", "b"])
  assert.equal(pruneSelection(sel, visible), sel, "nada a tirar: devolve o mesmo conjunto")
  const pruned = pruneSelection(new Set(["a", "x", "y"]), visible)
  assert.deepEqual([...pruned], ["a"])
})

test("itens enviados ao banco levam só o tipo e a referência", () => {
  const r = row({ kind: "conta", ref: "abc-12345678" })
  assert.deepEqual(toItems([r]), [{ kind: "conta", ref: "abc-12345678" }])
})
