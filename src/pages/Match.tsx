import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Users, MessageCircle, CheckCircle2, Clock, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getRandomClub, getRandomBrazilianClub, Club } from "@/data/clubs";

const LOADING_MESSAGES = [
  "Analisando métricas físicas e técnicas...",
  "Cruzando dados com base de clubes nacionais...",
  "Calculando compatibilidade tática...",
  "Avaliando potencial de desenvolvimento...",
  "Processando histórico de performance...",
  "Comparando com atletas da mesma categoria...",
  "Simulando encaixe estratégico no elenco...",
  "Validando dados com parâmetros de mercado...",
];

const Match = () => {
  const navigate = useNavigate();
  const [matchedClub, setMatchedClub] = useState<Club | null>(null);
  const [isMatching, setIsMatching] = useState(true);
  const [compatibility, setCompatibility] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('playerData');
    if (saved) setPlayerData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!isMatching) return;

    // Progress bar: 0 to 100 over ~30 seconds
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        // Slow start, accelerate, slow end
        const increment = prev < 30 ? 0.8 : prev < 70 ? 1.2 : prev < 90 ? 0.6 : 0.3;
        return Math.min(prev + increment, 100);
      });
    }, 300);

    // Rotate messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 3500);

    // Reveal club after ~30s
    const revealTimeout = setTimeout(() => {
      const usedClubIds = JSON.parse(localStorage.getItem('usedClubIds') || '[]');
      const category = playerData?.category || 'Sub 17';
      const isSub20 = category === 'Sub 20';

      const club = isSub20
        ? getRandomClub(usedClubIds)
        : getRandomBrazilianClub(usedClubIds);

      setMatchedClub(club);
      setCompatibility(93 + Math.floor(Math.random() * 3));
      const updatedUsedIds = [...usedClubIds, club.id];
      localStorage.setItem('usedClubIds', JSON.stringify(updatedUsedIds));
      setProgress(100);
      setTimeout(() => setIsMatching(false), 500);
    }, 30000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(revealTimeout);
    };
  }, [isMatching, playerData]);

  const isSub20 = playerData?.category === 'Sub 20';

  const getWhyMatch = (club: Club) => {
    const reasons = [
      `Seu perfil de ${playerData?.position || 'jogador'} se alinha com as necessidades do ${club.name}`,
      `Sua experiência e estilo combinam com a filosofia do clube`,
      `${club.country} oferece excelentes oportunidades para seu perfil`,
    ];
    return reasons;
  };

  const getUrgencyDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * 14) + 7);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleContact = () => {
    if (!matchedClub) return;
    const message = `🔥 Olá! Meu nome é ${playerData?.name || 'um jogador'} e acabei de receber uma indicação através do Zyron!\n\n⚽ Sou ${playerData?.position || 'jogador'} e nossa plataforma identificou ${compatibility}% de compatibilidade com o ${matchedClub.name}!\n\n📊 Informações:\n• Nome: ${playerData?.name || 'N/A'}\n• Posição: ${playerData?.position || 'N/A'}\n• Idade: ${playerData?.age || 'N/A'} anos\n• Categoria: ${playerData?.category || 'N/A'}\n\n🎯 Gostaria de conhecer mais sobre as oportunidades!`;
    window.open(`https://wa.me/5561996232814?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-elite p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/analysis")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">
            {isMatching ? 'Analisando...' : 'Seu Match'}
          </div>
          <div className="w-10" />
        </div>

        {isMatching ? (
          /* Loading Analysis Screen - 30s */
          <div className="space-y-8 animate-fade-in">
            {/* Visual */}
            <div className="relative flex items-center justify-center py-8">
              <div className="w-32 h-32 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border border-t-transparent border-r-accent/50 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center pulse-ring">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processando</span>
                <span className="text-primary font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-golden rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Rotating message */}
            <div className="min-h-[48px] flex items-center justify-center">
              <p className="text-sm text-center text-muted-foreground animate-fade-in" key={currentMessage}>
                {LOADING_MESSAGES[currentMessage]}
              </p>
            </div>

            {/* Disclaimer */}
            <Card className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Todas as análises são realizadas com base em métricas avançadas de <span className="text-foreground font-medium">Inteligência Artificial</span> e no perfil técnico do atleta.
                Para validação final, o resultado passa por <span className="text-foreground font-medium">análise da equipe de scout</span>.
              </p>
            </Card>
          </div>
        ) : matchedClub && (
          <div className="space-y-4 animate-fade-in">
            {/* Match Found */}
            <Card className="p-6 bg-card border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
                {matchedClub.logo}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Clube encontrado!</h2>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mt-2">
                <Star className="w-4 h-4" />
                {compatibility}% compatibilidade
              </div>
            </Card>

            {/* Urgency */}
            <Card className="p-3 border-accent/20 bg-accent/5">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="text-accent font-medium">Oportunidade limitada</span> — busca até {getUrgencyDate()}
                </p>
              </div>
            </Card>

            {/* Club details */}
            <Card className="p-6 bg-card border-border">
              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-foreground">{matchedClub.name}</h3>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {matchedClub.country} • {matchedClub.league}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="text-sm font-bold text-foreground">{matchedClub.founded}</div>
                  <div className="text-xs text-muted-foreground">Fundado</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="text-sm font-bold text-foreground">{matchedClub.players}</div>
                  <div className="text-xs text-muted-foreground">Jogadores</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  {isSub20 ? (
                    <>
                      <div className="text-sm font-bold text-primary">{matchedClub.currency} {matchedClub.monthlyOffer.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Oferta/mês</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-primary">R$ 8-23k</div>
                      <div className="text-xs text-muted-foreground">Faixa base</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge className="bg-muted text-muted-foreground border-0 text-xs">{matchedClub.category}</Badge>
                <Badge className="bg-primary/10 text-primary border-0 text-xs">{matchedClub.openPositions} vagas</Badge>
                {isSub20 && playerData?.dualCitizenshipCountry && (
                  <Badge className="bg-accent/10 text-accent border-0 text-xs">Cidadania compatível</Badge>
                )}
              </div>

              {isSub20 && (
                <div className="bg-accent/5 border border-accent/10 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-xs text-accent font-medium mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Projeção de Valorização
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Potencial de transferência internacional estimado. Mercado em alta para atletas Sub 20 com perfil compatível.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">{matchedClub.description}</p>
            </Card>

            {/* Why this club */}
            <Card className="p-5 bg-card border-border">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Por que este clube?
              </h4>
              <ul className="space-y-2">
                {getWhyMatch(matchedClub).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* CTA */}
            <Card className="p-6 bg-gradient-primary border-0">
              <div className="text-center space-y-3">
                <MessageCircle className="w-10 h-10 mx-auto text-primary-foreground" />
                <h3 className="text-lg font-bold text-primary-foreground">Entre em contato</h3>
                <p className="text-sm text-primary-foreground/80">Fale diretamente com o clube via WhatsApp</p>
                <Button variant="secondary" size="lg" className="w-full font-semibold" onClick={handleContact}>
                  📱 Falar via WhatsApp
                </Button>
              </div>
            </Card>

            {/* Navigation */}
            <div className="space-y-2 pt-2">
              <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => navigate("/history")}>
                Ver Histórico de Matches
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => navigate("/")}>
                Nova Análise
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Match;
