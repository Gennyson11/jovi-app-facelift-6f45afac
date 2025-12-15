import { Coins, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinsDisplayProps {
  coins: number | null;
  maxCoins?: number;
}

export default function CoinsDisplay({ coins, maxCoins = 20 }: CoinsDisplayProps) {
  const coinPercentage = coins !== null ? (coins / maxCoins) * 100 : 0;
  const isLow = coins !== null && coins <= 5;
  const isCritical = coins !== null && coins <= 2;

  const getStatusText = () => {
    if (coins === null) return '-';
    if (coins === 0) return 'Esgotado';
    if (coins <= 2) return 'Crítico';
    if (coins <= 5) return 'Baixo';
    if (coins <= 10) return 'Médio';
    return 'Bom';
  };

  const getStatusColor = () => {
    if (coins === null) return 'text-muted-foreground';
    if (coins <= 5) return 'text-red-500';
    if (coins <= 10) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-blue-400" />
          </div>
          
          {/* Credits Info */}
          <div>
            <p className="text-xs text-slate-400">Créditos Restantes</p>
            <p className={cn(
              "text-2xl font-bold",
              isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-white"
            )}>
              {coins !== null ? coins.toFixed(0) : '-'}
            </p>
          </div>
        </div>

        {/* Warning Badge */}
        {isLow && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
            isCritical 
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          )}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {isCritical ? 'Crítico: Sem Créditos' : 'Crítico: Poucos Créditos'}
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400">Progresso</span>
          <span className="text-xs text-slate-400">{Math.round(coinPercentage)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCritical 
                ? "bg-gradient-to-r from-red-600 to-red-500" 
                : isLow 
                  ? "bg-gradient-to-r from-amber-600 to-amber-500"
                  : "bg-gradient-to-r from-blue-600 to-blue-400"
            )}
            style={{ width: `${coinPercentage}%` }}
          />
        </div>
      </div>

      {/* Status Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Status do saldo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("text-xs font-semibold", getStatusColor())}>
            {getStatusText()}
          </span>
          {coins !== null && coins > 10 && (
            <span className="text-amber-400">✦</span>
          )}
        </div>
      </div>
    </div>
  );
}
