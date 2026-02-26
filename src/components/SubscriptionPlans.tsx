import { useState } from 'react';
import { Check, Sparkles, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlansProps {
  onCheckout: (priceId: string) => Promise<void>;
  currentPriceId?: string | null;
  subscriptionEnd?: string | null;
  onManageSubscription?: () => Promise<void>;
}

const benefits = [
  "Acesso a mais de +50 ferramentas premium",
  "Inteligências Artificiais de última geração",
  "Ferramentas de espionagem e mineração",
  "Design e edição profissional ilimitados",
  "SEO e análise de mercado",
  "Suporte prioritário",
  "Atualizações constantes",
  "Acesso imediato",
];

export default function SubscriptionPlans({ onCheckout, currentPriceId, subscriptionEnd, onManageSubscription }: SubscriptionPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      await onCheckout(priceId);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: 'monthly',
      ...PLANS.monthly,
      badge: 'MAIS POPULAR',
      badgeClass: 'bg-primary text-primary-foreground',
      borderClass: 'border-accent/40 hover:border-accent/70',
      shadow: '0 0 60px -20px hsl(var(--accent) / 0.6)',
    },
    {
      key: 'quarterly',
      ...PLANS.quarterly,
      badge: 'MELHOR CUSTO',
      badgeClass: 'bg-accent text-accent-foreground',
      borderClass: 'border-primary/40 hover:border-primary/70',
      shadow: '0 0 100px -20px hsl(var(--primary) / 0.6)',
    },
    {
      key: 'annual',
      ...PLANS.annual,
      badge: 'ECONOMIA MÁXIMA',
      badgeClass: 'bg-cyan-500 text-white',
      borderClass: 'border-cyan-500/40 hover:border-cyan-500/70',
      shadow: '0 0 60px -20px hsl(180 100% 50% / 0.6)',
    },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Escolha seu <span className="text-primary">Plano</span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Assine para desbloquear todas as ferramentas premium
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPriceId === plan.price_id;
          return (
            <div
              key={plan.key}
              className={`relative p-6 rounded-2xl bg-card/40 border-2 ${plan.borderClass} transition-all duration-300 hover:scale-[1.02] ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              style={{ boxShadow: plan.shadow }}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3" /> SEU PLANO
                  </span>
                </div>
              )}

              <div className="flex justify-center mb-4">
                <span className={`px-4 py-1.5 rounded-full text-xs font-display font-bold ${plan.badgeClass} shadow-lg`}>
                  {plan.badge}
                </span>
              </div>

              <div className="text-center">
                <h4 className="text-xl font-display font-bold text-accent mb-3">
                  {plan.name.toUpperCase()}
                </h4>
                <p className="my-3">
                  <span className="text-4xl font-display font-bold text-primary">
                    R${plan.price}
                  </span>
                  <span className="text-lg text-foreground">{plan.interval}</span>
                </p>
                {plan.perMonth && (
                  <p className="text-primary text-sm font-semibold">{plan.perMonth}</p>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mt-6 font-display font-bold"
                  onClick={onManageSubscription}
                >
                  Gerenciar Assinatura
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold"
                  onClick={() => handleCheckout(plan.price_id)}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === plan.price_id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  ASSINAR AGORA
                </Button>
              )}

              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Pagamento seguro via Stripe
              </p>
            </div>
          );
        })}
      </div>

      {subscriptionEnd && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Sua assinatura renova em{' '}
          <span className="text-foreground font-medium">
            {new Date(subscriptionEnd).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </p>
      )}
    </div>
  );
}
