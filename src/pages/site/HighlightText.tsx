import { Fragment, useEffect, useMemo, useRef } from "react"
import { prefersReducedMotion } from "@/hooks/useScrollAnimations"

type Segment = { text: string; accent?: boolean }

/**
 * Parágrafo que "acende" palavra por palavra conforme o scroll — a
 * palavra atual entra pela metade e as seguintes ficam a 15%. Trechos
 * marcados como `accent` ganham o dourado quando acendem.
 */
export default function HighlightText({ segments }: { segments: Segment[] }) {
  const ref = useRef<HTMLParagraphElement>(null)

  const words = useMemo(
    () => segments.flatMap((s) => s.text.split(/\s+/).filter(Boolean).map((word) => ({ word, accent: !!s.accent }))),
    [segments],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-word]"))

    if (prefersReducedMotion()) {
      spans.forEach((span) => span.classList.add("is-lit"))
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const viewport = window.innerHeight
      const start = viewport * 0.75
      const end = viewport * 0.3
      const center = rect.top + rect.height / 2
      const progress = Math.max(0, Math.min(1, (start - center) / (start - end)))
      const lit = progress * spans.length
      const current = Math.floor(lit)

      spans.forEach((span, i) => {
        const opacity = i < current ? 1 : i === current ? 0.5 + 0.5 * (lit - i) : 0.15
        span.style.opacity = String(opacity)
        span.classList.toggle("is-lit", opacity > 0.6)
      })
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [words])

  return (
    <p ref={ref} className="zs-why-text">
      {words.map(({ word, accent }, i) => (
        <Fragment key={i}>
          <span data-word className={accent ? "zs-why-word zs-why-word--accent" : "zs-why-word"}>{word}</span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </p>
  )
}
