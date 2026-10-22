import assert from "node:assert/strict"
import { test } from "node:test"
import { FORM_TOTAL, clip, contextCounts, formFilled, summarizeContext, type ContextSource } from "./summary.ts"

const src = (p: Partial<ContextSource> = {}): ContextSource => ({
  guardianName: null, filledBy: null, currentClub: null, pastClubs: null, trials: null, opportunitiesReceived: null, goal: null, blocker: null,
  evaluatedClubs: null, strengthsAndImprovements: null, commitmentScore: null, crmObservations: null, qualification: null, notes: [], answers: [], ...p,
})

const note = (type: "whatsapp_summary" | "manual_note" | "call_transcript", createdAt: string | null = null) => ({ type, content: "texto", createdAt, truncated: false })
const at = (d: number) => new Date(2026, 9, d, 12, 0, 0).toISOString()

test("clip: uma linha só, cortada na última palavra inteira", () => {
  assert.equal(clip("  curto   e\n  limpo  "), "curto e limpo")
  const longo = "palavra ".repeat(60).trim()
  const c = clip(longo, 40)
  assert.ok(c.endsWith("…"))
  assert.ok(c.length <= 41)
  assert.ok(!/palavr…$/.test(c), "não corta no meio da palavra")
  assert.equal(clip("a, b, c, d,", 100), "a, b, c, d,", "o que cabe fica como está")
  assert.equal(clip("x".repeat(300), 50), `${"x".repeat(50)}…`, "sem espaço para cortar: corta no limite")
})

test("sem contexto, o resumo é vazio (nada de “Não informado”)", () => {
  assert.deepEqual(summarizeContext(src()), [])
  assert.equal(contextCounts(src()), "")
  assert.equal(formFilled(src()), 0)
})

test("o resumo segue a ordem de leitura da equipe e só traz o que o CRM contou", () => {
  const lines = summarizeContext(src({
    guardianName: "Carla Nunes", filledBy: "responsavel", currentClub: "Real Brasília", pastClubs: "Escolinha do bairro (2021–2023)",
    trials: "Peneira em 2025", goal: "Entrar na base de um clube profissional", blocker: "Falta de visibilidade", commitmentScore: "9",
  }))
  assert.deepEqual(lines.map((l) => l.label), ["Quem respondeu", "Clube atual", "Já passou por", "Peneiras e avaliações", "Objetivo", "O que impede hoje", "Compromisso"])
  assert.equal(lines[0].text, "O responsável (Carla Nunes)")
  assert.equal(lines[lines.length - 1].text, "9 de 10")
})

test("quem respondeu: o responsável, o próprio atleta, ou só o nome do responsável", () => {
  assert.deepEqual(summarizeContext(src({ filledBy: "responsavel" }))[0], { label: "Quem respondeu", text: "O responsável" })
  assert.deepEqual(summarizeContext(src({ filledBy: "atleta" }))[0], { label: "Quem respondeu", text: "O próprio atleta" })
  assert.deepEqual(summarizeContext(src({ filledBy: "atleta", guardianName: "Marcos" }))[0], { label: "Quem respondeu", text: "O próprio atleta (responsável: Marcos)" })
  assert.deepEqual(summarizeContext(src({ guardianName: "  Marcos  " }))[0], { label: "Responsável", text: "Marcos" })
  assert.deepEqual(summarizeContext(src({ guardianName: "   " })), [], "nome em branco não conta")
})

test("nota de compromisso: número vira “de 10”; texto fica como o CRM mandou", () => {
  const score = (v: string) => summarizeContext(src({ commitmentScore: v }))[0].text
  assert.equal(score("9"), "9 de 10")
  assert.equal(score(" 8,5 "), "8,5 de 10")
  assert.equal(score("oito"), "oito")
  assert.equal(score("8/10"), "8/10")
})

test("atendimento: observações, qualificação e notas (quantas, de que tipo e a última)", () => {
  const lines = summarizeContext(src({
    crmObservations: "A família pode viajar nas férias.",
    qualification: { goal: "Base de Série A", decisionMaker: "O responsável", timeline: "Até o fim do ano", summary: "Quer saber valores antes de decidir." },
    notes: [note("whatsapp_summary", at(18)), note("whatsapp_summary", at(20)), note("call_transcript", at(19)), note("manual_note")],
  }))
  const by = Object.fromEntries(lines.map((l) => [l.label, l.text]))
  assert.equal(by["Observações do atendimento"], "A família pode viajar nas férias.")
  assert.equal(by["Qualificação do CRM"], "objetivo: Base de Série A · quem decide: O responsável · prazo: Até o fim do ano · Quer saber valores antes de decidir.")
  assert.equal(by["Atendimento"], "4 notas (2 resumos de WhatsApp, 1 transcrição de ligação, 1 nota do atendimento); a última em 20/10/2026")
  assert.deepEqual(summarizeContext(src({ notes: [note("manual_note")] }))[0], { label: "Atendimento", text: "1 nota (1 nota do atendimento)" })
})

test("textos longos são cortados no resumo (o texto inteiro fica no detalhe e no arquivo)", () => {
  const [l] = summarizeContext(src({ goal: "ser profissional ".repeat(40) }))
  assert.ok(l.text.length <= 241)
  assert.ok(l.text.endsWith("…"))
})

test("quantos campos de contexto do formulário foram preenchidos", () => {
  const s = src({ currentClub: "Real", goal: "Subir", blocker: "  ", answers: [{ question: "q", answer: "a" }], notes: [note("manual_note"), note("manual_note")] })
  assert.equal(formFilled(s), 2, "texto em branco não conta")
  assert.equal(FORM_TOTAL, 9)
  assert.equal(contextCounts(s), "1 resposta do formulário · 2 notas de atendimento · 2 de 9 campos de contexto preenchidos")
})
