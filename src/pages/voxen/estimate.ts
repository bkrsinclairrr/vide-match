/**
 * Valores estimados: para o jogador que ainda não informou o básico (idade, posição, categoria, cidade, time...), a VOXEN
 * mostra um valor plausível, de time e cidade do Brasil e idade de 11 a 22, para a lista nunca ficar vazia.
 *
 * Regras que não mudam:
 *   - NUNCA sobrescreve o que a pessoa informou: só preenche campo vazio;
 *   - é DETERMINÍSTICO (a mesma pessoa tem sempre os mesmos valores, como o relatório do funil: nada de Math.random);
 *   - é COERENTE: a categoria acompanha a idade, o time e a cidade são do mesmo estado, altura e peso combinam com a idade;
 *   - NADA é gravado no banco. Os campos estimados ficam marcados em `Player.estimated`, a tela os mostra como "est."
 *     e eles nunca vão para o setor Atletas, para o cadastro de membro nem para a área do atleta;
 *   - quando o dado de verdade chega (funil, CRM, edição da equipe), ele passa na frente sozinho.
 *
 * Só funções puras, sem banco e sem tela: `npm run test:pessoas`.
 */
import { POSITIONS } from "../../data/football.ts"
import type { Player, Profile } from "./data"

/* ------------------------------------------------------------------ */
/* Brasil: estado, cidades e clubes                                    */
/* ------------------------------------------------------------------ */

type Place = { uf: string; state: string; cities: string[]; clubs: string[] }

export const PLACES: Place[] = [
  { uf: "SP", state: "São Paulo", cities: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba"], clubs: ["Palmeiras", "Corinthians", "São Paulo", "Santos", "Red Bull Bragantino", "Ponte Preta", "Guarani", "Mirassol", "Novorizontino", "Ituano", "São Bernardo"] },
  { uf: "RJ", state: "Rio de Janeiro", cities: ["Rio de Janeiro", "Niterói", "Volta Redonda", "Duque de Caxias"], clubs: ["Flamengo", "Fluminense", "Vasco da Gama", "Botafogo", "Volta Redonda", "Nova Iguaçu", "Madureira", "Bangu"] },
  { uf: "MG", state: "Minas Gerais", cities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora"], clubs: ["Cruzeiro", "Atlético-MG", "América-MG", "Tombense", "Caldense", "Athletic-MG", "Villa Nova"] },
  { uf: "RS", state: "Rio Grande do Sul", cities: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria"], clubs: ["Grêmio", "Internacional", "Juventude", "Caxias", "Novo Hamburgo", "São José-RS", "Ypiranga-RS"] },
  { uf: "PR", state: "Paraná", cities: ["Curitiba", "Londrina", "Maringá", "Cascavel"], clubs: ["Athletico-PR", "Coritiba", "Paraná Clube", "Londrina", "Operário-PR", "Maringá"] },
  { uf: "SC", state: "Santa Catarina", cities: ["Florianópolis", "Joinville", "Chapecó", "Blumenau", "Criciúma"], clubs: ["Avaí", "Figueirense", "Criciúma", "Chapecoense", "Joinville", "Brusque", "Marcílio Dias"] },
  { uf: "BA", state: "Bahia", cities: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari"], clubs: ["Bahia", "Vitória", "Bahia de Feira", "Jacuipense", "Juazeirense"] },
  { uf: "PE", state: "Pernambuco", cities: ["Recife", "Caruaru", "Olinda", "Petrolina"], clubs: ["Sport", "Náutico", "Santa Cruz", "Retrô", "Central"] },
  { uf: "CE", state: "Ceará", cities: ["Fortaleza", "Juazeiro do Norte", "Sobral", "Caucaia"], clubs: ["Fortaleza", "Ceará", "Ferroviário", "Floresta"] },
  { uf: "GO", state: "Goiás", cities: ["Goiânia", "Anápolis", "Aparecida de Goiânia", "Rio Verde"], clubs: ["Goiás", "Vila Nova", "Atlético-GO", "Anápolis", "Aparecidense"] },
  { uf: "DF", state: "Distrito Federal", cities: ["Brasília", "Taguatinga", "Ceilândia", "Gama", "Sobradinho"], clubs: ["Brasiliense", "Gama", "Real Brasília", "Ceilândia", "Sobradinho"] },
  { uf: "ES", state: "Espírito Santo", cities: ["Vitória", "Vila Velha", "Serra", "Cariacica"], clubs: ["Rio Branco-ES", "Desportiva Ferroviária", "Real Noroeste", "Serra"] },
  { uf: "PA", state: "Pará", cities: ["Belém", "Ananindeua", "Marabá", "Santarém"], clubs: ["Paysandu", "Remo", "Tuna Luso", "Águia de Marabá"] },
  { uf: "AM", state: "Amazonas", cities: ["Manaus", "Parintins", "Itacoatiara"], clubs: ["Manaus", "Nacional-AM", "Amazonas FC", "Princesa do Solimões"] },
  { uf: "MT", state: "Mato Grosso", cities: ["Cuiabá", "Várzea Grande", "Rondonópolis"], clubs: ["Cuiabá", "Mixto", "Luverdense", "Operário-VG"] },
  { uf: "MS", state: "Mato Grosso do Sul", cities: ["Campo Grande", "Dourados", "Três Lagoas"], clubs: ["Operário-MS", "Costa Rica", "Águia Negra", "Aquidauanense"] },
  { uf: "RN", state: "Rio Grande do Norte", cities: ["Natal", "Mossoró", "Parnamirim"], clubs: ["ABC", "América-RN", "Potiguar"] },
  { uf: "PB", state: "Paraíba", cities: ["João Pessoa", "Campina Grande", "Patos"], clubs: ["Botafogo-PB", "Treze", "Campinense", "Sousa"] },
  { uf: "AL", state: "Alagoas", cities: ["Maceió", "Arapiraca", "Rio Largo"], clubs: ["CRB", "CSA", "ASA"] },
  { uf: "SE", state: "Sergipe", cities: ["Aracaju", "Lagarto", "Itabaiana"], clubs: ["Sergipe", "Confiança", "Itabaiana"] },
  { uf: "MA", state: "Maranhão", cities: ["São Luís", "Imperatriz", "Caxias"], clubs: ["Sampaio Corrêa", "Maranhão", "Moto Club"] },
  { uf: "PI", state: "Piauí", cities: ["Teresina", "Parnaíba", "Picos"], clubs: ["Parnahyba", "Altos", "River-PI"] },
  { uf: "TO", state: "Tocantins", cities: ["Palmas", "Araguaína", "Gurupi"], clubs: ["Palmas", "Tocantinópolis", "Gurupi"] },
]

const BY_UF = new Map(PLACES.map((p) => [p.uf, p]))
const BY_STATE = new Map(PLACES.map((p) => [p.state.toLowerCase(), p]))
const ALL_CLUBS = PLACES.flatMap((p) => p.clubs)

/** A sigla do estado do jogador, pelo que ele já informou ("Joinville - SC" ou "Santa Catarina"). */
export function ufOf(profile: Pick<Profile, "city" | "state">): string | null {
  const fromCity = profile.city?.match(/-\s*([A-Za-z]{2})\s*$/)?.[1]?.toUpperCase()
  if (fromCity) return fromCity
  return profile.state ? BY_STATE.get(profile.state.trim().toLowerCase())?.uf ?? null : null
}

/* ------------------------------------------------------------------ */
/* Sorteio estável                                                     */
/* ------------------------------------------------------------------ */

/** Número entre 0 e 1 que só depende da chave e do "sal": a mesma pessoa e o mesmo campo dão sempre o mesmo. */
export function unit(key: string, salt: string): number {
  let h = 2166136261
  const text = `${key}|${salt}`
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // Mistura final (avalanche) para que chaves parecidas não deem números parecidos.
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const pick = <T,>(list: readonly T[], key: string, salt: string): T => list[Math.min(list.length - 1, Math.floor(unit(key, salt) * list.length))]
const between = (min: number, max: number, key: string, salt: string) => min + Math.floor(unit(key, salt) * (max - min + 1))

/* ------------------------------------------------------------------ */
/* Regras do corpo e da categoria                                      */
/* ------------------------------------------------------------------ */

export const AGE_MIN = 11
export const AGE_MAX = 22

/** Categoria de quem tem essa idade: Sub 12 para 11 anos até Sub 20; de 21 anos em diante, Sub 23. */
export const categoryFromAge = (age: number): string => (age >= 21 ? "Sub 23" : `Sub ${Math.max(6, Math.min(20, age + 1))}`)

/**
 * Idade provável de quem joga nessa categoria (Sub 15 → 14 anos, às vezes 13), sempre dentro de 11 a 22 anos: a idade estimada
 * nunca sai dessa faixa, mesmo que a categoria informada seja menor (Sub 9 vira 11).
 */
export function ageFromCategory(category: string, key: string): number | undefined {
  const n = Number(/^Sub\s+(\d{1,2})$/i.exec(category.trim())?.[1])
  if (!Number.isFinite(n) || n < 6 || n > 23) return undefined
  return Math.max(AGE_MIN, Math.min(AGE_MAX, n - 1 - (unit(key, "age-from-category") < 0.35 ? 1 : 0)))
}

// Mediana por idade (11 a 22 anos): altura em cm e peso em kg. Abaixo de 11 anos, a curva continua para baixo.
const HEIGHT_BY_AGE = [146, 152, 159, 166, 171, 174, 176, 177, 178, 178, 178, 178]
const WEIGHT_BY_AGE = [38, 43, 49, 55, 61, 66, 69, 71, 72, 73, 73, 74]

function bodyAt(age: number): { height: number; weight: number } {
  if (age >= AGE_MIN) {
    const i = Math.min(HEIGHT_BY_AGE.length - 1, age - AGE_MIN)
    return { height: HEIGHT_BY_AGE[i], weight: WEIGHT_BY_AGE[i] }
  }
  const years = AGE_MIN - age
  return { height: HEIGHT_BY_AGE[0] - years * 6, weight: WEIGHT_BY_AGE[0] - years * 3 }
}
const TALL = new Set(["Goleiro", "Zagueiro", "Centroavante"])
const SMALL = new Set(["Lateral Direito", "Lateral Esquerdo", "Ponta Direita", "Ponta Esquerda", "Meia-Atacante"])

const FEET = [["destro", 72], ["canhoto", 24], ["ambidestro", 4]] as const

function footFor(key: string): string {
  let r = unit(key, "foot") * 100
  for (const [name, weight] of FEET) {
    if (r < weight) return name
    r -= weight
  }
  return "destro"
}

/* ------------------------------------------------------------------ */
/* A estimativa                                                        */
/* ------------------------------------------------------------------ */

export type Estimate = { profile: Profile; estimated: (keyof Profile)[] }

const missing = (v: unknown) => v === undefined || v === null || v === "" || (typeof v === "number" && !(v > 0))

/**
 * Completa o que falta no perfil. `real` é o que a pessoa de fato informou: nada dele é mudado. Devolve o perfil completo
 * e a lista dos campos que foram estimados.
 */
export function estimateProfile(key: string, real: Profile): Estimate {
  const profile: Profile = { ...real }
  const estimated: (keyof Profile)[] = []
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    profile[k] = v
    estimated.push(k)
  }

  // Idade: a categoria de verdade manda (Sub 15 não tem 20 anos); sem nada, de 11 a 22.
  if (missing(profile.age)) {
    const fromCategory = profile.category ? ageFromCategory(profile.category, key) : undefined
    set("age", fromCategory ?? between(AGE_MIN, AGE_MAX, key, "age"))
  }
  const age = profile.age as number

  if (missing(profile.category)) set("category", categoryFromAge(age))
  if (missing(profile.position)) set("position", pick(POSITIONS, key, "position"))

  // Lugar: o estado que a pessoa já informou manda; sem nenhum, sorteia um do Brasil.
  let uf = ufOf(profile)
  if (missing(profile.city)) {
    const place = (uf ? BY_UF.get(uf) : undefined) ?? (profile.state ? BY_STATE.get(profile.state.trim().toLowerCase()) : undefined) ?? pick(PLACES, key, "place")
    uf = place.uf
    set("city", `${pick(place.cities, key, "city")} - ${place.uf}`)
    if (missing(profile.state)) set("state", place.state)
  }

  // Time do mesmo estado (quando o estado tem clubes cadastrados aqui).
  if (missing(profile.team)) {
    const pool = (uf ? BY_UF.get(uf)?.clubs : undefined) ?? ALL_CLUBS
    set("team", pick(pool, key, "team"))
  }

  if (missing(profile.foot)) set("foot", footFor(key))
  if (missing(profile.nationality)) set("nationality", "Brasil")

  const body = bodyAt(age)
  const position = profile.position ?? ""
  if (missing(profile.height)) {
    const adjust = TALL.has(position) ? 4 : SMALL.has(position) ? -2 : 0
    set("height", Math.max(100, Math.min(225, body.height + adjust + between(-6, 6, key, "height"))))
  }
  if (missing(profile.weight)) {
    // Quem é mais alto que a mediana da idade pesa um pouco mais.
    const taller = (profile.height as number) - body.height
    set("weight", Math.max(25, Math.min(150, body.weight + Math.round(taller * 0.45) + between(-4, 4, key, "weight"))))
  }

  return { profile, estimated }
}

/** Aplica a estimativa a cada jogador. `real` fica intacto no próprio jogador (`realProfileOf` o recupera). */
export function withEstimates(players: Player[]): Player[] {
  return players.map((p) => {
    const { profile, estimated } = estimateProfile(p.key, p.profile)
    return estimated.length ? { ...p, profile, estimated } : p
  })
}
