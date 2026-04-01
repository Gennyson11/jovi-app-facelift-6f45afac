import { Construction, Clock } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
}

export default function MaintenanceScreen({ message = 'Estamos preparando algo incrível e emocionante para você. Também temos uma surpresa especial para nossos assinantes.' }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative" style={{ background: 'var(--gradient-dark)' }}>
      {/* Glow effects matching site style */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15 bg-primary" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[150px] opacity-10 bg-accent" />

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-[var(--shadow-primary)]">
            <Construction className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-wider uppercase text-gradient-primary">
            Em Breve
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Card glass */}
        <div className="card-glass-blue rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <span className="font-display font-semibold uppercase tracking-wider text-sm">Voltaremos em breve</span>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <p className="text-muted-foreground text-sm">
            Estamos trabalhando para melhorar sua experiência
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-intense)]"
          >
            Consulte Mais Informação
          </a>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-lg border border-primary/50 text-primary font-semibold text-sm uppercase tracking-wider hover:bg-primary/10 transition-all"
          >
            Consulte Mais Informação
          </a>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 pt-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
