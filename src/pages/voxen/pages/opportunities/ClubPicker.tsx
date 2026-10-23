import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Check, ImagePlus, Loader2, Plus, Search, Sparkles, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Club as CatalogClub } from "@/data/clubs"
import { affinity } from "@/pages/membros/game"
import { ClubCrest } from "@/pages/membros/components/ClubCrest"
import { errMsg, type Club, type ScoutApi } from "../scout/api"
import { crestBlob, extOf, openImage } from "../scout/image"

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/** O catálogo de clubes da Zyron (arquivo grande): só é baixado quando o seletor abre. */
let catalogPromise: Promise<CatalogClub[]> | null = null
export const loadCatalog = () => (catalogPromise ??= import("@/data/clubs").then((m) => m.getAllClubs()))

/** Envia o escudo escolhido (quadrado de 256 px) e devolve o endereço e a cor dominante. */
export async function uploadCrest(api: ScoutApi, file: File, clubKey: string) {
  const src = await openImage(file)
  const { blob, color } = await crestBlob(src)
  const url = await api.upload(`clubs/${clubKey}/escudo-${Date.now()}.${extOf(blob)}`, blob)
  return { url, color }
}

type Hit = { kind: "club"; club: Club } | { kind: "catalog"; club: CatalogClub }

/**
 * Escolher o clube: os clubes que a equipe já usa e o catálogo da Zyron na mesma busca. Um clube
 * do catálogo vira clube da equipe na hora em que é escolhido. Também cria clube novo, com escudo.
 */
export function ClubPicker({ api, clubs, value, onPick, onClubsChanged, disabled }: {
  api: ScoutApi
  clubs: Club[]
  value: Club | null
  onPick: (club: Club) => void
  onClubsChanged: (club: Club) => void
  disabled?: boolean
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [catalog, setCatalog] = useState<CatalogClub[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open && !catalog.length) void loadCatalog().then(setCatalog) }, [open, catalog.length])

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener("pointerdown", onDown)
    return () => window.removeEventListener("pointerdown", onDown)
  }, [open])

  const hits = useMemo<Hit[]>(() => {
    const q = norm(query.trim())
    const own = clubs.filter((c) => c.active && (!q || norm(`${c.name} ${c.country ?? ""} ${c.league ?? ""}`).includes(q)))
    const used = new Set(clubs.map((c) => c.catalogId).filter(Boolean))
    const cat = q.length >= 2
      ? catalog.filter((c) => !used.has(c.id) && norm(`${c.name} ${c.country} ${c.league}`).includes(q)).slice(0, 12)
      : []
    return [...own.slice(0, q ? 12 : 8).map((club) => ({ kind: "club" as const, club })), ...cat.map((club) => ({ kind: "catalog" as const, club }))]
  }, [query, clubs, catalog])

  const pick = async (hit: Hit) => {
    if (hit.kind === "club") {
      onPick(hit.club)
      setOpen(false)
      return
    }
    setBusy(hit.club.id)
    try {
      const club = await api.clubFromCatalog(hit.club)
      onClubsChanged(club)
      onPick(club)
      setOpen(false)
    } catch (e) {
      toast({ title: "Não foi possível usar este clube", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="op-picker" ref={boxRef}>
      <button type="button" className={`op-picker-value ${value ? "" : "is-empty"}`} onClick={() => setOpen((v) => !v)} disabled={disabled} aria-expanded={open}>
        {value ? <><ClubCrest club={value} size={30} /> <span className="truncate">{value.name}</span></> : <><Search /> Escolher o clube</>}
      </button>
      {open && (
        <div className="op-picker-pop" role="dialog" aria-label="Escolher o clube">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input className="vx-input vx-input--icon" autoFocus placeholder="Buscar clube, país ou liga" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar clube" />
          </div>
          <ul className="op-picker-list">
            {hits.map((h) => (
              <li key={`${h.kind}-${h.club.id}`}>
                <button type="button" onClick={() => void pick(h)} disabled={busy !== null}>
                  {h.kind === "club"
                    ? <ClubCrest club={h.club} size={28} />
                    : <ClubCrest club={{ name: h.club.name, crestUrl: null, emblem: h.club.logo, color: null }} size={28} />}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{h.club.name}</b>
                    <small className="block truncate">{[h.club.country, h.club.league].filter(Boolean).join(" · ")}{h.kind === "catalog" ? " · catálogo" : ""}</small>
                  </span>
                  {busy === h.club.id ? <Loader2 className="op-spin" /> : value?.id === h.club.id && <Check className="text-amber-300" />}
                </button>
              </li>
            ))}
            {!hits.length && <li className="op-picker-empty">{query.trim().length < 2 ? "Digite ao menos 2 letras para buscar no catálogo." : "Nenhum clube encontrado."}</li>}
          </ul>
          {creating
            ? <NewClubForm api={api} initialName={query} onCancel={() => setCreating(false)} onSaved={(club) => { onClubsChanged(club); onPick(club); setCreating(false); setOpen(false) }} />
            : <button type="button" className="vx-btn mt-2 w-full" onClick={() => setCreating(true)}><Plus /> Criar clube</button>}
        </div>
      )}
    </div>
  )
}

/** Clube novo da equipe: nome, país, liga, escudo (imagem) e cor. */
export function NewClubForm({ api, initialName = "", club, onCancel, onSaved }: {
  api: ScoutApi
  initialName?: string
  /** Editar um clube que já existe (trocar o escudo, a cor...). */
  club?: Club
  onCancel: () => void
  onSaved: (club: Club) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState(club?.name ?? initialName)
  const [country, setCountry] = useState(club?.country ?? "Brasil")
  const [league, setLeague] = useState(club?.league ?? "")
  const [crestUrl, setCrestUrl] = useState<string | null>(club?.crestUrl ?? null)
  const [color, setColor] = useState(club?.color ?? "#fbbf24")
  const [busy, setBusy] = useState<"crest" | "save" | null>(null)
  const key = useRef(club?.id ?? crypto.randomUUID())

  const onCrest = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setBusy("crest")
    try {
      const up = await uploadCrest(api, file, key.current)
      setCrestUrl(up.url)
      if (up.color) setColor(up.color)
    } catch (err) {
      toast({ title: "Não foi possível enviar o escudo", description: errMsg(err), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (name.trim().length < 2) return
    setBusy("save")
    try {
      const saved = await api.saveClub({ id: club?.id, name, country: country || null, league: league || null, crestUrl, emblem: club?.emblem ?? null, color })
      // Escudo trocado: o antigo sai do Storage depois que o novo foi salvo.
      if (club?.crestUrl && club.crestUrl !== crestUrl) void api.removeMedia([club.crestUrl])
      onSaved(saved)
    } catch (err) {
      toast({ title: "Não foi possível salvar o clube", description: errMsg(err), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="op-newclub">
      <label className="op-crest-drop" title="Enviar o escudo (PNG com fundo transparente fica melhor)">
        {busy === "crest"
          ? <Loader2 className="op-spin" />
          : crestUrl
            ? <ClubCrest club={{ name, crestUrl, emblem: null, color }} size={56} pop />
            : <><ImagePlus /><small>Escudo</small></>}
        <input type="file" accept="image/png,image/webp,image/jpeg" className="sr-only" onChange={(e) => void onCrest(e)} />
      </label>
      <div className="op-newclub-fields">
        <input className="vx-input" placeholder="Nome do clube" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Nome do clube" autoFocus={!club} />
        <div className="grid grid-cols-2 gap-2">
          <input className="vx-input" placeholder="País" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} aria-label="País" />
          <input className="vx-input" placeholder="Liga" value={league} onChange={(e) => setLeague(e.target.value)} maxLength={80} aria-label="Liga" />
        </div>
        <label className="op-color">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Cor do clube" />
          <span>Cor do clube {crestUrl ? "(tirada do escudo; ajuste se quiser)" : ""}</span>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="vx-btn" onClick={onCancel}><X /> Cancelar</button>
          <button type="button" className="vx-btn vx-btn--gold" onClick={() => void save()} disabled={name.trim().length < 2 || busy !== null}>
            {busy === "save" ? <Loader2 className="op-spin" /> : <Check />} Salvar clube
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Escolher um ou vários clubes (dentro da janela da oportunidade)     */
/* ------------------------------------------------------------------ */

type Region = "todos" | "brasil" | "exterior"

const REGIONS: [Region, string][] = [["todos", "Todos"], ["brasil", "Brasil"], ["exterior", "Exterior"]]

const inRegion = (country: string | null | undefined, region: Region) =>
  region === "todos" || (region === "brasil") === (country === "Brasil")

/**
 * Os clubes de uma oportunidade, sempre à vista (sem janelinha por cima): os escolhidos em cima, a busca e as listas
 * embaixo. Sem digitar nada, mostra os clubes que procuram a posição da vaga; digitando, busca nos clubes da equipe e
 * no catálogo inteiro da Zyron. Um clube do catálogo vira clube da equipe na hora em que é escolhido.
 * `single`: trocar o clube de uma oportunidade que já existe (escolher outro substitui).
 */
export function ClubChooser({ api, clubs, chosen, position, single = false, onAdd, onRemove, onClubsChanged }: {
  api: ScoutApi
  clubs: Club[]
  chosen: Club[]
  /** A posição da vaga (ou do jogador): com ela, o catálogo sugere quem procura essa função. */
  position: string | null
  single?: boolean
  onAdd: (club: Club) => void
  onRemove: (id: string) => void
  onClubsChanged: (club: Club) => void
}) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<Region>("todos")
  const [catalog, setCatalog] = useState<CatalogClub[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { void loadCatalog().then(setCatalog) }, [])

  const chosenIds = useMemo(() => new Set(chosen.map((c) => c.id)), [chosen])
  const teamByCatalog = useMemo(() => new Map(clubs.filter((c) => c.catalogId).map((c) => [c.catalogId as string, c])), [clubs])

  const hits = useMemo<Hit[]>(() => {
    const q = norm(query.trim())
    const own = clubs.filter((c) => c.active && inRegion(c.country, region) && (!q || norm(`${c.name} ${c.country ?? ""} ${c.league ?? ""}`).includes(q)))
    const used = new Set(clubs.map((c) => c.catalogId).filter(Boolean))
    const cat = q.length >= 2
      ? catalog.filter((c) => !used.has(c.id) && inRegion(c.country, region) && norm(`${c.name} ${c.country} ${c.league}`).includes(q)).slice(0, 14)
      : []
    return [...own.slice(0, q ? 14 : 6).map((club) => ({ kind: "club" as const, club })), ...cat.map((club) => ({ kind: "catalog" as const, club }))]
  }, [query, clubs, catalog, region])

  // Sem busca: os clubes do catálogo que procuram exatamente a função (os que a equipe já usa entram como clube da equipe).
  const suggested = useMemo<Hit[]>(() => {
    if (query.trim() || !position || !catalog.length) return []
    return catalog
      .filter((c) => inRegion(c.country, region) && affinity(position, c.preferredStyle) === 2)
      .sort((a, b) => b.openPositions - a.openPositions || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map((c): Hit => {
        const team = teamByCatalog.get(c.id)
        return team ? { kind: "club", club: team } : { kind: "catalog", club: c }
      })
  }, [query, position, catalog, region, teamByCatalog])

  const styleOf = (hit: Hit) => {
    const c = hit.kind === "catalog" ? hit.club : catalog.find((x) => x.id === hit.club.catalogId)
    return c ? c.preferredStyle : null
  }

  const pick = async (hit: Hit) => {
    if (hit.kind === "club") {
      if (chosenIds.has(hit.club.id)) onRemove(hit.club.id)
      else onAdd(hit.club)
      return
    }
    setBusy(hit.club.id)
    try {
      const club = await api.clubFromCatalog(hit.club)
      onClubsChanged(club)
      onAdd(club)
    } catch (e) {
      toast({ title: "Não foi possível usar este clube", description: errMsg(e), variant: "destructive" })
    } finally {
      setBusy(null)
    }
  }

  const row = (h: Hit) => {
    const on = chosenIds.has(h.club.id)
    const style = styleOf(h)
    return (
      <li key={`${h.kind}-${h.club.id}`}>
        <button type="button" className={on ? "is-on" : ""} onClick={() => void pick(h)} disabled={busy !== null} aria-pressed={on}>
          {h.kind === "club"
            ? <ClubCrest club={h.club} size={30} />
            : <ClubCrest club={{ name: h.club.name, crestUrl: null, emblem: h.club.logo, color: null }} size={30} />}
          <span className="min-w-0 flex-1">
            <b className="block truncate">{h.club.name}</b>
            <small className="block truncate">{[h.club.country, h.club.league].filter(Boolean).join(" · ")}{style ? ` · procura ${style.toLowerCase()}` : ""}</small>
          </span>
          {busy === h.club.id ? <Loader2 className="op-spin" /> : on ? <span className="op-chooser-state"><Check /> Escolhido</span> : <span className="op-chooser-add"><Plus /> {single ? "Usar" : "Adicionar"}</span>}
        </button>
      </li>
    )
  }

  const rest = hits.filter((h) => !suggested.some((s) => s.club.id === h.club.id))

  return (
    <div className="op-chooser">
      <div className="op-chosen" aria-live="polite">
        {chosen.length ? chosen.map((c) => (
          <span key={c.id} className="op-chosen-chip">
            <ClubCrest club={c} size={24} />
            <b>{c.name}</b>
            {!single && <button type="button" onClick={() => onRemove(c.id)} aria-label={`Tirar ${c.name}`}><X /></button>}
          </span>
        )) : <span className="op-chosen-empty">{single ? "Escolha o clube" : "Nenhum clube escolhido ainda. Escolha um ou vários: cada clube vira uma oportunidade."}</span>}
      </div>

      <div className="op-chooser-tools">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="vx-input vx-input--icon" placeholder="Buscar clube, país ou liga" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar clube" />
        </div>
        <div className="op-regions" role="group" aria-label="Onde fica o clube">
          {REGIONS.map(([k, label]) => <button key={k} type="button" className={`vx-chip ${region === k ? "is-on" : ""}`} aria-pressed={region === k} onClick={() => setRegion(k)}>{label}</button>)}
        </div>
      </div>

      <ul className="op-chooser-list">
        {suggested.length > 0 && (
          <>
            <li className="op-chooser-title"><Sparkles /> Procuram {position}</li>
            {suggested.map(row)}
            {rest.length > 0 && <li className="op-chooser-title">Clubes da equipe</li>}
          </>
        )}
        {rest.map(row)}
        {!rest.length && !suggested.length && (
          <li className="op-picker-empty">{query.trim().length < 2 ? "Digite ao menos 2 letras para buscar no catálogo da Zyron." : "Nenhum clube encontrado. Crie o clube abaixo."}</li>
        )}
      </ul>

      {creating
        ? <NewClubForm api={api} initialName={query} onCancel={() => setCreating(false)} onSaved={(club) => { onClubsChanged(club); onAdd(club); setCreating(false) }} />
        : <button type="button" className="vx-btn op-chooser-new" onClick={() => setCreating(true)}><Plus /> Criar um clube que não está na lista</button>}
    </div>
  )
}
