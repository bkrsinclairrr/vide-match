/**
 * Dados fictícios da VOXEN para testar a plataforma no `npm run dev`
 * (/voxen?demo). O store só importa este arquivo dentro de uma condição com
 * `import.meta.env.DEV`, então ele não entra no build de produção.
 */
import { STAT_KEYS, buildStats, overallFrom } from "@/lib/funnel"
import { SCOUT_ATTRS, originOf, type Player, type Profile, type StageKey, type VoxenData } from "./data"
import { demoApprovedProspects } from "./pages/imported/demo"
import { prospectBase } from "./prospects"

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

const FIRST = ["Gabriel", "Lucas", "Pedro", "Arthur", "Davi", "Miguel", "Kauã", "Enzo", "Heitor", "Matheus", "Rafael", "João Pedro", "Guilherme", "Vinícius", "Bernardo", "Samuel", "Caio", "Nicolas", "Felipe", "Breno", "Thiago", "Ryan", "Wesley", "Cristian", "Raul", "Igor", "Luan", "Diego", "Murilo", "Kevin", "Yuri", "Otávio", "Henrique", "Bruno", "Erick"]
const LAST = ["Silva", "Santos", "Oliveira", "Souza", "Rocha", "Lima", "Pereira", "Ferreira", "Alves", "Costa", "Gomes", "Ribeiro", "Martins", "Carvalho", "Araújo", "Nascimento", "Barbosa", "Cardoso", "Teixeira", "Moreira", "Mendes", "Batista", "Freitas", "Amorim", "Gonçalves", "Duarte", "Vieira", "Monteiro"]
const PLACES: [string, string][] = [
  ["Brasília - DF", "Distrito Federal"], ["Taguatinga - DF", "Distrito Federal"], ["Ceilândia - DF", "Distrito Federal"],
  ["Gama - DF", "Distrito Federal"], ["Águas Claras - DF", "Distrito Federal"], ["Samambaia - DF", "Distrito Federal"],
  ["São Paulo - SP", "São Paulo"], ["Campinas - SP", "São Paulo"], ["Rio de Janeiro - RJ", "Rio de Janeiro"],
  ["Belo Horizonte - MG", "Minas Gerais"], ["Contagem - MG", "Minas Gerais"], ["Goiânia - GO", "Goiás"],
  ["Anápolis - GO", "Goiás"], ["Salvador - BA", "Bahia"], ["Recife - PE", "Pernambuco"], ["Fortaleza - CE", "Ceará"],
  ["Curitiba - PR", "Paraná"], ["Londrina - PR", "Paraná"], ["Porto Alegre - RS", "Rio Grande do Sul"],
  ["Manaus - AM", "Amazonas"], ["Belém - PA", "Pará"], ["Natal - RN", "Rio Grande do Norte"], ["Cuiabá - MT", "Mato Grosso"],
]
const POS_WEIGHTS: [string, number][] = [
  ["Goleiro", 6], ["Zagueiro", 12], ["Lateral Direito", 8], ["Lateral Esquerdo", 7], ["Volante", 11], ["Meio-Campo", 11],
  ["Meia-Atacante", 14], ["Ponta Direita", 9], ["Ponta Esquerda", 9], ["Centroavante", 13],
]
const CAT_WEIGHTS: [number, number][] = [[13, 4], [14, 7], [15, 12], [16, 15], [17, 16], [18, 9], [19, 6], [20, 8]]
const ORIGINS: [string | null, number][] = [["facebook", 48], ["instagram", 16], ["google", 11], ["tiktok", 9], [null, 16]]
const STAGE_WEIGHTS: [StageKey, number][] = [["novo", 52], ["contato", 22], ["avaliacao", 13], ["aprovado", 6], ["descartado", 7]]

function pick<T>(rand: () => number, items: [T, number][]): T {
  const total = items.reduce((a, [, w]) => a + w, 0)
  let r = rand() * total
  for (const [item, w] of items) {
    r -= w
    if (r <= 0) return item
  }
  return items[items.length - 1][0]
}

const NOTES = [
  "Pai muito engajado, pediu retorno à noite. Enviar a leitura completa até sexta.",
  "Vídeos chegaram pelo WhatsApp. Boa leitura de jogo, precisa ganhar força no duelo.",
  "Joga em escolinha da região. Interesse em avaliação presencial em Brasília.",
  "Respondeu rápido. Mãe quer entender os próximos passos antes de decidir.",
  "",
]

export function buildDemoData(): VoxenData {
  const rand = mulberry32(20261009)
  const now = Date.now()
  const players: Player[] = []
  const used = new Set<string>()

  for (let i = 0; i < 168; i++) {
    let name = ""
    do {
      name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}${rand() > 0.55 ? " " + LAST[Math.floor(rand() * LAST.length)] : ""}`
    } while (used.has(name))
    used.add(name)

    const position = pick(rand, POS_WEIGHTS)
    const cat = pick(rand, CAT_WEIGHTS)
    const [city, state] = PLACES[Math.floor(Math.pow(rand(), 1.6) * PLACES.length)]
    const tall = position === "Goleiro" || position === "Zagueiro"
    const height = Math.round((tall ? 178 : 164) + rand() * (tall ? 14 : 18) - (20 - cat) * 1.2)
    const daysAgo = Math.pow(rand(), 1.7) * 44
    const hour = pick(rand, [[8, 2], [10, 3], [12, 5], [14, 4], [17, 6], [19, 9], [20, 10], [21, 9], [22, 7], [23, 3]])
    const created = new Date(now - daysAgo * 86400000)
    created.setHours(hour, Math.floor(rand() * 60), 0, 0)
    if (created.getTime() > now) created.setTime(now - rand() * 3600000)

    const key = `demo:${i}`
    const stats = buildStats(key)
    // Um terço não informou o perfil: é onde os valores estimados da VOXEN aparecem.
    const withProfile = rand() > 0.33
    const profile: Profile = withProfile
      ? {
          age: Math.max(11, cat - (rand() > 0.5 ? 1 : 0)),
          height, weight: Math.round(height - 106 + rand() * 12),
          foot: pick(rand, [["Destro", 70], ["Canhoto", 22], ["Ambidestro", 8]]),
          nationality: rand() > 0.04 ? "Brasil" : "Portugal",
          position, category: `Sub ${cat}`, state, city,
        }
      : {}
    const stage = pick(rand, STAGE_WEIGHTS)
    const evaluated = stage === "avaliacao" || stage === "aprovado" || (stage === "contato" && rand() > 0.6)
    const scout = evaluated
      ? Object.fromEntries(SCOUT_ATTRS.map((a) => [a.key, Math.round((1.5 + rand() * 3.5) * 2) / 2]))
      : null
    const utmSource = pick(rand, ORIGINS)
    // Telefone que não existe (o celular brasileiro não começa com 90): um número aleatório
    // poderia ser de uma pessoa real.
    const digits = `6190000${String(Math.floor(rand() * 9000 + 1000))}`
    const [fn, ...rest] = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")
    const last = rest[rest.length - 1]
    const suffix = Math.floor(rand() * 90 + 10)
    const handle = [`${fn}.${last}${suffix}`, `${fn}${last}${suffix}`, `${fn}_${last}`, `${fn}.${last}`][Math.floor(rand() * 4)]

    players.push({
      key,
      source: "funil",
      aliases: [],
      memberId: null,
      estimated: [],
      name,
      email: `${handle}@gmail.com`,
      phone: digits,
      createdAt: created.toISOString(),
      profile,
      hasProfile: withProfile,
      origin: originOf({ utm_source: utmSource }),
      utm: {
        source: utmSource, medium: utmSource ? "paid" : null,
        campaign: utmSource ? pick(rand, [["avaliacao-gratis-df", 5], ["pais-lookalike", 3], ["remarketing-30d", 2]]) : null,
        content: null, term: null,
      },
      stats,
      overall: overallFrom(stats),
      reportFromFunnel: withProfile && rand() > 0.25,
      meta: {
        stage,
        notes: stage === "novo" ? "" : NOTES[Math.floor(rand() * NOTES.length)],
        scout,
        updatedAt: stage === "novo" ? null : new Date(created.getTime() + rand() * 3 * 86400000).toISOString(),
      },
    })
  }

  // Gabriel Rocha: o atleta em destaque da home institucional.
  const g = players[0]
  Object.assign(g, {
    name: "Gabriel Rocha da Silva",
    // Membro de teste (a foto de corpo inteiro e os vídeos dele estão nos dados locais dos Materiais).
    memberId: "m-gabriel",
    email: "gabriel.rocha07@gmail.com",
    profile: { age: 19, height: 178, weight: 72, foot: "Canhoto", nationality: "Brasil", position: "Meia-Atacante", category: "Sub 20", state: "Distrito Federal", city: "Brasília - DF" },
    hasProfile: true,
    createdAt: new Date(now - 42 * 60000).toISOString(),
    stats: STAT_KEYS.map((s) => ({ ...s, score: ({ ataque: 89, defesa: 80, chute: 84, dominio: 91, marcacao: 79, finalizacao: 86, drible: 90, passe: 93, velocidade: 85, leitura: 92 } as Record<string, number>)[s.key] })),
    overall: 87,
    reportFromFunnel: true,
  })
  g.meta = {
    stage: "avaliacao",
    notes: "Canhoto, visão de jogo acima da média. Clube português demonstrou interesse no perfil.",
    scout: { conducao: 3.5, troca: 4.5, costas: 4, sem_bola: 4, linha_passe: 4, passe_vencedor: 3.5, ajuste: 2.5, engano: 2.5, cruzamento: 2.5, finalizacao: 2 },
    updatedAt: new Date(now - 20 * 60000).toISOString(),
  }

  // Casos para testar a junção e os duplicados (nomes inventados).
  const base = players[1]
  const person = (over: Partial<Player> & Pick<Player, "key" | "name">): Player => ({
    ...base, source: "funil", aliases: [], memberId: null, estimated: [], userId: null, meta: { ...EMPTY_DEMO_META }, ...over,
  })
  // Lead + conta da mesma pessoa, já juntados (como o Juan Dérick Kretzer): um registro só, com a conta como apelido.
  players.push(person({
    key: "lead:demo-juan", aliases: ["atleta:900"], userId: "demo-user-juan", memberId: "m-juan", name: "Juan Dérick Kretzer", email: "juan.kretzer@exemplo.com",
    phone: "47900000001", createdAt: new Date(now - 3 * 86400000).toISOString(),
    profile: { age: 17, height: 190, weight: 84, foot: "canhoto", nationality: "Brasil", position: "Zagueiro", category: "Sub 17", state: "Santa Catarina", city: "Joinville - SC" },
    hasProfile: true,
  }))
  // Dois cadastros com o mesmo nome e o mesmo telefone (provável duplicado) e um homônimo com telefone diferente.
  players.push(person({
    key: "lead:demo-camilo-a", name: "Camilo Karam Escobar", email: "camilo.a@exemplo.com", phone: "61900000002",
    createdAt: new Date(now - 5 * 86400000).toISOString(), profile: { age: 16, position: "Volante", category: "Sub 17", city: "Gama - DF" }, hasProfile: true,
  }))
  players.push(person({
    key: "lead:demo-camilo-b", name: "Camilo Karam Escobar", email: "camilo.b@exemplo.com", phone: "61900000002",
    createdAt: new Date(now - 4 * 86400000).toISOString(), profile: {}, hasProfile: false,
  }))
  players.push(person({
    key: "lead:demo-joao-a", name: "João Pedro Almeida", email: "joaopedro.a@exemplo.com", phone: "61900000003",
    createdAt: new Date(now - 6 * 86400000).toISOString(), profile: { age: 15, position: "Goleiro", category: "Sub 15", city: "Taguatinga - DF" }, hasProfile: true,
  }))
  players.push(person({
    key: "lead:demo-joao-b", name: "João Pedro Almeida", email: "joaopedro.b@exemplo.com", phone: "11900000004",
    createdAt: new Date(now - 7 * 86400000).toISOString(), profile: { age: 18, position: "Zagueiro", category: "Sub 19", city: "Campinas - SP" }, hasProfile: true,
  }))

  // Pré-cadastros do CRM aprovados em Importados (os da demonstração de Importados): aparecem aqui como no site.
  for (const row of demoApprovedProspects()) {
    const p = prospectBase(row)
    const stats = buildStats(p.key)
    players.push({ ...p, stats, overall: overallFrom(stats), reportFromFunnel: false, meta: { ...EMPTY_DEMO_META } })
  }

  players.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { players, sharedMeta: false, profileCapture: true, merge: { mergedAccounts: 1, withMember: 0, filledFields: 0 }, loadedAt: new Date() }
}

const EMPTY_DEMO_META = { stage: "novo" as StageKey, notes: "", scout: null, updatedAt: null }
