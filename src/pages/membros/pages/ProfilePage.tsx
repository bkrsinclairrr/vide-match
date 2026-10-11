import { ClipboardList, UserRound } from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { Meter, RadarChart } from "@/pages/voxen/charts"
import { CardHead } from "@/pages/voxen/ui"
import { useMember } from "../ClientArea"
import { SCOUT_GROUPS, ageFrom, fmt1, scoutGroupAverage } from "../model"
import { MemberAvatar } from "../components/bits"

export default function ProfilePage() {
  const { member, whatsapp } = useMember()
  const age = ageFrom(member.birthDate)
  const rows: [string, string][] = [
    ["Nome", member.fullName],
    ["E-mail", member.email ?? "—"],
    ["Idade", age ? `${age} anos` : "—"],
    ["Posição", member.position ?? "—"],
    ["Categoria", member.category ?? "—"],
    ["Melhor pé", member.foot ?? "—"],
    ["Altura", member.heightCm ? `${member.heightCm} cm` : "—"],
    ["Peso", member.weightKg ? `${member.weightKg} kg` : "—"],
    ["Time atual", member.team ?? "—"],
    ["Cidade", member.city ?? "—"],
  ]

  return (
    <div className="vx-grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="vx-card">
        <CardHead title={<span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-amber-300" /> Seus dados</span>} sub="Mantidos pela equipe Zyron" />
        <div className="mb-5 flex items-center gap-4">
          <MemberAvatar member={member} size={72} ring="#fbbf24" />
          <div>
            <p className="text-[18px] font-bold">{member.fullName}</p>
            <p className="text-[12.5px] text-zinc-400">{[member.position, member.category].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <dl className="vx-dl">
          {rows.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd title={dd}>{dd}</dd></div>)}
        </dl>
        <a className="vx-btn vx-btn--wpp mt-5" target="_blank" rel="noopener noreferrer" href={whatsapp(`Olá! Sou ${member.fullName}, membro da Zyron, e quero atualizar meus dados.`)}>
          <WhatsAppIcon className="h-4 w-4" /> Pedir atualização
        </a>
      </section>

      <section className="vx-card">
        <CardHead title={<span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-300" /> Avaliação do scout</span>} sub="Notas de 1 a 5 dadas pela equipe depois de ver os seus vídeos" />
        {member.scout ? (
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="mx-auto w-full max-w-[380px]">
              <RadarChart
                axes={SCOUT_GROUPS.map((g) => g.label)}
                series={[{ name: member.fullName, color: "#fbbf24", values: SCOUT_GROUPS.map((g) => (scoutGroupAverage(member.scout, g.key) ?? 0) / 5) }]}
                size={360}
                levels={5}
                showValues={SCOUT_GROUPS.map((g) => fmt1(scoutGroupAverage(member.scout, g.key) ?? 0))}
              />
            </div>
            <div className="flex flex-col gap-4">
              {SCOUT_GROUPS.map((g, gi) => (
                <div key={g.key}>
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-500">{g.label}</p>
                  <div className="flex flex-col gap-1.5">
                    {g.attrs.map(([k, label], i) => {
                      const v = member.scout?.[k] ?? 0
                      const color = v >= 4 ? "#22c55e" : v >= 3 ? "#facc15" : "#f97316"
                      return (
                        <div key={k} className="grid grid-cols-[minmax(0,1fr)_90px_28px] items-center gap-3 text-[12.5px]">
                          <span className="truncate text-zinc-300">{label}</span>
                          <Meter value={(v / 5) * 100} color={color} height={5} delay={gi * 80 + i * 30} />
                          <b className="text-right tnum" style={{ color }}>{v ? fmt1(v) : "—"}</b>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-[13px] text-zinc-500">A avaliação do scout aparece aqui depois que a equipe analisar os seus vídeos.</p>
        )}
      </section>
    </div>
  )
}
