import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FAQSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Cancellation Note - moved from pricing */}
        <p className="text-muted-foreground text-sm mb-16 max-w-2xl mx-auto">
          Cancele quando quiser, sem burocracia. Mas você não vai querer cancelar depois de ver tudo que tem acesso! 😊
        </p>

        {/* WhatsApp Style Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center bg-background/50">
            <MessageCircle className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-1">
          <span className="text-foreground">FICOU ALGUMA</span>
        </h2>
        <h3 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
          DÚVIDA? <span className="text-primary">?</span>
        </h3>

        <p className="text-muted-foreground mb-8">
          Tire suas dúvidas com nosso suporte pelo botão abaixo
        </p>

        {/* CTA Button */}
        <Button variant="hero" size="xl" className="mb-8 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold">
          <MessageCircle className="w-5 h-5 mr-2" />
          FALAR COM O SUPORTE AGORA
        </Button>

        {/* Support Hours */}
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1">Horário de atendimento:</p>
          <p className="text-muted-foreground">7h às 15h | 17h às 22h</p>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground mt-16 border-t border-border/20 pt-8">
          Respondemos rapidamente todas as dúvidas sobre acesso, ferramentas e pagamento
        </p>
      </div>
    </section>
  );
};

export default FAQSection;
