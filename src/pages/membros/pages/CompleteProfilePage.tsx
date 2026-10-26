import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import FunnelProfile, { type ContaFlow } from "@/pages/funnel/FunnelProfile"
import { useAthlete } from "../ClientArea"
import { CLIENT_BASE } from "../paths"
import { formFromAccount } from "../profileForm"
import { saveProfile } from "../profileSave"

/**
 * A missão "Complete o seu perfil": o mesmo passo a passo do /avaliacao/perfil (foto, dados, nacionalidade, posição,
 * categoria e cidade), mas na conta de quem já entrou. Termina em "Salvar perfil", sem vídeos nem relatório (o envio de
 * vídeo é outra missão), e volta ao Início, que já mostra a etapa cumprida. Fica fora do menu lateral, em tela cheia.
 */
export default function CompleteProfilePage() {
  const { account, category, adminPreview, preview, refresh } = useAthlete()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // `initial` só vale na abertura do formulário; depois quem manda é o que a pessoa digita.
  const flow: ContaFlow = {
    initial: formFromAccount(account, category),
    onFinish: async (data) => {
      // Os dados locais do `npm run dev` (?demo) não gravam em lugar nenhum.
      if (!preview) {
        if (!user) throw new Error("Sessão expirada. Entre de novo.")
        const { photoError } = await saveProfile(user.id, data, account.avatarUrl)
        if (photoError) toast({ title: "Perfil salvo, mas a foto não", description: photoError, variant: "destructive" })
        // Lê a conta de novo antes de sair: o Início já abre com a etapa cumprida e as telas que ela liberou.
        await refresh()
      }
      navigate(CLIENT_BASE, { replace: true })
    },
    onExit: () => navigate(CLIENT_BASE),
  }

  // A equipe vendo como o atleta não grava nada na conta dele (nem na dela).
  if (adminPreview) return <Navigate to={CLIENT_BASE} replace />
  return <FunnelProfile conta={flow} />
}
