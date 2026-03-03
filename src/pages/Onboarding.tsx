import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ArrowLeft, ArrowRight, Camera, Check, Zap, Globe, Layers, MapPin, Flag, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  { icon: User, label: "Vamos te conhecer", desc: "Informações básicas" },
  { icon: Flag, label: "Sua nacionalidade", desc: "Origem e cidadania" },
  { icon: Layers, label: "Sua posição", desc: "Onde você joga" },
  { icon: Zap, label: "Sua categoria", desc: "Faixa etária" },
  { icon: MapPin, label: "Quase lá!", desc: "Localização" },
];

// ── Color tokens ─────────────────────────────────────────────────────────────
// BG: #0D0D0F (warm near-black, easier on eyes than pure #000)
// Primary: amber-400 (#FBBF24) — action, selected, progress
// Success: emerald-400 (#34D399) — completed steps
// Surface: white/4 — card backgrounds
// Border default: white/8
// Border focus: amber-400/60
// Text primary: white
// Text secondary: white/60
// Text hint: white/35

// Input style — solid concrete dark bg so white text is always legible
const inputStyle = {
  background: "#1E1E22",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
};
const inputCls = [
  "w-full rounded-xl px-4 h-12 text-sm",
  "placeholder:text-white/30",
  "focus:outline-none focus:ring-2 focus:ring-amber-400/60",
  "transition-all duration-200"
].join(" ");

// Select dropdown — same solid bg
const selectTriggerCls = "h-12 rounded-xl text-white focus:ring-amber-400/60 focus:border-amber-400/50";
const selectTriggerStyle = { background: "#1E1E22", border: "1px solid rgba(255,255,255,0.10)" };

// Required field label with amber dot
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
    <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">{children}</span>
  </div>
);

// Pill selector button (Step 1 foot selection, used elsewhere)
const PillBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={[
      "h-11 rounded-xl border text-sm font-semibold transition-all duration-200",
      active
        ? "border-amber-400 bg-amber-400/12 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
        : "border-white/8 bg-white/3 text-white/45 hover:border-white/20 hover:text-white/80 hover:bg-white/6"
    ].join(" ")}
  >
    {children}
  </button>
);

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

  // Scroll to top whenever step changes (critical for mobile UX)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  const totalSteps = 5;

  const savePlayerData = async () => {
    setIsLoading(true);
    localStorage.setItem('playerData', JSON.stringify(playerData));
    try {
      await supabase.from('Atletas').insert([{
        nome: playerData.name, idade: parseInt(playerData.age),
        altura: parseFloat(playerData.height), peso: parseFloat(playerData.weight),
        melhor_pe: playerData.preferredFoot, nacionalidade: playerData.nationality,
        posicao: playerData.position, cidade: playerData.city, estado: playerData.state
      }]);
    } catch (err) { console.warn('Supabase insert failed (non-blocking):', err); }
    setIsLoading(false);
    navigate("/upload");
  };

  const handleNext = () => { if (step < totalSteps) setStep(step + 1); else savePlayerData(); };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPlayerData({ ...playerData, photo: ev.target?.result as string });
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
  const completedSteps = step - 1;

  return (
    <div className="text-white font-sans antialiased" style={{ background: "#0D0D0F", minHeight: "100svh" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl" style={{ background: "rgba(13,13,15,0.92)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/8 hover:border-white/18 bg-white/4 hover:bg-white/8 transition-all">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.4)]">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>

          {/* Step counter with semantic color */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={[
                "rounded-full transition-all duration-500",
                i < completedSteps ? "w-2 h-2 bg-emerald-400" :
                  i === step - 1 ? "w-2 h-2 bg-amber-400" :
                    "w-1.5 h-1.5 bg-white/15"
              ].join(" ")} />
            ))}
          </div>
        </div>

        {/* Progress bar: amber → emerald gradient as you advance */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${(step / totalSteps) * 100}%`,
              background: step === totalSteps
                ? "linear-gradient(to right, #FBBF24, #34D399)"
                : "linear-gradient(to right, #FBBF24, #FB923C)"
            }}
          />
        </div>
      </header>

      {/* ── Step indicator ── */}
      <div className="max-w-lg mx-auto w-full px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          {/* Icon badge — amber when active */}
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,120,0,0.10))", border: "1px solid rgba(251,191,36,0.25)" }}>
            <StepIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">{STEPS[step - 1].desc}</p>
            <h2 className="text-lg font-black leading-tight">{STEPS[step - 1].label}</h2>
          </div>
          {/* Completed badge — emerald signals "done" semantically */}
          {completedSteps > 0 && (
            <div className="ml-auto flex items-center gap-1.5 border rounded-full px-2.5 py-1"
              style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)" }}>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">{completedSteps}/{totalSteps}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Form content ── */}
      <main className="max-w-lg mx-auto w-full px-4 pb-8">
        <div className="rounded-3xl p-6 space-y-5 animate-fade-in"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* ── STEP 1 — Optimized ── */}
          {step === 1 && (
            <>
              {/* Photo upload — larger, prominent */}
              <div className="flex flex-col items-center pt-1 pb-2">
                <button onClick={() => fileInputRef.current?.click()} className="relative group">
                  <div
                    className={[
                      "w-28 h-28 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden",
                      playerData.photo
                        ? "border-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.30)]"
                        : "border-white/20 group-hover:border-amber-400/50 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                    ].join(" ")}
                    style={{ background: "#1A1A1E" }}
                  >
                    {playerData.photo ? (
                      <img src={playerData.photo} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 transition-colors"
                        style={{ color: playerData.photo ? "transparent" : "rgba(255,255,255,0.28)" }}>
                        <Camera className="w-7 h-7 group-hover:text-amber-400 transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-amber-400 transition-colors">Foto</span>
                      </div>
                    )}
                  </div>
                  {playerData.photo && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <p className="text-xs mt-3 font-medium" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {playerData.photo ? "Toque para trocar" : "Foto de perfil — opcional"}
                </p>
              </div>

              {/* Subtle divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.22)" }}>dados do atleta</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Name */}
              <div>
                <FieldLabel>Nome completo</FieldLabel>
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={playerData.name}
                  onChange={(e) => setPlayerData({ ...playerData, name: e.target.value })}
                  placeholder="João Silva"
                />
              </div>

              {/* Age / Height / Weight — with floating unit label */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Idade", key: "age", placeholder: "22", unit: "anos" },
                  { label: "Altura", key: "height", placeholder: "175", unit: "cm" },
                  { label: "Peso", key: "weight", placeholder: "70", unit: "kg" },
                ].map(({ label, key, placeholder, unit }) => (
                  <div key={key}>
                    <FieldLabel>{label}</FieldLabel>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={inputCls + " pr-8"}
                        style={inputStyle}
                        value={playerData[key as keyof typeof playerData]}
                        onChange={(e) => setPlayerData({ ...playerData, [key]: e.target.value })}
                        placeholder={placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.28)" }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preferred foot */}
              <div>
                <FieldLabel>Melhor pé</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {["Destro", "Canhoto", "Ambidestro"].map((foot) => (
                    <PillBtn
                      key={foot}
                      active={playerData.preferredFoot === foot.toLowerCase()}
                      onClick={() => setPlayerData({ ...playerData, preferredFoot: foot.toLowerCase() })}
                    >
                      {foot}
                    </PillBtn>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2 — Nationality ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>Nacionalidade</FieldLabel>
                <Select value={playerData.nationality} onValueChange={(v) => setPlayerData({ ...playerData, nationality: v })}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione seu país" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {countries.map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <FieldLabel>Dupla cidadania?</FieldLabel>
                </div>
                <p className="text-xs text-white/40 -mt-2">Amplia oportunidades em clubes internacionais.</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Sim", "Não"].map((opt) => (
                    <PillBtn key={opt}
                      active={playerData.hasDualCitizenship === opt}
                      onClick={() => setPlayerData({ ...playerData, hasDualCitizenship: opt, dualCitizenshipCountry: opt === 'Não' ? '' : playerData.dualCitizenshipCountry })}>
                      {opt}
                    </PillBtn>
                  ))}
                </div>
              </div>

              {playerData.hasDualCitizenship === 'Sim' && (
                <div className="animate-fade-in">
                  <FieldLabel>Segunda cidadania</FieldLabel>
                  <Select value={playerData.dualCitizenshipCountry} onValueChange={(v) => setPlayerData({ ...playerData, dualCitizenshipCountry: v })}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                      {countries.filter(c => c !== playerData.nationality).map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Position ── */}
          {step === 3 && (
            <div>
              <FieldLabel>Posição principal</FieldLabel>
              <Select value={playerData.position} onValueChange={(v) => setPlayerData({ ...playerData, position: v })}>
                <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione sua posição" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {positions.map((p) => <SelectItem key={p} value={p} className="focus:bg-amber-400/10 focus:text-amber-300">{p}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Visual confirmation when selected */}
              {playerData.position && (
                <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 animate-fade-in"
                  style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-300">{playerData.position}</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 — Category ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Categoria / Faixa etária</FieldLabel>
                <Select value={playerData.category} onValueChange={(v) => setPlayerData({ ...playerData, category: v })}>
                  <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione sua categoria" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-52 overflow-y-auto">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Category info cards */}
              {playerData.category && (() => {
                const cat = playerData.category;

                // Sub 6–10: Formação inicial
                if (["Sub 6", "Sub 7", "Sub 8", "Sub 9", "Sub 10"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/8 animate-fade-in" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-xs text-white/40 leading-relaxed">
                      <span className="text-white/60 font-semibold">Formação Inicial.</span>{" "}
                      Foco em fundamentos técnicos e coordenação motora. A análise identifica clubes com programas de base estruturados para esse perfil.
                    </p>
                  </div>
                );

                // Sub 11–13: Desenvolvimento
                if (["Sub 11", "Sub 12", "Sub 13"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/8 animate-fade-in" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-xs text-white/40 leading-relaxed">
                      <span className="text-white/60 font-semibold">Desenvolvimento Técnico.</span>{" "}
                      Fase de especialização tática e aprimoramento por posição. Identificamos clubes com academias reconhecidas para essa faixa.
                    </p>
                  </div>
                );

                // Sub 14–15: Pré-competitivo
                if (["Sub 14", "Sub 15"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/8 animate-fade-in" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-xs text-white/40 leading-relaxed">
                      <span className="text-white/60 font-semibold">Base Competitiva.</span>{" "}
                      Transição para competições regionais e estaduais. Boa janela para ser visto por olheiros de clubes profissionais.
                    </p>
                  </div>
                );

                // Sub 16–17: Base nacional com faixa salarial
                if (["Sub 16", "Sub 17"].includes(cat)) return (
                  <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 animate-fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-sm font-semibold text-amber-300">Base Nacional</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Clubes brasileiros — Série A e B. Faixa salarial estimada:{" "}
                        <span className="text-amber-400 font-semibold">R$ 8.000 a R$ 23.000</span>.
                      </p>
                      <p className="text-xs text-white/30">Projeção média de mercado, não promessa contratual.</p>
                    </div>
                  </div>
                );

                // Sub 20: Transição profissional
                if (cat === "Sub 20") return (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-400">Transição Profissional</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Acesso a clubes brasileiros <strong className="text-white/70">e internacionais</strong>. Projeção salarial individualizada, estimativa de valorização e potencial de transferência.
                      </p>
                    </div>
                  </div>
                );

                return null;
              })()}
            </div>
          )}


          {/* ── STEP 5 — Location ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Estado</FieldLabel>
                <Select value={playerData.state} onValueChange={(v) => setPlayerData({ ...playerData, state: v, city: "" })}>
                  <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {states.map((s) => <SelectItem key={s} value={s} className="focus:bg-amber-400/10 focus:text-amber-300">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {playerData.state && (
                <div className="animate-fade-in">
                  <FieldLabel>Cidade</FieldLabel>
                  <CityAutocomplete
                    selectedState={playerData.state}
                    value={playerData.city}
                    onChange={(city) => setPlayerData({ ...playerData, city })}
                  />
                </div>
              )}

              {/* Location context tip */}
              <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  Sua localização ajuda o algoritmo a identificar clubes na sua região e avaliar mobilidade geográfica.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── CTA — directly below form, no floating ── */}
        <div className="mt-4 pb-4 space-y-2">
          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className={[
              "w-full flex items-center justify-center gap-3 font-black text-base rounded-2xl py-3.5 transition-all duration-200",
              canProceed() && !isLoading
                ? "text-black shadow-[0_0_32px_rgba(251,191,36,0.3)] hover:shadow-[0_0_48px_rgba(251,191,36,0.45)] active:scale-[0.98]"
                : "text-white/30 cursor-not-allowed"
            ].join(" ")}
            style={canProceed() && !isLoading
              ? { background: "linear-gradient(135deg, #FBBF24, #F97316)" }
              : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
            }
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

          {step < totalSteps ? (
            <p className="text-center text-[11px] text-white/25 font-medium">
              {totalSteps - step} etapa{totalSteps - step !== 1 ? 's' : ''} restante{totalSteps - step !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-center text-[11px] font-semibold" style={{ color: "rgba(52,211,153,0.6)" }}>
              ✓ Tudo preenchido — pronto para análise
            </p>
          )}
        </div>
      </main>


    </div>
  );
};

export default Onboarding;
