import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Users, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getRandomClub, Club } from "@/data/clubs";

const Match = () => {
  const navigate = useNavigate();
  const [matchedClub, setMatchedClub] = useState<Club | null>(null);
  const [isMatching, setIsMatching] = useState(true);
  const [compatibility, setCompatibility] = useState(0);

  useEffect(() => {
    // Get previously used clubs to ensure variety
    const usedClubIds = JSON.parse(localStorage.getItem('usedClubIds') || '[]');
    
    // Simulate matching process
    setTimeout(() => {
      const club = getRandomClub(usedClubIds);
      setMatchedClub(club);
      
      // Generate compatibility score (75-95%)
      const compatibilityScore = 75 + Math.floor(Math.random() * 21);
      setCompatibility(compatibilityScore);
      
      // Save this club as used
      const updatedUsedIds = [...usedClubIds, club.id];
      localStorage.setItem('usedClubIds', JSON.stringify(updatedUsedIds));
      
      setIsMatching(false);
    }, 3000);
  }, []);

  const getWhyMatch = (club: Club, playerData: any) => {
    const reasons = [
      `Seu perfil de ${playerData?.position || 'jogador'} se alinha perfeitamente com as necessidades do ${club.name}`,
      `Sua experiência e estilo de jogo combinam com a filosofia do clube`,
      `${club.country} oferece excelentes oportunidades para jogadores do seu perfil`,
      `O clube busca especificamente um ${club.preferredStyle} como você`,
      `Ambiente ideal para desenvolver suas habilidades e crescer profissionalmente`
    ];
    
    return reasons.slice(0, 3);
  };

  const getUrgencyDate = () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (Math.floor(Math.random() * 14) + 7) * 24 * 60 * 60 * 1000);
    return futureDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleContact = () => {
    if (!matchedClub) return;
    
    const playerData = JSON.parse(localStorage.getItem('playerData') || '{}');
    const message = `Olá! Sou ${playerData.name || 'um jogador'} e recebi um match de ${compatibility}% de compatibilidade com o ${matchedClub.name} através do ScoutMatch. Sou ${playerData.position || 'jogador'} de ${playerData.age || 'N/A'} anos do ${playerData.country || 'Brasil'} e gostaria de saber mais sobre oportunidades no clube.`;
    
    // Extract phone number for WhatsApp (remove formatting)
    const phone = matchedClub.contact.phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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

        {isMatching ? (
          /* Matching Animation */
          <Card className="p-8 bg-white shadow-strong border-0 mb-6 animate-fade-in text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Star className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Encontrando seu clube ideal...</h2>
            <p className="text-muted-foreground mb-6">
              Analisando compatibilidade com mais de 900 clubes mundiais
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        ) : (
          <>
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

            {/* Urgency Banner */}
            <Card className="p-4 bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20 mb-6 animate-fade-in">
              <div className="flex items-center space-x-3 text-warning-foreground">
                <Clock className="w-5 h-5 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    ⚡ Oportunidade limitada! Este clube busca reforços até {getUrgencyDate()}
                  </p>
                  <p className="text-xs opacity-80">
                    Não perca sua chance - entre em contato hoje mesmo!
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {!isMatching && matchedClub && (
          <>

            {/* Club Card */}
            <Card className="p-6 bg-white shadow-strong border-0 mb-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  {matchedClub.logo}
                </div>
                <h2 className="text-xl font-bold mb-2">{matchedClub.name}</h2>
                <div className="flex items-center justify-center space-x-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{matchedClub.country} • {matchedClub.continent}</span>
                </div>
                <p className="text-xs text-muted-foreground">{matchedClub.league}</p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full">
                    <Star className="w-5 h-5" />
                    <span className="font-bold">{compatibility}% de compatibilidade</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{matchedClub.founded}</div>
                    <div className="text-xs text-muted-foreground">Fundado</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{matchedClub.players}</div>
                    <div className="text-xs text-muted-foreground">Jogadores</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-success">R$ {matchedClub.monthlyOffer.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Oferta/mês</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">{matchedClub.category}</Badge>
                  <Badge variant="outline">{matchedClub.openPositions} vagas abertas</Badge>
                </div>

                <div className="bg-accent/10 rounded-lg p-3">
                  <p className="text-xs text-center text-muted-foreground">
                    <strong>Busca:</strong> {matchedClub.preferredStyle}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground text-center">
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
                {getWhyMatch(matchedClub, JSON.parse(localStorage.getItem('playerData') || '{}')).map((reason, index) => (
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
                <h3 className="text-xl font-bold">Entre em contato agora</h3>
                <p className="text-white/90">
                  Sua oportunidade está aqui! Fale diretamente com o clube via WhatsApp e garante sua vaga.
                </p>
                <Button 
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleContact}
                >
                  📱 Falar com o Clube via WhatsApp
                </Button>
                <p className="text-xs text-white/70">
                  Mensagem pré-formatada com seus dados será enviada
                </p>
              </div>
            </Card>
          </>
        )}

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