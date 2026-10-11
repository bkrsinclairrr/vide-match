import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Check, CircleDot, GitCompareArrows, Plus, Search, UserCheck, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Empty, PageSkeleton } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { placeOf, type Player } from "@/pages/voxen/data"
import { MemberAvatar } from "@/pages/membros/components/bits"
import { formatShortDate, positionCodeOf, type MemberKind } from "@/pages/membros/model"
import type { MemberInput } from "@/pages/membros/api"
import { MemberForm, SetupNotice, useAdminSource, useSourceData } from "./shared"

/** Cadastro de membro preenchido com o que o atleta informou no funil. */
function prefillFrom(p: Player): MemberInput {
  const foot = p.profile.foot ? p.profile.foot.charAt(0).toUpperCase() + p.profile.foot.slice(1).toLowerCase() : null
  return {
    kind: "membro",
    fullName: p.name,
    email: p.email ?? "",
    birthDate: null,
    position: p.profile.position ?? null,
    category: p.profile.category ?? null,
    foot,
    heightCm: p.profile.height ?? null,
    weightKg: p.profile.weight ?? null,
    city: placeOf(p) || null,
    team: null,
    photoUrl: null,
    bio: null,
    leadId: p.key.startsWith("lead:") ? p.key.slice(5) : null,
    active: true,
  }
}

export default function AdminMembers() {
  const source = useAdminSource()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const kind: MemberKind = params.get("tipo") === "referencias" ? "referencia" : "membro"
  const { byKey, canEdit } = useVoxen()
  const fromKey = params.get("de")
  const fromPlayer = fromKey ? byKey.get(fromKey) : undefined
  const prefill = useMemo(() => (fromPlayer ? prefillFrom(fromPlayer) : undefined), [fromPlayer])
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(Boolean(fromKey))
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const list = useSourceData(source, (s) => s.listProfiles(), [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (list.data ?? [])
      .filter((m) => m.kind === kind)
      .filter((m) => !q || `${m.fullName} ${m.email ?? ""} ${m.position ?? ""} ${m.team ?? ""}`.toLowerCase().includes(q))
  }, [list.data, kind, query])

  const counts = useMemo(() => ({
    membro: (list.data ?? []).filter((m) => m.kind === "membro").length,
    referencia: (list.data ?? []).filter((m) => m.kind === "referencia").length,
  }), [list.data])

  if (list.error) return <SetupNotice error={list.error} />
  if (!list.data) return <PageSkeleton />

  const create = async (input: MemberInput) => {
    if (!source) return
    setSaving(true)
    try {
      const m = await source.saveMember(input)
      toast({ title: kind === "membro" ? "Membro cadastrado" : "Referência criada", description: m.fullName })
      navigate(`/voxen/membros/${m.id}`)
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? [...s.slice(1), id] : [...s, id]))

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="vx-tabs" role="tablist" aria-label="Tipo de perfil">
          <button type="button" role="tab" aria-selected={kind === "membro"} className={`vx-tab ${kind === "membro" ? "is-on" : ""}`} onClick={() => { setParams({}); setCreating(false) }}>
            Membros <span className="ml-1 text-zinc-500 tnum">{counts.membro}</span>
          </button>
          <button type="button" role="tab" aria-selected={kind === "referencia"} className={`vx-tab ${kind === "referencia" ? "is-on" : ""}`} onClick={() => { setParams({ tipo: "referencias" }); setCreating(false) }}>
            Referências <span className="ml-1 text-zinc-500 tnum">{counts.referencia}</span>
          </button>
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" placeholder="Buscar por nome, e-mail, posição ou time" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar perfis" />
        </div>
        {canEdit && (
          <button type="button" className="vx-btn vx-btn--gold" onClick={() => setCreating((c) => !c)}>
            <Plus /> {kind === "membro" ? "Novo membro" : "Nova referência"}
          </button>
        )}
      </div>

      {creating && canEdit && (
        <section className="vx-card mb-[18px]">
          <h2 className="vx-card-title">{kind === "membro" ? (prefill ? `Tornar ${prefill.fullName} membro` : "Cadastrar membro") : "Criar perfil de referência"}</h2>
          <p className="vx-card-sub" style={{ marginBottom: 20 }}>
            {kind === "membro"
              ? "O acesso é liberado pelo e-mail: o atleta entra em /voxen, cria a senha e já vê as partidas publicadas."
              : "Referências não têm login. Cadastre partidas e ações delas como de um atleta: os membros comparam o próprio jogo com elas."}
          </p>
          <MemberForm key={`${kind}-${fromKey ?? ""}`} kind={kind} initial={kind === "membro" ? prefill : undefined} onSave={create}
            onCancel={() => { setCreating(false); if (fromKey) setParams({}) }} saving={saving} />
        </section>
      )}

      <section className="vx-card vx-card--flush">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 text-[13px] text-zinc-400">
          <span><strong className="text-white tnum">{rows.length}</strong> {kind === "membro" ? "membro" : "referência"}{rows.length === 1 ? "" : "s"}</span>
          <span className="hidden text-zinc-500 sm:inline">Marque até 3 perfis para comparar</span>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="vx-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>{kind === "membro" ? "Membro" : "Referência"}</th>
                  <th>Pos</th>
                  <th>Categoria</th>
                  {kind === "membro" && <th>Acesso</th>}
                  <th>Partidas</th>
                  <th>Última</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const isSel = selected.includes(m.id)
                  return (
                    <tr key={m.id} className={isSel ? "is-selected" : ""} style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }} onClick={() => navigate(`/voxen/membros/${m.id}`)}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="flex items-center gap-3">
                          <button type="button" className={`vx-check ${isSel ? "is-on" : ""}`} aria-pressed={isSel} aria-label={`Selecionar ${m.fullName}`}
                            onClick={(e) => { e.stopPropagation(); toggle(m.id) }}>{isSel && <Check strokeWidth={3} />}</button>
                          <MemberAvatar member={m} size={34} />
                          <div className="min-w-0 max-w-[260px]">
                            <Link to={`/voxen/membros/${m.id}`} onClick={(e) => e.stopPropagation()} className="block truncate text-[13.5px] font-semibold text-white hover:text-amber-300">{m.fullName}</Link>
                            <div className="truncate text-[11.5px] text-zinc-500">{m.email ?? m.team ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`vx-pos ${m.position ? "" : "vx-pos--none"}`}>{positionCodeOf(m.position)}</span></td>
                      <td className="text-zinc-300">{m.category ?? "—"}</td>
                      {kind === "membro" && (
                        <td>
                          {m.userId
                            ? <span className="vx-tag" style={{ color: "#34d399", background: "rgba(52,211,153,.12)" }}><UserCheck className="h-3 w-3" /> Conta ativa</span>
                            : <span className="vx-tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.12)" }}><CircleDot className="h-3 w-3" /> Aguardando 1º acesso</span>}
                        </td>
                      )}
                      <td className="tnum text-zinc-300">{m.publishedCount}<span className="text-zinc-600"> / {m.matchCount}</span> <span className="text-[11px] text-zinc-500">publicadas</span></td>
                      <td className="tnum text-zinc-400">{m.lastMatch ? formatShortDate(m.lastMatch) : "—"}</td>
                      <td>{m.active ? <span className="vx-tag" style={{ color: "#34d399", background: "rgba(52,211,153,.1)" }}>Ativo</span> : <span className="vx-tag" style={{ color: "#a1a1aa", background: "rgba(255,255,255,.06)" }}>Inativo</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<Users className="h-6 w-6" />} title={query ? "Nenhum perfil encontrado" : kind === "membro" ? "Nenhum membro ainda" : "Nenhuma referência ainda"}>
            {kind === "membro"
              ? "Cadastre o atleta pelo botão acima ou use “Tornar membro” no perfil de um lead em Jogadores."
              : "Crie perfis de referência por posição para os membros compararem o próprio jogo."}
          </Empty>
        )}
      </section>

      {selected.length > 0 && (
        <div className="vx-floatbar" role="region" aria-label="Perfis selecionados">
          <span className="text-[13px] text-zinc-300"><strong className="text-white">{selected.length}</strong> de 3 selecionados</span>
          <button type="button" className="vx-btn" onClick={() => setSelected([])}>Limpar</button>
          <button type="button" className="vx-btn vx-btn--gold" disabled={selected.length < 2}
            onClick={() => navigate(`/voxen/membros/comparar?${new URLSearchParams({ p: selected.join(",") })}`)}>
            <GitCompareArrows /> Comparar
          </button>
        </div>
      )}
    </>
  )
}
