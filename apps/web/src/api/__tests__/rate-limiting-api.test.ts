/**
 * Rate Limiting API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { rateLimitingApi } from '@/api/rate-limiting-api'
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

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'POST' && url.pathname === '/rate-limiting/check') {
      const payload = await readJson<{ userId: string; action: string; maxRequests: number; windowMs: number }>(req)
      const allowed = payload.maxRequests > 0
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            allowed,
            remaining: allowed ? payload.maxRequests - 1 : 0,
            resetAt: Date.now() + payload.windowMs,
            limit: payload.maxRequests,
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

describe('RateLimitingAPI.checkRateLimit', () => {
  it('should check rate limit successfully', async () => {
    const result = await rateLimitingApi.checkRateLimit('user-1', 'send_message', 100, 60000)

    expect(result).toMatchObject({
      allowed: expect.any(Boolean),
      remaining: expect.any(Number),
      resetAt: expect.any(Number),
      limit: 100,
    })
  })

  it('should return allowed false when limit exceeded', async () => {
    const result = await rateLimitingApi.checkRateLimit('user-1', 'send_message', 0, 60000)

    expect(result.allowed).toBe(false)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(rateLimitingApi.checkRateLimit('user-1', 'send_message', 100, 60000)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

