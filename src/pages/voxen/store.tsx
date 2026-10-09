import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  buildDemoData, buildPercentiles, loadVoxenData, saveMeta,
  type Percentiles, type Player, type PlayerMeta, type VoxenData,
} from "./data"

type VoxenStore = {
  data: VoxenData | null
  players: Player[]
  byKey: Map<string, Player>
  percentile: Percentiles
  loading: boolean
  error: string | null
  demo: boolean
  reload: () => Promise<void>
  updateMeta: (key: string, patch: Partial<PlayerMeta>) => Promise<void>
}

const Ctx = createContext<VoxenStore | null>(null)

export function useVoxen() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useVoxen fora do VoxenProvider")
  return ctx
}

export function VoxenProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
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
      // import.meta.env.DEV: no build de produção a demonstração some do bundle.
      const loaded = import.meta.env.DEV && demo ? buildDemoData() : await loadVoxenData()
      dataRef.current = loaded
      setData(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os atletas.")
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
  }, [demo, toast])

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
      reload,
      updateMeta,
    }
  }, [data, loading, error, demo, reload, updateMeta])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
