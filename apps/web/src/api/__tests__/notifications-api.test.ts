/**
 * Notifications API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { notificationsApi } from '@/api/notifications-api'
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

    if (req.method === 'POST' && url.pathname === '/users/location') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/users/location/nearby') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { userIds: ['user-1', 'user-2'] } }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/notifications/geofence') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/notifications/user-locations') {
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            locations: [
              {
                userId: 'user-1',
                lat: 37.7749,
                lon: -122.4194,
                lastUpdated: new Date().toISOString(),
              },
            ],
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

describe('NotificationsAPI.updateUserLocation', () => {
  it('should update user location', async () => {
    await expect(notificationsApi.updateUserLocation('user-1', 37.7749, -122.4194)).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(notificationsApi.updateUserLocation('user-1', 37.7749, -122.4194)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('NotificationsAPI.queryNearbyUsers', () => {
  it('should return nearby users', async () => {
    const userIds = await notificationsApi.queryNearbyUsers(37.7749, -122.4194, 5)

    expect(Array.isArray(userIds)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(notificationsApi.queryNearbyUsers(37.7749, -122.4194, 5)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('NotificationsAPI.triggerGeofence', () => {
  it('should trigger geofence', async () => {
    await expect(notificationsApi.triggerGeofence('alert-1', 37.7749, -122.4194, 5)).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(notificationsApi.triggerGeofence('alert-1', 37.7749, -122.4194, 5)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('NotificationsAPI.getUserLocations', () => {
  it('should return user locations', async () => {
    const locations = await notificationsApi.getUserLocations()

    expect(Array.isArray(locations)).toBe(true)
    if (locations.length > 0) {
      expect(locations[0]).toMatchObject({
        userId: expect.any(String),
        lat: expect.any(Number),
        lon: expect.any(Number),
      })
    }
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(notificationsApi.getUserLocations()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

