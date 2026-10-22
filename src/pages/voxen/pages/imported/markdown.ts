/**
 * O arquivo de contexto dos importados (.md): um documento só, legível até no Bloco de Notas, com o resumo e tudo o que o CRM
 * contou de cada pessoa (respostas do formulário, notas, qualificação). Só entra quem TEM contexto de verdade; quem veio só com
 * dados básicos fica de fora (e o arquivo diz quantos). Sem React nem banco, para ser testado à parte.
 */
import type { ImportDetail } from "./api"
import {
  KIND_LABEL, arrivalHistory, basicsOf, displayName, statusOf, STATUS_LABEL, type ImportRow,
} from "./model.ts"
import { contextCounts, summarizeContext } from "./summary.ts"

/** Uma pessoa do arquivo: a linha da lista, o detalhe completo e o nome da subseção (se tiver). */
export type ContextEntry = { row: ImportRow; detail: ImportDetail; sectionName: string | null }

const NOTE_TITLE = { whatsapp_summary: "Resumo de WhatsApp", manual_note: "Nota do atendimento", call_transcript: "Transcrição de ligação" } as const
const FIELD_TITLE: Record<string, string> = { birth_date: "Nascimento", position: "Posição", category: "Categoria", team: "Time", city: "Cidade / estado" }

/** Texto de uma linha só (sem quebras), para títulos e rótulos. */
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim()

/** Texto de várias linhas como citação (`> `), que preserva as quebras e não vira lista nem título por acidente. */
function quote(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim().split("\n").map((l) => (l.trim() ? `> ${l.trimEnd()}` : ">")).join("\n")
}

const brDay = (iso: string | null): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

const birthBr = (ymd: string | null): string | null => (ymd && /^\d{4}-\d{2}-\d{2}/.test(ymd) ? ymd.slice(0, 10).split("-").reverse().join("/") : null)

/** O bloco de dados básicos: só o que existe, em uma linha. */
function basicsLine(row: ImportRow, d: ImportDetail): string {
  const birth = birthBr(d.birthDate ?? row.birthDate)
  const bits = [
    d.position ?? row.position,
    d.category ?? row.category,
    row.age ? `${row.age} anos` : null,
    d.city ?? row.city,
    (d.team ?? row.team) ? `time: ${d.team ?? row.team}` : null,
    birth ? `nascimento: ${birth}` : null,
  ].filter(Boolean) as string[]
  return bits.length ? bits.join(" · ") : "nenhum dado básico informado"
}

/** O trecho de uma pessoa. `n` é o número dela no arquivo (1, 2, 3...), ou null quando o arquivo é só dela. */
export function personMarkdown({ row, detail: d, sectionName }: ContextEntry, n: number | null, level = 2): string {
  const h = "#".repeat(level)
  const h2 = "#".repeat(level + 1)
  const out: string[] = []
  out.push(`${h} ${n === null ? "" : `${n}. `}${oneLine(displayName(row))}`)
  out.push("")
  const status = statusOf(row)
  const meta = [
    KIND_LABEL[row.kind],
    sectionName ? `subseção ${sectionName}` : "sem subseção",
    STATUS_LABEL[status],
    `versão ${row.revision} do CRM`,
  ]
  out.push(meta.join(" · "))
  const arrived = [arrivalHistory(row), row.wasProspect ? "Veio antes como pré-cadastro" : ""].filter(Boolean)
  if (arrived.length) out.push(`${arrived.join(". ")}.`)
  out.push("")
  out.push(`**Dados básicos:** ${basicsLine(row, d)}`)
  const missing = basicsOf(row).missing.filter((b) => b !== "time")
  if (missing.length) out.push(`**Faltam:** ${missing.join(", ")}`)
  if (!row.name?.trim() && row.guardianName) out.push(`**Atenção:** o CRM não mandou o nome do atleta, só o do responsável (${oneLine(row.guardianName)}).`)

  const summary = summarizeContext(d)
  if (summary.length) {
    out.push("")
    out.push(`${h2} Resumo`)
    out.push("")
    for (const l of summary) out.push(`- **${l.label}:** ${l.text}`)
    const counts = contextCounts(d)
    if (counts) out.push(`- _${counts}_`)
  }

  const full: [string, string | null][] = [
    ["Clube atual", d.currentClub],
    ["Clubes que já representou", d.pastClubs],
    ["Avaliações e peneiras", d.trials],
    ["Oportunidades que já recebeu", d.opportunitiesReceived],
    ["Clubes que já avaliaram o atleta", d.evaluatedClubs],
    ["Objetivo", d.goal],
    ["O que impede hoje", d.blocker],
    ["Pontos fortes e pontos a melhorar", d.strengthsAndImprovements],
    ["Nota de compromisso", d.commitmentScore],
    ["Observações do atendimento", d.crmObservations],
  ]
  const longOnes = full.filter(([, v]) => v && v.replace(/\s+/g, " ").trim().length > 240)
  if (longOnes.length) {
    out.push("")
    out.push(`${h2} Textos por inteiro`)
    for (const [label, v] of longOnes) {
      out.push("")
      out.push(`**${label}**`)
      out.push("")
      out.push(quote(v as string))
    }
  }

  const q = d.qualification
  if (q && (q.goal || q.decisionMaker || q.timeline || q.summary)) {
    out.push("")
    out.push(`${h2} Qualificação do CRM`)
    out.push("")
    if (q.goal) out.push(`- **Objetivo:** ${oneLine(q.goal)}`)
    if (q.decisionMaker) out.push(`- **Quem decide:** ${oneLine(q.decisionMaker)}`)
    if (q.timeline) out.push(`- **Prazo:** ${oneLine(q.timeline)}`)
    if (q.summary) out.push(`- **Resumo:** ${oneLine(q.summary)}`)
  }

  if (d.notes.length) {
    out.push("")
    out.push(`${h2} Notas de atendimento (${d.notes.length})`)
    for (const note of d.notes) {
      out.push("")
      out.push(`**${NOTE_TITLE[note.type]}**${brDay(note.createdAt) ? ` · ${brDay(note.createdAt)}` : ""}${note.truncated ? " · texto cortado pelo CRM" : ""}`)
      out.push("")
      out.push(quote(note.content))
    }
  }

  if (d.answers.length) {
    out.push("")
    out.push(`${h2} Perguntas e respostas do formulário (${d.answers.length})`)
    for (const a of d.answers) {
      out.push("")
      out.push(`**${oneLine(a.question)}**`)
      out.push("")
      out.push(quote(a.answer))
    }
  }

  if (d.review.length) {
    out.push("")
    out.push(`${h2} Textos que a VOXEN não conseguiu interpretar`)
    out.push("")
    for (const r of d.review) {
      const field = FIELD_TITLE[r.field] ?? r.field
      out.push(r.kind === "divergente"
        ? `- **${field}:** na ficha “${oneLine(r.current ?? "")}”, no CRM “${oneLine(r.proposed ?? "")}”`
        : `- **${field}:** “${oneLine(r.raw)}”`)
    }
  }
  return out.join("\n")
}

export type ContextFile = {
  /** O documento inteiro. */
  text: string
  /** Quantas pessoas entraram. */
  included: number
  /** Quantas ficaram de fora por não terem nenhum contexto do CRM. */
  skipped: number
}

/**
 * O arquivo com várias pessoas: cabeçalho, índice e uma seção por pessoa, na ordem recebida. `skipped` conta quem foi pedido e
 * ficou de fora por não ter contexto (a pessoa que pede decide se isso importa).
 */
export function contextFile(entries: ContextEntry[], opts: { today: string; title?: string; skipped?: number }): ContextFile {
  const list = entries.filter((e) => e.row.hasContext)
  const skipped = (opts.skipped ?? 0) + (entries.length - list.length)
  const single = list.length === 1
  const out: string[] = []
  out.push(`# ${opts.title ?? (single ? `Contexto de ${oneLine(displayName(list[0].row))}` : "Contexto dos importados do CRM")}`)
  out.push("")
  out.push(`Gerado em ${brDay(`${opts.today}T12:00:00`) ?? opts.today} pela VOXEN. **Uso interno da equipe:** não compartilhe com atletas nem famílias.`)
  out.push("")
  out.push(single
    ? "Tudo o que o CRM (wsltda.com) contou desta pessoa."
    : `${list.length} ${list.length === 1 ? "pessoa" : "pessoas"} com contexto do CRM (wsltda.com).${skipped ? ` ${skipped} ${skipped === 1 ? "ficou" : "ficaram"} de fora por não ${skipped === 1 ? "ter" : "terem"} nenhum contexto, só dados básicos.` : ""}`)

  if (!single && list.length) {
    out.push("")
    out.push("## Índice")
    out.push("")
    list.forEach((e, i) => {
      const bits = [KIND_LABEL[e.row.kind], e.sectionName ?? "sem subseção", basicsOf(e.row).complete ? "dados completos" : "dados incompletos"]
      out.push(`${i + 1}. ${oneLine(displayName(e.row))} — ${bits.join(" · ")}`)
    })
  }

  list.forEach((e, i) => {
    out.push("")
    if (!single) out.push("---")
    if (!single) out.push("")
    out.push(personMarkdown(e, single ? null : i + 1))
  })
  out.push("")
  return { text: out.join("\n"), included: list.length, skipped }
}

/** Nome de arquivo seguro: sem acento, sem espaço, sem símbolos. */
export function slug(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "importado"
}

/** O nome do arquivo: com o nome da pessoa quando é só uma, ou "contexto-importados" quando são várias. */
export function contextFileName(entries: ContextEntry[], today: string): string {
  const list = entries.filter((e) => e.row.hasContext)
  return list.length === 1 ? `contexto-${slug(displayName(list[0].row))}-${today}.md` : `contexto-importados-${today}.md`
}
