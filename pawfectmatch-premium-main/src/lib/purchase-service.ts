/**
 * Purchase Service
 * 
 * Handles in-app purchases, receipt validation, and entitlement grants.
 */

import type { Purchase, BusinessConfig } from './business-types'
import { generateULID } from './utils'
import { getUserEntitlements } from './entitlements-engine'
import { createLogger } from './logger'

const logger = createLogger('purchase-service')

const KV_PREFIX = {
  PURCHASE: 'purchase:',
  CONFIG: 'business-config:',
  AUDIT: 'audit-log:',
}

const ERROR_VERIFICATION_FAILED = 'Verification failed'
const ERROR_INVALID_RECEIPT = 'Invalid receipt'
const ERROR_INVALID_RESPONSE_FORMAT = 'Invalid response format'

interface VerificationResponse {
  valid: boolean
  sku?: string
  type?: string
  receipt?: string
  expiresAt?: string
  amount?: number
  currency?: string
  transactionId?: string
  error?: string
}

function isValidVerificationResponse(data: unknown): data is VerificationResponse {
  return typeof data === 'object' && data !== null && 'valid' in data && typeof (data as VerificationResponse).valid === 'boolean'
}

/**
 * Verify receipt with platform provider
 */
export async function verifyReceipt(
  platform: 'ios' | 'android' | 'web',
  receipt: string,
  userId: string
): Promise<{ valid: boolean; purchase?: Purchase; error?: string }> {
  try {
    // For web: validate Stripe receipt
    if (platform === 'web') {
      return await verifyStripeReceipt(receipt, userId)
    }

    // For iOS: validate with Apple
    if (platform === 'ios') {
      return await verifyAppleReceipt(receipt, userId)
    }

    // For Android: validate with Google Play
    if (platform === 'android') {
      return await verifyGoogleReceipt(receipt, userId)
    }

    return { valid: false, error: 'Unsupported platform' }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined
    logger.error('Receipt verification failed', error instanceof Error ? error : new Error(String(error)))
    return { valid: false, error: errorMessage || ERROR_VERIFICATION_FAILED }
  }
}

/**
 * Verify Stripe receipt (web)
 */
async function verifyStripeReceipt(
  receipt: string, // Stripe session ID or payment intent ID
  userId: string
): Promise<{ valid: boolean; purchase?: Purchase; error?: string }> {
  try {
    // Call backend API to verify with Stripe
    const response = await fetch('/api/v1/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'web', receipt, userId }),
    })

    if (!response.ok) {
      return { valid: false, error: ERROR_VERIFICATION_FAILED }
    }

    const data: unknown = await response.json()
    
    if (!isValidVerificationResponse(data)) {
      return { valid: false, error: ERROR_INVALID_RESPONSE_FORMAT }
    }
    
    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku || 'premium_monthly',
        type: 'subscription',
        platform: 'web',
        receipt: data.receipt || receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency || 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      }

      await savePurchase(purchase)
      await grantEntitlements(userId, purchase.sku)

      return { valid: true, purchase }
    }

    return { valid: false, error: data.error || ERROR_INVALID_RECEIPT }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined
    logger.error('Stripe receipt verification failed', error instanceof Error ? error : new Error(String(error)))
    return { valid: false, error: errorMessage || ERROR_VERIFICATION_FAILED }
  }
}

/**
 * Verify Apple receipt (iOS)
 */
async function verifyAppleReceipt(
  receipt: string,
  userId: string
): Promise<{ valid: boolean; purchase?: Purchase; error?: string }> {
  try {
    const response = await fetch('/api/v1/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'ios', receipt, userId }),
    })

    if (!response.ok) {
      return { valid: false, error: ERROR_VERIFICATION_FAILED }
    }

    const data: unknown = await response.json()
    
    if (!isValidVerificationResponse(data)) {
      return { valid: false, error: ERROR_INVALID_RESPONSE_FORMAT }
    }
    
    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku || 'premium_monthly',
        type: (data.type || 'subscription') as Purchase['type'],
        platform: 'ios',
        receipt: data.receipt || receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency || 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      }

      await savePurchase(purchase)
      await grantEntitlements(userId, purchase.sku)

      return { valid: true, purchase }
    }

    return { valid: false, error: data.error || ERROR_INVALID_RECEIPT }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined
    logger.error('Apple receipt verification failed', error instanceof Error ? error : new Error(String(error)))
    return { valid: false, error: errorMessage || ERROR_VERIFICATION_FAILED }
  }
}

/**
 * Verify Google Play receipt (Android)
 */
async function verifyGoogleReceipt(
  receipt: string,
  userId: string
): Promise<{ valid: boolean; purchase?: Purchase; error?: string }> {
  try {
    const response = await fetch('/api/v1/billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'android', receipt, userId }),
    })

    if (!response.ok) {
      return { valid: false, error: ERROR_VERIFICATION_FAILED }
    }

    const data: unknown = await response.json()
    
    if (!isValidVerificationResponse(data)) {
      return { valid: false, error: ERROR_INVALID_RESPONSE_FORMAT }
    }
    
    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku || 'premium_monthly',
        type: (data.type || 'subscription') as Purchase['type'],
        platform: 'android',
        receipt: data.receipt || receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency || 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      }

      await savePurchase(purchase)
      await grantEntitlements(userId, purchase.sku)

      return { valid: true, purchase }
    }

    return { valid: false, error: data.error || ERROR_INVALID_RECEIPT }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined
    logger.error('Google Play receipt verification failed', error instanceof Error ? error : new Error(String(error)))
    return { valid: false, error: errorMessage || ERROR_VERIFICATION_FAILED }
  }
}

/**
 * Save purchase to storage
 */
async function savePurchase(purchase: Purchase): Promise<void> {
  const key = `${KV_PREFIX.PURCHASE}${purchase.id}`
  await window.spark.kv.set(key, purchase)

  // Also index by user
  const userPurchases = await window.spark.kv.get<Purchase[]>(`${KV_PREFIX.PURCHASE}user:${purchase.userId}`) || []
  const updatedPurchases: Purchase[] = [...userPurchases, purchase]
  await window.spark.kv.set(`${KV_PREFIX.PURCHASE}user:${purchase.userId}`, updatedPurchases)
}

/**
 * Grant entitlements based on purchase
 */
async function grantEntitlements(userId: string, sku: string): Promise<void> {
  // Parse SKU to determine plan
  let plan: 'free' | 'premium' | 'elite' = 'free'
  
  if (sku.includes('premium')) {
    plan = 'premium'
  } else if (sku.includes('elite')) {
    plan = 'elite'
  } else if (sku.includes('boost')) {
    // Consumable boost - handled separately
    return
  } else if (sku.includes('super_like')) {
    // Consumable super like - handled separately
    return
  }

  // Update user plan
  const key = `entitlements:${userId}`
  await window.spark.kv.set(key, { plan, updatedAt: new Date().toISOString() })
}

/**
 * Handle refund/chargeback webhook
 */
export async function handleRefund(
  purchaseId: string,
  reason?: string
): Promise<void> {
  const key = `${KV_PREFIX.PURCHASE}${purchaseId}`
  const purchase = await window.spark.kv.get<Purchase>(key)
  
  if (!purchase) {
    return
  }

  // Update purchase status
  purchase.status = 'refunded'
  await window.spark.kv.set(key, purchase)

  // Revoke entitlements
  const entitlements = await getUserEntitlements(purchase.userId)
  if (entitlements.swipeDailyCap === 'unlimited') {
    // Downgrade to free plan
    const userKey = `entitlements:${purchase.userId}`
    await window.spark.kv.set(userKey, { 
      plan: 'free', 
      updatedAt: new Date().toISOString() 
    })
  }

  // Log audit
  await logAudit({
    action: 'refund_processed',
    userId: purchase.userId,
    purchaseId,
    reason,
  })
}

/**
 * Get business config
 */
export async function getBusinessConfig(): Promise<BusinessConfig | null> {
  const key = `${KV_PREFIX.CONFIG}current`
  return await window.spark.kv.get<BusinessConfig>(key) || null
}

/**
 * Update business config (admin only)
 */
export async function updateBusinessConfig(
  config: Partial<BusinessConfig>,
  updatedBy: string
): Promise<BusinessConfig> {
  const existing = await getBusinessConfig()
  
  const newConfig: BusinessConfig = {
    id: existing?.id || generateULID(),
    version: existing ? `${parseInt(existing.version) + 1}` : '1',
    prices: config.prices || existing?.prices || {
      premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
      elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
      boost: { price: 2.99, currency: 'USD' },
      superLike: { price: 0.99, currency: 'USD' },
    },
    limits: config.limits || existing?.limits || {
      free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
      premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
      elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
    },
    experiments: config.experiments || existing?.experiments || {},
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  const key = `${KV_PREFIX.CONFIG}current`
  await window.spark.kv.set(key, newConfig)

  // Log audit
  await logAudit({
    action: 'business_config_updated',
    userId: updatedBy,
    config: newConfig,
  })

  return newConfig
}

/**
 * Log audit entry
 */
async function logAudit(entry: {
  action: string
  userId: string
  purchaseId?: string
  reason?: string
  config?: BusinessConfig
}): Promise<void> {
  const auditEntry = {
    id: generateULID(),
    timestamp: new Date().toISOString(),
    ...entry,
  }

  const key = `${KV_PREFIX.AUDIT}${auditEntry.id}`
  await window.spark.kv.set(key, auditEntry)

  // Append to audit log list
  const auditLog = await window.spark.kv.get<typeof auditEntry[]>(`${KV_PREFIX.AUDIT}list`) || []
  auditLog.push(auditEntry)
  // Keep only last 1000 entries
  if (auditLog.length > 1000) {
    auditLog.shift()
  }
  await window.spark.kv.set(`${KV_PREFIX.AUDIT}list`, auditLog)
}

