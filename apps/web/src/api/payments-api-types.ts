import type { UsageCounter } from '@/core/domain/business';
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

export interface GetEntitlementsResponse {
  entitlements: UserEntitlements;
}

export interface UpdateEntitlementsRequest {
  planTier: PlanTier;
  reason?: string;
  actorUserId?: string;
}

export interface UpdateEntitlementsResponse {
  entitlements: UserEntitlements;
}

export interface GetSubscriptionResponse {
  subscription: Subscription | null;
}

export interface CreateSubscriptionRequest {
  planId: string;
  store: PlatformStore;
  metadata?: Record<string, unknown>;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
}

export interface UpdateSubscriptionRequest {
  status?: Subscription['status'];
  cancelAtPeriodEnd?: boolean;
}

export interface UpdateSubscriptionResponse {
  subscription: Subscription;
}

export interface AddConsumableRequest {
  consumableKey: ConsumableKey;
  quantity: number;
  actorUserId?: string;
}

export interface AddConsumableResponse {
  entitlements: UserEntitlements;
}

export interface RedeemConsumableRequest {
  consumableKey: ConsumableKey;
  idempotencyKey: string;
}

export interface RedeemConsumableResponse {
  success: boolean;
  remaining: number;
}

export interface GetBillingIssueResponse {
  issue: BillingIssue | null;
}

export interface CreateBillingIssueRequest {
  subscriptionId: string;
  type: 'payment_failed' | 'card_expired' | 'insufficient_funds';
}

export interface CreateBillingIssueResponse {
  issue: BillingIssue;
}

export interface GetAuditLogsResponse {
  logs: AuditLogEntry[];
}

export interface GetAllSubscriptionsResponse {
  subscriptions: Subscription[];
}

export interface GetRevenueMetricsResponse {
  metrics: RevenueMetrics;
}

export interface GetUsageCounterResponse {
  usageCounter: UsageCounter;
}

export interface IncrementUsageRequest {
  type: 'swipe' | 'super_like' | 'boost';
  operationId?: string;
}

export interface IncrementUsageResponse {
  success: boolean;
  remaining?: number;
  limit?: number;
}

