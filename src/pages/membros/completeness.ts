/**
 * Ficha completa do membro: uma regra só, usada pela Mesa do Scout (percentual e pendências) e
 * por quem mais precisar saber o que falta. São os dados que a equipe precisa para apresentar o
 * atleta a um clube.
 */
import type { Member } from "./model"

const FIELDS: { label: string; filled: (m: Member) => boolean }[] = [
  { label: "Nome", filled: (m) => m.fullName.trim().split(/\s+/).length >= 2 },
  { label: "E-mail", filled: (m) => Boolean(m.email) },
  { label: "Telefone", filled: (m) => Boolean(m.phone) },
  { label: "Nascimento", filled: (m) => Boolean(m.birthDate) },
  { label: "Posição", filled: (m) => Boolean(m.position) },
  { label: "Categoria", filled: (m) => Boolean(m.category) },
  { label: "Pé", filled: (m) => Boolean(m.foot) },
  { label: "Altura", filled: (m) => m.heightCm !== null },
  { label: "Peso", filled: (m) => m.weightKg !== null },
  { label: "Cidade", filled: (m) => Boolean(m.city) },
  { label: "Nacionalidade", filled: (m) => Boolean(m.nationality) },
  { label: "Time", filled: (m) => Boolean(m.team) },
  { label: "Foto", filled: (m) => Boolean(m.photoUrl) },
]

export type Completeness = { done: number; total: number; pct: number; missing: string[] }

export function completenessOf(m: Member): Completeness {
  const missing = FIELDS.filter((f) => !f.filled(m)).map((f) => f.label)
  const done = FIELDS.length - missing.length
  return { done, total: FIELDS.length, pct: Math.round((done / FIELDS.length) * 100), missing }
}
