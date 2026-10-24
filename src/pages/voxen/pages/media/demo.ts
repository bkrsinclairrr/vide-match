/**
 * Materiais e fotos em memória, só para o `npm run dev` (/voxen?demo). Carregado por import dinâmico dentro de uma
 * condição que o build de produção resolve como falsa (api.ts → getMediaApi), então não vai para o site publicado.
 * Os vídeos são públicos e conhecidos (demonstrações do YouTube e filmes abertos da Blender), só para ver os
 * quadrados preenchidos.
 */
import { demoScout } from "../scout/demo"
import { lookFromControls } from "../hero/model"
import { noLook, type MediaApi, type MemberVideos } from "./api"
import type { Material } from "./model"

/** Quem está usando a demonstração (para "remover o próprio vídeo") e outra pessoa da equipe. */
export const DEMO_ME = "demo-me"
const OTHER = "demo-admin"

const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const day = (d: number) => ago(d).slice(0, 10)
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 140))

let materials: Material[] = [
  { id: "mat-1", playerKey: "demo:0", url: "https://www.youtube.com/watch?v=M7lc1UVf-VE", title: "Melhores lances 2026", category: "lances", recordedOn: day(12), position: 0, createdBy: OTHER, createdAt: ago(12), updatedAt: ago(12) },
  { id: "mat-2", playerKey: "demo:0", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=30s", title: "Gol de falta contra o Gama", category: "gols", recordedOn: day(6), position: 1, createdBy: DEMO_ME, createdAt: ago(6), updatedAt: ago(6) },
  { id: "mat-3", playerKey: "demo:0", url: "https://www.instagram.com/reel/C9xYz12AbCd/", title: "Treino de finalização", category: "treino", recordedOn: null, position: 2, createdBy: DEMO_ME, createdAt: ago(3), updatedAt: ago(3) },
  { id: "mat-4", playerKey: "lead:demo-juan", url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123/view", title: "Jogo completo · Sub 17", category: "jogo", recordedOn: day(9), position: 0, createdBy: OTHER, createdAt: ago(9), updatedAt: ago(9) },
]

const videos: Record<string, MemberVideos> = {
  "m-gabriel": {
    matches: [
      { id: "match-g1", memberId: "m-gabriel", url: "https://www.youtube.com/watch?v=eRsGyueVLvQ", team: "Real Brasília Sub-17", opponent: "Gama Sub-17", competition: "Candangão Sub-17", playedOn: day(20), published: true },
    ],
    sent: [
      { id: "env-g1", videoId: "R6MlUcmOul8", opponent: "Ceilândia Sub-17", playedOn: day(5), status: "em_analise", matchId: null, createdAt: ago(4) },
    ],
  },
}

const sorted = (list: Material[]) => [...list].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt))

export const demoMedia: MediaApi = {
  demo: true,
  me: DEMO_ME,

  async materials(keys) {
    const want = new Set(keys)
    return delay(sorted(materials.filter((m) => want.has(m.playerKey))).map((m) => ({ ...m })))
  },

  async addMaterial(playerKey, value, position) {
    const mine = materials.filter((m) => m.playerKey === playerKey)
    if (mine.some((m) => m.url === value.url)) throw new Error("Este vídeo já está nos materiais deste jogador.")
    if (mine.length >= 60) throw new Error("Este jogador já tem 60 materiais. Remova algum antes de colocar outro.")
    const now = new Date().toISOString()
    const m: Material = { id: crypto.randomUUID(), playerKey, ...value, position, createdBy: DEMO_ME, createdAt: now, updatedAt: now }
    materials = [...materials, m]
    return delay({ ...m })
  },

  async updateMaterial(id, patch) {
    const current = materials.find((m) => m.id === id)
    if (!current) throw new Error("Este vídeo não existe mais.")
    if (patch.url && materials.some((m) => m.id !== id && m.playerKey === current.playerKey && m.url === patch.url)) {
      throw new Error("Este vídeo já está nos materiais deste jogador.")
    }
    const next: Material = { ...current, ...patch, updatedAt: new Date().toISOString() }
    materials = materials.map((m) => (m.id === id ? next : m))
    return delay({ ...next })
  },

  async removeMaterial(id) {
    materials = materials.filter((m) => m.id !== id)
    return delay(undefined)
  },

  async memberVideos(memberId) {
    const v = videos[memberId]
    return delay({ matches: [...(v?.matches ?? [])], sent: [...(v?.sent ?? [])] })
  },

  // A foto é a dos controles do Scout (os mesmos que o editor de foto mexe), para a ficha e o editor sempre combinarem.
  async look(memberId) {
    if (!memberId) return delay(noLook(null))
    const [c, clubs] = await Promise.all([demoScout.controlsFor(memberId), demoScout.clubs()])
    const kit = clubs.find((x) => x.id === c.kitClubId) ?? null
    return lookFromControls(noLook(memberId), c, kit)
  },

  async setPhotoMode(memberId, mode) {
    const c = await demoScout.controlsFor(memberId)
    if (mode === "corpo" && !c.bodyPhotoUrl) throw new Error("Ainda não há foto de corpo inteiro para este jogador.")
    const saved = await demoScout.saveControls(memberId, { bodyPhotoOn: mode === "corpo" })
    return { mode: saved.bodyPhotoOn && saved.bodyPhotoUrl ? "corpo" as const : "perfil" as const, choiceBy: saved.photoChoiceBy, choiceAt: saved.photoChoiceAt }
  },
}
