import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FAQSection = () => {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Cancellation Note - moved from pricing */}
        <p className="text-muted-foreground text-xs md:text-sm mb-12 md:mb-16 max-w-2xl mx-auto px-2">
          Cancele quando quiser, sem burocracia. Mas você não vai querer cancelar depois de ver tudo que tem acesso! 😊
        </p>

        {/* WhatsApp Style Icon */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-primary flex items-center justify-center bg-background/50">
            <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
        </div>

        {/* Section Header */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-1">
          <span className="text-foreground">FICOU ALGUMA</span>
        </h2>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-primary mb-4 md:mb-6">
          DÚVIDA? <span className="text-primary">?</span>
        </h3>

        <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base px-2">
          Tire suas dúvidas com nosso suporte pelo botão abaixo
        </p>

        {/* CTA Button */}
        <Button variant="hero" size="xl" className="mb-6 md:mb-8 px-8 md:px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-sm md:text-base">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          FALAR COM O SUPORTE AGORA
        </Button>

        {/* Support Hours */}
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1 text-sm md:text-base">Horário de atendimento:</p>
          <p className="text-muted-foreground text-sm md:text-base">7h às 15h | 17h às 22h</p>
        </div>

        {/* Footer Note */}
        <p className="text-xs md:text-sm text-muted-foreground mt-12 md:mt-16 border-t border-border/20 pt-6 md:pt-8 px-2">
          Respondemos rapidamente todas as dúvidas sobre acesso, ferramentas e pagamento
        </p>
      </div>
    </section>
  );
};

export default FAQSection;
