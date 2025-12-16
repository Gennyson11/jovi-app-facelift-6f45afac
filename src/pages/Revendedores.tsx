import { AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
const Revendedores = () => {
  const handleWhatsApp = () => {
    window.open("https://wa.me/558499889568?text=Olá! Tenho interesse em me tornar revendedor JoviTools.", "_blank");
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-4 border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 flex justify-center">
          <span className="text-2xl font-bold text-primary">
            Jovi<span className="text-pink-500">Tools</span>
          </span>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-pink-500/80 to-pink-600/80 text-white py-4 px-4 mx-4 md:mx-auto md:max-w-4xl mt-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium text-center">
          VAGAS LIMITADAS - Aproveite enquanto há disponibilidade!
        </span>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Termos de Uso
          </h1>
          <p className="text-primary font-bold text-lg tracking-wider mb-2">
            PAINEL REVENDEDORES
          </p>
          <p className="text-muted-foreground">Leia atentamente os termos e condições que regem o uso da plataforma
Junte-se a nós como sócio e ganhe 100% de lucro</p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="card-glass rounded-xl overflow-hidden border border-border/30">
            <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-border/30">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
                1
              </span>
              <h2 className="text-xl font-bold text-foreground">
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
                  <span className="text-pink-500 font-medium">
                    mínimo de R$ 27,00
                  </span>{" "}
                  realizar transações abaixo desse valor em hipótese alguma.
                </span>
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="card-glass rounded-xl overflow-hidden border border-border/30">
            <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-border/30">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
                2
              </span>
              <h2 className="text-xl font-bold text-foreground">
                Compartilhamento e Privacidade
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  É{" "}
                  <span className="text-pink-500 font-medium">
                    terminantemente proibido
                  </span>{" "}
                  adicionar pessoas aleatoriamente, divulgar logins, senhas ou
                  qualquer tipo de dado de acesso de forma inadequada.
                </span>
              </p>
              <p className="text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Cada conta é{" "}
                  <strong className="text-foreground">de uso individual e intransferível</strong>. O
                  compartilhamento de acesso com terceiros{" "}
                  <span className="text-pink-500 font-medium">
                    não é permitido
                  </span>
                  .
                </span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card-glass rounded-xl overflow-hidden border border-border/30">
            <div className="bg-primary/10 px-6 py-4 flex items-center gap-3 border-b border-border/30">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/30">
                3
              </span>
              <h2 className="text-xl font-bold text-foreground">
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
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  Caso seja identificado{" "}
                  <strong className="text-foreground">
                    qualquer tipo de irregularidade, violação ou tentativa de
                    burlar as regras
                  </strong>
                  , o acesso será imediatamente suspenso, sem direito a
                  reembolso.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Vantagens Exclusivas Section */}
        <div className="mt-8 card-glass rounded-xl overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-pink-500/10">
          <div className="bg-gradient-to-r from-primary/20 to-pink-500/20 px-6 py-4 border-b border-border/30">
            <h2 className="text-2xl font-bold text-center text-foreground">
              ✨ Vantagens Exclusivas ✨
            </h2>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-3 text-lg">
              <span className="text-primary text-xl">✅</span>
              <span className="text-foreground font-medium">Acesso total ao painel administrativo</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <span className="text-primary text-xl">✅</span>
              <span className="text-foreground font-medium">Cadastro de até 50 usuários</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <span className="text-primary text-xl">✅</span>
              <span className="text-foreground font-medium">Revenda com 100% de lucro</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <span className="text-primary text-xl">✅</span>
              <span className="text-foreground font-medium">Novas ferramentas adicionadas toda semana</span>
            </div>
          </div>
        </div>

        {/* Agreement Text */}
        <p className="text-center text-muted-foreground mt-8 mb-6">
          Ao utilizar a plataforma, você concorda com todos os termos e
          condições acima descritos.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button onClick={handleWhatsApp} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-8 rounded-xl text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all">
            Quero me tornar revendedor
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/30">
        © 2025 JoviTools. Todos os direitos reservados.
      </footer>
    </div>;
};
export default Revendedores;