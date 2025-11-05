/**
 * Lost & Found API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { lostFoundAPI } from '@/api/lost-found-api'
import type { LostAlert, Sighting } from '@/lib/lost-found-types'
import { notificationsService } from '@/lib/notifications-service'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/notifications-service', () => ({
  notificationsService: {
    notifyNewSighting: vi.fn().mockResolvedValue(undefined),
    triggerGeofencedNotifications: vi.fn(),
  },
}))

const baseAlert: LostAlert = {
  id: 'alert-1',
  ownerId: 'owner-1',
  ownerName: 'Jess',
  ownerAvatar: undefined,
  petSummary: {
    name: 'Paws',
    species: 'dog',
  },
  lastSeen: {
    whenISO: new Date().toISOString(),
    radiusM: 100,
  },
  reward: undefined,
  rewardCurrency: undefined,
  contactMask: '***-***-4242',
  photos: [],
  status: 'active',
  description: 'Missing near the lake',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  foundAt: undefined,
  archivedAt: undefined,
  viewsCount: 0,
  sightingsCount: 0,
  notificationsSent: undefined,
  reviewedAt: undefined,
  reviewedBy: undefined,
}

const baseSightingInput = {
  alertId: 'alert-1',
  whenISO: new Date().toISOString(),
  radiusM: 150,
  description: 'Seen near the park entrance.',
  photos: [],
  contactMask: 'anon@spark.io',
  reporterId: 'user-42',
  reporterName: 'Scout',
  reporterAvatar: undefined,
}

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

    if (req.method === 'GET' && url.pathname === `/alerts/lost/${baseAlert.id}`) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { alert: baseAlert } }))
      return
    }

    if (req.method === 'POST' && url.pathname === `/alerts/lost/${baseAlert.id}/increment-view`) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/alerts/sightings') {
      const payload = await readJson<CreateSightingPayload>(req)
      const sighting: Sighting = {
        id: 'sighting-1',
        alertId: payload.alertId,
        reporterId: payload.reporterId,
        reporterName: payload.reporterName,
        reporterAvatar: payload.reporterAvatar,
        whenISO: payload.whenISO,
        radiusM: payload.radiusM,
        description: payload.description,
        photos: payload.photos,
        contactMask: payload.contactMask,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { sighting } }))
      return
    }

    res.statusCode = 404
    res.end()
  })

  await new Promise<void>(resolve => server.listen(8080, resolve))
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

afterEach(() => {
  vi.clearAllMocks()
})

interface CreateSightingPayload {
  alertId: string
  whenISO: string
  radiusM: number
  description: string
  photos: unknown[]
  contactMask: string
  reporterId: string
  reporterName: string
  reporterAvatar?: string
}

describe('LostFoundAPI.createSighting', () => {
  it('persists sighting and notifies alert owner', async () => {
    const result = await lostFoundAPI.createSighting(baseSightingInput)

    expect(result).toMatchObject({
      alertId: baseSightingInput.alertId,
      reporterId: baseSightingInput.reporterId,
      verified: false,
    })

    expect(notificationsService.notifyNewSighting).toHaveBeenCalledTimes(1)
    const call = vi.mocked(notificationsService.notifyNewSighting).mock.calls[0]
    expect(call?.[0]).toMatchObject({ alertId: baseSightingInput.alertId })
    expect(call?.[1]).toMatchObject({ id: baseAlert.id })
  })

  it('continues when notification dispatch fails', async () => {
    vi.mocked(notificationsService.notifyNewSighting).mockRejectedValueOnce(new Error('push failed'))

    const result = await lostFoundAPI.createSighting(baseSightingInput)

    expect(result).toMatchObject({ alertId: baseSightingInput.alertId })
    expect(notificationsService.notifyNewSighting).toHaveBeenCalledTimes(1)
  })
})
