/**
 * Shared billing contracts used by both web and mobile clients.
 * All API responses emitted by the billing backend must conform to
 * these types to guarantee cross-platform compatibility.
 */

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'business'

export type BillingInterval = 'month' | 'year'

export interface BillingPlanPerk {
  readonly id: string
  readonly label: string
  readonly description?: string
}

export interface BillingPlan {
  readonly id: string
  readonly tier: SubscriptionTier
  readonly name: string
  readonly description?: string
  readonly interval: BillingInterval
  readonly priceCents: number
  readonly currency: string
  readonly perks: readonly BillingPlanPerk[]
  readonly trialDays?: number
  readonly mostPopular?: boolean
}

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export interface SubscriptionInfo {
  readonly id: string
  readonly tier: SubscriptionTier
  readonly status: SubscriptionStatus
  readonly currentPeriodEnd: string | null
  readonly cancelAtPeriodEnd: boolean
  readonly trialEndsAt: string | null
  readonly planId: string | null
  readonly currency: string | null
  readonly priceCents: number | null
  readonly renewalUrl?: string | null
  readonly manageUrl?: string | null
}

export interface CheckoutSession {
  readonly sessionId: string
  readonly url: string
  readonly expiresAt: string
}

export interface BillingPortalSession {
  readonly url: string
  readonly expiresAt: string
}

export class BillingClientError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'BillingClientError'
    this.status = status
  }
}
