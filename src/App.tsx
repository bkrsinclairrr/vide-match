import { useState, useEffect } from "react"
import Login from "./Login"
import Home from "./Home"

function App() {
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    // Se já fez login antes, mantém autenticado
    const auth = localStorage.getItem("autenticado")
    if (auth === "true") {
      setAutenticado(true)
    }
  }, [])

  return (
    <>
      {autenticado ? (
        <Home />
      ) : (
        <Login onLogin={() => setAutenticado(true)} />
      )}
    </>
  )
}

export default App
