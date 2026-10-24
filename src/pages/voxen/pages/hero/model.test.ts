import assert from "node:assert/strict"
import { test } from "node:test"
import { GOLD, accentOf, heroFacts, lookFromControls, rgbOf, splitName, visualOf } from "./model.ts"

const body = { url: "https://x/corpo-1000.webp", smallUrl: "https://x/corpo-640.webp", style: "recorte" as const, kit: null }
const look = (over: Record<string, unknown> = {}) => ({
  memberId: "m1", avatarUrl: null, body: null, mode: "perfil" as const, choiceBy: null, choiceAt: null, ...over,
})

test("nome: o primeiro nome pequeno e o resto em destaque", () => {
  assert.deepEqual(splitName("Gabriel Rocha da Silva"), { first: "Gabriel", last: "Rocha da Silva" })
  assert.deepEqual(splitName("  Juan   Dérick Kretzer "), { first: "Juan", last: "Dérick Kretzer" })
  assert.deepEqual(splitName("Neymar"), { first: "Neymar", last: "" })
  assert.deepEqual(splitName("   "), { first: "Atleta", last: "" })
})

test("quadradinhos: só o que existe, na ordem, e o pé com a inicial maiúscula", () => {
  assert.deepEqual(heroFacts({ profile: {} }), [])
  const facts = heroFacts({ profile: { category: "Sub 20", age: 19, height: 178, weight: 72, foot: "canhoto" } })
  assert.deepEqual(facts.map((f) => f.key), ["category", "age", "height", "weight", "foot"])
  assert.equal(facts[1].unit, "anos")
  assert.equal(facts[2].unit, "cm")
  assert.equal(facts[4].value, "Canhoto")
  assert.deepEqual(heroFacts({ profile: { age: 15 } }).map((f) => f.key), ["age"])
  assert.equal(heroFacts({ profile: { foot: "AMBIDESTRO" } })[0].value, "Ambidestro")
})

test("cor do uniforme: só #rrggbb vale, o resto cai no dourado", () => {
  assert.equal(accentOf("#0b6b3a"), "#0b6b3a")
  assert.equal(accentOf("verde"), GOLD)
  assert.equal(accentOf(null), GOLD)
  assert.equal(accentOf("#12345"), GOLD)
  assert.equal(rgbOf("#0b6b3a"), "11, 107, 58")
  assert.equal(rgbOf("nada"), "251, 191, 36")
})

test("foto depois do envio: corpo inteiro só com a foto, e a escolha vem dos controles", () => {
  const sent = { bodyPhotoUrl: body.url, bodyPhotoSmallUrl: body.smallUrl, bodyPhotoStyle: "recorte" as const, bodyPhotoOn: true, photoChoiceBy: "equipe" as const, photoChoiceAt: "2026-10-23T12:00:00Z" }
  const l = lookFromControls(look(), sent, null)
  assert.equal(l.mode, "corpo")
  assert.equal(l.body?.url, body.url)
  assert.equal(l.body?.style, "recorte")
  assert.equal(l.choiceBy, "equipe")
  assert.equal(l.memberId, "m1", "o resto da foto fica como estava")
  // Ligado, mas sem foto: continua no perfil (o banco não deixa ligar sem foto).
  assert.equal(lookFromControls(look(), { ...sent, bodyPhotoUrl: null, bodyPhotoSmallUrl: null }, null).mode, "perfil")
  assert.equal(lookFromControls(look(), { ...sent, bodyPhotoOn: false }, null).mode, "perfil")
  assert.ok(lookFromControls(look(), { ...sent, bodyPhotoOn: false }, null).body, "com a foto desligada ela continua guardada")
})

test("o que aparece e o que a equipe pode fazer", () => {
  // Carregando.
  assert.equal(visualOf({ look: null, canScout: true, isMember: true }).kind, "loading")
  // Membro com foto de corpo inteiro escolhida: retrato, e a equipe troca e alterna.
  const p = visualOf({ look: look({ body, mode: "corpo" }), canScout: true, isMember: true })
  assert.deepEqual(p, { kind: "portrait", canSwitch: true, canUpload: true, invite: false, needsMember: false })
  // Tem a foto, mas aparece com a redonda: avatar, e dá para alternar.
  const a = visualOf({ look: look({ body }), canScout: true, isMember: true })
  assert.equal(a.kind, "avatar")
  assert.equal(a.canSwitch, true)
  assert.equal(a.invite, false)
  // Membro sem foto em pé: convite para adicionar, sem alternar.
  const none = visualOf({ look: look(), canScout: true, isMember: true })
  assert.deepEqual(none, { kind: "avatar", canSwitch: false, canUpload: true, invite: true, needsMember: false })
  // Ainda não é membro: a equipe é levada a cadastrar; nada de enviar foto.
  const guest = visualOf({ look: look({ memberId: null }), canScout: true, isMember: false })
  assert.deepEqual(guest, { kind: "avatar", canSwitch: false, canUpload: false, invite: false, needsMember: true })
  // Quem só lê (executivo) vê a foto, sem nenhum controle.
  const viewer = visualOf({ look: look({ body, mode: "corpo" }), canScout: false, isMember: true })
  assert.deepEqual(viewer, { kind: "portrait", canSwitch: false, canUpload: false, invite: false, needsMember: false })
})
