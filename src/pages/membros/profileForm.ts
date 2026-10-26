/**
 * O formulário do perfil dentro da área do atleta (a missão "Complete o seu perfil"), sem React e sem banco,
 * para ser testado à parte (`npm run test:perfil`): o que já vem preenchido a partir da conta e como o que a
 * pessoa digitou vira a linha de `Atletas`.
 *
 * O formulário é o mesmo do /avaliacao/perfil (src/pages/funnel/FunnelProfile.tsx) e guarda os mesmos campos
 * que o antigo /onboarding gravava: nome, idade, altura, peso, melhor pé, nacionalidade, posição e cidade.
 */
import { z } from "zod"
import { CATEGORIES, COUNTRIES, POSITIONS } from "../../data/football.ts"
import type { PlayerData } from "@/lib/funnel"
import type { AthleteAccount } from "./account"

export type ProfileSource = Pick<AthleteAccount, "name" | "email" | "position" | "age" | "heightCm" | "weightKg" | "foot" | "nationality" | "avatarUrl">

const FEET = ["destro", "canhoto", "ambidestro"]

/**
 * O nome que a conta realmente tem. Sem nada preenchido a conta cai no começo do e-mail ou em "Atleta":
 * isso não é o nome da pessoa, então o campo começa vazio.
 */
export function ownName(a: Pick<ProfileSource, "name" | "email">) {
  const name = a.name.trim()
  const fromEmail = a.email?.split("@")[0]
  return name && name !== "Atleta" && name !== fromEmail ? name : ""
}

/**
 * O que já vem preenchido no formulário: o que a conta e o cadastro da equipe já sabem. Só entra o que o formulário
 * consegue mostrar (uma posição fora da lista apareceria em branco). Estado e cidade ficam de fora de propósito: o
 * banco guarda só a cidade, e a pessoa escolhe os dois de novo no último passo.
 */
export function formFromAccount(a: ProfileSource, category: string | null): Partial<PlayerData> {
  const foot = a.foot?.trim().toLowerCase() ?? ""
  const form: Partial<PlayerData> = {
    name: ownName(a),
    age: a.age ? String(Math.round(a.age)) : "",
    height: a.heightCm ? String(Math.round(a.heightCm)) : "",
    weight: a.weightKg ? String(Math.round(a.weightKg)) : "",
    preferredFoot: FEET.includes(foot) ? foot : "",
    nationality: a.nationality && COUNTRIES.includes(a.nationality) ? a.nationality : "",
    position: a.position && POSITIONS.includes(a.position) ? a.position : "",
    category: category && CATEGORIES.includes(category) ? category : "",
    photo: a.avatarUrl ?? "",
  }
  // O que ficou vazio não sobrescreve o padrão do formulário (a categoria, por exemplo, começa no Sub 16).
  return Object.fromEntries(Object.entries(form).filter(([, v]) => v)) as Partial<PlayerData>
}

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(4).max(100),
  height: z.coerce.number().positive().max(250),
  weight: z.coerce.number().positive().max(300),
  preferredFoot: z.string().trim().min(1).max(30),
  nationality: z.string().trim().min(2).max(80),
  position: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(120),
})

/** Linha de `Atletas` (as mesmas colunas que o /onboarding grava). */
export type AtletaRow = {
  user_id: string
  nome: string
  idade: number
  altura: number
  peso: number
  melhor_pe: string
  nacionalidade: string
  posicao: string
  cidade: string
}

export function atletaRow(userId: string, d: PlayerData): { ok: true; row: AtletaRow } | { ok: false; message: string } {
  const r = schema.safeParse(d)
  if (!r.success) return { ok: false, message: "Revise os campos do perfil antes de salvar." }
  const v = r.data
  return {
    ok: true,
    row: {
      user_id: userId, nome: v.name, idade: v.age, altura: v.height, peso: v.weight, melhor_pe: v.preferredFoot,
      nacionalidade: v.nationality, posicao: v.position, cidade: v.city,
    },
  }
}
