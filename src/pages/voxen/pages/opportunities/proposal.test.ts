import assert from "node:assert/strict"
import { test } from "node:test"
import {
  EMPTY_PROPOSAL, NO_PROPOSAL, checkProposal, contractTotal, daysUntil, dayBR, draftFromProposal, durationLabel, facts, formatMoney, formatShort,
  headline, inDays, monthlyEquivalent, parseMoney, positionFit, proposalText, rankDeals, suggestFromPosition, suggestUrgency, summarizeDeals,
  type Proposal,
} from "./proposal.ts"

const NOW = new Date(2026, 9, 23, 15, 30) // 23/10/2026
const TODAY = "2026-10-23"

const deal = (over: Partial<Proposal> & { status?: string; deadline?: string | null; compatibility?: number } = {}) => ({
  ...NO_PROPOSAL, status: "aberta", deadline: null as string | null, compatibility: 80, ...over,
})

test("dinheiro: os jeitos de digitar viram o mesmo número", () => {
  assert.equal(parseMoney("8500"), 8500)
  assert.equal(parseMoney("8.500"), 8500)
  assert.equal(parseMoney("8.500,50"), 8500.5)
  assert.equal(parseMoney("R$ 8.500,00"), 8500)
  assert.equal(parseMoney("8,5"), 8.5)
  assert.equal(parseMoney("8.5"), 8.5)
  assert.equal(parseMoney("1.234.567"), 1234567)
  assert.equal(parseMoney("1,234.50"), 1234.5)
  assert.equal(parseMoney("€ 12 000"), 12000)
  assert.equal(parseMoney(",75"), 0.75)
  assert.equal(parseMoney(""), null)
  assert.equal(parseMoney("abc"), null)
})

test("dinheiro: formatação em português, com a moeda certa e centavos só quando existem", () => {
  assert.equal(formatMoney(8500, "BRL"), "R$ 8.500")
  assert.equal(formatMoney(8500.5, "BRL"), "R$ 8.500,50")
  assert.equal(formatMoney(12000, "EUR"), "€ 12.000")
  assert.equal(formatMoney(900, "GBP"), "£ 900")
  assert.equal(formatMoney(1200, "USD"), "US$ 1.200")
  assert.equal(formatShort(8500, "BRL"), "R$ 8.500")
  assert.equal(formatShort(120000, "BRL"), "R$ 120 mil")
  assert.equal(formatShort(1_250_000, "EUR"), "€ 1,3 mi")
})

test("valor por mês e total do contrato: só calcula o que dá para calcular", () => {
  const mes = { amount: 8000, period: "mes" as const, contractMonths: 24, signingBonus: 20000 }
  assert.equal(monthlyEquivalent(mes), 8000)
  assert.equal(contractTotal(mes), 8000 * 24 + 20000)
  const ano = { amount: 120000, period: "ano" as const, contractMonths: 18, signingBonus: null }
  assert.equal(monthlyEquivalent(ano), 10000)
  assert.equal(contractTotal(ano), 180000)
  const todo = { amount: 240000, period: "total" as const, contractMonths: 24, signingBonus: null }
  assert.equal(monthlyEquivalent(todo), 10000)
  assert.equal(contractTotal(todo), 240000)
  // Contrato todo sem duração: não inventa o valor por mês.
  assert.equal(monthlyEquivalent({ ...todo, contractMonths: null }), null)
  assert.equal(contractTotal({ ...todo, contractMonths: null }), 240000)
  // Por mês sem duração: não há total.
  assert.equal(contractTotal({ ...mes, contractMonths: null }), null)
  assert.equal(monthlyEquivalent({ amount: null, period: "mes", contractMonths: null }), null)
})

test("o destaque do cartão e as linhas pequenas", () => {
  assert.deepEqual(headline({ amount: 8500, currency: "BRL", period: "mes" }), { value: "R$ 8.500", unit: "/mês" })
  assert.deepEqual(headline({ amount: 90000, currency: "EUR", period: "ano" }), { value: "€ 90.000", unit: "/ano" })
  assert.deepEqual(headline({ amount: null, currency: "BRL", period: "mes" }), { value: null, unit: "" })
  assert.deepEqual(facts({ amount: 1, period: "mes", currency: "BRL", signingBonus: 20000, contractMonths: 18, startsOn: "2027-01-15" }),
    ["+ R$ 20.000 de luvas", "1 ano e 6 meses", "início 15/01/2027"])
  assert.deepEqual(facts(NO_PROPOSAL), [])
  assert.equal(durationLabel(12), "1 ano")
  assert.equal(durationLabel(24), "2 anos")
  assert.equal(durationLabel(6), "6 meses")
  assert.equal(durationLabel(1), "1 mês")
  assert.equal(durationLabel(null), "")
  assert.equal(dayBR("2026-11-03"), "03/11/2026")
})

test("prazo: dias que faltam e a urgência que ele sugere", () => {
  assert.equal(daysUntil("2026-10-23", NOW), 0)
  assert.equal(daysUntil("2026-10-24", NOW), 1)
  assert.equal(daysUntil("2026-10-22", NOW), -1)
  assert.equal(daysUntil("2026-11-23", NOW), 31)
  assert.equal(daysUntil(null, NOW), null)
  assert.equal(daysUntil("lixo", NOW), null)
  assert.equal(suggestUrgency("2026-10-23", NOW)?.urgency, "urgente")
  assert.equal(suggestUrgency("2026-10-26", NOW)?.urgency, "urgente")
  assert.equal(suggestUrgency("2026-10-27", NOW)?.urgency, "alta")
  assert.equal(suggestUrgency("2026-10-30", NOW)?.urgency, "alta")
  assert.equal(suggestUrgency("2026-10-31", NOW)?.urgency, "media")
  assert.equal(suggestUrgency("2026-11-13", NOW)?.urgency, "media")
  assert.equal(suggestUrgency("2026-11-14", NOW)?.urgency, "baixa")
  assert.equal(suggestUrgency("2026-10-20", NOW), null, "vencido não sugere nada")
  assert.equal(suggestUrgency(null, NOW), null)
  assert.equal(inDays(7, NOW), "2026-10-30")
  assert.equal(inDays(30, NOW), "2026-11-22")
  assert.equal(inDays(0, new Date(2026, 11, 31)), "2026-12-31")
  assert.equal(inDays(1, new Date(2026, 11, 31)), "2027-01-01")
})

test("posição: a que o clube procura contra a do jogador", () => {
  assert.equal(positionFit("Meia-Atacante", "Meia-Atacante"), 2)
  assert.equal(positionFit("Meia-Atacante", "Volante"), 1)
  assert.equal(positionFit("Ponta Direita", "Centroavante"), 1)
  assert.equal(positionFit("Goleiro", "Zagueiro"), 0)
  assert.equal(positionFit(null, "Zagueiro"), 0)
  assert.equal(positionFit("Zagueiro", null), 0)
  assert.equal(positionFit("Libero", "Libero"), 2)
  assert.equal(positionFit("Libero", "Zagueiro"), 0)
  assert.equal(suggestFromPosition("Zagueiro", "Zagueiro")?.value, 92)
  assert.equal(suggestFromPosition("Lateral Direito", "Zagueiro")?.value, 84)
  assert.equal(suggestFromPosition("Goleiro", "Centroavante")?.value, 72)
  assert.equal(suggestFromPosition(null, "Zagueiro"), null)
})

test("formulário: confere o que foi digitado, com mensagens em português", () => {
  const ok = checkProposal({ ...EMPTY_PROPOSAL, kind: "formacao", position: "Zagueiro", amount: "8.500", signingBonus: "20000", contractMonths: "24", startsOn: "2027-01-15", benefits: ["moradia", "estudos", "moradia" as never], urgency: "alta" }, "2026-11-05", TODAY)
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.warnings, [])
  assert.equal(ok.value.amount, 8500)
  assert.equal(ok.value.signingBonus, 20000)
  assert.equal(ok.value.contractMonths, 24)
  assert.equal(ok.value.kind, "formacao")
  assert.deepEqual(ok.value.benefits, ["moradia", "estudos"], "benefícios sem repetir e na ordem da lista")

  // Em branco é "a combinar", não erro.
  const blank = checkProposal(EMPTY_PROPOSAL, "", TODAY)
  assert.deepEqual(blank.errors, [])
  assert.equal(blank.value.amount, null)
  assert.equal(blank.value.kind, null)

  assert.match(checkProposal({ ...EMPTY_PROPOSAL, amount: "abc" }, "", TODAY).errors[0], /valor da proposta/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, amount: "0" }, "", TODAY).errors[0], /valor da proposta/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, amount: "99999999999" }, "", TODAY).errors[0], /alto demais/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, signingBonus: "-5" }, "", TODAY).errors[0], /luvas/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, contractMonths: "0" }, "", TODAY).errors[0], /1 a 120/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, contractMonths: "121" }, "", TODAY).errors[0], /1 a 120/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, contractMonths: "7,5" }, "", TODAY).errors[0], /1 a 120/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, startsOn: "1999-01-01" }, "", TODAY).errors[0], /data de início/)

  const warn = checkProposal({ ...EMPTY_PROPOSAL, amount: "240000", period: "total", startsOn: "2026-10-30" }, "2026-11-05", TODAY)
  assert.deepEqual(warn.errors, [])
  assert.equal(warn.warnings.length, 2)
  assert.match(warn.warnings[0], /valor por mês/)
  assert.match(warn.warnings[1], /antes do prazo/)
  assert.match(checkProposal(EMPTY_PROPOSAL, "2026-10-01", TODAY).warnings[0], /já passou/)
  assert.match(checkProposal({ ...EMPTY_PROPOSAL, signingBonus: "5000" }, "", TODAY).warnings[0], /a combinar/)
})

test("formulário: o que o banco guarda volta igual para o formulário", () => {
  const p: Proposal = { kind: "profissional", position: "Volante", category: "Sub 20", amount: 8500.5, currency: "EUR", period: "ano", signingBonus: 1000, contractMonths: 36, startsOn: "2027-02-01", benefits: ["saude", "passagens"], urgency: "urgente" }
  const back = checkProposal(draftFromProposal(p), "", TODAY)
  assert.deepEqual(back.errors, [])
  assert.deepEqual(back.value, p)
  assert.deepEqual(draftFromProposal(NO_PROPOSAL), EMPTY_PROPOSAL)
})

test("ordem: em andamento primeiro, depois a mais urgente, o prazo mais perto e o melhor encaixe", () => {
  const a = deal({ status: "encerrada", urgency: "urgente", deadline: "2026-10-24" })
  const b = deal({ status: "aberta", urgency: "baixa", deadline: "2026-10-25" })
  const c = deal({ status: "negociacao", urgency: "urgente", deadline: "2026-11-30" })
  const d = deal({ status: "enviada", urgency: "urgente", deadline: "2026-11-02" })
  const e = deal({ status: "aberta", urgency: "urgente", deadline: "2026-11-02", compatibility: 95 })
  const order = rankDeals([a, b, c, d, e])
  assert.deepEqual(order, [e, d, c, b, a])
  assert.deepEqual(rankDeals([deal({ deadline: null }), deal({ deadline: "2026-12-01" })]).map((x) => x.deadline), ["2026-12-01", null])
})

test("resumo: em andamento, urgentes, melhor proposta por moeda e próximo prazo", () => {
  const list = [
    deal({ status: "aberta", amount: 8000, currency: "BRL", period: "mes", urgency: "media", deadline: "2026-10-26" }),
    deal({ status: "negociacao", amount: 120000, currency: "BRL", period: "ano", urgency: "alta", deadline: "2026-11-30" }),
    deal({ status: "enviada", amount: 4000, currency: "EUR", period: "mes", urgency: "baixa", deadline: "2026-12-10" }),
    deal({ status: "recusada", amount: 99999, currency: "BRL", period: "mes", urgency: "urgente", deadline: "2026-10-24" }),
    deal({ status: "aceita", amount: 50000, currency: "USD", period: "mes" }),
    deal({ status: "aberta", amount: 240000, currency: "GBP", period: "total", contractMonths: null }),
  ]
  const s = summarizeDeals(list, NOW)
  assert.equal(s.live, 4)
  assert.equal(s.urgent, 2, "alta + prazo em 3 dias")
  assert.deepEqual(s.best, [{ currency: "BRL", monthly: 10000 }, { currency: "EUR", monthly: 4000 }])
  assert.deepEqual(s.nextDeadline, { deadline: "2026-10-26", days: 3 })
  const empty = summarizeDeals([], NOW)
  assert.deepEqual(empty, { live: 0, urgent: 0, best: [], nextDeadline: null })
  // Prazo vencido não é "o próximo prazo".
  assert.equal(summarizeDeals([deal({ deadline: "2026-10-01" })], NOW).nextDeadline, null)
})

test("texto para copiar: só o que existe, uma linha por assunto", () => {
  const full = proposalText({
    ...NO_PROPOSAL, kind: "formacao", position: "Meia-Atacante", category: "Sub 17", amount: 8500, signingBonus: 20000, contractMonths: 24, startsOn: "2027-01-15",
    benefits: ["moradia", "estudos"], deadline: "2026-11-05", club: { name: "Palmeiras", country: "Brasil", league: "Série A" },
  })
  assert.equal(full, [
    "Oportunidade: Palmeiras (Brasil · Série A)",
    "Vaga: Meia-Atacante · Sub 17 · Contrato de formação",
    "Proposta: R$ 8.500/mês · + R$ 20.000 de luvas · 2 anos · início 15/01/2027",
    "O clube oferece: Moradia, Estudos",
    "Responder até: 05/11/2026",
  ].join("\n"))
  assert.equal(proposalText({ ...NO_PROPOSAL, deadline: null, club: null }), "Oportunidade: Clube\nProposta: a combinar")
})
