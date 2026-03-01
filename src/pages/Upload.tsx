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

  const playerId = (() => {
    try {
      const data = JSON.parse(localStorage.getItem('playerData') || '{}');
      return data.name?.replace(/\s+/g, '_').toLowerCase() || 'jogador';
    } catch { return 'jogador'; }
  })();

  const handleFormatSelect = (f: 'single' | 'multiple') => { setFormat(f); setStep(f); };
  const handlePersonalContinue = (has: boolean) => { setHasPersonalVideo(has); setStep('complete'); };

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
    <div className="min-h-screen bg-gradient-elite p-4">
      <div className="container mx-auto max-w-lg">
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (step === 'format') navigate('/onboarding');
              else if (step === 'single' || step === 'multiple') setStep('format');
              else if (step === 'personal') setStep(format);
              else navigate('/analysis');
            }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">{stepLabel()}</div>
          <div className="w-10" />
        </div>

        <Card className="p-5 bg-card border-border">
          {step === 'format' && <FormatSelection onSelect={handleFormatSelect} />}
          {step === 'single' && <SingleVideoUpload onBack={() => setStep('format')} onContinue={() => { setCompletedVideos(1); setStep('personal'); }} playerId={playerId} />}
          {step === 'multiple' && <MultiVideoUpload onBack={() => setStep('format')} onContinue={() => setStep('personal')} playerId={playerId} />}
          {step === 'personal' && <PersonalVideo onBack={() => setStep(format)} onContinue={handlePersonalContinue} playerId={playerId} />}
          {step === 'complete' && <UploadComplete format={format} completedVideos={format === 'single' ? 1 : completedVideos} totalVideos={format === 'single' ? 1 : 8} hasPersonalVideo={hasPersonalVideo} />}
        </Card>
      </div>
    </div>
  );
};

export default Upload;
