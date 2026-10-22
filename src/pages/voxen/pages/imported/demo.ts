/**
 * Importados em memória, só para o `npm run dev` (/voxen?demo e /admin?demo). Carregado por import
 * dinâmico dentro de uma condição que o build de produção resolve como falsa (api.ts →
 * getImportedApi), então não vai para o site publicado. Os nomes são inventados.
 */
import type { ImportDetail, ImportedApi, ReviewItem } from "./api"
import { needsReview, rowKey, type ImportItem, type ImportKind, type ImportRow, type ImportSection } from "./model"

const HOUR = 3600000
const BASE = Date.now()
const ago = (days: number, hours = 0, minutes = 0) => new Date(BASE - days * 24 * HOUR - hours * HOUR - minutes * 60000).toISOString()
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

let sections: ImportSection[] = [
  { id: "sec-insta", name: "Instagram", note: "Quem chegou pelos stories e pelo direct.", color: "#a78bfa", createdAt: ago(5) },
  { id: "sec-peneira", name: "Peneira Brasília", note: null, color: "#34d399", createdAt: ago(4) },
]

type Seed = [
  kind: ImportKind, name: string | null, guardian: string | null, position: string | null, category: string | null, city: string | null,
  answers: number, notes: number, review: number, daysAgo: number, section: string | null, approval: 0 | 1 | 2,
]

const SEEDS: Seed[] = [
  ["pre", "Enzo Barbosa Nunes", "Carla Nunes", "Meia-Atacante", "Sub 15", "Bahia", 11, 2, 0, 0, "sec-insta", 1],
  ["pre", "Pedro Henrique Silva", null, null, "Sub 17", null, 9, 1, 2, 0, null, 0],
  ["pre", "Lucas Almeida Rocha", "Marcos Rocha", "Zagueiro", "Sub 17", "Goiânia", 11, 0, 0, 0, null, 0],
  ["pre", "Gabriel Moura Teixeira", null, "Volante", "Sub 20", "Recife", 10, 0, 0, 0, "sec-insta", 0],
  ["pre", null, "Helena Duarte", "Lateral-Direito", null, "Fortaleza", 11, 1, 1, 0, null, 0],
  ["pre", "Thiago Ferreira Lima", "Sandra Lima", "Goleiro", "Sub 15", "Curitiba", 11, 0, 0, 0, "sec-peneira", 1],
  ["pre", "Davi Lucca Martins", null, "Atacante", "Sub 17", "Salvador", 11, 3, 0, 0, null, 0],
  ["pre", "Rafael Costa Pinto", "Julio Pinto", "Meia", "Sub 13", "Manaus", 8, 0, 0, 1, null, 0],
  ["pre", "Matheus Oliveira Brito", null, "Ponta-Esquerda", "Sub 17", "Belém", 11, 0, 0, 1, "sec-peneira", 0],
  ["pre", "Arthur Vieira Campos", "Eliane Campos", "Zagueiro", "Sub 15", "Natal", 11, 2, 0, 1, null, 2],
  ["pre", "João Pedro Azevedo", null, "Meia-Atacante", "Sub 17", "Vitória", 11, 0, 0, 3, "sec-peneira", 1],
  ["pre", "Caio Mendes Barros", "Paulo Barros", "Atacante", "Sub 20", "Maceió", 10, 0, 1, 3, null, 0],
  ["pre", "Vinícius Prado Souza", null, "Volante", "Sub 15", "Aracaju", 11, 0, 0, 3, null, 0],
  ["pre", "Bruno Carvalho Dias", null, null, null, null, 0, 0, 0, 3, null, 0],
  ["conta", "Gabriel Rocha Lima", null, "Meia", "Sub 17", "Brasília", 11, 3, 0, 5, "sec-insta", 1],
  ["conta", "Henrique Lopes Faria", "Rosa Faria", "Zagueiro", "Sub 15", "Taguatinga", 11, 1, 0, 5, null, 0],
  ["conta", "Lorenzo Cardoso Neves", null, "Atacante", "Sub 17", "Gama", 11, 0, 2, 5, null, 0],
  ["conta", "Samuel Pires Andrade", null, "Goleiro", "Sub 20", "Ceilândia", 10, 0, 0, 5, "sec-peneira", 1],
  ["conta", "Nicolas Barreto Luz", "Patrícia Luz", "Lateral-Esquerdo", "Sub 15", "Sobradinho", 11, 2, 0, 5, null, 0],
  ["conta", "Felipe Araújo Melo", null, "Meia", "Sub 17", "Planaltina", 0, 0, 0, 5, null, 0],
  ["conta", "Otávio Ramos Tavares", null, "Volante", "Sub 17", "Brasília", 11, 0, 1, 6, null, 0],
  ["conta", "Leonardo Gomes Veiga", "Cláudia Veiga", "Ponta-Direita", "Sub 15", "Águas Claras", 11, 1, 0, 6, "sec-insta", 0],
  ["espera", "Kauê Nascimento Braga", null, null, "Sub 17", "São Paulo", 11, 0, 0, 2, null, 0],
  ["espera", "Ryan Medeiros Cunha", null, "Atacante", null, null, 11, 0, 1, 2, null, 0],
]

const QUESTIONS = [
  "Quem está preenchendo este formulário?",
  "Atualmente, o atleta está vinculado a algum clube?",
  "O atleta já participou de avaliações ou peneiras em clubes?",
  "O atleta já recebeu alguma oportunidade relevante de um clube?",
  "Qual é o principal objetivo do atleta no futebol hoje?",
  "O que mais está impedindo o atleta de chegar onde deseja hoje?",
  "Qual é a posição e a categoria atual do atleta?",
  "Quais são os principais clubes que o atleta já representou?",
  "Quais clubes avaliou e qual foi o resultado?",
  "Quais são as 3 principais características do atleta como jogador?",
  "De 0 a 10, quanto o atleta está comprometido em buscar seu objetivo?",
]

const ANSWERS = [
  "O responsável", "Sim, joga numa escolinha da cidade", "Fez uma peneira em 2025 e não passou da primeira fase", "Ainda não",
  "Entrar na base de um clube profissional", "Falta de visibilidade e de vídeo dos jogos", "Meia, sub 15",
  "Escolinha do bairro (2021–2023)", "Dois clubes avaliaram, sem retorno ainda", "Visão de jogo, passe curto e disciplina", "9",
]

let rows: ImportRow[] = SEEDS.map(([kind, name, guardian, position, category, city, answers, notes, review, daysAgo, section, approval], i) => {
  const ref = kind === "conta" && i === 14 ? "m-gabriel" : `${kind}-demo-${String(i + 1).padStart(4, "0")}`
  const revision = approval === 2 ? 3 : 1 + (i % 3 === 0 ? 1 : 0)
  // Um minuto de diferença por posição: a ordem da lista não depende do relógio.
  const when = ago(daysAgo, i % 5, i)
  return {
    key: rowKey(kind, ref), kind, ref, name, guardianName: guardian, position, category, city,
    answersCount: answers, notesCount: notes, hasContext: answers + notes > 0 || Boolean(guardian), reviewCount: review, revision,
    firstAt: when, updatedAt: when, memberId: kind === "conta" ? ref : null, sectionId: section,
    approvedAt: approval ? ago(Math.max(0, daysAgo - 1)) : null, approvedByName: approval ? "Ana (equipe)" : null,
    approvedRevision: approval === 2 ? 2 : approval === 1 ? revision : null,
  }
})

const reviewFor = (row: ImportRow): ReviewItem[] => {
  const out: ReviewItem[] = []
  if (row.reviewCount > 0) out.push({ field: "position", raw: "atacante", kind: "revisar", current: null, proposed: null })
  if (row.reviewCount > 1) out.push({ field: "birth_date", raw: "1982-04-10", kind: "revisar", current: null, proposed: null })
  return out
}

function detailOf(row: ImportRow): ImportDetail {
  const rich = row.answersCount > 0 || row.notesCount > 0
  return {
    kind: row.kind, ref: row.ref, name: row.name, guardianName: row.guardianName, guardianFilledBy: row.guardianName ? "Sou o responsável pelo atleta" : null,
    filledBy: row.guardianName ? "responsavel" : rich ? "atleta" : null, birthDate: rich ? "2010-06-21" : null, position: row.position, category: row.category,
    team: rich ? "Escolinha do bairro" : null, city: row.city, review: reviewFor(row), currentClub: row.kind === "conta" && rich ? "Real Brasília Sub-17" : null,
    pastClubs: rich ? "Escolinha do bairro (2021–2023)" : null, trials: rich ? "Peneira em 2025: não passou da primeira fase." : null, opportunitiesReceived: null,
    goal: rich ? "Entrar na base de um clube profissional." : null, blocker: rich ? "Falta de visibilidade fora da cidade." : null,
    evaluatedClubs: rich ? "Dois clubes avaliaram" : null, strengthsAndImprovements: rich ? "Visão de jogo; precisa melhorar a finalização." : null,
    commitmentScore: rich ? "9" : null, crmObservations: row.guardianName ? "A família pode viajar nas férias." : null,
    qualification: row.guardianName ? { goal: "Base de Série A", decisionMaker: "O responsável", timeline: "Até o fim do ano", summary: "Interessado, quer saber valores antes de decidir." } : null,
    notes: Array.from({ length: row.notesCount }, (_, i) => ({
      type: (["whatsapp_summary", "manual_note", "call_transcript"] as const)[i % 3],
      content: ["Perguntou como funcionam os testes e pediu um exemplo de atleta que passou.", "Pediu retorno na semana que vem.", "Ligação curta: pediu para falar com o pai depois das 18h."][i % 3],
      createdAt: ago(2 + i), truncated: false,
    })),
    answers: Array.from({ length: row.answersCount }, (_, i) => ({ question: QUESTIONS[i % QUESTIONS.length], answer: ANSWERS[i % ANSWERS.length] })),
    revision: row.revision, firstAt: row.firstAt, updatedAt: row.updatedAt, memberId: row.memberId,
  }
}

const find = (items: ImportItem[]) => {
  const want = new Set(items.map((i) => rowKey(i.kind, i.ref)))
  return rows.filter((r) => want.has(r.key))
}

export const demoImported: ImportedApi = {
  demo: true,

  async list() { return delay(rows.map((r) => ({ ...r }))) },

  async detail(kind, ref) {
    const row = rows.find((r) => r.kind === kind && r.ref === ref)
    return delay(row ? detailOf(row) : null)
  },

  async sections() { return delay([...sections].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))) },

  async saveSection(input) {
    const name = input.name.trim()
    if (name.length < 2 || name.length > 60) throw new Error("Use um nome de 2 a 60 letras, uma cor válida e uma nota de até 300 letras.")
    if (sections.some((s) => s.id !== input.id && s.name.trim().toLowerCase() === name.toLowerCase())) throw new Error("Já existe uma subseção com este nome.")
    const existing = input.id ? sections.find((s) => s.id === input.id) : undefined
    const next: ImportSection = { id: existing?.id ?? crypto.randomUUID(), name, note: input.note?.trim() || null, color: input.color, createdAt: existing?.createdAt ?? new Date().toISOString() }
    sections = existing ? sections.map((s) => (s.id === next.id ? next : s)) : [...sections, next]
    return delay(next)
  },

  async deleteSection(id) {
    sections = sections.filter((s) => s.id !== id)
    rows = rows.map((r) => (r.sectionId === id ? { ...r, sectionId: null } : r))
    return delay(undefined)
  },

  async setSection(items, sectionId) {
    if (sectionId && !sections.some((s) => s.id === sectionId)) throw new Error("Subseção não encontrada.")
    const hit = find(items).filter((r) => r.sectionId !== sectionId)
    const keys = new Set(hit.map((r) => r.key))
    rows = rows.map((r) => (keys.has(r.key) ? { ...r, sectionId } : r))
    return delay(hit.length)
  },

  async approve(items, approve) {
    const picked = find(items)
    const hit = approve ? picked.filter(needsReview) : picked.filter((r) => r.approvedAt !== null)
    const keys = new Set(hit.map((r) => r.key))
    rows = rows.map((r) => {
      if (!keys.has(r.key)) return r
      return approve
        ? { ...r, approvedAt: new Date().toISOString(), approvedByName: "Você (demonstração)", approvedRevision: r.revision }
        : { ...r, approvedAt: null, approvedByName: null, approvedRevision: null }
    })
    return delay(hit.length)
  },

  async pending() { return delay(rows.filter(needsReview).length) },

  async discardProspect(ref) {
    rows = rows.filter((r) => !(r.kind === "pre" && r.ref === ref))
    return delay(undefined)
  },
}
