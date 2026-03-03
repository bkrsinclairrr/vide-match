import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Send, Save, Share2, Sparkles, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UploadCompleteProps {
  format: 'single' | 'multiple';
  completedVideos: number;
  totalVideos: number;
  hasPersonalVideo: boolean;
}

const CATEGORIES = [
  "Tiro de Velocidade", "Domínio de Bola", "Finalização", "Roubada de Bola",
  "Passe e Visão", "Drible 1x1", "Posicionamento", "Trecho de Partida"
];

const UploadComplete = ({ format, completedVideos, totalVideos, hasPersonalVideo }: UploadCompleteProps) => {
  const navigate = useNavigate();
  const completionPercent = format === 'single'
    ? (hasPersonalVideo ? 100 : 80)
    : Math.round(((completedVideos + (hasPersonalVideo ? 1 : 0)) / (totalVideos + 1)) * 100);

  return (
    <div className="space-y-5 animate-fade-in text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-primary" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Upload concluído!</h2>
        <p className="text-sm text-muted-foreground mt-1">Seus vídeos foram recebidos.</p>
      </div>

      <Card className="p-4 bg-muted/30 border-border text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Completude do perfil</span>
          <span className="text-sm font-bold text-primary font-mono">{completionPercent}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${completionPercent}%` }} />
        </div>

        {format === 'multiple' && completedVideos < totalVideos && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1.5">Faltam:</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.slice(completedVideos).map((cat) => (
                <Badge key={cat} className="bg-muted text-muted-foreground border-0 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />{cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!hasPersonalVideo && (
          <p className="text-xs text-accent mt-2 flex items-center gap-1 justify-center">
            <AlertTriangle className="w-3 h-3" />
            Perfis com vídeo pessoal têm 3x mais visualizações.
          </p>
        )}
      </Card>

      {format === 'multiple' && (
        <Button variant="outline" className="w-full text-xs border-border">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Gerar compilado automático
        </Button>
      )}

      <div className="space-y-3 pt-1">
        <button
          className="w-full h-16 rounded-2xl font-black text-lg text-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_32px_rgba(251,191,36,0.4)] hover:shadow-[0_0_48px_rgba(251,191,36,0.55)]"
          style={{ background: "linear-gradient(135deg,#FBBF24,#F97316)" }}
          onClick={() => navigate('/analysis')}
        >
          <Send className="w-5 h-5" />
          Enviar para análise
        </button>
        <Button variant="outline" className="w-full text-xs border-border" onClick={() => navigate('/analysis')}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Salvar e enviar depois
        </Button>
      </div>

    </div>
  );
};

export default UploadComplete;
