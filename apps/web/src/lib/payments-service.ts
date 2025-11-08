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

const logger = createLogger('PaymentsService');

export class PaymentsService {
  static async getCatalog() {
    return PRODUCT_CATALOG;
  }

  static async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    try {
      return await paymentsApi.getUserEntitlements(userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update entitlements', err, { userId, planTier });
      throw err;
    }
  }

  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      return await paymentsApi.getUserSubscription(userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
        getPlanById(planId)?.tier || 'premium',
        reason,
        actorUserId
      );

      return subscription;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create billing issue', err, { userId, subscriptionId });
      throw err;
    }
  }

  static async getUserBillingIssue(userId: string): Promise<BillingIssue | null> {
    try {
      return await paymentsApi.getUserBillingIssue(userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user billing issue', err, { userId });
      throw err;
    }
  }

  static async resolveBillingIssue(issueId: string): Promise<void> {
    try {
      await paymentsApi.resolveBillingIssue(issueId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to resolve billing issue', err, { issueId });
      throw err;
    }
  }

  static async createSubscriptionEvent(event: {
    subscriptionId: string;
    userId: string;
    type: SubscriptionEvent['type'];
    metadata: Record<string, unknown>;
  }): Promise<SubscriptionEvent> {
    // Subscription events are typically created by the backend
    // This method is kept for backward compatibility
    logger.warn('createSubscriptionEvent should be handled by backend', { event });
    return {
      id: '',
      ...event,
      timestamp: new Date().toISOString(),
    };
  }

  static async logAudit(entry: {
    actorUserId: string;
    action: string;
    targetUserId?: string;
    targetSubscriptionId?: string;
    details: Record<string, unknown>;
    reason?: string;
  }): Promise<AuditLogEntry> {
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get audit logs', err);
      throw err;
    }
  }

  static async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      return await paymentsApi.getAllSubscriptions();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all subscriptions', err);
      throw err;
    }
  }

  static async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      return await paymentsApi.getRevenueMetrics();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get revenue metrics', err);
      throw err;
    }
  }
}
