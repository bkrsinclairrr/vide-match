import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  buildPercentiles, deletePlayer, loadVoxenData, saveMeta, updatePlayer,
  type Percentiles, type Player, type PlayerEdit, type PlayerMeta, type VoxenData,
} from "./data"
import { canAdminAs, canScoutAs, type StaffRole } from "./access"

type VoxenStore = {
  data: VoxenData | null
  players: Player[]
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
  /** Recarrega a base; `true` se deu certo. */
  reload: () => Promise<boolean>
  updateMeta: (key: string, patch: Partial<PlayerMeta>) => Promise<void>
  /** Edita o cadastro do atleta (toda a equipe). `partial`: o perfil do lead não pôde ser gravado. */
  editPlayer: (key: string, edit: PlayerEdit) => Promise<{ partial: boolean }>
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
  const saveTimers = useRef(new Map<string, number>())
  const dataRef = useRef<VoxenData | null>(null)

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
    const player = current?.players.find((p) => p.key === key)
    if (!current || !player) return
    const next: PlayerMeta = { ...player.meta, ...patch, updatedAt: new Date().toISOString() }
    const updated = { ...current, players: current.players.map((p) => (p.key === key ? { ...p, meta: next } : p)) }
    dataRef.current = updated
    setData(updated)
    if (demo) return

    const shared = current.sharedMeta
    const timers = saveTimers.current
    window.clearTimeout(timers.get(key))
    timers.set(key, window.setTimeout(async () => {
      timers.delete(key)
      try {
        await saveMeta(key, next, shared)
      } catch (err) {
        toast({
          title: "Não foi possível salvar",
          description: err instanceof Error ? err.message : "Tente novamente em instantes.",
          variant: "destructive",
        })
      }
    }, "notes" in patch ? 700 : 0))
  }, [demo, role, toast])

  const editPlayer = useCallback(async (key: string, edit: PlayerEdit) => {
    const current = dataRef.current
    const player = current?.players.find((p) => p.key === key)
    if (!canScoutAs(role) || !current || !player) throw new Error("Você não tem permissão para editar.")
    if (demo) {
      const f = edit.profile
      const next: Player = {
        ...player,
        name: edit.name.trim() || player.name,
        email: edit.email !== undefined ? edit.email.trim().toLowerCase() || null : player.email,
        phone: edit.phone !== undefined ? edit.phone.replace(/\D/g, "") || null : player.phone,
        profile: {
          ...player.profile,
          age: f.age ?? undefined, height: f.height ?? undefined, weight: f.weight ?? undefined, foot: f.foot ?? undefined,
          nationality: f.nationality ?? undefined, position: f.position ?? undefined, category: f.category ?? undefined,
          state: f.state ?? undefined, city: f.city ?? undefined,
        },
      }
      const updated = { ...current, players: current.players.map((p) => (p.key === key ? next : p)) }
      dataRef.current = updated
      setData(updated)
      return { partial: false }
    }
    const result = await updatePlayer(player, edit)
    await reload()
    return result
  }, [demo, role, reload])

  const removePlayer = useCallback(async (key: string) => {
    const current = dataRef.current
    const player = current?.players.find((p) => p.key === key)
    if (!canAdminAs(role) || !current || !player) throw new Error("Só um administrador pode excluir.")
    if (demo) {
      const updated = { ...current, players: current.players.filter((p) => p.key !== key) }
      dataRef.current = updated
      setData(updated)
      return
    }
    await deletePlayer(player)
    await reload()
  }, [demo, role, reload])

  const removePlayers = useCallback(async (keys: string[]) => {
    const current = dataRef.current
    if (!canAdminAs(role) || !current) throw new Error("Só um administrador pode excluir.")
    const wanted = new Set(keys)
    if (demo) {
      const updated = { ...current, players: current.players.filter((p) => !wanted.has(p.key)) }
      dataRef.current = updated
      setData(updated)
      return { removed: keys.length, failed: [] as string[], reason: null }
    }
    const failed: string[] = []
    let reason: string | null = null
    let removed = 0
    for (const player of current.players.filter((p) => wanted.has(p.key))) {
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
    const players = data?.players ?? []
    return {
      data,
      players,
      byKey: new Map(players.map((p) => [p.key, p])),
      percentile: buildPercentiles(players),
      loading,
      error,
      demo,
      role,
      canScout: canScoutAs(role),
      canAdmin: canAdminAs(role),
      reload,
      updateMeta,
      editPlayer,
      removePlayer,
      removePlayers,
    }
  }, [data, loading, error, demo, role, reload, updateMeta, editPlayer, removePlayer, removePlayers])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
