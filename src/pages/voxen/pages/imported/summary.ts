/**
 * O resumo do contexto de um importado, em português claro: o que o CRM de fato contou (quem respondeu, clubes, peneiras,
 * objetivo, o que impede, atendimento). Só texto, sem React nem banco, para ser testado à parte (`npm run test:importados`).
 * Posição, categoria, cidade e time são dados básicos, não contexto: ficam de fora daqui.
 */
import type { ImportDetail } from "./api"
import { dayKey, dayLabel } from "./model.ts"

export type SummaryLine = { label: string; text: string }

/** O que o resumo lê do detalhe (um subconjunto, para os testes não precisarem do objeto inteiro). */
export type ContextSource = Pick<
  ImportDetail,
  | "guardianName" | "filledBy" | "currentClub" | "pastClubs" | "trials" | "opportunitiesReceived" | "goal" | "blocker"
  | "evaluatedClubs" | "strengthsAndImprovements" | "commitmentScore" | "crmObservations" | "qualification" | "notes" | "answers"
>

/** Os campos de contexto do formulário (os que o atleta ou o responsável contam). */
const FORM_FIELDS = [
  "currentClub", "pastClubs", "trials", "opportunitiesReceived", "goal", "blocker", "evaluatedClubs", "strengthsAndImprovements", "commitmentScore",
] as const

const NOTE_NAME = { whatsapp_summary: ["resumo de WhatsApp", "resumos de WhatsApp"], manual_note: ["nota do atendimento", "notas do atendimento"], call_transcript: ["transcrição de ligação", "transcrições de ligação"] } as const

const MAX = 240

/** Uma linha só, sem espaços repetidos, cortada na última palavra inteira quando passa do limite. */
export function clip(text: string, max = MAX): string {
  const t = text.replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const sp = cut.lastIndexOf(" ")
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–]+$/, "")}…`
}

const has = (s: string | null | undefined): s is string => typeof s === "string" && s.trim() !== ""
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "9" vira "9 de 10"; qualquer outro texto fica como o CRM mandou ("oito", "8/10"). */
const scoreText = (raw: string): string => (/^\d{1,2}([.,]\d)?$/.test(raw.trim()) ? `${raw.trim()} de 10` : clip(raw, 80))

/** Quantos dos campos de contexto do formulário estão preenchidos (0 a 9). */
export function formFilled(src: ContextSource): number {
  return FORM_FIELDS.filter((k) => has(src[k] as string | null)).length
}
export const FORM_TOTAL = FORM_FIELDS.length

function whoAnswered(src: ContextSource): SummaryLine | null {
  const guardian = has(src.guardianName) ? src.guardianName.trim() : null
  if (src.filledBy === "responsavel") return { label: "Quem respondeu", text: guardian ? `O responsável (${guardian})` : "O responsável" }
  if (src.filledBy === "atleta") return { label: "Quem respondeu", text: guardian ? `O próprio atleta (responsável: ${guardian})` : "O próprio atleta" }
  return guardian ? { label: "Responsável", text: guardian } : null
}

function notesLine(src: ContextSource): SummaryLine | null {
  if (!src.notes.length) return null
  const byType = new Map<keyof typeof NOTE_NAME, number>()
  for (const n of src.notes) byType.set(n.type, (byType.get(n.type) ?? 0) + 1)
  const parts = [...byType].map(([t, n]) => count(n, NOTE_NAME[t][0], NOTE_NAME[t][1]))
  const days = src.notes.map((n) => dayKey(n.createdAt)).filter(Boolean).sort()
  const last = days[days.length - 1]
  return { label: "Atendimento", text: `${count(src.notes.length, "nota", "notas")} (${parts.join(", ")})${last ? `; a última em ${dayLabel(last)}` : ""}` }
}

function qualificationLine(src: ContextSource): SummaryLine | null {
  const q = src.qualification
  if (!q) return null
  const parts = [
    q.goal && `objetivo: ${clip(q.goal, 120)}`,
    q.decisionMaker && `quem decide: ${clip(q.decisionMaker, 80)}`,
    q.timeline && `prazo: ${clip(q.timeline, 80)}`,
    q.summary && clip(q.summary, 200),
  ].filter(Boolean) as string[]
  return parts.length ? { label: "Qualificação do CRM", text: parts.join(" · ") } : null
}

/**
 * O resumo em linhas "rótulo: texto", na ordem em que a equipe lê: quem respondeu, a carreira (clubes, peneiras), o objetivo e o
 * que impede, o atendimento. O que o CRM não contou não aparece (nada de "Não informado" aqui). Textos longos são cortados;
 * o texto inteiro continua no detalhe e no arquivo.
 */
export function summarizeContext(src: ContextSource): SummaryLine[] {
  const lines: (SummaryLine | null)[] = [
    whoAnswered(src),
    has(src.currentClub) ? { label: "Clube atual", text: clip(src.currentClub) } : null,
    has(src.pastClubs) ? { label: "Já passou por", text: clip(src.pastClubs) } : null,
    has(src.trials) ? { label: "Peneiras e avaliações", text: clip(src.trials) } : null,
    has(src.opportunitiesReceived) ? { label: "Oportunidades recebidas", text: clip(src.opportunitiesReceived) } : null,
    has(src.evaluatedClubs) ? { label: "Clubes que avaliaram", text: clip(src.evaluatedClubs) } : null,
    has(src.goal) ? { label: "Objetivo", text: clip(src.goal) } : null,
    has(src.blocker) ? { label: "O que impede hoje", text: clip(src.blocker) } : null,
    has(src.strengthsAndImprovements) ? { label: "Pontos fortes e a melhorar", text: clip(src.strengthsAndImprovements) } : null,
    has(src.commitmentScore) ? { label: "Compromisso", text: scoreText(src.commitmentScore) } : null,
    has(src.crmObservations) ? { label: "Observações do atendimento", text: clip(src.crmObservations) } : null,
    qualificationLine(src),
    notesLine(src),
  ]
  return lines.filter((l): l is SummaryLine => l !== null)
}

/** "11 respostas do formulário · 2 notas · 7 de 9 campos de contexto preenchidos". */
export function contextCounts(src: ContextSource): string {
  const bits = [
    src.answers.length ? count(src.answers.length, "resposta do formulário", "respostas do formulário") : null,
    src.notes.length ? count(src.notes.length, "nota de atendimento", "notas de atendimento") : null,
    formFilled(src) ? `${formFilled(src)} de ${FORM_TOTAL} campos de contexto preenchidos` : null,
  ].filter(Boolean)
  return bits.join(" · ")
}
