import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const PLANS = {
  monthly: {
    name: 'Mensal',
    price: 37,
    checkout_url: 'https://pay.cakto.com.br/z4jkfp5_580328',
    interval: '/mês',
  },
  quarterly: {
    name: 'Trimestral',
    price: 97,
    checkout_url: 'https://pay.cakto.com.br/scp6yiy_590727',
    interval: '/trimestre',
    perMonth: 'R$32/mês',
  },
  annual: {
    name: 'Anual',
    price: 297,
    checkout_url: 'https://pay.cakto.com.br/rjwpjtb_686697',
    interval: '/ano',
    perMonth: 'R$24,75/mês',
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  accessExpiresAt: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    accessExpiresAt: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user?.id) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_access, access_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const hasAccess = profile?.has_access ?? false;
      const expiresAt = profile?.access_expires_at ?? null;
      
      // Check if access is still valid
      let isActive = hasAccess;
      if (hasAccess && expiresAt) {
        isActive = new Date(expiresAt) > new Date();
      }

      setState({
        subscribed: isActive,
        accessExpiresAt: expiresAt,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, [user?.id]);

  useEffect(() => {
    checkSubscription();

    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const openCheckout = (checkoutUrl: string) => {
    window.open(checkoutUrl, '_blank');
  };

  return {
    ...state,
    checkSubscription,
    openCheckout,
  };
}
