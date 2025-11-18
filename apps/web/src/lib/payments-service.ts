import type {
  UserEntitlements,
  Subscription,
  SubscriptionEvent,
  BillingIssue,
  AuditLogEntry,
  PlanTier,
  PlatformStore,
  ConsumableKey,
  RevenueMetrics,
} from './payments-types';
import { PRODUCT_CATALOG, getPlanById } from './payments-catalog';
import { paymentsApi } from '@/api/payments-api';
import { createLogger } from './logger';

// Re-export types for consumers
export type {
  Subscription,
  AuditLogEntry,
  RevenueMetrics,
  SubscriptionEvent,
  BillingIssue,
  PlanTier,
  PlatformStore,
  ConsumableKey,
  UserEntitlements,
};

const logger = createLogger('PaymentsService');

export class PaymentsService {
  static getCatalog() {
    return PRODUCT_CATALOG;
  }

  static async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    try {
      return await paymentsApi.getUserEntitlements(userId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user entitlements', err, { userId });
      throw err;
    }
  }

  static async updateEntitlements(
    userId: string,
    planTier: PlanTier,
    reason?: string,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    try {
      return await paymentsApi.updateEntitlements(userId, planTier, reason, actorUserId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to update entitlements', err, { userId, planTier });
      throw err;
    }
  }

  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      return await paymentsApi.getUserSubscription(userId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user subscription', err, { userId });
      throw err;
    }
  }

  static async createSubscription(
    userId: string,
    planId: string,
    store: PlatformStore,
    metadata: Record<string, unknown> = {}
  ): Promise<Subscription> {
    try {
      return await paymentsApi.createSubscription(userId, planId, store, metadata);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to create subscription', err, { userId, planId });
      throw err;
    }
  }

  static async cancelSubscription(
    subscriptionId: string,
    immediate = false,
    actorUserId?: string,
    reason?: string
  ): Promise<Subscription> {
    try {
      // Get subscription by ID (query all subscriptions to find by ID)
      const allSubscriptions = await paymentsApi.getAllSubscriptions();
      const subscription = allSubscriptions.find((s) => s.id === subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const updateData = immediate ? { status: 'canceled' as const } : { cancelAtPeriodEnd: true };

      const updated = await paymentsApi.updateSubscription(subscriptionId, updateData);

      if (immediate) {
        await paymentsApi.updateEntitlements(subscription.userId, 'free', reason, actorUserId);
      }

      return updated;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to cancel subscription', err, { subscriptionId });
      throw err;
    }
  }

  static async compSubscription(
    userId: string,
    planId: string,
    months: number,
    actorUserId: string,
    reason: string
  ): Promise<Subscription> {
    try {
      // Comp subscription is essentially a free subscription with a specific duration
      const subscription = await paymentsApi.createSubscription(userId, planId, 'web', {
        compMonths: months,
        compReason: reason,
        compByUserId: actorUserId,
      });

      await paymentsApi.updateEntitlements(
        userId,
        getPlanById(planId)?.tier ?? 'premium',
        reason,
        actorUserId
      );

      return subscription;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to comp subscription', err, { userId, planId });
      throw err;
    }
  }

  static async addConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    quantity: number,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    try {
      return await paymentsApi.addConsumable(userId, consumableKey, quantity, actorUserId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to add consumable', err, { userId, consumableKey });
      throw err;
    }
  }

  static async redeemConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    idempotencyKey: string
  ): Promise<{ success: boolean; remaining: number }> {
    try {
      return await paymentsApi.redeemConsumable(userId, consumableKey, idempotencyKey);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to redeem consumable', err, { userId, consumableKey });
      throw err;
    }
  }

  static async createBillingIssue(
    userId: string,
    subscriptionId: string,
    type: 'payment_failed' | 'card_expired' | 'insufficient_funds'
  ): Promise<BillingIssue> {
    try {
      return await paymentsApi.createBillingIssue(userId, subscriptionId, type);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to create billing issue', err, { userId, subscriptionId });
      throw err;
    }
  }

  static async getUserBillingIssue(userId: string): Promise<BillingIssue | null> {
    try {
      return await paymentsApi.getUserBillingIssue(userId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user billing issue', err, { userId });
      throw err;
    }
  }

  static async resolveBillingIssue(issueId: string): Promise<void> {
    try {
      await paymentsApi.resolveBillingIssue(issueId);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to resolve billing issue', err, { issueId });
      throw err;
    }
  }

  static createSubscriptionEvent(event: {
    subscriptionId: string;
    userId: string;
    type: SubscriptionEvent['type'];
    metadata: Record<string, unknown>;
  }): SubscriptionEvent {
    // Subscription events are typically created by the backend
    // This method is kept for backward compatibility
    logger.warn('createSubscriptionEvent should be handled by backend', { event });
    return {
      id: '',
      ...event,
      timestamp: new Date().toISOString(),
    };
  }

  static logAudit(entry: {
    actorUserId: string;
    action: string;
    targetUserId?: string;
    targetSubscriptionId?: string;
    details: Record<string, unknown>;
    reason?: string;
  }): AuditLogEntry {
    // Audit logs are typically handled by the backend
    // This method is kept for backward compatibility
    logger.warn('logAudit should be handled by backend', { entry });
    return {
      id: '',
      timestamp: new Date().toISOString(),
      actorRole: 'user',
      ...entry,
    };
  }

  static async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    try {
      return await paymentsApi.getAuditLogs(limit);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get audit logs', err);
      throw err;
    }
  }

  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      return await paymentsApi.getAllSubscriptions();
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get all subscriptions', err);
      throw err;
    }
  }

  static async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      return await paymentsApi.getRevenueMetrics();
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get revenue metrics', err);
      throw err;
    }
  }

  static async refundSubscription(
    subscriptionId: string,
    amount: number,
    userId: string,
    reason: string
  ): Promise<Subscription> {
    try {
      // Refunds should be handled by the backend payment provider
      // For now, we'll update the subscription status and log the action
      // TODO: Implement proper refund API endpoint

      // Get the current subscription
      const subscriptions = await paymentsApi.getAllSubscriptions();
      const subscription = subscriptions.find((s) => s.id === subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Log the refund action
      this.logAudit({
        actorUserId: userId,
        action: 'refund',
        targetSubscriptionId: subscriptionId,
        details: { amount, reason },
        reason,
      });

      // Return the subscription (refund processing should happen on the backend)
      // The subscription will be updated by the backend payment provider
      return subscription;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to refund subscription', err, { subscriptionId, amount, reason });
      throw err;
    }
  }
}
