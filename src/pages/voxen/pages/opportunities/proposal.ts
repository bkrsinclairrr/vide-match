/**
 * A proposta de uma oportunidade (o que o clube oferece), sem React e sem banco, para ser testada à parte
 * (`npm run test:oportunidades`): tipo da vaga, posição, valor (com moeda e período), luvas, duração, início,
 * benefícios, urgência e prazo de resposta. Tudo isso é da equipe: o atleta não vê valor nem urgência.
 *
 * Três ideias que a tela segue:
 *   - o valor pode ser "por mês", "por ano" ou "no contrato todo"; para comparar propostas, tudo vira "por mês"
 *     quando dá para calcular (nunca se inventa duração que ninguém informou);
 *   - moedas diferentes nunca são somadas nem comparadas entre si (não há cotação aqui);
 *   - a urgência é escolha da equipe; o prazo só dá uma sugestão.
 */
import { POSITION_LINE } from "../../../../data/football.ts"

/* ------------------------------------------------------------------ */
/* Listas                                                              */
/* ------------------------------------------------------------------ */

export type OpportunityKind = "avaliacao" | "formacao" | "profissional" | "emprestimo" | "bolsa" | "outro"

export const KINDS: OpportunityKind[] = ["avaliacao", "formacao", "profissional", "emprestimo", "bolsa", "outro"]

export const KIND_LABEL: Record<OpportunityKind, string> = {
  avaliacao: "Teste / avaliação",
  formacao: "Contrato de formação",
  profissional: "Contrato profissional",
  emprestimo: "Empréstimo",
  bolsa: "Bolsa de estudos",
  outro: "Outro",
}

export type Currency = "BRL" | "EUR" | "USD" | "GBP"

export const CURRENCIES: Currency[] = ["BRL", "EUR", "USD", "GBP"]

export const CURRENCY_LABEL: Record<Currency, string> = { BRL: "R$ Real", EUR: "€ Euro", USD: "US$ Dólar", GBP: "£ Libra" }

export type AmountPeriod = "mes" | "ano" | "total"

export const PERIODS: AmountPeriod[] = ["mes", "ano", "total"]

export const PERIOD_LABEL: Record<AmountPeriod, string> = { mes: "Por mês", ano: "Por ano", total: "Contrato todo" }

/** O que aparece depois do valor: "R$ 8.500 /mês". */
export const PERIOD_UNIT: Record<AmountPeriod, string> = { mes: "/mês", ano: "/ano", total: "no contrato" }

export type Benefit = "moradia" | "alimentacao" | "estudos" | "transporte" | "saude" | "passagens"

export const BENEFITS: Benefit[] = ["moradia", "alimentacao", "estudos", "transporte", "saude", "passagens"]

export const BENEFIT_LABEL: Record<Benefit, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  estudos: "Estudos",
  transporte: "Transporte",
  saude: "Saúde",
  passagens: "Passagens",
}

export type Urgency = "baixa" | "media" | "alta" | "urgente"

export const URGENCIES: Urgency[] = ["baixa", "media", "alta", "urgente"]

export const URGENCY_LABEL: Record<Urgency, string> = { baixa: "Sem pressa", media: "Normal", alta: "Alta", urgente: "Urgente" }

export const URGENCY_RANK: Record<Urgency, number> = { baixa: 0, media: 1, alta: 2, urgente: 3 }

/** Como a urgência aparece no cartão ("Urgência alta", "Sem pressa"). */
export const URGENCY_TAG: Record<Urgency, string> = { baixa: "Sem pressa", media: "Urgência normal", alta: "Urgência alta", urgente: "Urgente" }

/** Cor de cada urgência (a mesma escala dos prazos: calmo → vermelho). */
export const URGENCY_COLOR: Record<Urgency, string> = { baixa: "#7dd3fc", media: "#fbbf24", alta: "#fb923c", urgente: "#f87171" }

/** As categorias que o clube pode pedir: as de base da lista do cadastro mais as de adulto. */
export const EXTRA_CATEGORIES = ["Profissional", "Sub 23"]

/* ------------------------------------------------------------------ */
/* A proposta como o banco guarda                                      */
/* ------------------------------------------------------------------ */

export type Proposal = {
  kind: OpportunityKind | null
  /** A posição que o clube procura (null = qualquer). */
  position: string | null
  category: string | null
  /** Valor na moeda e no período abaixo; null = a combinar. */
  amount: number | null
  currency: Currency
  period: AmountPeriod
  /** Luvas, na mesma moeda. */
  signingBonus: number | null
  contractMonths: number | null
  /** Início previsto (AAAA-MM-DD). */
  startsOn: string | null
  benefits: Benefit[]
  urgency: Urgency
}

export const NO_PROPOSAL: Proposal = {
  kind: null, position: null, category: null, amount: null, currency: "BRL", period: "mes", signingBonus: null,
  contractMonths: null, startsOn: null, benefits: [], urgency: "media",
}

const round2 = (n: number) => Math.round(n * 100) / 100

/* ------------------------------------------------------------------ */
/* Dinheiro                                                            */
/* ------------------------------------------------------------------ */

/**
 * Lê o que a pessoa digitou: "8500", "8.500", "8.500,50", "R$ 8.500,00", "8,5" e também "8,500.50".
 * Ponto ou vírgula seguido de exatamente 3 números é separador de milhar; seguido de 1 ou 2, é decimal.
 */
export function parseMoney(text: string): number | null {
  if (text.includes("-")) return null // valor negativo (ou hífen perdido) não vale
  const raw = text.replace(/[^\d.,]/g, "")
  if (!/\d/.test(raw)) return null
  let s = raw
  const comma = s.lastIndexOf(",")
  const dot = s.lastIndexOf(".")
  if (comma >= 0 && dot >= 0) {
    // O último separador é o decimal; o outro é milhar.
    s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  } else if (comma >= 0 || dot >= 0) {
    const sep = comma >= 0 ? "," : "."
    const parts = s.split(sep)
    s = parts.length === 2 && parts[1].length <= 2 ? `${parts[0] || "0"}.${parts[1]}` : parts.join("")
  }
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? round2(n) : null
}

/** O Intl separa o símbolo do número com um espaço que não quebra; no texto da tela e nos testes vale o espaço comum. */
const NBSP = new RegExp(String.fromCharCode(160), "g")

const SYMBOL: Record<Currency, string> = { BRL: "R$", EUR: "€", USD: "US$", GBP: "£" }

export const currencySymbol = (c: Currency) => SYMBOL[c]

/** "R$ 8.500" ou "R$ 8.500,50" (centavos só quando existem). */
export function formatMoney(value: number, currency: Currency): string {
  const whole = Math.abs(value - Math.round(value)) < 0.005
  const digits = whole ? Math.round(value) : round2(value)
  const body = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(digits)
  return `${SYMBOL[currency]} ${body}`.replace(NBSP, " ")
}

/** Versão curta para espaços apertados: "R$ 8,5 mil", "€ 1,2 mi". */
export function formatShort(value: number, currency: Currency): string {
  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n).replace(NBSP, " ")
  if (value >= 1_000_000) return `${SYMBOL[currency]} ${fmt(value / 1_000_000)} mi`
  if (value >= 10_000) return `${SYMBOL[currency]} ${fmt(value / 1_000)} mil`
  return formatMoney(value, currency)
}

/** O valor equivalente por mês, quando dá para calcular. "Contrato todo" sem a duração não tem como dividir. */
export function monthlyEquivalent(p: Pick<Proposal, "amount" | "period" | "contractMonths">): number | null {
  if (!p.amount) return null
  if (p.period === "mes") return p.amount
  if (p.period === "ano") return round2(p.amount / 12)
  return p.contractMonths ? round2(p.amount / p.contractMonths) : null
}

/** Quanto o clube paga no contrato inteiro (com as luvas), quando a duração é conhecida. */
export function contractTotal(p: Pick<Proposal, "amount" | "period" | "contractMonths" | "signingBonus">): number | null {
  if (!p.amount) return null
  let base: number | null
  if (p.period === "total") base = p.amount
  else if (!p.contractMonths) base = null
  else base = p.period === "mes" ? p.amount * p.contractMonths : (p.amount * p.contractMonths) / 12
  return base === null ? null : round2(base + (p.signingBonus ?? 0))
}

/** O destaque do cartão: o valor e a unidade, ou "A combinar". */
export function headline(p: Pick<Proposal, "amount" | "currency" | "period">): { value: string | null; unit: string } {
  if (!p.amount) return { value: null, unit: "" }
  return { value: formatMoney(p.amount, p.currency), unit: PERIOD_UNIT[p.period] }
}

/** "03/11/2026" a partir de "2026-11-03". */
export const dayBR = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "")

/** Duração em linguagem de gente: 12 → "1 ano", 18 → "1 ano e 6 meses", 6 → "6 meses". */
export function durationLabel(months: number | null): string {
  if (!months) return ""
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = years ? `${years} ano${years > 1 ? "s" : ""}` : ""
  const m = rest ? `${rest} ${rest > 1 ? "meses" : "mês"}` : ""
  return [y, m].filter(Boolean).join(" e ")
}

/** As linhas pequenas abaixo do valor: luvas, duração e início. */
export function facts(p: Pick<Proposal, "signingBonus" | "currency" | "contractMonths" | "startsOn" | "amount" | "period">): string[] {
  const out: string[] = []
  if (p.signingBonus) out.push(`+ ${formatMoney(p.signingBonus, p.currency)} de luvas`)
  if (p.contractMonths) out.push(durationLabel(p.contractMonths))
  if (p.startsOn) out.push(`início ${dayBR(p.startsOn)}`)
  return out
}

/* ------------------------------------------------------------------ */
/* Prazo e urgência                                                    */
/* ------------------------------------------------------------------ */

/** Dias inteiros até o prazo (0 = hoje, negativo = já passou). Sem prazo: null. */
export function daysUntil(deadline: string | null, now: Date): number | null {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}/.test(deadline)) return null
  const [y, m, d] = deadline.slice(0, 10).split("-").map(Number)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000)
}

/** A urgência que o prazo sugere: até 3 dias urgente, até 7 alta, até 21 normal, depois sem pressa. Vencido: sem sugestão. */
export function suggestUrgency(deadline: string | null, now: Date): { urgency: Urgency; days: number } | null {
  const days = daysUntil(deadline, now)
  if (days === null || days < 0) return null
  return { urgency: days <= 3 ? "urgente" : days <= 7 ? "alta" : days <= 21 ? "media" : "baixa", days }
}

/** Datas rápidas do botão "+7 dias": a partir de hoje, no formato do campo de data. */
export function inDays(n: number, now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/* ------------------------------------------------------------------ */
/* Encaixe da posição                                                  */
/* ------------------------------------------------------------------ */

/** 2 = a posição que o clube procura é a do jogador; 1 = mesma linha de campo; 0 = outra coisa (ou falta informação). */
export function positionFit(player: string | null, wanted: string | null): 0 | 1 | 2 {
  if (!player || !wanted) return 0
  if (player === wanted) return 2
  const a = POSITION_LINE[player]
  return a && a === POSITION_LINE[wanted] ? 1 : 0
}

/** Sugestão de compatibilidade pela posição que o clube pede (só sugestão: quem decide é o Scout). */
export function suggestFromPosition(player: string | null, wanted: string | null): { value: number; why: string } | null {
  if (!player || !wanted) return null
  const fit = positionFit(player, wanted)
  return {
    value: fit === 2 ? 92 : fit === 1 ? 84 : 72,
    why: fit === 2 ? "o clube procura exatamente a posição dele" : fit === 1 ? "o clube procura outra posição da mesma linha" : "o clube procura uma posição de outra linha",
  }
}

/* ------------------------------------------------------------------ */
/* O formulário                                                        */
/* ------------------------------------------------------------------ */

/** O que a pessoa digita: tudo texto, até conferir. */
export type ProposalDraft = {
  kind: OpportunityKind | ""
  position: string
  category: string
  amount: string
  currency: Currency
  period: AmountPeriod
  signingBonus: string
  contractMonths: string
  startsOn: string
  benefits: Benefit[]
  urgency: Urgency
}

export const EMPTY_PROPOSAL: ProposalDraft = {
  kind: "", position: "", category: "", amount: "", currency: "BRL", period: "mes", signingBonus: "", contractMonths: "",
  startsOn: "", benefits: [], urgency: "media",
}

const asText = (n: number | null) => (n === null ? "" : String(n).replace(".", ","))

export const draftFromProposal = (p: Proposal): ProposalDraft => ({
  kind: p.kind ?? "", position: p.position ?? "", category: p.category ?? "", amount: asText(p.amount), currency: p.currency, period: p.period,
  signingBonus: asText(p.signingBonus), contractMonths: asText(p.contractMonths), startsOn: p.startsOn ?? "", benefits: [...p.benefits], urgency: p.urgency,
})

const MAX_MONEY = 999_999_999

/** Confere o que foi digitado. `errors` impedem de salvar; `warnings` só avisam. */
export function checkProposal(d: ProposalDraft, deadline: string, today: string): { value: Proposal; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  let amount: number | null = null
  if (d.amount.trim()) {
    amount = parseMoney(d.amount)
    if (amount === null || amount <= 0) errors.push("O valor da proposta não é válido. Use só números, como 8.500 ou 8500,50.")
    else if (amount > MAX_MONEY) errors.push("O valor da proposta está alto demais. Confira os zeros.")
  }
  let signingBonus: number | null = null
  if (d.signingBonus.trim()) {
    signingBonus = parseMoney(d.signingBonus)
    if (signingBonus === null || signingBonus <= 0) errors.push("O valor das luvas não é válido. Deixe em branco se não houver.")
    else if (signingBonus > MAX_MONEY) errors.push("O valor das luvas está alto demais. Confira os zeros.")
  }
  let contractMonths: number | null = null
  if (d.contractMonths.trim()) {
    const n = Number(d.contractMonths.replace(",", "."))
    if (!Number.isInteger(n) || n < 1 || n > 120) errors.push("A duração do contrato vai de 1 a 120 meses.")
    else contractMonths = n
  }
  if (d.startsOn && !(d.startsOn >= "2000-01-01" && /^\d{4}-\d{2}-\d{2}$/.test(d.startsOn))) errors.push("Confira a data de início.")

  if (amount && d.period === "total" && !contractMonths) warnings.push("Sem a duração do contrato, não dá para mostrar o valor por mês.")
  if (signingBonus && !amount) warnings.push("Há luvas, mas o valor da proposta está em branco (vai aparecer como “a combinar”).")
  if (deadline && deadline < today) warnings.push("O prazo de resposta já passou.")
  if (deadline && d.startsOn && d.startsOn < deadline) warnings.push("O início previsto é antes do prazo de resposta.")

  const value: Proposal = {
    kind: d.kind || null,
    position: d.position.trim() || null,
    category: d.category.trim() || null,
    amount: amount && amount > 0 && amount <= MAX_MONEY ? amount : null,
    currency: d.currency,
    period: d.period,
    signingBonus: signingBonus && signingBonus > 0 && signingBonus <= MAX_MONEY ? signingBonus : null,
    contractMonths,
    startsOn: d.startsOn || null,
    benefits: BENEFITS.filter((b) => d.benefits.includes(b)),
    urgency: d.urgency,
  }
  return { value, errors, warnings }
}

/* ------------------------------------------------------------------ */
/* Resumo e ordem                                                      */
/* ------------------------------------------------------------------ */

type Deal = Proposal & { status: string; deadline: string | null; compatibility: number }

export const LIVE_STATUSES = ["aberta", "enviada", "negociacao"]

export const isLiveStatus = (status: string) => LIVE_STATUSES.includes(status)

/** Em andamento primeiro; depois a mais urgente, o prazo mais perto e o melhor encaixe. */
export function rankDeals<T extends Deal>(deals: T[]): T[] {
  return [...deals].sort((a, b) =>
    Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status))
    || URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]
    || (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")
    || b.compatibility - a.compatibility)
}

export type DealSummary = {
  live: number
  /** Em andamento com urgência alta ou urgente, ou com o prazo em até 3 dias. */
  urgent: number
  /** A maior proposta mensal de cada moeda (moedas diferentes não se comparam). */
  best: { currency: Currency; monthly: number }[]
  /** O prazo mais perto entre as que estão em andamento e ainda não venceram. */
  nextDeadline: { deadline: string; days: number } | null
}

export function summarizeDeals(deals: Deal[], now: Date): DealSummary {
  const live = deals.filter((d) => isLiveStatus(d.status))
  const best = new Map<Currency, number>()
  let next: { deadline: string; days: number } | null = null
  let urgent = 0
  for (const d of live) {
    const monthly = monthlyEquivalent(d)
    if (monthly) best.set(d.currency, Math.max(best.get(d.currency) ?? 0, monthly))
    const days = daysUntil(d.deadline, now)
    if (days !== null && days >= 0 && d.deadline && (!next || d.deadline < next.deadline)) next = { deadline: d.deadline, days }
    if (URGENCY_RANK[d.urgency] >= URGENCY_RANK.alta || (days !== null && days >= 0 && days <= 3)) urgent++
  }
  return {
    live: live.length,
    urgent,
    best: CURRENCIES.filter((c) => best.has(c)).map((currency) => ({ currency, monthly: best.get(currency) as number })),
    nextDeadline: next,
  }
}

/* ------------------------------------------------------------------ */
/* Texto para copiar                                                   */
/* ------------------------------------------------------------------ */

/**
 * O resumo da oportunidade em texto simples, para colar numa conversa (por exemplo, com a família ou o clube).
 * Quem copia decide para quem manda: o valor é da equipe.
 */
export function proposalText(o: Proposal & { deadline: string | null; club: { name: string; country: string | null; league: string | null } | null }): string {
  const out: string[] = []
  const place = [o.club?.country, o.club?.league].filter(Boolean).join(" · ")
  out.push(`Oportunidade: ${o.club?.name ?? "Clube"}${place ? ` (${place})` : ""}`)
  const vacancy = [o.position, o.category, o.kind ? KIND_LABEL[o.kind] : null].filter(Boolean).join(" · ")
  if (vacancy) out.push(`Vaga: ${vacancy}`)
  const h = headline(o)
  const more = facts(o)
  out.push(`Proposta: ${h.value ? `${h.value}${h.unit}${more.length ? ` · ${more.join(" · ")}` : ""}` : `a combinar${more.length ? ` · ${more.join(" · ")}` : ""}`}`)
  if (o.benefits.length) out.push(`O clube oferece: ${o.benefits.map((b) => BENEFIT_LABEL[b]).join(", ")}`)
  if (o.deadline) out.push(`Responder até: ${dayBR(o.deadline)}`)
  return out.join("\n")
}
