import type { Player } from "@/pages/voxen/data"
import { looksReal } from "@/pages/admin/console/names"
import type { AthletesApi } from "./api"
import { addDays, draftFromPlayer, type Athlete, type AthleteDraft, type Temperature } from "./model"

/*
 * Setor Atletas com dados locais (só no `npm run dev`, em ?demo). Guarda tudo em memória
 * enquanto a aba estiver aberta. Começa com algumas fichas variadas a partir dos cadastros
 * de teste, para a tela já mostrar frios, mornos e quentes.
 */

let rows: Athlete[] | null = null
let seq = 0
const uid = () => `demo-at-${Date.now().toString(36)}-${(seq++).toString(36)}`

function fromDraft(d: AthleteDraft, extra: Partial<Athlete> = {}): Athlete {
  const now = new Date().toISOString()
  return {
    id: uid(), ...d, temperature: d.temperature ?? "morno", forwarded: false, forwardedTo: null, forwardedOn: null,
    advisory: false, advisorySince: null, nextStep: null, nextStepOn: null, notes: null, createdAt: now, updatedAt: now, ...extra,
  }
}

const SEED: { t: Temperature; extra: Partial<Athlete> }[] = [
  { t: "quente", extra: { advisory: true, advisorySince: addDays(-40), forwarded: true, forwardedTo: "Peneira do Gama · Sub 17", forwardedOn: addDays(-6), nextStep: "Levar a documentação para a peneira", nextStepOn: addDays(1), notes: "Pai muito presente. Já tem vídeo editado." } },
  { t: "quente", extra: { advisory: true, advisorySince: addDays(-12), nextStep: "Reunião com a família", nextStepOn: addDays(-2) } },
  { t: "morno", extra: { forwarded: true, forwardedTo: "Avaliação no Real Brasília", forwardedOn: addDays(-20), nextStep: "Cobrar retorno do clube", nextStepOn: addDays(3) } },
  { t: "morno", extra: { nextStep: "Enviar proposta de assessoria", nextStepOn: addDays(0) } },
  { t: "morno", extra: {} },
  { t: "frio", extra: { nextStep: "Tentar contato de novo", nextStepOn: addDays(10), notes: "Não respondeu as duas últimas mensagens." } },
  { t: "frio", extra: {} },
]

function seed(players: Player[]) {
  const real = players.filter(looksReal).slice(0, SEED.length)
  return real.map((p, i) => fromDraft({ ...draftFromPlayer(p), temperature: SEED[i].t }, { ...SEED[i].extra, createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString() }))
}

const wait = () => new Promise((r) => setTimeout(r, 120))

export function demoApi(players: Player[]): AthletesApi {
  rows ??= seed(players)
  return {
    async list() { await wait(); return [...(rows ?? [])] },
    async insert(d) {
      await wait()
      const clash = rows?.find((a) => (d.leadId && a.leadId === d.leadId) || (d.memberId && a.memberId === d.memberId) || (d.athleteId !== null && a.athleteId === d.athleteId) || (d.email && a.email === d.email))
      if (clash) throw new Error("Este atleta já está no setor (mesmo cadastro, membro ou e-mail).")
      const a = fromDraft(d)
      rows = [a, ...(rows ?? [])]
      return a
    },
    async update(id, patch) {
      await wait()
      const cur = rows?.find((a) => a.id === id)
      if (!cur) throw new Error("Ficha não encontrada.")
      const next = { ...cur, ...patch, updatedAt: new Date().toISOString() }
      rows = (rows ?? []).map((a) => (a.id === id ? next : a))
      return next
    },
    async remove(id) { await wait(); rows = (rows ?? []).filter((a) => a.id !== id) },
  }
}
