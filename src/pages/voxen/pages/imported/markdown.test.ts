import assert from "node:assert/strict"
import { test } from "node:test"
import type { ImportDetail } from "./api.ts"
import { contextFile, contextFileName, personMarkdown, slug, type ContextEntry } from "./markdown.ts"
import { rowKey, type ImportRow } from "./model.ts"

const at = (d: number, h = 12) => new Date(2026, 9, d, h, 0, 0).toISOString()
let seq = 0

function row(p: Partial<ImportRow> = {}): ImportRow {
  seq += 1
  const kind = p.kind ?? "pre"
  const ref = p.ref ?? `ref-${seq}`
  return {
    key: rowKey(kind, ref), kind, ref, name: `Atleta ${seq}`, guardianName: null, position: null, category: null, city: null, team: null, birthDate: null, age: null,
    answersCount: 2, notesCount: 0, hasContext: true, reviewCount: 0, revision: 1, firstAt: at(22), updatedAt: at(22), receipts: [at(22)], wasProspect: false,
    memberId: null, sectionId: null, approvedAt: null, approvedByName: null, approvedRevision: null, ...p,
  }
}

function detail(r: ImportRow, p: Partial<ImportDetail> = {}): ImportDetail {
  return {
    kind: r.kind, ref: r.ref, name: r.name, guardianName: r.guardianName, guardianFilledBy: null, filledBy: null, birthDate: r.birthDate, position: r.position,
    category: r.category, team: r.team, city: r.city, review: [], currentClub: null, pastClubs: null, trials: null, opportunitiesReceived: null, goal: null,
    blocker: null, evaluatedClubs: null, strengthsAndImprovements: null, commitmentScore: null, crmObservations: null, qualification: null, notes: [], answers: [],
    revision: r.revision, firstAt: r.firstAt, updatedAt: r.updatedAt, memberId: r.memberId, ...p,
  }
}

function entry(rp: Partial<ImportRow> = {}, dp: Partial<ImportDetail> = {}, sectionName: string | null = null): ContextEntry {
  const r = row(rp)
  return { row: r, detail: detail(r, dp), sectionName }
}

const RICH = {
  filledBy: "responsavel" as const, guardianName: "Carla Nunes", goal: "Entrar na base de um clube profissional", pastClubs: "Escolinha do bairro (2021–2023)",
  answers: [{ question: "Quem está preenchendo este formulário?", answer: "O responsável" }, { question: "Qual o objetivo?", answer: "Subir\npara o profissional" }],
  notes: [{ type: "manual_note" as const, content: "Pediu retorno\nna semana que vem.", createdAt: at(20), truncated: false }],
}

test("uma pessoa: título, linha de situação, dados básicos, resumo, notas e respostas", () => {
  const e = entry(
    { name: "Enzo Barbosa Nunes", position: "Meia-Atacante", category: "Sub 15", city: "Bahia", age: 14, revision: 2, receipts: [at(25), at(22)], firstAt: at(22), wasProspect: true },
    RICH, "Instagram",
  )
  const md = personMarkdown(e, 3)
  assert.match(md, /^## 3\. Enzo Barbosa Nunes\n/)
  assert.match(md, /Pré-cadastro · subseção Instagram · Para conferir · versão 2 do CRM/)
  assert.match(md, /Chegou em 22\/10\/2026 e de novo em 25\/10\/2026\. Veio antes como pré-cadastro\./)
  assert.match(md, /\*\*Dados básicos:\*\* Meia-Atacante · Sub 15 · 14 anos · Bahia/)
  assert.match(md, /### Resumo\n\n- \*\*Quem respondeu:\*\* O responsável \(Carla Nunes\)/)
  assert.match(md, /- \*\*Objetivo:\*\* Entrar na base de um clube profissional/)
  assert.match(md, /### Notas de atendimento \(1\)/)
  assert.match(md, /\*\*Nota do atendimento\*\* · 20\/10\/2026\n\n> Pediu retorno\n> na semana que vem\./)
  assert.match(md, /### Perguntas e respostas do formulário \(2\)/)
  assert.match(md, /\*\*Qual o objetivo\?\*\*\n\n> Subir\n> para o profissional/)
  assert.ok(!md.includes("Não informado"), "o arquivo não repete “Não informado”")
})

test("dados básicos que faltam são ditos, e o nome ausente é avisado", () => {
  const md = personMarkdown(entry({ name: null, guardianName: "Helena Duarte", position: "Lateral-Direito" }, { guardianName: "Helena Duarte", filledBy: "responsavel" }), null)
  assert.match(md, /^## Atleta sem nome\n/)
  assert.match(md, /\*\*Faltam:\*\* idade, categoria, cidade/)
  assert.match(md, /\*\*Atenção:\*\* o CRM não mandou o nome do atleta, só o do responsável \(Helena Duarte\)\./)
})

test("texto longo vai inteiro numa seção própria; o curto não se repete", () => {
  const longo = "Quero muito entrar numa base profissional e estou disposto a mudar de cidade. ".repeat(6).trim()
  const md = personMarkdown(entry({}, { goal: longo, blocker: "Falta de visibilidade" }), null)
  assert.match(md, /### Textos por inteiro\n\n\*\*Objetivo\*\*\n\n> Quero muito/)
  assert.equal(md.split("Falta de visibilidade").length - 1, 1, "o texto curto aparece só no resumo")
})

test("a qualificação do CRM e os textos que a VOXEN não entendeu têm seção própria", () => {
  const md = personMarkdown(entry({}, {
    qualification: { goal: "Base de Série A", decisionMaker: "O responsável", timeline: "Até o fim do ano", summary: "Quer saber valores." },
    review: [
      { field: "position", raw: "atacante ou meia", kind: "revisar", current: null, proposed: null },
      { field: "category", raw: "", kind: "divergente", current: "Sub 15", proposed: "Sub 17" },
    ],
  }), null)
  assert.match(md, /### Qualificação do CRM\n\n- \*\*Objetivo:\*\* Base de Série A\n- \*\*Quem decide:\*\* O responsável\n- \*\*Prazo:\*\* Até o fim do ano\n- \*\*Resumo:\*\* Quer saber valores\./)
  assert.match(md, /### Textos que a VOXEN não conseguiu interpretar\n\n- \*\*Posição:\*\* “atacante ou meia”\n- \*\*Categoria:\*\* na ficha “Sub 15”, no CRM “Sub 17”/)
})

test("o arquivo só leva quem tem contexto e diz quantos ficaram de fora", () => {
  const a = entry({ name: "Ana Souza" }, RICH, "Instagram")
  const b = entry({ name: "Bruno Lima", hasContext: false, answersCount: 0 })
  const c = entry({ name: "Caio Dias" }, RICH)
  const file = contextFile([a, b, c], { today: "2026-10-26", skipped: 1 })
  assert.equal(file.included, 2)
  assert.equal(file.skipped, 2, "um pedido de fora + um sem contexto")
  assert.match(file.text, /^# Contexto dos importados do CRM\n/)
  assert.match(file.text, /Gerado em 26\/10\/2026 pela VOXEN\. \*\*Uso interno da equipe:\*\*/)
  assert.match(file.text, /2 pessoas com contexto do CRM \(wsltda\.com\)\. 2 ficaram de fora por não terem nenhum contexto, só dados básicos\./)
  assert.match(file.text, /## Índice\n\n1\. Ana Souza — Pré-cadastro · Instagram · dados incompletos\n2\. Caio Dias — Pré-cadastro · sem subseção · dados incompletos/)
  assert.ok(!file.text.includes("Bruno Lima"), "quem não tem contexto não entra")
  assert.match(file.text, /## 1\. Ana Souza/)
  assert.match(file.text, /## 2\. Caio Dias/)
  assert.equal(file.text.split("\n---\n").length - 1, 2, "uma linha separando cada pessoa")
})

test("com uma pessoa só, o arquivo é dela (sem índice) e o nome do arquivo também", () => {
  const e = entry({ name: "Enzo Barbosa Nunes" }, RICH)
  const file = contextFile([e], { today: "2026-10-26" })
  assert.match(file.text, /^# Contexto de Enzo Barbosa Nunes\n/)
  assert.ok(!file.text.includes("## Índice"))
  assert.match(file.text, /Tudo o que o CRM \(wsltda\.com\) contou desta pessoa\./)
  assert.match(file.text, /\n## Enzo Barbosa Nunes\n/)
  assert.equal(contextFileName([e], "2026-10-26"), "contexto-enzo-barbosa-nunes-2026-10-26.md")
  assert.equal(contextFileName([e, entry({}, RICH)], "2026-10-26"), "contexto-importados-2026-10-26.md")
  assert.equal(contextFileName([e, entry({ hasContext: false })], "2026-10-26"), "contexto-enzo-barbosa-nunes-2026-10-26.md", "quem não tem contexto não conta para o nome")
})

test("sem ninguém com contexto, o arquivo diz isso sem quebrar", () => {
  const file = contextFile([entry({ hasContext: false })], { today: "2026-10-26" })
  assert.equal(file.included, 0)
  assert.equal(file.skipped, 1)
  assert.match(file.text, /0 pessoas com contexto/)
})

test("nome de arquivo seguro", () => {
  assert.equal(slug("João Pedro D'Ávila Jr."), "joao-pedro-d-avila-jr")
  assert.equal(slug("!!!"), "importado")
  assert.ok(slug("a".repeat(200)).length <= 48)
})
