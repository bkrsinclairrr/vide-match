import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Target, Zap, Heart, Brain, Shield, Users, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PlayerProfile from "@/components/PlayerProfile";

const Analysis = () => {
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('playerData');
    if (savedData) {
      setPlayerData(JSON.parse(savedData));
    }
  }, []);

  const analysisData = [
    {
      category: "Técnica",
      score: 85,
      icon: Target,
      description: "Excelente domínio de bola e precisão nos passes",
      color: "text-success"
    },
    {
      category: "Físico", 
      score: 78,
      icon: Zap,
      description: "Boa velocidade e resistência durante a partida",
      color: "text-warning"
    },
    {
      category: "Mental",
      score: 92,
      icon: Brain,
      description: "Leitura de jogo excepcional e tomada de decisão rápida",
      color: "text-success"
    },
    {
      category: "Defesa",
      score: 72,
      icon: Shield,
      description: "Posicionamento defensivo pode ser aprimorado",
      color: "text-warning"
    },
    {
      category: "Ataque",
      score: 88,
      icon: Trophy,
      description: "Excelente finalização e movimentação na área",
      color: "text-success"
    },
    {
      category: "Trabalho em Equipe",
      score: 90,
      icon: Users,
      description: "Ótima comunicação e entrosamento com companheiros",
      color: "text-success"
    },
    {
      category: "Resistência",
      score: 75,
      icon: Heart,
      description: "Mantém bom ritmo durante toda a partida",
      color: "text-warning"
    },
    {
      category: "Criatividade",
      score: 94,
      icon: Lightbulb,
      description: "Demonstra jogadas inovadoras e visão de jogo única",
      color: "text-success"
    }
  ];

  const overallScore = Math.round(analysisData.reduce((acc, item) => acc + item.score, 0) / analysisData.length);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-success";
    if (score >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => navigate("/upload")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-medium">
            Relatório de Performance
          </div>
        </div>

        {/* Player Profile */}
        {playerData && (
          <PlayerProfile playerData={playerData} className="mb-6" />
        )}

        {/* Overall Score */}
        <Card className="p-6 bg-white shadow-strong border-0 mb-6 animate-fade-in">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">{overallScore}</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Performance Geral</h2>
            <p className="text-muted-foreground">
              Análise completa baseada no seu vídeo enviado
            </p>
          </div>
        </Card>

        {/* Analysis Categories */}
        <div className="space-y-4 mb-8">
          {analysisData.map((item, index) => (
            <Card key={item.category} className="p-4 bg-white shadow-medium border-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{item.category}</h3>
                    <span className={`font-bold ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </span>
                  </div>
                  <Progress 
                    value={item.score} 
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        <Card className="p-6 bg-white shadow-strong border-0 animate-fade-in">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">
              Pronto para descobrir seu clube ideal?
            </h3>
            <p className="text-muted-foreground mb-6">
              Com base na sua análise, vamos encontrar o clube perfeito para você.
            </p>
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
              onClick={() => navigate("/match")}
            >
              Encontrar Meu Clube
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analysis;