import { Clock } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
}

export default function MaintenanceScreen({ message = 'Estamos preparando algo incrível e emocionante para você. Também temos uma surpresa especial para nossos assinantes.' }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[hsl(210,60%,8%)] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Circuit board decorative lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top-left circuit lines */}
        <path d="M0 200 L150 200 L200 150 L350 150" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M0 250 L100 250 L130 220 L250 220 L280 250 L400 250" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <path d="M200 0 L200 100 L250 150 L250 200" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M350 0 L350 80 L300 130" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <circle cx="350" cy="150" r="4" fill="hsl(185 80% 55%)" />
        <circle cx="250" cy="220" r="3" fill="hsl(185 80% 55%)" />
        <circle cx="200" cy="200" r="3" fill="hsl(185 80% 55%)" />

        {/* Top-right circuit lines */}
        <path d="M1200 180 L1050 180 L1000 130 L850 130" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M1200 230 L1100 230 L1070 200 L950 200 L920 230 L800 230" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <path d="M1000 0 L1000 90 L950 140 L950 190" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M900 0 L900 70 L950 120" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <circle cx="850" cy="130" r="4" fill="hsl(185 80% 55%)" />
        <circle cx="950" cy="200" r="3" fill="hsl(185 80% 55%)" />

        {/* Bottom-left circuit lines */}
        <path d="M0 600 L120 600 L170 650 L320 650" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <path d="M150 800 L150 700 L200 650" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M0 550 L80 550 L130 500 L200 500" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <circle cx="320" cy="650" r="4" fill="hsl(185 80% 55%)" />
        <circle cx="200" cy="500" r="3" fill="hsl(185 80% 55%)" />

        {/* Bottom-right circuit lines */}
        <path d="M1200 620 L1080 620 L1030 670 L880 670" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <path d="M1050 800 L1050 720 L1000 670" stroke="hsl(185 80% 55%)" strokeWidth="1.5" />
        <path d="M1200 560 L1120 560 L1070 510 L1000 510" stroke="hsl(185 80% 55%)" strokeWidth="1" />
        <circle cx="880" cy="670" r="4" fill="hsl(185 80% 55%)" />
        <circle cx="1000" cy="510" r="3" fill="hsl(185 80% 55%)" />

        {/* Additional scattered dots */}
        <circle cx="500" cy="100" r="2" fill="hsl(185 80% 55%)" opacity="0.5" />
        <circle cx="700" cy="80" r="2" fill="hsl(185 80% 55%)" opacity="0.5" />
        <circle cx="600" cy="700" r="2" fill="hsl(185 80% 55%)" opacity="0.5" />
        <circle cx="400" cy="720" r="2" fill="hsl(185 80% 55%)" opacity="0.5" />
      </svg>

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(200,80%,40%)] rounded-full blur-[150px] opacity-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(185,80%,40%)] rounded-full blur-[150px] opacity-10" />

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(185,70%,45%)] to-[hsl(210,70%,40%)] flex items-center justify-center shadow-[0_0_30px_hsl(185_80%_50%/0.3)]">
            <span className="text-3xl font-bold text-white">J</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-wider uppercase">
            Em Breve
          </h1>
          <p className="text-[hsl(210,20%,70%)] text-base md:text-lg leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Divider line */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(185,80%,55%)]" />
          <Clock className="w-4 h-4 text-[hsl(185,80%,55%)]" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(185,80%,55%)]" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full bg-[hsl(185,70%,45%)] text-white font-semibold text-sm uppercase tracking-wider hover:bg-[hsl(185,70%,50%)] transition-all shadow-[0_0_20px_hsl(185_80%_50%/0.3)] hover:shadow-[0_0_30px_hsl(185_80%_50%/0.5)]"
          >
            Consulte Mais Informação
          </a>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full border border-[hsl(185,70%,45%)] text-[hsl(185,70%,55%)] font-semibold text-sm uppercase tracking-wider hover:bg-[hsl(185,70%,45%)/0.1] transition-all"
          >
            Consulte Mais Informação
          </a>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-2 h-2 bg-[hsl(185,80%,55%)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[hsl(185,80%,55%)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[hsl(185,80%,55%)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
