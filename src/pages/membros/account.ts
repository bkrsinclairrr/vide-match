/**
 * Conta do atleta na Zyron, lida do Supabase que o site já usa: `Atletas` (o
 * perfil do onboarding) e `profiles` (nome e foto). É a base da área do
 * cliente para QUALQUER pessoa que entra, tenha ou não acesso liberado à
 * análise de partidas (zyron_members).
 */
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { ageFrom, type Member } from "./model"

export type AthleteAccount = {
  /** Conta do Supabase Auth (null quando só existe o cadastro da equipe). */
  userId: string | null
  /** Linha de `Atletas`, quando a pessoa já fez o onboarding. */
  atletaId: number | null
  email: string | null
  name: string
  firstName: string
  avatarUrl: string | null
  position: string | null
  age: number | null
  heightCm: number | null
  weightKg: number | null
  foot: string | null
  nationality: string | null
  city: string | null
  /** Tem perfil preenchido (onboarding feito ou cadastro da equipe). */
  hasProfile: boolean
  /** Semente estável dos indicadores: a mesma da tela /analysis (id da conta). */
  seed: string
}

type AtletaRow = {
  id: number
  user_id: string | null
  nome: string | null
  idade: number | null
  altura: number | null
  peso: number | null
  melhor_pe: string | null
  nacionalidade: string | null
  posicao: string | null
  cidade: string | null
}

type ProfileRow = { full_name: string | null; avatar_url: string | null }

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null)
const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null)
const https = (v: string | null | undefined) => (v && /^https:\/\//.test(v) ? v : null)

function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] || "Atleta"
}

function build(userId: string | null, row: AtletaRow | null, profile: ProfileRow | null, extra: { email?: string | null; metaName?: string | null; metaAvatar?: string | null }): AthleteAccount {
  const name = clean(row?.nome) ?? clean(profile?.full_name) ?? clean(extra.metaName) ?? clean(extra.email?.split("@")[0]) ?? "Atleta"
  return {
    userId,
    atletaId: row?.id ?? null,
    email: extra.email ?? null,
    name,
    firstName: firstNameOf(name),
    avatarUrl: https(profile?.avatar_url) ?? https(extra.metaAvatar),
    position: clean(row?.posicao),
    age: num(row?.idade),
    heightCm: num(row?.altura),
    weightKg: num(row?.peso),
    foot: clean(row?.melhor_pe),
    nationality: clean(row?.nacionalidade),
    city: clean(row?.cidade),
    hasProfile: Boolean(row),
    seed: userId ?? `atleta:${row?.id ?? "novo"}`,
  }
}

async function readAccount(userId: string, extra: { email?: string | null; metaName?: string | null; metaAvatar?: string | null }) {
  const [atleta, profile] = await Promise.all([
    supabase.from("Atletas").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
  ])
  if (atleta.error) throw new Error(atleta.error.message)
  return build(userId, (atleta.data?.[0] as AtletaRow | undefined) ?? null, (profile.data as ProfileRow | null) ?? null, extra)
}

/** Perfil de quem está logado: `Atletas` (dono, pela RLS) + `profiles`. */
export async function loadOwnAccount(user: User): Promise<AthleteAccount> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  return readAccount(user.id, {
    email: user.email ?? null,
    metaName: typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : null,
    metaAvatar: typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : null,
  })
}

/** Admin vendo a conta de um membro (a RLS libera `Atletas` e `profiles` para admins). */
export const loadAccountByUserId = (userId: string, email?: string | null) => readAccount(userId, { email })

/** Admin vendo uma conta como o atleta (a RLS libera `Atletas` e `profiles` para admins). */
export async function loadAccountByAtletaId(id: number): Promise<AthleteAccount | null> {
  const { data, error } = await supabase.from("Atletas").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const row = data as AtletaRow
  const profile = row.user_id ? await supabase.from("profiles").select("full_name, avatar_url").eq("id", row.user_id).maybeSingle() : null
  return build(row.user_id, row, (profile?.data as ProfileRow | null) ?? null, {})
}

/** Completa a conta com o cadastro da equipe (zyron_members), sem sobrescrever o que o atleta preencheu. */
export function withMember(account: AthleteAccount | null, member: Member): AthleteAccount {
  const age = ageFrom(member.birthDate)
  const base: AthleteAccount = account ?? {
    userId: member.userId, atletaId: null, email: member.email, name: member.fullName, firstName: firstNameOf(member.fullName),
    avatarUrl: null, position: null, age: null, heightCm: null, weightKg: null, foot: null, nationality: null, city: null,
    hasProfile: true, seed: member.userId ?? `membro:${member.id}`,
  }
  return {
    ...base,
    email: base.email ?? member.email,
    avatarUrl: base.avatarUrl ?? https(member.photoUrl),
    position: base.position ?? member.position,
    age: base.age ?? age,
    heightCm: base.heightCm ?? member.heightCm,
    weightKg: base.weightKg ?? member.weightKg,
    foot: base.foot ?? member.foot,
    city: base.city ?? member.city,
    hasProfile: true,
  }
}
