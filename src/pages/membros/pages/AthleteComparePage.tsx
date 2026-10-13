import { Link } from "react-router-dom"
import { ArrowDownRight, ArrowUpRight, Check, Sparkles, TrendingUp } from "lucide-react"
import { CountUp, Meter, RadarChart } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useAthlete } from "../ClientArea"
import { TIERS, TIPS, ZYRON_AVERAGE, referenceFor, tierOf } from "../game"
import { SectionTitle } from "../components/bits"
import { TeamCta } from "../components/Gamify"
import ComparePage from "./ComparePage"

const norm = (score: number) => (score - 64) / 34

export default function AthleteComparePage() {
  const { account, report, member, category } = useAthlete()

  if (!report) {
    return (
      <section className="vx-card gm-nudge">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-300" />
        <p>O comparativo usa o seu relatório. <strong>Crie o seu perfil</strong> para ver como o seu jogo se compara com a média Zyron e com o perfil da sua posição.</p>
        <Link to="/onboarding" className="vx-btn vx-btn--gold">Criar meu perfil</Link>
      </section>
    )
  }

  const tier = tierOf(report.overall)
  const ref = referenceFor(account.position)
  const rows = report.stats.map((s) => ({ ...s, target: ref.scores[s.key], delta: s.score - ref.scores[s.key], focus: ref.focus.includes(s.key) }))
  const strengths = [...rows].sort((a, b) => b.score - a.score).slice(0, 3)
  const grow = [...rows].filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3)
  // Marcador dentro da faixa da própria divisão (as quatro faixas têm a mesma largura).
  const bounds = [76, ...TIERS.slice(1).map((t) => t.min), 96]
  const tierIndex = TIERS.findIndex((t) => t.key === tier.key)
  const frac = Math.max(0, Math.min(1, (report.overall - bounds[tierIndex]) / (bounds[tierIndex + 1] - bounds[tierIndex])))
  const pos = ((tierIndex + frac) / TIERS.length) * 100

  return (
    <>
      <section className="vx-card mb-[18px]">
        <CardHead title="Sua divisão Zyron" sub="Onde a nota geral do seu relatório se encaixa na escada da Zyron." />
        <div className="gm-ladder" role="img" aria-label={`Nota geral ${report.overall}, divisão ${tier.label}`}>
          <div className="gm-ladder-track">
            {TIERS.map((t, i) => (
              <div key={t.key} className={`gm-rung ${t.key === tier.key ? "is-here" : ""} ${report.overall >= t.min ? "is-reached" : ""}`} style={{ "--c": t.color, "--i": i } as React.CSSProperties}>
                <b>{t.label}</b>
                <small>{t.min ? `${t.min}+` : "até 79"}</small>
              </div>
            ))}
          </div>
          <div className="gm-ladder-marker" style={{ left: `${pos}%` }}><span className="tnum"><CountUp value={report.overall} /></span></div>
        </div>
        <p className="gm-ladder-text"><strong style={{ color: tier.color }}>{tier.label}.</strong> {tier.text}</p>
      </section>

      <div className="vx-grid mb-[18px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="vx-card">
          <CardHead title="Você × média Zyron × referência da posição" sub={account.position ? `Referência de ${account.position}: 90 nos quatro indicadores-chave, 84 nos demais.` : "Informe a posição no perfil para ver a referência da sua função."} />
          <div className="mx-auto max-w-[460px]">
            <RadarChart
              key={account.position ?? "sem"}
              axes={report.stats.map((s) => s.label)}
              series={[
                { name: "Referência da posição", color: "#38bdf8", values: rows.map((r) => norm(r.target)) },
                { name: "Média Zyron", color: "#a1a1aa", values: rows.map(() => norm(ZYRON_AVERAGE)) },
                { name: account.firstName, color: "#fbbf24", values: rows.map((r) => norm(r.score)) },
              ]}
              size={440}
              showValues={rows.map((r) => r.score)}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-[12.5px] text-zinc-300">
            {[["#fbbf24", account.firstName], ["#a1a1aa", "Média Zyron"], ["#38bdf8", "Referência da posição"]].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </section>

        <section className="vx-card">
          <CardHead title="Indicador por indicador" sub="Nota do seu relatório contra a referência da sua posição." />
          <ul className="gm-rows">
            {rows.map((r, i) => (
              <li key={r.key}>
                <span className="gm-row-label">{r.label}{r.focus && <i title="Indicador-chave da sua posição">chave</i>}</span>
                <div className="gm-row-bar">
                  <Meter value={((r.score - 64) / 34) * 100} color={r.delta >= 0 ? "#34d399" : "#fbbf24"} delay={i * 50} />
                  <span className="gm-row-target" style={{ left: `${((r.target - 64) / 34) * 100}%` }} title={`Referência: ${r.target}`} />
                </div>
                <b className="tnum">{r.score}</b>
                <span className={`gm-delta tnum ${r.delta >= 0 ? "is-up" : "is-down"}`}>
                  {r.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(r.delta)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="vx-grid mb-[18px] lg:grid-cols-2">
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> Seus pontos fortes</span>} sub="O que já chama atenção no seu relatório." />
          <ul className="gm-tips">
            {strengths.map((s) => (
              <li key={s.key}><b className="tnum" style={{ color: "#34d399" }}>{s.score}</b><div><strong>{s.label}</strong><span>{s.desc}</span></div></li>
            ))}
          </ul>
        </section>
        <section className="vx-card">
          <CardHead title={<span className="inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-amber-300" /> Onde subir primeiro</span>} sub="Treinos curtos nos indicadores mais distantes da referência." />
          {grow.length ? (
            <ul className="gm-tips">
              {grow.map((g) => (
                <li key={g.key}><b className="tnum" style={{ color: "#fbbf24" }}>{g.score}</b><div><strong>{g.label} · faltam {Math.abs(g.delta)} para a referência</strong><span>{TIPS[g.key]}</span></div></li>
              ))}
            </ul>
          ) : (
            <p className="gm-allclear"><Sparkles className="h-4 w-4" /> Você bate a referência da posição em todos os indicadores. O próximo passo é mostrar isso aos clubes.</p>
          )}
        </section>
      </div>

      {member && (
        <>
          <SectionTitle sub="Os seus jogos analisados contra perfis de referência da equipe">Lance a lance: você × referências</SectionTitle>
          <ComparePage />
        </>
      )}

      <TeamCta
        title="Quer ver o seu jogo contra as referências, lance a lance?"
        text="Com a análise dos seus jogos liberada, o comparativo passa a usar as suas ações reais: passes, dribles, duelos e mapa de calor."
        label={member ? "Enviar mais um jogo" : "Liberar a análise"}
        topic={category ? `Quero comparar o meu jogo com as referências de ${category}.` : "Quero comparar o meu jogo com as referências."}
      />
    </>
  )
}
