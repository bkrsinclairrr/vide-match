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
  "Corrida Intensa", "Domínio de Bola", "Finalização", "Tomada de Bola",
  "Passe e Visão", "Drible 1x1", "Posicionamento", "Trecho de Partida"
];

const UploadComplete = ({ format, completedVideos, totalVideos, hasPersonalVideo }: UploadCompleteProps) => {
  const navigate = useNavigate();
  const completionPercent = format === 'single'
    ? (hasPersonalVideo ? 100 : 80)
    : Math.round(((completedVideos + (hasPersonalVideo ? 1 : 0)) / (totalVideos + 1)) * 100);

  return (
    <div className="space-y-6 animate-fade-in text-center">
      <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-success-foreground" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">Upload concluído!</h2>
        <p className="text-muted-foreground mt-1">Seus vídeos foram recebidos com sucesso.</p>
      </div>

      {/* Completion */}
      <Card className="p-4 bg-muted/30 border-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Completude do perfil</span>
          <span className="text-lg font-bold text-primary">{completionPercent}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-primary rounded-full h-3 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {format === 'multiple' && completedVideos < totalVideos && (
          <div className="mt-3 text-left">
            <p className="text-xs text-muted-foreground mb-2">Faltam:</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.slice(completedVideos).map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />{cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!hasPersonalVideo && (
          <p className="text-xs text-warning mt-2 flex items-center gap-1 justify-center">
            <AlertTriangle className="w-3 h-3" />
            Apresentação pessoal não enviada — perfis com vídeo pessoal têm 3x mais visualizações.
          </p>
        )}
      </Card>

      {format === 'multiple' && (
        <Button variant="outline" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar compilado automático dos melhores momentos
        </Button>
      )}

      <div className="space-y-3">
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate('/analysis')}>
          <Send className="w-4 h-4 mr-2" />
          Enviar para análise
        </Button>
        <Button variant="outline" className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Copiar link para compartilhar
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/analysis')}>
          <Save className="w-4 h-4 mr-2" />
          Salvar e enviar depois
        </Button>
      </div>
    </div>
  );
};

export default UploadComplete;
