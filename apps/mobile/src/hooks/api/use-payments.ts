/**
 * React Query hooks for payments API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-payments.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '@/lib/query-client'
import { paymentService } from '@/services/payment-service'
import type { Subscription } from '@/components/payments/SubscriptionStatusCard'
import type { BillingIssue } from '@/components/payments/BillingIssueBanner'
import type { PaymentMethod, CreateSubscriptionRequest } from '@/services/payment-service'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PaymentsAPIHooks')

/**
 * Hook to fetch user's subscription from API
 */
export function useSubscriptionQuery(userId: string): UseQueryResult<Subscription | null, Error> {
  return useQuery({
    queryKey: queryKeys.payments.subscription(userId),
    queryFn: () => paymentService.getSubscription(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch payment methods
 */
export function usePaymentMethods(userId: string): UseQueryResult<PaymentMethod[], Error> {
  return useQuery({
    queryKey: queryKeys.payments.methods(userId),
    queryFn: () => paymentService.getPaymentMethods(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch billing issues
 */
export function useBillingIssues(userId: string): UseQueryResult<BillingIssue | null, Error> {
  return useQuery({
    queryKey: queryKeys.payments.billingIssues(userId),
    queryFn: () => paymentService.getBillingIssues(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to create a new subscription
 */
export function useCreateSubscription(): UseMutationResult<
  Subscription,
  Error,
  {
    userId: string
    planId: string
    platform: 'ios' | 'android' | 'web'
    billingCycle: 'monthly' | 'yearly'
    receiptData?: string
    purchaseToken?: string
    transactionId?: string
  },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.payments.createSubscription,
    mutationFn: async data => {
      const requestData: CreateSubscriptionRequest = {
        userId: data.userId,
        planId: data.planId,
        platform: data.platform,
        billingCycle: data.billingCycle,
      }
      
      if (data.receiptData) {
        requestData.receiptData = data.receiptData
      }
      if (data.purchaseToken) {
        requestData.purchaseToken = data.purchaseToken
      }
      if (data.transactionId) {
        requestData.transactionId = data.transactionId
      }
      
      const response = await paymentService.createSubscription(requestData)

      if (!response.success || !response.subscription) {
        throw new Error(response.error ?? 'Failed to create subscription')
      }

      return response.subscription
    },
    onSuccess: (subscription, variables) => {
      // Invalidate subscription query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.subscription(variables.userId),
      })

      // Invalidate billing issues
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.billingIssues(variables.userId),
      })

      logger.info('Subscription created successfully', {
        userId: variables.userId,
        planId: variables.planId,
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create subscription', err)
    },
  })
}

/**
 * Hook to cancel a subscription
 */
export function useCancelSubscription(): UseMutationResult<
  boolean,
  Error,
  { userId: string; subscriptionId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.payments.cancelSubscription,
    mutationFn: async ({ userId, subscriptionId }) => {
      return await paymentService.cancelSubscription(userId, subscriptionId)
    },
    onSuccess: (_, variables) => {
      // Invalidate subscription query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.subscription(variables.userId),
      })

      logger.info('Subscription cancelled successfully', {
        userId: variables.userId,
        subscriptionId: variables.subscriptionId,
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to cancel subscription', err)
    },
  })
}

/**
 * Hook to update payment method
 */
export function useUpdatePaymentMethod(): UseMutationResult<
  boolean,
  Error,
  { userId: string; paymentMethodId: string; isDefault: boolean },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.payments.updatePaymentMethod,
    mutationFn: async ({ userId, paymentMethodId, isDefault }) => {
      return await paymentService.updatePaymentMethod(userId, paymentMethodId, isDefault)
    },
    onSuccess: (_, variables) => {
      // Invalidate payment methods query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.methods(variables.userId),
      })

      // Invalidate billing issues
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.billingIssues(variables.userId),
      })

      logger.info('Payment method updated successfully', {
        userId: variables.userId,
        paymentMethodId: variables.paymentMethodId,
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update payment method', err)
    },
  })
}

/**
 * Hook to restore purchases
 */
export function useRestorePurchases(): UseMutationResult<
  boolean,
  Error,
  { userId: string; platform: 'ios' | 'android' },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.payments.restorePurchases,
    mutationFn: async ({ userId, platform }) => {
      return await paymentService.restorePurchases(userId, platform)
    },
    onSuccess: (_, variables) => {
      // Invalidate subscription query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.subscription(variables.userId),
      })

      logger.info('Purchases restored successfully', {
        userId: variables.userId,
        platform: variables.platform,
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to restore purchases', err)
    },
  })
}
