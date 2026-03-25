import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { AuthProvider } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Onboarding from "./pages/Onboarding"
import Admin from "./pages/Admin"
import Upload from "./pages/Upload"
import Analysis from "./pages/Analysis"
import Match from "./pages/Match"
import History from "./pages/History"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import NotFound from "./pages/NotFound"

import { useEffect } from "react"
import { useLocation } from "react-router-dom"

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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default Home
