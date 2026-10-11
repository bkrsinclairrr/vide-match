import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ChevronLeft, ChevronRight, Clapperboard, Flame, Send, Sparkles } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { CountUp, Donut, Ring } from "@/pages/voxen/charts"
import { CardHead, Empty } from "@/pages/voxen/ui"
import { useMember } from "../MembersApp"
import { ageFrom, fmt1, formatMatchDate, formatShortDate, ratingColor, scoreline } from "../model"
import { zoneInsights } from "../metrics"
import { HeatMap } from "../components/Field"
import { MatchThumb } from "../components/MatchThumb"
import { MemberAvatar, RatingChip, ResultBadge, Shield } from "../components/bits"

export default function HomePage() {
  const { member, summary, whatsapp } = useMember()
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const recent = summary.matches.slice(0, 6)
  const current = recent[Math.min(slide, Math.max(0, recent.length - 1))]
  const t = summary.total
  const info = useMemo(() => zoneInsights(summary.events), [summary.events])
  const age = ageFrom(member.birthDate)
  const firstName = member.fullName.split(" ")[0]

  if (!summary.matches.length) {
    return (
      <div className="vx-card">
        <Empty icon={<Clapperboard className="h-6 w-6" />} title={`Bem-vindo, ${firstName}! Sua primeira análise está a caminho.`}>
          Envie o vídeo do seu próximo jogo para a equipe Zyron pelo WhatsApp. Cada ação é marcada no vídeo e vira
          métricas, mapa de calor e evolução aqui na sua área.
          <div className="mt-5">
            <a className="vx-btn vx-btn--wpp" target="_blank" rel="noopener noreferrer" href={whatsapp(`Olá! Sou ${member.fullName}, membro da Zyron, e quero enviar o vídeo do meu jogo.`)}>
              <WhatsAppIcon className="h-4 w-4" /> Enviar vídeo pelo WhatsApp
            </a>
          </div>
        </Empty>
      </div>
    )
  }

  const avg = summary.avgRating ?? 0
  const neutral = t.actions - t.actionsOk - t.actionsFail

  return (
    <div className="mb-home">
      {/* Coluna do atleta */}
      <aside className="mb-home-side">
        <section className="vx-card mb-profile-card">
          <div aria-hidden="true" className="mb-profile-glow" />
          <MemberAvatar member={member} size={92} ring="#fbbf24" />
          <h2 className="mt-4 text-[20px] font-bold leading-tight">{member.fullName}</h2>
          <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-amber-300">{member.position ?? "Atleta"}</p>
          <p className="mt-1 text-[12.5px] text-zinc-400">{[member.category, age ? `${age} anos` : null, member.team].filter(Boolean).join(" · ")}</p>
          <span className="mb-member-badge"><Sparkles className="h-3.5 w-3.5" /> Membro Zyron</span>
        </section>

        <section className="vx-card">
          <CardHead title="Sua temporada" sub={`${t.matches} partida${t.matches === 1 ? "" : "s"} analisada${t.matches === 1 ? "" : "s"}`} />
          <div className="mb-season">
            {[
              ["Partidas", t.matches], ["Minutos", t.minutes], ["Gols", t.goals], ["Assistências", t.assists],
            ].map(([label, value]) => (
              <div key={label as string}>
                <span className="tnum"><CountUp value={value as number} /></span>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="vx-card">
          <CardHead title="Atividade recente" />
          <ul className="mb-activity">
            {summary.matches.slice(0, 4).map((m) => (
              <li key={m.match.id}>
                <Link to={`/membros/partidas/${m.match.id}`}>
                  <span className="mb-activity-dot" style={{ background: ratingColor(m.rating) }} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">Análise de {m.match.opponent}</b>
                    <small>{m.events.length} ações marcadas · {formatShortDate(m.match.playedOn)}</small>
                  </span>
                  <RatingChip rating={m.rating} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* Centro: jogos recentes e números */}
      <div className="mb-home-main">
        <section className="vx-card vx-card--flush">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="vx-card-title">Jogos recentes</h2>
              <p className="vx-card-sub">Toque para ver o vídeo e as ações marcadas</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="vx-icon-btn" aria-label="Jogo anterior" disabled={slide === 0} onClick={() => setSlide((s) => Math.max(0, s - 1))}><ChevronLeft /></button>
              <button type="button" className="vx-icon-btn" aria-label="Próximo jogo" disabled={slide >= recent.length - 1} onClick={() => setSlide((s) => Math.min(recent.length - 1, s + 1))}><ChevronRight /></button>
            </div>
          </div>
          {current && (() => {
            const sl = scoreline(current.match)
            return (
              <button key={current.match.id} type="button" className="mb-carousel" onClick={() => navigate(`/membros/partidas/${current.match.id}`)}>
                <MatchThumb match={current.match} big />
                <div className="mb-carousel-info">
                  <span className="mb-carousel-comp">{current.match.competition ?? "Partida"} · {formatMatchDate(current.match.playedOn)}</span>
                  <span className="mb-carousel-score">
                    <Shield name={sl.left} size={30} /> <span className="truncate">{sl.left}</span>
                    <b className="tnum">{sl.leftGoals} × {sl.rightGoals}</b>
                    <span className="truncate">{sl.right}</span> <Shield name={sl.right} size={30} />
                  </span>
                </div>
                <span className="mb-carousel-rating"><RatingChip rating={current.rating} size="lg" /></span>
              </button>
            )
          })()}
          <div className="mb-carousel-dots">
            {recent.map((m, i) => (
              <button key={m.match.id} type="button" aria-label={`Jogo ${i + 1}`} className={i === slide ? "is-on" : ""} onClick={() => setSlide(i)} />
            ))}
          </div>
        </section>

        <div className="mb-kpis">
          <section className="vx-card mb-kpi">
            <Ring value={avg} max={10} size={128} stroke={11} color={ratingColor(avg)}>
              <span className="text-[34px] font-extrabold leading-none tnum" style={{ color: ratingColor(avg) }}><CountUp value={avg} decimals={1} /></span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Nota média</span>
            </Ring>
            <p className="text-[12px] text-zinc-500">nos {summary.matches.length} jogos analisados</p>
          </section>

          <section className="vx-card mb-kpi">
            <Donut
              size={128}
              stroke={16}
              slices={[
                { label: "Certas", value: t.actionsOk, color: "#22c55e" },
                { label: "Erradas", value: t.actionsFail, color: "#ef4444" },
                { label: "Neutras", value: Math.max(0, neutral), color: "#f97316" },
              ]}
              center={<><span className="text-[24px] font-extrabold tnum leading-none"><CountUp value={t.actions} /></span><span className="mt-1 text-[10px] text-zinc-500">ações</span></>}
            />
            <div className="mb-kpi-legend">
              <span><i style={{ background: "#22c55e" }} />{t.actions ? Math.round((t.actionsOk / t.actions) * 100) : 0}% certas</span>
              <span><i style={{ background: "#ef4444" }} />{t.actions ? Math.round((t.actionsFail / t.actions) * 100) : 0}% erradas</span>
            </div>
          </section>

          <section className="vx-card mb-kpi mb-kpi--form">
            <div>
              <p className="vx-card-title">Forma recente</p>
              <p className="mt-1 text-[12px] text-zinc-500">Nota de cada jogo, da mais antiga para a mais recente</p>
            </div>
            <div className="mb-form">
              {summary.matches.slice(0, 10).reverse().map((m, i) => (
                <Link key={m.match.id} to={`/membros/partidas/${m.match.id}`} title={`${m.match.opponent} · nota ${fmt1(m.rating)}`}
                  style={{ background: ratingColor(m.rating), animationDelay: `${i * 50}ms` }}>
                  <span className="tnum">{fmt1(m.rating)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="vx-card">
          <CardHead
            title={<span className="inline-flex items-center gap-2"><Flame className="h-4 w-4 text-amber-300" /> Onde você mais atua</span>}
            sub={info ? `Zona mais ativa: ${info.topZone} · ${info.finalThird}% das ações no terço final` : "Mapa de todas as ações marcadas"}
            actions={<Link to="/membros/desempenho" className="vx-btn">Desempenho <ArrowRight /></Link>}
          />
          <HeatMap events={summary.events} compact label={member.fullName} />
        </section>
      </div>

      {/* Direita: últimas partidas */}
      <aside className="mb-home-side">
        <section className="vx-card">
          <CardHead title="Últimas partidas" actions={<Link to="/membros/partidas" className="text-[12.5px] font-semibold text-amber-300 hover:underline">Ver todas</Link>} />
          <ul className="mb-recent">
            {summary.matches.slice(0, 7).map((m) => (
              <li key={m.match.id}>
                <Link to={`/membros/partidas/${m.match.id}`}>
                  <ResultBadge match={m.match} />
                  <Shield name={m.match.opponent} size={26} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{m.match.opponent}</b>
                    <small className="tnum">{m.match.goalsFor ?? "–"} × {m.match.goalsAgainst ?? "–"} · {formatShortDate(m.match.playedOn)}</small>
                  </span>
                  <RatingChip rating={m.rating} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="vx-card mb-cta">
          <Send className="h-5 w-5 text-amber-300" />
          <h3>Jogou de novo?</h3>
          <p>Mande o vídeo para a equipe. A análise aparece aqui com cada lance marcado.</p>
          <a className="vx-btn vx-btn--wpp w-full" target="_blank" rel="noopener noreferrer" href={whatsapp(`Olá! Sou ${member.fullName}, membro da Zyron, e quero enviar o vídeo do meu jogo.`)}>
            <WhatsAppIcon className="h-4 w-4" /> Enviar vídeo
          </a>
        </section>
      </aside>
    </div>
  )
}
