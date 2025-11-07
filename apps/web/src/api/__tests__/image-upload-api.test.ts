/**
 * Image Upload API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { imageUploadApi } from '@/api/image-upload-api'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'GET' && url.pathname === '/uploads/images/signed-url') {
      const key = url.searchParams.get('key')
      const contentType = url.searchParams.get('contentType')
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          data: {
            signedUrl: `https://storage.example.com/${String(key ?? '')}`,
            key: key || 'test-key',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
        })
      )
      return
    }

    if (req.method === 'POST' && url.pathname === '/uploads/images') {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(
        JSON.stringify({
          data: {
            url: 'https://storage.example.com/test-key',
            key: 'test-key',
            size: 1024,
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

describe('ImageUploadAPI.getSignedUrl', () => {
  it('should return signed URL', async () => {
    const result = await imageUploadApi.getSignedUrl('test-key', 'image/jpeg')

    expect(result).toMatchObject({
      signedUrl: expect.any(String),
      key: 'test-key',
      expiresAt: expect.any(String),
    })
  })

  it('should accept expiresIn parameter', async () => {
    const result = await imageUploadApi.getSignedUrl('test-key', 'image/jpeg', 3600)

    expect(result).toMatchObject({
      signedUrl: expect.any(String),
      key: 'test-key',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(imageUploadApi.getSignedUrl('test-key', 'image/jpeg')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('ImageUploadAPI.uploadImage', () => {
  it('should upload image', async () => {
    const arrayBuffer = new ArrayBuffer(1024)
    const result = await imageUploadApi.uploadImage('test-key', 'image/jpeg', arrayBuffer)

    expect(result).toMatchObject({
      url: expect.any(String),
      key: 'test-key',
      size: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const arrayBuffer = new ArrayBuffer(1024)
    await expect(imageUploadApi.uploadImage('test-key', 'image/jpeg', arrayBuffer)).rejects.toThrow()

    global.fetch = originalFetch
  })
})

