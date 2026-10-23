import assert from "node:assert/strict"
import { test } from "node:test"
import {
  EMPTY_FILTERS, applyFilters, arrivalCounts, arrivalDays, arrivalHistory, arrivalLabel, arrivalOn, basicsOf, countBySection, dayKey, dayLabel, displayName,
  gapsOf, isReady, isResent, latestBatch, matches, nameTwins, needsReview, norm, planApproval, priorityOf, pruneSelection, rangeKeys, readinessOf,
  receiptDays, rowKey, statusOf, subline, summarize, toItems,
  type Filters, type ImportRow,
} from "./model.ts"

let seq = 0
/** Meio-dia, horário local, do dia `d` de outubro de 2026 (não muda de dia com o fuso do computador). */
const local = (d: number, h = 12, min = 0) => new Date(2026, 9, d, h, min, 0).toISOString()

function row(p: Partial<ImportRow> = {}): ImportRow {
  seq += 1
  const kind = p.kind ?? "pre"
  const ref = p.ref ?? `ref-${String(seq).padStart(8, "0")}`
  const firstAt = p.firstAt === undefined ? local(22) : p.firstAt
  return {
    key: rowKey(kind, ref), kind, ref, name: `Atleta ${seq}`, guardianName: null, position: null, category: null, city: null,
    team: null, birthDate: null, age: null,
    answersCount: 3, notesCount: 0, hasContext: true, reviewCount: 0, revision: 1, firstAt, updatedAt: firstAt,
    receipts: [], wasProspect: false,
    memberId: null, sectionId: null, approvedAt: null, approvedByName: null, approvedRevision: null, ...p,
  }
}

/** Os quatro dados básicos que fazem um importado "completo". */
const FULL = { position: "Meia", category: "Sub 15", city: "Brasília", age: 14 }

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

test("dados básicos: idade, posição, categoria e cidade; o nascimento vale como idade; time não é exigido", () => {
  assert.equal(basicsOf(row()).core, 0)
  assert.equal(basicsOf(row(FULL)).complete, true)
  assert.equal(basicsOf(row({ ...FULL, age: null })).complete, false)
  assert.equal(basicsOf(row({ ...FULL, age: null, birthDate: "2011-06-21" })).complete, true, "o nascimento conta como idade")
  assert.deepEqual(basicsOf(row({ position: "Meia", category: "Sub 15" })).missing, ["idade", "cidade", "time"])
  assert.equal(basicsOf(row({ ...FULL, team: "Sim" })).have.includes("time"), false, "“Sim” não é nome de time")
  assert.equal(basicsOf(row({ ...FULL, team: "Real Brasília" })).have.includes("time"), true)
})

test("prioridade: dados completos primeiro; entre iguais, quem tem mais contexto", () => {
  const completoRico = row({ ...FULL, answersCount: 11, notesCount: 3 })
  const completoPouco = row({ ...FULL, answersCount: 2 })
  const completoSemContexto = row({ ...FULL, hasContext: false, answersCount: 0 })
  const parcialRico = row({ position: "Meia", category: "Sub 15", answersCount: 11, notesCount: 3 })
  const nada = row({ hasContext: false, answersCount: 0 })
  const ordem = [nada, parcialRico, completoSemContexto, completoPouco, completoRico]
  const sorted = [...ordem].sort((a, b) => priorityOf(b) - priorityOf(a))
  assert.deepEqual(sorted, [completoRico, completoPouco, completoSemContexto, parcialRico, nada])
  assert.equal(isReady(completoRico), true)
  assert.equal(isReady(completoSemContexto), false, "dados completos, mas sem contexto: não está pronto")
  assert.equal(isReady(parcialRico), false)
})

test("a ordem padrão põe quem tem os dados completos primeiro e, entre iguais, quem chegou por último", () => {
  const completoVelho = row({ ...FULL, name: "Completo velho", firstAt: local(10) })
  const completoNovo = row({ ...FULL, name: "Completo novo", firstAt: local(20) })
  const parcialNovo = row({ position: "Meia", name: "Parcial novo", firstAt: local(21) })
  const vazio = row({ name: "Vazio", hasContext: false, firstAt: local(22) })
  const out = applyFilters([vazio, parcialNovo, completoVelho, completoNovo], f({}))
  assert.deepEqual(out.map((r) => r.name), ["Completo novo", "Completo velho", "Parcial novo", "Vazio"])
})

test("contexto devido: o que falta em cada importado", () => {
  const ok = row({ ...FULL, sectionId: "s1" })
  assert.deepEqual(gapsOf(ok), [])
  assert.equal(readinessOf(ok), "completo")

  const semSecao = row(FULL)
  assert.deepEqual(gapsOf(semSecao).map((g) => g.key), ["secao"])
  assert.equal(readinessOf(semSecao), "sem_origem")

  const vazio = row({ ...FULL, hasContext: false, sectionId: "s1" })
  assert.deepEqual(gapsOf(vazio).map((g) => g.key), ["contexto"])
  assert.equal(readinessOf(vazio), "vazio")

  const semNome = row({ ...FULL, name: null, guardianName: "Carla", sectionId: "s1" })
  const g = gapsOf(semNome)
  assert.deepEqual(g.map((x) => x.key), ["nome"])
  assert.equal(g[0].level, "aviso")
  assert.match(g[0].label, /responsável/)
  assert.equal(readinessOf(semNome), "completo", "falta de nome é aviso, não impede")

  const revisar = row({ ...FULL, reviewCount: 2, sectionId: "s1" })
  assert.match(gapsOf(revisar)[0].label, /^2 textos/)
  assert.match(gapsOf(row({ ...FULL, reviewCount: 1, sectionId: "s1" }))[0].label, /^1 texto /)

  const semBasicos = row({ position: "Meia", sectionId: "s1" })
  const b = gapsOf(semBasicos)
  assert.deepEqual(b.map((x) => x.key), ["basicos"])
  assert.equal(b[0].level, "aviso", "dado básico faltando é aviso: não impede aprovar")
  assert.equal(b[0].label, "Faltam dados básicos: idade, categoria e cidade")
  assert.equal(readinessOf(semBasicos), "completo")
})

test("nome e linha de apoio: sem nome, o responsável aparece", () => {
  assert.equal(displayName(row({ name: "  Enzo  " })), "Enzo")
  assert.equal(displayName(row({ name: null })), "Atleta sem nome")
  assert.equal(subline(row({ position: "Meia", category: "Sub 15", city: "Bahia" })), "Meia · Sub 15 · Bahia")
  assert.equal(subline(row({ position: "Meia", category: "Sub 15", city: "Bahia", age: 14 })), "Meia · Sub 15 · 14 anos · Bahia")
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

test("filtros: dados completos ou incompletos, com ou sem contexto", () => {
  const completoComCtx = row(FULL)
  const completoSemCtx = row({ ...FULL, hasContext: false, answersCount: 0 })
  const parcialComCtx = row({ position: "Meia" })
  const nada = row({ hasContext: false, answersCount: 0 })
  const all = [completoComCtx, completoSemCtx, parcialComCtx, nada]
  const keys = (p: Partial<Filters>) => all.filter((r) => matches(r, f(p))).map((r) => r.key)

  assert.deepEqual(keys({ data: "completos" }), [completoComCtx.key, completoSemCtx.key])
  assert.deepEqual(keys({ data: "incompletos" }), [parcialComCtx.key, nada.key])
  assert.deepEqual(keys({ context: "com" }), [completoComCtx.key, parcialComCtx.key])
  assert.deepEqual(keys({ context: "sem" }), [completoSemCtx.key, nada.key])
  assert.deepEqual(keys({ data: "completos", context: "com" }), [completoComCtx.key])
})

test("levas: novo é a primeira vez; reenviado é o mesmo registro que o CRM mandou de novo em outro dia", () => {
  const d20 = dayKey(local(20))
  const d10 = dayKey(local(10))
  const novo = row({ firstAt: local(20), receipts: [local(20)] })
  const reenviado = row({ firstAt: local(10), receipts: [local(20), local(10)] })
  const antigo = row({ firstAt: local(10), receipts: [local(10)] })
  const mesmoDia = row({ firstAt: local(20, 9), receipts: [local(20, 15), local(20, 9)] })

  assert.deepEqual(receiptDays(reenviado), [d10, d20], "do mais antigo ao mais novo")
  assert.equal(isResent(reenviado), true)
  assert.equal(isResent(novo), false)
  assert.equal(isResent(mesmoDia), false, "duas versões no mesmo dia são a mesma leva")
  assert.equal(arrivalOn(novo, d20), "novo")
  assert.equal(arrivalOn(reenviado, d20), "reenviado")
  assert.equal(arrivalOn(reenviado, d10), "novo", "no primeiro dia ele era novo")
  assert.equal(arrivalOn(antigo, d20), null)

  const all = [novo, reenviado, antigo, mesmoDia]
  const keys = (p: Partial<Filters>) => all.filter((r) => matches(r, f(p))).map((r) => r.key)
  assert.deepEqual(keys({ day: d20 }), [novo.key, reenviado.key, mesmoDia.key])
  assert.deepEqual(keys({ day: d20, arrival: "novos" }), [novo.key, mesmoDia.key])
  assert.deepEqual(keys({ day: d20, arrival: "reenviados" }), [reenviado.key])
  assert.deepEqual(keys({ arrival: "reenviados" }), [reenviado.key], "sem dia: todos os que chegaram de novo alguma vez")
  assert.deepEqual(keys({ arrival: "novos" }), [novo.key, antigo.key, mesmoDia.key])
  assert.deepEqual(arrivalCounts(all, d20), { novos: 2, reenviados: 1 })
  assert.deepEqual(arrivalCounts(all), { novos: 3, reenviados: 1 })
})

test("sem recibos (migração antiga), vale o dia da primeira vez", () => {
  const r = row({ firstAt: local(18), receipts: [] })
  assert.deepEqual(receiptDays(r), [dayKey(local(18))])
  assert.equal(isResent(r), false)
  assert.deepEqual(receiptDays(row({ firstAt: null, receipts: [] })), [])
})

test("dias de chegada: quantos novos e quantos reenviados, do mais recente ao mais antigo", () => {
  const rows = [
    row({ receipts: [local(25), local(22)], firstAt: local(22) }),
    row({ receipts: [local(25)], firstAt: local(25) }),
    row({ receipts: [local(25)], firstAt: local(25) }),
    row({ receipts: [local(22)], firstAt: local(22) }),
  ]
  const days = arrivalDays(rows)
  assert.deepEqual(days, [
    { day: dayKey(local(25)), count: 3, fresh: 2, resent: 1 },
    { day: dayKey(local(22)), count: 2, fresh: 2, resent: 0 },
  ])
  assert.deepEqual(latestBatch(rows), days[0])
  assert.equal(latestBatch([]), null)
  assert.equal(arrivalLabel(days[0]), "25/10/2026 · 3 (2 novos e 1 reenviado)")
  assert.equal(arrivalLabel(days[1]), "22/10/2026 · 2 novos")
  assert.equal(arrivalLabel({ day: "2026-10-25", count: 1, fresh: 0, resent: 1 }), "25/10/2026 · 1 reenviado")
  assert.equal(arrivalLabel({ day: "2026-10-25", count: 1, fresh: 1, resent: 0 }), "25/10/2026 · 1 novo")
})

test("histórico de chegada em português", () => {
  assert.equal(arrivalHistory(row({ receipts: [local(13)], firstAt: local(13) })), "Chegou em 13/10/2026")
  assert.equal(arrivalHistory(row({ receipts: [local(20), local(13)], firstAt: local(13) })), "Chegou em 13/10/2026 e de novo em 20/10/2026")
  assert.equal(arrivalHistory(row({ receipts: [local(25), local(20), local(13)], firstAt: local(13) })), "Chegou em 13/10/2026 e de novo em 20/10/2026 e 25/10/2026")
  assert.equal(arrivalHistory(row({ receipts: [local(13, 15), local(13, 9)], firstAt: local(13, 9) })), "Chegou em 13/10/2026 (2 versões no mesmo dia)")
  assert.equal(arrivalHistory(row({ receipts: [], firstAt: null })), "")
})

test("busca ignora acento e maiúscula e olha nome, responsável, posição, categoria, cidade e time", () => {
  const r = row({ name: "João Ávila", guardianName: "Maria Nunes", position: "Meia-Atacante", category: "Sub 15", city: "Brasília", team: "Escolinha Craque" })
  for (const q of ["joao", "AVILA", "nunes", "meia", "sub 15", "brasilia", "craque"]) assert.equal(matches(r, f({ query: q })), true, q)
  assert.equal(matches(r, f({ query: "goleiro" })), false)
  assert.equal(norm("Ação"), "acao")
})

test("ordenação: mais recentes (a última vez que chegou), mais antigos e nome", () => {
  const velho = row({ name: "Bruno", firstAt: local(10) })
  const novo = row({ name: "Álvaro", firstAt: local(20) })
  const meio = row({ name: "Caio", firstAt: local(15) })
  const reenviadoHoje = row({ name: "Davi", firstAt: local(5), receipts: [local(24), local(5)] })
  const all = [velho, novo, meio]
  assert.deepEqual(applyFilters(all, f({ sort: "recentes" })).map((r) => r.name), ["Álvaro", "Caio", "Bruno"])
  assert.deepEqual(applyFilters(all, f({ sort: "antigos" })).map((r) => r.name), ["Bruno", "Caio", "Álvaro"])
  assert.deepEqual(applyFilters(all, f({ sort: "nome" })).map((r) => r.name), ["Álvaro", "Bruno", "Caio"])
  assert.equal(all[0], velho, "não muda a lista original")
  assert.equal(applyFilters([...all, reenviadoHoje], f({ sort: "recentes" }))[0].name, "Davi", "quem foi reenviado por último sobe, mesmo tendo chegado há mais tempo")
})

test("números: resumo, por subseção e dias de chegada", () => {
  const rows = [
    row({ ...FULL, kind: "pre", sectionId: "s1" }),
    approved({ kind: "pre", sectionId: "s1" }),
    approved({ ...FULL, kind: "conta", revision: 2, receipts: [local(25), local(22)] }),
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
  assert.equal(s.withContext, 3)
  assert.equal(s.basicsComplete, 2)
  assert.equal(s.ready, 2)
  assert.equal(s.resent, 1)

  const by = countBySection(rows)
  assert.equal(by.get("s1"), 2)
  assert.equal(by.get("nenhuma"), 2)

  assert.deepEqual(arrivalDays(rows).map((d) => [d.day, d.count]), [[dayKey(local(25)), 1], [dayKey(local(22)), 3], [dayKey(local(21)), 1]])
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

/* ------------------------------------------------------------------ */
/* Mesmo nome: a pessoa que pode ter chegado por outro caminho         */
/* ------------------------------------------------------------------ */

const jogador = (key: string, name: string, memberId: string | null = null, aliases: string[] = []) => ({ key, name, memberId, aliases })

test("mesmo nome de um jogador que já está na base: aviso, nunca junta sozinho", () => {
  const camilo = row({ name: "Camilo Karam Escobar" })
  const outro = row({ name: "Outro Nome Qualquer" })
  const twins = nameTwins([camilo, outro], [
    jogador("lead:a", "Camilo Karam Escobar"),
    jogador("lead:b", "camilo  KARAM escobar"),
    jogador("lead:c", "Fulano de Tal"),
  ])
  assert.deepEqual(twins.get(camilo.key)?.map((t) => [t.kind, t.target]), [["jogador", "lead:a"], ["jogador", "lead:b"]])
  assert.equal(twins.has(outro.key), false)
})

test("o mesmo nome com acento e maiúscula é o mesmo nome; um nome só (“João”) não prova nada", () => {
  const a = row({ name: "JOÃO PEDRO Almeida" })
  const sozinho = row({ name: "João" })
  const twins = nameTwins([a, sozinho], [jogador("lead:x", "Joao Pedro almeida"), jogador("lead:y", "João")])
  assert.equal(twins.get(a.key)?.length, 1)
  assert.equal(twins.has(sozinho.key), false)
})

test("o jogador que é a própria pessoa (mesmo membro, mesmo lead ou apelido) não conta como parecido", () => {
  const conta = row({ kind: "conta", ref: "m-1", memberId: "m-1", name: "Gabriel Rocha Lima" })
  const espera = row({ kind: "espera", ref: "lead-9", name: "Kauê Nascimento Braga" })
  const outraConta = row({ kind: "conta", ref: "m-2", memberId: "m-2", name: "Samuel Pires Andrade" })
  const twins = nameTwins([conta, espera, outraConta], [
    jogador("lead:g", "Gabriel Rocha Lima", "m-1"),
    jogador("lead:k", "Kauê Nascimento Braga", null, ["lead:lead-9"]),
    jogador("lead:s2", "Samuel Pires Andrade", "m-outro"),
  ])
  assert.equal(twins.has(conta.key), false, "o jogador é o próprio membro")
  assert.equal(twins.has(espera.key), false, "o jogador é o próprio lead (por apelido)")
  assert.equal(twins.get(outraConta.key)?.length, 1, "outro membro com o mesmo nome continua sendo aviso")
})

test("dois importados com o mesmo nome avisam um ao outro, e nenhum avisa a si mesmo", () => {
  const a = row({ kind: "pre", name: "Davi Lucca Martins" })
  const b = row({ kind: "conta", memberId: "m-1", name: "Davi Lucca Martins" })
  const twins = nameTwins([a, b], [])
  assert.deepEqual(twins.get(a.key)?.map((t) => [t.kind, t.target]), [["importado", b.key]])
  assert.deepEqual(twins.get(b.key)?.map((t) => [t.kind, t.target]), [["importado", a.key]])
})
