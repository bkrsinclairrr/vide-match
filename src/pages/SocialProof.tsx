import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Award, TrendingUp } from "lucide-react";

const SocialProof = () => {
  const testimonials = [
    {
      name: "Carlos Silva",
      age: 19,
      position: "Atacante",
      club: "América-MG",
      photo: "👨",
      quote: "Através do Zyron consegui uma oportunidade no América-MG. Em 3 meses já estava treinando com o time principal!",
      rating: 5
    },
    {
      name: "Maria Santos",
      age: 17,
      position: "Meio-campo",
      club: "Santos FC Feminino",
      photo: "👩",
      quote: "O app mudou minha vida! Recebi uma proposta do Santos FC e hoje sou profissional. Recomendo para todos os jogadores!",
      rating: 5
    },
    {
      name: "João Oliveira",
      age: 21,
      position: "Zagueiro",
      club: "Ceará SC",
      photo: "👨",
      quote: "Match de 92% com o Ceará SC. Em uma semana já estava assinando contrato. O algoritmo é impressionante!",
      rating: 5
    }
  ];

  const stats = [
    { icon: Users, value: "15.847", label: "Jogadores Cadastrados" },
    { icon: Award, value: "247", label: "Clubes Parceiros" },
    { icon: TrendingUp, value: "89%", label: "Taxa de Sucesso" },
    { icon: Star, value: "4.9", label: "Avaliação Média" }
  ];

  const partnerClubs = [
    "🇧🇷 América-MG", "🇧🇷 Ceará SC", "🇧🇷 Fortaleza EC", "🇧🇷 Cuiabá EC",
    "🇦🇷 Estudiantes", "🇦🇷 Newell's Old Boys", "🇵🇹 Belenenses", "🇪🇸 Mirandés",
    "🇮🇹 Cagliari", "🇺🇸 Chicago Fire", "🇯🇵 Kashima Antlers", "🇿🇦 Orlando Pirates"
  ];

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <Card className="p-6 bg-white shadow-strong border-0">
        <h3 className="text-xl font-bold text-center mb-6">
          Números que impressionam
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Testimonials */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center text-white">
          Histórias de sucesso
        </h3>
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="p-4 bg-white shadow-medium border-0 animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{testimonial.photo}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-sm">{testimonial.name}, {testimonial.age}</h4>
                  <Badge variant="outline" className="text-xs">{testimonial.position}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  📍 {testimonial.club}
                </p>
                <p className="text-sm italic">"{testimonial.quote}"</p>
                <div className="flex mt-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Partner Clubs */}
      <Card className="p-6 bg-white shadow-strong border-0">
        <h3 className="text-lg font-bold text-center mb-4">
          Clubes Parceiros
        </h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          {partnerClubs.map((club, index) => (
            <div key={index} className="text-xs py-2 px-3 bg-accent/10 rounded-lg">
              {club}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          + mais de 900 clubes em todo o mundo
        </p>
      </Card>
    </div>
  );
};

export default SocialProof;