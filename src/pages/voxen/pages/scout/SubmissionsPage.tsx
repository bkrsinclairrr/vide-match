import "./scout.css"

import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, Clapperboard, ExternalLink, Film, Hourglass, Link2, Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { MemberAvatar } from "@/pages/membros/components/bits"
import { formatMatchDate } from "@/pages/membros/model"
import { youtubeThumb, youtubeWatch, type SubmissionStatus } from "@/pages/membros/scoutLayer"
import type { ProfileListItem } from "@/pages/membros/api"
import { SetupNotice, useAdminSource, useSourceData } from "../members/shared"
import { errMsg, useLoad, useScoutApi, type StaffSubmission, type SubmissionPatch } from "./api"
import { ScoutSetupNotice } from "./parts"

type Filter = SubmissionStatus | "todos"

const FILTERS: [Filter, string][] = [["enviado", "Novos"], ["em_analise", "Em análise"], ["analisado", "Analisados"], ["recusado", "Recusados"], ["todos", "Todos"]]

const STATUS_TEXT: Record<SubmissionStatus, string> = {
  enviado: "Novo", em_analise: "Em análise", analisado: "Analisado", recusado: "Recusado",
}

/**
 * Caixa de envios (/voxen/envios): os links do YouTube que os atletas mandaram pela área deles.
 * Daqui a equipe abre o vídeo, cria a partida já com o link (e o envio fica "em análise") ou
 * recusa com um motivo que o atleta lê. Publicar a partida marca o envio como "analisado".
 */
export default function SubmissionsPage() {
  const { demo, canScout } = useVoxen()
  const { toast } = useToast()
  const navigate = useNavigate()
  const source = useAdminSource()
  const api = useScoutApi(demo)
  const [filter, setFilter] = useState<Filter>("enviado")
  const [refusing, setRefusing] = useState<{ id: string; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const members = useSourceData(source, (s) => s.listProfiles(), [])
  const subs = useLoad(api, (a) => a.submissions(), [])

  const owners = useMemo(() => {
    const all = members.data ?? []
    return { byId: new Map(all.map((m) => [m.id, m])), byUser: new Map(all.filter((m) => m.userId).map((m) => [m.userId as string, m])) }
  }, [members.data])

  if (members.error) return <SetupNotice error={members.error} />
  if (subs.error) return <ScoutSetupNotice error={subs.error} />
  if (!api || !subs.data) return <PageSkeleton />

  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, k === "todos" ? subs.data!.length : subs.data!.filter((s) => s.status === k).length])) as Record<Filter, number>
  const list = subs.data.filter((s) => filter === "todos" || s.status === filter)
  const ownerOf = (s: StaffSubmission): ProfileListItem | null => (s.memberId && owners.byId.get(s.memberId)) || owners.byUser.get(s.userId) || null

  const update = async (s: StaffSubmission, patch: SubmissionPatch, done: string) => {
    setBusy(s.id)
    try {
      const saved = await api.updateSubmission(s.id, patch)
      subs.set((d) => (d ? d.map((x) => (x.id === saved.id ? saved : x)) : d))
      toast({ title: done })
      setRefusing(null)
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="vx-chips mb-[18px]" role="group" aria-label="Filtrar envios">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" className={`vx-chip ${filter === k ? "is-on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {label} <span className="tnum opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>

      <section className="vx-card vx-card--flush">
        {list.length ? list.map((s, i) => {
          const owner = ownerOf(s)
          const watch = youtubeWatch(s.videoId)
          const thumb = youtubeThumb(s.videoId)
          return (
            <div key={s.id} className="sb-row" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
              <a className="sb-thumb" href={watch ?? undefined} target="_blank" rel="noopener noreferrer" aria-label="Abrir o vídeo no YouTube">
                {thumb && <img src={thumb} alt="" width={128} height={72} loading="lazy" decoding="async" />}
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {owner && <MemberAvatar member={owner} size={24} />}
                  <b className="truncate">{owner?.fullName ?? "Atleta sem cadastro de membro"}</b>
                  <span className={`sm-status is-${s.status}`}>{STATUS_TEXT[s.status]}</span>
                </div>
                <small className="block">
                  {s.opponent ? `Contra ${s.opponent}` : "Adversário não informado"} · {s.playedOn ? `jogo em ${formatMatchDate(s.playedOn)}` : "sem data"} · enviado em {formatMatchDate(s.createdAt.slice(0, 10))}
                </small>
                {s.note && <p>“{s.note}”</p>}
                {s.status === "recusado" && s.reviewNote && <p className="text-red-300">Motivo: {s.reviewNote}</p>}
              </div>
              <div className="sb-actions">
                {watch && <a className="vx-btn h-8" href={watch} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir vídeo</a>}
                {canScout && owner && !s.memberId && (
                  <button type="button" className="vx-btn h-8" disabled={busy === s.id} onClick={() => void update(s, { memberId: owner.id }, "Envio ligado ao membro")}><Link2 /> Ligar ao membro</button>
                )}
                {s.matchId && owner && <Link className="vx-btn h-8" to={`/voxen/membros/${owner.id}/partidas/${s.matchId}`}><Film /> Abrir partida</Link>}
                {canScout && owner && !s.matchId && s.status !== "recusado" && (
                  <button type="button" className="vx-btn vx-btn--gold h-8" onClick={() => navigate(`/voxen/membros/${owner.id}/partidas/nova?envio=${encodeURIComponent(s.id)}`)}><Plus /> Criar partida</button>
                )}
                {canScout && s.status === "enviado" && (
                  <button type="button" className="vx-btn h-8" disabled={busy === s.id} onClick={() => void update(s, { status: "em_analise" }, "Marcado como em análise")}><Hourglass /> Em análise</button>
                )}
                {canScout && (s.status === "enviado" || s.status === "em_analise") && (
                  <button type="button" className="vx-btn h-8" disabled={busy === s.id} onClick={() => setRefusing({ id: s.id, text: "" })}><X /> Recusar</button>
                )}
                {canScout && s.status === "recusado" && (
                  <button type="button" className="vx-btn h-8" disabled={busy === s.id} onClick={() => void update(s, { status: "enviado", reviewNote: null }, "Envio reaberto")}>Reabrir</button>
                )}
                {busy === s.id && <Loader2 className="op-spin text-zinc-500" />}
              </div>
              {refusing?.id === s.id && (
                <div className="sb-refuse">
                  <input className="vx-input h-9" autoFocus placeholder="Motivo (o atleta lê): ex.: o vídeo está privado" value={refusing.text} maxLength={500}
                    onChange={(e) => setRefusing({ id: s.id, text: e.target.value })} aria-label="Motivo da recusa" />
                  <button type="button" className="vx-btn vx-btn--gold h-9" disabled={!refusing.text.trim() || busy === s.id}
                    onClick={() => void update(s, { status: "recusado", reviewNote: refusing.text }, "Envio recusado: o atleta vê o motivo")}><Check /> Recusar</button>
                  <button type="button" className="vx-btn h-9" onClick={() => setRefusing(null)}>Cancelar</button>
                </div>
              )}
              {!owner && (
                <p className="w-full pl-[142px] text-[12px] text-zinc-500 max-sm:pl-0">
                  Esta conta ainda não tem cadastro de membro. Cadastre o atleta em Membros (com o mesmo e-mail) para criar a partida.
                </p>
              )}
            </div>
          )
        }) : (
          <Empty icon={<Clapperboard className="h-6 w-6" />} title={filter === "enviado" ? "Nenhum envio novo" : "Nada por aqui"}>
            Quando um atleta mandar o link de um jogo pela área dele, ele aparece aqui.
          </Empty>
        )}
      </section>
    </>
  )
}
