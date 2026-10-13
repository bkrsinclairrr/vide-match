/**
 * Regras da área do cliente: nota (o mesmo relatório da /analysis), divisão,
 * referência por posição, oportunidades, nível, conquistas e missões.
 *
 * Nada aqui é inventado: o relatório vem do mesmo cálculo que a pessoa já vê
 * no site, o nível e as conquistas saem do que ela realmente fez (perfil,
 * foto, acesso à análise de partidas, jogos analisados) e as oportunidades
 * vêm da base de clubes da Zyron.
 */
import {
  Award, BadgeCheck, Camera, ClipboardCheck, Crosshair, Flame, Goal, Handshake, Shield, Target, Video,
  type LucideIcon,
} from "lucide-react"
import { STAT_KEYS, WHATSAPP_NUMBER, buildStats, overallFrom, type StatResult } from "@/lib/funnel"
import { getAllClubs, getBrazilianClubBySeed, getClubBySeed, type Club } from "@/data/clubs"
import type { AthleteAccount } from "./account"
import type { ProfileSummary } from "./metrics"

/* ------------------------------------------------------------------ */
/* Categoria e relatório                                               */
/* ------------------------------------------------------------------ */

/** Sub-N pela idade (16 anos joga o Sub-17), limitada ao Sub 6–20 do site. */
export function categoryOf(age: number | null) {
  return age ? `Sub ${Math.max(6, Math.min(20, age + 1))}` : null
}

export type Report = { stats: StatResult[]; overall: number }

/** Mesmo relatório da /analysis: indicadores determinísticos pelo id da conta. */
export function reportOf(account: AthleteAccount): Report | null {
  if (!account.hasProfile) return null
  const stats = buildStats(account.seed)
  return { stats, overall: overallFrom(stats) }
}

/** Média esperada do modelo de notas da Zyron (indicadores de 76 a 95). */
export const ZYRON_AVERAGE = 85.5

export const TIERS = [
  { key: "revelacao", label: "Revelação", min: 0, color: "#a1a1aa", text: "Seu jogo está na vitrine. Complete o perfil e envie vídeos para mostrar mais." },
  { key: "promessa", label: "Promessa", min: 80, color: "#38bdf8", text: "Base sólida e espaço de sobra para crescer. É aqui que o scout começa a prestar atenção." },
  { key: "destaque", label: "Destaque", min: 85, color: "#fbbf24", text: "Acima da média Zyron. Com o jogo bem documentado, você entra na conversa dos clubes." },
  { key: "elite", label: "Elite", min: 90, color: "#34d399", text: "Nível de quem chama atenção em qualquer lista. O próximo passo é ser visto pelas pessoas certas." },
] as const

export const tierOf = (overall: number) => [...TIERS].reverse().find((t) => overall >= t.min) ?? TIERS[0]

/* ------------------------------------------------------------------ */
/* Referência por posição                                              */
/* ------------------------------------------------------------------ */

const FOCUS: Record<string, string[]> = {
  Goleiro: ["leitura", "dominio", "passe", "defesa"],
  "Lateral Direito": ["velocidade", "defesa", "passe", "marcacao"],
  "Lateral Esquerdo": ["velocidade", "defesa", "passe", "marcacao"],
  Zagueiro: ["defesa", "marcacao", "leitura", "dominio"],
  Volante: ["marcacao", "passe", "leitura", "defesa"],
  "Meio-Campo": ["passe", "leitura", "dominio", "marcacao"],
  "Meia-Atacante": ["passe", "drible", "leitura", "finalizacao"],
  "Ponta Direita": ["velocidade", "drible", "finalizacao", "chute"],
  "Ponta Esquerda": ["velocidade", "drible", "finalizacao", "chute"],
  Centroavante: ["finalizacao", "chute", "ataque", "dominio"],
}
const DEFAULT_FOCUS = ["ataque", "passe", "dominio", "leitura"]

/** Perfil de referência da Zyron para a posição: 90 nos quatro indicadores-chave, 84 nos demais. */
export function referenceFor(position: string | null) {
  const focus = (position && FOCUS[position]) || DEFAULT_FOCUS
  return { focus, scores: Object.fromEntries(STAT_KEYS.map((s) => [s.key, focus.includes(s.key) ? 90 : 84])) as Record<string, number> }
}

export const TIPS: Record<string, string> = {
  ataque: "Ataque o espaço sem a bola e chegue ao terço final em velocidade.",
  defesa: "Treine a postura defensiva e o tempo do bote: fique entre a bola e o gol.",
  chute: "Finalize de fora da área com as duas pernas, em séries curtas e repetidas.",
  dominio: "Primeiro toque orientado: receba de lado e já saia com a cabeça levantada.",
  marcacao: "Pressão pós-perda: tente recuperar a bola em até 6 segundos.",
  finalizacao: "Conclua em um ou dois toques, de frente e de costas para o gol.",
  drible: "Repita o 1×1 nos dois pés e varie a mudança de direção.",
  passe: "Passes curtos em velocidade e inversões de jogo para o lado oposto.",
  velocidade: "Arrancadas de 10 a 20 m com recuperação completa e técnica de corrida.",
  leitura: "Reveja seus jogos e pause antes da decisão: que opções você tinha?",
}

/* ------------------------------------------------------------------ */
/* Oportunidades (base de clubes da Zyron)                             */
/* ------------------------------------------------------------------ */

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/** 2 = a função que o clube procura é a sua; 1 = função próxima; 0 = sem relação direta. */
export function affinity(position: string | null, style: string): 0 | 1 | 2 {
  if (!position) return 0
  const s = norm(style)
  const p = norm(position)
  const has = (...words: string[]) => words.some((w) => s.includes(w))
  if (p === "goleiro") return has("goleiro") ? 2 : 0
  if (p.startsWith("lateral")) return has("lateral") ? 2 : 0
  if (p === "zagueiro") return has("zagueiro") ? 2 : has("volante") ? 1 : 0
  if (p === "volante") return has("volante") ? 2 : has("meio", "meia", "zagueiro") ? 1 : 0
  if (p === "meio-campo") return has("meio-campo", "meio campo") ? 2 : has("meia", "volante") ? 1 : 0
  if (p === "meia-atacante") return has("meia-atacante") ? 2 : has("meia", "ponta", "meio") ? 1 : 0
  if (p.startsWith("ponta")) return has("ponta") ? 2 : has("atacante") ? 1 : 0
  if (p === "centroavante") return has("centroavante") ? 2 : has("atacante") ? 1 : 0
  return 0
}

export type ClubFit = { club: Club; affinity: 0 | 1 | 2 }

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) hash = (hash * 33) ^ str.charCodeAt(i)
  return Math.abs(hash)
}

export type Opportunities = {
  international: boolean
  /** O mesmo clube e a mesma compatibilidade da tela /match. */
  highlight: { club: Club; compatibility: number } | null
  list: ClubFit[]
  /** Clubes da base com função igual ou próxima da sua, e as vagas abertas nesses clubes. */
  related: { clubs: number; vacancies: number }
}

export function opportunitiesFor(account: AthleteAccount, category: string | null): Opportunities {
  const international = category === "Sub 20"
  const pool = getAllClubs().filter((c) => (c.country === "Brasil") !== international)
  const fits: ClubFit[] = pool.map((club) => ({ club, affinity: affinity(account.position, club.preferredStyle) }))
  const related = fits.filter((f) => f.affinity > 0)
  const seed = hashString(account.userId ?? account.seed)
  const highlight = account.hasProfile
    ? { club: international ? getClubBySeed(seed) : getBrazilianClubBySeed(seed), compatibility: 93 + (seed % 3) }
    : null
  const list = fits
    .filter((f) => f.club.id !== highlight?.club.id)
    // Mesma função primeiro; dentro do grupo, mais vagas e uma ordem estável por pessoa.
    .sort((a, b) => b.affinity - a.affinity || b.club.openPositions - a.club.openPositions || (hashString(`${seed}-${a.club.id}`) % 997) - (hashString(`${seed}-${b.club.id}`) % 997))
    .slice(0, 6)
  return {
    international,
    highlight,
    list,
    related: { clubs: related.length, vacancies: related.reduce((a, f) => a + f.club.openPositions, 0) },
  }
}

/* ------------------------------------------------------------------ */
/* Nível, conquistas e missões                                         */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  { title: "Estreante", at: 0 },
  { title: "Aspirante", at: 150 },
  { title: "Promessa", at: 350 },
  { title: "Destaque", at: 600 },
  { title: "Craque", at: 900 },
  { title: "Elite", at: 1250 },
  { title: "Lenda", at: 1600 },
] as const

const FIELDS: { label: string; filled: (a: AthleteAccount) => boolean }[] = [
  { label: "Posição", filled: (a) => Boolean(a.position) },
  { label: "Idade", filled: (a) => a.age !== null },
  { label: "Altura", filled: (a) => a.heightCm !== null },
  { label: "Peso", filled: (a) => a.weightKg !== null },
  { label: "Melhor pé", filled: (a) => Boolean(a.foot) },
  { label: "Nacionalidade", filled: (a) => Boolean(a.nationality) },
  { label: "Cidade", filled: (a) => Boolean(a.city) },
]

export function completion(a: AthleteAccount) {
  const missing = FIELDS.filter((f) => !f.filled(a)).map((f) => f.label)
  return { done: FIELDS.length - missing.length, total: FIELDS.length, missing, pct: Math.round(((FIELDS.length - missing.length) / FIELDS.length) * 100) }
}

export type Cta = { label: string; to?: string; whatsapp?: string }

export type Badge = {
  key: string
  title: string
  desc: string
  icon: LucideIcon
  progress: number
  target: number
  earned: boolean
  /** "Conta" vem do cadastro; "Jogo" vem das partidas analisadas. */
  group: "Conta" | "Jogo"
  xp: number
}

export type Mission = { key: string; title: string; desc: string; progress: number; target: number; done: boolean; xp: number; cta?: Cta }

export type Game = {
  xp: number
  level: number
  title: string
  next: { title: string; at: number } | null
  /** XP dentro do nível atual e o que falta para o próximo. */
  into: number
  span: number
  pct: number
  badges: Badge[]
  missions: Mission[]
  completion: ReturnType<typeof completion>
}

/** Maior sequência de jogos seguidos com nota 7 ou mais (do mais antigo ao mais recente). */
function bestStreak(summary: ProfileSummary | null) {
  if (!summary) return 0
  let best = 0
  let run = 0
  for (const m of [...summary.matches].reverse()) {
    run = m.rating >= 7 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

export function gameOf(account: AthleteAccount, summary: ProfileSummary | null): Game {
  const comp = completion(account)
  const t = summary?.total
  const matches = summary?.matches.length ?? 0
  const passPct = t && t.passes ? (t.passesOk / t.passes) * 100 : 0
  const streak = bestStreak(summary)
  const actions = summary?.events.length ?? 0

  const badges: Badge[] = [
    { key: "perfil", title: "Perfil completo", desc: "Preencha os 7 dados do seu perfil.", icon: ClipboardCheck, progress: comp.done, target: comp.total, earned: comp.done === comp.total, group: "Conta", xp: 0 },
    { key: "foto", title: "Cara de craque", desc: "Coloque a sua foto no perfil.", icon: Camera, progress: account.avatarUrl ? 1 : 0, target: 1, earned: Boolean(account.avatarUrl), group: "Conta", xp: 0 },
    { key: "acesso", title: "Análise liberada", desc: "A equipe liberou a análise lance a lance dos seus jogos.", icon: BadgeCheck, progress: summary ? 1 : 0, target: 1, earned: Boolean(summary), group: "Conta", xp: 0 },
    { key: "primeiro", title: "Primeiro jogo analisado", desc: "Tenha uma partida sua analisada pela equipe.", icon: Video, progress: Math.min(matches, 1), target: 1, earned: matches >= 1, group: "Jogo", xp: 0 },
    { key: "lance", title: "Lance a lance", desc: "100 ações suas marcadas nos vídeos.", icon: Crosshair, progress: Math.min(actions, 100), target: 100, earned: actions >= 100, group: "Jogo", xp: 60 },
    { key: "sequencia", title: "Em sequência", desc: "3 jogos seguidos com nota 7 ou mais.", icon: Flame, progress: Math.min(streak, 3), target: 3, earned: streak >= 3, group: "Jogo", xp: 60 },
    { key: "passe", title: "Passe de ouro", desc: "80% de passes certos, com pelo menos 50 passes.", icon: Handshake, progress: t && t.passes >= 50 ? Math.min(Math.round(passPct), 80) : Math.min(t?.passes ?? 0, 50), target: t && t.passes >= 50 ? 80 : 50, earned: Boolean(t && t.passes >= 50 && passPct >= 80), group: "Jogo", xp: 60 },
    { key: "gols", title: "Faro de gol", desc: "3 gols nos jogos analisados.", icon: Goal, progress: Math.min(t?.goals ?? 0, 3), target: 3, earned: (t?.goals ?? 0) >= 3, group: "Jogo", xp: 60 },
    { key: "assist", title: "Garçom", desc: "3 assistências nos jogos analisados.", icon: Target, progress: Math.min(t?.assists ?? 0, 3), target: 3, earned: (t?.assists ?? 0) >= 3, group: "Jogo", xp: 60 },
    { key: "muralha", title: "Muralha", desc: "15 desarmes e interceptações certos.", icon: Shield, progress: Math.min((t?.tacklesOk ?? 0) + (t?.interceptions ?? 0), 15), target: 15, earned: (t?.tacklesOk ?? 0) + (t?.interceptions ?? 0) >= 15, group: "Jogo", xp: 60 },
  ]

  const xp =
    100 +
    comp.done * 30 +
    (account.avatarUrl ? 50 : 0) +
    (summary ? 150 : 0) +
    Math.min(matches, 10) * 80 +
    badges.filter((b) => b.earned).reduce((a, b) => a + b.xp, 0)

  let idx = 0
  LEVELS.forEach((l, i) => { if (xp >= l.at) idx = i })
  const next = LEVELS[idx + 1] ?? null
  const into = xp - LEVELS[idx].at
  const span = next ? next.at - LEVELS[idx].at : 1
  const avg = summary?.avgRating ?? 0

  const missions: Mission[] = [
    { key: "perfil", title: "Complete o seu perfil", desc: comp.missing.length ? `Faltam: ${comp.missing.join(", ").toLowerCase()}.` : "Perfil completo.", progress: comp.done, target: comp.total, done: comp.done === comp.total, xp: (comp.total - comp.done) * 30, cta: { label: account.hasProfile ? "Atualizar perfil" : "Criar perfil", to: "/onboarding" } },
    { key: "foto", title: "Coloque a sua foto", desc: "Quem vê o seu perfil guarda mais quem tem rosto.", progress: account.avatarUrl ? 1 : 0, target: 1, done: Boolean(account.avatarUrl), xp: 50, cta: { label: "Adicionar foto", to: "/onboarding" } },
    { key: "acesso", title: "Libere a análise dos seus jogos", desc: "Envie o vídeo de um jogo e a equipe marca cada lance seu.", progress: summary ? 1 : 0, target: 1, done: Boolean(summary), xp: 150, cta: { label: "Falar com a equipe", whatsapp: `Olá! Sou ${account.name} e quero a análise lance a lance dos meus jogos na Zyron.` } },
    { key: "tres", title: "Chegue a 3 jogos analisados", desc: "Com 3 jogos, a equipe já enxerga o seu padrão.", progress: Math.min(matches, 3), target: 3, done: matches >= 3, xp: 80 * Math.max(0, 3 - matches), cta: summary ? { label: "Enviar outro vídeo", whatsapp: `Olá! Sou ${account.name} e quero enviar o vídeo de mais um jogo para a análise.` } : undefined },
    { key: "nota", title: "Suba a nota média para 7,0", desc: "A nota vem das suas ações marcadas em cada jogo.", progress: Math.min(Math.round(avg * 10), 70), target: 70, done: avg >= 7, xp: 0 },
    { key: "streak", title: "Faça 3 jogos seguidos com nota 7+", desc: "Constância é o que o clube procura.", progress: Math.min(streak, 3), target: 3, done: streak >= 3, xp: 60 },
  ]

  return {
    xp, level: idx + 1, title: LEVELS[idx].title, next, into, span, pct: next ? Math.round((into / span) * 100) : 100,
    badges, missions, completion: comp,
  }
}

/* ------------------------------------------------------------------ */
/* Contato                                                             */
/* ------------------------------------------------------------------ */

export const whatsappLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

/** Mensagem para a equipe com o contexto da pessoa, sem buracos quando falta dado. */
export function teamMessage(account: AthleteAccount, category: string | null, topic: string) {
  const who = [account.position, category].filter(Boolean).join(", ")
  return `Olá! Aqui é ${account.name}${who ? ` (${who})` : ""}. ${topic}`
}
