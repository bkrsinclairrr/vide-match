import { useState, useEffect } from "react"
import Login from "./Login"
import Home from "./Home"

export default function App() {
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    if (localStorage.getItem("autenticado") === "true") {
      setAutenticado(true)
    }
  }, [])

  return autenticado ? (
    <Home />
  ) : (
    <Login onLogin={() => setAutenticado(true)} />
  )
}
