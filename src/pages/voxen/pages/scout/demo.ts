/**
 * Camada do Scout em memória, só para o `npm run dev` (/voxen?demo). Carregado por import
 * dinâmico dentro de uma condição que o build de produção resolve como falsa (api.ts →
 * getScoutApi), então não vai para o site publicado. Os jogadores são os membros de teste
 * da área de membros (m-gabriel, m-arthur, m-davi).
 */
import type {
  Club, Conflict, Controls, MemberContext, Opportunity, ScoutApi, StaffSubmission,
} from "./api"
import { emptyControls } from "./api"

const now = () => new Date().toISOString()
const days = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const ago = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

let clubs: Club[] = [
  { id: "club-br2", name: "Palmeiras", country: "Brasil", league: "Série A", crestUrl: null, emblem: "🟢⚪", color: "#0b6b3a", catalogId: "br2", active: true },
  { id: "club-br10", name: "Athletico-PR", country: "Brasil", league: "Série A", crestUrl: null, emblem: "🔴⚫", color: "#c8102e", catalogId: "br10", active: true },
  { id: "club-own", name: "Real Brasília", country: "Brasil", league: "Candango", crestUrl: null, emblem: null, color: "#1d4ed8", catalogId: null, active: true },
]

const clubOf = (id: string) => clubs.find((c) => c.id === id) ?? null

let opportunities: Opportunity[] = [
  { id: "op-1", memberId: "m-gabriel", clubId: "club-br2", club: null, compatibility: 94, deadline: days(5), status: "aberta", published: true, publishedAt: ago(2), athleteNote: "A base procura um meia-atacante canhoto para a avaliação de novembro.", internalNote: "Contato: coordenador da base. Mandar vídeos do 2º tempo.", createdAt: ago(3), updatedAt: ago(2) },
  { id: "op-2", memberId: "m-gabriel", clubId: "club-br10", club: null, compatibility: 88, deadline: days(16), status: "enviada", published: true, publishedAt: ago(6), athleteNote: "Seu perfil já foi enviado ao coordenador da base.", internalNote: null, createdAt: ago(8), updatedAt: ago(6) },
  { id: "op-3", memberId: "m-arthur", clubId: "club-own", club: null, compatibility: 81, deadline: days(2), status: "aberta", published: false, publishedAt: null, athleteNote: null, internalNote: "Rascunho: confirmar a data da peneira.", createdAt: ago(1), updatedAt: ago(1) },
]

let controls: Controls[] = [
  { ...emptyControls("m-gabriel"), shortlistedAt: ago(10), kitClubId: "club-br2", updatedAt: ago(2) },
  { ...emptyControls("m-arthur"), shortlistedAt: ago(4), locks: { performance: "locked" }, updatedAt: ago(4) },
]

let submissions: StaffSubmission[] = [
  { id: "env-1", userId: "user-m-gabriel", memberId: "m-gabriel", videoId: "M7lc1UVf-VE", opponent: "Ceilândia Sub-17", playedOn: days(-6), note: "Entrei no 2º tempo, camisa 10.", status: "em_analise", reviewNote: null, matchId: null, createdAt: ago(5), updatedAt: ago(4) },
  { id: "env-2", userId: "user-m-davi", memberId: "m-davi", videoId: "aqz-KE-bpKQ", opponent: "Gama Sub-15", playedOn: days(-2), note: null, status: "enviado", reviewNote: null, matchId: null, createdAt: ago(1), updatedAt: ago(1) },
  { id: "env-3", userId: "user-m-arthur", memberId: "m-arthur", videoId: "jNQXAC9IVRw", opponent: null, playedOn: null, note: "Vídeo do treino.", status: "recusado", reviewNote: "É um treino, não um jogo. Mande uma partida inteira.", matchId: null, createdAt: ago(9), updatedAt: ago(8) },
]

let contexts: MemberContext[] = [
  {
    memberId: "m-gabriel", currentClub: "Real Brasília Sub-17", pastClubs: "Gama (2022–2023), escolinha do Brasiliense",
    trials: "Peneira do Goiás em 2024: passou para a segunda fase.", opportunitiesReceived: "Convite para teste no Capital FC (não foi por falta de transporte).",
    goal: "Jogar na base de um clube da Série A.", blocker: "Pouco vídeo dos jogos e falta de contato com os clubes.", filledBy: "responsavel",
    evaluatedClubs: "Goiás e Capital FC", strengthsAndImprovements: "Leitura de jogo e passe curto; precisa de mais força física.", commitmentScore: "8",
    guardianName: "Helena Rocha", guardianFilledBy: "Sou a mãe dele", crmObservations: "Família muito engajada; o pai acompanha todos os jogos.",
    qualification: { goal: "Entrar na base de um clube de Série A", decisionMaker: "A mãe, com o pai", timeline: "Até dezembro", summary: "Interessado e com urgência." },
    notes: [
      { type: "whatsapp_summary", content: "Perguntou como funciona a assessoria e pediu um resumo dos próximos passos.", createdAt: ago(9), truncated: false },
      { type: "call_transcript", content: "Ligação de 12 minutos: a mãe contou que o filho treina três vezes por semana e que a família pode viajar para peneiras.", createdAt: ago(6), truncated: false },
      { type: "manual_note", content: "Combinado enviar três vídeos do segundo tempo até sexta.", createdAt: ago(3), truncated: false },
    ],
    answers: [
      { question: "Qual a data de nascimento do atleta?", answer: "14/03/2007" },
      { question: "Qual a posição e a categoria atual?", answer: "Meia, sub 17" },
      { question: "Em qual clube joga hoje?", answer: "Real Brasília" },
    ],
    source: "crm", importedAt: ago(3), updatedAt: ago(3),
  },
]

let conflicts: Conflict[] = [
  { id: "cf-1", memberId: "m-gabriel", field: "team", kind: "divergente", currentValue: "Real Brasília Sub-20", proposedValue: "Real Brasília", rawValue: "Real Brasília", createdAt: ago(3) },
  { id: "cf-2", memberId: "m-davi", field: "position", kind: "revisar", currentValue: null, proposedValue: null, rawValue: "meia e volante", createdAt: ago(2) },
]

const withClub = (o: Opportunity): Opportunity => ({ ...o, club: clubOf(o.clubId) })

/** Imagem "enviada" no modo de teste: vira um endereço data: (nada sai do navegador). */
const asDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result))
  r.onerror = () => reject(new Error("Não foi possível ler a imagem."))
  r.readAsDataURL(blob)
})

export const demoScout: ScoutApi = {
  demo: true,

  async clubs() { return delay([...clubs].sort((a, b) => a.name.localeCompare(b.name))) },

  async saveClub(input) {
    const existing = input.id ? clubs.find((c) => c.id === input.id) : undefined
    const next: Club = { id: existing?.id ?? crypto.randomUUID(), catalogId: existing?.catalogId ?? null, active: true, ...input, name: input.name.trim() }
    clubs = existing ? clubs.map((c) => (c.id === next.id ? next : c)) : [...clubs, next]
    return delay(next)
  },

  async clubFromCatalog(c) {
    const found = clubs.find((x) => x.catalogId === c.id)
    if (found) return delay(found)
    const next: Club = { id: `club-${c.id}`, name: c.name, country: c.country, league: c.league, crestUrl: null, emblem: c.logo.slice(0, 16), color: null, catalogId: c.id, active: true }
    clubs = [...clubs, next]
    return delay(next)
  },

  async upload(_path, blob) { return asDataUrl(blob) },
  async removeMedia() { return delay(undefined) },

  async opportunities(memberId) {
    return delay(opportunities.filter((o) => !memberId || o.memberId === memberId).map(withClub).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  async saveOpportunity(input) {
    const existing = input.id ? opportunities.find((o) => o.id === input.id) : undefined
    if (input.status === "aberta" && opportunities.some((o) => o.id !== input.id && o.memberId === input.memberId && o.clubId === input.clubId && o.status === "aberta")) {
      throw new Error("Este jogador já tem uma oportunidade aberta neste clube.")
    }
    const next: Opportunity = {
      ...input,
      id: existing?.id ?? crypto.randomUUID(),
      club: null,
      publishedAt: input.published ? existing?.publishedAt ?? now() : null,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    }
    opportunities = existing ? opportunities.map((o) => (o.id === next.id ? next : o)) : [next, ...opportunities]
    return delay(withClub(next))
  },

  async deleteOpportunity(id) {
    opportunities = opportunities.filter((o) => o.id !== id)
    return delay(undefined)
  },

  async controls() { return delay([...controls]) },

  async controlsFor(memberId) { return delay(controls.find((c) => c.memberId === memberId) ?? emptyControls(memberId)) },

  async saveControls(memberId, patch) {
    const base = controls.find((c) => c.memberId === memberId) ?? emptyControls(memberId)
    // Como o gatilho do banco: trocar entre perfil e corpo inteiro conta como escolha da equipe.
    const chose = patch.bodyPhotoOn !== undefined && patch.bodyPhotoOn !== base.bodyPhotoOn
    const next: Controls = {
      ...base, ...patch, memberId, updatedAt: now(),
      ...(chose ? { photoChoiceBy: "equipe" as const, photoChoiceAt: now() } : {}),
    }
    controls = controls.some((c) => c.memberId === memberId) ? controls.map((c) => (c.memberId === memberId ? next : c)) : [...controls, next]
    return delay(next)
  },

  async submissions() { return delay([...submissions]) },

  async submission(id) { return delay(submissions.find((s) => s.id === id) ?? null) },

  async updateSubmission(id, patch) {
    const s = submissions.find((x) => x.id === id)
    if (!s) throw new Error("Envio não encontrado.")
    const next: StaffSubmission = { ...s, ...patch, updatedAt: now() }
    submissions = submissions.map((x) => (x.id === id ? next : x))
    return delay(next)
  },

  async markAnalyzed(matchId) {
    submissions = submissions.map((s) => (s.matchId === matchId && s.status !== "recusado" ? { ...s, status: "analisado", updatedAt: now() } : s))
    return delay(undefined)
  },

  async context(memberId) { return delay(contexts.find((c) => c.memberId === memberId) ?? null) },

  async saveContext(memberId, patch) {
    const base: MemberContext = contexts.find((c) => c.memberId === memberId) ?? {
      memberId, currentClub: null, pastClubs: null, trials: null, opportunitiesReceived: null, goal: null, blocker: null,
      filledBy: null, evaluatedClubs: null, strengthsAndImprovements: null, commitmentScore: null, guardianName: null, guardianFilledBy: null,
      crmObservations: null, qualification: null, notes: [], answers: [], source: "equipe", importedAt: null, updatedAt: null,
    }
    const next: MemberContext = { ...base, ...patch, source: "equipe", updatedAt: now() }
    contexts = contexts.some((c) => c.memberId === memberId) ? contexts.map((c) => (c.memberId === memberId ? next : c)) : [...contexts, next]
    return delay(next)
  },

  async conflicts(memberId) { return delay(conflicts.filter((c) => !memberId || c.memberId === memberId)) },

  async resolveConflict(id) {
    conflicts = conflicts.filter((c) => c.id !== id)
    return delay(undefined)
  },

  async crmHealth() {
    return delay({ preCadastros: 14, recebidos: 3, aplicados: 2, esperando: 1, quarentena: 0, conflitos: conflicts.length, comContexto: contexts.length, ultimo: ago(3) })
  },
}
