/**
 * Community API Client tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { communityApi } from '@/api/community-api-client'
import type { CommunityPost, Comment, FeedOptions } from '@/lib/community-types'
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

const mockPost: CommunityPost = {
  id: 'post-1',
  authorId: 'user-1',
  authorName: 'Test User',
  kind: 'text',
  text: 'Test post',
  visibility: 'public',
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

    if (req.method === 'GET' && url.pathname === '/community/posts') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { posts: [mockPost], nextCursor: undefined } }))
      return
    }

    if (req.method === 'POST' && url.pathname === '/community/posts') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: mockPost }))
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/community/posts/')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: mockPost }))
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

describe('CommunityApiClient.getFeed', () => {
  it('should return feed', async () => {
    const result = await communityApi.getFeed({})

    expect(result).toMatchObject({
      posts: expect.any(Array),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityApi.getFeed({})).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityApiClient.createPost', () => {
  it('should create post', async () => {
    const post = await communityApi.createPost({
      kind: 'text',
      text: 'Test post',
      visibility: 'public',
    })

    expect(post).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      communityApi.createPost({
        kind: 'text',
        text: 'Test post',
        visibility: 'public',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityApiClient.getPost', () => {
  it('should return post', async () => {
    const post = await communityApi.getPost('post-1')

    expect(post).toMatchObject({
      id: 'post-1',
    })
  })

  it('should return null for non-existent post', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    const post = await communityApi.getPost('post-999')

    expect(post).toBeNull()

    global.fetch = originalFetch
  })
})

