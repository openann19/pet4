/**
 * Payments API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { paymentsApi } from '@/api/payments-api'
import type { UserEntitlements, Subscription, BillingIssue, RevenueMetrics } from '@/lib/payments-types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockEntitlements: UserEntitlements = {
  userId: 'user-1',
  planTier: 'premium',
  entitlements: ['unlimited_swipes', 'who_liked_you'],
  consumables: {
    boosts: 5,
    super_likes: 10,
  },
  updatedAt: new Date().toISOString(),
}

const mockSubscription: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'plan-1',
  status: 'active',
  store: 'web',
  startDate: new Date().toISOString(),
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  metadata: {},
}

const mockBillingIssue: BillingIssue = {
  id: 'issue-1',
  userId: 'user-1',
  subscriptionId: 'sub-1',
  type: 'payment_failed',
  gracePeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  attemptCount: 1,
  resolved: false,
  createdAt: new Date().toISOString(),
}

const mockMetrics: RevenueMetrics = {
  mrr: 5000,
  arr: 60000,
  arpu: 50,
  churnRate: 0.05,
  trialConversionRate: 0.3,
  activeSubscriptions: 100,
  newSubscriptionsThisMonth: 10,
  canceledSubscriptionsThisMonth: 5,
  revenueByPlan: {
    free: 0,
    premium: 4000,
    elite: 1000,
  },
  revenueByStore: {
    web: 3000,
    ios: 1500,
    android: 500,
  },
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'GET' && url.pathname === '/payments/entitlements') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            entitlements: mockEntitlements,
          },
        })
      )
      return
    }

    if (req.method === 'PUT' && url.pathname === '/payments/entitlements') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            entitlements: mockEntitlements,
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/subscription') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            subscription: mockSubscription,
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/payments/subscription') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(
        JSON.stringify({
          data: {
            subscription: mockSubscription,
          },
        })
      )
      return
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/payments/subscription/')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            subscription: mockSubscription,
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/payments/consumables') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            entitlements: mockEntitlements,
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/payments/consumables/redeem') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            success: true,
            remaining: 4,
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/billing-issue') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            issue: mockBillingIssue,
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/payments/billing-issue') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(
        JSON.stringify({
          data: {
            issue: mockBillingIssue,
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/billing-issue/') && url.pathname.includes('/resolve')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: {} }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/audit-logs') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            logs: [],
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/subscriptions/all') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            subscriptions: [mockSubscription],
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/revenue-metrics') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            metrics: mockMetrics,
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/payments/usage-counter') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            usageCounter: {
              type: 'swipe',
              count: 10,
              limit: 100,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/payments/usage/increment') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            success: true,
            remaining: 90,
            limit: 100,
          },
        })
      )
      return
    }

    res.statusCode = 404
    res.end()
  })

  await new Promise<void>(resolve => {
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        process.env['TEST_API_PORT'] = String(address.port)
      }
      resolve()
    })
  })
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => { resolve(); }))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('PaymentsApi.getUserEntitlements', () => {
  it('should return entitlements', async () => {
    const entitlements = await paymentsApi.getUserEntitlements('user-1')

    expect(entitlements).toMatchObject({
      userId: 'user-1',
      planTier: expect.any(String),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.getUserEntitlements('user-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.updateEntitlements', () => {
  it('should update entitlements', async () => {
    const entitlements = await paymentsApi.updateEntitlements('user-1', 'premium')

    expect(entitlements).toMatchObject({
      planTier: 'premium',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.updateEntitlements('user-1', 'premium')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getUserSubscription', () => {
  it('should return subscription', async () => {
    const subscription = await paymentsApi.getUserSubscription('user-1')

    expect(subscription).toMatchObject({
      userId: 'user-1',
      status: expect.any(String),
    })
  })

  it('should return null for non-existent subscription', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { subscription: null } }),
    } as Response)

    const subscription = await paymentsApi.getUserSubscription('user-1')

    expect(subscription).toBeNull()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.createSubscription', () => {
  it('should create subscription', async () => {
    const subscription = await paymentsApi.createSubscription('user-1', 'plan-1', 'web')

    expect(subscription).toMatchObject({
      userId: 'user-1',
      planId: 'plan-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.createSubscription('user-1', 'plan-1', 'web')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.updateSubscription', () => {
  it('should update subscription', async () => {
    const subscription = await paymentsApi.updateSubscription('sub-1', { cancelAtPeriodEnd: true })

    expect(subscription).toMatchObject({
      id: 'sub-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.updateSubscription('sub-1', {})).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.addConsumable', () => {
  it('should add consumable', async () => {
    const entitlements = await paymentsApi.addConsumable('user-1', 'boosts', 5)

    expect(entitlements).toMatchObject({
      consumables: expect.any(Object),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.addConsumable('user-1', 'boosts', 5)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.redeemConsumable', () => {
  it('should redeem consumable', async () => {
    const result = await paymentsApi.redeemConsumable('user-1', 'boosts', 'idempotency-key-1')

    expect(result).toMatchObject({
      success: true,
      remaining: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.redeemConsumable('user-1', 'boosts', 'key-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getUserBillingIssue', () => {
  it('should return billing issue', async () => {
    const issue = await paymentsApi.getUserBillingIssue('user-1')

    expect(issue).toMatchObject({
      userId: 'user-1',
      type: expect.any(String),
    })
  })

  it('should return null for no issue', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { issue: null } }),
    } as Response)

    const issue = await paymentsApi.getUserBillingIssue('user-1')

    expect(issue).toBeNull()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.createBillingIssue', () => {
  it('should create billing issue', async () => {
    const issue = await paymentsApi.createBillingIssue('user-1', 'sub-1', 'payment_failed')

    expect(issue).toMatchObject({
      type: 'payment_failed',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.createBillingIssue('user-1', 'sub-1', 'payment_failed')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.resolveBillingIssue', () => {
  it('should resolve billing issue', async () => {
    await expect(paymentsApi.resolveBillingIssue('issue-1')).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.resolveBillingIssue('issue-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getAuditLogs', () => {
  it('should return audit logs', async () => {
    const logs = await paymentsApi.getAuditLogs()

    expect(Array.isArray(logs)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.getAuditLogs()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getAllSubscriptions', () => {
  it('should return all subscriptions', async () => {
    const subscriptions = await paymentsApi.getAllSubscriptions()

    expect(Array.isArray(subscriptions)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.getAllSubscriptions()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getRevenueMetrics', () => {
  it('should return revenue metrics', async () => {
    const metrics = await paymentsApi.getRevenueMetrics()

    expect(metrics).toMatchObject({
      mrr: expect.any(Number),
      arr: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.getRevenueMetrics()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.getUsageCounter', () => {
  it('should return usage counter', async () => {
    const counter = await paymentsApi.getUsageCounter('user-1', 'swipe')

    expect(counter).toMatchObject({
      type: 'swipe',
      count: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.getUsageCounter('user-1', 'swipe')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('PaymentsApi.incrementUsage', () => {
  it('should increment usage', async () => {
    const result = await paymentsApi.incrementUsage('user-1', 'swipe')

    expect(result).toMatchObject({
      success: true,
      remaining: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(paymentsApi.incrementUsage('user-1', 'swipe')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

