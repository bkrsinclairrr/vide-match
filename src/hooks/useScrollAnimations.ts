/**
 * Motor de animação de scroll do Zyron — GSAP ScrollTrigger + Lenis.
 *
 * Filosofia (alinhada ao DESIGN.md): o movimento é atmosférico, nunca decorativo.
 * Cada elemento entra com opacidade + deslocamento curto, o fundo respira em
 * parallax e os números contam. Sem bounce, sem rotação gratuita.
 *
 * Uso: marque o JSX com data-attributes e chame useScrollReveal(ref).
 *
 *   data-anim="up|fade|scale|left|right"   revela ao entrar na viewport
 *   data-anim-delay="0.15"                 atraso em segundos
 *   data-anim-group="0.09"                 escalona os filhos diretos
 *   data-parallax="40"                     deslocamento vertical no scroll
 *   data-count="345" data-count-suffix="+" contador numérico
 *   data-progress                          barra de progresso (scaleX)
 *   data-hero-item                         entrada imediata (sem scroll)
 *   data-track-wrapper / data-track        galeria horizontal fixada (>=1024px)
 *   data-header-scrolled                   recebe data-scrolled ao sair do topo
 */
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* ------------------------------------------------------------------ */
/* Lenis — scroll suave sincronizado com o ticker do GSAP              */
/* ------------------------------------------------------------------ */

export function useSmoothScroll(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false, // toque permanece nativo: teclado e inputs no mobile intactos
      autoRaf: false,
    })
    lenisRef.current = lenis

    const update = () => ScrollTrigger.update()
    lenis.on("scroll", update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off("scroll", update)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  /** Rola respeitando o Lenis, com fallback nativo. */
  const scrollTo = useCallback(
    (target: number | string | HTMLElement, options?: { offset?: number; duration?: number }) => {
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.1, ...options })
        return
      }
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: "smooth" })
        return
      }
      const el = typeof target === "string" ? document.querySelector(target) : target
      el?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    []
  )

  /** Congela o scroll enquanto um painel/overlay estiver aberto. */
  const setLocked = useCallback((locked: boolean) => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [])

  return { lenisRef, scrollTo, setLocked }
}

/* ------------------------------------------------------------------ */
/* Revelações declarativas por data-attribute                          */
/* ------------------------------------------------------------------ */

/**
 * Estado inicial de cada tipo de entrada. O estado final é sempre o natural
 * (y/x/scale zerados, opacidade cheia), então basta descrever "de onde vem".
 */
const ENTER: Record<string, gsap.TweenVars> = {
  up: { y: 34, autoAlpha: 0 },
  fade: { autoAlpha: 0 },
  scale: { scale: 0.94, autoAlpha: 0 },
  left: { x: -40, autoAlpha: 0 },
  right: { x: 40, autoAlpha: 0 },
}

const RESET: gsap.TweenVars = { y: 0, x: 0, scale: 1, autoAlpha: 1 }

/**
 * Dispara `run` uma única vez, quando o elemento entra na viewport.
 *
 * A tween criada dentro do callback é independente do ScrollTrigger de
 * propósito: tweens presas a um trigger são interrompidas pelos
 * ScrollTrigger.refresh() que rodam quando imagens e fontes terminam de
 * carregar, o que deixava elementos congelados no meio da animação.
 */
const onceInView = (trigger: HTMLElement, start: string, run: () => void) => {
  ScrollTrigger.create({ trigger, start, once: true, onEnter: run })
}

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseFloat(value ?? "")
  return Number.isFinite(parsed) ? parsed : fallback
}

export function useScrollReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return

    if (prefersReducedMotion()) {
      // Sem movimento: tudo já nasce visível, só garantimos medidas corretas.
      ScrollTrigger.refresh()
      return
    }

    const q = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector))
    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      /* Entrada imediata do herói ------------------------------------- */
      const heroItems = q("[data-hero-item]")
      if (heroItems.length) {
        gsap.set(heroItems, { y: 26, autoAlpha: 0 })
        gsap.to(heroItems, {
          ...RESET,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.05,
          clearProps: "transform,opacity,visibility",
        })
      }

      /* Revelações individuais ---------------------------------------- */
      q("[data-anim]").forEach((el) => {
        const vars = ENTER[el.dataset.anim || "up"] ?? ENTER.up
        gsap.set(el, vars)
        onceInView(el, "top 88%", () =>
          gsap.to(el, {
            ...RESET,
            duration: 0.85,
            ease: "power3.out",
            delay: num(el.dataset.animDelay, 0),
            clearProps: "transform,opacity,visibility",
          })
        )
      })

      /* Grupos escalonados -------------------------------------------- */
      q("[data-anim-group]").forEach((group) => {
        const children = Array.from(group.children) as HTMLElement[]
        if (!children.length) return
        gsap.set(children, { y: 30, autoAlpha: 0 })
        onceInView(group, "top 86%", () =>
          gsap.to(children, {
            ...RESET,
            duration: 0.8,
            ease: "power3.out",
            stagger: num(group.dataset.animGroup, 0.09),
            clearProps: "transform,opacity,visibility",
          })
        )
      })

      /* Parallax atmosférico ------------------------------------------ */
      q("[data-parallax]").forEach((el) => {
        const distance = num(el.dataset.parallax, 40)
        // Camadas fixas (brilhos de fundo) não "passam" pela viewport: elas
        // acompanham a página inteira. As demais usam a própria travessia.
        const pageWide = el.dataset.parallaxPage !== undefined
        gsap.fromTo(
          el,
          { y: -distance },
          {
            y: distance,
            ease: "none",
            scrollTrigger: pageWide
              ? {
                  trigger: document.documentElement,
                  start: "top top",
                  end: "bottom bottom",
                  scrub: true,
                  invalidateOnRefresh: true,
                }
              : {
                  trigger: el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
          }
        )
      })

      /* Contadores ----------------------------------------------------- */
      q("[data-count]").forEach((el) => {
        const end = num(el.dataset.count, 0)
        const decimals = num(el.dataset.countDecimals, 0)
        const prefix = el.dataset.countPrefix ?? ""
        const suffix = el.dataset.countSuffix ?? ""
        const format = (v: number) =>
          prefix +
          (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("pt-BR")) +
          suffix

        const counter = { value: 0 }
        el.textContent = format(0)
        onceInView(el, "top 90%", () =>
          gsap.to(counter, {
            value: end,
            duration: 1.7,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = format(counter.value)
            },
          })
        )
      })

      /* Barra de progresso de leitura ---------------------------------- */
      q("[data-progress]").forEach((bar) => {
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.3,
              invalidateOnRefresh: true,
            },
          }
        )
      })

      /* Header compacta ao descolar do topo ---------------------------- */
      q("[data-header-scrolled]").forEach((header) => {
        ScrollTrigger.create({
          start: "top -8",
          end: 99999,
          onToggle: (self) => header.setAttribute("data-scrolled", String(self.isActive)),
        })
      })

      /* Galeria horizontal fixada (apenas desktop) --------------------- */
      mm.add("(min-width: 1024px)", () => {
        q("[data-track-wrapper]").forEach((wrapper) => {
          const track = wrapper.querySelector<HTMLElement>("[data-track]")
          if (!track) return
          const distance = () => Math.max(0, track.scrollWidth - wrapper.clientWidth)
          if (distance() <= 0) return

          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "center center",
              end: () => "+=" + distance(),
              pin: true,
              pinSpacing: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          const bar = wrapper.querySelector<HTMLElement>("[data-track-progress]")
          if (bar) {
            gsap.fromTo(
              bar,
              { scaleX: 0.04 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: wrapper,
                  start: "center center",
                  end: () => "+=" + distance(),
                  scrub: 0.4,
                  invalidateOnRefresh: true,
                },
              }
            )
          }
        })
      })
    }, root)

    // Imagens e fontes alteram a altura da página: remede depois que assentam.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    const timer = window.setTimeout(refresh, 450)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(refresh).catch(() => undefined)

    return () => {
      window.removeEventListener("load", refresh)
      window.clearTimeout(timer)
      mm.revert()
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ------------------------------------------------------------------ */
/* Transição entre etapas (onboarding)                                 */
/* ------------------------------------------------------------------ */

/** Anima a troca de conteúdo de um card sempre que `key` muda. */
export function useStepTransition(scope: RefObject<HTMLElement | null>, key: unknown) {
  const first = useRef(true)

  useLayoutEffect(() => {
    const root = scope.current
    if (!root || prefersReducedMotion()) return

    const children = Array.from(root.children) as HTMLElement[]
    const targets = children.length ? children : [root]
    const isFirst = first.current

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: isFirst ? 18 : 26,
        autoAlpha: 0,
        duration: isFirst ? 0.6 : 0.5,
        ease: "power3.out",
        stagger: 0.055,
        clearProps: "transform,opacity,visibility",
      })
    }, root)

    first.current = false
    return () => ctx.revert()
  }, [key, scope])
}
