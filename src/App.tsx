import Home from "./Home"
import GateKeeper from "./components/GateKeeper"
import ErrorBoundary from "./components/ErrorBoundary"

function App() {
  return (
    <ErrorBoundary>
      <GateKeeper>
        <Home />
      </GateKeeper>
    </ErrorBoundary>
  )
}

export default App
