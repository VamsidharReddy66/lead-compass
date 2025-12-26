import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSubscription(data as Subscription | null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isTrialActive = () => {
    if (!subscription) return false;
    if (subscription.status !== 'trial') return false;
    if (!subscription.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) > new Date();
  };

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    if (subscription.status === 'active') {
      if (!subscription.subscription_ends_at) return true;
      return new Date(subscription.subscription_ends_at) > new Date();
    }
    return false;
  };

  const hasAccess = () => {
    return isTrialActive() || isSubscriptionActive();
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    
    if (isTrialActive() && subscription.trial_ends_at) {
      const diff = new Date(subscription.trial_ends_at).getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    if (isSubscriptionActive() && subscription.subscription_ends_at) {
      const diff = new Date(subscription.subscription_ends_at).getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    return 0;
  };

  const updateSubscription = async (updates: Partial<Subscription>) => {
    if (!user || !subscription) return;

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', user.id);

    if (updateError) throw updateError;
    await fetchSubscription();
  };

  return {
    subscription,
    isLoading,
    error,
    isTrialActive: isTrialActive(),
    isSubscriptionActive: isSubscriptionActive(),
    hasAccess: hasAccess(),
    daysRemaining: getDaysRemaining(),
    refetch: fetchSubscription,
    updateSubscription,
  };
};
