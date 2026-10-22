import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowLeft, BadgeCheck, CheckCircle2, CircleX, ExternalLink, Lock, RotateCcw, Trash2 } from "lucide-react"
import { Avatar, Skeleton } from "@/pages/voxen/ui"
import { useLoad } from "../scout/api"
import { CrmDetails } from "../scout/ScoutTabs"
import type { ImportDetail, ImportedApi } from "./api"
import { KIND_BLURB, displayName, plural, statusOf, subline, type ImportRow, type ImportSection } from "./model"
import { KindBadge, SectionChip, StatusBadge } from "./parts"

const FIELD_NAME: Record<string, string> = { birth_date: "Nascimento", position: "Posição", category: "Categoria", team: "Time", city: "Cidade / estado" }

const DETAILS: { key: keyof ImportDetail; label: string }[] = [
  { key: "currentClub", label: "Clube atual" },
  { key: "pastClubs", label: "Clubes que já representou" },
  { key: "trials", label: "Avaliações e peneiras" },
  { key: "opportunitiesReceived", label: "Oportunidades que já recebeu" },
  { key: "goal", label: "Objetivo" },
  { key: "blocker", label: "O que impede hoje" },
  { key: "evaluatedClubs", label: "Clubes que já avaliaram o atleta" },
  { key: "strengthsAndImprovements", label: "Pontos fortes e pontos a melhorar" },
]

const fmtDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—")
const fmtBirth = (ymd: string) => ymd.split("-").reverse().join("/")

type Check = { level: "ok" | "miss" | "warn"; title: string; text: string }

function ChecklistIcon({ level }: { level: Check["level"] }) {
  if (level === "ok") return <CheckCircle2 aria-hidden="true" />
  return level === "miss" ? <CircleX aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />
}

/** A conferência do contexto: o que o CRM trouxe, de onde veio, e o que ainda falta. */
function checksOf(row: ImportRow, section: ImportSection | undefined): Check[] {
  return [
    row.hasContext
      ? { level: "ok", title: "Contexto do CRM", text: `${plural(row.answersCount, "resposta", "respostas")} do formulário e ${plural(row.notesCount, "nota", "notas")} de atendimento.` }
      : { level: "miss", title: "Contexto do CRM", text: "O CRM não trouxe nenhum contexto para esta pessoa." },
    section
      ? { level: "ok", title: "De onde veio", text: `Subseção “${section.name}”.` }
      : { level: "miss", title: "De onde veio", text: "Ainda sem subseção. Escolha abaixo de onde especificamente ela veio." },
    row.name?.trim()
      ? { level: "ok", title: "Nome do atleta", text: row.name.trim() }
      : { level: "warn", title: "Nome do atleta", text: row.guardianName ? `O CRM não mandou o nome do atleta, só o do responsável (${row.guardianName}).` : "O CRM não mandou o nome." },
    row.reviewCount === 0
      ? { level: "ok", title: "Textos do formulário", text: "Todos foram interpretados." }
      : { level: "warn", title: "Textos do formulário", text: `${plural(row.reviewCount, "texto não foi interpretado", "textos não foram interpretados")} com segurança (veja abaixo).` },
  ]
}

export function ImportedDetail({ row, api, sections, canScout, canAdmin, busy, onBack, onSection, onApprove, onManage, onDiscard }: {
  row: ImportRow
  api: ImportedApi
  sections: ImportSection[]
  canScout: boolean
  canAdmin: boolean
  busy: boolean
  onBack: () => void
  onSection: (sectionId: string | null) => void
  onApprove: (approve: boolean) => void
  onManage: () => void
  onDiscard: () => Promise<void>
}) {
  const [asking, setAsking] = useState(false)
  const q = useLoad(api, (a) => a.detail(row.kind, row.ref), [row.key, row.revision])
  const d = q.data && q.data.kind === row.kind && q.data.ref === row.ref ? q.data : null
  const st = statusOf(row)
  const section = sections.find((s) => s.id === row.sectionId)
  const headline = subline(row) || "Dados do CRM abaixo"
  const checks = checksOf(row, section)
  const fixed = checks.every((c) => c.level === "ok")

  return (
    <div className="op-detail-in">
      <div className="vx-card op-player im-player">
        <button type="button" className="vx-icon-btn op-back" onClick={onBack} aria-label="Voltar à lista"><ArrowLeft /></button>
        <Avatar name={displayName(row)} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate">{displayName(row)}</h2>
          <p>{headline}</p>
          <div className="im-badges">
            <KindBadge kind={row.kind} />
            <SectionChip section={section} />
            <StatusBadge row={row} long />
          </div>
        </div>
        <div className="im-actions">
          {canScout && st !== "aprovado" && (
            <button type="button" className="vx-btn vx-btn--gold h-9" disabled={busy} onClick={() => onApprove(true)}>
              <BadgeCheck /> {st === "mudou" ? "Aprovar a versão nova" : "Aprovar"}
            </button>
          )}
          {canScout && row.approvedAt && (
            <button type="button" className="vx-btn h-9" disabled={busy} onClick={() => onApprove(false)}><RotateCcw /> Tirar a aprovação</button>
          )}
          {row.memberId && (
            <Link className="vx-btn h-9" to={`/voxen/membros/${row.memberId}?aba=contexto`}><ExternalLink /> Abrir a ficha</Link>
          )}
          {canAdmin && row.kind === "pre" && !asking && (
            <button type="button" className="vx-btn h-9" onClick={() => setAsking(true)}><Trash2 /> Descartar</button>
          )}
        </div>
      </div>

      <div className="sc-prospect-warn" role="note">
        <Lock />
        <span>
          <b>{KIND_BLURB[row.kind]}</b> Só a equipe vê. Versão {row.revision} do CRM, recebida em {fmtDay(row.firstAt)}
          {row.updatedAt && fmtDay(row.updatedAt) !== fmtDay(row.firstAt) ? ` e atualizada em ${fmtDay(row.updatedAt)}` : ""}.
        </span>
      </div>

      {asking && (
        <div className="bp-confirm" role="alertdialog" aria-label="Descartar pré-cadastro">
          <p>Descartar <strong>{displayName(row)}</strong>? O texto é apagado e as próximas versões do CRM não recriam este pré-cadastro. <strong>Não dá para desfazer.</strong></p>
          <div>
            <button type="button" className="vx-btn h-8" onClick={() => setAsking(false)}>Cancelar</button>
            <button type="button" className="vx-btn op-danger h-8" disabled={busy} onClick={() => void onDiscard()}>Descartar de vez</button>
          </div>
        </div>
      )}

      <section className="vx-card im-conf">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="vx-card-title">Conferência do contexto</h3>
            <p className="vx-card-sub">{fixed ? "Está tudo no lugar." : "Veja o que falta antes de aprovar."}</p>
          </div>
        </div>

        <ul className="im-checks">
          {checks.map((c) => (
            <li key={c.title} className={`is-${c.level}`}>
              <ChecklistIcon level={c.level} />
              <div><b>{c.title}</b><span>{c.text}</span></div>
            </li>
          ))}
        </ul>

        <div className="im-origin">
          <label className="op-field">
            <span>Subseção (de onde especificamente veio)</span>
            <select className="vx-input vx-select" value={row.sectionId ?? ""} disabled={!canScout || busy} aria-label="Subseção deste importado"
              onChange={(e) => { if (e.target.value === "__manage") onManage(); else onSection(e.target.value || null) }}>
              <option value="">Sem subseção</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              {canScout && <option value="__manage">Criar ou editar subseções…</option>}
            </select>
          </label>
          <p className="im-note">Para mover vários de uma vez, marque-os na lista.</p>
        </div>

        {st === "aprovado" && (
          <p className="im-approval is-ok"><BadgeCheck aria-hidden="true" /> Aprovado {row.approvedByName ? <>por <b>{row.approvedByName}</b> </> : null}em {fmtDay(row.approvedAt)}, conferindo a versão {row.approvedRevision} do CRM.</p>
        )}
        {st === "mudou" && (
          <p className="im-approval is-changed">
            <AlertTriangle aria-hidden="true" /> A versão {row.approvedRevision} foi aprovada {row.approvedByName ? <>por <b>{row.approvedByName}</b> </> : null}em {fmtDay(row.approvedAt)}, mas o CRM mandou a versão {row.revision} depois. Confira o que mudou e aprove de novo.
          </p>
        )}
        {st === "pendente" && <p className="im-approval">Ainda não foi conferido por ninguém.</p>}
      </section>

      <section className="vx-card">
        <h3 className="vx-card-title">O que o CRM sabe</h3>
        {!d ? (
          q.error ? <p className="mt-3 text-[12.5px] text-red-300">{q.error.message}</p> : <div className="mt-4 grid gap-3"><Skeleton h={16} w="60%" /><Skeleton h={16} w="80%" /><Skeleton h={16} w="50%" /></div>
        ) : (
          <>
            <dl className="sc-context">
              <div className={d.birthDate ? "" : "is-empty"}><dt>Nascimento</dt><dd>{d.birthDate ? fmtBirth(d.birthDate) : "Não informado"}</dd></div>
              <div className={d.position ? "" : "is-empty"}><dt>Posição</dt><dd>{d.position ?? "Não informado"}</dd></div>
              <div className={d.category ? "" : "is-empty"}><dt>Categoria</dt><dd>{d.category ?? "Não informado"}</dd></div>
              <div className={d.team ? "" : "is-empty"}><dt>Time</dt><dd>{d.team ?? "Não informado"}</dd></div>
              <div className={d.city ? "" : "is-empty"}><dt>Cidade / estado</dt><dd>{d.city ?? "Não informado"}</dd></div>
              <div className={d.filledBy ? "" : "is-empty"}><dt>Quem preencheu</dt><dd>{d.filledBy === "atleta" ? "O próprio atleta" : d.filledBy === "responsavel" ? "O responsável" : "Não informado"}</dd></div>
              {DETAILS.map((f) => {
                const v = d[f.key] as string | null
                return <div key={f.key} className={v ? "" : "is-empty"}><dt>{f.label}</dt><dd>{v ?? "Não informado"}</dd></div>
              })}
            </dl>

            <CrmDetails context={d} />

            {d.review.length > 0 && (
              <div className="sc-crm">
                <p className="sc-crm-warn"><AlertTriangle /> Textos que não deu para interpretar com segurança{row.memberId ? " (resolva na ficha do atleta)" : ""}</p>
                <ul className="sc-review">
                  {d.review.map((r, i) => (
                    <li key={i}>
                      <b>{FIELD_NAME[r.field] ?? r.field}</b>
                      {r.kind === "divergente"
                        ? <span>Na ficha: <s>{r.current}</s> · No CRM: <strong>{r.proposed}</strong></span>
                        : <span>{r.raw}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {d.answers.length > 0 && (
              <details className="sc-answers" open={d.answers.length <= 12}>
                <summary>Perguntas e respostas do formulário ({d.answers.length})</summary>
                <dl>{d.answers.map((a, i) => <div key={i}><dt>{a.question}</dt><dd>{a.answer}</dd></div>)}</dl>
              </details>
            )}

            {!row.hasContext && (
              <p className="im-approval is-changed mt-4"><AlertTriangle aria-hidden="true" /> O CRM não mandou respostas, notas, responsável nem histórico para esta pessoa. Se faltava algo, peça para reenviar do dashboard da wsltda.com.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
