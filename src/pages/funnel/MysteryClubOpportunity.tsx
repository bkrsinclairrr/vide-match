import { HelpCircle, Lock, Shield } from "lucide-react"
import type { PlayerData } from "@/lib/funnel"

/** Mesma prévia nos dois pontos da página, sem criar um algoritmo de match. */
export default function MysteryClubOpportunity({ player, compact = false }: {
  player: PlayerData
  compact?: boolean
}) {
  return (
    <div data-club-opportunity={compact ? "summary" : "full"}
      className={`w-full rounded-2xl border border-border bg-muted/40 text-left ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15" role="img" aria-label="Clube misterioso: escudo verde e dourado com interrogação">
          <Shield className="h-14 w-14 fill-primary/25 text-primary" strokeWidth={1.5} />
          <HelpCircle className="absolute h-6 w-6 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Oportunidades</p>
          <h3 className="font-bold text-foreground">{compact ? 'Oportunidade de clube identificada' : 'Time em potencial encontrado'}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3 shrink-0" />Clube misterioso · detalhes reservados</p>
        </div>
      </div>
      {!compact && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Posição procurada', value: player.position },
            { label: 'Categoria compatível', value: player.category },
            { label: 'Perfil de origem', value: player.nationality },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <div className="funnel-censored flex items-center justify-between gap-2 rounded-md" aria-label={`${item.label}: informação reservada`}>
                <span aria-hidden="true" className="select-none blur-[7px] text-sm font-semibold">{item.value || 'Perfil em avaliação'}</span>
                <Lock className="h-3.5 w-3.5 shrink-0 text-accent" />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {compact
          ? 'Uma possibilidade de encaixe com suas características. Conheça os detalhes com a equipe pelo WhatsApp.'
          : 'A indicação considera as características do seu perfil. A equipe confirma os detalhes e a disponibilidade; não representa convite ou vaga garantida.'}
      </p>
    </div>
  )
}
