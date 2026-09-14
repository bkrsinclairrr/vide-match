import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save } from "lucide-react";
import VideoUploadCard, { VideoFile } from "./VideoUploadCard";
import { useState, useEffect, useRef, useCallback } from "react";

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
  onCompletedChange: (n: number) => void;
  playerId: string;
  autoAdvance?: boolean;
}

const emptyVideo = (): VideoFile => ({ file: null, status: 'empty' });

const MultiVideoUpload = ({ onBack, onContinue, onCompletedChange, playerId, autoAdvance = false }: MultiVideoUploadProps) => {
  const [videos, setVideos] = useState<VideoFile[]>(STEPS.map(() => emptyVideo()));
  const [currentStep, setCurrentStep] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const previousStatuses = useRef<VideoFile['status'][]>(STEPS.map(() => 'empty'));
  const pendingScroll = useRef<number | null>(null);

  const selectStep = useCallback((index: number) => {
    setCurrentStep(index);
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (track && card) {
      pendingScroll.current = index;
      track.scrollTo({ left: track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left, behavior });
    }
    const tabs = tabsRef.current;
    const tab = tabs?.children[index] as HTMLElement | undefined;
    if (tabs && tab) {
      tabs.scrollTo({ left: tabs.scrollLeft + tab.getBoundingClientRect().left - tabs.getBoundingClientRect().left, behavior });
    }
  }, []);

  useEffect(() => {
    const justCompleted = videos[currentStep].status === 'ok' && previousStatuses.current[currentStep] !== 'ok';
    previousStatuses.current = videos.map(video => video.status);
    if (!autoAdvance || !justCompleted) return;
    const next = videos.findIndex((video, index) => index > currentStep && video.status !== 'ok');
    if (next !== -1) selectStep(next);
  }, [videos, autoAdvance, currentStep, selectStep]);

  const completedCount = videos.filter(v => v.status === 'ok').length;
  const progressPercent = (completedCount / STEPS.length) * 100;

  // Bug 1 fix: notifica Upload.tsx sempre que muda
  useEffect(() => {
    onCompletedChange(completedCount);
  }, [completedCount, onCompletedChange]);

  const updateVideo = (index: number, video: VideoFile) => {
    setVideos(previous => previous.map((item, i) => i === index ? video : item));
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
              aria-label={`Ir para ${STEPS[i].title}`}
              onClick={() => selectStep(i)} />
          ))}
        </div>
      </div>

      {/* Step tabs */}
      <div ref={tabsRef} className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" aria-label="Habilidades">
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => selectStep(i)} aria-current={i === currentStep ? 'step' : undefined}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
              i === currentStep ? 'bg-primary text-primary-foreground' :
              videos[i].status === 'ok' ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
            {i + 1}. {s.title.split(' (')[0].split(' /')[0]}
          </button>
        ))}
      </div>

      {autoAdvance ? (
        <div ref={trackRef} className="flex items-start gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
          aria-label="Vídeos por habilidade"
          onPointerDown={() => { pendingScroll.current = null; }}
          onWheel={() => { pendingScroll.current = null; }}
          onScroll={() => {
            const track = trackRef.current;
            if (!track) return;
            const cards = Array.from(track.children) as HTMLElement[];
            const index = cards.reduce((closest, card, i) =>
              Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left) <
              Math.abs(cards[closest].getBoundingClientRect().left - track.getBoundingClientRect().left) ? i : closest, 0);
            if (pendingScroll.current !== null && index !== pendingScroll.current) return;
            pendingScroll.current = null;
            setCurrentStep(index);
          }}>
          {STEPS.map((step, index) => (
            <div key={step.category} className="w-full min-w-0 shrink-0 snap-start"
              ref={element => { if (element) element.inert = index !== currentStep; }}>
              <VideoUploadCard
                title={step.title} subtitle={step.subtitle} description={step.description}
                duration={step.duration} example={step.example} maxDurationSec={step.maxDuration}
                maxSizeMB={500} suggestedName={`${playerId}_${step.category}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.mp4`}
                video={videos[index]} onChange={video => updateVideo(index, video)} highlightPending
              />
            </div>
          ))}
        </div>
      ) : <VideoUploadCard
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
      />}

      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button variant="outline" size="sm" className="border-border text-foreground" onClick={() => selectStep(currentStep - 1)}>
            Anterior
          </Button>
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm" onClick={() => selectStep(currentStep + 1)}>
            Próximo fundamento
          </Button>
        ) : (
          <Button className="flex-1 bg-gradient-golden text-background font-semibold text-sm" disabled={!canContinue} onClick={onContinue}>
            Continuar para Apresentação
          </Button>
        )}
      </div>

      <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => {
        sessionStorage.setItem('videoUploadDraft', JSON.stringify({ step: currentStep, completedCount }));
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
