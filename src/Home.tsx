import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { AuthProvider } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import UtmifyPixel from "@/components/UtmifyPixel"

import { lazy, Suspense, useEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * Cada rota vira seu próprio chunk (code splitting). Antes, abrir o
 * /dashboard baixava e executava também Admin, Upload, Analysis, Match e
 * History — quase 4 mil linhas de código que o usuário do dashboard nunca
 * usa. Isso inflava o bundle inicial e travava o main thread por até 1,7s
 * em CPU mais fraca, atrasando a primeira resposta a cliques.
 */
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Login = lazy(() => import("./pages/Login"))
const Onboarding = lazy(() => import("./pages/Onboarding"))
const Admin = lazy(() => import("./pages/Admin"))
const Upload = lazy(() => import("./pages/Upload"))
const Analysis = lazy(() => import("./pages/Analysis"))
const Match = lazy(() => import("./pages/Match"))
const History = lazy(() => import("./pages/History"))
const Privacy = lazy(() => import("./pages/Privacy"))
const Terms = lazy(() => import("./pages/Terms"))
const NotFound = lazy(() => import("./pages/NotFound"))

/**
 * Funil aberto (/avaliacao). Roda em paralelo ao tradicional, sem alterá-lo:
 * entrada pública → formulário público → criação de conta → conclusão com
 * o resultado de performance e o contato no WhatsApp. A proteção de rota
 * fica dentro das próprias telas (elas devolvem a pessoa para a etapa que
 * falta, em vez de jogá-la no /login e quebrar o funil).
 */
const FunnelHome = lazy(() => import("./pages/funnel/FunnelHome"))
const FunnelProfile = lazy(() => import("./pages/funnel/FunnelProfile"))
const FunnelUpload = lazy(() => import("./pages/funnel/FunnelUpload"))
const FunnelAccount = lazy(() => import("./pages/funnel/FunnelAccount"))
const FunnelResult = lazy(() => import("./pages/funnel/FunnelResult"))

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

// Scrolls to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

/**
 * Pré-busca em segundo plano, só quando o navegador está ocioso, os
 * chunks de /dashboard e /onboarding — o par de páginas que o usuário
 * quase sempre visita em sequência. Sem isso, a PRIMEIRA navegação para
 * cada uma delas espera a rede baixar o chunk (e o gsap+lenis
 * compartilhado) do zero, o que pode parecer uma travada mesmo com o
 * bundle já otimizado. Como é `import()` puro, o resultado nem precisa
 * ser usado — só aquecer o cache do navegador já resolve.
 */
const usePrefetchCoreRoutes = () => {
  useEffect(() => {
    const idle = (cb: () => void) => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
      return ric ? ric(cb) : window.setTimeout(cb, 1200)
    }
    idle(() => {
      import("./pages/Dashboard")
      import("./pages/Onboarding")
    })
  }, [])
}

const Home = () => {
  usePrefetchCoreRoutes()
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <UtmifyPixel />
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/termos" element={<Terms />} />

              {/* Funil aberto — entrada sem login, conta só no final */}
              <Route path="/avaliacao" element={<FunnelHome />} />
              <Route path="/avaliacao/perfil" element={<FunnelProfile />} />
              <Route path="/avaliacao/upload" element={<FunnelUpload />} />
              <Route path="/avaliacao/conta" element={<FunnelAccount />} />
              <Route path="/avaliacao/resultado" element={<FunnelResult />} />

              {/* Protected routes - require authentication */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
              <Route path="/match" element={<ProtectedRoute><Match /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  )
}

export default Home
