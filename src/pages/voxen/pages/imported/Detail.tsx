import { useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowLeft, BadgeCheck, CheckCircle2, CircleX, Download, ExternalLink, Lock, RotateCcw, Trash2 } from "lucide-react"
import { downloadFile } from "@/lib/exportFile"
import { Avatar, Skeleton } from "@/pages/voxen/ui"
import { useLoad } from "../scout/api"
import { CrmDetails } from "../scout/ScoutTabs"
import type { ImportDetail, ImportedApi } from "./api"
import { contextFile, contextFileName } from "./markdown"
import {
  KIND_BLURB, arrivalHistory, basicsOf, dayKey, displayName, plural, statusOf, subline, type ImportRow, type ImportSection, type Twin,
} from "./model"
import { BasicsDots, KindBadge, SectionChip, StatusBadge } from "./parts"
import { contextCounts, summarizeContext, type SummaryLine } from "./summary"

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
  const basics = basicsOf(row)
  const missing = basics.missing.filter((b) => b !== "time")
  return [
    row.hasContext
      ? { level: "ok", title: "Contexto do CRM", text: `${plural(row.answersCount, "resposta", "respostas")} do formulário e ${plural(row.notesCount, "nota", "notas")} de atendimento.` }
      : { level: "miss", title: "Contexto do CRM", text: "O CRM não trouxe nenhum contexto para esta pessoa, só dados básicos." },
    basics.complete
      ? { level: "ok", title: "Dados básicos", text: "Idade, posição, categoria e cidade preenchidas." }
      : { level: "warn", title: "Dados básicos", text: `Faltam ${missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} e ${missing[missing.length - 1]}`}.` },
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

/** O resumo do contexto: o que a equipe lê primeiro, em linhas curtas. */
function SummaryBox({ lines }: { lines: SummaryLine[] }) {
  if (!lines.length) return null
  return (
    <div className="im-summary" aria-label="Resumo do contexto">
      <h4>Em resumo</h4>
      <ul>
        {lines.map((l) => <li key={l.label}><b>{l.label}</b><span>{l.text}</span></li>)}
      </ul>
    </div>
  )
}

export function ImportedDetail({ row, api, sections, canScout, canAdmin, busy, twins, onBack, onOpenTwin, onSection, onApprove, onManage, onDiscard }: {
  row: ImportRow
  api: ImportedApi
  sections: ImportSection[]
  canScout: boolean
  canAdmin: boolean
  busy: boolean
  /** Outras pessoas com o mesmo nome (jogadores ou outros importados): pode ser a mesma que chegou por outro caminho. */
  twins: Twin[]
  onBack: () => void
  onOpenTwin: (rowKey: string) => void
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
  const headline = subline(row) || "Sem dados básicos do CRM"
  const checks = checksOf(row, section)
  const fixed = checks.every((c) => c.level === "ok")
  const basics = basicsOf(row)
  const arrived = arrivalHistory(row)

  const download = () => {
    if (!d) return
    const entries = [{ row, detail: d, sectionName: section?.name ?? null }]
    const today = dayKey(new Date().toISOString())
    downloadFile(contextFileName(entries, today), contextFile(entries, { today }).text, "text/markdown;charset=utf-8")
  }

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
            <BasicsDots row={row} />
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
          {row.hasContext && (
            <button type="button" className="vx-btn h-9" disabled={!d} onClick={download} title="Baixa um arquivo .md com o resumo e tudo o que o CRM contou desta pessoa">
              <Download /> Baixar contexto (.md)
            </button>
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
          <b>{KIND_BLURB[row.kind]}</b> Só a equipe vê. Versão {row.revision} do CRM{arrived ? `. ${arrived}` : ""}.
          {row.wasProspect && <> Esta pessoa veio antes como pré-cadastro e depois chegou como atleta: é o mesmo registro, não um novo.</>}
        </span>
      </div>

      {twins.length > 0 && (
        <div className="im-twins" role="note">
          <AlertTriangle aria-hidden="true" />
          <div>
            <b>Há {plural(twins.length, "outra pessoa", "outras pessoas")} com o mesmo nome</b>
            <p>Pode ser a mesma pessoa que chegou por outro caminho (outro e-mail, outra conta). Confira antes de aprovar. Nada é juntado sozinho.</p>
            <ul>
              {twins.map((t) => (
                <li key={`${t.kind}:${t.target}`}>
                  {t.kind === "jogador"
                    ? <Link to={`/voxen/jogadores/${encodeURIComponent(t.target)}`}>{t.name}</Link>
                    : <button type="button" className="im-link" onClick={() => onOpenTwin(t.target)}>{t.name}</button>}
                  <small>{t.detail}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
            <h3 className="vx-card-title">Conferência</h3>
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
        {row.kind === "pre" && row.approvedAt && (
          <p className="im-approval is-ok">
            <ExternalLink aria-hidden="true" /> Está em Jogadores, só para a equipe. <Link to={`/voxen/jogadores/${encodeURIComponent(`crm:${row.ref}`)}`}>Abrir a ficha</Link>
          </p>
        )}
        {row.kind === "pre" && !row.approvedAt && (
          <p className="im-approval">Quando for aprovado, este pré-cadastro aparece em Jogadores (só para a equipe).</p>
        )}
        {st === "mudou" && (
          <p className="im-approval is-changed">
            <AlertTriangle aria-hidden="true" /> A versão {row.approvedRevision} foi aprovada {row.approvedByName ? <>por <b>{row.approvedByName}</b> </> : null}em {fmtDay(row.approvedAt)}, mas o CRM mandou a versão {row.revision} depois. Confira o que mudou e aprove de novo.
          </p>
        )}
        {st === "pendente" && <p className="im-approval">Ainda não foi conferido por ninguém.</p>}
      </section>

      <section className="vx-card im-basics">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="vx-card-title">Dados básicos</h3>
            <p className="vx-card-sub">{basics.complete ? "Idade, posição, categoria e cidade: completos." : `Faltam ${basics.missing.filter((b) => b !== "time").join(", ")}.`}</p>
          </div>
          <BasicsDots row={row} />
        </div>
        <dl className="sc-context">
          <div className={row.birthDate ? "" : "is-empty"}><dt>Nascimento</dt><dd>{row.birthDate ? fmtBirth(row.birthDate) : "Não informado"}</dd></div>
          <div className={row.age ? "" : "is-empty"}><dt>Idade</dt><dd>{row.age ? `${row.age} anos` : "Não informada"}</dd></div>
          <div className={row.position ? "" : "is-empty"}><dt>Posição</dt><dd>{row.position ?? "Não informada"}</dd></div>
          <div className={row.category ? "" : "is-empty"}><dt>Categoria</dt><dd>{row.category ?? "Não informada"}</dd></div>
          <div className={row.city ? "" : "is-empty"}><dt>Cidade / estado</dt><dd>{row.city ?? "Não informada"}</dd></div>
          <div className={row.team ? "" : "is-empty"}><dt>Time</dt><dd>{row.team ?? "Não informado"}</dd></div>
        </dl>
        {d && d.review.length > 0 && (
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
      </section>

      {row.hasContext ? (
        <section className="vx-card im-context">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="vx-card-title">Contexto do CRM</h3>
              <p className="vx-card-sub">{d ? contextCounts(d) || "O que o CRM sabe desta pessoa." : "Carregando…"}</p>
            </div>
          </div>
          {!d ? (
            q.error ? <p className="mt-3 text-[12.5px] text-red-300">{q.error.message}</p> : <div className="mt-4 grid gap-3"><Skeleton h={16} w="60%" /><Skeleton h={16} w="80%" /><Skeleton h={16} w="50%" /></div>
          ) : (
            <>
              <SummaryBox lines={summarizeContext(d)} />

              <dl className="sc-context">
                <div className={d.filledBy ? "" : "is-empty"}><dt>Quem preencheu</dt><dd>{d.filledBy === "atleta" ? "O próprio atleta" : d.filledBy === "responsavel" ? "O responsável" : "Não informado"}</dd></div>
                {DETAILS.map((f) => {
                  const v = d[f.key] as string | null
                  return <div key={f.key} className={v ? "" : "is-empty"}><dt>{f.label}</dt><dd>{v ?? "Não informado"}</dd></div>
                })}
              </dl>

              <CrmDetails context={d} />

              {d.answers.length > 0 && (
                <details className="sc-answers" open={d.answers.length <= 12}>
                  <summary>Perguntas e respostas do formulário ({d.answers.length})</summary>
                  <dl>{d.answers.map((a, i) => <div key={i}><dt>{a.question}</dt><dd>{a.answer}</dd></div>)}</dl>
                </details>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="vx-card im-context is-none">
          <h3 className="vx-card-title">Contexto do CRM</h3>
          <p className="im-approval is-changed mt-3">
            <AlertTriangle aria-hidden="true" /> O CRM não mandou respostas, notas, responsável nem histórico para esta pessoa: só os dados básicos acima. Se faltava algo, peça para reenviar do dashboard da wsltda.com.
          </p>
        </section>
      )}
    </div>
  )
}
