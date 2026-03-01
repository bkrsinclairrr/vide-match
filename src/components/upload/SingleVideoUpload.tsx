import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VideoUploadCard, { VideoFile } from "./VideoUploadCard";
import { useState } from "react";

interface SingleVideoUploadProps {
  onBack: () => void;
  onContinue: () => void;
  playerId: string;
}

const SingleVideoUpload = ({ onBack, onContinue, playerId }: SingleVideoUploadProps) => {
  const [video, setVideo] = useState<VideoFile>({ file: null, status: 'empty' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
        <h2 className="text-xl font-bold">Envie seu vídeo compilado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          O vídeo deve conter, em sequência ou como melhores momentos, todos os fundamentos. Duração máxima de 10 minutos.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Nomeie como: <code className="text-primary">{playerId}_compilado.mp4</code>
        </p>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
        <p className="font-medium">📋 Fundamentos que devem aparecer:</p>
        <ul className="text-muted-foreground text-xs space-y-0.5 list-disc list-inside">
          <li>Corrida / velocidade</li>
          <li>Domínio de bola</li>
          <li>Finalização</li>
          <li>Tomada de bola / recuperação</li>
          <li>Passe e visão de jogo</li>
          <li>Drible / 1x1</li>
          <li>Posicionamento e movimentação</li>
          <li>Trecho de partida real</li>
        </ul>
      </div>

      <VideoUploadCard
        title="Vídeo Compilado"
        description="Seus melhores momentos com todos os fundamentos"
        duration="Até 10 min"
        maxDurationSec={600}
        maxSizeMB={500}
        suggestedName={`${playerId}_compilado.mp4`}
        video={video}
        onChange={setVideo}
      />

      <Button
        className="w-full bg-primary hover:bg-primary/90"
        disabled={video.status !== 'ok'}
        onClick={onContinue}
      >
        Continuar para Apresentação Pessoal
      </Button>
    </div>
  );
};

export default SingleVideoUpload;
