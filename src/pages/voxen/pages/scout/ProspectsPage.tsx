import "./scout.css"
import "../opportunities/opportunities.css"

import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ArrowLeft, Lock, Trash2, UserSearch } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { formatMatchDate } from "@/pages/membros/model"
import { errMsg, useLoad, useScoutApi, type Prospect } from "./api"
import { CrmDetails } from "./ScoutTabs"
import { ScoutSetupNotice } from "./parts"

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
const day = (iso: string) => (iso ? formatMatchDate(iso.slice(0, 10)) : "—")
const nameOf = (p: Prospect) => p.athleteName ?? "Sem nome"
const FIELD_NAME: Record<string, string> = { birth_date: "Nascimento", position: "Posição", category: "Categoria", team: "Time", city: "Cidade / estado" }

const DETAILS: { key: keyof Prospect; label: string }[] = [
  { key: "pastClubs", label: "Clubes que já representou" },
  { key: "trials", label: "Avaliações e peneiras" },
  { key: "opportunitiesReceived", label: "Oportunidades que já recebeu" },
  { key: "goal", label: "Objetivo" },
  { key: "blocker", label: "O que impede hoje" },
  { key: "evaluatedClubs", label: "Clubes que já avaliaram o atleta" },
  { key: "strengthsAndImprovements", label: "Pontos fortes e pontos a melhorar" },
]

/**
 * Pré-cadastros (/voxen/pre-cadastros): leads do CRM (wsltda.com) que a equipe de lá escolheu enviar e que
 * ainda não se cadastraram na VOXEN. Não são atletas nem membros e NINGUÉM é contatado a partir daqui: é só
 * conhecer a pessoa. Boa parte é de menores, então é só para a equipe. Quando a pessoa se cadastra, o texto
 * daqui é apagado e o contexto passa a morar na ficha do membro.
 */
export default function ProspectsPage() {
  const { demo, canAdmin } = useVoxen()
  const { toast } = useToast()
  const api = useScoutApi(demo)
  const [params, setParams] = useSearchParams()
  const selectedId = params.get("pre")
  const [query, setQuery] = useState("")
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const list = useLoad(api, (a) => a.prospects(), [])

  const rows = useMemo(() => {
    const q = norm(query.trim())
    return (list.data ?? []).filter((p) => !q || norm(`${p.athleteName ?? ""} ${p.guardianName ?? ""} ${p.position ?? ""} ${p.category ?? ""} ${p.city ?? ""}`).includes(q))
  }, [list.data, query])

  if (list.error) return <ScoutSetupNotice error={list.error} />
  if (!api || !list.data) return <PageSkeleton />

  const selected = list.data.find((p) => p.id === selectedId) ?? null
  const select = (id: string | null) => { setAsking(false); setParams(id ? { pre: id } : {}) }

  const discard = async (p: Prospect) => {
    setBusy(true)
    try {
      await api.discardProspect(p.id)
      list.set((d) => (d ? d.filter((x) => x.id !== p.id) : d))
      select(null)
      toast({ title: "Pré-cadastro descartado", description: "O texto foi apagado e as próximas versões do CRM não o recriam." })
    } catch (e) {
      toast({ title: "Não foi possível descartar", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`op-page ${selected ? "has-selection" : ""}`}>
      <aside className="vx-card vx-card--flush op-list" aria-label="Pré-cadastros">
        <div className="op-list-head">
          <h2 className="vx-card-title">Pré-cadastros <span className="tnum text-zinc-500">{list.data.length}</span></h2>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">Leads do CRM que ainda não se cadastraram na VOXEN. Só a equipe vê; ninguém é contatado por aqui.</p>
          <input className="vx-input mt-3" placeholder="Buscar por nome, responsável ou posição" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar pré-cadastros" />
        </div>
        {rows.length ? (
          <ul className="op-rows vx-stagger">
            {rows.map((p, i) => (
              <li key={p.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <button type="button" className={`op-row ${selectedId === p.id ? "is-on" : ""}`} onClick={() => select(p.id)} aria-current={selectedId === p.id || undefined}>
                  <Avatar name={nameOf(p)} size={38} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{nameOf(p)}</b>
                    <small className="block truncate">{[p.position, p.category].filter(Boolean).join(" · ") || "Sem posição"} · {p.notes.length} nota{p.notes.length === 1 ? "" : "s"} · {day(p.updatedAt)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={<UserSearch className="h-6 w-6" />} title={list.data.length ? "Ninguém encontrado" : "Nenhum pré-cadastro ainda"}>
            {list.data.length ? "Troque a busca." : "Quando a wsltda.com enviar leads que ainda não se cadastraram, eles aparecem aqui."}
          </Empty>
        )}
      </aside>

      <section className="op-detail" aria-live="polite">
        {selected ? (
          <div key={selected.id} className="op-detail-in">
            <div className="vx-card op-player">
              <button type="button" className="vx-icon-btn op-back" onClick={() => select(null)} aria-label="Voltar à lista"><ArrowLeft /></button>
              <Avatar name={nameOf(selected)} size={56} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate">{nameOf(selected)}</h2>
                <p>{[selected.position, selected.category, selected.team, selected.city].filter(Boolean).join(" · ") || "Dados do formulário abaixo"}</p>
              </div>
              {canAdmin && !asking && <button type="button" className="vx-btn h-8" onClick={() => setAsking(true)}><Trash2 /> Descartar</button>}
            </div>

            <div className="sc-prospect-warn" role="note">
              <Lock /> <span><b>Pré-cadastro do CRM, não é um atleta.</b> A pessoa ainda não se cadastrou na VOXEN e ninguém é contatado a partir daqui. Versão {selected.revision}, recebida em {day(selected.firstReceivedAt)} e atualizada em {day(selected.updatedAt)}. Quando ela se cadastrar, este texto é apagado e o contexto passa para a ficha do membro.</span>
            </div>

            {asking && (
              <div className="bp-confirm" role="alertdialog" aria-label="Descartar pré-cadastro">
                <p>Descartar <strong>{nameOf(selected)}</strong>? O texto é apagado e as próximas versões do CRM não recriam este pré-cadastro. <strong>Não dá para desfazer.</strong></p>
                <div>
                  <button type="button" className="vx-btn h-8" onClick={() => setAsking(false)}>Cancelar</button>
                  <button type="button" className="vx-btn op-danger h-8" disabled={busy} onClick={() => void discard(selected)}>Descartar de vez</button>
                </div>
              </div>
            )}

            <section className="vx-card">
              <h3 className="vx-card-title">O que o CRM sabe</h3>
              <dl className="sc-context">
                {selected.birthDate && <div><dt>Nascimento</dt><dd>{formatMatchDate(selected.birthDate)}</dd></div>}
                {selected.filledBy && <div><dt>Quem preencheu</dt><dd>{selected.filledBy === "atleta" ? "O próprio atleta" : "O responsável"}</dd></div>}
                {DETAILS.map((f) => (selected[f.key] ? <div key={f.key}><dt>{f.label}</dt><dd>{selected[f.key] as string}</dd></div> : null))}
              </dl>

              <CrmDetails context={selected} />

              {selected.review.length > 0 && (
                <div className="sc-crm">
                  <p className="sc-crm-warn">Textos que não deu para interpretar com segurança</p>
                  <ul className="sc-review">
                    {selected.review.map((r, i) => <li key={i}><b>{FIELD_NAME[r.field] ?? r.field}</b><span>{r.raw}</span></li>)}
                  </ul>
                </div>
              )}

              {selected.answers.length > 0 && (
                <details className="sc-answers">
                  <summary>Perguntas e respostas do formulário ({selected.answers.length})</summary>
                  <dl>{selected.answers.map((a, i) => <div key={i}><dt>{a.question}</dt><dd>{a.answer}</dd></div>)}</dl>
                </details>
              )}
            </section>
          </div>
        ) : (
          <div className="vx-card op-pick">
            <Empty icon={<UserSearch className="h-6 w-6" />} title="Escolha um pré-cadastro">
              Ao lado ficam os leads do CRM que a equipe da wsltda.com escolheu enviar. Selecione um para conhecer a pessoa antes de ela se cadastrar.
            </Empty>
          </div>
        )}
      </section>
    </div>
  )
}
