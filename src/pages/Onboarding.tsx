import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ArrowLeft, User, MapPin, Trophy, Camera, Flag, Layers, Globe } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Sub 6", "Sub 7", "Sub 8", "Sub 9", "Sub 10",
  "Sub 11", "Sub 12", "Sub 13", "Sub 14", "Sub 15",
  "Sub 16", "Sub 17", "Sub 20"
];

const positions = [
  "Goleiro", "Lateral Direito", "Lateral Esquerdo", "Zagueiro",
  "Volante", "Meio-Campo", "Meia-Atacante",
  "Ponta Direita", "Ponta Esquerda", "Centroavante"
];

const states = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro",
  "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina",
  "São Paulo", "Sergipe", "Tocantins"
];

const countries = [
  "Brasil", "Argentina", "Uruguai", "Chile", "Peru", "Colômbia", "Equador", "Venezuela",
  "Portugal", "Espanha", "Itália", "França", "Inglaterra", "Alemanha", "Holanda", "Bélgica",
  "Estados Unidos", "México", "Canadá", "Japão", "Coreia do Sul", "China", "Austrália",
  "África do Sul", "Egito", "Marrocos", "Nigéria", "Gana", "Costa do Marfim", "Senegal",
  "Croácia", "Polônia", "Suíça", "Áustria", "Grécia", "Turquia", "Suécia", "Noruega",
  "Dinamarca", "Finlândia", "Islândia", "Irlanda", "Escócia", "País de Gales", "Romênia",
  "Sérvia", "Bulgária", "Hungria", "República Tcheca", "Eslováquia", "Ucrânia", "Rússia",
  "Israel", "Paraguai", "Bolívia"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [playerData, setPlayerData] = useState({
    name: "", age: "", height: "", weight: "",
    preferredFoot: "", nationality: "", position: "",
    state: "", city: "", photo: "", category: "",
    hasDualCitizenship: "", dualCitizenshipCountry: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 5;

  const savePlayerData = async () => {
    try {
      setIsLoading(true);
      const dataToSave = {
        nome: playerData.name, idade: parseInt(playerData.age),
        altura: parseFloat(playerData.height), peso: parseFloat(playerData.weight),
        melhor_pe: playerData.preferredFoot, nacionalidade: playerData.nationality,
        posicao: playerData.position, cidade: playerData.city,
        estado: playerData.state
      };
      const { error } = await supabase.from('Atletas').insert([dataToSave]);
      if (error) throw error;
      localStorage.setItem('playerData', JSON.stringify(playerData));
      toast({ title: "Sucesso!", description: "Dados salvos com sucesso!" });
      navigate("/upload");
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({ title: "Erro", description: "Erro ao salvar dados. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else savePlayerData();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPlayerData({ ...playerData, photo: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return playerData.name && playerData.age && playerData.height && playerData.weight && playerData.preferredFoot;
      case 2: return playerData.nationality && (playerData.hasDualCitizenship === 'Não' || (playerData.hasDualCitizenship === 'Sim' && playerData.dualCitizenshipCountry));
      case 3: return playerData.position;
      case 4: return playerData.category;
      case 5: return playerData.city && playerData.state;
      default: return false;
    }
  };

  const stepIcons = [User, Flag, Trophy, Layers, MapPin];
  const stepTitles = ["Vamos te conhecer", "Sua nacionalidade", "Sua posição", "Sua categoria", "Quase lá!"];
  const stepDescs = ["Conte-nos sobre você", "Origem e cidadania", "Posição principal", "Selecione sua categoria", "Últimas informações"];
  const StepIcon = stepIcons[step - 1];

  return (
    <div className="min-h-screen bg-gradient-elite p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm text-muted-foreground font-medium">{step} de {totalSteps}</div>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i < step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        {/* Content */}
        <Card className="p-6 bg-card border-border animate-fade-in">
          {/* Step Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <StepIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{stepTitles[step - 1]}</h2>
            <p className="text-sm text-muted-foreground">{stepDescs[step - 1]}</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-border mx-auto flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  {playerData.photo ? (
                    <img src={playerData.photo} alt="Foto" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <p className="text-xs text-muted-foreground mt-2">Foto (opcional)</p>
              </div>
              <div><Label className="text-foreground">Nome completo</Label><Input value={playerData.name} onChange={(e) => setPlayerData({ ...playerData, name: e.target.value })} placeholder="Seu nome" className="mt-1 bg-muted border-border" /></div>
              <div><Label className="text-foreground">Idade</Label><Input type="number" value={playerData.age} onChange={(e) => setPlayerData({ ...playerData, age: e.target.value })} placeholder="Sua idade" className="mt-1 bg-muted border-border" /></div>
              <div><Label className="text-foreground">Altura (cm)</Label><Input type="number" value={playerData.height} onChange={(e) => setPlayerData({ ...playerData, height: e.target.value })} placeholder="Ex: 175" className="mt-1 bg-muted border-border" /></div>
              <div><Label className="text-foreground">Peso (kg)</Label><Input type="number" value={playerData.weight} onChange={(e) => setPlayerData({ ...playerData, weight: e.target.value })} placeholder="Ex: 70" className="mt-1 bg-muted border-border" /></div>
              <div>
                <Label className="text-foreground">Melhor pé</Label>
                <Select value={playerData.preferredFoot} onValueChange={(v) => setPlayerData({ ...playerData, preferredFoot: v })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="destro">Destro</SelectItem>
                    <SelectItem value="canhoto">Canhoto</SelectItem>
                    <SelectItem value="ambidestro">Ambidestro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Nacionalidade</Label>
                <Select value={playerData.nationality} onValueChange={(v) => setPlayerData({ ...playerData, nationality: v })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione seu país" /></SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-border">
                <Label className="text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Possui dupla cidadania?
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Isso pode ampliar suas oportunidades em clubes internacionais.</p>
                <Select value={playerData.hasDualCitizenship} onValueChange={(v) => setPlayerData({ ...playerData, hasDualCitizenship: v, dualCitizenshipCountry: v === 'Não' ? '' : playerData.dualCitizenshipCountry })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {playerData.hasDualCitizenship === 'Sim' && (
                <div className="animate-fade-in">
                  <Label className="text-foreground">País da segunda cidadania</Label>
                  <Select value={playerData.dualCitizenshipCountry} onValueChange={(v) => setPlayerData({ ...playerData, dualCitizenshipCountry: v })}>
                    <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-60">
                      {countries.filter(c => c !== playerData.nationality).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-primary mt-1">✦ Aumenta compatibilidade com clubes deste país</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <Label className="text-foreground">Posição principal</Label>
              <Select value={playerData.position} onValueChange={(v) => setPlayerData({ ...playerData, position: v })}>
                <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione sua posição" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Categoria</Label>
                <Select value={playerData.category} onValueChange={(v) => setPlayerData({ ...playerData, category: v })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione sua categoria" /></SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {playerData.category && ["Sub 16", "Sub 17", "Sub 20"].includes(playerData.category) && (
                <div className={`p-4 rounded-xl border animate-fade-in ${playerData.category === 'Sub 20' ? 'border-accent/30 bg-accent/5' : 'border-border bg-muted/30'}`}>
                  {playerData.category === 'Sub 20' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-sm font-semibold text-accent">Transição Profissional</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Acesso a clubes brasileiros e internacionais. Projeção salarial individualizada por clube, estimativa de valorização e potencial de transferência internacional.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-semibold text-foreground">Base Nacional</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clubes brasileiros — Série A e B. Faixa salarial estimada para categoria de base: <span className="text-primary font-medium">R$ 8.000 a R$ 23.000</span>.
                      </p>
                      <p className="text-xs text-muted-foreground opacity-70">
                        Projeção média de mercado, não promessa contratual.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Estado</Label>
                <Select value={playerData.state} onValueChange={(v) => setPlayerData({ ...playerData, state: v, city: "" })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Selecione seu estado" /></SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <CityAutocomplete
                value={playerData.city}
                onChange={(v) => setPlayerData({ ...playerData, city: v })}
                selectedState={playerData.state}
                placeholder="Digite sua cidade..."
                label="Cidade"
              />
            </div>
          )}

          <Button className="w-full mt-6 bg-gradient-golden text-background font-semibold hover:opacity-90 h-12 rounded-xl"
            onClick={handleNext} disabled={!canProceed() || isLoading}>
            {isLoading ? "Salvando..." : step === totalSteps ? "Finalizar Cadastro" : "Continuar"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
