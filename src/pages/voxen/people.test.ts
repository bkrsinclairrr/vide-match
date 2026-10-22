import assert from "node:assert/strict"
import { test } from "node:test"
import {
  ageFromBirth, completenessOf, fillGaps, findDuplicates, hasAccount, isJunkTeam, keysOf, mergePeople, missingLabel, normName, realProfileOf,
  type MemberRow, type PlayerLink,
} from "./people.ts"
import type { Player } from "./data.ts"
import { AGE_MAX, AGE_MIN, PLACES, categoryFromAge, estimateProfile, ageFromCategory, ufOf, unit, withEstimates } from "./estimate.ts"

const TODAY = new Date(2026, 9, 22) // 22/10/2026

const emptyMeta = () => ({ stage: "novo" as const, notes: "", scout: null, updatedAt: null as string | null })

// Só o que as funções usam; o resto do Player (estatísticas, origem...) não entra nas regras.
function player(over: Record<string, unknown> & { key: string; name: string }): Player {
  return {
    source: over.key.startsWith("atleta:") ? "conta" : "funil",
    aliases: [], memberId: null, estimated: [], userId: null, email: null, phone: null,
    createdAt: "2026-10-10T12:00:00.000Z", profile: {}, hasProfile: false, origin: "Direto",
    utm: { source: null, medium: null, campaign: null, content: null, term: null },
    stats: [], overall: 80, reportFromFunnel: false, meta: emptyMeta(), ...over,
  } as unknown as Player
}

const member = (over: Partial<MemberRow> = {}): MemberRow => ({
  id: "m1", userId: null, email: null, birthDate: null, position: null, category: null, team: null, city: null,
  heightCm: null, weightKg: null, foot: null, nationality: null, leadId: null, ...over,
})

/* ------------------------------------------------------------------ */
/* Junção                                                              */
/* ------------------------------------------------------------------ */

test("nome, time e idade: comparação sem acento e respostas que não são time", () => {
  assert.equal(normName("  Juan   DÉRICK Kretzer "), "juan derick kretzer")
  assert.equal(normName("João-Pedro, Jr."), "joao pedro jr")
  for (const t of ["Sim", "sim ", "NÃO", "não tenho", "Nenhum", "", null, undefined, "-"]) assert.equal(isJunkTeam(t as string), true, String(t))
  for (const t of ["Palmeiras", "São Paulo", "Simão Dias FC", "Joinville"]) assert.equal(isJunkTeam(t), false, t)

  assert.equal(ageFromBirth("2009-10-22", TODAY), 17, "faz 17 hoje")
  assert.equal(ageFromBirth("2009-10-23", TODAY), 16, "faz 17 amanhã")
  assert.equal(ageFromBirth("2026-01-01", TODAY), undefined, "criança de 0 ano: não é jogador")
  assert.equal(ageFromBirth("1950-01-01", TODAY), undefined, "mais de 60 anos")
  assert.equal(ageFromBirth("2009-13-40", TODAY), undefined)
  assert.equal(ageFromBirth(null, TODAY), undefined)
})

test("fillGaps só preenche campo vazio e conta o que preencheu", () => {
  const r = fillGaps({ position: "Zagueiro", age: 17 }, { position: "Meia", age: 99, city: "Joinville - SC", team: "" })
  assert.deepEqual(r.profile, { position: "Zagueiro", age: 17, city: "Joinville - SC" })
  assert.equal(r.filled, 1)
})

test("Juan Dérick Kretzer: lead + conta do mesmo e-mail viram UMA pessoa", () => {
  const lead = player({
    key: "lead:ed2eacd0", name: "Juan Dérick Kretzer", email: "juan@exemplo.com", phone: "47900000001", createdAt: "2026-10-10T12:00:00.000Z",
    profile: { age: 17, height: 190, weight: 84, foot: "canhoto", nationality: "Brasil", position: "Zagueiro", category: "Sub 17", state: "Santa Catarina", city: "Joinville - SC" },
    hasProfile: true, reportFromFunnel: true, overall: 88,
  })
  const account = player({
    key: "atleta:50", name: "Juan Dérick Kretzer", userId: "u-72df", createdAt: "2026-10-14T12:00:00.000Z",
    profile: { age: 17, position: "Zagueiro", city: "Joinville - SC", experience: undefined }, hasProfile: true,
  })
  const other = player({ key: "lead:zzzz", name: "Outra Pessoa", email: "outra@exemplo.com" })
  const links: PlayerLink[] = [{ atletaId: 50, leadId: "ed2eacd0" }]

  const { players, report } = mergePeople([lead, account, other], links, [], TODAY)
  assert.equal(players.length, 2, "dois registros viraram um; a outra pessoa continua")
  const juan = players.find((p: Player) => p.name === "Juan Dérick Kretzer")
  assert.equal(juan.key, "lead:ed2eacd0", "fica com o endereço do lead")
  assert.deepEqual(juan.aliases, ["atleta:50"], "o endereço da conta vira apelido (links antigos continuam abrindo)")
  assert.equal(juan.userId, "u-72df", "e leva o login junto (Gerenciar acesso)")
  assert.equal(juan.createdAt, "2026-10-10T12:00:00.000Z", "a entrada é a mais antiga")
  assert.equal(juan.profile.height, 190, "o perfil do funil é mantido")
  assert.equal(juan.reportFromFunnel, true)
  assert.equal(report.mergedAccounts, 1)
  assert.equal(hasAccount(juan), true)
  assert.equal(hasAccount(other), false)
  assert.deepEqual(keysOf(juan), ["lead:ed2eacd0", "atleta:50"])
})

test("conta sem lead, e lead sem conta, continuam como estão", () => {
  const lead = player({ key: "lead:aaaa", name: "Maria Souza", email: "m@exemplo.com" })
  const account = player({ key: "atleta:7", name: "Pedro Lima", userId: "u7" })
  const { players, report } = mergePeople([lead, account], [], [], TODAY)
  assert.equal(players.length, 2)
  assert.equal(report.mergedAccounts, 0)
})

test("duas linhas da mesma conta (mesmo login) viram uma, a mais antiga fica", () => {
  const a = player({ key: "atleta:1", name: "Kaio", userId: "u1", createdAt: "2026-10-01T00:00:00.000Z", profile: { age: 14 } })
  const b = player({ key: "atleta:2", name: "Kaio", userId: "u1", createdAt: "2026-10-05T00:00:00.000Z", profile: { position: "Volante" } })
  const { players, report } = mergePeople([b, a], [], [], TODAY)
  assert.equal(players.length, 1)
  assert.equal(players[0].key, "atleta:1")
  assert.deepEqual(players[0].aliases, ["atleta:2"])
  assert.deepEqual(players[0].profile, { age: 14, position: "Volante" })
  assert.equal(report.mergedAccounts, 1)
})

test("mesmo nome com e-mail diferente NÃO é juntado (pode ser homônimo)", () => {
  const a = player({ key: "lead:a", name: "João Pedro Silva", email: "a@exemplo.com" })
  const b = player({ key: "lead:b", name: "João Pedro Silva", email: "b@exemplo.com" })
  const acc = player({ key: "atleta:9", name: "João Pedro Silva", userId: "u9" })
  const { players } = mergePeople([a, b, acc], [], [], TODAY)
  assert.equal(players.length, 3)
})

test("conta absorvida: etapa e notas mais recentes ganham e nota que só um tem não se perde", () => {
  const lead = player({ key: "lead:a", name: "Ana", meta: { stage: "contato", notes: "", scout: null, updatedAt: "2026-10-12T00:00:00.000Z" } })
  const acc = player({ key: "atleta:1", name: "Ana", userId: "u1", meta: { stage: "novo", notes: "Pai pediu retorno", scout: null, updatedAt: "2026-10-11T00:00:00.000Z" } })
  const [p] = mergePeople([lead, acc], [{ atletaId: 1, leadId: "a" }], [], TODAY).players
  assert.equal(p.meta.stage, "contato", "a etapa mais recente")
  assert.equal(p.meta.notes, "Pai pediu retorno", "a nota que só a conta tinha")
})

test("o nome do lead que é só o começo do e-mail é trocado pelo nome da conta", () => {
  const lead = player({ key: "lead:a", name: "bruno123", email: "bruno123@exemplo.com" })
  const acc = player({ key: "atleta:1", name: "Bruno Almeida Reis", userId: "u1" })
  const [p] = mergePeople([lead, acc], [{ atletaId: 1, leadId: "a" }], [], TODAY).players
  assert.equal(p.name, "Bruno Almeida Reis")
})

test("o membro completa o que falta, sem sobrescrever e sem usar time 'Sim'", () => {
  const lead = player({ key: "lead:abc", name: "Davi Rocha", email: "d@exemplo.com", profile: { position: "Volante" }, hasProfile: true })
  const m = member({
    id: "m-davi", leadId: "abc", position: "Meia", category: "Sub 15", team: "Sim", city: "Salvador - BA", birthDate: "2011-03-14",
    heightCm: 160, foot: "Destro", nationality: "Brasil",
  })
  const { players, report } = mergePeople([lead], [], [m], TODAY)
  const p = players[0]
  assert.equal(p.profile.position, "Volante", "o que a pessoa informou continua")
  assert.equal(p.profile.category, "Sub 15", "o que faltava veio do membro")
  assert.equal(p.profile.city, "Salvador - BA")
  assert.equal(p.profile.team, undefined, "'Sim' não é nome de time")
  assert.equal(p.profile.birthDate, "2011-03-14")
  assert.equal(p.profile.age, 15, "a idade vem do nascimento")
  assert.equal(p.memberId, "m-davi")
  assert.equal(p.hasProfile, true)
  assert.equal(report.withMember, 1)
  assert.ok(report.filledFields >= 5)
})

test("a idade digitada no funil dá lugar à calculada pelo nascimento", () => {
  const lead = player({ key: "lead:a", name: "Caio", profile: { age: 12 } })
  const [p] = mergePeople([lead], [], [member({ leadId: "a", birthDate: "2008-05-01" })], TODAY).players
  assert.equal(p.profile.age, 18)
})

test("o membro é achado pelo login ou pelo e-mail quando não há lead ligado", () => {
  const acc = player({ key: "atleta:3", name: "Iago", userId: "u3" })
  const lead = player({ key: "lead:x", name: "Enzo", email: "ENZO@Exemplo.com" })
  const { players } = mergePeople([acc, lead], [], [member({ id: "m1", userId: "u3", position: "Goleiro" }), member({ id: "m2", email: "enzo@exemplo.com", position: "Zagueiro" })], TODAY)
  assert.equal(players.find((p: Player) => p.key === "atleta:3").profile.position, "Goleiro")
  assert.equal(players.find((p: Player) => p.key === "lead:x").profile.position, "Zagueiro")
})

test("a lista sai ordenada da entrada mais nova para a mais antiga e não altera o que entrou", () => {
  const a = player({ key: "lead:a", name: "A A", createdAt: "2026-10-01T00:00:00.000Z" })
  const b = player({ key: "lead:b", name: "B B", createdAt: "2026-10-09T00:00:00.000Z" })
  const input = [a, b]
  const { players } = mergePeople(input, [], [], TODAY)
  assert.deepEqual(players.map((p: Player) => p.key), ["lead:b", "lead:a"])
  assert.deepEqual(input.map((p) => p.key), ["lead:a", "lead:b"])
  assert.deepEqual(a.profile, {}, "o jogador original não foi mexido")
})

/* ------------------------------------------------------------------ */
/* Possíveis duplicados                                                */
/* ------------------------------------------------------------------ */

test("duplicados: só nome de 2 palavras ou mais, e telefone igual deixa a suspeita forte", () => {
  const list = [
    { key: "lead:1", name: "Camilo Karam Escobar", phone: "61900000002" },
    { key: "lead:2", name: "CAMILO  karam escobar", phone: "(61) 90000-0002" },
    { key: "lead:3", name: "João Pedro Almeida", phone: "61900000003" },
    { key: "lead:4", name: "Joao Pedro Almeida", phone: "11900000004" },
    { key: "lead:5", name: "João", phone: null },
    { key: "lead:6", name: "joão", phone: null },
    { key: "lead:7", name: "Maria Souza", phone: "61900000003" },
  ]
  const { groups, byKey } = findDuplicates(list)
  assert.equal(groups.length, 2, "nome de uma palavra só e telefone igual com nomes diferentes não contam")
  assert.equal(groups[0].strong, true, "o mais forte vem primeiro")
  assert.equal(groups[0].reason, "mesmo nome e mesmo telefone")
  assert.deepEqual(groups[0].keys, ["lead:1", "lead:2"])
  assert.equal(groups[1].strong, false)
  assert.equal(groups[1].reason, "mesmo nome")
  assert.equal(byKey.get("lead:4"), groups[1])
  assert.equal(byKey.has("lead:5"), false)
  assert.equal(byKey.has("lead:7"), false)
})

test("depois da junção, a mesma pessoa (lead + conta) já não aparece como duplicada", () => {
  const lead = player({ key: "lead:a", name: "Juan Dérick Kretzer", email: "j@exemplo.com" })
  const acc = player({ key: "atleta:1", name: "Juan Dérick Kretzer", userId: "u1" })
  const before = findDuplicates([lead, acc]).groups.length
  const after = findDuplicates(mergePeople([lead, acc], [{ atletaId: 1, leadId: "a" }], [], TODAY).players).groups.length
  assert.equal(before, 1)
  assert.equal(after, 0)
})

/* ------------------------------------------------------------------ */
/* Dados básicos                                                       */
/* ------------------------------------------------------------------ */

test("completude: quatro essenciais e o time a mais; o estimado não conta", () => {
  const full = completenessOf({ age: 17, position: "Zagueiro", category: "Sub 17", city: "Joinville - SC" })
  assert.equal(full.complete, true)
  assert.equal(full.core, 4)
  assert.equal(full.score, 100)
  assert.equal(missingLabel(full), "falta só o time")

  const withTeam = completenessOf({ age: 17, position: "Zagueiro", category: "Sub 17", state: "Santa Catarina", team: "Joinville" })
  assert.equal(withTeam.score, 108)
  assert.equal(missingLabel(withTeam), "completo")

  const half = completenessOf({ position: "Meia", city: "Natal - RN" })
  assert.equal(half.complete, false)
  assert.equal(missingLabel(half), "falta idade e categoria")
  assert.equal(missingLabel(completenessOf({})), "falta idade, posição, categoria e cidade")
  assert.equal(completenessOf({ team: "Sim" }).have.includes("time"), false, "'Sim' não conta como time")

  const p = player({ key: "lead:a", name: "X Y", profile: { position: "Meia", age: 15, team: "Bahia" }, estimated: ["age", "team"] })
  assert.deepEqual(realProfileOf(p), { position: "Meia" })
  assert.equal(completenessOf(realProfileOf(p)).core, 1)
})

/* ------------------------------------------------------------------ */
/* Valores estimados                                                   */
/* ------------------------------------------------------------------ */

test("estimativa: determinística (a mesma pessoa tem sempre os mesmos valores)", () => {
  const a = estimateProfile("lead:abc", {})
  const b = estimateProfile("lead:abc", {})
  assert.deepEqual(a, b)
  const c = estimateProfile("lead:abd", {})
  assert.notDeepEqual(a.profile, c.profile, "outra pessoa, outros valores")
  assert.ok(unit("x", "a") >= 0 && unit("x", "a") < 1)
  assert.notEqual(unit("x", "a"), unit("x", "b"), "campos diferentes sorteiam à parte")
})

test("estimativa: quem não informou nada recebe idade de 11 a 22, categoria da idade, time e cidade do Brasil", () => {
  const ages = new Set<number>()
  for (let i = 0; i < 3000; i++) {
    const { profile, estimated } = estimateProfile(`lead:${i}`, {})
    const age = profile.age as number
    assert.ok(age >= AGE_MIN && age <= AGE_MAX, `idade ${age}`)
    ages.add(age)
    assert.equal(profile.category, categoryFromAge(age), "a categoria acompanha a idade")
    assert.match(profile.city as string, /^[^-]+ - [A-Z]{2}$/, "cidade no formato do funil")
    assert.ok(PLACES.some((p) => p.state === profile.state && (profile.city as string).endsWith(` - ${p.uf}`)), "estado e cidade combinam")
    assert.ok(PLACES.some((p) => p.clubs.includes(profile.team as string)), "time do Brasil")
    assert.equal(profile.nationality, "Brasil")
    assert.ok(["destro", "canhoto", "ambidestro"].includes(profile.foot as string))
    assert.ok((profile.height as number) >= 120 && (profile.height as number) <= 205, `altura ${profile.height}`)
    assert.ok((profile.weight as number) >= 30 && (profile.weight as number) <= 100, `peso ${profile.weight}`)
    assert.deepEqual([...estimated].sort(), ["age", "category", "city", "foot", "height", "nationality", "position", "state", "team", "weight"].sort())
  }
  assert.equal(ages.size, AGE_MAX - AGE_MIN + 1, "todas as idades de 11 a 22 aparecem")
})

test("estimativa: categoria e idade se explicam (Sub 12 a Sub 20; 21 e 22 anos são Sub 23)", () => {
  assert.equal(categoryFromAge(11), "Sub 12")
  assert.equal(categoryFromAge(16), "Sub 17")
  assert.equal(categoryFromAge(19), "Sub 20")
  assert.equal(categoryFromAge(20), "Sub 20")
  assert.equal(categoryFromAge(22), "Sub 23")
  for (let i = 0; i < 200; i++) {
    const age = ageFromCategory("Sub 15", `k${i}`)
    assert.ok(age === 14 || age === 13, `Sub 15 com ${age} anos`)
  }
  assert.equal(ageFromCategory("Adulto", "k"), undefined)
  for (let i = 0; i < 50; i++) assert.equal(ageFromCategory("Sub 9", `s${i}`), 11, "a idade estimada nunca fica abaixo de 11")
  for (let i = 0; i < 50; i++) assert.ok((ageFromCategory("Sub 23", `t${i}`) as number) <= 22, "nem acima de 22")
})

test("estimativa: nunca sobrescreve o que a pessoa informou", () => {
  const real = { age: 17, position: "Zagueiro", category: "Sub 17", city: "Joinville - SC", state: "Santa Catarina", height: 190, weight: 84, foot: "canhoto", nationality: "Brasil" }
  const { profile, estimated } = estimateProfile("lead:ed2eacd0", real)
  for (const [k, v] of Object.entries(real)) assert.equal((profile as Record<string, unknown>)[k], v, k)
  assert.deepEqual(estimated, ["team"], "o Juan só ganha o time (o 'Sim' do CRM não valia)")
  assert.ok(PLACES.find((p) => p.uf === "SC")!.clubs.includes(profile.team as string), "e o time é de Santa Catarina")
})

test("estimativa: respeita a categoria e a idade que a pessoa já deu", () => {
  const byCategory = estimateProfile("lead:1", { category: "Sub 15" })
  assert.ok([13, 14].includes(byCategory.profile.age as number))
  assert.equal(byCategory.profile.category, "Sub 15")
  const byAge = estimateProfile("lead:2", { age: 16 })
  assert.equal(byAge.profile.category, "Sub 17")
  const byBirth = estimateProfile("lead:3", { age: 14, birthDate: "2012-01-01" })
  assert.equal(byBirth.estimated.includes("age"), false)
})

test("estimativa: time e cidade do mesmo estado do jogador", () => {
  const byState = estimateProfile("lead:5", { state: "Bahia" })
  assert.ok((byState.profile.city as string).endsWith(" - BA"))
  assert.ok(PLACES.find((p) => p.uf === "BA")!.clubs.includes(byState.profile.team as string))
  assert.equal(byState.profile.state, "Bahia", "o estado informado não muda")
  const byCity = estimateProfile("lead:6", { city: "Natal - RN" })
  assert.ok(PLACES.find((p) => p.uf === "RN")!.clubs.includes(byCity.profile.team as string))
  assert.equal(byCity.estimated.includes("city"), false)
  const unknownState = estimateProfile("lead:7", { city: "Rio Branco - AC" })
  assert.ok(typeof unknownState.profile.team === "string" && unknownState.profile.team.length > 0, "estado sem clubes na lista usa qualquer clube do Brasil")
})

test("estimativa: ufOf entende 'Cidade - UF' e o nome do estado", () => {
  assert.equal(ufOf({ city: "Joinville - SC" }), "SC")
  assert.equal(ufOf({ city: "joinville - sc" }), "SC")
  assert.equal(ufOf({ state: "Santa Catarina" }), "SC")
  assert.equal(ufOf({ state: "santa catarina" }), "SC")
  assert.equal(ufOf({ city: "Brasília" }), null)
  assert.equal(ufOf({}), null)
})

test("estimativa: a lista de lugares e clubes está inteira", () => {
  const ufs = new Set(PLACES.map((p) => p.uf))
  assert.equal(ufs.size, PLACES.length, "sigla repetida")
  for (const p of PLACES) {
    assert.ok(p.cities.length >= 2 && p.clubs.length >= 3, p.uf)
    assert.equal(new Set(p.clubs).size, p.clubs.length, `${p.uf}: clube repetido`)
  }
})

test("estimativa: pé, altura e peso combinam com a idade e a posição", () => {
  const feet = { destro: 0, canhoto: 0, ambidestro: 0 }
  let young = 0, youngH = 0, old = 0, oldH = 0
  for (let i = 0; i < 4000; i++) {
    const { profile } = estimateProfile(`lead:p${i}`, {})
    feet[profile.foot as keyof typeof feet] += 1
    if (profile.age === 11) { young += 1; youngH += profile.height as number }
    if (profile.age === 20) { old += 1; oldH += profile.height as number }
  }
  assert.ok(feet.destro / 4000 > 0.66 && feet.destro / 4000 < 0.78, `destros ${feet.destro}`)
  assert.ok(feet.canhoto / 4000 > 0.19 && feet.canhoto / 4000 < 0.29, `canhotos ${feet.canhoto}`)
  assert.ok(feet.ambidestro > 0)
  assert.ok(youngH / young < oldH / old - 20, "quem tem 11 anos é mais baixo que quem tem 20")
  const kid = estimateProfile("lead:k", { age: 9 })
  assert.ok((kid.profile.height as number) < 146, "abaixo de 11 anos a curva continua para baixo")
})

test("estimativa: withEstimates marca o que foi estimado, não mexe em quem está completo e é idempotente", () => {
  const complete = player({
    key: "lead:c", name: "Completo Total", profile: { age: 17, position: "Meia", category: "Sub 17", city: "Natal - RN", state: "Rio Grande do Norte", team: "ABC", foot: "destro", nationality: "Brasil", height: 175, weight: 68 },
  })
  const empty = player({ key: "lead:e", name: "Sem Dados" })
  const out = withEstimates([complete, empty])
  assert.equal(out[0], complete, "o completo é o mesmo objeto, sem cópia")
  assert.ok(out[1].estimated.length >= 8)
  assert.equal(out[1].profile.age >= 11 && out[1].profile.age <= 22, true)
  assert.deepEqual(empty.profile, {}, "o original não é mexido")
  assert.deepEqual(realProfileOf(out[1]), {}, "o perfil real continua vazio")
  const twice = withEstimates(out)
  assert.deepEqual(twice[1], out[1], "idempotente")
})

test("sorteio estável: distribuição uniforme e sem repetir para chaves parecidas", () => {
  const buckets = new Array(10).fill(0)
  const seen = new Set<number>()
  for (let i = 0; i < 20000; i++) {
    const u = unit(`lead:${i}`, "age")
    buckets[Math.floor(u * 10)] += 1
    seen.add(u)
  }
  for (const n of buckets) assert.ok(n > 1700 && n < 2300, `faixa com ${n}`)
  assert.ok(seen.size > 19900, "quase nenhum valor repetido")
})
