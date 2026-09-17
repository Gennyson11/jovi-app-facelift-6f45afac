import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";

const TARGET_DATE = new Date("2026-09-30T23:59:59-03:00");

const pad = (n: number) => String(n).padStart(2, "0");

const CountdownBanner = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, TARGET_DATE.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="relative z-40 w-full border-b border-destructive/40 bg-gradient-to-r from-destructive/20 via-destructive/10 to-destructive/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-destructive/5 animate-pulse pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive animate-pulse shrink-0" />
          <p className="text-xs sm:text-sm md:text-base text-foreground font-medium">
            Dia <span className="text-destructive font-bold">30</span> este site será{" "}
            <span className="text-destructive font-bold">descontinuado</span>
            <span className="hidden sm:inline">
              {" "}— suporte apenas no novo site{" "}
              <a
                href="https://www.jovitools.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold underline underline-offset-2 hover:text-primary/80"
              >
                www.jovitools.com
              </a>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-4 h-4 text-destructive shrink-0" />
          {[
            { value: pad(days), label: "dias" },
            { value: pad(hours), label: "horas" },
            { value: pad(minutes), label: "min" },
            { value: pad(seconds), label: "seg" },
          ].map((unit, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex flex-col items-center">
                <span className="min-w-[2.25rem] sm:min-w-[2.5rem] px-1.5 py-1 rounded-md bg-background/60 border border-destructive/40 text-destructive font-display font-bold text-sm sm:text-base tabular-nums">
                  {unit.value}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {unit.label}
                </span>
              </div>
              {i < 3 && <span className="text-destructive font-bold text-sm sm:text-base -mt-4">:</span>}
            </div>
          ))}
        </div>

        <a
          href="https://www.jovitools.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs sm:text-sm font-bold hover:bg-destructive/90 transition-all hover:scale-105 shadow-lg shadow-destructive/30 shrink-0"
        >
          Acessar novo site
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default CountdownBanner;
