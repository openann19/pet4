/**
 * Community API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { CommunityAPI } from '@/api/community-api'
import type { Post, Comment } from '@/lib/community-types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let server: ReturnType<typeof createServer>
const communityAPI = new CommunityAPI()

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? (JSON.parse(body) as T) : ({} as T)
}

const mockPost: Post = {
  id: 'post-1',
  authorId: 'user-1',
  authorName: 'Test User',
  kind: 'text',
  text: 'Test post',
  visibility: 'public',
  status: 'pending_review',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockComment: Comment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-1',
  authorName: 'Test User',
  text: 'Test comment',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  reactionsCount: 0,
}

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400
      res.end()
      return
    }

    const url = new URL(req.url, 'http://localhost:8080')

    if (req.method === 'POST' && url.pathname === '/community/posts') {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 201
      res.end(JSON.stringify({ data: { post: mockPost } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/community/posts') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { posts: [mockPost], nextCursor: undefined, total: 1 } }))
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/community/posts/') && !url.pathname.includes('/')) {
      const postId = url.pathname.split('/').pop()
      if (postId === 'post-999') {
        res.statusCode = 404
        res.end()
        return
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { post: mockPost } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/view')) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify({ data: { success: true } }))
      return
    }

    if (req.method === 'GET' && url.pathname === '/community/posts/fingerprints') {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { fingerprints: ['fp-1'] } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/like')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { added: true, reactionsCount: 1 } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/comments')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { comment: mockComment } }))
      return
    }

    if (req.method === 'GET' && url.pathname.includes('/comments')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { comments: [mockComment] } }))
      return
    }

    if (req.method === 'POST' && url.pathname.includes('/report')) {
      await readJson(req)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ data: { report: { id: 'report-1' } } }))
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

describe('CommunityAPI.createPost', () => {
  it('should create post', async () => {
    const post = await communityAPI.createPost({
      authorId: 'user-1',
      authorName: 'Test User',
      text: 'Test post',
      kind: 'text',
      visibility: 'public',
    })

    expect(post).toMatchObject({
      id: expect.any(String),
      authorId: 'user-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      communityAPI.createPost({
        authorId: 'user-1',
        authorName: 'Test User',
        text: 'Test post',
        kind: 'text',
        visibility: 'public',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.queryFeed', () => {
  it('should query feed', async () => {
    const result = await communityAPI.queryFeed()

    expect(result).toMatchObject({
      posts: expect.any(Array),
      total: expect.any(Number),
    })
  })

  it('should apply filters', async () => {
    const result = await communityAPI.queryFeed(
      {
        kind: ['text'],
        authorId: 'user-1',
        tags: ['test'],
        visibility: ['public'],
        featured: true,
        sortBy: 'recent',
        cursor: 'cursor-1',
        limit: 20,
      },
      'user-1'
    )

    expect(result).toMatchObject({
      posts: expect.any(Array),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.queryFeed()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.getPostById', () => {
  it('should return post by id', async () => {
    const post = await communityAPI.getPostById('post-1')

    expect(post).toMatchObject({
      id: 'post-1',
    })
  })

  it('should return null for non-existent post', async () => {
    const post = await communityAPI.getPostById('post-999')

    expect(post).toBeNull()
  })

  it('should throw on network error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.getPostById('post-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.getAllPosts', () => {
  it('should return all posts', async () => {
    const posts = await communityAPI.getAllPosts()

    expect(Array.isArray(posts)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.getAllPosts()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.getContentFingerprints', () => {
  it('should return content fingerprints', async () => {
    const fingerprints = await communityAPI.getContentFingerprints()

    expect(Array.isArray(fingerprints)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.getContentFingerprints()).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.toggleReaction', () => {
  it('should toggle reaction', async () => {
    const result = await communityAPI.toggleReaction('post-1', 'user-1', 'Test User', undefined, '❤️')

    expect(result).toMatchObject({
      added: expect.any(Boolean),
      reactionsCount: expect.any(Number),
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.toggleReaction('post-1', 'user-1', 'Test User', undefined, '❤️')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.createComment', () => {
  it('should create comment', async () => {
    const comment = await communityAPI.createComment({
      postId: 'post-1',
      authorId: 'user-1',
      authorName: 'Test User',
      text: 'Test comment',
    })

    expect(comment).toMatchObject({
      id: expect.any(String),
      postId: 'post-1',
    })
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      communityAPI.createComment({
        postId: 'post-1',
        authorId: 'user-1',
        authorName: 'Test User',
        text: 'Test comment',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.getPostComments', () => {
  it('should return comments', async () => {
    const comments = await communityAPI.getPostComments('post-1')

    expect(Array.isArray(comments)).toBe(true)
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(communityAPI.getPostComments('post-1')).rejects.toThrow()

    global.fetch = originalFetch
  })
})

describe('CommunityAPI.reportContent', () => {
  it('should report content', async () => {
    await expect(
      communityAPI.reportContent({
        resourceId: 'post-1',
        resourceType: 'post',
        reporterId: 'user-1',
        reason: 'spam',
      })
    ).resolves.not.toThrow()
  })

  it('should throw on error', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await expect(
      communityAPI.reportContent({
        resourceId: 'post-1',
        resourceType: 'post',
        reporterId: 'user-1',
        reason: 'spam',
      })
    ).rejects.toThrow()

    global.fetch = originalFetch
  })
})

