/**
 * Payment Service - Mobile Implementation
 *
 * Handles payment processing, receipt validation, and subscription management
 * Location: apps/mobile/src/services/payment-service.ts
 */

import { createLogger } from '@/utils/logger'
import { apiClient } from '@/utils/api-client'
import type { Subscription } from '@/components/payments/SubscriptionStatusCard'
import type { BillingIssue } from '@/components/payments/BillingIssueBanner'

const logger = createLogger('PaymentService')

export interface CreateSubscriptionRequest {
  userId: string
  planId: string
  platform: 'ios' | 'android' | 'web'
  billingCycle: 'monthly' | 'yearly'
  receiptData?: string // Base64 encoded receipt for iOS/Android
  purchaseToken?: string // Google Play purchase token
  transactionId?: string // App Store transaction ID
}

export interface CreateSubscriptionResponse {
  subscription: Subscription
  success: boolean
  error?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  label: string
}

export interface ReceiptValidationResult {
  valid: boolean
  subscription?: Subscription
  error?: string
  transactionId?: string
}

/**
 * Payment Service Class
 * Handles all payment-related operations
 */
class PaymentService {
  /**
   * Create a new subscription
   */
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<CreateSubscriptionResponse> {
    try {
      logger.info('Creating subscription', { planId: request.planId, platform: request.platform })

      const response = await apiClient.post<CreateSubscriptionResponse>(
        '/payments/subscriptions',
        request,
        {
          retries: 2,
          timeout: 30000,
        }
      )

      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create subscription')
      }

      logger.info('Subscription created successfully', {
        planId: request.planId,
        subscriptionId: response.subscription.plan,
      })

      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create subscription', err, { request })
      throw err
    }
  }

  /**
   * Validate receipt (iOS App Store)
   */
  async validateIOSReceipt(receiptData: string): Promise<ReceiptValidationResult> {
    try {
      logger.info('Validating iOS receipt')

      const response = await apiClient.post<ReceiptValidationResult>(
        '/payments/validate/ios',
        { receiptData },
        {
          retries: 1,
          timeout: 15000,
        }
      )

      if (!response.valid) {
        logger.warn('iOS receipt validation failed', { error: response.error })
      } else {
        logger.info('iOS receipt validated successfully', {
          transactionId: response.transactionId,
        })
      }

      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to validate iOS receipt', err)
      return {
        valid: false,
        error: err.message,
      }
    }
  }

  /**
   * Validate purchase token (Android Google Play)
   */
  async validateAndroidPurchase(
    purchaseToken: string,
    productId: string
  ): Promise<ReceiptValidationResult> {
    try {
      logger.info('Validating Android purchase', { productId })

      const response = await apiClient.post<ReceiptValidationResult>(
        '/payments/validate/android',
        { purchaseToken, productId },
        {
          retries: 1,
          timeout: 15000,
        }
      )

      if (!response.valid) {
        logger.warn('Android purchase validation failed', { error: response.error })
      } else {
        logger.info('Android purchase validated successfully', {
          transactionId: response.transactionId,
        })
      }

      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to validate Android purchase', err)
      return {
        valid: false,
        error: err.message,
      }
    }
  }

  /**
   * Get user's current subscription
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      logger.info('Fetching subscription', { userId })

      const subscription = await apiClient.get<Subscription>(
        `/payments/subscriptions/${userId}`,
        {
          cacheKey: `subscription:${userId}`,
          skipCache: false,
        }
      )

      logger.info('Subscription fetched successfully', { plan: subscription.plan })
      return subscription
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to fetch subscription', err, { userId })
      return null
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    try {
      logger.info('Cancelling subscription', { userId, subscriptionId })

      await apiClient.delete<void>(`/payments/subscriptions/${subscriptionId}`, {
        retries: 1,
        timeout: 15000,
      })

      logger.info('Subscription cancelled successfully', { subscriptionId })
      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to cancel subscription', err, { userId, subscriptionId })
      return false
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    isDefault: boolean
  ): Promise<boolean> {
    try {
      logger.info('Updating payment method', { userId, paymentMethodId, isDefault })

      await apiClient.put<void>(`/payments/methods/${paymentMethodId}`, {
        isDefault,
      })

      logger.info('Payment method updated successfully', { paymentMethodId })
      return true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update payment method', err, { userId, paymentMethodId })
      return false
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      logger.info('Fetching payment methods', { userId })

      const methods = await apiClient.get<PaymentMethod[]>(
        `/payments/methods?userId=${userId}`,
        {
          cacheKey: `payment-methods:${userId}`,
          skipCache: false,
        }
      )

      logger.info('Payment methods fetched successfully', { count: methods.length })
      return methods
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to fetch payment methods', err, { userId })
      return []
    }
  }

  /**
   * Get billing issues
   */
  async getBillingIssues(userId: string): Promise<BillingIssue | null> {
    try {
      logger.info('Fetching billing issues', { userId })

      const issue = await apiClient.get<BillingIssue | null>(
        `/payments/billing-issues?userId=${userId}`,
        {
          cacheKey: `billing-issues:${userId}`,
          skipCache: false,
        }
      )

      if (issue) {
        logger.info('Billing issue found', { type: issue.type, userId })
      }

      return issue
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to fetch billing issues', err, { userId })
      return null
    }
  }

  /**
   * Restore purchases (iOS/Android)
   */
  async restorePurchases(userId: string, platform: 'ios' | 'android'): Promise<boolean> {
    try {
      logger.info('Restoring purchases', { userId, platform })

      const response = await apiClient.post<{ restored: boolean }>(
        '/payments/restore',
        { userId, platform },
        {
          retries: 1,
          timeout: 30000,
        }
      )

      if (response.restored) {
        logger.info('Purchases restored successfully', { userId, platform })
      } else {
        logger.warn('No purchases to restore', { userId, platform })
      }

      return response.restored
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to restore purchases', err, { userId, platform })
      return false
    }
  }
}

export const paymentService = new PaymentService()
