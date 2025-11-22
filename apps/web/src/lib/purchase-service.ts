/**
 * Purchase Service
 *
 * Handles in-app purchases, receipt validation, and entitlement grants.
 */

import type { Purchase, BusinessConfig } from './business-types';
import type { OptionalWithUndef } from '../types/optional-with-undef';
import { generateULID } from './utils';
import { PaymentsService } from './payments-service';
import { APIClient } from './api-client';
import { createLogger } from './logger';

const logger = createLogger('purchase-service');

const ERROR_VERIFICATION_FAILED = 'Verification failed';
const ERROR_INVALID_RECEIPT = 'Invalid receipt';

interface VerificationResponse {
  valid: boolean;
  sku?: string;
  type?: string;
  receipt?: string;
  expiresAt?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  error?: string;
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
      return await verifyStripeReceipt(receipt, userId);
    }

    // For iOS: validate with Apple
    if (platform === 'ios') {
      return await verifyAppleReceipt(receipt, userId);
    }

    // For Android: validate with Google Play
    if (platform === 'android') {
      return await verifyGoogleReceipt(receipt, userId);
    }

    return { valid: false, error: 'Unsupported platform' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined;
    logger.error(
      'Receipt verification failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return { valid: false, error: errorMessage ?? ERROR_VERIFICATION_FAILED };
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
    const response = await APIClient.post<VerificationResponse>('/payments/verify-receipt', {
      platform: 'web',
      receipt,
      userId,
    });

    const data = response.data;

    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku ?? 'premium_monthly',
        type: 'subscription',
        platform: 'web',
        receipt: data.receipt ?? receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency ?? 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      };

      await savePurchase(purchase);
      await grantEntitlements(userId, purchase.sku);

      return { valid: true, purchase };
    }

    return { valid: false, error: data.error ?? ERROR_INVALID_RECEIPT };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined;
    logger.error(
      'Stripe receipt verification failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return { valid: false, error: errorMessage ?? ERROR_VERIFICATION_FAILED };
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
    const response = await APIClient.post<VerificationResponse>('/payments/verify-receipt', {
      platform: 'ios',
      receipt,
      userId,
    });

    const data = response.data;

    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku ?? 'premium_monthly',
        type: (data.type ?? 'subscription') as Purchase['type'],
        platform: 'ios',
        receipt: data.receipt ?? receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency ?? 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      };

      await savePurchase(purchase);
      await grantEntitlements(userId, purchase.sku);

      return { valid: true, purchase };
    }

    return { valid: false, error: data.error ?? ERROR_INVALID_RECEIPT };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined;
    logger.error(
      'Apple receipt verification failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return { valid: false, error: errorMessage ?? ERROR_VERIFICATION_FAILED };
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
    const response = await APIClient.post<VerificationResponse>('/payments/verify-receipt', {
      platform: 'android',
      receipt,
      userId,
    });

    const data = response.data;

    if (data.valid) {
      const purchase: Purchase = {
        id: generateULID(),
        userId,
        sku: data.sku ?? 'premium_monthly',
        type: (data.type ?? 'subscription') as Purchase['type'],
        platform: 'android',
        receipt: data.receipt ?? receipt,
        status: 'active',
        startedAt: new Date().toISOString(),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.amount !== undefined && { amount: data.amount }),
        currency: data.currency ?? 'USD',
        ...(data.transactionId && { transactionId: data.transactionId }),
        verifiedAt: new Date().toISOString(),
      };

      await savePurchase(purchase);
      await grantEntitlements(userId, purchase.sku);

      return { valid: true, purchase };
    }

    return { valid: false, error: data.error ?? ERROR_INVALID_RECEIPT };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : undefined;
    logger.error(
      'Google Play receipt verification failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return { valid: false, error: errorMessage ?? ERROR_VERIFICATION_FAILED };
  }
}

/**
 * Save purchase to storage
 */
async function savePurchase(purchase: Purchase): Promise<void> {
  try {
    await APIClient.post('/payments/purchases', purchase);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to save purchase', err, { purchaseId: purchase.id });
    throw err;
  }
}

/**
 * Grant entitlements based on purchase
 */
async function grantEntitlements(userId: string, sku: string): Promise<void> {
  try {
    // Parse SKU to determine plan
    let plan: 'free' | 'premium' | 'elite' = 'free';

    if (sku.includes('premium')) {
      plan = 'premium';
    } else if (sku.includes('elite')) {
      plan = 'elite';
    } else if (sku.includes('boost')) {
      // Consumable boost - handled separately
      await PaymentsService.addConsumable(userId, 'boosts', 1);
      return;
    } else if (sku.includes('super_like')) {
      // Consumable super like - handled separately
      await PaymentsService.addConsumable(userId, 'super_likes', 1);
      return;
    }

    // Update user plan
    if (plan !== 'free') {
      await PaymentsService.updateEntitlements(userId, plan);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to grant entitlements', err, { userId, sku });
    throw err;
  }
}

/**
 * Handle refund/chargeback webhook
 */
export async function handleRefund(purchaseId: string, reason?: string): Promise<void> {
  try {
    // Get purchase from API
    const response = await APIClient.get<{ purchase: Purchase }>(
      `/payments/purchases/${purchaseId}`
    );
    const purchase = response.data.purchase;

    if (!purchase) {
      return;
    }

    // Update purchase status
    await APIClient.patch(`/payments/purchases/${purchaseId}`, {
      status: 'refunded',
    });

    // Revoke entitlements - downgrade if user has a paid plan
    const entitlements = await PaymentsService.getUserEntitlements(purchase.userId);
    if (entitlements.planTier !== 'free') {
      // Downgrade to free plan
      await PaymentsService.updateEntitlements(purchase.userId, 'free', reason);
    }

    logger.info('Refund processed', { purchaseId, userId: purchase.userId, reason });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to handle refund', err, { purchaseId });
    throw err;
  }
}

/**
 * Get business config
 */
export async function getBusinessConfig(): Promise<BusinessConfig | null> {
  try {
    const response = await APIClient.get<{ config: BusinessConfig | null }>(
      '/payments/business-config'
    );
    return response.data.config;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get business config', err);
    throw err;
  }
}

/**
 * Update business config (admin only)
 */
export async function updateBusinessConfig(
  config: OptionalWithUndef<BusinessConfig>,
  updatedBy: string
): Promise<BusinessConfig> {
  try {
    const response = await APIClient.put<{ config: BusinessConfig }>('/payments/business-config', {
      ...config,
      updatedBy,
    });
    return response.data.config;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update business config', err, { updatedBy });
    throw err;
  }
}
