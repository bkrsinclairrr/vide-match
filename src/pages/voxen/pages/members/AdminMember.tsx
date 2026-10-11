import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ArrowLeft, CircleDot, Copy, Eye, EyeOff, Film, GitCompareArrows, Plus, Power, UserCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { whatsappLink } from "@/pages/voxen/data"
import { MemberAvatar, RatingChip, ResultBadge, Shield } from "@/pages/membros/components/bits"
import { Board, BOARD_COLORS } from "@/pages/membros/components/Board"
import { ageFrom, formatMatchDate, positionCodeOf, sortMatchesDesc, type Match } from "@/pages/membros/model"
import { summarizeMatch, summarizeProfile } from "@/pages/membros/metrics"
import type { MemberInput } from "@/pages/membros/api"
import { MemberForm, ScoutEditor, SetupNotice, inputFromMember, memberAreaUrl, useAdminSource, useSourceData } from "./shared"

type Tab = "partidas" | "dados" | "scout" | "desempenho"

export default function AdminMember() {
  const { id = "" } = useParams()
  const source = useAdminSource()
  const { byKey, demo } = useVoxen()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = (params.get("aba") as Tab) || "partidas"
  const [saving, setSaving] = useState(false)
  const bundle = useSourceData(source, (s) => s.getBundle(id, false), [id])

  const summary = useMemo(() => (bundle.data ? summarizeProfile(bundle.data) : null), [bundle.data])

  if (bundle.error) return <SetupNotice error={bundle.error} />
  if (bundle.loading && !bundle.data) return <PageSkeleton />
  if (!bundle.data || !summary) {
    return <div className="vx-card"><Empty icon={<ArrowLeft className="h-6 w-6" />} title="Perfil não encontrado"><Link to="/voxen/membros" className="text-amber-300 underline">Voltar para membros</Link></Empty></div>
  }

  const { member, matches } = bundle.data
  const isMember = member.kind === "membro"
  const lead = member.leadId ? byKey.get(`lead:${member.leadId}`) : undefined
  const age = ageFrom(member.birthDate)
  const inviteText = `Olá, ${member.fullName.split(" ")[0]}! Seu acesso à plataforma da Zyron está liberado. Entre em ${window.location.origin}/voxen, toque em “Primeiro acesso” e crie sua senha com o e-mail ${member.email}.`

  const saveMember = async (input: MemberInput, message = "Dados salvos") => {
    if (!source) return
    setSaving(true)
    try {
      const saved = await source.saveMember(input)
      bundle.setData((b) => (b ? { ...b, member: saved } : b))
      toast({ title: message, description: saved.fullName })
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (m: Match) => {
    if (!source) return
    try {
      const saved = await source.saveMatch({ ...m, published: !m.published })
      bundle.setData((b) => (b ? { ...b, matches: b.matches.map((x) => (x.id === saved.id ? saved : x)) } : b))
      toast({ title: saved.published ? "Partida publicada" : "Partida despublicada", description: `${saved.team} × ${saved.opponent}` })
    } catch (e) {
      toast({ title: "Não foi possível atualizar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    }
  }

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteText)
      toast({ title: "Convite copiado", description: "Cole no WhatsApp do atleta." })
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" })
    }
  }

  const ordered = sortMatchesDesc(matches)
  const TABS: [Tab, string][] = [["partidas", `Partidas (${matches.length})`], ["dados", "Dados"], ["scout", "Avaliação do scout"], ["desempenho", "Desempenho"]]

  return (
    <>
      <section className="vx-card mb-[18px] overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 220px at 10% 0%, rgba(251,191,36,0.12), transparent 70%)" }} />
        <div className="relative flex flex-wrap items-center gap-5">
          <Link to={isMember ? "/voxen/membros" : "/voxen/membros?tipo=referencias"} className="vx-icon-btn" aria-label="Voltar"><ArrowLeft /></Link>
          <MemberAvatar member={member} size={72} ring="#fbbf24" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-[24px] font-bold tracking-[-0.02em]">{member.fullName}</h2>
              <span className={`vx-pos ${member.position ? "" : "vx-pos--none"}`}>{positionCodeOf(member.position)}</span>
              {!isMember && <span className="vx-tag" style={{ color: "#38bdf8", background: "rgba(56,189,248,.12)" }}>Referência</span>}
              {!member.active && <span className="vx-tag" style={{ color: "#a1a1aa", background: "rgba(255,255,255,.06)" }}>Inativo</span>}
            </div>
            <p className="mt-1 text-[13px] text-zinc-400">{[member.category, age ? `${age} anos` : null, member.team, member.city].filter(Boolean).join(" · ") || "Complete os dados na aba Dados"}</p>
            {isMember && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                {member.userId
                  ? <span className="vx-tag" style={{ color: "#34d399", background: "rgba(52,211,153,.12)" }}><UserCheck className="h-3 w-3" /> Conta ativa · {member.email}</span>
                  : <span className="vx-tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.12)" }}><CircleDot className="h-3 w-3" /> Aguardando primeiro acesso · {member.email}</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isMember && !member.userId && (
              <>
                <button type="button" className="vx-btn" onClick={() => void copyInvite()}><Copy /> Copiar convite</button>
                {lead && whatsappLink(lead, inviteText) && (
                  <a className="vx-btn vx-btn--wpp" href={whatsappLink(lead, inviteText) as string} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4" /> Enviar convite</a>
                )}
              </>
            )}
            {isMember && (
              <a className="vx-btn" href={memberAreaUrl(member.id, "", demo)} target="_blank" rel="noopener noreferrer"><Eye /> Ver como membro</a>
            )}
            <button type="button" className="vx-btn" onClick={() => navigate(`/voxen/membros/comparar?${new URLSearchParams({ p: member.id })}`)}><GitCompareArrows /> Comparar</button>
            <button type="button" className="vx-icon-btn" title={member.active ? "Desativar acesso" : "Reativar"} aria-label={member.active ? "Desativar" : "Reativar"}
              onClick={() => void saveMember({ ...inputFromMember(member), active: !member.active }, member.active ? "Perfil desativado" : "Perfil reativado")}>
              <Power style={{ color: member.active ? "#34d399" : "#a1a1aa" }} />
            </button>
          </div>
        </div>
      </section>

      <div className="vx-tabs mb-5" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`vx-tab ${tab === k ? "is-on" : ""}`} onClick={() => setParams(k === "partidas" ? {} : { aba: k })}>{label}</button>
        ))}
      </div>

      {tab === "partidas" && (
        <section className="vx-card vx-card--flush">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-3.5">
            <p className="text-[13px] text-zinc-400">
              <strong className="text-white tnum">{matches.filter((m) => m.published).length}</strong> publicada{matches.filter((m) => m.published).length === 1 ? "" : "s"} de <span className="tnum">{matches.length}</span>.
              {isMember && " O membro só vê as publicadas."}
            </p>
            <Link to={`/voxen/membros/${member.id}/partidas/nova`} className="vx-btn vx-btn--gold"><Plus /> Nova partida</Link>
          </div>
          {ordered.length ? (
            <div className="overflow-x-auto">
              <table className="vx-table">
                <thead>
                  <tr><th style={{ paddingLeft: 20 }}>Partida</th><th>Data</th><th>Min</th><th>Vídeo</th><th>Ações</th><th>Nota</th><th>Visível</th></tr>
                </thead>
                <tbody>
                  {ordered.map((m, i) => {
                    const s = summarizeMatch(m, bundle.data?.events ?? [])
                    return (
                      <tr key={m.id} style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }} onClick={() => navigate(`/voxen/membros/${member.id}/partidas/${m.id}`)}>
                        <td style={{ paddingLeft: 20 }}>
                          <div className="flex items-center gap-3">
                            <ResultBadge match={m} />
                            <Shield name={m.opponent} size={26} />
                            <div className="min-w-0">
                              <Link to={`/voxen/membros/${member.id}/partidas/${m.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold text-white hover:text-amber-300">
                                {m.team} <span className="tnum text-amber-300">{m.goalsFor ?? "–"} × {m.goalsAgainst ?? "–"}</span> {m.opponent}
                              </Link>
                              <span className="text-[11.5px] text-zinc-500">{m.competition ?? "Partida"} · {m.isHome ? "Casa" : "Fora"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="tnum text-zinc-400">{formatMatchDate(m.playedOn)}</td>
                        <td className="tnum text-zinc-400">{m.minutes ?? "—"}'</td>
                        <td>{m.videoUrl ? <Film className="h-4 w-4 text-amber-300" aria-label="Com vídeo" /> : <span className="text-zinc-600">—</span>}</td>
                        <td className="tnum text-zinc-300">{s.events.length}</td>
                        <td><RatingChip rating={s.rating} size="sm" /></td>
                        <td>
                          <button type="button" className={`vx-chip h-7 ${m.published ? "is-on" : ""}`} onClick={(e) => { e.stopPropagation(); void togglePublished(m) }}>
                            {m.published ? <><Eye className="h-3.5 w-3.5" /> Publicada</> : <><EyeOff className="h-3.5 w-3.5" /> Rascunho</>}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={<Film className="h-6 w-6" />} title="Nenhuma partida cadastrada">
              Cadastre a partida com o link do vídeo e marque as ações: elas viram as métricas, o mapa de calor e as notas.
            </Empty>
          )}
        </section>
      )}

      {tab === "dados" && (
        <section className="vx-card">
          <MemberForm key={member.updatedAt} kind={member.kind} initial={inputFromMember(member)} onSave={(input) => saveMember(input)} saving={saving} />
        </section>
      )}

      {tab === "scout" && (
        <ScoutEditor key={member.updatedAt} member={member} saving={saving}
          onSave={(scout) => saveMember({ ...inputFromMember(member), scout }, "Avaliação salva")} />
      )}

      {tab === "desempenho" && (
        summary.matches.length
          ? (
            <>
              <p className="mb-4 text-[13px] text-zinc-400">Inclui as partidas em rascunho. O membro vê só as publicadas.</p>
              <Board cols={[{ summary, color: BOARD_COLORS[0] }]} onOpenMatch={(m) => navigate(`/voxen/membros/${member.id}/partidas/${m.match.id}`)} />
            </>
          )
          : <div className="vx-card"><Empty icon={<Film className="h-6 w-6" />} title="Sem partidas para calcular o desempenho" /></div>
      )}
    </>
  )
}
