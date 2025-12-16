import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import Revendedores from "./pages/Revendedores";
import Socios from "./pages/Socios";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/revendedores" element={<Revendedores />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <FloatingWhatsApp />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
