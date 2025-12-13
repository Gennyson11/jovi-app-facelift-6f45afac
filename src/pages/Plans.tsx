import PricingSection from "@/components/PricingSection";

const Plans = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main>
        <section className="pt-16 pb-6 px-4 border-b border-border/30">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Escolha o plano ideal para você
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Veja todas as opções de assinatura disponíveis e selecione o plano que melhor se encaixa na sua necessidade.
            </p>
          </div>
        </section>

        <PricingSection />
      </main>
    </div>
  );
};

export default Plans;
