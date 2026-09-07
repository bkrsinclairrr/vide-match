import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Settings, FileText, ShieldCheck, X, HelpCircle } from "lucide-react"

/**
 * Acesso aos termos e à política de privacidade no canto superior direito,
 * no mesmo padrão do painel de configurações do dashboard.
 *
 * Fica em todas as telas do funil de propósito: o funil é público, coleta
 * dados pessoais (inclusive de menores) e pede concordância antes do
 * cadastro — então o texto precisa estar a um toque de distância em
 * qualquer etapa, não só no rodapé.
 */
export default function FunnelLegalMenu({ tone = "token" }: { tone?: "token" | "white" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // As telas do funil usam duas bases: tokens do tema (home) e branco
  // sobre #0D0D0F (formulário, conta e resultado).
  const isWhite = tone === "white"
  const trigger = isWhite
    ? "border-white/15 bg-white/[0.06] hover:bg-white/10 hover:border-white/30 text-white/75"
    : "border-foreground/12 bg-foreground/6 hover:bg-foreground/10 hover:border-amber-400/40 text-foreground/75"
  const panel = isWhite
    ? "border-white/12 bg-[#141418] text-white"
    : "border-foreground/12 bg-popover text-foreground"
  const item = isWhite
    ? "text-white/80 hover:text-white hover:bg-white/8"
    : "text-foreground/80 hover:text-foreground hover:bg-foreground/8"
  const label = isWhite ? "text-white/55" : "text-foreground/55"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Termos e privacidade"
        aria-label="Termos e privacidade"
        aria-expanded={open}
        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${trigger}`}
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-fade-in ${panel}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
              <span className="text-sm font-semibold">Informações</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className={label}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2">
              <p className={`text-[10px] uppercase tracking-widest font-semibold px-3 pt-2 pb-1 ${label}`}>Legal</p>

              <Link
                to="/termos"
                onClick={() => setOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item}`}
              >
                <FileText className="w-4 h-4" /> Termos de Uso
              </Link>

              <Link
                to="/privacidade"
                onClick={() => setOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item}`}
              >
                <ShieldCheck className="w-4 h-4" /> Política de Privacidade
              </Link>

              <p className={`text-[10px] uppercase tracking-widest font-semibold px-3 pt-4 pb-1 ${label}`}>Suporte</p>

              <a
                href="https://wa.me/5561999767417"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item}`}
              >
                <HelpCircle className="w-4 h-4" /> Falar com a equipe
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
