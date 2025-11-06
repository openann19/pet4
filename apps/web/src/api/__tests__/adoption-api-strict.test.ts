/**
 * Adoption API Strict tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { AdoptionAPIStrict } from '@/api/adoption-api-strict'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>
const adoptionAPIStrict = new AdoptionAPIStrict()

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockListing: AdoptionListing = {
  id: 'listing-1',
  petId: 'pet-1',
  ownerId: 'owner-1',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'PUT' && url.pathname.startsWith('/adoption/listings/')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { listing: mockListing } }))
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

describe('AdoptionAPIStrict.updateListing', () => {
  it('should update listing with strict optionals', async () => {
    const listing = await adoptionAPIStrict.updateListing('listing-1', { status: 'active' }, 'owner-1')

    expect(listing).toMatchObject({
      id: 'listing-1',
    })
  })

  it('should handle undefined values to clear fields', async () => {
    const listing = await adoptionAPIStrict.updateListing('listing-1', { fee: undefined }, 'owner-1')

    expect(listing).toMatchObject({
      id: 'listing-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(adoptionAPIStrict.updateListing('listing-1', { status: 'active' }, 'owner-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

