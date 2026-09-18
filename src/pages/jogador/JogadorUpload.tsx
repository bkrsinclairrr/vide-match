/** Clone de src/pages/funnel/FunnelUpload.tsx sob /jogador — ver JogadorHome.tsx. */
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import FormatSelection from "@/components/upload/FormatSelection"
import SingleVideoUpload from "@/components/upload/SingleVideoUpload"
import MultiVideoUpload from "@/components/upload/MultiVideoUpload"
import PersonalVideo from "@/components/upload/PersonalVideo"
import UploadComplete from "@/components/upload/UploadComplete"
import FunnelLegalMenu from "@/pages/funnel/FunnelLegalMenu"
import { JOGADOR_ROUTES } from "@/lib/funnel"
import "@/pages/funnel/funnel.css"

/**
 * Envio de vídeo do funil aberto — MESMOS componentes do fluxo tradicional
 * (src/pages/Upload.tsx), reaproveitados tal como são: FormatSelection,
 * SingleVideoUpload, MultiVideoUpload, PersonalVideo e UploadComplete.
 * Mantemos as etapas montadas para preservar os vídeos ao voltar.
 * Inclui o checkpoint de consentimento do responsável
 * legal em PersonalVideo, que só aparece para o atleta menor de idade
 * (calculado a partir da mesma idade preenchida no formulário do funil).
 *
 * Diferença de rota: no fluxo tradicional o upload já acontece logado
 * (Onboarding → Upload → Analysis). Aqui o resultado é público:
 * "voltar" leva ao perfil e "concluir" leva direto à análise.
 */
type UploadStep = 'format' | 'single' | 'multiple' | 'personal' | 'complete'

const JogadorUpload = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<UploadStep>('format')
  const [format, setFormat] = useState<'single' | 'multiple'>('single')
  const [completedVideos, setCompletedVideos] = useState(0)
  const [singleComplete, setSingleComplete] = useState(false)
  const [hasPersonalVideo, setHasPersonalVideo] = useState(false)

  useEffect(() => { document.documentElement.classList.add('dark') }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [step])

  const playerId = (() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('playerData') || '{}')
      return data.name?.replace(/\s+/g, '_').toLowerCase() || 'jogador'
    } catch { return 'jogador' }
  })()

  const handleFormatSelect = (f: 'single' | 'multiple') => { setFormat(f); setStep(f) }
  const handlePersonalContinue = (has: boolean) => { setHasPersonalVideo(has); setStep('complete') }

  const stepLabel = () => {
    switch (step) {
      case 'format': return 'Formato'
      case 'single': return 'Vídeo Único'
      case 'multiple': return 'Vídeos por Habilidade'
      case 'personal': return 'Apresentação'
      case 'complete': return 'Concluído'
    }
  }

  return (
    <div className="evaluation-funnel min-h-screen bg-gradient-elite p-4">
      <div className="w-full mx-auto max-w-lg">
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" aria-label="Voltar à etapa anterior" className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (step === 'format') navigate(JOGADOR_ROUTES.profile)
              else if (step === 'single' || step === 'multiple') setStep('format')
              else if (step === 'personal') setStep(format)
              else setStep('personal')
            }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">{stepLabel()}</div>
          <FunnelLegalMenu />
        </div>

        <Card className="min-w-0 p-4 sm:p-5 bg-card border-border">
          <div hidden={step !== 'format'}>
            <FormatSelection onSelect={handleFormatSelect} highlightPending
              completedFormats={[
                ...(singleComplete ? ['single' as const] : []),
                ...(completedVideos >= 4 ? ['multiple' as const] : []),
              ]} />
          </div>
          <div hidden={step !== 'single'}>
            <SingleVideoUpload onBack={() => setStep('format')} onContinue={() => setStep('personal')}
              playerId={playerId} onCompletedChange={setSingleComplete} highlightPending />
          </div>
          <div hidden={step !== 'multiple'}>
            <MultiVideoUpload onBack={() => setStep('format')} onContinue={() => setStep('personal')}
              onCompletedChange={setCompletedVideos} playerId={playerId} autoAdvance />
          </div>
          <div hidden={step !== 'personal'}>
            <PersonalVideo onBack={() => setStep(format)} onContinue={handlePersonalContinue} playerId={playerId} />
          </div>
          {step === 'complete' && (
            <UploadComplete
              format={format}
              completedVideos={format === 'single' ? 1 : completedVideos}
              totalVideos={format === 'single' ? 1 : 8}
              hasPersonalVideo={hasPersonalVideo}
              onComplete={() => navigate(JOGADOR_ROUTES.result)}
            />
          )}
        </Card>
      </div>
    </div>
  )
}

export default JogadorUpload
