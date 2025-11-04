/**
 * Lost & Found API tests
 * Ensures owner notifications fire on sightings without blocking persistence.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LostAlert, Sighting } from '@/lib/lost-found-types'
import { lostFoundAPI } from '@/api/lost-found-api'
import { notificationsService } from '@/lib/notifications-service'

type KVStore = Map<string, unknown>

vi.mock('@/lib/notifications-service', () => ({
  notificationsService: {
    notifyNewSighting: vi.fn().mockResolvedValue(undefined),
  },
}))

const kvStore: KVStore = new Map()

const kv = {
  get: vi.fn(<T>(key: string): Promise<T | undefined> => Promise.resolve(kvStore.get(key) as T | undefined)),
  set: vi.fn(<T>(key: string, value: T): Promise<void> => {
    kvStore.set(key, value)
    return Promise.resolve()
  }),
  delete: vi.fn((key: string): Promise<void> => {
    kvStore.delete(key)
    return Promise.resolve()
  }),
  keys: vi.fn((): Promise<string[]> => Promise.resolve(Array.from(kvStore.keys()))),
}

beforeAll(() => {
  // Override global spark for testing
  ;(globalThis as unknown as { spark: unknown }).spark = {
    kv,
    llmPrompt: vi.fn(),
    llm: vi.fn(),
    user: vi.fn()
  }
})

beforeEach(() => {
  kvStore.clear()
  vi.clearAllMocks()
  kvStore.set('lost-found-alerts', [])
  kvStore.set('lost-found-sightings', [])
})

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

function cloneAlert(): LostAlert {
  return {
    ...baseAlert,
    petSummary: { ...baseAlert.petSummary },
    lastSeen: { ...baseAlert.lastSeen },
  }
}

describe('LostFoundAPI.createSighting', () => {
  it('persists sighting and notifies alert owner', async () => {
    kvStore.set('lost-found-alerts', [cloneAlert()])

    const result = await lostFoundAPI.createSighting(baseSightingInput)

    expect(result).toMatchObject({
      alertId: baseSightingInput.alertId,
      reporterId: baseSightingInput.reporterId,
      verified: false,
    })

    const sightings = kvStore.get('lost-found-sightings') as Sighting[]
    expect(sightings).toHaveLength(1)
    expect(sightings[0]).toMatchObject({
      alertId: baseSightingInput.alertId,
      reporterId: baseSightingInput.reporterId,
    })

    const alerts = kvStore.get('lost-found-alerts') as LostAlert[]
    expect(alerts[0]?.sightingsCount).toBe(1)

    expect(notificationsService.notifyNewSighting).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(notificationsService.notifyNewSighting).mock.calls[0]
    if (!callArgs) {
      throw new Error('Expected notifyNewSighting to be called')
    }
    const [sightingArg, alertArg] = callArgs
    expect(sightingArg).toMatchObject({ alertId: baseSightingInput.alertId })
    expect(alertArg.id).toBe(baseAlert.id)
  })

  it('continues when notification dispatch fails', async () => {
    kvStore.set('lost-found-alerts', [cloneAlert()])
    vi.mocked(notificationsService.notifyNewSighting).mockRejectedValueOnce(new Error('push failed'))

    const result = await lostFoundAPI.createSighting(baseSightingInput)

    expect(result).toMatchObject({ alertId: baseSightingInput.alertId })

    const alerts = kvStore.get('lost-found-alerts') as LostAlert[]
    expect(alerts[0]?.sightingsCount).toBe(1)

    const sightings = kvStore.get('lost-found-sightings') as Sighting[]
    expect(sightings).toHaveLength(1)
  })
})
