/**
 * Dados dos Materiais (os vídeos de cada jogador) e da foto do jogador no painel. Só a equipe lê e coloca vídeo;
 * remover é do administrador ou de quem colocou (o banco garante). A escolha da foto (perfil ou corpo inteiro) mora
 * em zyron_player_controls, a mesma ficha da foto de corpo inteiro. Migração: 20261025100000_foto_escolhida_e_materiais.
 * No `npm run dev` com ?demo, dados locais (demo.ts).
 */
import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { isMissing, toClub, type BodyPhoto } from "@/pages/membros/scoutLayer"
import { isPhotoData } from "@/pages/membros/photo"
import {
  CATEGORIES, type AthleteVideo, type Material, type MaterialCategory, type MaterialValue, type MatchVideo, type PhotoMode, type SubmissionStatus,
} from "./model"

const db = supabase as unknown as SupabaseClient

export const MEDIA_MIGRATION = "supabase/migrations/20261025100000_foto_escolhida_e_materiais.sql"

/** A tabela dos materiais ainda não existe no banco (migração não aplicada). */
export class MediaSetupMissingError extends Error {
  constructor() {
    super("Os materiais ainda não foram ativados no banco de dados.")
    this.name = "MediaSetupMissingError"
  }
}

/** Como o jogador aparece: a foto redonda, a de corpo inteiro (se a equipe enviou) e a escolha entre as duas. */
export type Look = {
  memberId: string | null
  /** A foto redonda: a que o atleta escolheu na área dele ou, sem ela, a do cadastro de membro. */
  avatarUrl: string | null
  /** A foto de corpo inteiro enviada pela equipe (mesmo com a escolha em "perfil"). */
  body: BodyPhoto | null
  mode: PhotoMode
  choiceBy: "atleta" | "equipe" | null
  choiceAt: string | null
}

export const noLook = (memberId: string | null): Look => ({ memberId, avatarUrl: null, body: null, mode: "perfil", choiceBy: null, choiceAt: null })

export type MemberVideos = { matches: MatchVideo[]; sent: AthleteVideo[] }

export type PhotoChoice = Pick<Look, "mode" | "choiceBy" | "choiceAt">

export interface MediaApi {
  readonly demo: boolean
  /** Quem está usando os dados locais do `npm run dev` (no site, vale a conta logada). */
  readonly me?: string
  /** Os materiais de todas as chaves da pessoa (o lead e a conta juntados contam como um jogador só). */
  materials(keys: string[]): Promise<Material[]>
  addMaterial(playerKey: string, value: MaterialValue, position: number): Promise<Material>
  updateMaterial(id: string, patch: Partial<MaterialValue> & { position?: number }): Promise<Material>
  removeMaterial(id: string): Promise<void>
  /** Os vídeos que já existem em outro lugar: partidas analisadas com link e jogos que o atleta enviou. */
  memberVideos(memberId: string): Promise<MemberVideos>
  look(memberId: string | null, userId: string | null): Promise<Look>
  setPhotoMode(memberId: string, mode: PhotoMode): Promise<PhotoChoice>
}

type Row = Record<string, unknown>

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
const https = (v: unknown) => (typeof v === "string" && /^https:\/\//.test(v) ? v : null)
const STATUSES: SubmissionStatus[] = ["enviado", "em_analise", "analisado", "recusado"]

export function toMaterial(r: Row): Material {
  return {
    id: String(r.id),
    playerKey: String(r.player_key),
    url: String(r.url),
    title: text(r.title),
    category: CATEGORIES.includes(r.category as MaterialCategory) ? (r.category as MaterialCategory) : "outro",
    recordedOn: text(r.recorded_on)?.slice(0, 10) ?? null,
    position: Number(r.position) || 0,
    createdBy: text(r.created_by),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? r.created_at ?? ""),
  }
}

const toSent = (r: Row): AthleteVideo | null => {
  const videoId = text(r.video_id)
  if (!text(r.id) || !videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null
  return {
    id: String(r.id), videoId, opponent: text(r.opponent), playedOn: text(r.played_on)?.slice(0, 10) ?? null,
    status: STATUSES.includes(r.status as SubmissionStatus) ? (r.status as SubmissionStatus) : "enviado",
    matchId: text(r.match_id), createdAt: String(r.created_at ?? ""),
  }
}

const toMatchVideo = (r: Row): MatchVideo | null => {
  const url = https(r.video_url)
  if (!text(r.id) || !url) return null
  return {
    id: String(r.id), memberId: String(r.member_id), url, team: text(r.team) ?? "Time", opponent: text(r.opponent) ?? "Adversário",
    competition: text(r.competition), playedOn: text(r.played_on)?.slice(0, 10) ?? "", published: r.published === true,
  }
}

const valueRow = (v: Partial<MaterialValue> & { position?: number }) => {
  const out: Row = {}
  if (v.url !== undefined) out.url = v.url
  if (v.title !== undefined) out.title = v.title
  if (v.category !== undefined) out.category = v.category
  if (v.recordedOn !== undefined) out.recorded_on = v.recordedOn
  if (v.position !== undefined) out.position = v.position
  return out
}

/** Erros do banco em português claro. */
function fail(error: { code?: string; message?: string }): never {
  if (isMissing(error)) throw new MediaSetupMissingError()
  if (error.code === "23505") throw new Error("Este vídeo já está nos materiais deste jogador.")
  if (error.code === "54000") throw new Error(error.message || "Este jogador já tem 60 materiais.")
  if (error.code === "23514") throw new Error("Confira o link, o título e a data do vídeo.")
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) throw new Error("O seu acesso não permite esta ação.")
  throw new Error(error.message || "Erro ao acessar o banco de dados.")
}

/** A foto de corpo inteiro guardada na ficha (com o clube do uniforme). */
const bodyOf = (c: Row | null, kit: BodyPhoto["kit"]): BodyPhoto | null => {
  const url = https(c?.body_photo_url)
  if (!c || !url) return null
  return { url, smallUrl: https(c.body_photo_small_url), style: c.body_photo_style === "recorte" ? "recorte" : "moldura", kit }
}

const choiceOf = (c: Row | null, hasBody: boolean): PhotoChoice => ({
  mode: c?.body_photo_on === true && hasBody ? "corpo" : "perfil",
  choiceBy: c?.photo_choice_by === "atleta" || c?.photo_choice_by === "equipe" ? c.photo_choice_by : null,
  choiceAt: text(c?.photo_choice_at),
})

const supabaseMedia: MediaApi = {
  demo: false,

  async materials(keys) {
    const list = [...new Set(keys)].filter((k) => /^(lead|atleta|crm):/.test(k))
    if (!list.length) return []
    const { data, error } = await db.from("voxen_player_materials").select("*").in("player_key", list)
      .order("position", { ascending: true }).order("created_at", { ascending: true })
    if (error) fail(error)
    return ((data ?? []) as Row[]).map(toMaterial)
  },

  async addMaterial(playerKey, value, position) {
    const { data, error } = await db.from("voxen_player_materials")
      .insert({ player_key: playerKey, ...valueRow({ ...value, position }) }).select("*").single()
    if (error) fail(error)
    return toMaterial(data as Row)
  },

  async updateMaterial(id, patch) {
    const { data, error } = await db.from("voxen_player_materials").update(valueRow(patch)).eq("id", id).select("*").maybeSingle()
    if (error) fail(error)
    if (!data) throw new Error("O seu acesso não permite editar este vídeo.")
    return toMaterial(data as Row)
  },

  async removeMaterial(id) {
    const { data, error } = await db.from("voxen_player_materials").delete().eq("id", id).select("id")
    if (error) fail(error)
    // A regra de acesso não dá erro para quem não pode remover: simplesmente nada sai.
    if (!data?.length) throw new Error("Só o administrador ou quem colocou o vídeo pode removê-lo.")
  },

  async memberVideos(memberId) {
    const [m, s] = await Promise.all([
      db.from("zyron_matches").select("id, member_id, played_on, team, opponent, competition, video_url, published")
        .eq("member_id", memberId).not("video_url", "is", null),
      db.from("zyron_match_submissions").select("id, video_id, opponent, played_on, status, match_id, created_at").eq("member_id", memberId),
    ])
    // Sem as partidas ou sem os envios no banco, a seção segue só com os materiais da equipe.
    return {
      matches: m.error ? [] : ((m.data ?? []) as Row[]).map(toMatchVideo).filter((x): x is MatchVideo => x !== null),
      sent: s.error ? [] : ((s.data ?? []) as Row[]).map(toSent).filter((x): x is AthleteVideo => x !== null),
    }
  },

  async look(memberId, userId) {
    let uid = userId
    let avatar: string | null = null
    let controls: Row | null = null
    let kit: BodyPhoto["kit"] = null
    if (memberId) {
      const [m, c] = await Promise.all([
        db.from("zyron_members").select("id, user_id, photo_url").eq("id", memberId).maybeSingle(),
        db.from("zyron_player_controls").select("*").eq("member_id", memberId).maybeSingle(),
      ])
      const member = (m.data ?? null) as Row | null
      if (member) {
        uid = uid ?? text(member.user_id)
        avatar = https(member.photo_url)
      }
      if (!c.error) controls = (c.data ?? null) as Row | null
      if (controls?.kit_club_id) {
        const k = await db.from("zyron_clubs").select("*").eq("id", controls.kit_club_id as string).maybeSingle()
        kit = toClub(k.data as Row)
      }
    }
    if (uid) {
      // A foto que o atleta escolheu na área dele vale mais que a do cadastro.
      const p = await db.from("profiles").select("avatar_url").eq("id", uid).maybeSingle()
      const own = (p.data as Row | null)?.avatar_url
      if (typeof own === "string" && (/^https:\/\//.test(own) || isPhotoData(own))) avatar = own
    }
    const body = bodyOf(controls, kit)
    return { memberId, avatarUrl: avatar, body, ...choiceOf(controls, Boolean(body)) }
  },

  async setPhotoMode(memberId, mode) {
    const { data, error } = await db.from("zyron_player_controls").update({ body_photo_on: mode === "corpo" })
      .eq("member_id", memberId).select("*").maybeSingle()
    if (error) {
      if (error.code === "23514") throw new Error("Envie a foto de corpo inteiro antes de escolher aparecer de corpo inteiro.")
      fail(error)
    }
    if (!data) {
      if (mode === "corpo") throw new Error("Ainda não há foto de corpo inteiro para este jogador.")
      return { mode: "perfil", choiceBy: null, choiceAt: null }
    }
    const row = data as Row
    return choiceOf(row, Boolean(https(row.body_photo_url)))
  },
}

/**
 * A fonte dos dados. A condição fica escrita por extenso de propósito: só assim o build de
 * produção a resolve como falsa e descarta o import dos dados de teste.
 */
export async function getMediaApi(demo: boolean): Promise<MediaApi> {
  if (import.meta.env.DEV && demo) return (await import("./demo")).demoMedia
  return supabaseMedia
}

/** A fonte pronta para usar (null no primeiro instante). */
export function useMediaApi(demo: boolean) {
  const [api, setApi] = useState<MediaApi | null>(null)
  useEffect(() => {
    let cancelled = false
    void getMediaApi(demo).then((a) => { if (!cancelled) setApi(a) })
    return () => { cancelled = true }
  }, [demo])
  return api
}
