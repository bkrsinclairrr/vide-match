import { placeOf, type Player } from "@/pages/voxen/data"
import type { MemberInput } from "@/pages/membros/api"

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const between = (n: number | undefined, min: number, max: number) => (n !== undefined && n >= min && n <= max ? Math.round(n) : null)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

export type MemberDraft = { input: MemberInput } | { skip: "sem-email" | "email-invalido" | "nome-curto" }

/**
 * Monta o perfil de membro a partir de um cadastro (lead do funil ou conta de atleta).
 * Mantém a data em que a pessoa entrou. Altura e peso fora do que o banco aceita
 * (100–230 cm, 25–160 kg) ficam em branco em vez de barrar o cadastro inteiro.
 * `email`: o e-mail do lead, ou o da conta (que só a lista de contas conhece).
 */
export function memberDraftFrom(p: Player, email: string | null): MemberDraft {
  const fullName = p.name.trim().replace(/\s+/g, " ").slice(0, 120)
  if (fullName.length < 2) return { skip: "nome-curto" }
  const mail = (email ?? p.email ?? "").trim().toLowerCase()
  if (!mail) return { skip: "sem-email" }
  if (!EMAIL.test(mail) || mail.length > 254) return { skip: "email-invalido" }
  return {
    input: {
      kind: "membro",
      fullName,
      email: mail,
      birthDate: null,
      position: p.profile.position?.slice(0, 40) ?? null,
      category: p.profile.category?.slice(0, 20) ?? null,
      foot: p.profile.foot ? capitalize(p.profile.foot).slice(0, 20) : null,
      heightCm: between(p.profile.height, 100, 230),
      weightKg: between(p.profile.weight, 25, 160),
      city: placeOf(p)?.slice(0, 80) ?? null,
      team: null,
      photoUrl: null,
      bio: null,
      leadId: p.key.startsWith("lead:") ? p.key.slice(5) : null,
      active: true,
      createdAt: p.createdAt,
    },
  }
}

export const SKIP_LABEL = {
  "sem-email": "sem e-mail",
  "email-invalido": "e-mail inválido",
  "nome-curto": "nome curto demais",
} as const
