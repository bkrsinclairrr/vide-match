import Home from "./Home"
import GateKeeper from "./components/GateKeeper"
import ErrorBoundary from "./components/ErrorBoundary"
import { useEffect } from "react"
import { resumeFunnelCaptures } from "@/lib/funnel-capture-queue"

function App() {
  useEffect(resumeFunnelCaptures, [])
  return (
    <ErrorBoundary>
      <GateKeeper>
        <Home />
      </GateKeeper>
    </ErrorBoundary>
  )
}

export default App
