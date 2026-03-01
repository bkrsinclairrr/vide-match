import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Layers, Monitor, Clock, HardDrive, Maximize } from "lucide-react";

interface FormatSelectionProps {
  onSelect: (format: 'single' | 'multiple') => void;
}

const FormatSelection = ({ onSelect }: FormatSelectionProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Envio dos Vídeos de Performance</h1>
        <p className="text-muted-foreground">
          Envie seus melhores lances — quanto mais claro, mais precisa será a nossa análise.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
        Para a IA analisar seu jogo com precisão, seus vídeos precisam ter boa qualidade, mostrar você claramente e conter lances reais. Podem ser gravados em campo, society, rua ou treino. Evite imagens escuras, tremidas ou em que o jogador não seja identificado.
      </div>

      {/* Option A */}
      <Card
        className="p-5 border-2 border-border hover:border-primary cursor-pointer transition-all group"
        onClick={() => onSelect('single')}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Enviar 1 vídeo compilado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Recomendada se você já tiver um vídeo de melhores momentos com todos os fundamentos.
            </p>
          </div>
        </div>
      </Card>

      {/* Option B */}
      <Card
        className="p-5 border-2 border-border hover:border-primary cursor-pointer transition-all group"
        onClick={() => onSelect('multiple')}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/30 transition-colors">
            <Layers className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Enviar vídeos separados por habilidade</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Recomendado para análises detalhadas por fundamento (ideal para quem grava no celular).
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Rules */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-sm">📋 Regras rápidas</h4>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="w-4 h-4 shrink-0 text-primary" />
            <span>Formatos aceitos: <strong>MP4, MOV, MKV</strong></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Maximize className="w-4 h-4 shrink-0 text-primary" />
            <span>Resolução mínima: <strong>720p</strong></span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0 text-primary" />
            <span>Duração: máx. <strong>3 min</strong> (separados) / <strong>10 min</strong> (compilado)</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="w-4 h-4 shrink-0 text-primary" />
            <span>Tamanho máximo: <strong>500 MB</strong> por arquivo</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Maximize className="w-4 h-4 shrink-0 text-primary" />
            <span>Orientação: <strong>paisagem (landscape)</strong> preferível</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => onSelect('single')}
        >
          Vídeo Único
        </Button>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={() => onSelect('multiple')}
        >
          Vários Vídeos
        </Button>
      </div>
    </div>
  );
};

export default FormatSelection;
