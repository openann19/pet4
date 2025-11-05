import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Subscription {
  plan: 'free' | 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  nextBillingDate?: string;
  entitlements: string[];
  purchaseDate?: string;
  billingPeriod?: 'monthly' | 'yearly';
}

interface BillingIssue {
  type: 'payment_failed' | 'card_expired' | 'insufficient_funds';
  gracePeriodEnd: string;
  message?: string;
}

const STORAGE_KEY_SUBSCRIPTION = '@subscription';
const STORAGE_KEY_BILLING_ISSUE = '@billing_issue';

const DEFAULT_ENTITLEMENTS = {
  free: [
    'Basic matching',
    '5 likes per day',
    'Chat with matches',
    'View profiles',
    'Community posts',
  ],
  premium: [
    'Unlimited likes',
    'See who liked you',
    'Video calls',
    'Advanced filters',
    'Priority support',
    'No ads',
  ],
  elite: [
    'All Premium features',
    'Live streaming',
    'Verified badge',
    'Premium support 24/7',
    'Exclusive events',
    'Early access to features',
  ],
};

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'free',
    status: 'active',
    entitlements: DEFAULT_ENTITLEMENTS.free,
  });
  const [billingIssue, setBillingIssue] = useState<BillingIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription data
  useEffect(() => {
    loadSubscription();
    loadBillingIssue();
  }, []);

  const loadSubscription = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (saved) {
        const parsedSubscription = JSON.parse(saved);
        setSubscription(parsedSubscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBillingIssue = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_BILLING_ISSUE);
      if (saved) {
        const parsedIssue = JSON.parse(saved);
        setBillingIssue(parsedIssue);
      }
    } catch (error) {
      console.error('Failed to load billing issue:', error);
    }
  };

  const saveSubscription = async (newSubscription: Subscription) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify(newSubscription)
      );
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Failed to save subscription:', error);
      throw error;
    }
  };

  const saveBillingIssue = async (issue: BillingIssue | null) => {
    try {
      if (issue) {
        await AsyncStorage.setItem(STORAGE_KEY_BILLING_ISSUE, JSON.stringify(issue));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_BILLING_ISSUE);
      }
      setBillingIssue(issue);
    } catch (error) {
      console.error('Failed to save billing issue:', error);
    }
  };

  const subscribe = useCallback(
    async (plan: 'premium' | 'elite', billingPeriod: 'monthly' | 'yearly' = 'monthly') => {
      try {
        // Calculate next billing date
        const nextBillingDate = new Date();
        if (billingPeriod === 'monthly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }

        const newSubscription: Subscription = {
          plan,
          status: 'active',
          nextBillingDate: nextBillingDate.toISOString(),
          entitlements: DEFAULT_ENTITLEMENTS[plan],
          purchaseDate: new Date().toISOString(),
          billingPeriod,
        };

        await saveSubscription(newSubscription);
        
        // Clear any billing issues
        await saveBillingIssue(null);

        return { success: true };
      } catch (error) {
        console.error('Failed to subscribe:', error);
        return { success: false, error: 'Failed to process subscription' };
      }
    },
    []
  );

  const cancelSubscription = useCallback(async () => {
    try {
      const updatedSubscription: Subscription = {
        ...subscription,
        status: 'cancelled',
      };

      await saveSubscription(updatedSubscription);

      return { success: true };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }, [subscription]);

  const updatePaymentMethod = useCallback(async () => {
    try {
      // Clear billing issue
      await saveBillingIssue(null);

      // Update subscription status if it was past_due
      if (subscription.status === 'past_due') {
        const updatedSubscription: Subscription = {
          ...subscription,
          status: 'active',
        };
        await saveSubscription(updatedSubscription);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update payment method:', error);
      return { success: false, error: 'Failed to update payment method' };
    }
  }, [subscription]);

  const dismissBillingIssue = useCallback(async () => {
    await saveBillingIssue(null);
  }, []);

  const hasPremiumFeature = useCallback(
    (feature: string): boolean => {
      return subscription.entitlements.some((e) =>
        e.toLowerCase().includes(feature.toLowerCase())
      );
    },
    [subscription.entitlements]
  );

  const isPremium = subscription.plan === 'premium' || subscription.plan === 'elite';
  const isElite = subscription.plan === 'elite';

  return {
    subscription,
    billingIssue,
    isLoading,
    isPremium,
    isElite,
    subscribe,
    cancelSubscription,
    updatePaymentMethod,
    dismissBillingIssue,
    hasPremiumFeature,
  };
};
