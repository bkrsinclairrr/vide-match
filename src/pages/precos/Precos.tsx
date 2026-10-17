import "@fontsource-variable/inter"
import {
  useCallback, useEffect, useRef, useState,
  type CSSProperties, type MouseEvent, type PointerEvent, type RefObject,
} from "react"
import {
  Check, Copy, Crown, ExternalLink, Gem, Link2, MessageSquareText, QrCode, Radar, Rocket, ScanSearch, Search, X,
  type LucideIcon,
} from "lucide-react"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { prefersReducedMotion } from "@/lib/reducedMotion"
import { ZyronLogo, ZyronMark } from "@/pages/site/ZyronMark"
import {
  PIX_SIGNAL_CONTACTS, PRICES_UPDATED_AT, PRODUCT_LINES,
  formatCents, formatPrice, formatReais, productMessage, shortUrl, whatsappShareUrl,
  type Product, type ProductIcon, type ProductTone,
} from "./data"
import "./precos.css"

/**
 * Tabela de preços dos closers (/precos). Página interna, aberta pelo link na
 * descrição do grupo de WhatsApp da equipe: cada produto tem o link de
 * pagamento da Sinnu pronto para copiar, a mensagem pronta (nome, valor e
 * link) e o atalho para mandar direto pelo WhatsApp. Preços e links ficam em
 * data.ts. Fica fora dos buscadores (meta robots + robots.txt).
 */

const ICONS: Record<ProductIcon, LucideIcon> = {
  crown: Crown,
  gem: Gem,
  rocket: Rocket,
  radar: Radar,
  scan: ScanSearch,
  search: Search,
}

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties

/** "David, Alex ou Cleiton". */
const joinWithOr = (names: string[]) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ou ${names[names.length - 1]}`

/**
 * Copia texto para a área de transferência. O plano B (textarea +
 * execCommand) cobre navegadores embutidos antigos, como o de alguns apps.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permissão negada ou API indisponível: tenta o plano B abaixo.
  }
  try {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.top = "0"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  } catch {
    return false
  }
}

/** Título da aba, fora dos buscadores e sem rolagem lateral (sem quebrar o cabeçalho fixo). */
function usePricesDocument() {
  useEffect(() => {
    const root = document.documentElement
    const prev = document.title
    document.title = "Preços · Zyron"
    root.classList.add("zp-root")
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex, nofollow"
    document.head.appendChild(meta)
    return () => {
      document.title = prev
      root.classList.remove("zp-root")
      meta.remove()
    }
  }, [])
}

/** Vira true (uma vez só) quando o elemento entra na tela. */
function useInView(ref: RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        io.disconnect()
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

/** Revela os blocos marcados com data-reveal conforme aparecem. */
function useRevealAll(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [])
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("is-in")
        io.unobserve(entry.target)
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [root])
}

/** Conta de 0 até o valor quando `active` liga. Sem movimento, mostra o valor direto. */
function useCountUp(target: number, active: boolean, delayMs: number) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    const duration = 1150
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 4))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => { raf = requestAnimationFrame(tick) }, delayMs)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [active, target, delayMs])
  return value
}

type Notify = (title: string, detail: string, ok?: boolean) => void

type CopyKind = "link" | "message"

function ProductCard({ product: p, tone, index, notify }: {
  product: Product
  tone: ProductTone
  index: number
  notify: Notify
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const reais = useCountUp(Math.floor(p.cents / 100), inView, 260 + index * 120)
  const [copied, setCopied] = useState<CopyKind | null>(null)
  const resetTimer = useRef(0)
  const Icon = ICONS[p.icon]
  const message = productMessage(p)
  const urlPath = shortUrl(p.url)
  const slash = urlPath.indexOf("/")

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const copy = async (kind: CopyKind) => {
    const ok = await copyText(kind === "link" ? p.url : message)
    if (!ok) {
      notify("Não deu para copiar", "Segure o link no card para copiar à mão.", false)
      return
    }
    navigator.vibrate?.(12)
    notify(kind === "link" ? "Link copiado" : "Mensagem copiada", p.label)
    setCopied(kind)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied(null), 1800)
  }

  // Luz que segue o mouse pelo card (só com mouse; no toque não há o que seguir).
  const followPointer = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`)
  }

  const linkCopied = copied === "link"
  const messageCopied = copied === "message"

  return (
    <article
      ref={ref}
      className={`zp-card${p.featured ? " zp-card--featured" : ""}${inView ? " is-in" : ""}`}
      data-tone={tone}
      style={cssVars({ "--i": index })}
      onPointerMove={followPointer}
    >
      <span className="zp-card-spot" aria-hidden="true" />
      {p.featured && <span className="zp-card-ring" aria-hidden="true" />}

      <div className="zp-card-body">
        <div className="zp-card-info">
          <div className="zp-card-head">
            <span className="zp-card-icon" aria-hidden="true"><Icon /></span>
            {p.featured && <span className="zp-badge">Maior ticket</span>}
          </div>

          <h3 className="zp-card-title">
            {p.name}
            {p.tier && <> <span className="zp-tier">{p.tier}</span></>}
          </h3>

          <p className="zp-price">
            <span className="zp-sr">{formatPrice(p.cents)}</span>
            <span className="zp-price-cur" aria-hidden="true">R$</span>
            <span className="zp-price-int" aria-hidden="true">{formatReais(reais)}</span>
            <span className="zp-price-cents" aria-hidden="true">{formatCents(p.cents)}</span>
          </p>
        </div>

        <div className="zp-card-actions">
          <div className="zp-link" title={p.url}>
            <Link2 aria-hidden="true" />
            <span className="zp-link-text">
              {urlPath.slice(0, slash + 1)}
              <span className="zp-link-code">{urlPath.slice(slash + 1)}</span>
            </span>
          </div>

          <button
            type="button"
            className="zp-btn zp-btn--primary"
            data-copied={linkCopied}
            onClick={() => copy("link")}
            aria-label={`Copiar link de pagamento: ${p.label}`}
          >
            <span className="zp-btn-sheen" aria-hidden="true" />
            <span className="zp-btn-icon" key={linkCopied ? "ok" : "copy"} aria-hidden="true">
              {linkCopied ? <Check strokeWidth={3} /> : <Copy />}
            </span>
            <span className="zp-btn-label" key={linkCopied ? "ok-label" : "label"}>
              {linkCopied ? "Link copiado!" : "Copiar link de pagamento"}
            </span>
          </button>

          <div className="zp-mini">
            <button
              type="button"
              className="zp-mini-btn"
              data-copied={messageCopied}
              onClick={() => copy("message")}
              aria-label={`Copiar mensagem pronta: ${p.label}`}
              title="Copia a mensagem de boas-vindas com nome, valor e link, já formatada para o WhatsApp"
            >
              {messageCopied
                ? <Check key="ok" strokeWidth={3} aria-hidden="true" />
                : <MessageSquareText key="msg" aria-hidden="true" />}
              <span>{messageCopied ? "Copiada!" : "Mensagem"}</span>
            </button>
            <a
              className="zp-mini-btn zp-mini-btn--wa"
              href={whatsappShareUrl(message)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enviar pelo WhatsApp: ${p.label}`}
              title="Abre o WhatsApp com a mensagem pronta para você escolher o contato"
            >
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
            <a
              className="zp-mini-btn"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir checkout: ${p.label}`}
              title="Abre a página de pagamento para conferir"
            >
              <ExternalLink aria-hidden="true" />
              <span>Abrir</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

type ToastState = { id: number; title: string; detail: string; ok: boolean; leaving: boolean }

function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <div className="zp-toast-wrap" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="zp-toast" data-ok={toast.ok} data-leaving={toast.leaving}>
          <span className="zp-toast-icon" aria-hidden="true">
            {toast.ok ? <Check strokeWidth={3} /> : <X strokeWidth={3} />}
          </span>
          <span className="zp-toast-text">
            <strong>{toast.title}</strong>
            <small>{toast.detail}</small>
          </span>
        </div>
      )}
    </div>
  )
}

export default function Precos() {
  usePricesDocument()
  const rootRef = useRef<HTMLDivElement>(null)
  useRevealAll(rootRef)

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const [toast, setToast] = useState<ToastState | null>(null)
  const notify = useCallback<Notify>((title, detail, ok = true) => {
    setToast({ id: Date.now(), title, detail, ok, leaving: false })
  }, [])

  // Cada aviso fica 2,2s na tela e sai com animação; um aviso novo substitui o anterior.
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(
      () => setToast((cur) => {
        if (!cur || cur.id !== toast.id) return cur
        return cur.leaving ? null : { ...cur, leaving: true }
      }),
      toast.leaving ? 260 : 2200,
    )
    return () => window.clearTimeout(timer)
  }, [toast])

  const jump = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(e.currentTarget.hash.slice(1))
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })
  }

  return (
    <div className="zp" ref={rootRef}>
      <div className="zp-ambient" aria-hidden="true">
        <div className="zp-grid-bg" />
        <div className="zp-orb zp-orb--1" />
        <div className="zp-orb zp-orb--2" />
        <div className="zp-orb zp-orb--3" />
      </div>

      <header className="zp-top" data-scrolled={scrolled}>
        <div className="zp-container zp-top-inner">
          <ZyronLogo size={30} />
          <span className="zp-top-pill">
            <span className="zp-live-dot" aria-hidden="true" />
            Área dos closers
          </span>
        </div>
      </header>

      <main className="zp-main">
        <section className="zp-container zp-hero">
          <span className="zp-label zp-enter" style={cssVars({ "--d": 0 })}>
            <span className="zp-label-dot" aria-hidden="true" />
            Tabela oficial · uso interno
          </span>
          <h1 className="zp-title zp-enter" style={cssVars({ "--d": 1 })}>
            Preços e <span className="zp-grad">links de pagamento</span>
          </h1>
          <p className="zp-sub zp-enter" style={cssVars({ "--d": 2 })}>
            Copie o link ou a mensagem pronta e cole direto na conversa com o cliente.
          </p>

          <nav className="zp-jump zp-enter" style={cssVars({ "--d": 3 })} aria-label="Ir para">
            {PRODUCT_LINES.map((line) => (
              <a key={line.id} href={`#${line.id}`} onClick={jump} data-tone={line.tone}>
                <span className="zp-jump-dot" aria-hidden="true" />
                {line.title}
                <span className="zp-jump-count">{line.products.length}</span>
              </a>
            ))}
            <a href="#sinal" onClick={jump}>
              <QrCode aria-hidden="true" />
              Sinal via PIX
            </a>
          </nav>

          <ul className="zp-legend zp-enter" style={cssVars({ "--d": 4 })}>
            <li><Copy aria-hidden="true" /><span><b>Link</b> só o endereço de pagamento</span></li>
            <li><MessageSquareText aria-hidden="true" /><span><b>Mensagem</b> boas-vindas, valor e link</span></li>
            <li><WhatsAppIcon /><span><b>WhatsApp</b> você escolhe o contato</span></li>
          </ul>
        </section>

        {PRODUCT_LINES.map((line, lineIndex) => (
          <section key={line.id} id={line.id} className="zp-container zp-section" data-tone={line.tone}>
            <div className="zp-sec-head" data-reveal>
              <span className="zp-sec-index">{String(lineIndex + 1).padStart(2, "0")}</span>
              <h2>{line.title}</h2>
              <span className="zp-sec-rule" aria-hidden="true" />
              <span className="zp-sec-count">
                {line.products.length} {line.products.length === 1 ? "opção" : "opções"}
              </span>
            </div>
            <div className={`zp-grid zp-grid--${line.products.length}`}>
              {line.products.map((product, index) => (
                <ProductCard key={product.id} product={product} tone={line.tone} index={index} notify={notify} />
              ))}
            </div>
          </section>
        ))}

        <section id="sinal" className="zp-container zp-section">
          <div className="zp-sinal" data-reveal>
            <span className="zp-sinal-icon" aria-hidden="true"><QrCode /></span>
            <div className="zp-sinal-body">
              <span className="zp-eyebrow">Sinais e entradas</span>
              <h2>Sinal via PIX</h2>
              <p>
                Para os sinais, peça para <strong>{joinWithOr(PIX_SIGNAL_CONTACTS)}</strong> gerarem
                o link de cobrança PIX na Sinnu.
              </p>
            </div>
            <ul className="zp-people">
              {PIX_SIGNAL_CONTACTS.map((name, i) => (
                <li key={name} className="zp-person" style={cssVars({ "--i": i })}>
                  <span className="zp-avatar" aria-hidden="true">{name[0]}</span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="zp-container zp-updated">Preços vigentes · atualizado em {PRICES_UPDATED_AT}</p>
      </main>

      <footer className="zp-footer">
        <ZyronMark size={20} />
        <span>Uso interno da equipe comercial. Ao cliente, envie só o link do produto.</span>
      </footer>

      <Toast toast={toast} />
    </div>
  )
}
