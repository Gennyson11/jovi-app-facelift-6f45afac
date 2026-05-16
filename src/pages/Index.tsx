import { useNavigate } from 'react-router-dom';
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ToolsSection from "@/components/ToolsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";


const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection onAccessClick={() => navigate('/login')} />
      <FeaturesSection />
      <ToolsSection />
      <PricingSection />
      <FAQSection />
      
      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border/40 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 <span className="text-foreground font-semibold">JoviTools</span>. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot status-dot-success" />
            Plataforma online
          </div>
        </div>
      </footer>

      
    </div>
  );
};

export default Index;
