/**
 * useSubscription Hook - Mobile Implementation
 *
 * Combines local storage with API calls for subscription management
 * Provides offline support and optimistic updates
 * Location: apps/mobile/src/hooks/payments/useSubscription.ts
 */

import { useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import { useStorage } from '@/hooks/use-storage'
import {
  useSubscriptionQuery,
  useCreateSubscription,
  useCancelSubscription,
  useRestorePurchases,
  useBillingIssues,
} from '@/hooks/api/use-payments'
import type { Subscription } from '@/components/payments/SubscriptionStatusCard'
import type { BillingIssue } from '@/components/payments/BillingIssueBanner'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useSubscription')

const STORAGE_KEY_SUBSCRIPTION = '@subscription'
const STORAGE_KEY_BILLING_ISSUE = '@billing_issue'

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
} as const

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  entitlements: [...DEFAULT_ENTITLEMENTS.free],
}

export interface UseSubscriptionOptions {
  userId: string
  enabled?: boolean
}

export interface UseSubscriptionReturn {
  subscription: Subscription
  billingIssue: BillingIssue | null
  isLoading: boolean
  isPremium: boolean
  isElite: boolean
  subscribe: (plan: 'premium' | 'elite', billingPeriod: 'monthly' | 'yearly') => Promise<{ success: boolean; error?: string }>
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>
  updatePaymentMethod: () => Promise<{ success: boolean; error?: string }>
  dismissBillingIssue: () => Promise<void>
  hasPremiumFeature: (feature: string) => boolean
  restorePurchases: () => Promise<{ success: boolean; error?: string }>
}

/**
 * Hook to manage user subscription
 * Combines local storage with API calls for offline support
 */
export function useSubscription(
  options: UseSubscriptionOptions
): UseSubscriptionReturn {
  const { userId, enabled = true } = options

  // Local storage for offline support
  const [localSubscription, setLocalSubscription] = useStorage<Subscription>(
    `${STORAGE_KEY_SUBSCRIPTION}:${userId}`,
    DEFAULT_SUBSCRIPTION
  )
  const [localBillingIssue, setLocalBillingIssue] = useStorage<BillingIssue | null>(
    `${STORAGE_KEY_BILLING_ISSUE}:${userId}`,
    null
  )

  // API hooks
  const {
    data: apiSubscription,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription,
  } = useSubscriptionQuery(enabled && !!userId ? userId : '')
  const {
    data: apiBillingIssue,
    isLoading: isLoadingBillingIssue,
  } = useBillingIssues(enabled && !!userId ? userId : '')

  const createSubscriptionMutation = useCreateSubscription()
  const cancelSubscriptionMutation = useCancelSubscription()
  const restorePurchasesMutation = useRestorePurchases()

  // Sync API data to local storage
  useEffect(() => {
    if (apiSubscription) {
      setLocalSubscription(apiSubscription)
    }
  }, [apiSubscription, setLocalSubscription])

  useEffect(() => {
    if (apiBillingIssue !== undefined) {
      setLocalBillingIssue(apiBillingIssue)
    }
  }, [apiBillingIssue, setLocalBillingIssue])

  // Use API data if available, otherwise use local storage
  const subscription = apiSubscription ?? localSubscription ?? DEFAULT_SUBSCRIPTION
  const billingIssue = apiBillingIssue ?? localBillingIssue
  const isLoading = isLoadingSubscription || isLoadingBillingIssue

  const subscribe = useCallback(
    async (
      plan: 'premium' | 'elite',
      billingPeriod: 'monthly' | 'yearly' = 'monthly'
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        logger.info('Subscribing to plan', { userId, plan, billingPeriod })

        // Calculate next billing date
        const nextBillingDate = new Date()
        if (billingPeriod === 'monthly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        } else {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        }

        // Optimistic update
        const optimisticSubscription: Subscription = {
          plan,
          status: 'active',
          nextBillingDate: nextBillingDate.toISOString(),
          entitlements: [...DEFAULT_ENTITLEMENTS[plan]],
          purchaseDate: new Date().toISOString(),
          billingPeriod,
        }
        setLocalSubscription(optimisticSubscription)
        setLocalBillingIssue(null)

        // Create subscription via API
        // Note: In production, you would integrate with payment SDKs (react-native-purchases, etc.)
        // to get receipt data before calling the API
        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'

        await createSubscriptionMutation.mutateAsync({
          userId,
          planId: plan,
          platform,
          billingCycle: billingPeriod,
          // receiptData and purchaseToken would come from payment SDKs
        })

        // Refetch to get server response
        await refetchSubscription()

        logger.info('Subscription created successfully', { userId, plan })
        return { success: true }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to subscribe', err, { userId, plan, billingPeriod })

        // Revert optimistic update
        await refetchSubscription()

        return { success: false, error: err.message }
      }
    },
    [
      userId,
      setLocalSubscription,
      setLocalBillingIssue,
      createSubscriptionMutation,
      refetchSubscription,
    ]
  )

  const cancelSubscription = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!subscription.plan || subscription.plan === 'free') {
        return { success: false, error: 'No active subscription to cancel' }
      }

      logger.info('Cancelling subscription', { userId, plan: subscription.plan })

      // Optimistic update
      const updatedSubscription: Subscription = {
        ...subscription,
        status: 'cancelled',
      }
      setLocalSubscription(updatedSubscription)

      // Cancel via API
      await cancelSubscriptionMutation.mutateAsync({
        userId,
        subscriptionId: subscription.plan,
      })

      // Refetch to get server response
      await refetchSubscription()

      logger.info('Subscription cancelled successfully', { userId })
      return { success: true }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to cancel subscription', err, { userId })

      // Revert optimistic update
      await refetchSubscription()

      return { success: false, error: err.message }
    }
  }, [userId, subscription, setLocalSubscription, cancelSubscriptionMutation, refetchSubscription])

  const updatePaymentMethod = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.info('Updating payment method', { userId })

      // Clear billing issue
      setLocalBillingIssue(null)

      // Update subscription status if it was past_due
      if (subscription.status === 'past_due') {
        const updatedSubscription: Subscription = {
          ...subscription,
          status: 'active',
        }
        setLocalSubscription(updatedSubscription)
      }

      // Refetch to sync with server
      await refetchSubscription()

      logger.info('Payment method updated successfully', { userId })
      return { success: true }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update payment method', err, { userId })
      return { success: false, error: err.message }
    }
  }, [userId, subscription, setLocalBillingIssue, setLocalSubscription, refetchSubscription])

  const dismissBillingIssue = useCallback(async (): Promise<void> => {
    setLocalBillingIssue(null)
  }, [setLocalBillingIssue])

  const hasPremiumFeature = useCallback(
    (feature: string): boolean => {
      return subscription.entitlements.some((e) =>
        e.toLowerCase().includes(feature.toLowerCase())
      )
    },
    [subscription.entitlements]
  )

  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return { success: false, error: 'Restore purchases only available on iOS and Android' }
      }

      logger.info('Restoring purchases', { userId, platform: Platform.OS })

      const platform = Platform.OS === 'ios' ? 'ios' : 'android'
      const restored = await restorePurchasesMutation.mutateAsync({
        userId,
        platform,
      })

      if (restored) {
        // Refetch subscription after restore
        await refetchSubscription()
        logger.info('Purchases restored successfully', { userId, platform })
        return { success: true }
      } else {
        return { success: false, error: 'No purchases to restore' }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to restore purchases', err, { userId })
      return { success: false, error: err.message }
    }
  }, [userId, restorePurchasesMutation, refetchSubscription])

  const isPremium = subscription.plan === 'premium' || subscription.plan === 'elite'
  const isElite = subscription.plan === 'elite'

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
    restorePurchases,
  }
}
