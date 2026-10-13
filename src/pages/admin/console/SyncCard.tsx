import { useCallback, useEffect, useState } from "react"
import { Copy, Database, Loader2, RefreshCw, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVoxen } from "@/pages/voxen/store"
import {
  SYNC_MIGRATION, SyncMissingError, getSyncStatus, runSync, summarizeSync, type SyncStatus,
} from "./sync"

/** Estado da sincronização automática de membros e o botão "Sincronizar agora". */
export function SyncCard({ onChanged }: { onChanged: () => void }) {
  const { demo, canEdit } = useVoxen()
  const { toast } = useToast()
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState<{ texto: string; qtd: number }[] | null>(null)

  const load = useCallback(async () => {
    try {
      setStatus(await getSyncStatus(demo))
      setMissing(false)
      setError(null)
    } catch (e) {
      if (e instanceof SyncMissingError) setMissing(true)
      else setError(e instanceof Error ? e.message : String(e))
    }
  }, [demo])

  useEffect(() => { void load() }, [load])

  const sync = async (includeExcluded = false) => {
    setBusy(true)
    try {
      const s = summarizeSync(await runSync(demo, includeExcluded))
      setDetail(s.detalhes)
      toast({
        title: s.criados || s.atualizados ? "Sincronizado" : "Tudo já estava em dia",
        description: `${s.criados} membro${s.criados === 1 ? "" : "s"} criado${s.criados === 1 ? "" : "s"} e ${s.atualizados} atualizado${s.atualizados === 1 ? "" : "s"}.`,
      })
      await load()
      onChanged()
    } catch (e) {
      toast({ title: "Não foi possível sincronizar", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  if (missing) {
    return (
      <section className="vx-card cn-sync is-off">
        <span className="cn-sync-icon"><Database /></span>
        <div className="min-w-0 flex-1">
          <b>A sincronização automática ainda não está ativa</b>
          <p>Falta rodar uma migração no banco: cole o conteúdo de <code>{SYNC_MIGRATION}</code> no editor SQL do Supabase e clique em Run. Nada que já existe é alterado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="vx-btn vx-btn--gold" href="https://supabase.com/dashboard/project/mehmqibxzxfqdxqjnjad/sql/new" target="_blank" rel="noopener noreferrer">Abrir o editor SQL</a>
          <button type="button" className="vx-btn" onClick={() => { void navigator.clipboard.writeText(SYNC_MIGRATION); toast({ title: "Caminho copiado", description: SYNC_MIGRATION }) }}><Copy /> Copiar caminho</button>
        </div>
      </section>
    )
  }

  if (error) return <section className="vx-card cn-sync is-off"><p className="text-[13px] text-red-300">{error}</p></section>
  if (!status) return null

  return (
    <section className="vx-card cn-sync">
      <span className="cn-sync-icon"><Zap /></span>
      <div className="min-w-0 flex-1">
        <b>Sincronização automática ligada</b>
        <p>
          Todo cadastro com nome e sobrenome de verdade e e-mail válido vira membro sozinho, com a data de entrada, e acompanha as mudanças.
          Quando a equipe edita um membro, ele passa a ser da equipe e deixa de ser sobrescrito. Excluído, não volta.
        </p>
        <ul className="cn-sync-stats">
          <li><strong className="tnum">{status.automaticos}</strong> automáticos</li>
          <li><strong className="tnum">{status.da_equipe}</strong> da equipe</li>
          <li className={status.pendentes ? "is-warn" : ""}><strong className="tnum">{status.pendentes}</strong> aguardando</li>
          {status.excluidos > 0 && <li><strong className="tnum">{status.excluidos}</strong> excluídos</li>}
        </ul>
        {detail && detail.length > 0 && (
          <details className="cn-sync-detail">
            <summary>O que ficou de fora</summary>
            <ul>{detail.map((d) => <li key={d.texto}><span>{d.texto}</span><b className="tnum">{d.qtd}</b></li>)}</ul>
          </details>
        )}
      </div>
      {canEdit && (
        <button type="button" className="vx-btn vx-btn--gold" onClick={() => void sync()} disabled={busy}>
          {busy ? <><Loader2 className="cn-spin" /> Sincronizando...</> : <><RefreshCw /> Sincronizar agora</>}
        </button>
      )}
    </section>
  )
}
