import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Users, Mail, MessageCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Match = () => {
  const navigate = useNavigate();

  // Mock club data - in real app would come from match algorithm
  const matchedClub = {
    name: "FC Barcelona Academy Brasil",
    logo: "🔵", // Using emoji as placeholder
    compatibility: 87,
    location: "São Paulo, SP",
    category: "Academia Profissional",
    foundedYear: 2018,
    players: 150,
    description: "Academia oficial do FC Barcelona no Brasil, focada no desenvolvimento de jovens talentos com metodologia europeia.",
    whyMatch: [
      "Seu perfil criativo se alinha perfeitamente com o estilo de jogo do Barcelona",
      "Sua excelente leitura de jogo combina com nossa filosofia tática",
      "Ambiente ideal para desenvolver suas habilidades técnicas"
    ],
    contact: {
      email: "contato@fcbarcelonabrasil.com",
      phone: "+55 11 99999-9999"
    }
  };

  const handleContact = () => {
    // In real app, this would integrate with the club's contact system
    const message = `Olá! Sou ${localStorage.getItem('playerName') || 'um jogador'} e recebi um match de ${matchedClub.compatibility}% de compatibilidade com o ${matchedClub.name} através do ScoutMatch. Gostaria de saber mais sobre oportunidades no clube.`;
    
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
            onClick={() => navigate("/analysis")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-medium">
            Seu Match
          </div>
        </div>

        {/* Match Success */}
        <Card className="p-6 bg-white shadow-strong border-0 mb-6 animate-fade-in text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Encontramos seu clube!</h2>
          <p className="text-muted-foreground">
            Com base na sua análise, identificamos o clube ideal para você
          </p>
        </Card>

        {/* Club Card */}
        <Card className="p-6 bg-white shadow-strong border-0 mb-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              {matchedClub.logo}
            </div>
            <h2 className="text-xl font-bold mb-2">{matchedClub.name}</h2>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{matchedClub.location}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
                <Star className="w-5 h-5" />
                <span className="font-bold">{matchedClub.compatibility}% de compatibilidade</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{matchedClub.foundedYear}</div>
                <div className="text-sm text-muted-foreground">Fundado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{matchedClub.players}</div>
                <div className="text-sm text-muted-foreground">Jogadores</div>
              </div>
            </div>

            <Badge variant="secondary" className="w-full justify-center">
              {matchedClub.category}
            </Badge>

            <p className="text-sm text-muted-foreground">
              {matchedClub.description}
            </p>
          </div>
        </Card>

        {/* Why This Match */}
        <Card className="p-6 bg-white shadow-strong border-0 mb-6 animate-fade-in">
          <h3 className="font-bold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Por que este clube?
          </h3>
          <ul className="space-y-3">
            {matchedClub.whyMatch.map((reason, index) => (
              <li key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm">{reason}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Contact Action */}
        <Card className="p-6 bg-gradient-primary text-white shadow-strong border-0 animate-fade-in">
          <div className="text-center space-y-4">
            <MessageCircle className="w-12 h-12 mx-auto" />
            <h3 className="text-xl font-bold">Entre em contato</h3>
            <p className="text-white/90">
              Interessado em conhecer mais sobre o clube? Entre em contato diretamente!
            </p>
            <Button 
              variant="secondary"
              className="w-full"
              onClick={handleContact}
            >
              Falar com o Clube
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-6 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full text-white"
            onClick={() => navigate("/history")}
          >
            Ver Histórico de Matches
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-white"
            onClick={() => navigate("/")}
          >
            Fazer Nova Análise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Match;