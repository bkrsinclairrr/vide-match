import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react"

/** Peças do painel de administração: gaveta lateral, confirmação de exclusão, barra de seleção e paginação. */

/** Elemento `.vx` mais próximo: a gaveta vai para lá para herdar as cores da VOXEN e ficar acima do menu. */
function useVxHost() {
  const marker = useRef<HTMLSpanElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => { setHost(marker.current?.closest<HTMLElement>(".vx") ?? null) }, [])
  return { marker, host }
}

export function Drawer({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const { marker, host } = useVxHost()
  const panel = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)

  const close = () => {
    setClosing(true)
    window.setTimeout(() => { setClosing(false); onClose() }, 220)
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const opener = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      opener?.focus?.()
    }
    // `close` só depende do onClose atual, que muda a cada render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <span ref={marker} hidden />
      {open && host && createPortal(
        <div className={`cn-drawer ${closing ? "is-closing" : ""}`} role="presentation">
          <div className="cn-drawer-scrim" onClick={close} />
          <div ref={panel} className="cn-drawer-panel" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Detalhes"} tabIndex={-1}>
            <header className="cn-drawer-head">
              <div className="min-w-0">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
              <button type="button" className="vx-icon-btn" onClick={close} aria-label="Fechar"><X /></button>
            </header>
            <div className="cn-drawer-body">{children}</div>
            {footer && <footer className="cn-drawer-foot">{footer}</footer>}
          </div>
        </div>,
        host,
      )}
    </>
  )
}

/**
 * Confirmação de exclusão. Com `typed`, a pessoa precisa escrever EXCLUIR: usado
 * quando são vários registros de uma vez, para ninguém apagar tudo sem querer.
 */
export function DangerConfirm({
  title, children, confirmLabel = "Excluir de vez", typed = false, busy, onConfirm, onCancel,
}: {
  title: ReactNode
  children?: ReactNode
  confirmLabel?: string
  typed?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [text, setText] = useState("")
  const ok = !typed || text.trim().toUpperCase() === "EXCLUIR"
  return (
    <div className="cn-danger" role="alertdialog" aria-label="Confirmar exclusão">
      <span className="cn-danger-icon"><AlertTriangle /></span>
      <div className="cn-danger-body">
        <b>{title}</b>
        {children && <p>{children}</p>}
        {typed && (
          <label className="cn-danger-type">
            Para confirmar, escreva <strong>EXCLUIR</strong>
            <input className="vx-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="EXCLUIR" autoFocus autoComplete="off" spellCheck={false} />
          </label>
        )}
      </div>
      <div className="cn-danger-actions">
        <button type="button" className="vx-btn" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="vx-btn cn-btn-danger" onClick={onConfirm} disabled={!ok || busy}>
          {busy ? <><Loader2 className="cn-spin" /> Excluindo...</> : <><Trash2 /> {confirmLabel}</>}
        </button>
      </div>
    </div>
  )
}

/** Barra fixa de ações em massa, no rodapé, enquanto há registros marcados. */
export function BulkBar({
  count, noun, onClear, children, confirm,
}: { count: number; noun: string; onClear: () => void; children: ReactNode; confirm?: ReactNode }) {
  if (confirm) return <div className="cn-bulk is-confirm" role="region" aria-label="Confirmar exclusão">{confirm}</div>
  return (
    <div className="cn-bulk" role="region" aria-label="Ações para os selecionados">
      <span className="cn-bulk-count"><strong className="tnum">{count}</strong> {noun}{count === 1 ? "" : "s"} selecionado{count === 1 ? "" : "s"}</span>
      <div className="cn-bulk-actions">{children}</div>
      <button type="button" className="vx-icon-btn" onClick={onClear} aria-label="Limpar a seleção" title="Limpar a seleção"><X /></button>
    </div>
  )
}

export function Pager({ page, pages, total, size, onPage }: { page: number; pages: number; total: number; size: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  return (
    <div className="cn-pager">
      <span><strong className="tnum">{from}–{to}</strong> de <span className="tnum">{total}</span></span>
      <div>
        <button type="button" className="vx-icon-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior"><ChevronLeft /></button>
        <span className="tnum">{page} / {pages}</span>
        <button type="button" className="vx-icon-btn" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Próxima página"><ChevronRight /></button>
      </div>
    </div>
  )
}

/** Caixa de marcar das tabelas (inclui o estado "alguns" do cabeçalho). */
export function Check({ on, partial, label, onChange }: { on: boolean; partial?: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? "mixed" : on}
      aria-label={label}
      className={`vx-check ${on || partial ? "is-on" : ""}`}
      onClick={(e) => { e.stopPropagation(); onChange() }}
    >
      {partial && !on ? <span className="cn-check-dash" /> : on ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg> : null}
    </button>
  )
}
