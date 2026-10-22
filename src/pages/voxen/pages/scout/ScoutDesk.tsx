import "./scout.css"

import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlarmClock, ArrowRight, ClipboardList, Clapperboard, Database, Film, Inbox, UserRoundSearch } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { CountUp } from "@/pages/voxen/charts"
import { CardHead, Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { MemberAvatar } from "@/pages/membros/components/bits"
import { ClubCrest, DeadlineChip } from "@/pages/membros/components/ClubCrest"
import { completenessOf } from "@/pages/membros/completeness"
import { deadlineInfo, youtubeThumb } from "@/pages/membros/scoutLayer"
import { formatMatchDate } from "@/pages/membros/model"
import type { ProfileListItem } from "@/pages/membros/api"
import { SetupNotice, useAdminSource, useSourceData } from "../members/shared"
import { isLive } from "../opportunities/model"
import { ScoutSetupMissingError, useLoad, useScoutApi, type CrmHealth } from "./api"
import { ConflictList } from "./ScoutTabs"
import { ScoutSetupNotice } from "./parts"

const LIMIT = 6

/**
 * Mesa do Scout (/voxen/mesa): por onde o Scout começa o dia. A fila de trabalho mostra o que
 * espera alguém da equipe: vídeos que os atletas mandaram, oportunidades com prazo perto,
 * fichas incompletas, jogadores sem nenhuma partida analisada e o que veio do CRM para revisar.
 * "Meus jogadores" filtra pelos que a pessoa acompanha.
 */
export default function ScoutDesk() {
  const { demo } = useVoxen()
  const { user } = useAuth()
  const source = useAdminSource()
  const api = useScoutApi(demo)
  const navigate = useNavigate()
  const [mine, setMine] = useState(false)
  const members = useSourceData(source, (s) => s.listProfiles(), [])
  const scout = useLoad(api, async (a) => {
    const [submissions, opportunities, controls, conflicts, health] = await Promise.all([
      a.submissions(), a.opportunities(), a.controls(), a.conflicts(), a.crmHealth(),
    ])
    return { submissions, opportunities, controls, conflicts, health }
  }, [])
  const me = demo ? "demo-scout" : user?.id ?? null

  const view = useMemo(() => {
    const all = (members.data ?? []).filter((m) => m.kind === "membro" && m.active)
    const d = scout.data
    const followed = new Set((d?.controls ?? []).filter((c) => c.scoutId && c.scoutId === me).map((c) => c.memberId))
    const people = mine ? all.filter((m) => followed.has(m.id)) : all
    const ids = new Set(people.map((m) => m.id))
    const byId = new Map(all.map((m) => [m.id, m]))
    const byUser = new Map(all.filter((m) => m.userId).map((m) => [m.userId as string, m]))
    const newSubs = (d?.submissions ?? []).filter((s) => s.status === "enviado")
      .map((s) => ({ s, m: (s.memberId && byId.get(s.memberId)) || byUser.get(s.userId) || null }))
      .filter(({ m }) => !mine || (m && ids.has(m.id)))
    const due = (d?.opportunities ?? []).filter((o) => isLive(o) && ids.has(o.memberId))
      .map((o) => ({ o, info: deadlineInfo(o.deadline) }))
      .filter(({ info }) => info.tone === "urgent" || info.tone === "soon")
      .sort((a, b) => (a.o.deadline ?? "").localeCompare(b.o.deadline ?? ""))
    const ranked = people.map((m) => ({ m, c: completenessOf(m) }))
    const incomplete = ranked.filter((x) => x.c.pct < 100).sort((a, b) => a.c.pct - b.c.pct)
    const avg = ranked.length ? Math.round(ranked.reduce((a, x) => a + x.c.pct, 0) / ranked.length) : 0
    const noAnalysis = people.filter((m) => m.matchCount === 0).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const conflicts = (d?.conflicts ?? []).filter((c) => ids.has(c.memberId))
    return { people, followed, newSubs, due, incomplete, avg, noAnalysis, conflicts, byId }
  }, [members.data, scout.data, mine, me])

  if (members.error) return <SetupNotice error={members.error} />
  if (members.loading && !members.data) return <PageSkeleton />
  const missing = scout.error instanceof ScoutSetupMissingError

  const kpis = [
    { icon: Inbox, label: "Envios novos", value: view.newSubs.length, to: "/voxen/envios", warn: view.newSubs.length > 0 },
    { icon: AlarmClock, label: "Prazos em 7 dias", value: view.due.length, to: "/voxen/oportunidades", warn: view.due.some((x) => x.info.tone === "urgent") },
    { icon: ClipboardList, label: `Fichas completas (média ${view.avg}%)`, value: view.people.length - view.incomplete.length, to: "#fichas", warn: false },
    { icon: Film, label: "Sem partida analisada", value: view.noAnalysis.length, to: "#sem-analise", warn: false },
    { icon: Database, label: "Do CRM para revisar", value: view.conflicts.length, to: "#crm", warn: view.conflicts.length > 0 },
  ]

  return (
    <>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-400">A fila de trabalho de hoje{mine ? " para os jogadores que você acompanha" : ""}.</p>
        <div className="vx-tabs" role="tablist" aria-label="Quais jogadores">
          <button type="button" role="tab" aria-selected={!mine} className={`vx-tab ${!mine ? "is-on" : ""}`} onClick={() => setMine(false)}>Todos</button>
          <button type="button" role="tab" aria-selected={mine} className={`vx-tab ${mine ? "is-on" : ""}`} onClick={() => setMine(true)}>
            Meus jogadores <span className="ml-1 tnum text-zinc-500">{view.followed.size}</span>
          </button>
        </div>
      </div>

      {missing && <ScoutSetupNotice error={scout.error as Error} />}
      {scout.error && !missing && <ScoutSetupNotice error={scout.error} />}

      <div className="sd-kpis vx-stagger">
        {kpis.map((k, i) => (
          <button key={k.label} type="button" className={`vx-card sd-kpi text-left ${k.warn ? "is-warn" : ""}`} style={{ "--i": i } as React.CSSProperties}
            onClick={() => (k.to.startsWith("#") ? document.getElementById(k.to.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }) : navigate(k.to))}>
            <k.icon />
            <b className="tnum"><CountUp value={k.value} /></b>
            <span>{k.label}</span>
          </button>
        ))}
      </div>

      <div className="sd-grid">
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><Inbox className="h-4 w-4 text-amber-300" /> Vídeos para analisar</span>}
            sub="Jogos que os atletas mandaram pela área deles." actions={<Link to="/voxen/envios" className="text-[12.5px] font-semibold text-amber-300 hover:underline">Caixa de envios</Link>} />
          {view.newSubs.length ? (
            <ul className="sd-list">
              {view.newSubs.slice(0, LIMIT).map(({ s, m }) => (
                <li key={s.id}>
                  <Link to="/voxen/envios">
                    {youtubeThumb(s.videoId) && <img src={youtubeThumb(s.videoId) as string} alt="" width={64} height={36} loading="lazy" />}
                    <span className="min-w-0 flex-1"><b className="block truncate">{m?.fullName ?? "Atleta sem cadastro de membro"}</b><small className="block truncate">{s.opponent ? `contra ${s.opponent} · ` : ""}enviado em {formatMatchDate(s.createdAt.slice(0, 10))}</small></span>
                    <ArrowRight className="h-4 w-4 text-zinc-500" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={<Clapperboard className="h-6 w-6" />} title="Nenhum vídeo esperando">Quando um atleta mandar um jogo, ele aparece aqui.</Empty>}
        </section>

        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><AlarmClock className="h-4 w-4 text-amber-300" /> Prazos chegando</span>}
            sub="Oportunidades em andamento que vencem em até 7 dias." actions={<Link to="/voxen/oportunidades" className="text-[12.5px] font-semibold text-amber-300 hover:underline">Oportunidades</Link>} />
          {view.due.length ? (
            <ul className="sd-list">
              {view.due.slice(0, LIMIT).map(({ o, info }) => (
                <li key={o.id}>
                  <Link to={`/voxen/oportunidades?jogador=${o.memberId}`}>
                    {o.club && <ClubCrest club={o.club} size={34} />}
                    <span className="min-w-0 flex-1"><b className="block truncate">{view.byId.get(o.memberId)?.fullName ?? "Jogador"}</b><small className="block truncate">{o.club?.name} · {o.compatibility}%</small></span>
                    <DeadlineChip {...info} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={<AlarmClock className="h-6 w-6" />} title="Nenhum prazo apertado">Nenhuma oportunidade vence nos próximos 7 dias.</Empty>}
        </section>

        <section className="vx-card" id="fichas">
          <CardHead title={<span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-300" /> Fichas para completar</span>}
            sub={`${view.incomplete.length} de ${view.people.length} fichas têm dados faltando. As mais vazias primeiro.`} />
          {view.incomplete.length ? (
            <ul className="sd-list">
              {view.incomplete.slice(0, 8).map(({ m, c }) => <IncompleteRow key={m.id} m={m} pct={c.pct} missing={c.missing} />)}
            </ul>
          ) : <Empty icon={<ClipboardList className="h-6 w-6" />} title="Todas as fichas completas" />}
        </section>

        <section className="vx-card" id="sem-analise">
          <CardHead title={<span className="inline-flex items-center gap-2"><UserRoundSearch className="h-4 w-4 text-amber-300" /> Sem partida analisada</span>}
            sub="Jogadores que ainda não têm nenhum jogo analisado. Os mais novos primeiro." />
          {view.noAnalysis.length ? (
            <ul className="sd-list">
              {view.noAnalysis.slice(0, 8).map((m) => (
                <li key={m.id}>
                  <Link to={`/voxen/membros/${m.id}`}>
                    <MemberAvatar member={m} size={32} />
                    <span className="min-w-0 flex-1"><b className="block truncate">{m.fullName}</b><small className="block truncate">{[m.position, m.category, m.city].filter(Boolean).join(" · ") || "Sem dados de jogo"}</small></span>
                    <ArrowRight className="h-4 w-4 text-zinc-500" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty icon={<Film className="h-6 w-6" />} title="Todos têm análise" />}
        </section>
      </div>

      <div className="mt-[18px]" id="crm">
        {scout.data && (
          <>
            <CrmLine health={scout.data.health} />
            <ConflictList conflicts={view.conflicts.slice(0, 10)} names={new Map([...view.byId].map(([id, m]) => [id, m.fullName]))}
              onResolved={(id) => scout.set((d) => (d ? { ...d, conflicts: d.conflicts.filter((c) => c.id !== id) } : d))} />
          </>
        )}
      </div>
    </>
  )
}

function IncompleteRow({ m, pct, missing }: { m: ProfileListItem; pct: number; missing: string[] }) {
  return (
    <li>
      <Link to={`/voxen/membros/${m.id}?aba=dados`}>
        <MemberAvatar member={m} size={32} />
        <span className="min-w-0 flex-1"><b className="block truncate">{m.fullName}</b><small className="block truncate">Falta: {missing.slice(0, 4).join(", ").toLowerCase()}{missing.length > 4 ? ` e mais ${missing.length - 4}` : ""}</small></span>
        <span className="sd-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        <span className="sd-pct tnum">{pct}%</span>
      </Link>
    </li>
  )
}

/** Uma linha com a saúde da ponte do CRM (wsltda.com → VOXEN). */
function CrmLine({ health }: { health: CrmHealth | null }) {
  if (!health) return null
  return (
    <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-zinc-400">
      <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-sky-300" /> Ponte com o CRM:</span>
      {health.recebidos
        ? <>
            <span><b className="tnum text-white">{health.aplicados}</b> aplicados</span>
            <span><b className="tnum text-white">{health.esperando}</b> esperando virar membro</span>
            <span><b className="tnum text-white">{health.comContexto}</b> jogadores com contexto</span>
            {health.preCadastros > 0 && <Link to="/voxen/pre-cadastros" className="text-sky-300 hover:underline"><b className="tnum">{health.preCadastros}</b> pré-cadastros (ainda sem conta)</Link>}
            {health.ultimo && <span>último em {formatMatchDate(health.ultimo.slice(0, 10))}</span>}
          </>
        : <span>ainda não recebeu nada (o envio é ligado na wsltda.com).</span>}
    </p>
  )
}
