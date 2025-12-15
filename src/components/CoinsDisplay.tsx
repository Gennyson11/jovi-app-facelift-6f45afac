import { Coins, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinsDisplayProps {
  coins: number | null;
  maxCoins?: number;
}

export default function CoinsDisplay({ coins, maxCoins = 20 }: CoinsDisplayProps) {
  const coinPercentage = coins !== null ? (coins / maxCoins) * 100 : 0;
  const isLow = coins !== null && coins <= 5;
  const isCritical = coins !== null && coins <= 2;

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl border",
      isCritical 
        ? "bg-red-500/10 border-red-500/30" 
        : isLow 
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-slate-900/50 border-slate-700/50"
    )}>
      {/* Icon */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        isCritical 
          ? "bg-red-500/20" 
          : isLow 
            ? "bg-amber-500/20"
            : "bg-blue-500/20"
      )}>
        <Coins className={cn(
          "w-4 h-4",
          isCritical 
            ? "text-red-400" 
            : isLow 
              ? "text-amber-400"
              : "text-blue-400"
        )} />
      </div>
      
      {/* Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-lg font-bold leading-none",
            isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-foreground"
          )}>
            {coins !== null ? coins : '-'}
          </span>
          <span className="text-xs text-muted-foreground">/ {maxCoins}</span>
          
          {isLow && (
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              isCritical 
                ? "bg-red-500/20 text-red-400"
                : "bg-amber-500/20 text-amber-400"
            )}>
              <AlertTriangle className="w-2.5 h-2.5" />
              {isCritical ? 'Crítico' : 'Baixo'}
            </div>
          )}
        </div>
        
        {/* Mini Progress Bar */}
        <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCritical 
                ? "bg-red-500" 
                : isLow 
                  ? "bg-amber-500"
                  : "bg-blue-500"
            )}
            style={{ width: `${coinPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
