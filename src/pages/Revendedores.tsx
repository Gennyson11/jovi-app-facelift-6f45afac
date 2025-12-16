import { AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Revendedores = () => {
  const handleWhatsApp = () => {
    window.open(
      "https://wa.me/558499889568?text=Olá! Tenho interesse em me tornar revendedor JoviTools.",
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="py-4 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex justify-center">
          <span className="text-2xl font-bold text-blue-600">
            Jovi<span className="text-pink-500">Tools</span>
          </span>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-red-400 text-white py-4 px-4 mx-4 md:mx-auto md:max-w-4xl mt-6 rounded-xl flex items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium text-center">
          VAGAS LIMITADAS - Aproveite enquanto há disponibilidade!
        </span>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Termos de Uso
          </h1>
          <p className="text-blue-600 font-bold text-lg tracking-wider mb-2">
            PAINEL REVENDEDORES
          </p>
          <p className="text-gray-600">
            Leia atentamente os termos e condições que regem o uso da plataforma
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-100 px-6 py-4 flex items-center gap-3">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h2 className="text-xl font-bold text-gray-800">
                Condições de Venda
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  As vendas realizadas devem ter valor{" "}
                  <strong>mínimo de R$ 29,99</strong>.
                </span>
              </p>
              <p className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  <span className="text-red-500 font-medium">
                    Não é permitido
                  </span>{" "}
                  realizar transações abaixo desse valor em hipótese alguma.
                </span>
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-100 px-6 py-4 flex items-center gap-3">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h2 className="text-xl font-bold text-gray-800">
                Compartilhamento e Privacidade
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  É{" "}
                  <span className="text-red-500 font-medium">
                    terminantemente proibido
                  </span>{" "}
                  adicionar pessoas aleatoriamente, divulgar logins, senhas ou
                  qualquer tipo de dado de acesso de forma inadequada.
                </span>
              </p>
              <p className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  Cada conta é{" "}
                  <strong>de uso individual e intransferível</strong>. O
                  compartilhamento de acesso com terceiros{" "}
                  <span className="text-red-500 font-medium">
                    não é permitido
                  </span>
                  .
                </span>
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-100 px-6 py-4 flex items-center gap-3">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h2 className="text-xl font-bold text-gray-800">
                Monitoramento e Consequências
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  Todas as atividades dentro da plataforma são{" "}
                  <strong>monitoradas e registradas em log</strong>.
                </span>
              </p>
              <p className="text-gray-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  Caso seja identificado{" "}
                  <strong>
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

        {/* Agreement Text */}
        <p className="text-center text-gray-600 mt-8 mb-6">
          Ao utilizar a plataforma, você concorda com todos os termos e
          condições acima descritos.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleWhatsApp}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Quero me tornar revendedor
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        © 2025 JoviTools. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Revendedores;
