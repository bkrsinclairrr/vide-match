import assert from "node:assert/strict"
import { test } from "node:test"
import { atletaRow, formFromAccount, ownName, type ProfileSource } from "./profileForm.ts"

const account = (over: Partial<ProfileSource> = {}): ProfileSource => ({
  name: "Marcos Silva", email: "marcos.silva@gmail.com", position: "Zagueiro", age: 19, heightCm: 182, weightKg: 76.4,
  foot: "Destro", nationality: "Brasil", avatarUrl: null, ...over,
})

const player = (over: Record<string, string> = {}) => ({
  name: "Marcos Silva", age: "19", height: "182", weight: "76", preferredFoot: "destro", email: "", phone: "",
  nationality: "Brasil", position: "Zagueiro", state: "Distrito Federal", city: "Brasília", photo: "", category: "Sub 20",
  hasDualCitizenship: "Não", dualCitizenshipCountry: "", ...over,
})

test("o nome vem da conta, mas o começo do e-mail e o 'Atleta' padrão não valem como nome", () => {
  assert.equal(ownName(account()), "Marcos Silva")
  assert.equal(ownName(account({ name: "marcos.silva" })), "")
  assert.equal(ownName(account({ name: "Atleta" })), "")
  assert.equal(ownName(account({ name: "  ", email: null })), "")
})

test("a conta preenche o formulário com o que ele consegue mostrar", () => {
  const f = formFromAccount(account({ avatarUrl: "https://x/foto.jpg" }), "Sub 20")
  assert.deepEqual(f, {
    name: "Marcos Silva", age: "19", height: "182", weight: "76", preferredFoot: "destro", nationality: "Brasil",
    position: "Zagueiro", category: "Sub 20", photo: "https://x/foto.jpg",
  })
})

test("o que a lista do formulário não tem fica de fora, e o que está vazio não apaga o padrão", () => {
  const f = formFromAccount(account({ position: "Líbero", nationality: "Atlântida", foot: "esquerdo", age: null, heightCm: null }), "Sub 99")
  assert.equal("position" in f, false)
  assert.equal("nationality" in f, false)
  assert.equal("preferredFoot" in f, false)
  assert.equal("category" in f, false)
  assert.equal("age" in f, false)
  assert.equal("height" in f, false)
  assert.equal("photo" in f, false)
  assert.equal(f.name, "Marcos Silva")
})

test("conta sem nada preenchido começa com o formulário em branco", () => {
  const f = formFromAccount({ name: "Atleta", email: null, position: null, age: null, heightCm: null, weightKg: null, foot: null, nationality: null, avatarUrl: null }, null)
  assert.deepEqual(f, {})
})

test("o que a pessoa digitou vira a linha de Atletas, com números de verdade", () => {
  const r = atletaRow("u1", player({ name: "  Marcos Silva ", city: " Brasília " }))
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.deepEqual(r.row, {
      user_id: "u1", nome: "Marcos Silva", idade: 19, altura: 182, peso: 76, melhor_pe: "destro",
      nacionalidade: "Brasil", posicao: "Zagueiro", cidade: "Brasília",
    })
  }
})

test("dado inválido ou faltando não vira linha", () => {
  assert.equal(atletaRow("u1", player({ city: "" })).ok, false)
  assert.equal(atletaRow("u1", player({ age: "abc" })).ok, false)
  assert.equal(atletaRow("u1", player({ age: "16.5" })).ok, false)
  assert.equal(atletaRow("u1", player({ height: "0" })).ok, false)
  assert.equal(atletaRow("u1", player({ position: "" })).ok, false)
  assert.equal(atletaRow("u1", player({ name: "A" })).ok, false)
})
