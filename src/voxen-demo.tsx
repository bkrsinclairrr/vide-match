/**
 * Entrada do build de demonstração da VOXEN (voxen-demo.html). Só monta a
 * plataforma, em modo demonstração: sem o site, sem o funil, sem login e
 * sem falar com o Supabase — os dados são gerados no navegador.
 */
import { createRoot } from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import ErrorBoundary from "@/components/ErrorBoundary"
import VoxenApp from "@/pages/voxen/VoxenApp"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/voxen/*" element={<VoxenApp />} />
          <Route path="*" element={<Navigate to="/voxen" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>,
)
