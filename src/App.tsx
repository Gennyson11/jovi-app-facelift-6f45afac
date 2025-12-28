import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useMaintenance } from "@/hooks/useMaintenance";
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
import MaintenanceScreen from "./components/MaintenanceScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Wrapper component to handle maintenance mode
function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const { isMaintenanceMode, maintenanceMessage, loading } = useMaintenance();
  const { isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();

  // Allow admins to bypass maintenance mode
  // Also allow access to login page so admins can authenticate
  const isLoginPage = location.pathname === '/login';
  
  if (loading || authLoading) {
    return null; // Or a loading spinner
  }

  if (isMaintenanceMode && !isAdmin && !isLoginPage) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <MaintenanceWrapper>
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
  </MaintenanceWrapper>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <FloatingWhatsApp />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
