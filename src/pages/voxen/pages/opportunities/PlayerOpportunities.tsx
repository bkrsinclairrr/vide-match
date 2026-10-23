import "./opportunities.css"

import { useNavigate } from "react-router-dom"
import { BadgeCheck, Handshake } from "lucide-react"
import { useVoxen } from "../../store"
import { realProfileOf } from "../../people"
import { isProspect } from "../../prospects"
import type { Player } from "../../data"
import { CardHead, Empty } from "../../ui"
import { ScoutSetupNotice } from "../scout/parts"
import { useLoad, useScoutApi, type Club, type Opportunity } from "../scout/api"
import { MemberOpportunities } from "./OpportunityParts"

/**
 * A seção "Oportunidades" da ficha do jogador, logo abaixo da nota geral: os clubes que abriram vaga para ele, com a
 * proposta (valor, posição, urgência) e o prazo de resposta. É a mesma lista da aba Oportunidades da ficha de membro e
 * da tela Oportunidades: criar, editar, publicar e mover de situação funcionam igual em todas.
 */
export function PlayerOpportunities({ p }: { p: Player }) {
  const { demo, canScout } = useVoxen()
  const navigate = useNavigate()
  const api = useScoutApi(demo)
  const first = p.name.trim().split(/\s+/)[0] || p.name
  const data = useLoad(api, async (a) => {
    const [opportunities, clubs] = await Promise.all([p.memberId ? a.opportunities(p.memberId) : Promise.resolve([] as Opportunity[]), a.clubs()])
    return { opportunities, clubs }
  }, [p.memberId])
  const real = realProfileOf(p)

  const head = (
    <CardHead
      title={<span className="inline-flex items-center gap-2"><Handshake className="h-4 w-4 text-amber-300" /> Oportunidades</span>}
      sub={`Clubes que abriram vaga para ${first}: proposta, posição, urgência e prazo de resposta. O valor é só da equipe.`}
    />
  )

  if (data.error) return <div id="oportunidades" className="mb-[18px]"><ScoutSetupNotice error={data.error} compact /></div>

  return (
    <section id="oportunidades" className="vx-card op-section mb-[18px]" aria-label="Oportunidades">
      {head}
      {!p.memberId && isProspect(p) ? (
        <Empty icon={<Handshake className="h-6 w-6" />} title={`${first} ainda é pré-cadastro do CRM`}>
          As oportunidades ficam na ficha de membro, que nasce quando a pessoa se cadastra na plataforma. Até lá, use as
          notas da equipe para registrar os clubes em vista.
        </Empty>
      ) : !p.memberId ? (
        <Empty icon={<Handshake className="h-6 w-6" />} title={`${first} ainda não tem ficha de membro`}>
          As oportunidades ficam na ficha de membro. Cadastre {first} como membro para abrir a primeira.
          {canScout && (
            <div className="mt-4">
              <button type="button" className="vx-btn vx-btn--gold" onClick={() => navigate(`/voxen/membros?${new URLSearchParams({ de: p.key })}`)}>
                <BadgeCheck /> Tornar membro
              </button>
            </div>
          )}
        </Empty>
      ) : !api || !data.data ? (
        <p className="op-section-note" aria-busy="true">Carregando as oportunidades…</p>
      ) : (
        <MemberOpportunities
          api={api}
          member={{ id: p.memberId, fullName: p.name, position: real.position ?? null, category: real.category ?? null }}
          opportunities={data.data.opportunities}
          clubs={data.data.clubs}
          onChanged={(next) => data.set((d) => (d ? { ...d, opportunities: next } : d))}
          onClubsChanged={(c: Club) => data.set((d) => (d ? { ...d, clubs: d.clubs.some((x) => x.id === c.id) ? d.clubs.map((x) => (x.id === c.id ? c : x)) : [...d.clubs, c] } : d))}
        />
      )}
    </section>
  )
}
