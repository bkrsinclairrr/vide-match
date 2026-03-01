import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Star, MapPin, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  const getUserHistory = () => {
    try { return JSON.parse(localStorage.getItem('userAnalysisHistory') || '[]'); }
    catch { return []; }
  };

  const analysisHistory = getUserHistory();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-primary";
    if (score >= 70) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-elite p-4">
      <div className="container mx-auto max-w-md">
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/match")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">Histórico</div>
          <div className="w-10" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Suas Análises</h1>
          <p className="text-sm text-muted-foreground">Acompanhe sua evolução</p>
        </div>

        <div className="space-y-3 mb-6">
          {analysisHistory.length > 0 ? (
            analysisHistory.map((analysis: any, index: number) => (
              <Card key={analysis.id} className="p-4 bg-card border-border animate-fade-in" style={{ animationDelay: `${index * 0.08}s` }}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{analysis.videoTitle}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3 h-3 mr-1" />{formatDate(analysis.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(analysis.overallScore)}`}>{analysis.overallScore}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{analysis.clubMatch.logo}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground">{analysis.clubMatch.name}</div>
                        <div className="flex items-center text-xs text-muted-foreground"><MapPin className="w-3 h-3 mr-0.5" />{analysis.clubMatch.location}</div>
                      </div>
                      <div className="flex items-center text-xs text-primary font-medium"><Star className="w-3 h-3 mr-0.5" />{analysis.clubMatch.compatibility}%</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs border-border"><Eye className="w-3.5 h-3.5 mr-1.5" />Ver Detalhes</Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 bg-card border-border animate-fade-in text-center">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma análise ainda.</p>
              <p className="text-xs text-muted-foreground">Faça sua primeira análise!</p>
            </Card>
          )}
        </div>

        <Card className="p-6 bg-card border-border text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Nova Análise</h3>
          <p className="text-xs text-muted-foreground mb-4">Upload de novo vídeo para evoluir</p>
          <Button className="w-full bg-gradient-golden text-background font-semibold rounded-xl" onClick={() => navigate("/upload")}>
            Criar Nova Análise
          </Button>
        </Card>

        <div className="mt-4">
          <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => navigate("/")}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default History;
