/**
 * Dados de teste da área de membros, só para o `npm run dev` (/voxen?demo).
 * Este módulo é carregado por import dinâmico dentro de uma condição que o
 * build de produção resolve como falsa (api.ts → getSource), então nunca vai
 * para o site publicado.
 *
 * Vídeo de teste: "Match de football France-Allemagne — 16 octobre 2018 —
 * Phase de jeu (1)", por Like tears in rain, CC BY-SA 4.0 (Wikimedia Commons).
 */
import type { DataSource, EventInput, MatchInput, MemberInput, ProfileListItem } from "./api"
import type { AthleteAccount } from "./account"
import { NO_CAREER, type Career } from "./game"
import { ACTION_KEYS, parseVideo, type ActionKey, type Bundle, type Match, type MatchEvent, type Member } from "./model"
import { LOCK_KEYS, type ClubRef, type ScoutLayer, type Submission, type SubmitInput } from "./scoutLayer"

const TEST_VIDEO =
  "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/ba/Match_de_football_France-Allemagne_-_16_octobre_2018_-_Phase_de_jeu_%281%29.ogv/Match_de_football_France-Allemagne_-_16_octobre_2018_-_Phase_de_jeu_%281%29.ogv.480p.vp9.webm"
const TEST_VIDEO_SECONDS = 17

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261010)
const gauss = (mean: number, sd: number) => {
  const u = Math.max(1e-9, rand())
  const v = rand()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const clamp = (v: number) => Math.max(2, Math.min(98, v))
const poisson = (lambda: number) => {
  const l = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rand()
  } while (p > l)
  return k - 1
}

type Role = { zone: [number, number, number, number]; rates: Partial<Record<ActionKey, number>>; ok: Partial<Record<ActionKey, number>> }

const ROLES: Record<string, Role> = {
  "Meia-Atacante": {
    zone: [66, 56, 14, 20],
    rates: { passe: 34, passe_chave: 1.6, assistencia: 0.35, finalizacao: 1.9, gol: 0.35, drible: 3.8, cruzamento: 1.2, conducao: 4.5, falta_sofrida: 1.6, desarme: 1.4, interceptacao: 0.9, recuperacao: 3.2, duelo_chao: 5.5, duelo_aereo: 1.3, bloqueio: 0.2, perda: 5.5, falta_cometida: 0.9, cartao_amarelo: 0.12 },
    ok: { passe: 0.83, finalizacao: 0.48, drible: 0.56, cruzamento: 0.34, conducao: 0.78, desarme: 0.62, duelo_chao: 0.52, duelo_aereo: 0.42 },
  },
  "Ponta Esquerda": {
    zone: [70, 18, 15, 11],
    rates: { passe: 24, passe_chave: 1.3, assistencia: 0.3, finalizacao: 2.1, gol: 0.32, drible: 6, cruzamento: 3, conducao: 5.5, falta_sofrida: 2, desarme: 1, interceptacao: 0.5, recuperacao: 2.4, duelo_chao: 6.5, duelo_aereo: 0.8, perda: 6.5, falta_cometida: 0.7, cartao_amarelo: 0.1 },
    ok: { passe: 0.79, finalizacao: 0.44, drible: 0.52, cruzamento: 0.3, conducao: 0.74, desarme: 0.55, duelo_chao: 0.48, duelo_aereo: 0.35 },
  },
  "Zagueiro": {
    zone: [24, 54, 9, 17],
    rates: { passe: 42, passe_chave: 0.25, assistencia: 0.04, finalizacao: 0.35, gol: 0.08, drible: 0.4, cruzamento: 0.1, conducao: 2.2, falta_sofrida: 0.5, desarme: 2.6, interceptacao: 2.6, recuperacao: 5.5, duelo_chao: 5, duelo_aereo: 4.5, bloqueio: 1.1, perda: 2.4, falta_cometida: 1.1, cartao_amarelo: 0.18 },
    ok: { passe: 0.88, finalizacao: 0.4, drible: 0.5, conducao: 0.82, desarme: 0.7, duelo_chao: 0.62, duelo_aereo: 0.64 },
  },
}

const DEFENSIVE: ActionKey[] = ["desarme", "interceptacao", "recuperacao", "bloqueio", "duelo_chao", "duelo_aereo", "falta_cometida"]

function placeEvent(action: ActionKey, role: Role, isZag: boolean): { x: number; y: number } {
  const [mx, my, sx, sy] = role.zone
  switch (action) {
    case "finalizacao":
    case "gol":
      return { x: clamp(gauss(isZag ? 90 : 87, 5)), y: clamp(gauss(50, 12)) }
    case "cruzamento":
      return { x: clamp(gauss(85, 6)), y: clamp(my < 50 ? gauss(9, 5) : gauss(91, 5)) }
    case "passe_chave":
    case "assistencia":
      return { x: clamp(gauss(Math.min(mx + 10, 84), 8)), y: clamp(gauss(my, sy)) }
    case "duelo_aereo":
      return isZag ? { x: clamp(gauss(20, 7)), y: clamp(gauss(50, 15)) } : { x: clamp(gauss(mx - 6, sx)), y: clamp(gauss(my, sy)) }
    default:
      if (DEFENSIVE.includes(action)) return { x: clamp(gauss(mx - (isZag ? 2 : 14), sx)), y: clamp(gauss(my, sy)) }
      return { x: clamp(gauss(mx, sx)), y: clamp(gauss(my, sy)) }
  }
}

const OPPONENTS = ["Gama Sub-20", "Capital FC", "Ceilândia EC", "Brasiliense", "Paranoá EC", "Sobradinho EC", "Planaltina EC", "Luziânia EC", "Formosa EC", "Taguatinga EC", "Santa Maria FC", "Samambaia FC"]
const COMPETITIONS = ["Candangão Sub-20", "Copa Brasília", "Amistoso", "Copa Arena DF"]

const iso = (d: Date) => d.toISOString().slice(0, 10)
const stamp = new Date().toISOString()

type Seed = Omit<Member, "id" | "createdAt" | "updatedAt" | "userId" | "leadId" | "active" | "autoSync" | "phone" | "nationality" | "crmSyncedAt" | "extended"> & { id: string; elite?: boolean; matches: number }

const SEEDS: Seed[] = [
  {
    id: "m-gabriel", kind: "membro", email: "gabriel.rocha07@gmail.com", fullName: "Gabriel Rocha da Silva", birthDate: "2007-03-14",
    position: "Meia-Atacante", category: "Sub 20", foot: "Canhoto", heightCm: 178, weightKg: 72, city: "Brasília - DF", team: "Real Brasília Sub-20",
    photoUrl: null, bio: null, matches: 10,
    scout: { marcacao: 3, desarme: 2.5, leitura: 3.5, jogo_aereo: 2.5, recomposicao: 3, velocidade: 3.5, aceleracao: 4, resistencia: 3.5, forca: 2.5, impulsao: 3, mov_sem_bola: 4.5, um_contra_um: 4, ultimo_passe: 4.5, profundidade: 4, presenca_area: 3.5, passe_curto: 4.5, passe_longo: 3.5, dominio: 4.5, conducao: 4, finalizacao: 3.5, cruzamento: 3 },
  },
  {
    id: "m-arthur", kind: "membro", email: "arthurlima.09@gmail.com", fullName: "Arthur Lima", birthDate: "2009-05-02",
    position: "Ponta Esquerda", category: "Sub 17", foot: "Canhoto", heightCm: 171, weightKg: 63, city: "Taguatinga - DF", team: "Capital FC Sub-17",
    photoUrl: null, bio: null, matches: 8,
    scout: { marcacao: 2.5, desarme: 2.5, leitura: 3, jogo_aereo: 2, recomposicao: 3.5, velocidade: 4.5, aceleracao: 4.5, resistencia: 3.5, forca: 2.5, impulsao: 3, mov_sem_bola: 4, um_contra_um: 4.5, ultimo_passe: 3.5, profundidade: 4.5, presenca_area: 3, passe_curto: 3.5, passe_longo: 3, dominio: 4, conducao: 4.5, finalizacao: 3.5, cruzamento: 4 },
  },
  {
    id: "m-davi", kind: "membro", email: "davi.cardoso.alves@gmail.com", fullName: "Davi Cardoso Alves", birthDate: "2009-01-21",
    position: "Zagueiro", category: "Sub 17", foot: "Destro", heightCm: 186, weightKg: 77, city: "Gama - DF", team: "Gama Sub-17",
    photoUrl: null, bio: null, matches: 9,
    scout: { marcacao: 4, desarme: 4, leitura: 4.5, jogo_aereo: 4.5, recomposicao: 3.5, velocidade: 3, aceleracao: 3, resistencia: 4, forca: 4.5, impulsao: 4, mov_sem_bola: 2, um_contra_um: 2, ultimo_passe: 2.5, profundidade: 2, presenca_area: 3, passe_curto: 4, passe_longo: 4, dominio: 3.5, conducao: 3, finalizacao: 2, cruzamento: 1.5 },
  },
  {
    id: "r-meia", kind: "referencia", email: null, fullName: "Referência · Meia de elite Sub-20", birthDate: null,
    position: "Meia-Atacante", category: "Sub 20", foot: null, heightCm: 177, weightKg: 71, city: null, team: "Perfil de referência",
    photoUrl: null, elite: true, matches: 8,
    bio: "Média de meias-atacantes Sub-20 de alto nível, montada pela equipe Zyron a partir de jogos analisados.",
    scout: { marcacao: 3.5, desarme: 3, leitura: 4, jogo_aereo: 3, recomposicao: 3.5, velocidade: 4, aceleracao: 4.5, resistencia: 4, forca: 3.5, impulsao: 3.5, mov_sem_bola: 4.5, um_contra_um: 4.5, ultimo_passe: 5, profundidade: 4.5, presenca_area: 4, passe_curto: 5, passe_longo: 4, dominio: 5, conducao: 4.5, finalizacao: 4, cruzamento: 3.5 },
  },
  {
    id: "r-ponta", kind: "referencia", email: null, fullName: "Referência · Ponta Sub-17", birthDate: null,
    position: "Ponta Esquerda", category: "Sub 17", foot: null, heightCm: 172, weightKg: 64, city: null, team: "Perfil de referência",
    photoUrl: null, elite: true, matches: 8,
    bio: "Média de pontas Sub-17 de clubes formadores, montada pela equipe Zyron.",
    scout: { marcacao: 3, desarme: 3, leitura: 3.5, jogo_aereo: 2.5, recomposicao: 4, velocidade: 5, aceleracao: 5, resistencia: 4, forca: 3, impulsao: 3.5, mov_sem_bola: 4.5, um_contra_um: 5, ultimo_passe: 4, profundidade: 5, presenca_area: 3.5, passe_curto: 4, passe_longo: 3.5, dominio: 4.5, conducao: 5, finalizacao: 4, cruzamento: 4.5 },
  },
  {
    id: "r-zagueiro", kind: "referencia", email: null, fullName: "Referência · Zagueiro Sub-17", birthDate: null,
    position: "Zagueiro", category: "Sub 17", foot: null, heightCm: 187, weightKg: 79, city: null, team: "Perfil de referência",
    photoUrl: null, elite: true, matches: 8,
    bio: "Média de zagueiros Sub-17 de clubes formadores, montada pela equipe Zyron.",
    scout: { marcacao: 4.5, desarme: 4.5, leitura: 4.5, jogo_aereo: 5, recomposicao: 4, velocidade: 3.5, aceleracao: 3.5, resistencia: 4, forca: 4.5, impulsao: 4.5, mov_sem_bola: 2.5, um_contra_um: 2.5, ultimo_passe: 3, profundidade: 2.5, presenca_area: 3.5, passe_curto: 4.5, passe_longo: 4.5, dominio: 4, conducao: 3.5, finalizacao: 2.5, cruzamento: 2 },
  },
]

function build() {
  const members: Member[] = []
  const matches: Match[] = []
  const events: MatchEvent[] = []

  for (const seed of SEEDS) {
    const { matches: count, elite, ...rest } = seed
    members.push({
      ...rest, userId: seed.kind === "membro" ? `user-${seed.id}` : null, leadId: null, active: true, autoSync: seed.kind === "membro" && seed.id.length % 2 === 0,
      phone: seed.kind === "membro" ? `55619${String(9e7 + seed.id.length * 1234567).slice(0, 8)}` : null, nationality: seed.kind === "membro" ? "Brasil" : null,
      crmSyncedAt: seed.id === "m-gabriel" ? stamp : null, extended: true, createdAt: stamp, updatedAt: stamp,
    })
    const role = ROLES[seed.position as string]
    const isZag = seed.position === "Zagueiro"

    for (let i = 0; i < count; i++) {
      const date = new Date()
      date.setDate(date.getDate() - 3 - i * 7 - Math.floor(rand() * 3))
      const minutes = rand() > 0.3 ? 90 : [62, 70, 78][Math.floor(rand() * 3)]
      const withVideo = seed.id === "m-gabriel" && i === 1
      const id = `${seed.id}-p${i}`
      const gf = Math.floor(rand() * 4)
      const ga = Math.floor(rand() * 3)
      matches.push({
        id,
        memberId: seed.id,
        playedOn: iso(date),
        competition: COMPETITIONS[Math.floor(rand() * COMPETITIONS.length)],
        team: seed.kind === "membro" ? (seed.team as string) : "Time de referência",
        opponent: OPPONENTS[(i * 3 + seed.id.length) % OPPONENTS.length],
        isHome: i % 2 === 0,
        goalsFor: gf,
        goalsAgainst: ga,
        minutes,
        position: seed.position,
        videoUrl: withVideo ? TEST_VIDEO : null,
        rating: i === 3 ? 7.8 : i === 6 ? 6.4 : null,
        summary: withVideo
          ? "Boa leitura entre linhas e chegada ao terço final; precisa acelerar a decisão no último passe. (Vídeo de teste: Like tears in rain, CC BY-SA 4.0, Wikimedia Commons.)"
          : i === 3 ? "Melhor jogo da sequência: participou dos dois gols e venceu a maioria dos duelos." : null,
        // A partida mais recente do Gabriel fica como rascunho: só o admin vê.
        published: !(seed.id === "m-gabriel" && i === 0),
        createdAt: stamp,
        updatedAt: stamp,
      })

      const form = 0.78 + rand() * 0.45
      let n = 0
      for (const action of ACTION_KEYS) {
        const rate = role.rates[action] ?? 0
        if (!rate) continue
        const k = poisson(rate * (minutes / 90) * form * (elite ? 1.12 : 1) * (withVideo ? 0.45 : 1))
        for (let j = 0; j < k; j++) {
          const p = placeEvent(action, role, isZag)
          const okRate = role.ok[action]
          const t = withVideo ? 0.4 + rand() * (TEST_VIDEO_SECONDS - 0.8) : rand() * minutes * 60
          events.push({
            id: `${id}-e${n++}`,
            matchId: id,
            t: Math.round(t * 100) / 100,
            half: withVideo ? 1 : t < 45 * 60 ? 1 : 2,
            action,
            success: okRate === undefined ? null : rand() < Math.min(0.95, okRate + (elite ? 0.06 : 0)),
            x: Math.round(p.x * 100) / 100,
            y: Math.round(p.y * 100) / 100,
            note: null,
          })
        }
      }
    }
  }
  return { members, matches, events }
}

const state = build()

const bundleOf = (member: Member, publishedOnly: boolean): Bundle => {
  const matches = state.matches.filter((m) => m.memberId === member.id && (!publishedOnly || m.published))
  const ids = new Set(matches.map((m) => m.id))
  return { member, matches, events: state.events.filter((e) => ids.has(e.matchId)).sort((a, b) => a.t - b.t) }
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

export const fixtureSource: DataSource = {
  preview: true,

  async loadSelf(asMemberId) {
    const member = state.members.find((m) => m.id === (asMemberId ?? "m-gabriel"))
    if (!member) return delay({ status: "sem-acesso" as const })
    return delay({ status: "ok" as const, bundle: bundleOf(member, true), references: state.members.filter((m) => m.kind === "referencia" && m.active) })
  },

  async getBundle(id, publishedOnly) {
    const member = state.members.find((m) => m.id === id)
    return delay(member ? bundleOf(member, publishedOnly) : null)
  },

  async listProfiles() {
    return delay(state.members.map<ProfileListItem>((m) => {
      const own = state.matches.filter((x) => x.memberId === m.id)
      return {
        ...m,
        matchCount: own.length,
        publishedCount: own.filter((x) => x.published).length,
        lastMatch: own.map((x) => x.playedOn).sort().at(-1) ?? null,
      }
    }))
  },

  async findByLead(leadId) {
    return delay(state.members.find((m) => m.leadId === leadId) ?? null)
  },

  async findByUser(userId) {
    return delay(state.members.find((m) => m.userId === userId) ?? null)
  },

  async saveMember(input: MemberInput) {
    const now = new Date().toISOString()
    const existing = input.id ? state.members.find((m) => m.id === input.id) : undefined
    // Mesmas travas do banco: e-mail único e um lead vira no máximo um membro.
    if (!existing) {
      if (input.kind === "membro" && state.members.some((m) => m.email && input.email && m.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Já existe um membro com este e-mail.")
      if (input.leadId && state.members.some((m) => m.leadId === input.leadId)) throw new Error("Este lead já foi cadastrado como membro.")
    }
    const next: Member = {
      id: existing?.id ?? crypto.randomUUID(),
      kind: input.kind,
      userId: existing?.userId ?? null,
      email: input.kind === "membro" ? input.email ?? null : null,
      fullName: input.fullName,
      birthDate: input.birthDate ?? null,
      position: input.position ?? null,
      category: input.category ?? null,
      foot: input.foot ?? null,
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg ?? null,
      city: input.city ?? null,
      team: input.team ?? null,
      photoUrl: input.photoUrl ?? null,
      bio: input.bio ?? null,
      scout: input.scout ?? existing?.scout ?? null,
      leadId: input.leadId ?? existing?.leadId ?? null,
      active: input.active ?? true,
      autoSync: existing?.autoSync ?? false,
      phone: input.phone !== undefined ? input.phone : existing?.phone ?? null,
      nationality: input.nationality !== undefined ? input.nationality : existing?.nationality ?? null,
      crmSyncedAt: existing?.crmSyncedAt ?? null,
      extended: true,
      createdAt: existing?.createdAt ?? input.createdAt ?? now,
      updatedAt: now,
    }
    state.members = existing ? state.members.map((m) => (m.id === next.id ? next : m)) : [next, ...state.members]
    return delay(next)
  },

  async deleteMember(id) {
    const matchIds = state.matches.filter((m) => m.memberId === id).map((m) => m.id)
    state.members = state.members.filter((m) => m.id !== id)
    state.matches = state.matches.filter((m) => m.memberId !== id)
    state.events = state.events.filter((e) => !matchIds.includes(e.matchId))
    return delay(undefined)
  },

  async saveMatch(input: MatchInput) {
    const now = new Date().toISOString()
    const existing = input.id ? state.matches.find((m) => m.id === input.id) : undefined
    const next: Match = { ...input, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now }
    state.matches = existing ? state.matches.map((m) => (m.id === next.id ? next : m)) : [next, ...state.matches]
    return delay(next)
  },

  async deleteMatch(id) {
    state.matches = state.matches.filter((m) => m.id !== id)
    state.events = state.events.filter((e) => e.matchId !== id)
    return delay(undefined)
  },

  async addEvent(input: EventInput) {
    const e: MatchEvent = { ...input, id: crypto.randomUUID() }
    state.events = [...state.events, e]
    return delay(e)
  },

  async deleteEvent(id) {
    state.events = state.events.filter((e) => e.id !== id)
    return delay(undefined)
  },
}

/** Quem acabou de criar a conta: nada preenchido ainda (`?como=novo`). */
export const FIXTURE_NEWCOMER: AthleteAccount = {
  userId: "00000000-0000-4000-8000-0000000000b2",
  atletaId: null,
  email: "davirocha.2011@gmail.com",
  name: "Davi Rocha",
  firstName: "Davi",
  avatarUrl: null,
  position: null,
  age: null,
  heightCm: null,
  weightKg: null,
  foot: null,
  nationality: null,
  city: null,
  hasProfile: false,
  seed: "00000000-0000-4000-8000-0000000000b2",
}

/**
 * Carreira de teste. O membro principal já está no Setor Atletas; `?carreira=` força uma etapa
 * para ver as outras telas (nenhuma, selecionado, encaminhado ou contrato).
 */
export function fixtureCareer(memberId: string | null, account: AthleteAccount): Career {
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const forced = new URLSearchParams(window.location.search).get("carreira")
  const level = forced ?? (memberId === "m-gabriel" ? "selecionado" : "nenhuma")
  if (level === "nenhuma" || (!account.hasProfile && !forced)) return NO_CAREER
  return {
    selected: true,
    selectedOn: ago(34),
    forwarded: level === "encaminhado" || level === "contrato",
    forwardedOn: level === "encaminhado" || level === "contrato" ? ago(9) : null,
    contract: level === "contrato",
    contractOn: level === "contrato" ? ago(1) : null,
    contractClub: level === "contrato" ? "Botafogo-SP" : null,
  }
}

/** Conta de quem entrou mas ainda não tem a análise de partidas liberada. */
export const FIXTURE_ACCOUNT: AthleteAccount = {
  userId: "00000000-0000-4000-8000-0000000000a1",
  atletaId: 1,
  email: "rafaelmendes.15@gmail.com",
  name: "Rafael Mendes Monteiro",
  firstName: "Rafael",
  avatarUrl: null,
  position: "Lateral Esquerdo",
  age: 15,
  heightCm: 159,
  weightKg: 56,
  foot: "Canhoto",
  nationality: "Brasil",
  city: "Salvador - BA",
  hasProfile: true,
  seed: "00000000-0000-4000-8000-0000000000a1",
}

/* ------------------------------------------------------------------ */
/* Camada do Scout (só no `npm run dev`)                               */
/* ------------------------------------------------------------------ */

const daysFrom = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const demoClub = (id: string, name: string, league: string, emblem: string, color: string): ClubRef =>
  ({ id: `club-${id}`, name, country: "Brasil", league, crestUrl: null, emblem, color, catalogId: id })

/** Atleta de teste em pé, desenhado em SVG (só para ver o palco sem uma foto real). */
function demoBodySvg(cutout: boolean, kit: string) {
  const bg = cutout ? "" : `<defs><radialGradient id="s" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#3a3a40"/><stop offset="1" stop-color="#121214"/></radialGradient></defs><rect width="800" height="1000" fill="url(#s)"/>`
  const skin = "#8d5a3b"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">${bg}
<ellipse cx="400" cy="128" rx="58" ry="70" fill="${skin}"/><path d="M342 110q58-70 116 0q-6-58-58-62q-52 4-58 62z" fill="#1b1b1b"/>
<rect x="378" y="186" width="44" height="40" rx="10" fill="${skin}"/>
<path d="M262 238q138-40 276 0l34 236-70 10-14-120-10 190H322l-10-190-14 120-70-10z" fill="${kit}"/>
<path d="M372 226h56l-28 34z" fill="#fff" opacity=".85"/>
<path d="M228 474l34-236 26 6-24 228z" fill="${skin}"/><path d="M572 474l-34-236-26 6 24 228z" fill="${skin}"/>
<path d="M322 544h156l8 118H314z" fill="#f4f4f5"/>
<path d="M330 662h58l-6 214h-46z" fill="${skin}"/><path d="M412 662h58l-6 214h-46z" fill="${skin}"/>
<path d="M330 700h58v120h-58zM412 700h58v120h-58z" fill="${kit}"/>
<path d="M330 876h52l20 34h-80zM418 876h52l8 34h-80z" fill="#111"/>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const demoSubmissions: Submission[] = [
  { id: "env-1", videoId: "M7lc1UVf-VE", opponent: "Ceilândia Sub-17", playedOn: daysFrom(-6), note: "Entrei no 2º tempo, camisa 10.", status: "em_analise", reviewNote: null, matchId: null, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
]

/**
 * Camada de teste. O membro principal tem duas oportunidades reais. `?corpo=moldura` ou
 * `?corpo=recorte` liga a foto de corpo inteiro; `?trava=matches` tranca uma parte da área.
 */
export function fixtureScoutLayer(memberId: string | null): ScoutLayer {
  const q = new URLSearchParams(window.location.search)
  const corpo = q.get("corpo")
  const kit = demoClub("br2", "Palmeiras", "Série A", "🟢⚪", "#0b6b3a")
  const trava = q.get("trava")
  const main = memberId === "m-gabriel" || memberId === null
  return {
    memberId,
    locks: trava && (LOCK_KEYS as string[]).includes(trava) ? { [trava]: "locked" } : {},
    bodyPhoto: corpo === "moldura" || corpo === "recorte"
      ? { url: demoBodySvg(corpo === "recorte", kit.color ?? "#0b6b3a"), smallUrl: null, style: corpo, kit }
      : null,
    opportunities: main
      ? [
          { id: "op-1", club: kit, compatibility: 94, deadline: daysFrom(5), status: "aberta", athleteNote: "A base procura um meia-atacante canhoto para a avaliação de novembro.", publishedAt: new Date().toISOString() },
          { id: "op-2", club: demoClub("br10", "Athletico-PR", "Série A", "🔴⚫", "#c8102e"), compatibility: 88, deadline: daysFrom(16), status: "enviada", athleteNote: "Seu perfil já foi enviado ao coordenador da base.", publishedAt: new Date().toISOString() },
        ]
      : [],
    submissions: [...demoSubmissions],
    available: true,
  }
}

export async function fixtureSubmit(input: SubmitInput): Promise<Submission> {
  const video = parseVideo(input.url)
  if (video?.kind !== "youtube" || !/^[A-Za-z0-9_-]{11}$/.test(video.id)) throw new Error("Envie um link do YouTube (youtube.com ou youtu.be).")
  if (demoSubmissions.some((s) => s.videoId === video.id)) throw new Error("Este vídeo já foi enviado.")
  const s: Submission = {
    id: crypto.randomUUID(), videoId: video.id, opponent: input.opponent.trim() || null, playedOn: input.playedOn || null,
    note: input.note.trim() || null, status: "enviado", reviewNote: null, matchId: null, createdAt: new Date().toISOString(),
  }
  demoSubmissions.unshift(s)
  return delay(s)
}
