/**
 * Mobile In-App Purchase (IAP) Service
 * 
 * Integrates React Native IAP with backend payments API for:
 * - Subscription purchases (iOS/Android)
 * - Receipt verification
 * - Subscription status sync
 * - Restore purchases
 * 
 * Location: apps/mobile/src/lib/iap-service.ts
 */

import { Platform } from 'react-native'
import { apiClient } from '../utils/api-client'
import { createLogger } from '../utils/logger'

// Types for react-native-iap (will be available after package installation)

// Payment types (matching web payments-types.ts)
export type PlatformStore = 'web' | 'ios' | 'android'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'trial'

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  store: PlatformStore
  startDate: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  isComp?: boolean
  compReason?: string
  compByUserId?: string
  metadata: Record<string, unknown>
}

export interface UserEntitlements {
  userId: string
  planTier: 'free' | 'premium' | 'elite'
  entitlements: string[]
  consumables: Record<string, number>
  updatedAt: string
}

const logger = createLogger('IAPService')

// Product ID mapping: IAP product IDs -> backend plan IDs
// These should match the product IDs configured in App Store Connect / Google Play Console
const PRODUCT_ID_MAP: Record<string, string> = {
  // iOS/Android Premium Monthly
  'com.pawfectmatch.premium.monthly': 'premium-monthly',
  'com.pawfectmatch.premium.monthly.ios': 'premium-monthly',
  'com.pawfectmatch.premium.monthly.android': 'premium-monthly',
  
  // iOS/Android Premium Yearly
  'com.pawfectmatch.premium.yearly': 'premium-yearly',
  'com.pawfectmatch.premium.yearly.ios': 'premium-yearly',
  'com.pawfectmatch.premium.yearly.android': 'premium-yearly',
  
  // iOS/Android Elite Monthly
  'com.pawfectmatch.elite.monthly': 'elite-monthly',
  'com.pawfectmatch.elite.monthly.ios': 'elite-monthly',
  'com.pawfectmatch.elite.monthly.android': 'elite-monthly',
  
  // iOS/Android Elite Yearly
  'com.pawfectmatch.elite.yearly': 'elite-yearly',
  'com.pawfectmatch.elite.yearly.ios': 'elite-yearly',
  'com.pawfectmatch.elite.yearly.android': 'elite-yearly',
  
  // Consumables
  'com.pawfectmatch.boosts.5': 'boosts-5',
  'com.pawfectmatch.boosts.10': 'boosts-10',
  'com.pawfectmatch.super_likes.5': 'super-likes-5',
  'com.pawfectmatch.super_likes.10': 'super-likes-10',
}

export interface IAPProduct {
  productId: string
  planId: string
  title: string
  description: string
  price: string
  currency: string
  localizedPrice: string
}

export interface PurchaseResult {
  success: boolean
  subscription?: Subscription | undefined
  entitlements?: UserEntitlements | undefined
  error?: string | undefined
}

export interface ReceiptVerificationRequest {
  receiptData: string
  productId: string
  transactionId: string
  platform: PlatformStore
  userId: string
}

class IAPService {
  private isInitialized = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private purchaseUpdateListener: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private purchaseErrorListener: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private availableProducts: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private availableSubscriptions: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private iap: any = null

  /**
   * Initialize IAP service and connect to store
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('IAP service already initialized')
      return
    }

    try {
      // Dynamically import react-native-iap to avoid type errors before package installation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const IAP = require('react-native-iap')
      this.iap = IAP

      await IAP.initConnection()
      this.isInitialized = true
      logger.info('IAP service initialized')

      // Set up purchase listeners
      this.setupPurchaseListeners()

      // Load available products
      await this.loadProducts()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize IAP service', err)
      throw err
    }
  }

  /**
   * Load available products and subscriptions from store
   */
  async loadProducts(): Promise<void> {
    if (!this.iap) {
      throw new Error('IAP service not initialized')
    }

    try {
      const productIds = Object.keys(PRODUCT_ID_MAP)
      
      // Get products (consumables/non-consumables)
      const products = await this.iap.getProducts({ skus: productIds })
      this.availableProducts = products

      // Get subscriptions
      const subscriptions = await this.iap.getSubscriptions({ skus: productIds })
      this.availableSubscriptions = subscriptions

      logger.info('Products loaded', {
        products: products.length,
        subscriptions: subscriptions.length
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load products', err)
      throw err
    }
  }

  /**
   * Get available products formatted for UI
   */
  getAvailableProducts(): IAPProduct[] {
    const allProducts = [...this.availableProducts, ...this.availableSubscriptions]
    
    return allProducts.map((product: { productId: string; title: string; description: string; price: string; currency?: string; localizedPrice?: string }) => {
      const planId = PRODUCT_ID_MAP[product.productId] ?? product.productId
      
      return {
        productId: product.productId,
        planId,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency ?? 'USD',
        localizedPrice: product.localizedPrice ?? product.price
      }
    })
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(
    productId: string,
    userId: string
  ): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const planId = PRODUCT_ID_MAP[productId]
      if (!planId) {
        throw new Error(`Unknown product ID: ${productId}`)
      }

      logger.info('Starting subscription purchase', { productId, planId, userId })

      if (!this.iap) {
        throw new Error('IAP service not initialized')
      }

      // Request purchase from store
       
      const purchase = await this.iap.requestSubscription({
        sku: productId,
        ...(Platform.OS === 'android' && { 
          // Android-specific options
          obfuscatedAccountIdAndroid: userId,
          obfuscatedProfileIdAndroid: userId
        })
      })

      // Verify receipt with backend
      const verificationResult = await this.verifyReceipt({
         
        receiptData: (purchase.transactionReceipt ?? purchase.purchaseToken) ?? '',
        productId,
         
        transactionId: purchase.transactionId ?? '',
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        userId
      })

      if (!verificationResult.success) {
        // Acknowledge purchase failure (Android)
         
        if (Platform.OS === 'android' && purchase.purchaseToken) {
          try {
             
            await this.iap.acknowledgePurchaseAndroid(purchase.purchaseToken)
          } catch (ackError) {
            logger.warn('Failed to acknowledge purchase', ackError instanceof Error ? ackError : new Error(String(ackError)))
          }
        }
        
        return {
          success: false,
          error: verificationResult.error ?? 'Receipt verification failed'
        }
      }

      // Acknowledge purchase (Android)
       
      if (Platform.OS === 'android' && purchase.purchaseToken) {
         
        await this.iap.acknowledgePurchaseAndroid(purchase.purchaseToken)
      }

      // Finish transaction (iOS)
       
      if (Platform.OS === 'ios' && purchase.transactionId) {
         
        await this.iap.finishTransaction({ purchase })
      }

      logger.info('Subscription purchase completed', {
        productId,
        subscriptionId: verificationResult.subscription?.id
      })

      return {
        success: true,
        subscription: verificationResult.subscription,
        entitlements: verificationResult.entitlements
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Purchase failed', err, { productId, userId })
      
      // Handle specific IAP errors
      if (err.message.includes('E_USER_CANCELLED')) {
        return { success: false, error: 'Purchase cancelled by user' }
      }
      
      return { success: false, error: err.message }
    }
  }

  /**
   * Purchase a consumable (boosts, super likes)
   */
  async purchaseConsumable(
    productId: string,
    userId: string
  ): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      logger.info('Starting consumable purchase', { productId, userId })

      if (!this.iap) {
        throw new Error('IAP service not initialized')
      }

      // Request purchase from store
       
      const purchase = await this.iap.requestPurchase({
        sku: productId,
        ...(Platform.OS === 'android' && {
          obfuscatedAccountIdAndroid: userId,
          obfuscatedProfileIdAndroid: userId
        })
      })

      // Verify receipt with backend
      const verificationResult = await this.verifyReceipt({
         
        receiptData: (purchase.transactionReceipt ?? purchase.purchaseToken) ?? '',
        productId,
         
        transactionId: purchase.transactionId ?? '',
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        userId
      })

      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error ?? 'Receipt verification failed'
        }
      }

      // Consume purchase (Android) - allows repurchase
       
      if (Platform.OS === 'android' && purchase.purchaseToken) {
         
        await this.iap.consumePurchaseAndroid(purchase.purchaseToken)
      }

      // Finish transaction (iOS)
       
      if (Platform.OS === 'ios' && purchase.transactionId) {
         
        await this.iap.finishTransaction({ purchase })
      }

      logger.info('Consumable purchase completed', { productId })

      return {
        success: true,
        entitlements: verificationResult.entitlements
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Consumable purchase failed', err, { productId, userId })
      
      if (err.message.includes('E_USER_CANCELLED')) {
        return { success: false, error: 'Purchase cancelled by user' }
      }
      
      return { success: false, error: err.message }
    }
  }

  /**
   * Verify receipt with backend and create/update subscription
   */
  private async verifyReceipt(
    request: ReceiptVerificationRequest
  ): Promise<PurchaseResult> {
    try {
      const planId = PRODUCT_ID_MAP[request.productId]
      if (!planId) {
        throw new Error(`Unknown product ID: ${request.productId}`)
      }

      // Send receipt to backend for verification
      const response = await apiClient.post<{
        subscription?: Subscription
        entitlements?: UserEntitlements
        verified: boolean
      }>('/payments/subscription/verify-receipt', {
        receiptData: request.receiptData,
        productId: request.productId,
        planId,
        transactionId: request.transactionId,
        platform: request.platform,
        userId: request.userId
      })

      if (!response.verified) {
        return {
          success: false,
          error: 'Receipt verification failed'
        }
      }

      return {
        success: true,
        subscription: response.subscription,
        entitlements: response.entitlements
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Receipt verification failed', err, { productId: request.productId })
      return {
        success: false,
        error: err.message
      }
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(userId: string): Promise<{
    restored: boolean
    subscriptions: Subscription[]
    entitlements?: UserEntitlements
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      logger.info('Restoring purchases', { userId })

      if (!this.iap) {
        throw new Error('IAP service not initialized')
      }

      // Get available purchases from store
       
      const availablePurchases = await this.iap.getAvailablePurchases()

       
      if (availablePurchases.length === 0) {
        logger.info('No purchases to restore')
        return { restored: false, subscriptions: [] }
      }

      // Verify all purchases with backend
      const verifiedSubscriptions: Subscription[] = []

      for (const purchase of availablePurchases) {
        try {
          const verificationResult = await this.verifyReceipt({
             
            receiptData: (purchase.transactionReceipt ?? purchase.purchaseToken) ?? '',
             
            productId: purchase.productId,
             
            transactionId: purchase.transactionId ?? '',
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            userId
          })

          if (verificationResult.success && verificationResult.subscription) {
            verifiedSubscriptions.push(verificationResult.subscription)
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.warn('Failed to verify purchase during restore', {
            error: err.message,
             
            productId: purchase.productId
          })
        }
      }

      // Get updated entitlements
      const entitlementsResponse = await apiClient.get<{
        entitlements: UserEntitlements
      }>(`/payments/entitlements?userId=${userId}`)

      logger.info('Purchases restored', {
        count: verifiedSubscriptions.length
      })

      return {
        restored: true,
        subscriptions: verifiedSubscriptions,
        entitlements: entitlementsResponse.entitlements
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to restore purchases', err, { userId })
      throw err
    }
  }

  /**
   * Set up purchase update and error listeners
   */
  private setupPurchaseListeners(): void {
    if (!this.iap) {
      logger.warn('IAP module not available, skipping listener setup')
      return
    }

    // Listen for purchase updates
     
    this.purchaseUpdateListener = this.iap.purchaseUpdatedListener(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (purchase: any) => {
        logger.info('Purchase updated', {
           
          productId: purchase.productId,
           
          transactionId: purchase.transactionId
        })

        // Handle purchase update (e.g., subscription renewed)
        // This is typically handled by the backend via webhooks,
        // but we can sync here if needed
      }
    )

    // Listen for purchase errors
     
    this.purchaseErrorListener = this.iap.purchaseErrorListener(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        const err = error instanceof Error ? error : new Error(String(error.message ?? 'Unknown error'))
        logger.error('Purchase error', err, {
           
          code: error.code,
           
          message: error.message
        })
      }
    )
  }

  /**
   * Get current subscription status from backend
   */
  async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
    try {
      const response = await apiClient.get<{
        subscription: Subscription | null
      }>(`/payments/subscription?userId=${userId}`)
      
      return response.subscription
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get subscription status', err, { userId })
      return null
    }
  }

  /**
   * Clean up IAP service
   */
  async cleanup(): Promise<void> {
    try {
      if (this.purchaseUpdateListener) {
         
        this.purchaseUpdateListener.remove()
        this.purchaseUpdateListener = null
      }

      if (this.purchaseErrorListener) {
         
        this.purchaseErrorListener.remove()
        this.purchaseErrorListener = null
      }

      if (this.isInitialized && this.iap) {
         
        await this.iap.endConnection()
        this.isInitialized = false
      }

      logger.info('IAP service cleaned up')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to cleanup IAP service', err)
    }
  }
}

export const iapService = new IAPService()

