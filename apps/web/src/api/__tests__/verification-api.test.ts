/**
 * Verification API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { verificationApi } from '@/api/verification-api'
import type { VerificationRequest } from '@/lib/verification-types'
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

const mockRequest: VerificationRequest = {
  id: 'req-1',
  petId: 'pet-1',
  userId: 'user-1',
  status: 'pending',
  requestedAt: new Date().toISOString(),
  documents: [],
  verificationLevel: 'basic',
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'GET' && url.pathname === '/verification/requests') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { requests: [mockRequest] } }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/verification/update-status') {
      const requestId = url.searchParams.get('requestId')
      const payload = await readJson<{ status: 'approved' | 'rejected'; reviewedBy: string; notes?: string }>(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            request: {
              ...mockRequest,
              id: requestId || 'req-1',
              status: payload.status,
              reviewedBy: payload.reviewedBy,
              notes: payload.notes,
            },
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

describe('VerificationAPI.getVerificationRequests', () => {
  it('should return verification requests', async () => {
    const requests = await verificationApi.getVerificationRequests()

    expect(Array.isArray(requests)).toBe(true)
    if (requests.length > 0) {
      expect(requests[0]).toMatchObject({
        id: expect.any(String),
        petId: expect.any(String),
        userId: expect.any(String),
        status: expect.any(String),
      })
    }
  })

  it('should accept status filter', async () => {
    const requests = await verificationApi.getVerificationRequests({
      status: ['pending'],
    })

    expect(Array.isArray(requests)).toBe(true)
  })

  it('should accept petId filter', async () => {
    const requests = await verificationApi.getVerificationRequests({
      petId: 'pet-1',
    })

    expect(Array.isArray(requests)).toBe(true)
  })

  it('should accept userId filter', async () => {
    const requests = await verificationApi.getVerificationRequests({
      userId: 'user-1',
    })

    expect(Array.isArray(requests)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(verificationApi.getVerificationRequests()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('VerificationAPI.updateVerificationStatus', () => {
  it('should update status to approved', async () => {
    const request = await verificationApi.updateVerificationStatus('req-1', 'approved', 'admin-1')

    expect(request).toMatchObject({
      id: 'req-1',
      status: 'approved',
      reviewedBy: 'admin-1',
    })
  })

  it('should update status to rejected with notes', async () => {
    const request = await verificationApi.updateVerificationStatus('req-1', 'rejected', 'admin-1', 'Invalid documents')

    expect(request).toMatchObject({
      id: 'req-1',
      status: 'rejected',
      reviewedBy: 'admin-1',
      notes: 'Invalid documents',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(verificationApi.updateVerificationStatus('req-1', 'approved', 'admin-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

