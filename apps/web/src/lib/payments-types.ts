export type PlanTier = 'free' | 'premium' | 'elite';
export type PurchaseType = 'subscription' | 'consumable';
export type PlatformStore = 'web' | 'ios' | 'android';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'trial';

export type EntitlementKey =
  | 'unlimited_swipes'
  | 'who_liked_you'
  | 'video_calls'
  | 'advanced_filters'
  | 'priority_support'
  | 'read_receipts'
  | 'rewind'
  | 'boost_5x'
  | 'boost_10x'
  | 'super_like_5x'
  | 'super_like_10x';

export type ConsumableKey = 'boosts' | 'super_likes';

export interface PlanDefinition {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  entitlements: EntitlementKey[];
  trialDays?: number;
  popular?: boolean;
}

export interface ConsumableDefinition {
  id: string;
  key: ConsumableKey;
  name: string;
  description: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface ProductCatalog {
  version: string;
  lastUpdated: string;
  plans: PlanDefinition[];
  consumables: ConsumableDefinition[];
}

export interface UserEntitlements {
  userId: string;
  planTier: PlanTier;
  entitlements: EntitlementKey[];
  consumables: Record<ConsumableKey, number>;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  store: PlatformStore;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  isComp?: boolean;
  compReason?: string;
  compByUserId?: string;
  metadata: Record<string, unknown>;
}

export interface PurchaseReceipt {
  id: string;
  userId: string;
  type: PurchaseType;
  productId: string;
  store: PlatformStore;
  transactionId: string;
  receiptData: string;
  verifiedAt?: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface SubscriptionEvent {
  id: string;
  type: 'created' | 'renewed' | 'canceled' | 'expired' | 'refunded' | 'grace_period' | 'updated';
  subscriptionId: string;
  userId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface BillingIssue {
  id: string;
  userId: string;
  subscriptionId: string;
  type: 'payment_failed' | 'card_expired' | 'insufficient_funds';
  gracePeriodEnd: string;
  attemptCount: number;
  resolved: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  targetUserId?: string;
  targetSubscriptionId?: string;
  details: Record<string, unknown>;
  reason?: string;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  churnRate: number;
  trialConversionRate: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  canceledSubscriptionsThisMonth: number;
  revenueByPlan: Record<PlanTier, number>;
  revenueByStore: Record<PlatformStore, number>;
}
