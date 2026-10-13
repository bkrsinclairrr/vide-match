import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { ATHLETES_MIGRATION, AthletesMissingError, type AthletesHook, type ForwardResult } from "./api"
import { sectorPath, type AthleteDraft } from "./model"

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Enviar para Atletas" de qualquer tela: grava, avisa o resultado e oferece abrir o setor. */
export function useSendToSector(sector: AthletesHook) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sending, setSending] = useState(false)

  const send = async (drafts: AthleteDraft[]): Promise<ForwardResult | null> => {
    if (sending || !drafts.length) return null
    setSending(true)
    try {
      const r = await sector.forward(drafts)
      const all = [...r.added, ...r.existing]
      const target = all.length === 1 ? all[0].id : undefined
      const description = [
        r.existing.length && `${plural(r.existing.length, "já estava", "já estavam")} no setor`,
        r.failed.length && `${plural(r.failed.length, "não entrou", "não entraram")}: ${r.failed[0].why}`,
      ].filter(Boolean).join(" · ")
      toast({
        title: r.added.length ? `${plural(r.added.length, "atleta enviado", "atletas enviados")} para o setor Atletas` : r.existing.length ? "Já estava no setor Atletas" : "Nenhum atleta enviado",
        description: description || "Defina a temperatura e o próximo passo na ficha.",
        variant: !all.length ? "destructive" : undefined,
        action: all.length ? (
          <ToastAction altText="Abrir o setor Atletas" onClick={() => navigate(sectorPath(pathname, target))}>{target ? "Abrir a ficha" : "Abrir o setor"}</ToastAction>
        ) : undefined,
      })
      return r
    } catch (e) {
      toast({
        title: "Não foi possível enviar para Atletas",
        description: e instanceof AthletesMissingError ? `Falta ativar o setor no banco: rode ${ATHLETES_MIGRATION} no editor SQL do Supabase.` : e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
      return null
    } finally {
      setSending(false)
    }
  }

  return { send, sending }
}
