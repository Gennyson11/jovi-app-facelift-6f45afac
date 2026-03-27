import { AlertTriangle, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Revendedores = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/558499889568?text=Olá! Tenho interesse em me tornar revendedor JoviTools.", "_blank");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
        <div className="absolute inset-0 opacity-30 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Painel Revendedores
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
            <span className="text-foreground">Termos de Uso</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-4">
            Leia atentamente os termos e condições que regem o uso da plataforma
          </p>
          <p className="text-primary font-semibold text-base sm:text-lg">
            Junte-se a nós como sócio e ganhe 100% de lucro
          </p>
        </div>
      </section>

      {/* Warning Banner */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-10">
        <div className="rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-md py-3 px-4 flex items-center justify-center gap-2 glow-primary">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-sm sm:text-base tracking-wide">
            VAGAS LIMITADAS — Aproveite enquanto há disponibilidade!
          </span>
        </div>
      </div>

      {/* Terms Sections */}
      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        {/* Section 1 */}
        <div className="card-glass-blue rounded-xl overflow-hidden">
          <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-primary/20">
            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
              1
            </span>
            <h2 className="text-xl font-bold text-foreground font-display">
              Condições de Venda
            </h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                As vendas realizadas devem ter valor{" "}
                <strong className="text-foreground">mínimo de R$ 27,00</strong>.
              </span>
            </p>
            <p className="text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <span className="text-primary font-medium">É proibido</span>{" "}
                realizar transações abaixo desse valor em hipótese alguma.
              </span>
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="card-glass-blue rounded-xl overflow-hidden">
          <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-primary/20">
            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
              2
            </span>
            <h2 className="text-xl font-bold text-foreground font-display">
              Compartilhamento e Privacidade
            </h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                É{" "}
                <span className="text-primary font-medium">terminantemente proibido</span>{" "}
                adicionar pessoas aleatoriamente, divulgar logins, senhas ou qualquer tipo de dado de acesso de forma inadequada.
              </span>
            </p>
            <p className="text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Cada conta é{" "}
                <strong className="text-foreground">de uso individual e intransferível</strong>. O compartilhamento de acesso com terceiros{" "}
                <span className="text-primary font-medium">não é permitido</span>.
              </span>
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="card-glass-blue rounded-xl overflow-hidden">
          <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-primary/20">
            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
              3
            </span>
            <h2 className="text-xl font-bold text-foreground font-display">
              Monitoramento e Consequências
            </h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <p className="text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Todas as atividades dentro da plataforma são{" "}
                <strong className="text-foreground">monitoradas e registradas em log</strong>.
              </span>
            </p>
            <p className="text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <span>
                Caso seja identificado{" "}
                <strong className="text-foreground">qualquer tipo de irregularidade, violação ou tentativa de burlar as regras</strong>,
                o acesso será imediatamente suspenso, sem direito a reembolso.
              </span>
            </p>
          </div>
        </div>

        {/* Vantagens Exclusivas */}
        <div className="rounded-xl overflow-hidden border-2 border-primary/40 glow-primary">
          <div className="bg-gradient-to-r from-primary/20 to-accent/10 px-6 py-4 border-b border-primary/20">
            <h2 className="text-2xl font-bold text-center text-foreground font-display">
              ✨ Vantagens Exclusivas ✨
            </h2>
          </div>
          <div className="card-glass-blue px-6 py-6 space-y-4">
            {[
              "Acesso ao painel de revendedor",
              "R$ 197,00 — Acesso vitalício",
              "Cadastro de até 100 usuários",
              "Revenda com 100% de lucro",
              "Novas ferramentas adicionadas toda semana",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-lg">
                <span className="text-primary text-xl">✅</span>
                <span className="text-foreground font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement + CTA */}
        <div className="text-center pt-4 space-y-6">
          <p className="text-muted-foreground text-sm">
            Ao utilizar a plataforma, você concorda com todos os termos e condições acima descritos.
          </p>
          <Button variant="hero" size="lg" className="px-10 group" onClick={handleWhatsApp}>
            Quero me tornar revendedor
            <ChevronRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 JoviTools. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Revendedores;
