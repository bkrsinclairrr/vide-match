import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ArrowLeft, User, MapPin, Trophy, Camera, Flag } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [playerData, setPlayerData] = useState({
    name: "",
    age: "",
    nationality: "",
    position: "",
    city: "",
    experience: "",
    photo: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const positions = [
    "Goleiro",
    "Lateral Direito",
    "Lateral Esquerdo", 
    "Zagueiro",
    "Volante",
    "Meio-Campo",
    "Meia-Atacante",
    "Ponta Direita",
    "Ponta Esquerda",
    "Centroavante"
  ];

  const experiences = [
    "Iniciante (0-2 anos)",
    "Amador (3-5 anos)",
    "Semi-profissional (6-10 anos)",
    "Profissional (10+ anos)"
  ];

  const countries = [
    "Brasil", "Argentina", "Uruguai", "Chile", "Peru", "Colômbia", "Equador", "Venezuela",
    "Portugal", "Espanha", "Itália", "França", "Inglaterra", "Alemanha", "Holanda", "Bélgica",
    "Estados Unidos", "México", "Canadá", "Japão", "Coreia do Sul", "China", "Austrália",
    "África do Sul", "Egito", "Marrocos", "Nigéria", "Gana", "Costa do Marfim", "Senegal"
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save player data to localStorage
      localStorage.setItem('playerData', JSON.stringify(playerData));
      navigate("/upload");
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPlayerData({ ...playerData, photo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return playerData.name && playerData.age;
      case 2:
        return playerData.nationality;
      case 3:
        return playerData.position;
      case 4:
        return playerData.city && playerData.experience;
      default:
        return false;
    }
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
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-medium">
            {step} de 4
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <Card className="p-6 bg-white shadow-strong border-0 animate-fade-in">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Vamos te conhecer</h2>
                <p className="text-muted-foreground">Conte-nos sobre você e adicione sua foto</p>
              </div>
              
              <div className="space-y-4">
                {/* Photo Upload */}
                <div className="text-center">
                  <Label>Sua foto (opcional)</Label>
                  <div className="mt-2 flex justify-center">
                    <div 
                      className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {playerData.photo ? (
                        <img 
                          src={playerData.photo} 
                          alt="Foto do jogador" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique para adicionar sua foto
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={playerData.name}
                    onChange={(e) => setPlayerData({...playerData, name: e.target.value})}
                    placeholder="Seu nome"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={playerData.age}
                    onChange={(e) => setPlayerData({...playerData, age: e.target.value})}
                    placeholder="Sua idade"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Sua nacionalidade</h2>
                <p className="text-muted-foreground">Qual é o seu país de origem?</p>
              </div>
              
              <div>
                <Label>Nacionalidade</Label>
                <Select 
                  value={playerData.nationality} 
                  onValueChange={(value) => setPlayerData({...playerData, nationality: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione seu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Sua posição</h2>
                <p className="text-muted-foreground">Qual é sua posição principal?</p>
              </div>
              
              <div>
                <Label>Posição principal</Label>
                <Select 
                  value={playerData.position} 
                  onValueChange={(value) => setPlayerData({...playerData, position: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione sua posição" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Quase lá!</h2>
                <p className="text-muted-foreground">Últimas informações</p>
              </div>
              
               <div className="space-y-4">
                 <CityAutocomplete
                   value={playerData.city}
                   onChange={(value) => setPlayerData({...playerData, city: value})}
                   placeholder="Digite sua cidade..."
                   label="Cidade"
                 />
                
                <div>
                  <Label>Experiência</Label>
                  <Select 
                    value={playerData.experience} 
                    onValueChange={(value) => setPlayerData({...playerData, experience: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seu nível de experiência" />
                    </SelectTrigger>
                    <SelectContent>
                      {experiences.map((exp) => (
                        <SelectItem key={exp} value={exp}>
                          {exp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button 
            className="w-full mt-8 bg-gradient-primary hover:opacity-90"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 4 ? "Finalizar" : "Continuar"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;