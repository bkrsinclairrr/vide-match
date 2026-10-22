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
/** Meio-dia (horário local) de N dias atrás, mais alguns minutos: a leva fica no mesmo dia mesmo perto da meia-noite. */
const noon = (days: number, minutes = 0) => {
  const d = new Date()
  d.setHours(12, minutes, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

let sections: ImportSection[] = [
  { id: "sec-insta", name: "Instagram", note: "Quem chegou pelos stories e pelo direct.", color: "#a78bfa", createdAt: ago(5) },
  { id: "sec-peneira", name: "Peneira Brasília", note: null, color: "#34d399", createdAt: ago(4) },
]

type Seed = {
  kind: ImportKind
  name: string | null
  guardian?: string
  position?: string
  category?: string
  city?: string
  age?: number
  team?: string
  answers?: number
  notes?: number
  review?: number
  /** Há quantos dias o CRM mandou pela primeira vez. */
  first: number
  /** Há quantos dias o CRM mandou de novo (reenvios). */
  again?: number[]
  section?: string
  /** 1 = aprovado na versão atual · 2 = aprovado numa versão anterior (mudou depois). */
  approval?: 1 | 2
  /** Veio antes como pré-cadastro. */
  was?: boolean
}

const SEEDS: Seed[] = [
  // Pré-cadastros que chegaram hoje (a leva mais nova): uns com todos os dados, uns incompletos, dois reenviados.
  { kind: "pre", name: "Enzo Barbosa Nunes", guardian: "Carla Nunes", position: "Meia-Atacante", category: "Sub 15", city: "Bahia", age: 14, team: "Escolinha do bairro", answers: 11, notes: 2, first: 0, section: "sec-insta", approval: 1 },
  { kind: "pre", name: "Pedro Henrique Silva", category: "Sub 17", age: 16, answers: 9, notes: 1, review: 2, first: 0 },
  { kind: "pre", name: "Lucas Almeida Rocha", guardian: "Marcos Rocha", position: "Zagueiro", category: "Sub 17", city: "Goiânia", age: 16, answers: 11, first: 0 },
  { kind: "pre", name: "Gabriel Moura Teixeira", position: "Volante", category: "Sub 20", city: "Recife", age: 19, answers: 10, first: 0, section: "sec-insta" },
  { kind: "pre", name: null, guardian: "Helena Duarte", position: "Lateral-Direito", city: "Fortaleza", answers: 11, notes: 1, review: 1, first: 0 },
  { kind: "pre", name: "Thiago Ferreira Lima", guardian: "Sandra Lima", position: "Goleiro", category: "Sub 15", city: "Curitiba", age: 14, answers: 11, first: 5, again: [0], section: "sec-peneira", approval: 2 },
  { kind: "pre", name: "Davi Lucca Martins", position: "Atacante", category: "Sub 17", city: "Salvador", age: 16, answers: 11, notes: 3, first: 3, again: [0] },
  { kind: "pre", name: "Camilo Karam Escobar", position: "Atacante", category: "Sub 17", city: "Brasília", age: 16, answers: 7, first: 0 },
  // Chegaram em outros dias.
  { kind: "pre", name: "Rafael Costa Pinto", guardian: "Julio Pinto", position: "Meia", category: "Sub 13", city: "Manaus", age: 12, answers: 8, first: 1 },
  { kind: "pre", name: "Matheus Oliveira Brito", position: "Ponta-Esquerda", category: "Sub 17", city: "Belém", age: 16, answers: 11, first: 1, section: "sec-peneira" },
  { kind: "pre", name: "Arthur Vieira Campos", guardian: "Eliane Campos", position: "Zagueiro", category: "Sub 15", city: "Natal", age: 14, answers: 11, notes: 2, first: 6, again: [1], approval: 2 },
  { kind: "pre", name: "João Pedro Azevedo", position: "Meia-Atacante", category: "Sub 17", city: "Vitória", age: 16, answers: 11, first: 3, section: "sec-peneira", approval: 1 },
  { kind: "pre", name: "Caio Mendes Barros", guardian: "Paulo Barros", position: "Atacante", category: "Sub 20", city: "Maceió", age: 19, answers: 10, review: 1, first: 3 },
  { kind: "pre", name: "Vinícius Prado Souza", position: "Volante", category: "Sub 15", city: "Aracaju", answers: 11, first: 3 },
  { kind: "pre", name: "Bruno Carvalho Dias", first: 3 },
  // Dados básicos completos, mas o CRM não trouxe nenhum contexto.
  { kind: "pre", name: "Mateus Rodrigues Leal", position: "Zagueiro", category: "Sub 15", city: "Santos", age: 14, first: 2 },
  // Atletas com conta.
  { kind: "conta", name: "Gabriel Rocha Lima", position: "Meia", category: "Sub 17", city: "Brasília", age: 16, team: "Real Brasília Sub-17", answers: 11, notes: 3, first: 5, section: "sec-insta", approval: 1 },
  { kind: "conta", name: "Henrique Lopes Faria", guardian: "Rosa Faria", position: "Zagueiro", category: "Sub 15", city: "Taguatinga", age: 14, answers: 11, notes: 1, first: 5, was: true },
  { kind: "conta", name: "Lorenzo Cardoso Neves", position: "Atacante", category: "Sub 17", city: "Gama", age: 16, answers: 11, review: 2, first: 5 },
  { kind: "conta", name: "Samuel Pires Andrade", position: "Goleiro", category: "Sub 20", city: "Ceilândia", age: 19, answers: 10, first: 5, section: "sec-peneira", approval: 1 },
  { kind: "conta", name: "Nicolas Barreto Luz", guardian: "Patrícia Luz", position: "Lateral-Esquerdo", category: "Sub 15", city: "Sobradinho", answers: 11, notes: 2, first: 5 },
  { kind: "conta", name: "Felipe Araújo Melo", position: "Meia", category: "Sub 17", city: "Planaltina", age: 16, first: 5 },
  { kind: "conta", name: "Otávio Ramos Tavares", position: "Volante", category: "Sub 17", answers: 11, review: 1, first: 6 },
  { kind: "conta", name: "Leonardo Gomes Veiga", guardian: "Cláudia Veiga", position: "Ponta-Direita", category: "Sub 15", city: "Águas Claras", age: 14, answers: 11, notes: 1, first: 6, section: "sec-insta" },
  // Aguardando virar membro.
  { kind: "espera", name: "Kauê Nascimento Braga", category: "Sub 17", city: "São Paulo", age: 16, answers: 11, first: 2, section: "sec-insta", was: true },
  { kind: "espera", name: "Ryan Medeiros Cunha", position: "Atacante", answers: 11, review: 1, first: 2 },
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

const birthOf = (age: number) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age, 5, 21)
  return d.toISOString().slice(0, 10)
}

let rows: ImportRow[] = SEEDS.map((s, i) => {
  const ref = s.kind === "conta" && s.name === "Gabriel Rocha Lima" ? "m-gabriel" : `${s.kind}-demo-${String(i + 1).padStart(4, "0")}`
  // Um minuto de diferença por posição: a ordem da lista não depende do relógio.
  const days = [s.first, ...(s.again ?? [])]
  const receipts = days.map((d, k) => noon(d, i + k)).sort().reverse()
  const revision = s.approval === 2 ? Math.max(3, days.length) : days.length
  const answers = s.answers ?? 0
  const notes = s.notes ?? 0
  return {
    key: rowKey(s.kind, ref), kind: s.kind, ref, name: s.name, guardianName: s.guardian ?? null,
    position: s.position ?? null, category: s.category ?? null, city: s.city ?? null, team: s.team ?? null,
    birthDate: s.age ? birthOf(s.age) : null, age: s.age ?? null,
    answersCount: answers, notesCount: notes, hasContext: answers + notes > 0 || Boolean(s.guardian), reviewCount: s.review ?? 0, revision,
    firstAt: receipts[receipts.length - 1], updatedAt: receipts[0], receipts, wasProspect: s.was === true,
    memberId: s.kind === "conta" ? ref : null, sectionId: s.section ?? null,
    approvedAt: s.approval ? ago(Math.max(0, Math.min(...days) - 1)) : null, approvedByName: s.approval ? "Ana (equipe)" : null,
    approvedRevision: s.approval === 2 ? revision - 1 : s.approval === 1 ? revision : null,
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
    filledBy: row.guardianName ? "responsavel" : rich ? "atleta" : null, birthDate: row.birthDate, position: row.position, category: row.category,
    team: row.team ?? (rich ? "Escolinha do bairro" : null), city: row.city, review: reviewFor(row), currentClub: row.kind === "conta" && rich ? "Real Brasília Sub-17" : null,
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

  async list() { return delay(rows.map((r) => ({ ...r, receipts: [...r.receipts] }))) },

  async detail(kind, ref) {
    const row = rows.find((r) => r.kind === kind && r.ref === ref)
    return delay(row ? detailOf(row) : null)
  },

  async details(items, onProgress) {
    const hit = find(items)
    onProgress?.(0, items.length)
    await delay(null)
    onProgress?.(items.length, items.length)
    return hit.map(detailOf)
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
