import { useState } from "react";
import { ChevronRight, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import heroImage from "@/assets/hero-jovitools.jpg";

interface HeroSectionProps {
  onAccessClick?: () => void;
}

const HeroSection = ({ onAccessClick }: HeroSectionProps) => {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-12 sm:py-20 overflow-hidden">
      {/* Deep blue background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      {/* Animated blue glow orbs */}
      <div className="absolute inset-0 opacity-30 hidden sm:block">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-[500px] h-48 sm:h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-[400px] h-48 sm:h-[400px] bg-accent/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        {/* Logo Badge */}
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          O Melhor Mercado de IA's
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-3 sm:mb-4 md:mb-6 px-1">
          <span className="text-foreground">CHEGA DE GASTAR CARO</span>
          <br />
          <span className="text-foreground">EM FERRAMENTAS DE</span>
          <br />
          <span className="text-gradient-blue">INTELIGÊNCIA ARTIFICIAL</span>
          <span className="ml-1 sm:ml-2">💸</span>
        </h1>

        {/* Hero Image with Play Button */}
        <div className="relative my-4 sm:my-6 md:my-10 max-w-md sm:max-w-lg md:max-w-xl mx-auto group px-1 sm:px-2">
          {/* Animated glow background */}
          <div className="absolute -inset-1 sm:-inset-3 bg-gradient-to-r from-primary/50 via-accent/30 to-primary/50 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
          
          {/* Image container */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-primary/30 sm:border-2 sm:border-primary/40 shadow-2xl shadow-primary/20 cursor-pointer aspect-square" onClick={() => setVideoOpen(true)}>
            <img src={heroImage} alt="JoviTools - O Melhor Mercado de IA's" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary glow-blue">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-foreground fill-primary-foreground ml-0.5 sm:ml-1" />
              </div>
            </div>
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 sm:w-20 sm:h-20 border-t border-l sm:border-t-2 sm:border-l-2 border-primary/50 rounded-tl-xl sm:rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 border-t border-r sm:border-t-2 sm:border-r-2 border-primary/30 rounded-tr-xl sm:rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-20 sm:h-20 border-b border-l sm:border-b-2 sm:border-l-2 border-primary/30 rounded-bl-xl sm:rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-20 sm:h-20 border-b border-r sm:border-b-2 sm:border-r-2 border-primary/50 rounded-br-xl sm:rounded-br-2xl" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-foreground mb-1 sm:mb-2 px-1 sm:px-2">
          Tenha <span className="text-primary font-semibold">+15 ferramentas premium</span> de IA e Marketing Digital
        </p>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground mb-2 sm:mb-4 px-1 sm:px-2">
          em um só acesso, pagando apenas <span className="text-primary font-bold">R$37,00/mês</span>
        </p>
        <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-2 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2">
          <span className="text-primary animate-pulse">✨</span>
          Acesso imediato após a confirmação do pagamento
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4">
          <Button variant="hero" size="lg" className="px-6 sm:px-8 md:px-12 w-full sm:w-auto group text-sm sm:text-base" onClick={onAccessClick}>
            Acessar Plataforma
            <ChevronRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <Button variant="outline" size="default" className="group w-full sm:w-auto text-xs sm:text-sm" asChild>
            <a href="https://www.jovitools.online/revendedores" target="_blank" rel="noopener noreferrer">
              <Users className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
              Torne-se um revendedor parceiro
            </a>
          </Button>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl p-0 bg-background border-primary/30 overflow-hidden">
          <div className="aspect-video w-full">
            <iframe width="100%" height="100%" src={videoOpen ? "https://www.youtube.com/embed/b1hxzIUPQik?autoplay=1" : ""} title="JoviTools Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
