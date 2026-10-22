/**
 * Testes da ponte CRM → VOXEN (lado da VOXEN). Rodam com o Node, sem dependência nova:
 *   npm run test:ponte
 * Cobrem a assinatura (HMAC, janela de horário, adulteração), o formato do contrato, a lista
 * fechada de dados (contato, dinheiro e funil comercial continuam de fora), o contrato v1.1
 * (responsável, observações, qualificação e notas de atendimento) e a interpretação dos textos.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { invalidReason, parseBirthDate, parseClub, parseEvent, parseFilledBy, parsePositionCategory, parseState, sanitizeEvent, scrubContacts } from "./crm-context-parse.ts"
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

test("o que continua fora (contato, dinheiro, funil comercial) não passa pela limpeza", () => {
  const dirty = event({
    phone: "71999990000",
    email: "pai@exemplo.com",
    observations: "chave solta na raiz",
    qualification_score: 90,
    lead_score: 77,
    temperature: "quente",
    campaign: "Anúncio X",
    utm_source: "facebook",
    payments: [{ value: 497 }],
    followup_at: "2026-11-01",
    profile: { ...event().profile, phone_raw: "71999990000", guardian_phone_raw: "71988887777" },
    context: { ...event().context, whatsapp_number: "71999990000" },
    guardian: { name: "Maria Silva", phone: "71988887777", email: "mae@exemplo.com" },
    crm: { observations: "ok", qualification: { goal: "g", decision_maker: "d", timeline: "t", summary: "s", score: 99, temperature: "quente" }, payment_status: "pago" },
  })
  const text = JSON.stringify(sanitizeEvent(dirty))
  for (const banned of ["71999990000", "71988887777", "pai@exemplo.com", "mae@exemplo.com", "chave solta", "lead_score", "qualification_score", "temperature", "quente", "Anúncio X", "utm_", "payments", "497", "followup", "payment_status", "pago", "\"score\""]) {
    assert.equal(text.includes(banned), false, `vazou: ${banned}`)
  }
  const clean = sanitizeEvent(dirty)
  assert.deepEqual(clean.answers, [{ question: "Qual a posição?", answer: "Meia" }], "perguntas de contato e renda continuam barradas")
  assert.deepEqual(clean.guardian, { name: "Maria Silva" })
})

/* Contrato v1.1 (decisão do dono em 21/10/2026) ---------------------- */

test("v1.1: aceita responsável, observações, qualificação, notas e os campos extras de contexto", () => {
  const clean = sanitizeEvent(event({
    guardian: { name: "Maria Silva", filled_by_raw: "Sou a mãe dele" },
    crm: { observations: "Família muito engajada.", qualification: { goal: "Base de Série A", decision_maker: "Mãe", timeline: "Até dezembro", summary: "Quente" } },
    context: { ...event().context, evaluated_clubs: "Bahia e Vitória", strengths_and_improvements: "Passe curto; precisa de força", commitment_score_raw: "8" },
    notes: [
      { type: "whatsapp_summary", content: "Pediu valores e prazo.", created_at: "2026-10-01T12:00:00Z" },
      { type: "call_transcript", content: "x".repeat(7000), created_at: "2026-10-02T15:30:00Z", truncated: true },
    ],
  }))
  assert.deepEqual(clean.guardian, { name: "Maria Silva", filled_by_raw: "Sou a mãe dele" })
  assert.equal(clean.crm?.observations, "Família muito engajada.")
  assert.deepEqual(clean.crm?.qualification, { goal: "Base de Série A", decision_maker: "Mãe", timeline: "Até dezembro", summary: "Quente" })
  assert.equal(clean.context.evaluated_clubs, "Bahia e Vitória")
  assert.equal(clean.context.strengths_and_improvements, "Passe curto; precisa de força")
  assert.equal(clean.context.commitment_score_raw, "8")
  assert.equal(clean.notes?.length, 2)
  assert.equal(clean.notes?.[1].content.length, 6000, "nota cortada em 6000 caracteres")
  assert.equal(clean.notes?.[1].truncated, true)
})

test("v1.1: notas só dos tipos conhecidos, sem autor nem anexo, no máximo as 25 mais recentes", () => {
  const notes = Array.from({ length: 30 }, (_, i) => ({ type: "manual_note", content: `nota ${i}`, created_at: "2026-10-01T10:00:00Z", author: "Fulano", attachment: "arquivo.pdf" }))
  const clean = sanitizeEvent(event({ notes: [{ type: "email", content: "tipo desconhecido" }, { type: "manual_note", content: "   " }, ...notes] }))
  assert.equal(clean.notes?.length, 25)
  assert.equal(clean.notes?.[0].content, "nota 5", "ficam as 25 últimas")
  assert.equal(clean.notes?.[24].content, "nota 29")
  const text = JSON.stringify(clean.notes)
  assert.equal(text.includes("author"), false)
  assert.equal(text.includes("attachment"), false)
  assert.equal(text.includes("tipo desconhecido"), false)
  assert.equal(sanitizeEvent(event({ notes: [{ type: "manual_note", content: "a", created_at: "ontem" }] })).notes?.[0].created_at, undefined, "data inválida é ignorada")
  assert.equal(sanitizeEvent(event()).notes, undefined, "sem notas, a chave nem existe")
})

test("v1.1: telefone e e-mail digitados em texto livre viram [contato removido]", () => {
  const clean = sanitizeEvent(event({
    guardian: { name: "Maria" },
    crm: { observations: "Ligar para (71) 99999-0000 ou mandar para mae@exemplo.com", qualification: { summary: "WhatsApp +55 71 98888-7777" } },
    notes: [{ type: "whatsapp_summary", content: "Passou o número 71999990000 e o fixo 71 3333-4444; também 99999-1234." }],
    context: { goal: "Falar com 5571999990000" },
  }))
  const text = JSON.stringify(clean)
  for (const banned of ["99999-0000", "mae@exemplo.com", "98888-7777", "71999990000", "3333-4444", "99999-1234", "5571999990000"]) {
    assert.equal(text.includes(banned), false, `sobrou: ${banned}`)
  }
  assert.match(clean.crm?.observations ?? "", /\[contato removido\] ou mandar para \[contato removido\]/)
  assert.match(clean.notes?.[0].content ?? "", /^Passou o número \[contato removido\] e o fixo \[contato removido\]; também \[contato removido\]\.$/)
})

test("v1.1: datas, anos e medidas não são confundidos com telefone", () => {
  for (const safe of ["Nascido em 14/03/2009", "2009-03-14", "Gama 2022-2023 e Vitória 2021", "Altura 1,78 m, 68 kg", "Sub 17, camisa 10", "Passou em 12/2024 com nota 8,5", "Entre 2020 2021 2022"]) {
    assert.equal(scrubContacts(safe), safe, safe)
  }
})

test("v1.1: o bloco do responsável também diz quem preencheu quando o formulário não diz", () => {
  const e = event({ profile: { birth_date_raw: "14/03/2009" }, guardian: { name: "Maria", filled_by_raw: "Sou a mãe" } })
  assert.equal(parseEvent(sanitizeEvent(e), TODAY).filled_by, "responsavel")
  const f = event({ guardian: { name: "Maria", filled_by_raw: "Sou o atleta" } })
  assert.equal(parseEvent(sanitizeEvent(f), TODAY).filled_by, "responsavel", "o texto do formulário (profile) vale primeiro")
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

/* Contrato v1.2: pré-cadastro (prospect_context) --------------------- */

const prospect = (extra: Record<string, unknown> = {}) => {
  const lead = "22222222-2222-4222-8222-222222222222"
  return event({ kind: "prospect_context", source_lead_id: lead, link: { basis: "lead do CRM sem cadastro na VOXEN", form_lead_id: null, crm_lead_id: lead }, ...extra })
}

test("v1.2: prospect_context é aceito quando link.crm_lead_id é igual a source_lead_id", () => {
  assert.equal(invalidReason(prospect(), PROJECT), null)
  assert.equal(invalidReason(event({ kind: "outro" }), PROJECT) !== null, true, "tipo desconhecido continua recusado")
  assert.match(invalidReason(prospect({ link: { basis: "x", crm_lead_id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d" } }), PROJECT) ?? "", /link\.crm_lead_id/)
  assert.match(invalidReason(prospect({ link: { basis: "x" } }), PROJECT) ?? "", /link\.crm_lead_id/)
  assert.equal(invalidReason(event({ link: { basis: "x" } }), PROJECT), null, "o athlete_context não exige o vínculo")
})

test("v1.2: o pré-cadastro passa pela mesma limpeza (nada de contato, dinheiro ou funil comercial)", () => {
  const clean = sanitizeEvent(prospect({
    phone: "71999990000",
    structured: { athlete_name: "Fulano de Tal", phone: "71999990000" },
    guardian: { name: "Maria Silva", phone: "71988887777" },
    notes: [{ type: "whatsapp_summary", content: "Ligar para 71999990000", created_at: "2026-10-20T14:00:00Z" }],
    utm_source: "facebook", campaign: "Anúncio X", lead_score: 80,
  }))
  const text = JSON.stringify(clean)
  for (const banned of ["71999990000", "71988887777", "utm_", "Anúncio X", "lead_score"]) assert.equal(text.includes(banned), false, `vazou: ${banned}`)
  assert.equal(clean.kind, "prospect_context")
  assert.equal(clean.structured?.athlete_name, "Fulano de Tal")
  assert.match(clean.notes?.[0].content ?? "", /\[contato removido\]/)
})

test("v1.2: respostas de até 4000 caracteres, com orçamento total para não passar do limite do banco", () => {
  const long = sanitizeEvent(event({ answers: [{ question: "Pergunta nova?", answer: "a".repeat(5000) }] }))
  assert.equal(long.answers[0].answer.length, 4000)
  const many = sanitizeEvent(event({ answers: Array.from({ length: 30 }, (_, i) => ({ question: `Pergunta ${i}?`, answer: "b".repeat(4000) })) }))
  assert.equal(many.answers.length, 12, "50 mil caracteres: cortam as últimas, não as primeiras")
  assert.equal(many.answers[0].question, "Pergunta 0?")
  const small = sanitizeEvent(event({ answers: [...Array.from({ length: 13 }, (_, i) => ({ question: `P${i}?`, answer: "c".repeat(4000) })), { question: "Curta?", answer: "ok" }] }))
  assert.equal(small.answers.some((a) => a.question === "Curta?"), false, "depois que o orçamento acaba, nada mais entra")
})

test("v1.2: pergunta sobre dinheiro, documento ou contato continua barrada nas respostas", () => {
  const clean = sanitizeEvent(event({
    answers: [
      { question: "Qual a renda da família?", answer: "R$ 3.000" },
      { question: "Qual o seu CPF?", answer: "123" },
      { question: "Qual o seu WhatsApp?", answer: "71 99999-0000" },
      { question: "Em que cidade você mora?", answer: "Salvador" },
    ],
  }))
  assert.deepEqual(clean.answers, [{ question: "Em que cidade você mora?", answer: "Salvador" }])
})
