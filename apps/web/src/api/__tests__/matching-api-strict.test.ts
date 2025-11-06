/**
 * Matching API Strict tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { MatchingAPIStrict } from '@/api/matching-api-strict'
import type { OwnerPreferences, MatchingConfig } from '@/core/domain/matching-config'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>
const matchingAPIStrict = new MatchingAPIStrict()

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockPreferences: OwnerPreferences = {
  ownerId: 'owner-1',
  maxDistanceKm: 50,
  preferredSpecies: ['dog'],
  preferredBreeds: [],
  minAge: 1,
  maxAge: 10,
  preferredSizes: [],
  mustBeVaccinated: true,
  mustBeSpayedNeutered: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockConfig: MatchingConfig = {
  id: 'config-1',
  weights: {
    personality: 0.3,
    interests: 0.2,
    size: 0.15,
    age: 0.15,
    location: 0.2,
  },
  hardGates: {
    maxDistanceKm: 50,
    requireVaccination: true,
    requireSpayedNeutered: false,
  },
  featureFlags: {
    MATCH_ALLOW_CROSS_SPECIES: false,
    MATCH_REQUIRE_VACCINATION: true,
    MATCH_DISTANCE_MAX_KM: 50,
    MATCH_AB_TEST_KEYS: [],
    MATCH_AI_HINTS_ENABLED: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin-1',
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'PUT' && url.pathname === '/matching/preferences') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { preferences: mockPreferences } }))
      return
    }

    if (req.method === 'PUT' && url.pathname === '/matching/config') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { config: mockConfig } }))
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

describe('MatchingAPIStrict.updatePreferences', () => {
  it('should update preferences with strict optionals', async () => {
    const preferences = await matchingAPIStrict.updatePreferences('owner-1', { maxDistanceKm: 100 })

    expect(preferences).toMatchObject({
      ownerId: 'owner-1',
    })
  })

  it('should handle undefined values to clear fields', async () => {
    const preferences = await matchingAPIStrict.updatePreferences('owner-1', { maxDistanceKm: undefined })

    expect(preferences).toMatchObject({
      ownerId: 'owner-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(matchingAPIStrict.updatePreferences('owner-1', { maxDistanceKm: 100 })).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('MatchingAPIStrict.updateConfig', () => {
  it('should update config with strict optionals', async () => {
    const config = await matchingAPIStrict.updateConfig({ weights: mockConfig.weights })

    expect(config).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should handle undefined values to clear fields', async () => {
    const config = await matchingAPIStrict.updateConfig({ weights: undefined })

    expect(config).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(matchingAPIStrict.updateConfig({ weights: mockConfig.weights })).rejects.toThrow()

    global.fetch = originalFetch
  })
})

