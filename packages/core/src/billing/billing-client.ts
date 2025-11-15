// packages/core/src/billing/billing-client.ts

import {
  BillingClientError,
  BillingPlan,
  BillingPortalSession,
  CheckoutSession,
  SubscriptionInfo,
} from './billing-types'

export interface BillingClientOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

/**
 * Lightweight Billing API client used by both web and mobile.
 * It talks to your backend-only billing routes, not to Stripe directly.
 */
export class BillingClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(options: BillingClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api/billing'
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async getPlans(signal?: AbortSignal): Promise<BillingPlan[]> {
    const res = await this.fetchImpl(`${this.baseUrl}/plans`, { signal })

    if (!res.ok) {
      throw new BillingClientError(`Failed to load billing plans (${res.status})`, res.status)
    }

    const data = (await res.json()) as BillingPlan[]
    return data
  }

  async getSubscription(signal?: AbortSignal): Promise<SubscriptionInfo | null> {
    const res = await this.fetchImpl(`${this.baseUrl}/subscription`, { signal })

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new BillingClientError(`Failed to load subscription (${res.status})`, res.status)
    }

    const data = (await res.json()) as SubscriptionInfo | null
    return data
  }

  async createCheckoutSession(planId: string, returnUrl?: string): Promise<CheckoutSession> {
    const res = await this.fetchImpl(`${this.baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, returnUrl }),
    })

    if (!res.ok) {
      throw new BillingClientError(`Failed to create checkout session (${res.status})`, res.status)
    }

    const data = (await res.json()) as CheckoutSession
    return data
  }

  async createBillingPortalSession(): Promise<BillingPortalSession> {
    const res = await this.fetchImpl(`${this.baseUrl}/portal`, {
      method: 'POST',
    })

    if (!res.ok) {
      throw new BillingClientError(
        `Failed to create billing portal session (${res.status})`,
        res.status
      )
    }

    const data = (await res.json()) as BillingPortalSession
    return data
  }
}

export const billingClient = new BillingClient()
