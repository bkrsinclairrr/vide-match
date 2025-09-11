import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Upload, BarChart3, Target, Star, Users, Award, Trophy, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-elite">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-golden rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold text-white">Zyron</span>
          </div>
          <div className="hidden md:flex space-x-6 text-white/80">
            <a href="#como-funciona" className="hover:text-accent transition-colors">Como funciona</a>
            <a href="#depoimentos" className="hover:text-accent transition-colors">Sucesso</a>
            <a href="#contato" className="hover:text-accent transition-colors">Contato</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-24">
        <div className="text-center">
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-gradient-golden rounded-full shadow-strong animate-float">
            <Play className="w-12 h-12 text-black" />
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
            Mostre Seu Talento.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-golden animate-glow">
              Encontre Sua Oportunidade
            </span>
            <br />
            <span className="text-white text-3xl md:text-5xl">no Futebol Profissional.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in">
            Upload de vídeo + Relatório de performance + Match com clubes que precisam de você.
            <br />
            <span className="text-accent font-semibold">Sua carreira profissional começa aqui.</span>
          </p>
          
          <Button 
            className="bg-gradient-golden text-black font-bold text-lg hover:scale-105 transition-all duration-300 animate-bounce-slow shadow-strong px-12 py-6 h-auto"
            onClick={() => navigate("/onboarding")}
          >
            Comece Agora - É Grátis
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <div className="mt-8 flex items-center justify-center space-x-8 text-white/70">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span>Análise profissional gratuita</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span>Match com clubes reais</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span>Oportunidades exclusivas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-card rounded-3xl shadow-strong p-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-foreground">
            Números que Impressionam
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2.847</div>
              <div className="text-muted-foreground">Jogadores cadastrados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">186</div>
              <div className="text-muted-foreground">Clubes parceiros</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">94%</div>
              <div className="text-muted-foreground">Taxa de match bem-sucedido</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-white mb-16">
          Como Funciona o Seu Sucesso
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center bg-gradient-card shadow-strong border-0 animate-fade-in hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Upload Inteligente</h3>
            <p className="text-muted-foreground text-lg">
              Envie seu vídeo de até 10 minutos. Nossa IA analisa cada movimento, 
              cada jogada, cada detalhe da sua performance.
            </p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-card shadow-strong border-0 animate-fade-in hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
              <BarChart3 className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Relatório Profissional</h3>
            <p className="text-muted-foreground text-lg">
              Receba uma análise completa e detalhada que impressiona scouts e 
              diretores esportivos. Dados que realmente importam.
            </p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-card shadow-strong border-0 animate-fade-in hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">Match Perfeito</h3>
            <p className="text-muted-foreground text-lg">
              Conectamos você ao clube ideal que precisa exatamente do seu perfil. 
              Oportunidades reais, não promessas vazias.
            </p>
          </Card>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-white mb-16">
          Histórias de Sucesso Real
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 bg-gradient-card shadow-strong border-0">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Lucas Silva</h4>
                <p className="text-muted-foreground">Atacante, 22 anos</p>
              </div>
            </div>
            <p className="text-muted-foreground italic mb-4">
              "Em 2 semanas recebi uma proposta de R$ 5.200/mês do Atlético Mineiro B. 
              O Zyron mudou minha vida completamente!"
            </p>
            <div className="flex text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
          </Card>

          <Card className="p-8 bg-gradient-card shadow-strong border-0">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Marina Costa</h4>
                <p className="text-muted-foreground">Meio-campo, 20 anos</p>
              </div>
            </div>
            <p className="text-muted-foreground italic mb-4">
              "Recebi 3 propostas na mesma semana! Escolhi o Santos FC feminino. 
              A análise do app foi fundamental para me destacar."
            </p>
            <div className="flex text-accent">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
          </Card>
        </div>
      </section>

      {/* Urgência e Escassez */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center bg-gradient-elite border border-accent/30 shadow-strong">
          <div className="w-16 h-16 bg-gradient-golden rounded-full flex items-center justify-center mx-auto mb-6 animate-glow">
            <Award className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">
            Vagas Limitadas Disponíveis
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            <span className="text-accent font-bold">Atenção:</span> Temos apenas <span className="text-accent font-bold">47 vagas</span> 
            restantes para novos jogadores este mês. Clubes como Corinthians B, Santos FC e 
            Internacional estão buscando reforços até o fim do mês.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center text-accent">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">847 jogadores na fila</span>
            </div>
            <div className="flex items-center text-accent">
              <Trophy className="w-5 h-5 mr-2" />
              <span className="font-semibold">23 clubes ativos hoje</span>
            </div>
          </div>
          <Button 
            className="bg-gradient-golden text-black font-bold text-xl hover:scale-105 transition-all duration-300 shadow-strong px-16 py-8 h-auto animate-pulse-slow"
            onClick={() => navigate("/onboarding")}
          >
            Garantir Minha Vaga Agora
            <ArrowRight className="ml-3 w-7 h-7" />
          </Button>
          <p className="text-white/70 text-sm mt-4">
            ⏰ Análise completa em até 24 horas • ✅ 100% gratuito • 🎯 Match garantido
          </p>
        </Card>
      </section>

      {/* Footer CTA */}
      <footer id="contato" className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-card rounded-3xl shadow-strong p-12">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Sua Carreira Profissional Começa Agora
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Não deixe sua oportunidade passar. Milhares de jogadores já descobriram 
            seu potencial e encontraram seus clubes ideais. Você é o próximo.
          </p>
          <Button 
            className="bg-gradient-primary text-white hover:scale-105 transition-all duration-300 shadow-strong text-lg px-12 py-6 h-auto"
            onClick={() => navigate("/onboarding")}
          >
            Começar Minha Jornada Profissional
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
          <div className="mt-8 text-sm text-muted-foreground">
            Zyron © 2024 • Transformando sonhos em oportunidades reais
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;