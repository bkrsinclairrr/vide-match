import { Button } from "@/components/ui/button";
import { ArrowLeft, SkipForward } from "lucide-react";
import VideoUploadCard, { VideoFile } from "./VideoUploadCard";
import { useState } from "react";

interface PersonalVideoProps {
  onBack: () => void;
  onContinue: (hasVideo: boolean) => void;
  playerId: string;
}

const PersonalVideo = ({ onBack, onContinue, playerId }: PersonalVideoProps) => {
  const [video, setVideo] = useState<VideoFile>({ file: null, status: 'empty' });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
        <h2 className="text-lg font-bold text-foreground">Apresentação Pessoal</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Grave um vídeo de até 5 minutos contando sua trajetória, conquistas e motivação.
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic opacity-70">
          (Opcional — mas altamente recomendado. Dirigentes gostam de conhecer o atleta por trás do vídeo.)
        </p>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-xs text-center text-muted-foreground">
        ⭐ <span className="text-accent font-medium">Recomendado</span> — Perfis com apresentação pessoal têm <span className="text-foreground font-medium">3x mais visualizações</span> de olheiros.
      </div>

      <VideoUploadCard
        title="Vídeo de Apresentação"
        description="Conte sua história, trajetória e motivação"
        duration="Até 5 min"
        maxDurationSec={300}
        maxSizeMB={500}
        suggestedName={`${playerId}_apresentacao.mp4`}
        video={video}
        onChange={setVideo}
        showCapture={true}
      />

      <div className="space-y-2">
        <Button className="w-full bg-gradient-golden text-background font-semibold h-11 rounded-xl"
          onClick={() => onContinue(video.status === 'ok')}
          disabled={video.status === 'uploading' || video.status === 'validating'}>
          {video.status === 'ok' ? 'Continuar com apresentação' : 'Enviar para análise'}
        </Button>
        {video.status !== 'ok' && (
          <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => onContinue(false)}>
            <SkipForward className="w-3.5 h-3.5 mr-1.5" />
            Pular — enviar sem apresentação
          </Button>
        )}
      </div>
    </div>
  );
};

export default PersonalVideo;
