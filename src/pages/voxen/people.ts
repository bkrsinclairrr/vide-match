/**
 * Uma pessoa, um registro. A base da VOXEN junta três origens que se sobrepõem:
 *   - o lead do funil (funnel_leads), com o perfil que a pessoa digitou;
 *   - a conta de atleta (Atletas), criada depois, com o MESMO e-mail do lead;
 *   - o membro (zyron_members), cadastrado pela equipe ou pelo CRM, com a ficha mais completa.
 * Sem juntar, quem tem lead e conta aparece duas vezes em Jogadores (foi o caso do Juan Dérick Kretzer) e quem tem
 * o dado só no membro aparece com a linha vazia. Nada é inventado aqui: a pessoa fica com os dados que já tem e o
 * que falta é completado SÓ com o que outra origem dela de fato guarda.
 *
 * Só funções puras e tipos (sem banco e sem tela), para serem testadas à parte: `npm run test:pessoas`.
 */
import type { Player, Profile } from "./data"

/** O que interessa do membro (zyron_members) para completar o jogador. */
export type MemberRow = {
  id: string
  userId: string | null
  email: string | null
  birthDate: string | null
  position: string | null
  category: string | null
  team: string | null
  city: string | null
  heightCm: number | null
  weightKg: number | null
  foot: string | null
  nationality: string | null
  leadId: string | null
}

/** Conta de atleta e lead que são a mesma pessoa (mesmo e-mail). Só o banco sabe: o e-mail da conta não chega à tela. */
export type PlayerLink = { atletaId: number; leadId: string }

/** Nome para comparar: sem acento, sem pontuação, sem maiúsculas, sem espaço sobrando. */
export const normName = (s: string | null | undefined): string =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const JUNK_TEAMS = new Set(["sim", "nao", "s", "n", "nenhum", "nenhuma", "sem clube", "sem time", "nao tenho", "x", "-"])

/** Respostas que não são nome de time ("Sim" à pergunta "está em algum clube?"). */
export const isJunkTeam = (s: string | null | undefined): boolean => {
  const t = normName(s)
  return !t || JUNK_TEAMS.has(t)
}

/** Idade em anos completos a partir do nascimento (AAAA-MM-DD). Data impossível ou fora de 4 a 60 anos: nada. */
export function ageFromBirth(iso: string | null | undefined, today: Date = new Date()): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return undefined
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return undefined
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1
  return age >= 4 && age <= 60 ? age : undefined
}

const has = (v: unknown) => v !== undefined && v !== null && v !== ""

/** Preenche só o que falta em `base` com o que `from` tem. Devolve o perfil novo e quantos campos foram preenchidos. */
export function fillGaps(base: Profile, from: Partial<Profile>): { profile: Profile; filled: number } {
  const profile: Profile = { ...base }
  let filled = 0
  for (const key of Object.keys(from) as (keyof Profile)[]) {
    if (!has(profile[key]) && has(from[key])) {
      ;(profile as Record<string, unknown>)[key] = from[key]
      filled += 1
    }
  }
  return { profile, filled }
}

/** O jogador tem algum dado de perfil de verdade (os que importam para dizer "tem perfil"). */
export const hasAnyProfile = (p: Profile) => Boolean(p.position || p.category || p.age || p.city || p.birthDate)

/** O perfil só com o que veio da pessoa (sem os campos estimados). */
export function realProfileOf(p: Pick<Player, "profile" | "estimated">): Profile {
  if (!p.estimated?.length) return p.profile
  const out: Profile = { ...p.profile }
  for (const k of p.estimated) delete out[k]
  return out
}

function memberProfile(m: MemberRow, today: Date): Partial<Profile> {
  return {
    position: m.position ?? undefined,
    category: m.category ?? undefined,
    city: m.city ?? undefined,
    height: m.heightCm ?? undefined,
    weight: m.weightKg ?? undefined,
    foot: m.foot ?? undefined,
    nationality: m.nationality ?? undefined,
    team: isJunkTeam(m.team) ? undefined : (m.team ?? undefined),
    birthDate: m.birthDate ?? undefined,
    age: ageFromBirth(m.birthDate, today),
  }
}

const emailKey = (e: string | null | undefined) => (e ?? "").trim().toLowerCase()

export type MergeReport = {
  /** Contas de atleta que eram a mesma pessoa de um lead (ou de outra conta) e passaram a aparecer juntas. */
  mergedAccounts: number
  /** Jogadores que têm membro ligado. */
  withMember: number
  /** Campos do perfil que estavam vazios e foram completados com dado real do membro ou da conta. */
  filledFields: number
}

/** Junta `account` em `main`: o perfil de `main` manda, a conta só completa o que falta. */
function absorb(main: Player, account: Player, report: MergeReport) {
  const filled = fillGaps(main.profile, account.profile)
  report.filledFields += filled.filled
  main.profile = filled.profile
  main.aliases = [...new Set([...main.aliases, account.key, ...account.aliases])]
  main.userId = main.userId ?? account.userId ?? null
  if (account.createdAt < main.createdAt) main.createdAt = account.createdAt
  // O nome do lead pode ser só o começo do e-mail (quando a pessoa não digitou nome).
  const fallbackName = main.email ? main.email.split("@")[0] : ""
  if ((!main.name || main.name === fallbackName) && account.name && account.name !== "Atleta") main.name = account.name
  // Etapa, notas e avaliação: vale o que foi mexido por último; nota que só um dos dois tem não se perde.
  const accountNewer = (account.meta.updatedAt ?? "") > (main.meta.updatedAt ?? "")
  const notes = (accountNewer ? account.meta.notes || main.meta.notes : main.meta.notes || account.meta.notes) || ""
  main.meta = { ...(accountNewer ? account.meta : main.meta), notes }
  // Relatório: o salvo no funil; sem ele, o da conta (o mesmo que a pessoa vê na área dela).
  if (!main.reportFromFunnel && account.reportFromFunnel) {
    main.stats = account.stats
    main.overall = account.overall
    main.reportFromFunnel = true
  }
}

/**
 * Junta lead, conta e membro da mesma pessoa. A pessoa fica com a chave do lead (a conta vira apelido em `aliases`,
 * e os endereços antigos continuam abrindo). O perfil só ganha o que estava vazio.
 *
 * Só junta o que é CERTO: mesma conta de login, ou o mesmo e-mail. Nome igual com e-mail diferente pode ser
 * homônimo: isso não é juntado, é sinalizado por `findDuplicates` para a equipe decidir.
 */
export function mergePeople(
  players: Player[],
  links: PlayerLink[],
  members: MemberRow[],
  today: Date = new Date(),
): { players: Player[]; report: MergeReport } {
  const report: MergeReport = { mergedAccounts: 0, withMember: 0, filledFields: 0 }
  const byKey = new Map<string, Player>()
  for (const p of players) byKey.set(p.key, { ...p, aliases: [...(p.aliases ?? [])], profile: { ...p.profile }, estimated: [] })
  const consumed = new Set<string>()

  // 1) Duas linhas de conta da mesma pessoa (mesmo login): a mais antiga fica.
  const firstOfUser = new Map<string, Player>()
  const accounts = [...byKey.values()].filter((p) => p.key.startsWith("atleta:")).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (const a of accounts) {
    if (!a.userId) continue
    const first = firstOfUser.get(a.userId)
    if (!first) firstOfUser.set(a.userId, a)
    else {
      absorb(first, a, report)
      consumed.add(a.key)
      report.mergedAccounts += 1
    }
  }

  // 2) A conta que tem o mesmo e-mail de um lead entra no lead.
  for (const link of links) {
    const lead = byKey.get(`lead:${link.leadId}`)
    const account = byKey.get(`atleta:${link.atletaId}`)
    if (!lead || !account || consumed.has(account.key)) continue
    absorb(lead, account, report)
    consumed.add(account.key)
    report.mergedAccounts += 1
  }

  // 3) O membro completa o que falta.
  const byLead = new Map<string, MemberRow>()
  const byUser = new Map<string, MemberRow>()
  const byEmail = new Map<string, MemberRow>()
  for (const m of members) {
    if (m.leadId) byLead.set(m.leadId, m)
    if (m.userId) byUser.set(m.userId, m)
    if (m.email) byEmail.set(emailKey(m.email), m)
  }
  const out: Player[] = []
  for (const p of byKey.values()) {
    if (consumed.has(p.key)) continue
    const member =
      (p.key.startsWith("lead:") ? byLead.get(p.key.slice(5)) : undefined) ??
      (p.userId ? byUser.get(p.userId) : undefined) ??
      p.aliases.map((a) => (a.startsWith("lead:") ? byLead.get(a.slice(5)) : undefined)).find(Boolean) ??
      (p.email ? byEmail.get(emailKey(p.email)) : undefined)
    if (member) {
      const filled = fillGaps(p.profile, memberProfile(member, today))
      p.profile = filled.profile
      report.filledFields += filled.filled
      report.withMember += 1
      p.memberId = member.id
      p.userId = p.userId ?? member.userId ?? null
    }
    // A idade vem do nascimento quando ele existe (é exata e não envelhece sozinha).
    const exact = ageFromBirth(p.profile.birthDate, today)
    if (exact !== undefined) p.profile.age = exact
    p.hasProfile = hasAnyProfile(p.profile)
    out.push(p)
  }
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { players: out, report }
}

/** Todos os endereços de um jogador: o principal e os dos registros que foram juntados a ele. */
export const keysOf = (p: Pick<Player, "key" | "aliases">): string[] => [p.key, ...p.aliases]

/** O jogador é dono de uma conta de atleta (login)? */
export const hasAccount = (p: Pick<Player, "key" | "aliases" | "userId" | "source">): boolean =>
  p.source === "conta" || Boolean(p.userId) || p.aliases.some((a) => a.startsWith("atleta:"))

/* ------------------------------------------------------------------ */
/* Possíveis duplicados                                                */
/* ------------------------------------------------------------------ */

export type DupGroup = {
  id: string
  keys: string[]
  /** Mesmo nome e mesmo telefone: quase certo. Só o nome: pode ser homônimo. */
  strong: boolean
  reason: string
}

const phoneKey = (p: Pick<Player, "phone">): string => {
  const d = (p.phone ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")
  return d.length >= 8 ? d.slice(-9) : ""
}

/**
 * Pessoas que ainda aparecem mais de uma vez depois da junção. Só conta nome com 2 palavras ou mais (um "João" sozinho
 * não prova nada). Telefone igual com nomes diferentes não é duplicado (irmãos usam o telefone do responsável).
 */
export function findDuplicates(players: Pick<Player, "key" | "name" | "phone">[]): { groups: DupGroup[]; byKey: Map<string, DupGroup> } {
  const byName = new Map<string, Pick<Player, "key" | "name" | "phone">[]>()
  for (const p of players) {
    const n = normName(p.name)
    if (n.split(" ").filter(Boolean).length < 2) continue
    const list = byName.get(n)
    if (list) list.push(p)
    else byName.set(n, [p])
  }
  const groups: DupGroup[] = []
  const byKey = new Map<string, DupGroup>()
  for (const [name, list] of byName) {
    if (list.length < 2) continue
    const phones = list.map(phoneKey).filter(Boolean)
    const strong = new Set(phones).size < phones.length
    const group: DupGroup = {
      id: name.replace(/ /g, "-"),
      keys: list.map((p) => p.key),
      strong,
      reason: strong ? "mesmo nome e mesmo telefone" : "mesmo nome",
    }
    groups.push(group)
    for (const k of group.keys) byKey.set(k, group)
  }
  groups.sort((a, b) => Number(b.strong) - Number(a.strong) || b.keys.length - a.keys.length || a.id.localeCompare(b.id))
  return { groups, byKey }
}

/* ------------------------------------------------------------------ */
/* Dados básicos                                                       */
/* ------------------------------------------------------------------ */

export type Basic = "idade" | "posição" | "categoria" | "cidade" | "time"

/** Os quatro que fazem um jogador "completo". O time conta a mais, mas não é exigido (quase ninguém informa). */
export const CORE_BASICS: Basic[] = ["idade", "posição", "categoria", "cidade"]
export const ALL_BASICS: Basic[] = [...CORE_BASICS, "time"]

export type Completeness = {
  have: Basic[]
  missing: Basic[]
  /** Quantos dos quatro essenciais estão preenchidos (0 a 4). */
  core: number
  complete: boolean
  /** Para ordenar: quem tem mais dados vem primeiro (0 a 108). */
  score: number
}

/** Quanto do perfil já veio da pessoa. Passe o perfil REAL (`realProfileOf`) para não contar o que foi estimado. */
export function completenessOf(pr: Profile): Completeness {
  const present: Record<Basic, boolean> = {
    idade: has(pr.age) || has(pr.birthDate),
    posição: has(pr.position),
    categoria: has(pr.category),
    cidade: has(pr.city) || has(pr.state),
    time: has(pr.team) && !isJunkTeam(pr.team),
  }
  const have = ALL_BASICS.filter((b) => present[b])
  const missing = ALL_BASICS.filter((b) => !present[b])
  const core = CORE_BASICS.filter((b) => present[b]).length
  return { have, missing, core, complete: core === CORE_BASICS.length, score: core * 25 + (present.time ? 8 : 0) }
}

/** "falta idade e cidade". */
export const missingLabel = (c: Completeness): string => {
  const miss = c.missing.filter((b) => CORE_BASICS.includes(b))
  if (!miss.length) return c.missing.includes("time") ? "falta só o time" : "completo"
  return `falta ${miss.length === 1 ? miss[0] : `${miss.slice(0, -1).join(", ")} e ${miss[miss.length - 1]}`}`
}
