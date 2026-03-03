import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Layers, Monitor, Clock, HardDrive, Maximize } from "lucide-react";

interface FormatSelectionProps {
  onSelect: (format: 'single' | 'multiple') => void;
}

const FormatSelection = ({ onSelect }: FormatSelectionProps) => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground mb-1">Envio dos Vídeos de Performance</h1>
        <p className="text-sm text-muted-foreground">
          Envie seus melhores lances — quanto mais claro, mais precisa será a nossa análise.
        </p>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed border border-border">
        Para a IA analisar seu jogo com precisão, seus vídeos precisam ter boa qualidade, mostrar você claramente e conter lances reais. Podem ser gravados em campo, society, rua ou treino. Evite imagens escuras, tremidas ou em que o jogador não seja identificado.
      </div>

      <Card className="p-4 border-border hover:border-primary/40 cursor-pointer transition-all group"
        onClick={() => onSelect('single')}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Enviar 1 vídeo compilado</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Recomendada se você já tiver um vídeo de melhores momentos.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-border hover:border-accent/40 cursor-pointer transition-all group"
        onClick={() => onSelect('multiple')}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Enviar vídeos separados por habilidade</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Análises detalhadas por fundamento (ideal para celular).</p>
          </div>
        </div>
      </Card>

      <div className="bg-muted/20 rounded-xl p-4 space-y-2 border border-border">
        <h4 className="font-semibold text-xs text-foreground">📋 Regras rápidas</h4>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5 text-primary shrink-0" /><span>Formatos: <span className="text-foreground font-medium">MP4, MOV, MKV</span></span></div>
          <div className="flex items-center gap-2"><Maximize className="w-3.5 h-3.5 text-primary shrink-0" /><span>Resolução mínima: <span className="text-foreground font-medium">720p</span></span></div>
          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary shrink-0" /><span>Duração: máx. <span className="text-foreground font-medium">3 min</span> (separados) / <span className="text-foreground font-medium">10 min</span> (compilado)</span></div>
          <div className="flex items-center gap-2"><HardDrive className="w-3.5 h-3.5 text-primary shrink-0" /><span>Tamanho: <span className="text-foreground font-medium">500 MB</span></span></div>
          <div className="flex items-center gap-2"><Maximize className="w-3.5 h-3.5 text-primary shrink-0" /><span>Orientação: <span className="text-foreground font-medium">paisagem</span> preferível</span></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={() => onSelect('single')}
          className="w-full h-14 rounded-2xl font-bold text-base text-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_28px_rgba(251,191,36,0.35)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]"
          style={{ background: "linear-gradient(135deg,#FBBF24,#F97316)" }}
        >
          <Film className="w-5 h-5" />
          Enviar vídeo compilado
        </button>
        <button
          onClick={() => onSelect('multiple')}
          className="w-full h-12 rounded-2xl font-semibold text-sm border flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:border-amber-400/40 hover:text-white"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
        >
          <Layers className="w-4 h-4" />
          Vídeos separados por habilidade
        </button>
      </div>
    </div>
  );
};

export default FormatSelection;
