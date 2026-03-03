import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Upload, BarChart3, Target, Star, Users, Award, Trophy, ArrowRight, CheckCircle, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-elite">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-golden rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Zyron</span>
          </div>
          <div className="hidden md:flex space-x-8 text-muted-foreground text-sm">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Sucesso</a>
            <a href="#contato" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Plataforma oficial de scouting com IA
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight animate-fade-in">
            Mostre Seu Talento.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-golden">
              Encontre Sua Oportunidade
            </span>
            <br />
            <span className="text-foreground text-xl sm:text-3xl md:text-4xl font-medium">no Futebol Profissional.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in px-4">
            Upload de vídeo + Relatório de performance + Match com clubes que precisam de você.
            <br />
            <span className="text-primary font-semibold">Sua carreira profissional começa aqui.</span>
          </p>

          <div className="flex justify-center mb-8">
            <Button
              className="bg-gradient-golden text-background font-bold text-sm sm:text-base hover:scale-105 transition-all duration-300 shadow-glow px-8 sm:px-12 py-5 sm:py-6 h-auto rounded-xl"
              onClick={() => navigate("/onboarding")}
            >
              Comece Agora — É Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm">Análise profissional gratuita</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm">Match com clubes reais</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm">Oportunidades exclusivas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-foreground">
            Números que Impressionam
          </h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">2.847</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Jogadores cadastrados</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-accent mb-1">186</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Clubes parceiros</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">94%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Taxa de match</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">
          Como Funciona
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Processo profissional em 3 etapas simples
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Upload, title: "Upload Inteligente", desc: "Envie seu vídeo de até 10 minutos. Nossa IA analisa cada movimento, cada jogada, cada detalhe.", color: "bg-primary/10 text-primary" },
            { icon: BarChart3, title: "Relatório Profissional", desc: "Receba uma análise completa que impressiona scouts e diretores. Dados que realmente importam.", color: "bg-accent/10 text-accent" },
            { icon: Target, title: "Match Perfeito", desc: "Conectamos você ao clube ideal que precisa do seu perfil. Oportunidades reais, não promessas.", color: "bg-primary/10 text-primary" },
          ].map((item, i) => (
            <Card key={i} className="p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">
          Histórias de Sucesso
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { name: "Lucas Silva", role: "Atacante, 22 anos", quote: "Em 2 semanas recebi uma proposta de R$ 5.200/mês do Atlético Mineiro B. O Zyron mudou minha vida!" },
            { name: "Marina Costa", role: "Meio-campo, 20 anos", quote: "Recebi 3 propostas na mesma semana! Escolhi o Santos FC feminino. A análise foi fundamental." },
          ].map((t, i) => (
            <Card key={i} className="p-6 bg-card border-border">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-golden rounded-full flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">"{t.quote}"</p>
              <div className="flex text-accent">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-8 sm:p-12 text-center bg-card border border-primary/20">
          <div className="w-14 h-14 bg-gradient-golden rounded-xl flex items-center justify-center mx-auto mb-6 animate-glow">
            <Zap className="w-7 h-7 text-background" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Vagas Limitadas
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Apenas <span className="text-accent font-bold">47 vagas</span> restantes este mês. Clubes buscam reforços ativamente.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-2 text-primary" />
              847 jogadores na fila
            </div>
            <div className="flex items-center text-muted-foreground">
              <Trophy className="w-4 h-4 mr-2 text-accent" />
              23 clubes ativos hoje
            </div>
          </div>
          <Button
            className="bg-gradient-golden text-background font-bold text-base hover:scale-105 transition-all duration-300 shadow-glow px-10 py-6 h-auto rounded-xl"
            onClick={() => navigate("/onboarding")}
          >
            Garantir Minha Vaga
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-muted-foreground text-xs mt-4">
            ⏰ Análise em até 24h • ✅ 100% gratuito • 🎯 Match garantido
          </p>
        </Card>
      </section>

      {/* Footer */}
      <footer id="contato" className="container mx-auto px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Zyron © 2026 • Transformando sonhos em oportunidades reais
        </p>
      </footer>
    </div>
  );
};

export default Landing;
