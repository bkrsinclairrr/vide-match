import { useMemo, useState } from "react"
import { ArrowRight, CheckCircle2, Loader2, Medal, Search, UserRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, Empty } from "@/pages/voxen/ui"
import { useVoxen } from "@/pages/voxen/store"
import { formatDate, placeOf, type Player } from "@/pages/voxen/data"
import { looksLikeRealName } from "@/pages/admin/console/names"
import type { Member } from "@/pages/membros/model"
import { accountEmails, type AthletesHook } from "./api"
import { AthleteForm } from "./AthleteForm"
import { TempPicker } from "./bits"
import { useSendToSector } from "./useSendToSector"
import { blankData, draftFromMember, draftFromPlayer, tempInfo, type Athlete, type AthleteData, type AthleteDraft, type Temperature } from "./model"

type Candidate = {
  key: string
  name: string
  sub: string
  tags: string[]
  createdAt: string
  inSector: Athlete | null
  /** Monta a ficha (contas buscam o e-mail na lista de contas só na hora de adicionar). */
  draft: () => Promise<AthleteDraft>
}

const SHOW = 60

/**
 * Adicionar ao setor: de preferência quem já está nos cadastros (funil e contas) e nos
 * membros, ou uma ficha do zero.
 */
export function AddAthlete({ sector, members, onOpen }: { sector: AthletesHook; members: Member[]; onOpen: (id: string) => void }) {
  const { players, demo } = useVoxen()
  const { toast } = useToast()
  const { send } = useSendToSector(sector)
  const [tab, setTab] = useState<"cadastros" | "novo">("cadastros")
  const [temp, setTemp] = useState<Temperature>("morno")
  const [query, setQuery] = useState("")
  const [onlyReal, setOnlyReal] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const candidates = useMemo<Candidate[]>(() => {
    const memberLeads = new Set(members.map((m) => m.leadId).filter(Boolean))
    const memberEmails = new Set(members.map((m) => (m.email ?? "").toLowerCase()).filter(Boolean))
    const fromMembers: Candidate[] = members.map((m) => {
      const lead = m.leadId ? players.find((p) => p.key === `lead:${m.leadId}`) : undefined
      return {
        key: `membro:${m.id}`,
        name: m.fullName,
        sub: [m.position, m.category, m.city].filter(Boolean).join(" · ") || m.email || "",
        tags: lead ? ["Membro", "Funil"] : ["Membro"],
        createdAt: m.createdAt,
        inSector: sector.forMember(m),
        draft: async () => {
          const d = draftFromMember(m)
          // O lead traz o telefone e a idade que o membro não tem.
          if (lead) {
            const l = draftFromPlayer(lead)
            return { ...d, phone: d.phone ?? l.phone, age: d.age ?? l.age, nationality: d.nationality ?? l.nationality }
          }
          return d
        },
      }
    })
    const fromPlayers: Candidate[] = players
      .filter((p) => !(p.key.startsWith("lead:") && memberLeads.has(p.key.slice(5))) && !(p.email && memberEmails.has(p.email.toLowerCase())))
      .map((p: Player) => ({
        key: p.key,
        name: p.name,
        sub: [p.profile.position, p.profile.category, placeOf(p)].filter(Boolean).join(" · ") || p.email || "",
        tags: [p.source === "funil" ? "Funil" : p.source === "crm" ? "CRM" : "Conta"],
        createdAt: p.createdAt,
        inSector: sector.forPlayer(p),
        draft: async () => {
          if (p.source === "conta" && p.userId) {
            const emails = await accountEmails(demo, [p])
            return draftFromPlayer(p, emails.get(p.userId) ?? null)
          }
          return draftFromPlayer(p)
        },
      }))
    return [...fromMembers, ...fromPlayers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [members, players, sector, demo])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates.filter((c) => (!onlyReal || looksLikeRealName(c.name)) && (!q || `${c.name} ${c.sub}`.toLowerCase().includes(q)))
  }, [candidates, query, onlyReal])

  const add = async (c: Candidate) => {
    setBusyKey(c.key)
    try {
      await send([{ ...(await c.draft()), temperature: temp }])
    } finally {
      setBusyKey(null)
    }
  }

  const createNew = async (data: AthleteData) => {
    setCreating(true)
    try {
      const a = await sector.create({ ...data, origin: "manual", leadId: null, athleteId: null, memberId: null, sourceCreatedAt: null, temperature: temp })
      toast({ title: "Ficha criada no setor Atletas", description: a.fullName })
      onOpen(a.id)
    } catch (e) {
      toast({ title: "Não foi possível criar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="cn-editor at-add">
      <div className="vx-tabs self-start" role="tablist" aria-label="Como adicionar">
        <button type="button" role="tab" aria-selected={tab === "cadastros"} className={`vx-tab ${tab === "cadastros" ? "is-on" : ""}`} onClick={() => setTab("cadastros")}>Dos cadastros e membros</button>
        <button type="button" role="tab" aria-selected={tab === "novo"} className={`vx-tab ${tab === "novo" ? "is-on" : ""}`} onClick={() => setTab("novo")}>Criar do zero</button>
      </div>

      <section className="vx-card at-add-temp">
        <div>
          <b>Entra no setor como</b>
          <small>{tempInfo(temp).hint}. Dá para mudar depois.</small>
        </div>
        <TempPicker value={temp} onChange={setTemp} label="Temperatura de entrada" />
      </section>

      {tab === "cadastros" ? (
        <section className="vx-card vx-card--flush">
          <div className="at-add-search">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input className="vx-input vx-input--icon" placeholder="Buscar por nome, posição, categoria ou cidade" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar atleta" autoFocus />
            </div>
            <button type="button" aria-pressed={onlyReal} className={`vx-chip ${onlyReal ? "is-on" : ""}`} onClick={() => setOnlyReal((v) => !v)} title="Esconde nomes de teste">
              <CheckCircle2 className="h-3.5 w-3.5" /> Só nomes completos
            </button>
          </div>
          <p className="at-add-count"><strong className="tnum">{filtered.length}</strong> encontrado{filtered.length === 1 ? "" : "s"}{filtered.length > SHOW && <> · mostrando os {SHOW} mais recentes, refine a busca</>}</p>
          {filtered.length ? (
            <ul className="at-add-list">
              {filtered.slice(0, SHOW).map((c) => (
                <li key={c.key} className={c.inSector ? "is-in" : ""}>
                  <Avatar name={c.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate">{c.name}</b>
                    <span className="block truncate">{c.sub || "Perfil em branco"} · entrou {formatDate(c.createdAt)}</span>
                  </div>
                  <div className="at-add-tags">{c.tags.map((t) => <span key={t} className="vx-tag">{t === "Conta" && <UserRound className="h-3 w-3" />}{t}</span>)}</div>
                  {c.inSector ? (
                    <button type="button" className="vx-btn at-add-open" onClick={() => onOpen(c.inSector!.id)}><Medal /> No setor <ArrowRight /></button>
                  ) : (
                    <button type="button" className="vx-btn vx-btn--gold" disabled={busyKey !== null} onClick={() => void add(c)}>
                      {busyKey === c.key ? <><Loader2 className="cn-spin" /> Adicionando</> : "Adicionar"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={<Search className="h-6 w-6" />} title="Ninguém encontrado">
              {onlyReal ? "Tente outra busca ou desligue “Só nomes completos”." : "Tente outra busca, ou crie a ficha do zero."}
            </Empty>
          )}
        </section>
      ) : (
        <section className="vx-card">
          <h3 className="vx-card-title">Nova ficha</h3>
          <p className="vx-card-sub mb-4">Para quem ainda não está em nenhum cadastro (indicação, jogo assistido, peneira...).</p>
          <AthleteForm initial={blankData()} saving={creating} submitLabel="Criar ficha" onSave={createNew} />
        </section>
      )}
    </div>
  )
}
