import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  "Acesso +15 Ferramentas Premium",
  "Canva no Seu Email (acesso individual)",
  "Brindes Exclusivos",
  "Métodos Bônus Inclusos"
];

const PricingSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-24 px-4" id="pricing">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">
            ESCOLHA SEU
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gradient-blue mt-2">
            PLANO PREMIUM
          </h3>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto items-stretch">
          {/* Monthly Plan */}
          <div
            className="panel panel-hover panel-flush p-6 md:p-8 animate-fade-up">
            
            <div className="flex justify-center mb-4 md:mb-6">
              <span className="px-4 py-1.5 rounded-full text-[11px] tracking-wider font-display font-bold bg-secondary/60 text-muted-foreground border border-border/60">
                INICIANTE
              </span>
            </div>

            <div className="text-center">
              <h4 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-primary mb-3 md:mb-4">MENSAL</h4>
              <p className="text-muted-foreground line-through text-base md:text-lg">R$897,00</p>
              <p className="my-3 md:my-4">
                <span className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">R$37</span>
                <span className="text-lg md:text-xl text-muted-foreground">/mês</span>
              </p>
            </div>

            <ul className="mt-6 md:mt-8 space-y-3 md:space-y-4">
              {benefits.map((benefit) =>
                <li key={benefit} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm lg:text-base text-muted-foreground">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  {benefit}
                </li>
              )}
            </ul>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-6 md:mt-8 font-display font-bold text-base md:text-lg py-5 md:py-6"
              onClick={() => navigate('/login')}>
              ASSINAR AGORA
            </Button>

            <p className="text-center text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              Pagamento seguro via Plataforma
            </p>
          </div>

          {/* Quarterly Plan - Featured */}
          <div
            className="panel panel-hover panel-flush p-8 md:scale-[1.04] border-primary/50 animate-fade-up"
            style={{ animationDelay: '80ms', boxShadow: '0 0 60px -10px hsl(220 90% 56% / 0.45), 0 1px 0 0 hsl(220 90% 56% / 0.2) inset' }}>
            
            <div className="flex justify-center mb-6">
              <span className="px-5 py-2 rounded-full text-xs tracking-wider font-display font-bold btn-pill-gradient text-primary-foreground">
                ⭐ MAIS POPULAR
              </span>
            </div>

            <div className="text-center">
              <h4 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">TRIMESTRAL</h4>
              <p className="text-muted-foreground line-through text-lg">R$2.691,00</p>
              <p className="my-4">
                <span className="text-5xl md:text-6xl font-display font-bold text-foreground">R$97</span>
                <span className="text-xl text-muted-foreground">/trimestre</span>
              </p>
              <p className="text-primary text-base font-semibold">Apenas R$32,33/mês</p>
            </div>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) =>
                <li key={benefit} className="flex items-center gap-3 text-sm md:text-base text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  {benefit}
                </li>
              )}
            </ul>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-8 font-display font-bold text-lg py-6"
              onClick={() => navigate('/login')}>
              ASSINAR AGORA
            </Button>

            <p className="text-center text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              Pagamento seguro via Plataforma
            </p>
          </div>

          {/* Annual Plan */}
          <div
            className="panel panel-hover panel-flush p-6 md:p-8 animate-fade-up"
            style={{ animationDelay: '160ms' }}>
            
            <div className="flex justify-center mb-4 md:mb-6">
              <span className="px-4 py-1.5 rounded-full text-[11px] tracking-wider font-display font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                💰 ECONOMIA MÁXIMA
              </span>
            </div>

            <div className="text-center">
              <h4 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-primary mb-3 md:mb-4">ANUAL</h4>
              <p className="text-muted-foreground line-through text-base md:text-lg">R$10.764,00</p>
              <p className="my-3 md:my-4">
                <span className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">R$297</span>
                <span className="text-lg md:text-xl text-muted-foreground">/ano</span>
              </p>
              <p className="text-primary text-sm md:text-base font-semibold">Apenas R$24,75/mês</p>
            </div>

            <ul className="mt-6 md:mt-8 space-y-3 md:space-y-4">
              {benefits.map((benefit) =>
                <li key={benefit} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm lg:text-base text-muted-foreground">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                  {benefit}
                </li>
              )}
            </ul>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-6 md:mt-8 font-display font-bold text-base md:text-lg py-5 md:py-6"
              onClick={() => navigate('/login')}>
              ASSINAR AGORA
            </Button>

            <p className="text-center text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              Pagamento seguro via Plataforma
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
