import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { AuthProvider } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

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

const queryClient = new QueryClient()

const Home = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/termos" element={<Terms />} />

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
  </QueryClientProvider>
)

export default Home
