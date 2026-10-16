import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Game } from "./game"

/*
 * O que há de novo na jornada. O aparelho guarda o que a pessoa já viu concluído (por conta);
 * o que aparecer concluído depois disso (perfil preenchido em outra aba, foto nova, jogo
 * analisado, ficha marcada pela equipe) vira o aviso de "missão cumprida" (components/Celebrate)
 * e destrava, com animação, as telas que acabaram de abrir. Na primeira visita não há o que comemorar.
 */

type Seen = { keys: string[]; xp: number; level: number }
export type News = { keys: string[]; xpGained: number; levelUp: boolean }

function readSeen(key: string): Seen | null {
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : null
    return v && Array.isArray(v.keys) ? { keys: v.keys.map(String), xp: Number(v.xp) || 0, level: Number(v.level) || 1 } : null
  } catch {
    return null
  }
}

function writeSeen(key: string, seen: Seen) {
  try {
    localStorage.setItem(key, JSON.stringify(seen))
  } catch {
    /* sem armazenamento: só não comemora da próxima vez */
  }
}

/** `key`: onde guardar (null = não guardar, como no "ver como" da equipe). */
export function useJourneyNews(key: string | null, game: Game | null) {
  const [base, setBase] = useState<{ key: string; seen: Seen | null } | null>(null)
  // Lida na hora (não num efeito) para as telas já nascerem sabendo o que é novo.
  const current = key ? (base?.key === key ? base : { key, seen: readSeen(key) }) : null
  const snap = useMemo<Seen | null>(() => (game ? { keys: game.missions.filter((m) => m.done).map((m) => m.key), xp: game.xp, level: game.level } : null), [game])
  const currentKey = current?.key ?? null
  const firstVisit = Boolean(current && !current.seen)

  useEffect(() => {
    if (!currentKey || !snap) return
    if (firstVisit) {
      writeSeen(currentKey, snap)
      setBase({ key: currentKey, seen: snap })
    } else if (base?.key !== currentKey) {
      setBase({ key: currentKey, seen: readSeen(currentKey) })
    }
  }, [currentKey, firstVisit, snap, base?.key])

  const seen = current?.seen ?? null
  const added = seen && snap ? snap.keys.filter((k) => !seen.keys.includes(k)).join(",") : ""
  const news = useMemo<News | null>(() => (added && seen && snap
    ? { keys: added.split(","), xpGained: Math.max(0, snap.xp - seen.xp), levelUp: snap.level > seen.level }
    : null), [added, seen, snap])

  // Tudo o que abriu nesta sessão: o selo "Novo" do menu continua depois de fechar o aviso.
  const [session, setSession] = useState<ReadonlySet<string>>(() => new Set())
  const fresh = useMemo<ReadonlySet<string>>(() => (added ? new Set([...session, ...added.split(",")]) : session), [session, added])

  const dismiss = useCallback(() => {
    if (!currentKey || !snap) return
    writeSeen(currentKey, snap)
    setSession(fresh)
    setBase({ key: currentKey, seen: snap })
  }, [currentKey, snap, fresh])

  return { current: news, fresh, dismiss }
}

/** Animações de "acabou de abrir": tocam uma vez por tela (`surface`) e por sessão. */
const played = new Set<string>()

export function useJustUnlocked(fresh: ReadonlySet<string>, key: string, surface: string) {
  const decided = useRef<boolean | null>(null)
  if (decided.current === null) {
    const id = `${key}:${surface}`
    decided.current = fresh.has(key) && !played.has(id)
    if (decided.current) played.add(id)
  }
  return decided.current
}
