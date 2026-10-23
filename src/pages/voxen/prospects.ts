/**
 * Pré-cadastros do CRM em Jogadores. O pré-cadastro é um lead da wsltda.com que ainda não se cadastrou na plataforma:
 * existe só em Importados. Depois que a equipe o aprova, ele também aparece em Jogadores, com a chave
 * 'crm:<id do lead no CRM>', sem criar nada (atleta, membro, lead do funil) e sem contato nenhum: não há e-mail nem
 * telefone dele aqui. Os dados continuam vindo do CRM, por isso não se editam na VOXEN.
 *
 * Quando a pessoa se cadastra e vira membro, o pré-cadastro é ligado ao membro: a chave 'crm:' vira apelido do
 * jogador de verdade, para os links antigos abrirem e as anotações feitas antes não se perderem.
 *
 * Só funções puras e tipos (sem banco e sem tela), para serem testadas à parte: `npm run test:pessoas`.
 */
import type { Player, PlayerMeta, Profile } from "./data"
import { ageFromBirth, hasAnyProfile, isJunkTeam } from "./people.ts"

/** Um pré-cadastro aprovado (ou já ligado a um membro), como o banco devolve para a equipe. */
export type ProspectRow = {
  crmLeadId: string
  name: string | null
  guardianName: string | null
  birthDate: string | null
  position: string | null
  category: string | null
  team: string | null
  city: string | null
  firstAt: string | null
  approvedAt: string | null
  /** Já virou membro: a pessoa aparece em Jogadores pelo cadastro dela, e esta linha só liga as chaves. */
  linkedMemberId: string | null
}

export const CRM_ORIGIN = "CRM (pré-cadastro)"

export const crmKey = (id: string) => `crm:${id}`

export const isCrmKey = (key: string) => key.startsWith("crm:")

/** O pré-cadastro do CRM (e não um lead do funil ou uma conta): os dados vêm de lá e não se editam aqui. */
export const isProspect = (p: Pick<Player, "source">) => p.source === "crm"

/** O id do lead no CRM, a partir da chave do jogador (para abrir em Importados). */
export const crmLeadIdOf = (p: Pick<Player, "key">) => (isCrmKey(p.key) ? p.key.slice(4) : null)

export const PROSPECT_EDIT_HINT = "Os dados deste pré-cadastro vêm do CRM (wsltda.com) e são atualizados por lá. Quando a pessoa se cadastrar na plataforma, eles passam a ser editáveis aqui."

const text = (v: string | null | undefined) => (v && v.trim() ? v.trim().replace(/\s+/g, " ") : undefined)

/** O nome que aparece: o do atleta; sem ele, deixa claro de quem é o contato (o responsável que respondeu o formulário). */
export function prospectName(r: Pick<ProspectRow, "name" | "guardianName">): string {
  const name = text(r.name)
  if (name) return name
  const guardian = text(r.guardianName)
  return guardian ? `Atleta sem nome (responsável: ${guardian})` : "Atleta sem nome"
}

/** O perfil só com o que o CRM mandou. A idade sai do nascimento (exata, e não envelhece sozinha). */
export function prospectProfile(r: ProspectRow, today: Date = new Date()): Profile {
  const birthDate = r.birthDate && /^\d{4}-\d{2}-\d{2}/.test(r.birthDate) ? r.birthDate.slice(0, 10) : undefined
  const team = text(r.team)
  const profile: Profile = {
    birthDate,
    age: ageFromBirth(birthDate, today),
    position: text(r.position),
    category: text(r.category),
    team: team && !isJunkTeam(team) ? team : undefined,
    city: text(r.city),
  }
  for (const k of Object.keys(profile) as (keyof Profile)[]) if (profile[k] === undefined) delete profile[k]
  return profile
}

/** O jogador a partir do pré-cadastro, menos o relatório e a etapa (quem chama completa). */
export function prospectBase(r: ProspectRow, today: Date = new Date()): Omit<Player, "stats" | "overall" | "reportFromFunnel" | "meta"> {
  const profile = prospectProfile(r, today)
  return {
    key: crmKey(r.crmLeadId),
    source: "crm",
    aliases: [],
    memberId: null,
    estimated: [],
    userId: null,
    name: prospectName(r),
    guardianName: text(r.guardianName) ?? null,
    email: null,
    phone: null,
    createdAt: r.firstAt ?? r.approvedAt ?? today.toISOString(),
    profile,
    hasProfile: hasAnyProfile(profile),
    origin: CRM_ORIGIN,
    utm: { source: null, medium: null, campaign: null, content: null, term: null },
  }
}

/** Os que viram jogador: aprovados e ainda pré-cadastro (sem membro ligado). */
export const openProspects = (rows: ProspectRow[]) => rows.filter((r) => !r.linkedMemberId && r.approvedAt)

/**
 * Quem já virou membro: a chave 'crm:' vira apelido do jogador desse membro. Se o jogador ainda não tem etapa nem notas
 * e o pré-cadastro tinha, elas passam para ele (o que a equipe anotou antes do cadastro não se perde).
 */
export function attachLinkedProspects(players: Player[], rows: ProspectRow[], metaByKey: Map<string, PlayerMeta>): Player[] {
  const byMember = new Map<string, string[]>()
  for (const r of rows) {
    if (!r.linkedMemberId) continue
    const list = byMember.get(r.linkedMemberId) ?? []
    list.push(crmKey(r.crmLeadId))
    byMember.set(r.linkedMemberId, list)
  }
  if (!byMember.size) return players
  return players.map((p) => {
    const keys = p.memberId ? byMember.get(p.memberId) : undefined
    if (!keys) return p
    const fresh = keys.filter((k) => k !== p.key && !p.aliases.includes(k))
    if (!fresh.length) return p
    const inherited = !p.meta.updatedAt ? fresh.map((k) => metaByKey.get(k)).find((m) => m && m.updatedAt) : undefined
    return { ...p, aliases: [...p.aliases, ...fresh], meta: inherited ?? p.meta }
  })
}
