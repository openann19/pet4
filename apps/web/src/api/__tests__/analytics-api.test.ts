/**
 * Analytics API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { analyticsApi } from '@/api/analytics-api'
import type { AnalyticsEvent, UserSession, AnalyticsMetrics, UserBehaviorInsights } from '@/lib/advanced-analytics'
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

const mockEvent: AnalyticsEvent = {
  id: 'event-1',
  name: 'app_opened',
  timestamp: new Date().toISOString(),
  sessionId: 'session-1',
  userId: 'user-1',
  properties: {},
  correlationId: 'corr-1',
}

const mockMetrics: AnalyticsMetrics = {
  totalSessions: 100,
  totalEvents: 1000,
  uniqueUsers: 500,
  averageSessionDuration: 300,
  topEvents: [],
  conversionRate: 0.5,
  retentionRate: 0.7,
  activeUsers: {
    daily: 100,
    weekly: 500,
    monthly: 2000,
  },
}

const mockInsights: UserBehaviorInsights = {
  mostViewedPets: [],
  matchingSuccessRate: 0.5,
  averageSwipesPerSession: 20,
  preferredPetTypes: [],
  peakActivityHours: [14, 15, 16],
  averageMessagesPerMatch: 10,
  storyEngagement: {
    viewRate: 0.5,
    creationRate: 0.1,
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

    if (req.method === 'POST' && url.pathname === '/analytics/events') {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/analytics/sessions') {
      await readJson<{ session: Omit<UserSession, 'id'> }>(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(
        JSON.stringify({
          data: {
            session: {
              id: 'session-1',
              userId: 'user-1',
              startTime: new Date().toISOString(),
              events: [],
              deviceInfo: {
                userAgent: 'test',
                platform: 'web',
                language: 'en',
                screenSize: '1920x1080',
              },
              entryPoint: 'home',
            },
          },
        })
      )
      return
    }

    if (req.method === 'GET' && url.pathname === '/analytics/metrics') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { metrics: mockMetrics } }))
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/analytics/insights/')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { insights: mockInsights } }))
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
  await new Promise<void>(resolve => server.close(() => resolve()))
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AnalyticsAPI.trackEvent', () => {
  it('should track event successfully', async () => {
    await expect(analyticsApi.trackEvent(mockEvent)).resolves.not.toThrow()
  })

  it('should not throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(analyticsApi.trackEvent(mockEvent)).resolves.not.toThrow()

    global.fetch = originalFetch
  })
})

describe('AnalyticsAPI.createSession', () => {
  it('should create session successfully', async () => {
    const session = await analyticsApi.createSession({
      userId: 'user-1',
      startTime: new Date().toISOString(),
      events: [],
      deviceInfo: {
        userAgent: 'test',
        platform: 'web',
        language: 'en',
        screenSize: '1920x1080',
      },
      entryPoint: 'home',
    })

    expect(session).toMatchObject({
      id: expect.any(String),
      userId: 'user-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      analyticsApi.createSession({
        userId: 'user-1',
        startTime: new Date().toISOString(),
        events: [],
        deviceInfo: {
          userAgent: 'test',
          platform: 'web',
          language: 'en',
          screenSize: '1920x1080',
        },
        entryPoint: 'home',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AnalyticsAPI.getMetrics', () => {
  it('should return metrics', async () => {
    const metrics = await analyticsApi.getMetrics()

    expect(metrics).toMatchObject({
      totalEvents: expect.any(Number),
      uniqueUsers: expect.any(Number),
    })
  })

  it('should accept date range', async () => {
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    const metrics = await analyticsApi.getMetrics(startDate, endDate)

    expect(metrics).toMatchObject({
      totalEvents: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(analyticsApi.getMetrics()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('AnalyticsAPI.getUserBehaviorInsights', () => {
  it('should return user behavior insights', async () => {
    const insights = await analyticsApi.getUserBehaviorInsights('user-1')

    expect(insights).toMatchObject({
      matchingSuccessRate: expect.any(Number),
      averageSwipesPerSession: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(analyticsApi.getUserBehaviorInsights('user-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

