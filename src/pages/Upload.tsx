import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormatSelection from "@/components/upload/FormatSelection";
import SingleVideoUpload from "@/components/upload/SingleVideoUpload";
import MultiVideoUpload from "@/components/upload/MultiVideoUpload";
import PersonalVideo from "@/components/upload/PersonalVideo";
import UploadComplete from "@/components/upload/UploadComplete";

type UploadStep = 'format' | 'single' | 'multiple' | 'personal' | 'complete';

const Upload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<UploadStep>('format');
  const [format, setFormat] = useState<'single' | 'multiple'>('single');
  const [completedVideos, setCompletedVideos] = useState(0);
  const [hasPersonalVideo, setHasPersonalVideo] = useState(false);

  // Simple player ID for naming
  const playerId = (() => {
    try {
      const data = JSON.parse(localStorage.getItem('playerData') || '{}');
      return data.name?.replace(/\s+/g, '_').toLowerCase() || 'jogador';
    } catch { return 'jogador'; }
  })();

  const handleFormatSelect = (f: 'single' | 'multiple') => {
    setFormat(f);
    setStep(f);
  };

  const handlePersonalContinue = (has: boolean) => {
    setHasPersonalVideo(has);
    setStep('complete');
  };

  const stepLabel = () => {
    switch (step) {
      case 'format': return 'Formato';
      case 'single': return 'Vídeo Único';
      case 'multiple': return 'Vídeos por Habilidade';
      case 'personal': return 'Apresentação';
      case 'complete': return 'Concluído';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
            onClick={() => {
              if (step === 'format') navigate('/onboarding');
              else if (step === 'single' || step === 'multiple') setStep('format');
              else if (step === 'personal') setStep(format);
              else navigate('/analysis');
            }}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-primary-foreground font-medium text-sm">{stepLabel()}</div>
          <div className="w-10" />
        </div>

        <Card className="p-6 bg-card shadow-strong border-0">
          {step === 'format' && <FormatSelection onSelect={handleFormatSelect} />}

          {step === 'single' && (
            <SingleVideoUpload
              onBack={() => setStep('format')}
              onContinue={() => { setCompletedVideos(1); setStep('personal'); }}
              playerId={playerId}
            />
          )}

          {step === 'multiple' && (
            <MultiVideoUpload
              onBack={() => setStep('format')}
              onContinue={() => setStep('personal')}
              playerId={playerId}
            />
          )}

          {step === 'personal' && (
            <PersonalVideo
              onBack={() => setStep(format)}
              onContinue={handlePersonalContinue}
              playerId={playerId}
            />
          )}

          {step === 'complete' && (
            <UploadComplete
              format={format}
              completedVideos={format === 'single' ? 1 : completedVideos}
              totalVideos={format === 'single' ? 1 : 8}
              hasPersonalVideo={hasPersonalVideo}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Upload;
