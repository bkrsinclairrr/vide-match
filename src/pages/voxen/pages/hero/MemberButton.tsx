import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BadgeCheck } from "lucide-react"
import { getSource } from "@/pages/membros/api"
import { useVoxen } from "../../store"
import type { Player } from "../../data"

/** Lead que virou cliente: abre o cadastro de membro preenchido ou o membro já criado. */
export function MemberButton({ p, className = "vx-btn" }: { p: Player; className?: string }) {
  const { demo, canScout } = useVoxen()
  const navigate = useNavigate()
  const leadId = p.key.startsWith("lead:") ? p.key.slice(5) : null
  const [memberId, setMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) return
    let cancelled = false
    getSource(demo)
      .then((s) => s.findByLead(leadId))
      .then((m) => { if (!cancelled) setMemberId(m?.id ?? null) })
      .catch(() => undefined) // área de membros ainda não ativada: o botão leva ao aviso
    return () => { cancelled = true }
  }, [leadId, demo])

  if (memberId) {
    return <Link to={`/voxen/membros/${memberId}`} className={className}><BadgeCheck /> Ver membro</Link>
  }
  if (!canScout) return null
  return (
    <button type="button" className={className} title="Cadastrar na área de membros com os dados do funil"
      onClick={() => navigate(`/voxen/membros?${new URLSearchParams({ de: p.key })}`)}>
      <BadgeCheck /> Tornar membro
    </button>
  )
}
