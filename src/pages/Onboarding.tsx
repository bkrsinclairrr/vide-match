import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ArrowLeft, ArrowRight, Camera, Check, Zap, Globe, Layers, MapPin, Flag, User } from "lucide-react";
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

const STEPS = [
  { icon: User, label: "Vamos te conhecer", desc: "Conte-nos sobre você" },
  { icon: Flag, label: "Sua nacionalidade", desc: "Origem e cidadania" },
  { icon: Layers, label: "Sua posição", desc: "Posição principal" },
  { icon: Zap, label: "Sua categoria", desc: "Selecione sua categoria" },
  { icon: MapPin, label: "Quase lá!", desc: "Últimas informações" },
];

// Shared input style for steps 2-5 (original style, dark-adapted)
const selectCls = "mt-1 bg-white/5 border-white/10 text-white";
const labelCls2 = "text-white/80";

// Step 1 exclusive styles
const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all";
const labelCls = "block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2";

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
    setIsLoading(true);
    localStorage.setItem('playerData', JSON.stringify(playerData));
    try {
      const dataToSave = {
        nome: playerData.name, idade: parseInt(playerData.age),
        altura: parseFloat(playerData.height), peso: parseFloat(playerData.weight),
        melhor_pe: playerData.preferredFoot, nacionalidade: playerData.nationality,
        posicao: playerData.position, cidade: playerData.city,
        estado: playerData.state
      };
      await supabase.from('Atletas').insert([dataToSave]);
    } catch (err) {
      console.warn('Supabase insert failed (non-blocking):', err);
    }
    setIsLoading(false);
    navigate("/upload");
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

  const StepIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>
          <span className="text-xs text-white/30 font-semibold">{step}/{totalSteps}</span>
        </div>
      </header>

      {/* ── Progress ── */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i < step ? 'bg-amber-400' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
            <StepIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">{STEPS[step - 1].desc}</p>
            <h2 className="text-xl font-black">{STEPS[step - 1].label}</h2>
          </div>
          {step > 1 && (
            <div className="ml-auto flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">
              <Check className="w-3 h-3" />
              <span className="font-semibold">{step - 1} concluído{step - 1 !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <div className="rounded-3xl border border-white/5 bg-white/3 p-6 space-y-5 animate-fade-in">

          {/* ─── STEP 1 — Premium redesign ─── */}
          {step === 1 && (
            <>
              <div className="flex flex-col items-center py-2">
                <button onClick={() => fileInputRef.current?.click()} className="relative group">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 group-hover:border-amber-400/50 transition-colors flex items-center justify-center overflow-hidden bg-white/5">
                    {playerData.photo ? (
                      <img src={playerData.photo} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-white/30 group-hover:text-amber-400 transition-colors">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Foto</span>
                      </div>
                    )}
                  </div>
                  {playerData.photo && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <p className="text-xs text-white/30 mt-2">Foto (opcional)</p>
              </div>

              <div>
                <label className={labelCls}>Nome completo</label>
                <input className={inputCls} value={playerData.name}
                  onChange={(e) => setPlayerData({ ...playerData, name: e.target.value })}
                  placeholder="João Silva" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Idade</label>
                  <input type="number" className={inputCls} value={playerData.age}
                    onChange={(e) => setPlayerData({ ...playerData, age: e.target.value })}
                    placeholder="22" />
                </div>
                <div>
                  <label className={labelCls}>Altura cm</label>
                  <input type="number" className={inputCls} value={playerData.height}
                    onChange={(e) => setPlayerData({ ...playerData, height: e.target.value })}
                    placeholder="175" />
                </div>
                <div>
                  <label className={labelCls}>Peso kg</label>
                  <input type="number" className={inputCls} value={playerData.weight}
                    onChange={(e) => setPlayerData({ ...playerData, weight: e.target.value })}
                    placeholder="70" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Melhor pé</label>
                <div className="grid grid-cols-3 gap-2">
                  {["destro", "canhoto", "ambidestro"].map((foot) => (
                    <button key={foot} type="button"
                      onClick={() => setPlayerData({ ...playerData, preferredFoot: foot })}
                      className={`h-11 rounded-xl border text-sm font-semibold capitalize transition-all ${playerData.preferredFoot === foot
                          ? "border-amber-400 bg-amber-400/10 text-amber-400"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
                        }`}
                    >
                      {foot.charAt(0).toUpperCase() + foot.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 2 — Original style ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className={labelCls2}>Nacionalidade</Label>
                <Select value={playerData.nationality} onValueChange={(v) => setPlayerData({ ...playerData, nationality: v })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione seu país" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {countries.map((c) => <SelectItem key={c} value={c} className="focus:bg-white/10">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-white/5">
                <Label className={`${labelCls2} flex items-center gap-2`}>
                  <Globe className="w-4 h-4 text-amber-400" />
                  Possui dupla cidadania?
                </Label>
                <p className="text-xs text-white/40 mb-2">Isso pode ampliar suas oportunidades em clubes internacionais.</p>
                <Select value={playerData.hasDualCitizenship} onValueChange={(v) => setPlayerData({ ...playerData, hasDualCitizenship: v, dualCitizenshipCountry: v === 'Não' ? '' : playerData.dualCitizenshipCountry })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="Sim" className="focus:bg-white/10">Sim</SelectItem>
                    <SelectItem value="Não" className="focus:bg-white/10">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {playerData.hasDualCitizenship === 'Sim' && (
                <div className="animate-fade-in">
                  <Label className={labelCls2}>País da segunda cidadania</Label>
                  <Select value={playerData.dualCitizenshipCountry} onValueChange={(v) => setPlayerData({ ...playerData, dualCitizenshipCountry: v })}>
                    <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                      {countries.filter(c => c !== playerData.nationality).map((c) => <SelectItem key={c} value={c} className="focus:bg-white/10">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3 — Original style ─── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className={labelCls2}>Posição principal</Label>
                <Select value={playerData.position} onValueChange={(v) => setPlayerData({ ...playerData, position: v })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione sua posição" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {positions.map((p) => <SelectItem key={p} value={p} className="focus:bg-white/10">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ─── STEP 4 — Original style ─── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className={labelCls2}>Categoria</Label>
                <Select value={playerData.category} onValueChange={(v) => setPlayerData({ ...playerData, category: v })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione sua categoria" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="focus:bg-white/10">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ─── STEP 5 — Original style ─── */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className={labelCls2}>Estado</Label>
                <Select value={playerData.state} onValueChange={(v) => setPlayerData({ ...playerData, state: v, city: "" })}>
                  <SelectTrigger className={selectCls}><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {states.map((s) => <SelectItem key={s} value={s} className="focus:bg-white/10">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {playerData.state && (
                <div className="animate-fade-in">
                  <Label className={labelCls2}>Cidade</Label>
                  <CityAutocomplete
                    state={playerData.state}
                    value={playerData.city}
                    onChange={(city) => setPlayerData({ ...playerData, city })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky bottom CTA ── */}
      <div className="sticky bottom-0 border-t border-white/5 bg-black/90 backdrop-blur-xl px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-black font-black text-base rounded-2xl transition-all shadow-[0_0_40px_rgba(251,191,36,0.2)] enabled:hover:shadow-[0_0_60px_rgba(251,191,36,0.4)] active:scale-[0.98] py-3.5"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {step === totalSteps ? "Iniciar Análise" : "Continuar"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          {step < totalSteps && (
            <p className="text-center text-xs text-white/20 mt-2">
              {totalSteps - step} etapa{totalSteps - step !== 1 ? 's' : ''} restante{totalSteps - step !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
