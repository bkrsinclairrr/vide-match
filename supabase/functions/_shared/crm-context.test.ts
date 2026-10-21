/**
 * Testes da ponte CRM → VOXEN (lado da VOXEN). Rodam com o Node, sem dependência nova:
 *   npm run test:ponte
 * Cobrem a assinatura (HMAC, janela de horário, adulteração), o formato do contrato, a lista
 * fechada de dados (nada da lista "Nunca sai") e a interpretação dos textos do formulário.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { invalidReason, parseBirthDate, parseClub, parseEvent, parseFilledBy, parsePositionCategory, parseState, sanitizeEvent } from "./crm-context-parse.ts"
import { safeEqual, signHex, verifySignature } from "./crm-bridge-signature.ts"

const enc = new TextEncoder()
const SECRET = "segredo-de-teste-nao-usar-em-producao"
const NOW = Date.UTC(2026, 9, 21, 12, 0, 0)
const TODAY = new Date(NOW)
const PROJECT = "mbzwchnxtskysqplqiyy"

const event = (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  kind: "athlete_context",
  event_id: "3f1c2b7e-9a4d-4c1e-8f2a-1b2c3d4e5f60",
  source_project: PROJECT,
  source_lead_id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  source_revision: 2,
  generated_at: "2026-10-21T11:59:00Z",
  link: { basis: "site_import_events.source_lead_id", form_lead_id: "f0f0f0f0-0000-4000-8000-000000000001", crm_lead_id: null },
  profile: {
    birth_date_raw: "14/03/2009",
    state_raw: "BA",
    position_category_raw: "Meia, sub 17",
    current_club_raw: "Bahia",
    filled_by_raw: "Sou o pai dele",
  },
  context: { past_clubs: "Vitória (2022)", trials: "Peneira do Bahia: passou", opportunities_received: "Nenhuma", goal: "Jogar na base", blocker: "Transporte" },
  answers: [
    { question: "Qual a posição?", answer: "Meia" },
    { question: "Qual o seu WhatsApp?", answer: "71 99999-0000" },
    { question: "Qual a renda da família?", answer: "R$ 3.000" },
    { question: "Qual o e-mail do responsável?", answer: "pai@exemplo.com" },
  ],
  ...extra,
})

/* Assinatura ------------------------------------------------------- */

test("assinatura certa, dentro da janela, passa", async () => {
  const body = enc.encode(JSON.stringify(event()))
  const ts = String(Math.floor(NOW / 1000))
  const sig = `sha256=${await signHex(SECRET, ts, body)}`
  assert.equal(await verifySignature({ secret: SECRET, timestamp: ts, signature: sig, body, nowMs: NOW }), "ok")
})

test("corpo adulterado depois de assinado é recusado", async () => {
  const body = enc.encode(JSON.stringify(event()))
  const ts = String(Math.floor(NOW / 1000))
  const sig = `sha256=${await signHex(SECRET, ts, body)}`
  const tampered = enc.encode(JSON.stringify(event({ source_revision: 3 })))
  assert.equal(await verifySignature({ secret: SECRET, timestamp: ts, signature: sig, body: tampered, nowMs: NOW }), "bad")
})

test("replay fora da janela de 5 minutos é recusado", async () => {
  const body = enc.encode("{}")
  const ts = String(Math.floor(NOW / 1000) - 301)
  const sig = `sha256=${await signHex(SECRET, ts, body)}`
  assert.equal(await verifySignature({ secret: SECRET, timestamp: ts, signature: sig, body, nowMs: NOW }), "stale")
})

test("segredo errado, cabeçalho malformado e horário em milissegundos são recusados", async () => {
  const body = enc.encode("{}")
  const ts = String(Math.floor(NOW / 1000))
  const wrong = `sha256=${await signHex("outro-segredo", ts, body)}`
  assert.equal(await verifySignature({ secret: SECRET, timestamp: ts, signature: wrong, body, nowMs: NOW }), "bad")
  assert.equal(await verifySignature({ secret: SECRET, timestamp: ts, signature: "abc", body, nowMs: NOW }), "bad")
  assert.equal(await verifySignature({ secret: SECRET, timestamp: String(NOW), signature: wrong, body, nowMs: NOW }), "bad")
})

test("comparação em tempo constante compara de verdade", () => {
  assert.equal(safeEqual("abc", "abc"), true)
  assert.equal(safeEqual("abc", "abd"), false)
  assert.equal(safeEqual("abc", "abcd"), false)
})

/* Formato e lista fechada -------------------------------------------- */

test("formato do contrato v1", () => {
  assert.equal(invalidReason(event(), PROJECT), null)
  assert.match(invalidReason(event({ schema_version: 2 }), PROJECT) ?? "", /schema_version/)
  assert.match(invalidReason(event({ source_project: "outro" }), PROJECT) ?? "", /source_project/)
  assert.match(invalidReason(event({ event_id: "123" }), PROJECT) ?? "", /event_id/)
  assert.match(invalidReason(event({ source_revision: 0 }), PROJECT) ?? "", /source_revision/)
  assert.match(invalidReason([], PROJECT) ?? "", /objeto/)
})

test("nada da lista 'Nunca sai' passa pela limpeza", () => {
  const dirty = event({
    phone: "71999990000",
    email: "pai@exemplo.com",
    observations: "cliente quente",
    qualification_score: 90,
    payments: [{ value: 497 }],
    profile: { ...event().profile, phone_raw: "71999990000", guardian_name_raw: "Fulano" },
    context: { ...event().context, whatsapp_summary: "conversa de venda", manual_note: "objeção de preço" },
  })
  const clean = sanitizeEvent(dirty)
  const text = JSON.stringify(clean)
  for (const banned of ["71999990000", "71 99999-0000", "pai@exemplo.com", "cliente quente", "qualification", "payments", "497", "Fulano", "whatsapp_summary", "objeção", "R$ 3.000", "renda"]) {
    assert.equal(text.includes(banned), false, `vazou: ${banned}`)
  }
  assert.deepEqual(clean.answers, [{ question: "Qual a posição?", answer: "Meia" }])
})

/* Interpretação ------------------------------------------------------ */

test("datas de nascimento", () => {
  assert.equal(parseBirthDate("14/03/2009", TODAY), "2009-03-14")
  assert.equal(parseBirthDate("14-3-09", TODAY), "2009-03-14")
  assert.equal(parseBirthDate("2009-03-14", TODAY), "2009-03-14")
  assert.equal(parseBirthDate("14 de março de 2009", TODAY), "2009-03-14")
  assert.equal(parseBirthDate("Nasci em 01.12.2010", TODAY), "2010-12-01")
  assert.equal(parseBirthDate("31/02/2009", TODAY), null, "data impossível")
  assert.equal(parseBirthDate("2009", TODAY), null, "só o ano")
  assert.equal(parseBirthDate("14/03/2030", TODAY), null, "no futuro")
  assert.equal(parseBirthDate("14/03/1975", TODAY), null, "fora da faixa de idade")
})

test("posição e categoria", () => {
  assert.deepEqual(parsePositionCategory("Meia, sub 17"), { position: "Meia-Atacante", category: "Sub 17", positionAmbiguous: false })
  assert.equal(parsePositionCategory("Zagueiro sub-15").position, "Zagueiro")
  assert.equal(parsePositionCategory("Zagueiro sub-15").category, "Sub 15")
  assert.equal(parsePositionCategory("lateral esquerdo, pé esquerdo").position, "Lateral Esquerdo")
  assert.equal(parsePositionCategory("Goleiro").position, "Goleiro")
  assert.equal(parsePositionCategory("Meio campo sub17").position, "Meio-Campo")
  assert.equal(parsePositionCategory("Ponta direita").position, "Ponta Direita")
  assert.equal(parsePositionCategory("centroavante").position, "Centroavante")
  // Ambíguos: vão para revisão, nunca são chutados.
  for (const vague of ["Atacante", "Lateral", "Ponta", "volante e meia", "Ala"]) {
    const p = parsePositionCategory(vague)
    assert.equal(p.position, null, vague)
    assert.equal(p.positionAmbiguous, true, vague)
  }
  assert.equal(parsePositionCategory("sub 25").category, null, "categoria fora de Sub 6 a Sub 20")
  assert.equal(parsePositionCategory("sub 17").positionAmbiguous, false, "só a categoria não pede revisão de posição")
})

test("estado, clube e quem preencheu", () => {
  assert.equal(parseState("BA"), "Bahia")
  assert.equal(parseState("são paulo"), "São Paulo")
  assert.equal(parseState("Salvador - BA"), "Bahia")
  assert.equal(parseState("curitiba parana"), "Paraná")
  assert.equal(parseState("Mato Grosso do Sul"), "Mato Grosso do Sul")
  assert.equal(parseState("Atlântida"), null)
  assert.deepEqual(parseClub("Bahia"), { team: "Bahia", review: false })
  assert.deepEqual(parseClub("Não tenho clube"), { team: null, review: false })
  assert.equal(parseClub("x".repeat(90)).review, true)
  assert.equal(parseFilledBy("Sou o pai dele"), "responsavel")
  assert.equal(parseFilledBy("Eu mesmo, o atleta"), "atleta")
  assert.equal(parseFilledBy("?"), null)
})

test("evento completo: preenche o que entende e manda o resto para revisão", () => {
  const parsed = parseEvent(sanitizeEvent(event()), TODAY)
  assert.equal(parsed.birth_date, "2009-03-14")
  assert.equal(parsed.position, "Meia-Atacante")
  assert.equal(parsed.category, "Sub 17")
  assert.equal(parsed.team, "Bahia")
  assert.equal(parsed.city, "Bahia")
  assert.equal(parsed.filled_by, "responsavel")
  assert.deepEqual(parsed.review, [])

  const messy = parseEvent(sanitizeEvent(event({ profile: { birth_date_raw: "2009", position_category_raw: "atacante sub 15", state_raw: "Atlântida" } })), TODAY)
  assert.equal(messy.birth_date, undefined)
  assert.equal(messy.position, undefined)
  assert.equal(messy.category, "Sub 15")
  assert.deepEqual(messy.review.map((r) => r.field).sort(), ["birth_date", "city", "position"])
})

test("campos corrigidos no CRM valem mais que o texto do formulário", () => {
  const parsed = parseEvent(sanitizeEvent(event({ structured: { athlete_birth_date: "2009-04-02", athlete_position: "Volante", city_state: "Salvador - BA" } })), TODAY)
  assert.equal(parsed.birth_date, "2009-04-02")
  assert.equal(parsed.position, "Volante")
  assert.equal(parsed.category, "Sub 17", "a categoria continua vindo do texto do formulário")
  assert.equal(parsed.city, "Salvador - BA")
})
