import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save } from "lucide-react";
import VideoUploadCard, { VideoFile } from "./VideoUploadCard";
import { useState } from "react";

const STEPS = [
  {
    title: "Corrida Intensa (20m)",
    description: "Aceleração dos 0–20m com cronômetro visível ou marcações de campo.",
    duration: "15–30s (3 repetições)",
    example: "Mostre sua explosão e velocidade nos primeiros 20 metros.",
    maxDuration: 180,
    category: "corrida20",
  },
  {
    title: "Domínio de Bola",
    description: "Recepção sob pressão, domínio orientado (pés e peito).",
    duration: "30–60s",
    example: "Sequências de controle em passes curtos.",
    maxDuration: 180,
    category: "dominio",
  },
  {
    title: "Finalização",
    description: "Chutes em situação real e de treino (curta/média distância).",
    duration: "30–90s (5–8 tentativas)",
    example: "Finalização com e sem oposição.",
    maxDuration: 180,
    category: "finalizacao",
  },
  {
    title: "Tomada de Bola / Recuperação",
    description: "Desarmes, interceptações, reação defensiva.",
    duration: "20–60s",
    example: undefined,
    maxDuration: 180,
    category: "tomada",
  },
  {
    title: "Passe e Visão de Jogo",
    description: "Passes em profundidade, trocas rápidas e lançamentos decisivos.",
    duration: "30–60s",
    example: undefined,
    maxDuration: 180,
    category: "passe",
  },
  {
    title: "Drible / 1x1",
    description: "Dribles em situações reais, decisão de quando driblar.",
    duration: "30–60s",
    example: undefined,
    maxDuration: 180,
    category: "drible",
  },
  {
    title: "Posicionamento e Movimentação",
    description: "Sequência mostrando movimentação sem bola em ataque/defesa.",
    duration: "30–60s",
    example: undefined,
    maxDuration: 180,
    category: "posicionamento",
  },
  {
    title: "Trecho de Partida (1–3 min)",
    description: "1–3 minutos contínuos de jogo real com o jogador visível.",
    duration: "60–180s",
    example: undefined,
    maxDuration: 180,
    category: "partida",
  },
];

interface MultiVideoUploadProps {
  onBack: () => void;
  onContinue: () => void;
  playerId: string;
}

const emptyVideo = (): VideoFile => ({ file: null, status: 'empty' });

const MultiVideoUpload = ({ onBack, onContinue, playerId }: MultiVideoUploadProps) => {
  const [videos, setVideos] = useState<VideoFile[]>(STEPS.map(() => emptyVideo()));
  const [currentStep, setCurrentStep] = useState(0);

  const completedCount = videos.filter(v => v.status === 'ok').length;
  const progressPercent = (completedCount / STEPS.length) * 100;

  const updateVideo = (index: number, video: VideoFile) => {
    const next = [...videos];
    next[index] = video;
    setVideos(next);
  };

  const canContinue = completedCount >= 4; // at least half

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
        <h2 className="text-xl font-bold">Enviar Vídeos por Habilidade</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envie cada fundamento separadamente para uma análise mais precisa.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{completedCount} de {STEPS.length} enviados</span>
          <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} />
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors ${
                videos[i].status === 'ok' ? 'bg-success' :
                videos[i].status === 'warning' ? 'bg-warning' :
                videos[i].status === 'error' ? 'bg-destructive' :
                i === currentStep ? 'bg-primary/50' : 'bg-muted'
              }`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              i === currentStep ? 'bg-primary text-primary-foreground' :
              videos[i].status === 'ok' ? 'bg-success/20 text-success' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}. {s.title.split(' (')[0].split(' /')[0]}
          </button>
        ))}
      </div>

      {/* Current step upload */}
      <VideoUploadCard
        title={STEPS[currentStep].title}
        description={STEPS[currentStep].description}
        duration={STEPS[currentStep].duration}
        example={STEPS[currentStep].example}
        maxDurationSec={STEPS[currentStep].maxDuration}
        maxSizeMB={500}
        suggestedName={`${playerId}_${STEPS[currentStep].category}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.mp4`}
        video={videos[currentStep]}
        onChange={(v) => updateVideo(currentStep, v)}
      />

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
            Anterior
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => setCurrentStep(currentStep + 1)}>
            Próximo fundamento
          </Button>
        ) : (
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={!canContinue}
            onClick={onContinue}
          >
            Continuar para Apresentação Pessoal
          </Button>
        )}
      </div>

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => {
        localStorage.setItem('videoUploadDraft', JSON.stringify({ step: currentStep, completedCount }));
      }}>
        <Save className="w-4 h-4 mr-2" />
        Salvar rascunho e continuar depois
      </Button>

      {!canContinue && (
        <p className="text-xs text-muted-foreground text-center">
          Envie pelo menos 4 vídeos para continuar. Quanto mais, melhor a análise.
        </p>
      )}
    </div>
  );
};

export default MultiVideoUpload;
