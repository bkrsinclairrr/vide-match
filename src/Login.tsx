import { useState } from "react"

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (senha === import.meta.env.VITE_SITE_PASSWORD) {
      localStorage.setItem("autenticado", "true")
      onLogin()
    } else {
      alert("Senha incorreta!")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-80 text-center">
        <h1 className="text-xl font-bold mb-4">Área Restrita</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            className="w-full p-2 mb-4 border rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
