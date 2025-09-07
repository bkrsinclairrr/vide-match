import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Upload, BarChart3, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center animate-fade-in">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-medium">
            <Play className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Descubra Seu
            <br />
            <span className="text-accent">Clube Ideal</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Faça upload do seu vídeo, receba uma análise completa da sua performance 
            e encontre o clube que combina perfeitamente com o seu perfil de jogador.
          </p>
          
          <Button 
            variant="secondary" 
            size="lg" 
            className="animate-pulse-slow"
            onClick={() => navigate("/onboarding")}
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center bg-gradient-card shadow-medium border-0 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4">Upload Fácil</h3>
            <p className="text-muted-foreground">
              Envie seu vídeo de partida ou melhores momentos com apenas alguns cliques
            </p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-card shadow-medium border-0 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4">Análise Completa</h3>
            <p className="text-muted-foreground">
              Receba um relatório detalhado sobre sua performance em campo
            </p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-card shadow-medium border-0 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4">Match Perfeito</h3>
            <p className="text-muted-foreground">
              Encontre automaticamente o clube que melhor se adequa ao seu perfil
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl shadow-strong p-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-6">
            Pronto para encontrar seu clube?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de jogadores que já descobriram seu match perfeito.
          </p>
          <Button 
            className="bg-gradient-primary hover:opacity-90 transition-all duration-300"
            size="lg"
            onClick={() => navigate("/onboarding")}
          >
            Começar Minha Análise
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;