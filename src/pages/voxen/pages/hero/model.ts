/**
 * O cabeçalho da ficha do jogador (o "herói"), sem React e sem banco, para ser testado à parte (`npm run test:ficha`):
 * como o nome se divide, quais dados entram nos quadradinhos, qual foto aparece (a de corpo inteiro ou a redonda) e o
 * que a equipe pode fazer com ela.
 */
import type { ClubRef } from "@/pages/membros/scoutLayer"
import type { Controls } from "../scout/api"
import type { Look } from "../media/api"
import type { Player, Profile } from "../../data"

/** "Gabriel Rocha da Silva" → primeiro nome e o resto (o sobrenome, em destaque). Nome só: o resto vem vazio. */
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first: "Atleta", last: "" }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

const capital = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s)

export type Fact = {
  key: "category" | "age" | "height" | "weight" | "foot"
  label: string
  value: number | string
  /** Unidade pequena ao lado do número ("anos", "cm", "kg"). */
  unit?: string
  /** O campo do perfil, para marcar como estimado quando a pessoa ainda não informou. */
  est?: keyof Profile
}

/** Os dados que viram quadradinhos no alto da ficha: só os que existem (o resto fica nos "Dados do atleta"). */
export function heroFacts(p: Pick<Player, "profile">): Fact[] {
  const f = p.profile
  const out: Fact[] = []
  if (f.category) out.push({ key: "category", label: "Categoria", value: f.category, est: "category" })
  if (f.age) out.push({ key: "age", label: "Idade", value: f.age, unit: "anos", est: "age" })
  if (f.height) out.push({ key: "height", label: "Altura", value: f.height, unit: "cm", est: "height" })
  if (f.weight) out.push({ key: "weight", label: "Peso", value: f.weight, unit: "kg", est: "weight" })
  if (f.foot) out.push({ key: "foot", label: "Melhor pé", value: capital(f.foot.trim()), est: "foot" })
  return out
}

/** A cor do clube do uniforme (#rrggbb) ou o dourado da VOXEN. */
export const GOLD = "#fbbf24"
export const accentOf = (color: string | null | undefined) => (color && /^#[0-9a-f]{6}$/i.test(color) ? color : GOLD)

/** "#0b6b3a" → "11, 107, 58", para usar com transparência no CSS. */
export function rgbOf(hex: string) {
  const n = Number.parseInt(accentOf(hex).slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

/** A foto do jogador depois que a equipe mexeu nela (o mesmo que o banco devolve em `look`: corpo inteiro só com a foto enviada). */
export function lookFromControls(
  prev: Look,
  c: Pick<Controls, "bodyPhotoUrl" | "bodyPhotoSmallUrl" | "bodyPhotoStyle" | "bodyPhotoOn" | "photoChoiceBy" | "photoChoiceAt">,
  kit: ClubRef | null,
): Look {
  const body = c.bodyPhotoUrl ? { url: c.bodyPhotoUrl, smallUrl: c.bodyPhotoSmallUrl, style: c.bodyPhotoStyle, kit } : null
  return { ...prev, body, mode: body && c.bodyPhotoOn ? "corpo" : "perfil", choiceBy: c.photoChoiceBy, choiceAt: c.photoChoiceAt }
}

export type Visual = {
  /** O que aparece no lado direito do cabeçalho. */
  kind: "loading" | "portrait" | "avatar"
  /** A equipe pode escolher entre a foto de perfil e a de corpo inteiro (precisa ser membro e ter a foto enviada). */
  canSwitch: boolean
  /** A equipe pode enviar ou trocar a foto de corpo inteiro (precisa ser membro). */
  canUpload: boolean
  /** Falta a foto de corpo inteiro e a equipe pode enviar: convite para adicionar. */
  invite: boolean
  /** Equipe, mas o jogador ainda não é membro: a foto de corpo inteiro mora na ficha de membro. */
  needsMember: boolean
}

/** O que mostrar e o que a equipe pode fazer, a partir da foto carregada, do acesso e de o jogador ser (ou não) membro. */
export function visualOf(o: { look: Look | null; canScout: boolean; isMember: boolean }): Visual {
  const staffMember = o.canScout && o.isMember
  const hasBody = Boolean(o.look?.body)
  const kind: Visual["kind"] = !o.look ? "loading" : o.look.mode === "corpo" && o.look.body ? "portrait" : "avatar"
  return {
    kind,
    canSwitch: staffMember && hasBody,
    canUpload: staffMember,
    invite: staffMember && Boolean(o.look) && !hasBody,
    needsMember: o.canScout && !o.isMember,
  }
}
