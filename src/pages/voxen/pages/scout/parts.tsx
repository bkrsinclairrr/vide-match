import { Database } from "lucide-react"
import { SCOUT_MIGRATIONS, ScoutSetupMissingError } from "./api"

/** Aviso quando a camada do Scout ainda não existe no banco (as migrações não foram aplicadas). */
export function ScoutSetupNotice({ error, compact = false }: { error: Error; compact?: boolean }) {
  if (!(error instanceof ScoutSetupMissingError)) {
    return <div className="vx-card"><p className="text-[13px] text-red-300">{error.message}</p></div>
  }
  return (
    <section className={`vx-card ${compact ? "" : "mb-[18px]"}`}>
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="vx-empty-icon shrink-0"><Database className="h-6 w-6" /></span>
        <div>
          <h2 className="text-[17px] font-bold">Falta ativar a camada do Scout no banco de dados</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-400">
            Oportunidades, travas, foto de corpo inteiro, envios de vídeo e o contexto do CRM dependem de três migrações,
            aplicadas nesta ordem. Nada que já existe é alterado.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12.5px] text-zinc-400">
            {SCOUT_MIGRATIONS.map((m) => <li key={m}><code className="text-amber-200">{m}</code></li>)}
          </ol>
        </div>
      </div>
    </section>
  )
}
