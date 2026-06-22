import { Sparkles, MessageCircle, ArrowRight } from "lucide-react";

const MigrationBanner = () => {
  const whatsappUrl =
    "https://api.whatsapp.com/send/?phone=558499889568&text=Quero+migrar+para+a+nova+plataforma+JoviTools&type=phone_number&app_absent=0";

  return (
    <div className="relative z-40 w-full border-b border-primary/40 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse shrink-0" />
          <p className="text-xs sm:text-sm md:text-base text-foreground font-medium">
            Estamos em <span className="text-primary font-bold">fase de migração</span> para{" "}
            <a
              href="https://www.jovitools.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold underline underline-offset-2 hover:text-primary/80"
            >
              www.jovitools.com
            </a>
            <span className="hidden sm:inline"> — plataforma mais estável e completa.</span>
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/30 shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Migrar agora
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default MigrationBanner;