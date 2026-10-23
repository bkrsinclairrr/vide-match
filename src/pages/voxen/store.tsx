import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  buildPercentiles, deletePlayer, editFromPlayer, loadVoxenData, saveMeta, updatePlayer,
  type Percentiles, type Player, type PlayerEdit, type PlayerMeta, type ProfileEdit, type VoxenData,
} from "./data"
import { withEstimates } from "./estimate"
import { saveChartEdit } from "./pages/chartedit/api"
import { applyChartEdit, type ChartEdit } from "./pages/chartedit/model"
import { ageFromBirth, hasAnyProfile, keysOf } from "./people"
import { canAdminAs, canScoutAs, type StaffRole } from "./access"

const ESTIMATED_PREF = "voxen:estimados"

/** Os valores estimados começam ligados; a escolha de quem desliga fica guardada neste navegador. */
const readEstimatedPref = () => {
  try {
    return localStorage.getItem(ESTIMATED_PREF) !== "off"
  } catch {
    return true
  }
}

type EditResult = { partial: boolean; warnings: string[]; changed: number }

type VoxenStore = {
  data: VoxenData | null
  players: Player[]
  /** Acha o jogador pelo endereço dele ou pelo de qualquer registro que foi juntado a ele (os links antigos continuam abrindo). */
  byKey: Map<string, Player>
  percentile: Percentiles
  loading: boolean
  error: string | null
  demo: boolean
  /** Nível de acesso de quem está na VOXEN. */
  role: StaffRole
  /** Mantém jogadores (cadastro, notas, avaliação, partidas): toda a equipe. */
  canScout: boolean
  /** Exclui cadastros, membros e partidas e mexe em contas: só o administrador. */
  canAdmin: boolean
  /** Mostra os valores estimados (idade, time... que o jogador ainda não informou), marcados como "est.". */
  showEstimated: boolean
  setShowEstimated: (on: boolean) => void
  /** Quantos jogadores têm algum valor estimado (com a chave ligada ou não). */
  estimatedCount: number
  /** Recarrega a base; `true` se deu certo. */
  reload: () => Promise<boolean>
  updateMeta: (key: string, patch: Partial<PlayerMeta>) => Promise<void>
  /** Muda o que os gráficos do jogador mostram (indicadores, nota geral, campo e calor); `null` volta ao relatório original. Vale só no painel. */
  saveChart: (key: string, edit: ChartEdit | null) => Promise<void>
  /** Edita o cadastro do atleta (toda a equipe). `partial`: o perfil do lead não pôde ser gravado. */
  editPlayer: (key: string, edit: PlayerEdit) => Promise<EditResult>
  /** Muda o mesmo campo em vários jogadores e recarrega só no fim. `failed`: chaves que o banco recusou. */
  editPlayers: (keys: string[], patch: Partial<ProfileEdit>) => Promise<{ done: number; failed: string[]; reason: string | null }>
  /** Exclui o registro (só administrador). */
  removePlayer: (key: string) => Promise<void>
  /** Exclui vários de uma vez e recarrega só no fim. `failed`: chaves que o banco recusou (com o motivo da primeira falha). */
  removePlayers: (keys: string[]) => Promise<{ removed: number; failed: string[]; reason: string | null }>
}

const Ctx = createContext<VoxenStore | null>(null)

export function useVoxen() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useVoxen fora do VoxenProvider")
  return ctx
}

export function VoxenProvider({ demo, role, children }: { demo: boolean; role: StaffRole; children: ReactNode }) {
  const { toast } = useToast()
  const [data, setData] = useState<VoxenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEstimated, setShowEstimatedState] = useState(readEstimatedPref)
  const saveTimers = useRef(new Map<string, number>())
  const dataRef = useRef<VoxenData | null>(null)

  const setShowEstimated = useCallback((on: boolean) => {
    setShowEstimatedState(on)
    try {
      localStorage.setItem(ESTIMATED_PREF, on ? "on" : "off")
    } catch {
      /* navegador sem armazenamento: vale só nesta visita */
    }
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Import dinâmico dentro da condição: no build de produção ela vira `false`
      // e o gerador de dados de teste nem entra no bundle.
      const loaded = import.meta.env.DEV && demo
        ? (await import("./testData")).buildDemoData()
        : await loadVoxenData()
      dataRef.current = loaded
      setData(loaded)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os atletas.")
      return false
    } finally {
      setLoading(false)
    }
  }, [demo])

  useEffect(() => { void reload() }, [reload])

  /**
   * Atualiza na hora (otimista) e grava em seguida. Notas digitadas em
   * sequência viram uma gravação só, 700 ms depois da última tecla.
   */
  const updateMeta = useCallback(async (key: string, patch: Partial<PlayerMeta>) => {
    if (!canScoutAs(role)) return
    const current = dataRef.current
    const player = current?.players.find((p) => p.key === key || p.aliases.includes(key))
    if (!current || !player) return
    // A etapa e as notas ficam sempre no endereço principal da pessoa.
    const own = player.key
    const next: PlayerMeta = { ...player.meta, ...patch, updatedAt: new Date().toISOString() }
    const updated = { ...current, players: current.players.map((p) => (p.key === own ? { ...p, meta: next } : p)) }
    dataRef.current = updated
    setData(updated)
    if (demo) return

    const shared = current.sharedMeta
    const timers = saveTimers.current
    window.clearTimeout(timers.get(own))
    timers.set(own, window.setTimeout(async () => {
      timers.delete(own)
      try {
        await saveMeta(own, next, shared)
      } catch (err) {
        toast({
          title: "Não foi possível salvar",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        })
      }
    }, "notes" in patch ? 700 : 0))
  }, [demo, role, toast])

  /** O jogador real (sem valores estimados), pelo endereço dele ou pelo de um registro juntado a ele. */
  const findReal = (key: string) => dataRef.current?.players.find((p) => p.key === key || p.aliases.includes(key))

  /**
   * Depois de gravar, a tela já mostra o novo valor (atualização na memória); a base é lida de novo em segundo plano
   * quando a pessoa para de mexer, para confirmar tudo com o banco. Assim editar vários cadastros em seguida não trava.
   */
  const reloadTimer = useRef<number | null>(null)
  const scheduleReload = useCallback(() => {
    if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current)
    reloadTimer.current = window.setTimeout(() => { reloadTimer.current = null; void reload() }, 1500)
  }, [reload])
  useEffect(() => () => { if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current) }, [])

  /** Aplica uma edição só na memória (modo de teste local): o que foi limpo volta a ser estimado. */
  const applyEditInMemory = (player: Player, edit: PlayerEdit): Player => {
    const f = edit.profile
    const profile = {
      ...player.profile,
      age: (f.birthDate ? ageFromBirth(f.birthDate) : undefined) ?? f.age ?? undefined, height: f.height ?? undefined, weight: f.weight ?? undefined, foot: f.foot ?? undefined,
      nationality: f.nationality ?? undefined, position: f.position ?? undefined, category: f.category ?? undefined,
      state: f.state ?? undefined, city: f.city ?? undefined, team: f.team ?? undefined, birthDate: f.birthDate ?? undefined,
    }
    return {
      ...player,
      name: edit.name.trim() || player.name,
      email: edit.email !== undefined ? edit.email.trim().toLowerCase() || null : player.email,
      phone: edit.phone !== undefined ? edit.phone.replace(/\D/g, "") || null : player.phone,
      profile,
      hasProfile: hasAnyProfile(profile),
    }
  }

  const saveChart = useCallback(async (key: string, edit: ChartEdit | null) => {
    const current = dataRef.current
    const player = findReal(key)
    if (!canScoutAs(role) || !current || !player) throw new Error("Você não tem permissão para editar os gráficos.")
    if (!demo) await saveChartEdit(player.key, player.aliases, edit)
    const stamped = edit ? { ...edit, updatedAt: new Date().toISOString() } : null
    const latest = dataRef.current ?? current
    const updated = { ...latest, players: latest.players.map((p) => (p.key === player.key ? applyChartEdit(p, stamped) : p)) }
    dataRef.current = updated
    setData(updated)
  }, [demo, role])

  const editPlayer = useCallback(async (key: string, edit: PlayerEdit): Promise<EditResult> => {
    const current = dataRef.current
    const player = findReal(key)
    if (!canScoutAs(role) || !current || !player) throw new Error("Você não tem permissão para editar.")
    if (demo) {
      const next = applyEditInMemory(player, edit)
      const updated = { ...current, players: current.players.map((p) => (p.key === player.key ? next : p)) }
      dataRef.current = updated
      setData(updated)
      return { partial: false, warnings: [], changed: 1 }
    }
    const result = await updatePlayer(player, edit)
    if (result.changed) {
      const latest = dataRef.current
      if (latest) {
        const updated = { ...latest, players: latest.players.map((p) => (p.key === player.key ? applyEditInMemory(p, edit) : p)) }
        dataRef.current = updated
        setData(updated)
      }
      scheduleReload()
    }
    return result
  }, [demo, role, reload, scheduleReload])

  const editPlayers = useCallback(async (keys: string[], patch: Partial<ProfileEdit>) => {
    const current = dataRef.current
    if (!canScoutAs(role) || !current) throw new Error("Você não tem permissão para editar.")
    const wanted = new Set(keys)
    const targets = current.players.filter((p) => keysOf(p).some((k) => wanted.has(k)))
    const build = (p: Player): PlayerEdit => {
      const base = editFromPlayer(p)
      return { ...base, profile: { ...base.profile, ...patch } }
    }
    if (demo) {
      const ids = new Set(targets.map((p) => p.key))
      const updated = { ...current, players: current.players.map((p) => (ids.has(p.key) ? applyEditInMemory(p, build(p)) : p)) }
      dataRef.current = updated
      setData(updated)
      return { done: targets.length, failed: [] as string[], reason: null as string | null }
    }
    const failed: string[] = []
    let reason: string | null = null
    let done = 0
    for (const p of targets) {
      try {
        await updatePlayer(p, build(p))
        done++
      } catch (err) {
        failed.push(p.key)
        reason ??= err instanceof Error ? err.message : String(err)
      }
    }
    await reload()
    return { done, failed, reason }
  }, [demo, role, reload])

  const removePlayer = useCallback(async (key: string) => {
    const current = dataRef.current
    const player = findReal(key)
    if (!canAdminAs(role) || !current || !player) throw new Error("Só um administrador pode excluir.")
    if (demo) {
      const updated = { ...current, players: current.players.filter((p) => p.key !== player.key) }
      dataRef.current = updated
      setData(updated)
      return
    }
    await deletePlayer(player)
    const latest = dataRef.current
    if (latest) {
      const updated = { ...latest, players: latest.players.filter((p) => p.key !== player.key) }
      dataRef.current = updated
      setData(updated)
    }
    scheduleReload()
  }, [demo, role, scheduleReload])

  const removePlayers = useCallback(async (keys: string[]) => {
    const current = dataRef.current
    if (!canAdminAs(role) || !current) throw new Error("Só um administrador pode excluir.")
    const wanted = new Set(keys)
    // Quem foi marcado pelo endereço principal ou pelo de um registro juntado conta uma vez só.
    const targets = current.players.filter((p) => keysOf(p).some((k) => wanted.has(k)))
    if (demo) {
      const ids = new Set(targets.map((p) => p.key))
      const updated = { ...current, players: current.players.filter((p) => !ids.has(p.key)) }
      dataRef.current = updated
      setData(updated)
      return { removed: targets.length, failed: [] as string[], reason: null }
    }
    const failed: string[] = []
    let reason: string | null = null
    let removed = 0
    for (const player of targets) {
      try {
        await deletePlayer(player)
        removed++
      } catch (err) {
        failed.push(player.key)
        reason ??= err instanceof Error ? err.message : String(err)
      }
    }
    await reload()
    return { removed, failed, reason }
  }, [demo, role, reload])

  const value = useMemo<VoxenStore>(() => {
    const real = data?.players ?? []
    const players = showEstimated ? withEstimates(real) : real
    const byKey = new Map<string, Player>()
    for (const p of players) {
      byKey.set(p.key, p)
      for (const alias of p.aliases) byKey.set(alias, p)
    }
    return {
      data,
      players,
      byKey,
      percentile: buildPercentiles(players),
      loading,
      error,
      demo,
      role,
      canScout: canScoutAs(role),
      canAdmin: canAdminAs(role),
      showEstimated,
      setShowEstimated,
      estimatedCount: showEstimated ? players.filter((p) => p.estimated.length).length : withEstimates(real).filter((p) => p.estimated.length).length,
      reload,
      updateMeta,
      saveChart,
      editPlayer,
      editPlayers,
      removePlayer,
      removePlayers,
    }
  }, [data, loading, error, demo, role, showEstimated, setShowEstimated, reload, updateMeta, saveChart, editPlayer, editPlayers, removePlayer, removePlayers])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
