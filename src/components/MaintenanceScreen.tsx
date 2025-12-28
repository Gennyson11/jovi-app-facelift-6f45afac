import { Construction, Wrench, Clock } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
}

export default function MaintenanceScreen({ message = 'O site está em manutenção. Voltaremos em breve!' }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative flex items-center justify-center w-32 h-32 bg-primary/10 rounded-full border-2 border-primary/30">
            <Construction className="w-16 h-16 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Site em Manutenção
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Wrench className="w-4 h-4" />
            <span>Estamos trabalhando para melhorar sua experiência</span>
          </div>
        </div>

        {/* Message Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <p className="text-foreground/80 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Voltaremos em breve</span>
        </div>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
