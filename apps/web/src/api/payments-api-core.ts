import type { UsageCounter } from '@/core/domain/business';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';
import type {
  AuditLogEntry,
  BillingIssue,
  ConsumableKey,
  PlanTier,
  PlatformStore,
  RevenueMetrics,
  Subscription,
  UserEntitlements,
} from '@/lib/payments-types';
import type {
  AddConsumableRequest,
  AddConsumableResponse,
  CreateBillingIssueRequest,
  CreateBillingIssueResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  GetAuditLogsResponse,
  GetBillingIssueResponse,
  GetAllSubscriptionsResponse,
  GetEntitlementsResponse,
  GetRevenueMetricsResponse,
  GetSubscriptionResponse,
  GetUsageCounterResponse,
  IncrementUsageRequest,
  IncrementUsageResponse,
  RedeemConsumableRequest,
  RedeemConsumableResponse,
  UpdateEntitlementsRequest,
  UpdateEntitlementsResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
} from './payments-api-types';

const logger = createLogger('PaymentsApi');

export class PaymentsApiImpl {
  /**
   * GET /payments/entitlements
   * Get user entitlements
   */
  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    try {
      const response = await APIClient.get<GetEntitlementsResponse>(
        `${ENDPOINTS.PAYMENTS.ENTITLEMENTS}?userId=${userId}`
      );
      return response.data.entitlements;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user entitlements', err, { userId });
      throw err;
    }
  }

  /**
   * PUT /payments/entitlements
   * Update entitlements
   */
  async updateEntitlements(
    userId: string,
    planTier: PlanTier,
    reason?: string,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    try {
      const request: UpdateEntitlementsRequest = {
        planTier,
        ...(reason !== undefined && { reason }),
        ...(actorUserId !== undefined && { actorUserId }),
      };

      const response = await APIClient.put<UpdateEntitlementsResponse>(
        `${String(ENDPOINTS.PAYMENTS.UPDATE_ENTITLEMENTS ?? '')}?userId=${String(userId ?? '')}`,
        request
      );
      return response.data.entitlements;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update entitlements', err, { userId, planTier });
      throw err;
    }
  }

  /**
   * GET /payments/subscription
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const response = await APIClient.get<GetSubscriptionResponse>(
        `${ENDPOINTS.PAYMENTS.SUBSCRIPTION}?userId=${userId}`
      );
      return response.data.subscription;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user subscription', err, { userId });
      throw err;
    }
  }

  /**
   * POST /payments/subscription
   * Create subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    store: PlatformStore,
    metadata: Record<string, unknown> = {}
  ): Promise<Subscription> {
    try {
      const request: CreateSubscriptionRequest = {
        planId,
        store,
        metadata,
      };

      const response = await APIClient.post<CreateSubscriptionResponse>(
        `${String(ENDPOINTS.PAYMENTS.CREATE_SUBSCRIPTION ?? '')}?userId=${String(userId ?? '')}`,
        request
      );
      return response.data.subscription;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create subscription', err, { userId, planId });
      throw err;
    }
  }

  /**
   * PATCH /payments/subscription/:id
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    data: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    try {
      const response = await APIClient.patch<UpdateSubscriptionResponse>(
        ENDPOINTS.PAYMENTS.UPDATE_SUBSCRIPTION(subscriptionId),
        data
      );
      return response.data.subscription;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update subscription', err, { subscriptionId });
      throw err;
    }
  }

  /**
   * POST /payments/consumables
   * Add consumables
   */
  async addConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    quantity: number,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    try {
      const request: AddConsumableRequest = {
        consumableKey,
        quantity,
        ...(actorUserId !== undefined && { actorUserId }),
      };

      const response = await APIClient.post<AddConsumableResponse>(
        `${String(ENDPOINTS.PAYMENTS.CONSUMABLES ?? '')}?userId=${String(userId ?? '')}`,
        request
      );
      return response.data.entitlements;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add consumable', err, { userId, consumableKey });
      throw err;
    }
  }

  /**
   * POST /payments/consumables/redeem
   * Redeem consumable
   */
  async redeemConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    idempotencyKey: string
  ): Promise<{ success: boolean; remaining: number }> {
    try {
      const request: RedeemConsumableRequest = {
        consumableKey,
        idempotencyKey,
      };

      const response = await APIClient.post<RedeemConsumableResponse>(
        `${String(ENDPOINTS.PAYMENTS.CONSUMABLES ?? '')}/redeem?userId=${String(userId ?? '')}`,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to redeem consumable', err, { userId, consumableKey });
      throw err;
    }
  }

  /**
   * GET /payments/billing-issue
   * Get user billing issue
   */
  async getUserBillingIssue(userId: string): Promise<BillingIssue | null> {
    try {
      const response = await APIClient.get<GetBillingIssueResponse>(
        `/payments/billing-issue?userId=${userId}`
      );
      return response.data.issue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get billing issue', err, { userId });
      throw err;
    }
  }

  /**
   * POST /payments/billing-issue
   * Create billing issue
   */
  async createBillingIssue(
    userId: string,
    subscriptionId: string,
    type: 'payment_failed' | 'card_expired' | 'insufficient_funds'
  ): Promise<BillingIssue> {
    try {
      const request: CreateBillingIssueRequest = {
        subscriptionId,
        type,
      };

      const response = await APIClient.post<CreateBillingIssueResponse>(
        `/payments/billing-issue?userId=${String(userId ?? '')}`,
        request
      );
      return response.data.issue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create billing issue', err, { userId, subscriptionId });
      throw err;
    }
  }

  /**
   * POST /payments/billing-issue/:id/resolve
   * Resolve billing issue
   */
  async resolveBillingIssue(issueId: string): Promise<void> {
    try {
      await APIClient.post(`/payments/billing-issue/${issueId}/resolve`, {});
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to resolve billing issue', err, { issueId });
      throw err;
    }
  }

  /**
   * GET /payments/audit-logs
   * Get audit logs
   */
  async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    try {
      const response = await APIClient.get<GetAuditLogsResponse>(
        `/payments/audit-logs?limit=${limit}`
      );
      return response.data.logs;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get audit logs', err);
      throw err;
    }
  }

  /**
   * GET /payments/subscriptions/all
   * Get all subscriptions (admin)
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const response = await APIClient.get<GetAllSubscriptionsResponse>(
        '/payments/subscriptions/all'
      );
      return response.data.subscriptions;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all subscriptions', err);
      throw err;
    }
  }

  /**
   * GET /payments/revenue-metrics
   * Get revenue metrics (admin)
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const response = await APIClient.get<GetRevenueMetricsResponse>('/payments/revenue-metrics');
      return response.data.metrics;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get revenue metrics', err);
      throw err;
    }
  }

  /**
   * GET /payments/usage-counter
   * Get usage counter for user
   */
  async getUsageCounter(userId: string, date?: string): Promise<UsageCounter> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('userId', userId);
      if (date) {
        queryParams.append('date', date);
      }

      const response = await APIClient.get<GetUsageCounterResponse>(
        `/payments/usage-counter?${queryParams.toString()}`
      );
      return response.data.usageCounter;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get usage counter', err, { userId, date });
      throw err;
    }
  }

  /**
   * POST /payments/usage-counter/increment
   * Increment usage counter atomically (idempotent with operationId)
   */
  async incrementUsage(
    userId: string,
    type: 'swipe' | 'super_like' | 'boost',
    operationId?: string
  ): Promise<{ success: boolean; remaining?: number; limit?: number }> {
    try {
      const request: IncrementUsageRequest = {
        type,
        ...(operationId ? { operationId } : {}),
      };

      const response = await APIClient.post<IncrementUsageResponse>(
        `/payments/usage-counter/increment?userId=${String(userId ?? '')}`,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to increment usage', err, { userId, type, operationId });
      throw err;
    }
  }
}

