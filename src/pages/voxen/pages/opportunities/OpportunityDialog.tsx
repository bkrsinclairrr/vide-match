import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react"
import {
  ArrowLeftRight, Bus, Check, ClipboardCheck, Flame, GraduationCap, HeartPulse, Home, Loader2, Lock, Plane, Sparkles, Sprout, Trophy,
  TriangleAlert, Utensils, type LucideIcon,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Club as CatalogClub } from "@/data/clubs"
import { CATEGORIES, POSITIONS } from "@/data/football"
import type { OpportunityStatus } from "@/pages/membros/scoutLayer"
import { errMsg, type Club, type Opportunity, type ScoutApi } from "../scout/api"
import { ClubChooser, loadCatalog } from "./ClubPicker"
import { STATUS_LABEL, suggestCompatibility } from "./model"
import {
  BENEFITS, BENEFIT_LABEL, CURRENCIES, CURRENCY_LABEL, EMPTY_PROPOSAL, EXTRA_CATEGORIES, KINDS, KIND_LABEL, PERIODS, PERIOD_LABEL, URGENCIES,
  URGENCY_COLOR, URGENCY_LABEL, checkProposal, contractTotal, dayBR, draftFromProposal, facts, formatMoney, headline, inDays, monthlyEquivalent,
  parseMoney, suggestFromPosition, suggestUrgency, type Benefit, type Currency, type OpportunityKind, type ProposalDraft,
} from "./proposal"

export const KIND_ICON: Record<OpportunityKind, LucideIcon> = {
  avaliacao: ClipboardCheck, formacao: Sprout, profissional: Trophy, emprestimo: ArrowLeftRight, bolsa: GraduationCap, outro: Sparkles,
}

export const BENEFIT_ICON: Record<Benefit, LucideIcon> = {
  moradia: Home, alimentacao: Utensils, estudos: GraduationCap, transporte: Bus, saude: HeartPulse, passagens: Plane,
}

/** Quem recebe a oportunidade (o que o formulário precisa saber dele). */
export type OppMember = { id: string; fullName: string; position: string | null; category?: string | null }

const compatColor = (v: number) => (v >= 90 ? "#34d399" : v >= 80 ? "#fbbf24" : v >= 70 ? "#fb923c" : "#a1a1aa")

/** A moeda do catálogo ("€", "R$", "£") na moeda da proposta; as outras o catálogo mostra mas a proposta não usa. */
const CATALOG_CURRENCY: Record<string, Currency> = { "R$": "BRL", "€": "EUR", "£": "GBP" }

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="op-sec">
      <header><i>{n}</i><div><h4>{title}</h4>{hint && <p>{hint}</p>}</div></header>
      {children}
    </section>
  )
}

/**
 * Criar ou editar uma oportunidade, numa janela só: o clube (ou vários de uma vez), a vaga (tipo, posição, categoria), a
 * proposta (valor com moeda e período, luvas, duração, início, benefícios), o prazo de resposta com a urgência e o
 * encaixe. Criando, cada clube escolhido vira uma oportunidade com a mesma proposta (dá para ajustar cada uma depois).
 * Valor, urgência e nota interna são só da equipe: o atleta vê o clube, o encaixe, o prazo e o recado.
 */
export function OpportunityDialog({ open, api, member, clubs, initial, onClubsChanged, onSaved, onClose }: {
  open: boolean
  api: ScoutApi
  member: OppMember
  clubs: Club[]
  initial: Opportunity | null
  onClubsChanged: (c: Club) => void
  onSaved: (saved: Opportunity[]) => void
  onClose: () => void
}) {
  const { toast } = useToast()
  const [chosen, setChosen] = useState<Club[]>([])
  const [draft, setDraft] = useState<ProposalDraft>(EMPTY_PROPOSAL)
  const [compat, setCompat] = useState(85)
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<OpportunityStatus>("aberta")
  const [published, setPublished] = useState(false)
  const [athleteNote, setAthleteNote] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [catalog, setCatalog] = useState<CatalogClub[]>([])

  useEffect(() => { void loadCatalog().then(setCatalog) }, [])

  // Cada vez que a janela abre: os valores da oportunidade que está sendo editada, ou um formulário limpo com a posição do jogador.
  useEffect(() => {
    if (!open) return
    setChosen(initial?.club ? [initial.club] : [])
    setDraft(initial
      ? draftFromProposal(initial)
      : { ...EMPTY_PROPOSAL, position: member.position && POSITIONS.includes(member.position) ? member.position : "", category: member.category ?? "" })
    setCompat(initial?.compatibility ?? 85)
    setDeadline(initial?.deadline ?? "")
    setStatus(initial?.status ?? "aberta")
    setPublished(initial?.published ?? false)
    setAthleteNote(initial?.athleteNote ?? "")
    setInternalNote(initial?.internalNote ?? "")
    setErrors([])
    setSaving(false)
  }, [open, initial, member.position, member.category])

  const set = (patch: Partial<ProposalDraft>) => { setDraft((d) => ({ ...d, ...patch })); setErrors([]) }
  const now = new Date()
  const today = inDays(0, now)
  const checked = checkProposal(draft, deadline, today)
  const live = status === "aberta" || status === "enviada" || status === "negociacao"

  const catalogClub = useMemo(() => (chosen.length === 1 && chosen[0].catalogId ? catalog.find((c) => c.id === chosen[0].catalogId) ?? null : null), [chosen, catalog])
  const reference = catalogClub && CATALOG_CURRENCY[catalogClub.currency] ? { amount: catalogClub.monthlyOffer, currency: CATALOG_CURRENCY[catalogClub.currency] } : null
  const suggestion = suggestFromPosition(member.position, draft.position || null)
    ?? (catalogClub ? suggestCompatibility(member.position, catalogClub.preferredStyle) : null)
  const urgencyHint = suggestUrgency(deadline, now)

  const positions = draft.position && !POSITIONS.includes(draft.position) ? [...POSITIONS, draft.position] : POSITIONS
  const baseCategories = [...CATEGORIES, ...EXTRA_CATEGORIES]
  const categories = draft.category && !baseCategories.includes(draft.category) ? [...baseCategories, draft.category] : baseCategories

  const head = headline(checked.value)
  const monthly = monthlyEquivalent(checked.value)
  const total = contractTotal(checked.value)
  const lines = facts(checked.value)

  const addClub = (club: Club) => setChosen((list) => (initial ? [club] : list.some((c) => c.id === club.id) ? list : [...list, club]))
  const removeClub = (id: string) => setChosen((list) => list.filter((c) => c.id !== id))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const problems = [...checked.errors]
    if (!chosen.length) problems.unshift("Escolha ao menos um clube.")
    if (problems.length) { setErrors(problems); return }
    setSaving(true)
    const saved: Opportunity[] = []
    const failed: string[] = []
    let remaining = chosen
    for (const club of chosen) {
      try {
        saved.push(await api.saveOpportunity({
          ...checked.value, id: initial?.id, memberId: member.id, clubId: club.id, compatibility: compat, deadline: deadline || null, status,
          published: published && live, athleteNote, internalNote,
        }))
        remaining = remaining.filter((c) => c.id !== club.id)
      } catch (err) {
        failed.push(`${club.name}: ${errMsg(err)}`)
      }
    }
    setSaving(false)
    if (saved.length) onSaved(saved)
    if (failed.length) {
      // O que deu certo já foi salvo: a janela fica com os clubes que falharam, para corrigir e tentar de novo.
      setChosen(remaining)
      setErrors(failed)
      if (saved.length) toast({ title: `${saved.length} ${saved.length > 1 ? "oportunidades criadas" : "oportunidade criada"}`, description: `${failed.length} não foi salva: veja o aviso na janela.` })
      return
    }
    toast({
      title: initial ? "Oportunidade salva" : saved.length > 1 ? `${saved.length} oportunidades criadas` : "Oportunidade criada",
      description: saved.every((o) => o.published)
        ? `${member.fullName} já vê no Início e em Oportunidades.`
        : saved.length > 1 ? "Ainda são rascunhos: só a equipe vê." : "Ainda é rascunho: só a equipe vê.",
    })
    onClose()
  }

  const first = member.fullName.trim().split(/\s+/)[0] || member.fullName

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose() }}>
      <DialogContent className="vx-portal op-dialog max-w-4xl p-0" aria-describedby={undefined}>
        <form onSubmit={(e) => void submit(e)} className="contents">
          <div className="op-dialog-head">
            <DialogTitle>{initial ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
            <p>{initial ? `Clube, proposta e prazo de ${first}.` : `Escolha o clube (ou vários) e preencha o que ele oferece a ${first}. Só aparece para ${first} quando você publicar.`}</p>
          </div>

          <div className="op-dialog-body">
            <div className="op-col">
              <Section n={1} title={initial ? "O clube" : "Os clubes"} hint={initial ? "Trocar o clube mantém o resto da proposta." : "Escolha quantos quiser: cada um vira uma oportunidade."}>
                <ClubChooser api={api} clubs={clubs} chosen={chosen} position={draft.position || member.position} single={Boolean(initial)}
                  onAdd={addClub} onRemove={removeClub} onClubsChanged={onClubsChanged} />
              </Section>

              <Section n={2} title="A vaga" hint="O que o clube procura.">
                <div className="op-field">
                  <span>Tipo</span>
                  <div className="op-kinds" role="radiogroup" aria-label="Tipo da vaga">
                    {KINDS.map((k) => {
                      const Icon = KIND_ICON[k]
                      return (
                        <button key={k} type="button" role="radio" aria-checked={draft.kind === k} className={`vx-chip ${draft.kind === k ? "is-on" : ""}`}
                          onClick={() => set({ kind: draft.kind === k ? "" : k })}>
                          <Icon /> {KIND_LABEL[k]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="op-field">
                    <span>Posição que o clube procura</span>
                    <select className="vx-input vx-select" value={draft.position} onChange={(e) => set({ position: e.target.value })} aria-label="Posição que o clube procura">
                      <option value="">Qualquer posição</option>
                      {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {member.position && draft.position !== member.position && POSITIONS.includes(member.position) && (
                      <button type="button" className="op-link" onClick={() => set({ position: member.position as string })}>Usar a posição de {first}: {member.position}</button>
                    )}
                  </label>
                  <label className="op-field">
                    <span>Categoria</span>
                    <select className="vx-input vx-select" value={draft.category} onChange={(e) => set({ category: e.target.value })} aria-label="Categoria">
                      <option value="">Sem categoria</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
              </Section>
            </div>

            <div className="op-col">
              <Section n={3} title="A proposta" hint="Deixe o valor em branco se ainda for “a combinar”.">
                <div className="op-money">
                  <label className="op-field op-money-value">
                    <span>Valor</span>
                    <input className="vx-input" inputMode="decimal" autoComplete="off" placeholder="Ex.: 8.500" value={draft.amount}
                      onChange={(e) => set({ amount: e.target.value })} aria-label="Valor da proposta" />
                  </label>
                  <label className="op-field op-money-cur">
                    <span>Moeda</span>
                    <select className="vx-input vx-select" value={draft.currency} onChange={(e) => set({ currency: e.target.value as Currency })} aria-label="Moeda">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{CURRENCY_LABEL[c]}</option>)}
                    </select>
                  </label>
                </div>
                <div className="op-seg" role="radiogroup" aria-label="O valor é">
                  {PERIODS.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={draft.period === p} className={draft.period === p ? "is-on" : ""} onClick={() => set({ period: p })}>{PERIOD_LABEL[p]}</button>
                  ))}
                </div>
                {reference && (
                  <p className="op-hint">
                    <Sparkles /> Referência do catálogo da Zyron: <b>{formatMoney(reference.amount, reference.currency)}/mês</b> (não é uma proposta real).
                    {(parseMoney(draft.amount) !== reference.amount || draft.currency !== reference.currency || draft.period !== "mes") && (
                      <button type="button" className="op-link" onClick={() => set({ amount: String(reference.amount), currency: reference.currency, period: "mes" })}>Usar</button>
                    )}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="op-field">
                    <span>Luvas <em>opcional</em></span>
                    <input className="vx-input" inputMode="decimal" autoComplete="off" placeholder="Ex.: 20.000" value={draft.signingBonus}
                      onChange={(e) => set({ signingBonus: e.target.value })} aria-label="Luvas" />
                  </label>
                  <label className="op-field">
                    <span>Duração <em>meses</em></span>
                    <input className="vx-input" inputMode="numeric" autoComplete="off" placeholder="Ex.: 24" maxLength={3} value={draft.contractMonths}
                      onChange={(e) => set({ contractMonths: e.target.value.replace(/[^\d]/g, "") })} aria-label="Duração do contrato em meses" />
                  </label>
                  <label className="op-field">
                    <span>Início previsto</span>
                    <input className="vx-input" type="date" min="2000-01-01" value={draft.startsOn} onChange={(e) => set({ startsOn: e.target.value })} aria-label="Início previsto" />
                  </label>
                </div>
                <div className="op-field">
                  <span>O clube oferece</span>
                  <div className="op-benefits">
                    {BENEFITS.map((b) => {
                      const Icon = BENEFIT_ICON[b]
                      const on = draft.benefits.includes(b)
                      return (
                        <button key={b} type="button" aria-pressed={on} className={`vx-chip ${on ? "is-on" : ""}`}
                          onClick={() => set({ benefits: on ? draft.benefits.filter((x) => x !== b) : [...draft.benefits, b] })}>
                          <Icon /> {BENEFIT_LABEL[b]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="op-summary" aria-live="polite">
                  <span className="op-summary-label">Resumo da proposta</span>
                  <b className={`op-summary-value ${head.value ? "" : "is-empty"}`}>{head.value ?? "A combinar"}{head.value && <small> {head.unit}</small>}</b>
                  {lines.length > 0 && <p>{lines.join(" · ")}</p>}
                  {head.value && draft.period !== "mes" && monthly && <p>Dá cerca de {formatMoney(monthly, draft.currency)} por mês.</p>}
                  {total && <p>No contrato inteiro: cerca de {formatMoney(total, draft.currency)}{checked.value.signingBonus ? " (com as luvas)" : ""}.</p>}
                </div>
              </Section>

              <Section n={4} title="Prazo e urgência" hint="Até quando é preciso responder ao clube.">
                <div className="op-field">
                  <span>Responder até</span>
                  <div className="op-deadline">
                    <input className="vx-input" type="date" value={deadline} onChange={(e) => { setDeadline(e.target.value); setErrors([]) }} aria-label="Prazo para responder" />
                    <div className="op-quick" role="group" aria-label="Prazos rápidos">
                      {[3, 7, 15, 30].map((n) => (
                        <button key={n} type="button" className={deadline === inDays(n, now) ? "is-on" : ""} onClick={() => { setDeadline(inDays(n, now)); setErrors([]) }}>+{n} dias</button>
                      ))}
                      {deadline && <button type="button" onClick={() => setDeadline("")}>Sem prazo</button>}
                    </div>
                  </div>
                </div>
                <div className="op-field">
                  <span>Urgência</span>
                  <div className="op-urgency" role="radiogroup" aria-label="Urgência">
                    {URGENCIES.map((u) => (
                      <button key={u} type="button" role="radio" aria-checked={draft.urgency === u} className={draft.urgency === u ? "is-on" : ""}
                        style={{ "--c": URGENCY_COLOR[u], "--cb": `${URGENCY_COLOR[u]}22` } as CSSProperties} onClick={() => set({ urgency: u })}>
                        {u === "urgente" && <Flame />}{URGENCY_LABEL[u]}
                      </button>
                    ))}
                  </div>
                  {urgencyHint && urgencyHint.urgency !== draft.urgency && (
                    <p className="op-hint">
                      <Sparkles /> {urgencyHint.days === 0 ? "O prazo é hoje" : `Faltam ${urgencyHint.days} dia${urgencyHint.days === 1 ? "" : "s"}`}: o prazo sugere <b>{URGENCY_LABEL[urgencyHint.urgency].toLowerCase()}</b>.
                      <button type="button" className="op-link" onClick={() => set({ urgency: urgencyHint.urgency })}>Usar</button>
                    </p>
                  )}
                </div>
              </Section>
            </div>

            <div className="op-wide">
              <Section n={5} title="Encaixe, situação e recados">
                <div className="op-fit">
                  <div className="op-field">
                    <div className="op-field-row">
                      <span>Compatibilidade</span>
                      <b className="tnum" style={{ color: compatColor(compat) }}>{compat}%</b>
                    </div>
                    <input type="range" min={0} max={100} value={compat} onChange={(e) => setCompat(Number(e.target.value))} className="op-range" aria-label="Compatibilidade"
                      style={{ "--v": `${compat}%`, "--c": compatColor(compat) } as CSSProperties} />
                    {suggestion && (
                      <p className="op-hint">
                        <Sparkles /> Sugestão: <b>{suggestion.value}%</b>, porque {suggestion.why}.
                        {suggestion.value !== compat && <button type="button" className="op-link" onClick={() => setCompat(suggestion.value)}>Usar a sugestão</button>}
                      </p>
                    )}
                  </div>
                  {initial && (
                    <label className="op-field op-status-field">
                      <span>Situação</span>
                      <select className="vx-input vx-select" value={status} onChange={(e) => setStatus(e.target.value as OpportunityStatus)} aria-label="Situação">
                        {(Object.keys(STATUS_LABEL) as OpportunityStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="op-field">
                    <span>Recado para o atleta <em>aparece na área dele</em></span>
                    <textarea className="vx-input vx-textarea op-textarea" value={athleteNote} onChange={(e) => setAthleteNote(e.target.value)} maxLength={600}
                      placeholder="Ex.: A base procura um meia canhoto para a avaliação de novembro." />
                  </label>
                  <label className="op-field">
                    <span><Lock className="inline h-3 w-3" /> Nota interna <em>só a equipe vê</em></span>
                    <textarea className="vx-input vx-textarea op-textarea" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} maxLength={2000}
                      placeholder="Contato no clube, combinados, próximos passos..." />
                  </label>
                </div>
                <label className={`op-publish ${published && live ? "is-on" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={published && live} onChange={(e) => setPublished(e.target.checked)} disabled={!live} />
                  <span className="op-switch" aria-hidden="true"><i /></span>
                  <span><b>{published && live ? "Publicada" : "Rascunho"}</b><small>{published && live ? `${first} vê o clube, o encaixe, o prazo e o recado no Início e em Oportunidades. O valor, a urgência e a nota interna continuam só com a equipe.` : "Só a equipe vê até você publicar."}</small></span>
                </label>
                <p className="op-disclaimer">A compatibilidade é o julgamento da equipe. A Zyron não garante teste, vaga ou contrato.</p>
              </Section>
            </div>
          </div>

          <div className="op-dialog-foot">
            {(errors.length > 0 || checked.warnings.length > 0) && (
              <div className="op-messages">
                {errors.map((m) => <p key={m} className="is-error" role="alert"><TriangleAlert /> {m}</p>)}
                {errors.length === 0 && checked.warnings.map((m) => <p key={m} className="is-warn"><TriangleAlert /> {m}</p>)}
              </div>
            )}
            <button type="button" className="vx-btn" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="vx-btn vx-btn--gold" disabled={saving || !chosen.length}>
              {saving ? <Loader2 className="op-spin" /> : <Check />}
              {initial ? "Salvar" : chosen.length > 1 ? `Criar ${chosen.length} oportunidades` : "Criar oportunidade"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** "Responder até 05/11/2026", usado em mais de um cartão. */
export const untilLabel = (deadline: string | null) => (deadline ? `Responder até ${dayBR(deadline)}` : "Sem prazo para responder")
