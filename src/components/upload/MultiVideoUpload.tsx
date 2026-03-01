import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save } from "lucide-react";
import VideoUploadCard, { VideoFile } from "./VideoUploadCard";
import { useState } from "react";

const STEPS = [
  {
    title: "Tiro de Velocidade",
    subtitle: "20m",
    description: "Aceleração dos 0–20m com cronômetro visível ou marcações de campo.",
    duration: "15–30s (3 repetições)",
    example: "Mostre sua explosão e velocidade nos primeiros 20 metros.",
    maxDuration: 180,
    category: "tiro_velocidade20",
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
    title: "Roubada de Bola",
    description: "Desarmes, interceptações, reação defensiva.",
    duration: "20–60s",
    example: undefined,
    maxDuration: 180,
    category: "roubada",
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

  const canContinue = completedCount >= 4;

  const getDisplayTitle = (step: typeof STEPS[number]) => {
    if (step.subtitle) {
      return (
        <span>
          {step.title.split(' (')[0].split(' /')[0]}
          <span className="text-xs text-muted-foreground ml-1">{step.subtitle}</span>
        </span>
      );
    }
    return step.title.split(' (')[0].split(' /')[0];
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
        <h2 className="text-lg font-bold text-foreground">Enviar Vídeos por Habilidade</h2>
        <p className="text-xs text-muted-foreground mt-1">Análise mais precisa por fundamento.</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{completedCount} de {STEPS.length} enviados</span>
          <span className="font-medium text-primary font-mono">{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <button key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                videos[i].status === 'ok' ? 'bg-primary' :
                videos[i].status === 'warning' ? 'bg-accent' :
                videos[i].status === 'error' ? 'bg-destructive' :
                i === currentStep ? 'bg-primary/30' : 'bg-border'
              }`}
              onClick={() => setCurrentStep(i)} />
          ))}
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setCurrentStep(i)}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
              i === currentStep ? 'bg-primary text-primary-foreground' :
              videos[i].status === 'ok' ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
            {i + 1}. {s.title.split(' (')[0].split(' /')[0]}
          </button>
        ))}
      </div>

      <VideoUploadCard
        title={STEPS[currentStep].title}
        subtitle={STEPS[currentStep].subtitle}
        description={STEPS[currentStep].description}
        duration={STEPS[currentStep].duration}
        example={STEPS[currentStep].example}
        maxDurationSec={STEPS[currentStep].maxDuration}
        maxSizeMB={500}
        suggestedName={`${playerId}_${STEPS[currentStep].category}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.mp4`}
        video={videos[currentStep]}
        onChange={(v) => updateVideo(currentStep, v)}
      />

      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button variant="outline" size="sm" className="border-border text-foreground" onClick={() => setCurrentStep(currentStep - 1)}>
            Anterior
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm" onClick={() => setCurrentStep(currentStep + 1)}>
            Próximo fundamento
          </Button>
        ) : (
          <Button className="flex-1 bg-gradient-golden text-background font-semibold text-sm" disabled={!canContinue} onClick={onContinue}>
            Continuar para Apresentação
          </Button>
        )}
      </div>

      <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => {
        localStorage.setItem('videoUploadDraft', JSON.stringify({ step: currentStep, completedCount }));
      }}>
        <Save className="w-3.5 h-3.5 mr-1.5" />
        Salvar rascunho
      </Button>

      {!canContinue && (
        <p className="text-xs text-muted-foreground text-center">
          Envie pelo menos 4 vídeos para continuar.
        </p>
      )}
    </div>
  );
};

export default MultiVideoUpload;
