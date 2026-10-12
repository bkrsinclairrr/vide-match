import { Flame, Snowflake, Sun, type LucideIcon } from "lucide-react"
import { placeOf, type Player } from "@/pages/voxen/data"
import type { Member } from "@/pages/membros/model"

/*
 * Setor Atletas: os atletas que a equipe escolheu para trabalhar com mais cuidado
 * (tabela `zyron_athletes`, migração 20261012120000_setor_atletas.sql).
 */

export type Temperature = "frio" | "morno" | "quente"
export type AthleteOrigin = "funil" | "conta" | "membro" | "manual"

export type Athlete = {
  id: string
  origin: AthleteOrigin
  leadId: string | null
  athleteId: number | null
  memberId: string | null
  fullName: string
  email: string | null
  phone: string | null
  birthDate: string | null
  age: number | null
  nationality: string | null
  position: string | null
  category: string | null
  foot: string | null
  heightCm: number | null
  weightKg: number | null
  city: string | null
  team: string | null
  temperature: Temperature
  forwarded: boolean
  forwardedTo: string | null
  forwardedOn: string | null
  advisory: boolean
  advisorySince: string | null
  nextStep: string | null
  nextStepOn: string | null
  notes: string | null
  sourceCreatedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Dados do atleta que a equipe edita no formulário (o resto é acompanhamento). */
export type AthleteData = Pick<Athlete,
  "fullName" | "email" | "phone" | "birthDate" | "age" | "nationality" | "position" | "category" | "foot" | "heightCm" | "weightKg" | "city" | "team">

export type AthletePatch = Partial<Omit<Athlete, "id" | "createdAt" | "updatedAt">>

/** Ficha nova: dados + de onde veio. O acompanhamento começa no padrão (morno, nada encaminhado). */
export type AthleteDraft = AthleteData & Pick<Athlete, "origin" | "leadId" | "athleteId" | "memberId" | "sourceCreatedAt"> & { temperature?: Temperature }

export const TEMPS: { key: Temperature; label: string; plural: string; hint: string; color: string; icon: LucideIcon }[] = [
  { key: "frio", label: "Frio", plural: "Frios", hint: "Pouco interesse ou sem retorno ainda", color: "#38bdf8", icon: Snowflake },
  { key: "morno", label: "Morno", plural: "Mornos", hint: "Em conversa, ainda sem decisão", color: "#fbbf24", icon: Sun },
  { key: "quente", label: "Quente", plural: "Quentes", hint: "Prioridade: perto de fechar", color: "#fb7185", icon: Flame },
]

export const tempInfo = (t: Temperature) => TEMPS.find((x) => x.key === t) ?? TEMPS[1]
const TEMP_RANK: Record<Temperature, number> = { quente: 0, morno: 1, frio: 2 }
export const tempRank = (t: Temperature) => TEMP_RANK[t]

export const ORIGIN_LABEL: Record<AthleteOrigin, string> = { funil: "Funil", conta: "Conta", membro: "Membro", manual: "Criado no setor" }

/** Endereço do setor na área em que a pessoa está (/admin ou /voxen), opcionalmente já com uma ficha aberta. */
export const sectorPath = (pathname: string, fichaId?: string) =>
  `${pathname.startsWith("/voxen") ? "/voxen" : "/admin"}/atletas${fichaId ? `?ficha=${encodeURIComponent(fichaId)}` : ""}`

export const FEET = ["Destro", "Canhoto", "Ambidestro"]

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

/** Data local no formato do banco (aaaa-mm-dd). */
export function isoDay(d = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDay(d) }

/** "15/10/2026" a partir de "2026-10-15" (sem fuso: a data é do calendário). */
export function dayLabel(day: string | null) {
  if (!day) return ""
  const [y, m, d] = day.split("-")
  return `${d}/${m}/${y}`
}

/** "hoje", "amanhã", "em 3 dias", "há 2 dias". */
export function dayRelative(day: string | null) {
  if (!day) return ""
  const diff = Math.round((new Date(`${day}T12:00:00`).getTime() - new Date(`${isoDay()}T12:00:00`).getTime()) / 86400000)
  if (diff === 0) return "hoje"
  if (diff === 1) return "amanhã"
  if (diff === -1) return "ontem"
  return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`
}

export const isOverdue = (a: Pick<Athlete, "nextStepOn">) => Boolean(a.nextStepOn && a.nextStepOn < isoDay())

/** Idade pela data de nascimento; sem ela, a idade informada no cadastro. */
export function ageOf(a: Pick<Athlete, "birthDate" | "age">) {
  if (a.birthDate) {
    const b = new Date(`${a.birthDate}T12:00:00`)
    const now = new Date()
    let years = now.getFullYear() - b.getFullYear()
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years--
    return years >= 0 && years < 100 ? years : null
  }
  return a.age
}

/* ------------------------------------------------------------------ */
/* De onde a ficha nasce                                               */
/* ------------------------------------------------------------------ */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const clip = (s: string | null | undefined, max: number) => {
  const v = (s ?? "").trim().replace(/\s+/g, " ")
  return v ? v.slice(0, max) : null
}
const within = (n: number | null | undefined, min: number, max: number) => (n != null && n >= min && n <= max ? Math.round(n) : null)
const capitalize = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : null)
export const cleanEmail = (e: string | null | undefined) => {
  const v = (e ?? "").trim().toLowerCase()
  return v && EMAIL.test(v) && v.length <= 254 ? v : null
}
const cleanPhone = (p: string | null | undefined) => {
  const d = (p ?? "").replace(/\D/g, "")
  return d.length >= 8 && d.length <= 15 ? d : null
}

/** Ficha a partir de um cadastro (lead ou conta). `email`: o da conta, que só a lista de contas conhece. */
export function draftFromPlayer(p: Player, email?: string | null): AthleteDraft {
  const lead = p.key.startsWith("lead:")
  return {
    origin: lead ? "funil" : "conta",
    leadId: lead ? p.key.slice(5) : null,
    athleteId: p.key.startsWith("atleta:") ? Number(p.key.slice(7)) : null,
    memberId: null,
    sourceCreatedAt: p.createdAt,
    fullName: clip(p.name, 120) ?? "Atleta",
    email: cleanEmail(email ?? p.email),
    phone: cleanPhone(p.phone),
    birthDate: null,
    age: within(p.profile.age, 4, 60),
    nationality: clip(p.profile.nationality, 60),
    position: clip(p.profile.position, 40),
    category: clip(p.profile.category, 20),
    foot: clip(capitalize(p.profile.foot), 20),
    heightCm: within(p.profile.height, 100, 230),
    weightKg: within(p.profile.weight, 25, 160),
    city: clip(placeOf(p), 80),
    team: null,
  }
}

/** Ficha a partir de um membro (traz junto o lead de origem, se houver). */
export function draftFromMember(m: Member): AthleteDraft {
  return {
    origin: "membro",
    leadId: m.leadId,
    athleteId: null,
    memberId: m.id,
    sourceCreatedAt: m.createdAt,
    fullName: clip(m.fullName, 120) ?? "Atleta",
    email: cleanEmail(m.email),
    phone: null,
    birthDate: m.birthDate,
    age: null,
    nationality: null,
    position: clip(m.position, 40),
    category: clip(m.category, 20),
    foot: clip(m.foot, 20),
    heightCm: within(m.heightCm, 100, 230),
    weightKg: within(m.weightKg, 25, 160),
    city: clip(m.city, 80),
    team: clip(m.team, 80),
  }
}

/** Ficha em branco para criar do zero. */
export const blankData = (): AthleteData => ({
  fullName: "", email: null, phone: null, birthDate: null, age: null, nationality: null, position: null,
  category: null, foot: null, heightCm: null, weightKg: null, city: null, team: null,
})

export const dataOf = (a: Athlete): AthleteData => ({
  fullName: a.fullName, email: a.email, phone: a.phone, birthDate: a.birthDate, age: a.age, nationality: a.nationality,
  position: a.position, category: a.category, foot: a.foot, heightCm: a.heightCm, weightKg: a.weightKg, city: a.city, team: a.team,
})

/** Só os campos de dados (sem vínculos nem acompanhamento). */
export const pickData = (d: AthleteData): AthleteData => ({
  fullName: d.fullName, email: d.email, phone: d.phone, birthDate: d.birthDate, age: d.age, nationality: d.nationality,
  position: d.position, category: d.category, foot: d.foot, heightCm: d.heightCm, weightKg: d.weightKg, city: d.city, team: d.team,
})

/** Junta duas fontes: vale o valor de `first`; `then` só preenche o que ficou vazio. */
export function mergeData(first: AthleteData | null, then: AthleteData | null): AthleteData | null {
  if (!first) return then
  if (!then) return first
  const out = { ...first } as Record<string, unknown>
  for (const [k, v] of Object.entries(then)) if (out[k] === null || out[k] === undefined || out[k] === "") out[k] = v
  return out as AthleteData
}

export const DATA_LABEL: Record<keyof AthleteData, string> = {
  fullName: "Nome", email: "E-mail", phone: "Telefone", birthDate: "Nascimento", age: "Idade", nationality: "Nacionalidade",
  position: "Posição", category: "Categoria", foot: "Melhor pé", heightCm: "Altura", weightKg: "Peso", city: "Cidade", team: "Time",
}

/**
 * O que mudou no cadastro de origem desde que a ficha foi criada: só os campos em que a
 * origem tem valor e ele é diferente do da ficha. A equipe decide se traz ou não.
 */
export function originChanges(a: Athlete, origin: AthleteData | null): Partial<AthleteData> {
  if (!origin) return {}
  const out: Partial<AthleteData> = {}
  for (const k of Object.keys(DATA_LABEL) as (keyof AthleteData)[]) {
    const v = origin[k]
    if (v === null || v === undefined || v === "" || k === "fullName") continue
    if (String(v) !== String(a[k] ?? "")) (out as Record<string, unknown>)[k] = v
  }
  return out
}

/** Ordena: mais quentes primeiro, depois quem tem próximo passo mais perto, depois o nome. */
export function byHeat(a: Athlete, b: Athlete) {
  return tempRank(a.temperature) - tempRank(b.temperature)
    || (a.nextStepOn ?? "9999").localeCompare(b.nextStepOn ?? "9999")
    || a.fullName.localeCompare(b.fullName, "pt-BR")
}

export const whatsappOf = (a: Pick<Athlete, "phone" | "fullName">) => {
  const d = (a.phone ?? "").replace(/\D/g, "")
  if (!d) return null
  const full = d.length <= 11 ? `55${d}` : d
  const first = a.fullName.trim().split(/\s+/)[0] || ""
  return `https://wa.me/${full}?text=${encodeURIComponent(`Olá, ${first}! Aqui é da equipe Zyron.`)}`
}
