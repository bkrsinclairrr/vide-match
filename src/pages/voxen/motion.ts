import { useEffect, useState, type RefObject } from "react"
import { prefersReducedMotion } from "@/lib/reducedMotion"

/*
 * Movimento da VOXEN: brilho que segue o cursor nos cartões, cartões que
 * entram ao rolar e gráficos que só animam quando aparecem na tela. Tudo
 * respeita "reduzir movimento" e a impressão da ficha (nada fica escondido).
 */

const GLOW_TARGETS = ".vx-card, .vx-pcard, .vx-stat, [data-glow]"

/** Liga `true` quando o elemento entra na tela (uma vez só). Na impressão, liga tudo. */
export function useInView(ref: RefObject<Element>, rootMargin = "0px 0px -8% 0px") {
  const [on, setOn] = useState(() => typeof IntersectionObserver === "undefined" || prefersReducedMotion())

  useEffect(() => {
    if (on) return
    const el = ref.current
    if (!el) {
      setOn(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setOn(true)
    }, { rootMargin })
    io.observe(el)
    const print = () => setOn(true)
    window.addEventListener("beforeprint", print)
    return () => {
      io.disconnect()
      window.removeEventListener("beforeprint", print)
    }
  }, [on, ref, rootMargin])

  return on
}

/**
 * Brilho dourado que acompanha o ponteiro dentro de cartões (CSS lê `--mx`/`--my`)
 * e inclinação leve nos cartões de atleta (`--rx`/`--ry`). Um só ouvinte no topo.
 */
export function usePointerGlow(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const host = root.current
    if (!host || prefersReducedMotion()) return
    let frame = 0
    let last: PointerEvent | null = null

    const paint = () => {
      frame = 0
      const e = last
      if (!e) return
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(GLOW_TARGETS)
      if (!card) return
      const r = card.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      card.style.setProperty("--mx", `${x}px`)
      card.style.setProperty("--my", `${y}px`)
      if (card.classList.contains("vx-pcard")) {
        card.style.setProperty("--ry", `${((x / r.width) - 0.5) * 10}deg`)
        card.style.setProperty("--rx", `${(0.5 - y / r.height) * 10}deg`)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      last = e
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const onLeave = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".vx-pcard")
      if (card && !card.contains(e.relatedTarget as Node | null)) {
        card.style.removeProperty("--rx")
        card.style.removeProperty("--ry")
      }
    }

    host.addEventListener("pointermove", onMove, { passive: true })
    host.addEventListener("pointerout", onLeave, { passive: true })
    return () => {
      host.removeEventListener("pointermove", onMove)
      host.removeEventListener("pointerout", onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [root])
}

/**
 * Cartões que estão abaixo da dobra entram ao rolar (os que já aparecem ficam
 * com a entrada normal da página). Observa o conteúdo novo que chega depois
 * (rotas preguiçosas, dados carregando). Cartões vizinhos entram em cascata.
 */
export function useScrollReveal(container: RefObject<HTMLElement>, selector = ".vx-card, .vx-pcard") {
  useEffect(() => {
    const host = container.current
    if (!host || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return

    const io = new IntersectionObserver((entries) => {
      const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
      shown.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      shown.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`
        el.classList.add("is-in")
        io.unobserve(el)
        // Depois de entrar, o atraso não deve pesar no hover.
        window.setTimeout(() => { el.style.transitionDelay = "" }, 900 + i * 70)
      })
    }, { rootMargin: "0px 0px -6% 0px" })

    const scan = () => {
      const fold = window.innerHeight
      host.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (el.dataset.rv) return
        el.dataset.rv = "1"
        if (el.parentElement?.closest(".vx-rv")) return
        const r = el.getBoundingClientRect()
        if (!r.height || r.top < fold * 0.92) return
        el.classList.add("vx-rv")
        io.observe(el)
      })
    }

    let queued = 0
    const mo = new MutationObserver(() => {
      if (!queued) queued = requestAnimationFrame(() => { queued = 0; scan() })
    })
    scan()
    mo.observe(host, { childList: true, subtree: true })

    const reveal = () => host.querySelectorAll(".vx-rv").forEach((el) => el.classList.add("is-in"))
    window.addEventListener("beforeprint", reveal)
    return () => {
      mo.disconnect()
      io.disconnect()
      if (queued) cancelAnimationFrame(queued)
      window.removeEventListener("beforeprint", reveal)
    }
  }, [container, selector])
}

/** Fica `true` depois que a página rola alguns pixels (sombra da barra do topo). */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])
  return scrolled
}
