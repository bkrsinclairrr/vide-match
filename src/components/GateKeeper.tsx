import { useState, useEffect, ReactNode } from "react"
import { Trophy, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"

const GATE_KEY = "zyron_access_granted"
const ACCESS_PASSWORD = "@Zyron2025"

interface GateKeeperProps {
  children: ReactNode
}

export default function GateKeeper({ children }: GateKeeperProps) {
  const [granted, setGranted] = useState<boolean>(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Verifica se já tem acesso salvo
  useEffect(() => {
    const saved = sessionStorage.getItem(GATE_KEY)
    if (saved === "true") setGranted(true)
    setChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      if (password === ACCESS_PASSWORD) {
        sessionStorage.setItem(GATE_KEY, "true")
        setGranted(true)
      } else {
        setError(true)
        setShaking(true)
        setLoading(false)
        setTimeout(() => setShaking(false), 600)
        setTimeout(() => setError(false), 3000)
        setPassword("")
      }
    }, 700)
  }

  if (checking) return null

  if (granted) return <>{children}</>

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow Effect */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
          animation: "fadeInUp 0.5s ease",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "36px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
              border: "1px solid rgba(99,102,241,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              boxShadow: "0 8px 32px rgba(99,102,241,0.2)",
            }}
          >
            <Trophy size={28} color="#818cf8" />
          </div>

          <h1 style={{ color: "#f8fafc", fontSize: "28px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
            Zyron
          </h1>
          <p style={{ color: "rgba(148,163,184,0.7)", fontSize: "13px", margin: "6px 0 0", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}>
            Acesso Restrito
          </p>
        </div>

        {/* Lock Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "28px",
          }}
        >
          <ShieldCheck size={16} color="#818cf8" />
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            Esta plataforma está em acesso exclusivo para <strong style={{ color: "#c4b5fd" }}>influenciadores selecionados</strong>.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: 500, marginBottom: "8px", letterSpacing: "0.3px" }}
            >
              Senha de Acesso
            </label>
            <div
              style={{
                position: "relative",
                animation: shaking ? "shake 0.5s ease" : "none",
              }}
            >
              <Lock
                size={16}
                color={error ? "#f87171" : "#64748b"}
                style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••••"
                autoFocus
                style={{
                  width: "100%",
                  height: "52px",
                  background: error ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "12px",
                  padding: "0 48px",
                  color: "#f8fafc",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s ease",
                  letterSpacing: "2px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.border = "1px solid rgba(99,102,241,0.5)"; (e.target as HTMLInputElement).style.background = "rgba(99,102,241,0.06)" }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.border = error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)"; (e.target as HTMLInputElement).style.background = error ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#64748b" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error message */}
            <div style={{ height: "20px", marginTop: "6px" }}>
              {error && (
                <p style={{ color: "#f87171", fontSize: "12px", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                  ✕ Senha incorreta. Verifique e tente novamente.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              height: "52px",
              background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: !password ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              letterSpacing: "-0.2px",
              boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.3)",
            }}
          >
            {loading ? (
              <>
                <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Verificando...
              </>
            ) : (
              "Acessar Plataforma"
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "rgba(100,116,139,0.6)", fontSize: "11px", marginTop: "28px", marginBottom: 0, lineHeight: 1.6 }}>
          Plataforma em fase beta fechada.<br />
          Apenas influenciadores convidados têm acesso.
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
