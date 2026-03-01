import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Target, Zap, Heart, Brain, Shield, Users, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import PlayerProfile from "@/components/PlayerProfile";

const Analysis = () => {
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('playerData');
    if (savedData) setPlayerData(JSON.parse(savedData));
  }, []);

  const analysisData = useMemo(() => {
    const gen = () => Math.floor(Math.random() * 21) + 75;
    return [
      { category: "Técnica", score: gen(), icon: Target, description: "Excelente domínio de bola e precisão nos passes" },
      { category: "Físico", score: gen(), icon: Zap, description: "Boa velocidade e resistência durante a partida" },
      { category: "Mental", score: gen(), icon: Brain, description: "Leitura de jogo excepcional e tomada de decisão rápida" },
      { category: "Defesa", score: gen(), icon: Shield, description: "Bom posicionamento defensivo com potencial de crescimento" },
      { category: "Ataque", score: gen(), icon: Trophy, description: "Excelente finalização e movimentação na área" },
      { category: "Trabalho em Equipe", score: gen(), icon: Users, description: "Ótima comunicação e entrosamento" },
      { category: "Resistência", score: gen(), icon: Heart, description: "Mantém bom ritmo durante toda a partida" },
      { category: "Criatividade", score: gen(), icon: Lightbulb, description: "Jogadas inovadoras e visão de jogo única" },
    ];
  }, []);

  const overallScore = Math.round(analysisData.reduce((acc, item) => acc + item.score, 0) / analysisData.length);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-primary";
    if (score >= 70) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-elite p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/upload")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">Relatório de Performance</div>
          <div className="w-10" />
        </div>

        {playerData && <PlayerProfile playerData={playerData} className="mb-6" />}

        {/* Overall Score */}
        <Card className="p-6 bg-card border-border mb-6 animate-fade-in">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-primary">{overallScore}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Performance Geral</h2>
            <p className="text-sm text-muted-foreground">Análise baseada no vídeo enviado</p>
          </div>
        </Card>

        {/* Categories */}
        <div className="space-y-3 mb-6">
          {analysisData.map((item, index) => (
            <Card key={item.category} className="p-4 bg-card border-border animate-fade-in" style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{item.category}</h3>
                    <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                  </div>
                  <Progress value={item.score} className="mb-1.5 h-1.5" />
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="p-6 bg-card border-border animate-fade-in">
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Pronto para descobrir seu clube?</h3>
            <p className="text-sm text-muted-foreground mb-5">Com base na sua análise, vamos encontrar o clube perfeito.</p>
            <Button className="w-full bg-gradient-golden text-background font-semibold h-12 rounded-xl" size="lg"
              onClick={() => navigate("/match")}>
              Encontrar Meu Clube
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analysis;
