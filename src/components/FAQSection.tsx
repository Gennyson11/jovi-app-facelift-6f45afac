import { MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const FAQSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
          <span className="text-foreground">FICOU ALGUMA</span>
        </h2>
        <h3 className="text-3xl md:text-4xl font-display font-bold text-primary mb-8">
          DÚVIDA? ❓
        </h3>

        <p className="text-muted-foreground mb-8">
          Tire suas dúvidas com nosso suporte pelo botão abaixo
        </p>

        {/* CTA Button */}
        <Button variant="neon" size="xl" className="mb-8">
          <MessageCircle className="w-5 h-5 mr-2" />
          FALAR COM O SUPORTE AGORA
        </Button>

        {/* Support Hours */}
        <div className="p-6 rounded-xl card-glass border border-primary/20 inline-block">
          <div className="flex items-center justify-center gap-3 text-muted-foreground mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-semibold">Horário de atendimento:</span>
          </div>
          <p className="text-primary font-display">7h às 15h | 17h às 22h</p>
          <p className="text-sm text-muted-foreground mt-2">
            Respondemos rapidamente todas as dúvidas sobre acesso, ferramentas e pagamento
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
