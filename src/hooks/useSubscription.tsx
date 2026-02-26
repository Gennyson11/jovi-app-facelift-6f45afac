import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const PLANS = {
  monthly: {
    name: 'Mensal',
    price: 30,
    price_id: 'price_1T59F6C9Swi888lI7WngVygc',
    interval: '/mês',
  },
  quarterly: {
    name: 'Trimestral',
    price: 85,
    price_id: 'price_1T59NeC9Swi888lIdF4yAWJV',
    interval: '/trimestre',
    perMonth: 'R$28,33/mês',
  },
  annual: {
    name: 'Anual',
    price: 297,
    price_id: 'price_1T59O9C9Swi888lI61yhDDIX',
    interval: '/ano',
    perMonth: 'R$24,75/mês',
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  priceId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    priceId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setState({
        subscribed: data?.subscribed ?? false,
        priceId: data?.price_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();

    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async (priceId: string) => {
    if (!session?.access_token) return;

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { priceId },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) return;

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const currentPlan = state.priceId
    ? Object.values(PLANS).find(p => p.price_id === state.priceId)
    : null;

  return {
    ...state,
    currentPlan,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
