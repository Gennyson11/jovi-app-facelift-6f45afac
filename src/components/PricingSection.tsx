import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Acesso a +70 ferramentas premium",
  "Inteligências Artificiais de última geração",
  "Ferramentas de espionagem e mineração",
  "Design e edição profissional ilimitados",
  "SEO e análise de mercado",
  "Suporte prioritário",
  "Atualizações constantes",
  "Acesso imediato",
];

const PricingSection = () => {
  return (
    <section className="py-20 px-4" id="pricing">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            <span className="text-foreground">ESCOLHA SEU</span>
          </h2>
          <h3 className="text-3xl md:text-4xl font-display font-bold text-primary mt-2">
            PLANO PREMIUM
          </h3>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="relative p-8 rounded-2xl card-glass border border-primary/30 hover:border-primary/60 transition-all duration-500 hover:glow-cyan group">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 rounded-full text-xs font-display font-bold bg-accent text-accent-foreground shadow-lg">
                MAIS POPULAR
              </span>
            </div>

            <div className="text-center mt-4">
              <h4 className="text-xl font-display font-bold text-primary mb-4">MENSAL</h4>
              
              {/* Original Price */}
              <p className="text-muted-foreground line-through text-lg">R$897,00</p>
              
              {/* Current Price */}
              <p className="text-4xl font-display font-bold text-foreground my-2">
                R$29,99<span className="text-lg text-muted-foreground">/mês</span>
              </p>
            </div>

            {/* Benefits */}
            <ul className="mt-8 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="hero" size="lg" className="w-full mt-8">
              ASSINAR AGORA
            </Button>

            {/* Security Note */}
            <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamento seguro via Plataforma
            </p>
          </div>

          {/* Quarterly Plan */}
          <div className="relative p-8 rounded-2xl card-glass border border-accent/30 hover:border-accent/60 transition-all duration-500 hover:glow-magenta group">
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 rounded-full text-xs font-display font-bold bg-primary text-primary-foreground shadow-lg">
                MELHOR CUSTO
              </span>
            </div>

            <div className="text-center mt-4">
              <h4 className="text-xl font-display font-bold text-accent mb-4">TRIMESTRAL</h4>
              
              {/* Original Price */}
              <p className="text-muted-foreground line-through text-lg">R$2.691,00</p>
              
              {/* Current Price */}
              <p className="text-4xl font-display font-bold text-foreground my-2">
                R$79,99<span className="text-lg text-muted-foreground">/3 meses</span>
              </p>
              
              {/* Per month breakdown */}
              <p className="text-accent text-sm font-semibold">Apenas R$32/mês</p>
            </div>

            {/* Benefits */}
            <ul className="mt-8 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="accent" size="lg" className="w-full mt-8">
              ASSINAR AGORA
            </Button>

            {/* Security Note */}
            <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamento seguro via Plataforma
            </p>
          </div>
        </div>

        {/* Cancellation Note */}
        <p className="text-center text-muted-foreground text-sm mt-10 max-w-2xl mx-auto">
          Cancele quando quiser, sem burocracia. Mas você não vai querer cancelar depois de ver tudo que tem acesso! 😊
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
