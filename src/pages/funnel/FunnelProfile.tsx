import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { ArrowLeft, ArrowRight, Camera, Check, Zap, Globe, Layers, MapPin, Flag, User } from "lucide-react"
import { useStepTransition } from "@/hooks/useScrollAnimations"
import { CATEGORIES, POSITIONS, STATES, COUNTRIES } from "@/data/football"
import { FUNNEL_ROUTES, loadPlayerData, savePlayerData, type PlayerData } from "@/lib/funnel"
import FunnelLegalMenu from "./FunnelLegalMenu"

const STEPS = [
  { icon: User, label: "Vamos te conhecer", desc: "Informações básicas" },
  { icon: Flag, label: "Sua nacionalidade", desc: "Origem e cidadania" },
  { icon: Layers, label: "Sua posição", desc: "Onde você joga" },
  { icon: Zap, label: "Sua categoria", desc: "Faixa etária" },
  { icon: MapPin, label: "Quase lá!", desc: "Localização" },
]

const inputStyle = {
  background: "#1E1E22",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
}
const inputCls = [
  "w-full rounded-xl px-4 h-12 text-base",
  "placeholder:text-white/45",
  "focus:outline-none focus:ring-2 focus:ring-amber-400/60",
  "transition-all duration-200",
].join(" ")

const selectTriggerCls = "h-12 rounded-xl text-base text-white focus:ring-amber-400/60 focus:border-amber-400/50"
const selectTriggerStyle = { background: "#1E1E22", border: "1px solid rgba(255,255,255,0.14)" }

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
    <span className="text-xs font-semibold text-white/75 uppercase tracking-widest">{children}</span>
  </div>
)

const PillBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={[
      "h-11 rounded-xl border text-sm font-semibold transition-all duration-200",
      active
        ? "border-amber-400 bg-amber-400/12 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
        : "border-white/15 bg-white/[0.06] text-white/70 hover:border-amber-400/40 hover:text-white hover:bg-white/10",
    ].join(" ")}
  >
    {children}
  </button>
)

const TOTAL_STEPS = 5

export default function FunnelProfile() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [playerData, setPlayerData] = useState<PlayerData>(() => loadPlayerData())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useStepTransition(cardRef, step)

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  // Persistência a cada tecla: se a pessoa fechar e voltar, nada se perde.
  useEffect(() => {
    savePlayerData(playerData)
  }, [playerData])

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }
    // Fim do formulário público → envio de vídeo (ainda sem login),
    // igual ao fluxo tradicional (Onboarding → Upload). A conta só é
    // criada depois, na saída do upload.
    savePlayerData(playerData)
    navigate(FUNNEL_ROUTES.upload)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else navigate(FUNNEL_ROUTES.home)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPlayerData({ ...playerData, photo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return Boolean(playerData.name && playerData.age && playerData.height && playerData.weight && playerData.preferredFoot)
      case 2: return Boolean(playerData.nationality && (playerData.hasDualCitizenship === "Não" || (playerData.hasDualCitizenship === "Sim" && playerData.dualCitizenshipCountry)))
      case 3: return Boolean(playerData.position)
      case 4: return Boolean(playerData.category)
      case 5: return Boolean(playerData.city && playerData.state)
      default: return false
    }
  }

  const StepIcon = STEPS[step - 1].icon
  const completedSteps = step - 1

  return (
    <div className="text-white font-sans antialiased" style={{ background: "#0D0D0F", minHeight: "100svh" }}>

      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-sm" style={{ background: "rgba(13,13,15,0.92)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.06] hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4 text-white/75" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.4)]">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold text-sm tracking-tight">ZYRON</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={[
                  "rounded-full transition-all duration-500",
                  i < completedSteps ? "w-2 h-2 bg-emerald-400" :
                    i === step - 1 ? "w-2 h-2 bg-amber-400" :
                      "w-1.5 h-1.5 bg-white/30",
                ].join(" ")} />
              ))}
            </div>
            <FunnelLegalMenu tone="white" />
          </div>
        </div>

        <div className="h-0.5 bg-white/10">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: step === TOTAL_STEPS
                ? "linear-gradient(to right, #FBBF24, #34D399)"
                : "linear-gradient(to right, #FBBF24, #FB923C)",
            }}
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,120,0,0.10))", border: "1px solid rgba(251,191,36,0.25)" }}>
            <StepIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">{STEPS[step - 1].desc}</p>
            <h2 className="text-lg font-black leading-tight">{STEPS[step - 1].label}</h2>
          </div>
          {completedSteps > 0 && (
            <div className="ml-auto flex items-center gap-1.5 border rounded-full px-2.5 py-1"
              style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)" }}>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">{completedSteps}/{TOTAL_STEPS}</span>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-lg mx-auto w-full px-4 pb-8">
        <div ref={cardRef} className="rounded-3xl p-6 space-y-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>

          {step === 1 && (
            <>
              <div className="flex flex-col items-center pt-1 pb-2">
                <button onClick={() => fileInputRef.current?.click()} className="relative group">
                  <div
                    className={[
                      "w-28 h-28 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden",
                      playerData.photo
                        ? "border-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.30)]"
                        : "border-white/35 group-hover:border-amber-400/70 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.25)]",
                    ].join(" ")}
                    style={{ background: "#1A1A1E" }}
                  >
                    {playerData.photo ? (
                      <img src={playerData.photo} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
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
                <p className="text-xs mt-3 font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {playerData.photo ? "Toque para trocar" : "Foto de perfil — opcional"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>dados do atleta</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

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

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Idade", key: "age" as const, placeholder: "22", unit: "anos" },
                  { label: "Altura", key: "height" as const, placeholder: "175", unit: "cm" },
                  { label: "Peso", key: "weight" as const, placeholder: "70", unit: "kg" },
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
                        value={playerData[key]}
                        onChange={(e) => setPlayerData({ ...playerData, [key]: e.target.value })}
                        placeholder={placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.55)" }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

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

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>Nacionalidade</FieldLabel>
                <Select value={playerData.nationality} onValueChange={(v) => setPlayerData({ ...playerData, nationality: v })}>
                  <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione seu país" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <FieldLabel>Dupla cidadania?</FieldLabel>
                </div>
                <p className="text-xs text-white/65 -mt-2">Amplia oportunidades em clubes internacionais.</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Sim", "Não"].map((opt) => (
                    <PillBtn key={opt}
                      active={playerData.hasDualCitizenship === opt}
                      onClick={() => setPlayerData({ ...playerData, hasDualCitizenship: opt, dualCitizenshipCountry: opt === "Não" ? "" : playerData.dualCitizenshipCountry })}>
                      {opt}
                    </PillBtn>
                  ))}
                </div>
              </div>

              {playerData.hasDualCitizenship === "Sim" && (
                <div className="animate-fade-in">
                  <FieldLabel>Segunda cidadania</FieldLabel>
                  <Select value={playerData.dualCitizenshipCountry} onValueChange={(v) => setPlayerData({ ...playerData, dualCitizenshipCountry: v })}>
                    <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione o país" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                      {COUNTRIES.filter((c) => c !== playerData.nationality).map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <FieldLabel>Posição principal</FieldLabel>
              <Select value={playerData.position} onValueChange={(v) => setPlayerData({ ...playerData, position: v })}>
                <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione sua posição" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  {POSITIONS.map((p) => <SelectItem key={p} value={p} className="focus:bg-amber-400/10 focus:text-amber-300">{p}</SelectItem>)}
                </SelectContent>
              </Select>

              {playerData.position && (
                <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 animate-fade-in"
                  style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-300">{playerData.position}</span>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Categoria / Faixa etária</FieldLabel>
                <Select value={playerData.category} onValueChange={(v) => setPlayerData({ ...playerData, category: v })}>
                  <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione sua categoria" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-80 overflow-y-auto">
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="focus:bg-amber-400/10 focus:text-amber-300 h-10">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {playerData.category && (() => {
                const cat = playerData.category

                if (["Sub 6", "Sub 7", "Sub 8", "Sub 9", "Sub 10"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/14 animate-fade-in" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <span className="text-white/90 font-semibold">Formação Inicial.</span>{" "}
                      Foco em fundamentos técnicos e coordenação motora. A análise identifica clubes com programas de base estruturados para esse perfil.
                    </p>
                  </div>
                )

                if (["Sub 11", "Sub 12", "Sub 13"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/14 animate-fade-in" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <span className="text-white/90 font-semibold">Desenvolvimento Técnico.</span>{" "}
                      Fase de especialização tática e aprimoramento por posição. Identificamos clubes com academias reconhecidas para essa faixa.
                    </p>
                  </div>
                )

                if (["Sub 14", "Sub 15"].includes(cat)) return (
                  <div className="p-3 rounded-xl border border-white/14 animate-fade-in" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <span className="text-white/90 font-semibold">Base Competitiva.</span>{" "}
                      Transição para competições regionais e estaduais. Boa janela para ser visto por olheiros de clubes profissionais.
                    </p>
                  </div>
                )

                if (["Sub 16", "Sub 17", "Sub 18", "Sub 19"].includes(cat)) return (
                  <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 animate-fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-sm font-semibold text-amber-300">Base Nacional</span>
                      </div>
                      <p className="text-xs text-white/75 leading-relaxed">
                        Clubes brasileiros — Série A e B. Faixa salarial estimada:{" "}
                        <span className="text-amber-400 font-semibold">R$ 8.000 a R$ 23.000</span>.
                      </p>
                      <p className="text-xs text-white/60">Projeção média de mercado, não promessa contratual.</p>
                    </div>
                  </div>
                )

                if (cat === "Sub 20") return (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-400">Transição Profissional</span>
                      </div>
                      <p className="text-xs text-white/75 leading-relaxed">
                        Acesso a clubes brasileiros <strong className="text-white/95">e internacionais</strong>. Projeção salarial individualizada, estimativa de valorização e potencial de transferência.
                      </p>
                    </div>
                  </div>
                )

                return null
              })()}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Estado</FieldLabel>
                <Select value={playerData.state} onValueChange={(v) => setPlayerData({ ...playerData, state: v, city: "" })}>
                  <SelectTrigger className={selectTriggerCls} style={selectTriggerStyle}><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                    {STATES.map((s) => <SelectItem key={s} value={s} className="focus:bg-amber-400/10 focus:text-amber-300">{s}</SelectItem>)}
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

              <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90 leading-relaxed">
                  Sua localização ajuda o algoritmo a identificar clubes na sua região e avaliar mobilidade geográfica.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pb-4 space-y-2">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={[
              "w-full flex items-center justify-center gap-3 font-black text-base rounded-2xl py-3.5 transition-all duration-200",
              canProceed()
                ? "text-black shadow-[0_0_32px_rgba(251,191,36,0.3)] hover:shadow-[0_0_48px_rgba(251,191,36,0.45)] active:scale-[0.98]"
                : "text-white/45 cursor-not-allowed",
            ].join(" ")}
            style={canProceed()
              ? { background: "linear-gradient(135deg, #FBBF24, #F97316)" }
              : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {step === TOTAL_STEPS ? "Enviar meu vídeo" : "Continuar"}
            <ArrowRight className="w-5 h-5" />
          </button>

          {step < TOTAL_STEPS ? (
            <p className="text-center text-[11px] text-white/55 font-medium">
              {TOTAL_STEPS - step} etapa{TOTAL_STEPS - step !== 1 ? "s" : ""} restante{TOTAL_STEPS - step !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-center text-[11px] font-semibold text-white/55">
              Próximo passo: enviar o vídeo de performance
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
