import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Libera uma nova tentativa de auto-recarregamento (ErrorBoundary) para o
// próximo deploy — sem isso, uma vez usada, a flag ficaria presa nesta aba.
try {
  sessionStorage.removeItem("zyron-chunk-reload-attempted");
} catch {
  /* sessionStorage bloqueado — sem efeito no restante do boot */
}

createRoot(document.getElementById("root")!).render(<App />);
