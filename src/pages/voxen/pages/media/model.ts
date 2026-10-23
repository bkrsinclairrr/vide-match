/**
 * Materiais de cada jogador (os vídeos dele) e a escolha da foto: o modelo da tela, sem React e sem banco, para ser
 * testado à parte (`npm run test:materiais`).
 *
 * Um "material" é um link: YouTube, Google Drive e Vimeo tocam dentro da VOXEN; Instagram, TikTok e outros sites
 * abrem no site de origem. Além do que a equipe coloca, a seção mostra sozinha os jogos que o atleta enviou pela
 * área dele e as partidas analisadas com vídeo, sem repetir o mesmo vídeo.
 */

export type Provider = "youtube" | "vimeo" | "drive" | "arquivo" | "instagram" | "tiktok" | "link"

export type VideoRef = {
  provider: Provider
  /** Id do vídeo no serviço (YouTube, Vimeo, Drive); null nos outros. */
  id: string | null
  /** O link, já no formato padrão do serviço (o mesmo vídeo colado de jeitos diferentes vira o mesmo link). */
  url: string
  /** O site, sem "www." */
  host: string
  /** Miniatura pública, quando o serviço tem. */
  thumb: string | null
  /** Endereço para tocar dentro da VOXEN; null = abre no site de origem. */
  embed: string | null
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  youtube: "YouTube", vimeo: "Vimeo", drive: "Google Drive", arquivo: "Vídeo", instagram: "Instagram", tiktok: "TikTok", link: "Link",
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/
const FILE = /\.(mp4|webm|m4v|mov|ogv)$/i

/** "1h2m3s", "2m30s", "150s" ou "150" → segundos (0 quando não dá para ler). */
export function seconds(v: string | null): number {
  if (!v) return 0
  const t = v.trim().toLowerCase()
  if (/^\d+s?$/.test(t)) return Number.parseInt(t, 10)
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!m || !t) return 0
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/** Lê um link colado. Só https; devolve null quando não é um endereço que dá para abrir. */
export function videoRef(raw: string | null | undefined): VideoRef | null {
  const text = (raw ?? "").trim()
  if (!text || text.length > 500) return null
  let u: URL
  try {
    u = new URL(text)
  } catch {
    return null
  }
  if (u.protocol !== "https:" || !u.hostname.includes(".") || u.username || u.password) return null
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, "")
  u.hash = ""
  const plain = (): VideoRef => ({ provider: "link", id: null, url: u.toString(), host, thumb: null, embed: null })

  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    const id = host === "youtu.be"
      ? u.pathname.split("/")[1] ?? ""
      : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1] ?? ""
    if (!YT_ID.test(id)) return plain()
    const start = seconds(u.searchParams.get("t") ?? u.searchParams.get("start"))
    return {
      provider: "youtube", id, host: "youtube.com",
      url: `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1${start ? `&start=${start}` : ""}`,
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean)
    const i = parts.findIndex((p) => /^\d{6,}$/.test(p))
    if (i < 0) return plain()
    const id = parts[i]
    // Link privado: vimeo.com/123456789/abc123def (ou ?h= no player).
    const hash = u.searchParams.get("h") ?? (parts[i + 1] && /^[0-9a-f]{6,}$/i.test(parts[i + 1]) ? parts[i + 1] : null)
    return {
      provider: "vimeo", id, host: "vimeo.com",
      url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
      thumb: null,
      embed: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1${hash ? `&h=${hash}` : ""}`,
    }
  }

  if (host === "drive.google.com") {
    const id = u.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id")
    if (!id || !/^[\w-]{10,}$/.test(id)) return plain()
    return {
      provider: "drive", id, host,
      url: `https://drive.google.com/file/d/${id}/view`,
      thumb: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      embed: `https://drive.google.com/file/d/${id}/preview`,
    }
  }

  if (host === "instagram.com" && /^\/(p|reel|reels|tv)\/[\w-]+/.test(u.pathname)) {
    return { ...plain(), provider: "instagram" }
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return { ...plain(), provider: "tiktok" }
  }
  if (FILE.test(u.pathname)) {
    return { ...plain(), provider: "arquivo", embed: u.toString() }
  }
  return plain()
}

/** O mesmo vídeo, venha de onde vier (para não repetir quadrado). */
export function videoKey(ref: VideoRef): string {
  if (ref.id && (ref.provider === "youtube" || ref.provider === "vimeo" || ref.provider === "drive")) return `${ref.provider}:${ref.id}`
  return ref.url.replace(/\/$/, "").toLowerCase()
}

/* ------------------------------------------------------------------ */
/* Materiais                                                           */
/* ------------------------------------------------------------------ */

export type MaterialCategory = "lances" | "jogo" | "gols" | "treino" | "entrevista" | "outro"

export const CATEGORIES: MaterialCategory[] = ["lances", "jogo", "gols", "treino", "entrevista", "outro"]

export const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  lances: "Melhores lances", jogo: "Jogo completo", gols: "Gols", treino: "Treino", entrevista: "Entrevista", outro: "Outro",
}

export type Material = {
  id: string
  playerKey: string
  url: string
  title: string | null
  category: MaterialCategory
  /** AAAA-MM-DD. */
  recordedOn: string | null
  /** Ordem dos quadrados: menor primeiro. */
  position: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** O que a equipe preenche ao colocar ou editar um vídeo. */
export type MaterialDraft = { url: string; title: string; category: MaterialCategory; recordedOn: string }

/** O que vai para o banco depois de conferido. */
export type MaterialValue = { url: string; title: string | null; category: MaterialCategory; recordedOn: string | null }

export const EMPTY_DRAFT: MaterialDraft = { url: "", title: "", category: "lances", recordedOn: "" }

export const draftOf = (m: Material): MaterialDraft => ({ url: m.url, title: m.title ?? "", category: m.category, recordedOn: m.recordedOn ?? "" })

const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00`).getTime())

/** Confere o que foi preenchido. `others`: os links que o jogador já tem (para não repetir). */
export function checkDraft(d: MaterialDraft, others: { url: string }[], today = new Date()): { value: MaterialValue } | { error: string } {
  const ref = videoRef(d.url)
  if (!d.url.trim()) return { error: "Cole o link do vídeo." }
  if (!ref) return { error: "Cole um link que comece com https:// (YouTube, Google Drive, Vimeo ou outro site)." }
  const key = videoKey(ref)
  if (others.some((o) => { const r = videoRef(o.url); return r !== null && videoKey(r) === key })) {
    return { error: "Este vídeo já está nos materiais deste jogador." }
  }
  const title = d.title.replace(/\s+/g, " ").trim()
  if (title.length > 80) return { error: "Use um título de até 80 letras." }
  if (!CATEGORIES.includes(d.category)) return { error: "Escolha o tipo do vídeo." }
  const day = d.recordedOn.trim()
  if (day) {
    const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    if (!isDay(day) || day < "2000-01-01" || new Date(`${day}T12:00:00`) > limit) return { error: "Confira a data do vídeo." }
  }
  return { value: { url: ref.url, title: title || null, category: d.category, recordedOn: day || null } }
}

/** A próxima posição no fim da grade, e a que põe um vídeo antes de todos ("Destacar"). */
export const nextPosition = (list: Pick<Material, "position">[]) => (list.length ? Math.max(...list.map((m) => m.position)) + 1 : 0)
export const frontPosition = (list: Pick<Material, "position">[]) => (list.length ? Math.min(...list.map((m) => m.position)) - 1 : 0)

/* ------------------------------------------------------------------ */
/* Os quadrados                                                        */
/* ------------------------------------------------------------------ */

export type SubmissionStatus = "enviado" | "em_analise" | "analisado" | "recusado"

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  enviado: "Enviado", em_analise: "Em análise", analisado: "Analisado", recusado: "Recusado",
}

/** Um jogo que o atleta mandou pela área dele. */
export type AthleteVideo = {
  id: string
  videoId: string
  opponent: string | null
  playedOn: string | null
  status: SubmissionStatus
  matchId: string | null
  createdAt: string
}

/** Uma partida analisada que tem link de vídeo. */
export type MatchVideo = {
  id: string
  memberId: string
  url: string
  team: string
  opponent: string
  competition: string | null
  playedOn: string
  published: boolean
}

export type TileSource = "equipe" | "atleta" | "partida"

export const SOURCE_LABEL: Record<TileSource, string> = { equipe: "Da equipe", atleta: "Enviado pelo atleta", partida: "Partida analisada" }

export type Tile = {
  key: string
  source: TileSource
  ref: VideoRef
  title: string
  /** Pequenas informações sob o título (tipo, data, situação). */
  meta: string[]
  /** AAAA-MM-DD. */
  date: string | null
  material: Material | null
  matchId: string | null
  status: SubmissionStatus | null
}

/** "2026-10-23" → "23/10/2026". */
export const dayLabel = (d: string | null) => (d && isDay(d.slice(0, 10)) ? d.slice(0, 10).split("-").reverse().join("/") : "")

const byPosition = (a: Material, b: Material) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)

/**
 * Os quadrados preenchidos, na ordem: o que a equipe colocou (na ordem dela), as partidas analisadas (da mais nova
 * para a mais antiga) e os jogos que o atleta enviou e ainda não viraram partida. O mesmo vídeo aparece uma vez só.
 */
export function buildTiles(materials: Material[], matches: MatchVideo[] = [], sent: AthleteVideo[] = []): Tile[] {
  const out: Tile[] = []
  const seen = new Set<string>()
  const push = (t: Tile) => {
    const k = videoKey(t.ref)
    if (seen.has(k)) return
    seen.add(k)
    out.push(t)
  }

  for (const m of [...materials].sort(byPosition)) {
    const ref = videoRef(m.url)
    if (!ref) continue
    push({
      key: `equipe:${m.id}`, source: "equipe", ref,
      title: m.title ?? CATEGORY_LABEL[m.category],
      meta: [CATEGORY_LABEL[m.category], dayLabel(m.recordedOn)].filter(Boolean),
      date: m.recordedOn, material: m, matchId: null, status: null,
    })
  }

  const shown = new Set<string>()
  for (const m of [...matches].sort((a, b) => b.playedOn.localeCompare(a.playedOn))) {
    const ref = videoRef(m.url)
    if (!ref) continue
    shown.add(m.id)
    push({
      key: `partida:${m.id}`, source: "partida", ref,
      title: `${m.team} × ${m.opponent}`,
      meta: [m.competition ?? "Partida analisada", dayLabel(m.playedOn), m.published ? "" : "Rascunho"].filter(Boolean),
      date: m.playedOn, material: null, matchId: m.id, status: null,
    })
  }

  for (const s of [...sent].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (s.matchId && shown.has(s.matchId)) continue
    const ref = videoRef(`https://www.youtube.com/watch?v=${s.videoId}`)
    if (!ref) continue
    push({
      key: `atleta:${s.id}`, source: "atleta", ref,
      title: s.opponent ? `Jogo contra ${s.opponent}` : "Jogo enviado pelo atleta",
      meta: [STATUS_LABEL[s.status], dayLabel(s.playedOn)].filter(Boolean),
      date: s.playedOn ?? s.createdAt.slice(0, 10), material: null, matchId: s.matchId, status: s.status,
    })
  }
  return out
}

/**
 * Quantos quadrados mostrar: no mínimo `min` (duas fileiras de 4), sempre com fileiras cheias e, para quem pode
 * colocar vídeo, sempre com um quadrado livre no fim.
 */
export function slotCount(filled: number, canAdd: boolean, cols = 4, min = 8): number {
  const need = filled + (canAdd ? 1 : 0)
  return Math.max(min, Math.ceil(need / cols) * cols)
}

export type TileFilter = "todos" | TileSource

export const filterTiles = (tiles: Tile[], f: TileFilter) => (f === "todos" ? tiles : tiles.filter((t) => t.source === f))

/** Toca dentro da VOXEN? (YouTube, Vimeo, Drive e arquivo de vídeo.) */
export const playsHere = (ref: VideoRef) => ref.embed !== null

/* ------------------------------------------------------------------ */
/* A escolha da foto                                                   */
/* ------------------------------------------------------------------ */

export type PhotoMode = "perfil" | "corpo"

/** "Escolha do atleta em 23/10/2026" (ou da equipe). Vazio quando ninguém escolheu ainda. */
export function choiceNote(by: "atleta" | "equipe" | null, at: string | null): string {
  if (!by) return ""
  const d = at ? new Date(at) : null
  const when = d && !Number.isNaN(d.getTime()) ? ` em ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : ""
  return `Escolha ${by === "atleta" ? "do atleta" : "da equipe"}${when}`
}
