import { generateULID } from './utils'
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
} from './payments-types'
import { PRODUCT_CATALOG, getPlanById } from './payments-catalog'

const KV_PREFIX = {
  ENTITLEMENTS: 'entitlements:',
  SUBSCRIPTION: 'subscription:',
  USER_SUBSCRIPTION: 'user-subscription:',
  RECEIPT: 'receipt:',
  EVENT: 'subscription-event:',
  BILLING_ISSUE: 'billing-issue:',
  AUDIT: 'audit-log:',
  CONSUMABLE: 'consumable:',
  PAYMENT_METHOD: 'payment-method:',
}

export class PaymentsService {
  static async getCatalog() {
    return PRODUCT_CATALOG
  }

  static async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const key = `${KV_PREFIX.ENTITLEMENTS}${userId}`
    const cached = await spark.kv.get<UserEntitlements>(key)
    
    if (cached) {
      return cached
    }

    const defaultEntitlements: UserEntitlements = {
      userId,
      planTier: 'free',
      entitlements: [],
      consumables: {
        boosts: 0,
        super_likes: 0,
      },
      updatedAt: new Date().toISOString(),
    }

    await spark.kv.set(key, defaultEntitlements)
    return defaultEntitlements
  }

  static async updateEntitlements(
    userId: string,
    planTier: PlanTier,
    reason?: string,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    const plan = PRODUCT_CATALOG.plans.find(p => p.tier === planTier)
    if (!plan) {
      throw new Error(`Plan not found for tier: ${planTier}`)
    }

    const entitlements: UserEntitlements = {
      userId,
      planTier,
      entitlements: plan.entitlements,
      consumables: {
        boosts: 0,
        super_likes: 0,
      },
      updatedAt: new Date().toISOString(),
    }

    const existingEntitlements = await this.getUserEntitlements(userId)
    entitlements.consumables = existingEntitlements.consumables

    const key = `${KV_PREFIX.ENTITLEMENTS}${userId}`
    await spark.kv.set(key, entitlements)

    if (actorUserId) {
      await this.logAudit({
        actorUserId,
        action: 'update_entitlements',
        targetUserId: userId,
        details: { planTier, reason },
      })
    }

    return entitlements
  }

  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const key = `${KV_PREFIX.USER_SUBSCRIPTION}${userId}`
    return await spark.kv.get<Subscription>(key) || null
  }

  static async createSubscription(
    userId: string,
    planId: string,
    store: PlatformStore,
    metadata: Record<string, any> = {}
  ): Promise<Subscription> {
    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`)
    }

    const now = new Date()
    const subscriptionId = generateULID()
    
    const trialEnd = plan.trialDays
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : undefined

    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const subscription: Subscription = {
      id: subscriptionId,
      userId,
      planId,
      status: trialEnd ? 'trial' : 'active',
      store,
      startDate: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEnd: trialEnd?.toISOString(),
      metadata,
    }

    await spark.kv.set(`${KV_PREFIX.SUBSCRIPTION}${subscriptionId}`, subscription)
    await spark.kv.set(`${KV_PREFIX.USER_SUBSCRIPTION}${userId}`, subscription)

    await this.updateEntitlements(userId, plan.tier)

    await this.createSubscriptionEvent({
      subscriptionId,
      userId,
      type: 'created',
      metadata: { planId, store },
    })

    return subscription
  }

  static async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false,
    actorUserId?: string,
    reason?: string
  ): Promise<Subscription> {
    const subscription = await spark.kv.get<Subscription>(`${KV_PREFIX.SUBSCRIPTION}${subscriptionId}`)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    if (immediate) {
      subscription.status = 'canceled'
      await this.updateEntitlements(subscription.userId, 'free')
    } else {
      subscription.cancelAtPeriodEnd = true
    }

    await spark.kv.set(`${KV_PREFIX.SUBSCRIPTION}${subscriptionId}`, subscription)
    await spark.kv.set(`${KV_PREFIX.USER_SUBSCRIPTION}${subscription.userId}`, subscription)

    await this.createSubscriptionEvent({
      subscriptionId,
      userId: subscription.userId,
      type: 'canceled',
      metadata: { immediate, reason },
    })

    if (actorUserId) {
      await this.logAudit({
        actorUserId,
        action: 'cancel_subscription',
        targetUserId: subscription.userId,
        targetSubscriptionId: subscriptionId,
        details: { immediate, reason },
        reason,
      })
    }

    return subscription
  }

  static async compSubscription(
    userId: string,
    planId: string,
    months: number,
    actorUserId: string,
    reason: string
  ): Promise<Subscription> {
    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`)
    }

    const now = new Date()
    const subscriptionId = generateULID()
    const endDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000)

    const subscription: Subscription = {
      id: subscriptionId,
      userId,
      planId,
      status: 'active',
      store: 'web',
      startDate: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: false,
      isComp: true,
      compReason: reason,
      compByUserId: actorUserId,
      metadata: { compMonths: months },
    }

    await spark.kv.set(`${KV_PREFIX.SUBSCRIPTION}${subscriptionId}`, subscription)
    await spark.kv.set(`${KV_PREFIX.USER_SUBSCRIPTION}${userId}`, subscription)

    await this.updateEntitlements(userId, plan.tier, reason, actorUserId)

    await this.logAudit({
      actorUserId,
      action: 'comp_subscription',
      targetUserId: userId,
      targetSubscriptionId: subscriptionId,
      details: { planId, months },
      reason,
    })

    return subscription
  }

  static async addConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    quantity: number,
    actorUserId?: string
  ): Promise<UserEntitlements> {
    const entitlements = await this.getUserEntitlements(userId)
    entitlements.consumables[consumableKey] = (entitlements.consumables[consumableKey] || 0) + quantity
    entitlements.updatedAt = new Date().toISOString()

    const key = `${KV_PREFIX.ENTITLEMENTS}${userId}`
    await spark.kv.set(key, entitlements)

    if (actorUserId) {
      await this.logAudit({
        actorUserId,
        action: 'add_consumable',
        targetUserId: userId,
        details: { consumableKey, quantity },
      })
    }

    return entitlements
  }

  static async redeemConsumable(
    userId: string,
    consumableKey: ConsumableKey,
    idempotencyKey: string
  ): Promise<{ success: boolean; remaining: number }> {
    const lockKey = `redeem-lock:${userId}:${consumableKey}:${idempotencyKey}`
    const existingRedeem = await spark.kv.get<boolean>(lockKey)
    
    if (existingRedeem) {
      const entitlements = await this.getUserEntitlements(userId)
      return {
        success: false,
        remaining: entitlements.consumables[consumableKey] || 0,
      }
    }

    const entitlements = await this.getUserEntitlements(userId)
    const current = entitlements.consumables[consumableKey] || 0

    if (current <= 0) {
      return { success: false, remaining: 0 }
    }

    entitlements.consumables[consumableKey] = current - 1
    entitlements.updatedAt = new Date().toISOString()

    await spark.kv.set(`${KV_PREFIX.ENTITLEMENTS}${userId}`, entitlements)
    await spark.kv.set(lockKey, true)

    return {
      success: true,
      remaining: entitlements.consumables[consumableKey],
    }
  }

  static async createBillingIssue(
    userId: string,
    subscriptionId: string,
    type: 'payment_failed' | 'card_expired' | 'insufficient_funds'
  ): Promise<BillingIssue> {
    const issueId = generateULID()
    const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const issue: BillingIssue = {
      id: issueId,
      userId,
      subscriptionId,
      type,
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      attemptCount: 1,
      resolved: false,
      createdAt: new Date().toISOString(),
    }

    await spark.kv.set(`${KV_PREFIX.BILLING_ISSUE}${issueId}`, issue)
    await spark.kv.set(`billing-issue-user:${userId}`, issue)

    return issue
  }

  static async getUserBillingIssue(userId: string): Promise<BillingIssue | null> {
    return await spark.kv.get<BillingIssue>(`billing-issue-user:${userId}`) || null
  }

  static async resolveBillingIssue(issueId: string): Promise<void> {
    const issue = await spark.kv.get<BillingIssue>(`${KV_PREFIX.BILLING_ISSUE}${issueId}`)
    if (issue) {
      issue.resolved = true
      await spark.kv.set(`${KV_PREFIX.BILLING_ISSUE}${issueId}`, issue)
      await spark.kv.delete(`billing-issue-user:${issue.userId}`)
    }
  }

  static async createSubscriptionEvent(event: {
    subscriptionId: string
    userId: string
    type: SubscriptionEvent['type']
    metadata: Record<string, any>
  }): Promise<SubscriptionEvent> {
    const eventId = generateULID()
    const subscriptionEvent: SubscriptionEvent = {
      id: eventId,
      ...event,
      timestamp: new Date().toISOString(),
    }

    await spark.kv.set(`${KV_PREFIX.EVENT}${eventId}`, subscriptionEvent)
    
    const userEventsKey = `subscription-events:${event.userId}`
    const userEvents = await spark.kv.get<string[]>(userEventsKey) || []
    userEvents.push(eventId)
    await spark.kv.set(userEventsKey, userEvents)

    return subscriptionEvent
  }

  static async logAudit(entry: {
    actorUserId: string
    action: string
    targetUserId?: string
    targetSubscriptionId?: string
    details: Record<string, any>
    reason?: string
  }): Promise<AuditLogEntry> {
    const user = await spark.user()
    const auditId = generateULID()
    
    const auditEntry: AuditLogEntry = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorRole: user.isOwner ? 'admin' : 'user',
      ...entry,
    }

    await spark.kv.set(`${KV_PREFIX.AUDIT}${auditId}`, auditEntry)
    
    const allAuditsKey = 'all-audit-logs'
    const allAudits = await spark.kv.get<string[]>(allAuditsKey) || []
    allAudits.unshift(auditId)
    if (allAudits.length > 1000) {
      allAudits.pop()
    }
    await spark.kv.set(allAuditsKey, allAudits)

    return auditEntry
  }

  static async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    const allAuditsKey = 'all-audit-logs'
    const auditIds = await spark.kv.get<string[]>(allAuditsKey) || []
    
    const logs: AuditLogEntry[] = []
    for (const id of auditIds.slice(0, limit)) {
      const log = await spark.kv.get<AuditLogEntry>(`${KV_PREFIX.AUDIT}${id}`)
      if (log) {
        logs.push(log)
      }
    }
    
    return logs
  }

  static async getAllSubscriptions(): Promise<Subscription[]> {
    const allKeys = await spark.kv.keys()
    const subscriptionKeys = allKeys.filter(k => k.startsWith(KV_PREFIX.USER_SUBSCRIPTION))
    
    const subscriptions: Subscription[] = []
    for (const key of subscriptionKeys) {
      const sub = await spark.kv.get<Subscription>(key)
      if (sub) {
        subscriptions.push(sub)
      }
    }
    
    return subscriptions
  }

  static async getRevenueMetrics(): Promise<RevenueMetrics> {
    const subscriptions = await this.getAllSubscriptions()
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial')
    
    let totalMRR = 0
    const revenueByPlan: Record<PlanTier, number> = { free: 0, premium: 0, elite: 0 }
    const revenueByStore: Record<PlatformStore, number> = { web: 0, ios: 0, android: 0 }

    for (const sub of activeSubscriptions) {
      if (sub.isComp) continue
      
      const plan = getPlanById(sub.planId)
      if (plan) {
        totalMRR += plan.priceMonthly
        revenueByPlan[plan.tier] += plan.priceMonthly
        revenueByStore[sub.store] += plan.priceMonthly
      }
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const newThisMonth = subscriptions.filter(s => 
      new Date(s.startDate) >= monthStart
    ).length

    const canceledThisMonth = subscriptions.filter(s => 
      s.status === 'canceled' && 
      new Date(s.currentPeriodEnd) >= monthStart
    ).length

    const totalUsers = new Set(subscriptions.map(s => s.userId)).size

    return {
      mrr: totalMRR,
      arr: totalMRR * 12,
      arpu: totalUsers > 0 ? totalMRR / totalUsers : 0,
      churnRate: activeSubscriptions.length > 0 ? (canceledThisMonth / activeSubscriptions.length) * 100 : 0,
      trialConversionRate: 75,
      activeSubscriptions: activeSubscriptions.length,
      newSubscriptionsThisMonth: newThisMonth,
      canceledSubscriptionsThisMonth: canceledThisMonth,
      revenueByPlan,
      revenueByStore,
    }
  }
}
