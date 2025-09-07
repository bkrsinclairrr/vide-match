import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Star, MapPin, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  // Mock historical data
  const analysisHistory = [
    {
      id: 1,
      date: "2024-01-15",
      overallScore: 87,
      clubMatch: {
        name: "FC Barcelona Academy Brasil",
        logo: "🔵",
        compatibility: 87,
        location: "São Paulo, SP"
      },
      videoTitle: "Partida Regional - Janeiro"
    },
    {
      id: 2,
      date: "2023-12-10",
      overallScore: 82,
      clubMatch: {
        name: "Santos FC Base",
        logo: "⚪",
        compatibility: 79,
        location: "Santos, SP"
      },
      videoTitle: "Amistoso - Dezembro"
    },
    {
      id: 3,
      date: "2023-11-22",
      overallScore: 78,
      clubMatch: {
        name: "São Paulo FC Academia",
        logo: "🔴",
        compatibility: 75,
        location: "São Paulo, SP"
      },
      videoTitle: "Torneio Juvenil - Novembro"
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => navigate("/match")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-medium">
            Histórico
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Suas Análises
          </h1>
          <p className="text-white/80">
            Acompanhe sua evolução ao longo do tempo
          </p>
        </div>

        {/* History List */}
        <div className="space-y-4 mb-6">
          {analysisHistory.map((analysis, index) => (
            <Card 
              key={analysis.id} 
              className="p-4 bg-white shadow-medium border-0 animate-fade-in hover:shadow-strong transition-shadow cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/analysis/${analysis.id}`)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{analysis.videoTitle}</h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(analysis.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>

                {/* Club Match */}
                <div className="bg-accent/10 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{analysis.clubMatch.logo}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{analysis.clubMatch.name}</div>
                      <div className="flex items-center text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {analysis.clubMatch.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-success text-sm font-medium">
                        <Star className="w-3 h-3 mr-1" />
                        {analysis.clubMatch.compatibility}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Button */}
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* New Analysis Button */}
        <Card className="p-6 bg-white shadow-strong border-0 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Nova Análise</h3>
            <p className="text-muted-foreground">
              Faça upload de um novo vídeo para continuar evoluindo
            </p>
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={() => navigate("/upload")}
            >
              Criar Nova Análise
            </Button>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-6">
          <Button 
            variant="ghost" 
            className="w-full text-white"
            onClick={() => navigate("/")}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default History;