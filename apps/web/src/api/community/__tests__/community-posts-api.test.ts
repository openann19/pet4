/**
 * Community Posts API tests
 * Tests community post creation and feed querying functionality
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { CommunityPostsApi } from '@/api/community/community-posts-api';
import type { Post } from '@/lib/community-types';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let server: ReturnType<typeof createServer>;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const bufferChunk: Buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    chunks.push(bufferChunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockPost: Post = {
  id: 'post-1',
  kind: 'text',
  text: 'Test post',
  authorId: 'user-1',
  authorName: 'Test User',
  visibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  isLiked: false,
  media: [],
  tags: [],
};

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://localhost:8080');

      // POST /community/posts
      if (req.method === 'POST' && url.pathname === '/community/posts') {
        const payload = await readJson<{ text?: string; kind: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              post: {
                ...mockPost,
                text: payload.text,
                kind: payload.kind,
              },
            },
          })
        );
        return;
      }

      // GET /community/posts
      if (req.method === 'GET' && url.pathname === '/community/posts') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              posts: [mockPost],
              total: 1,
              nextCursor: undefined,
            },
          })
        );
        return;
      }

      // GET /community/posts/:id
      if (req.method === 'GET' && url.pathname.startsWith('/community/posts/')) {
        const postId = url.pathname.split('/').pop();
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              post: { ...mockPost, id: postId },
            },
          })
        );
        return;
      }

      res.statusCode = 404;
      res.end();
    })();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        process.env.TEST_API_PORT = String(address.port);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('CommunityPostsApi', () => {
  let api: CommunityPostsApi;

  beforeAll(() => {
    api = new CommunityPostsApi();
  });

  describe('createPost', () => {
    it('should create a text post', async () => {
      const data = {
        kind: 'text' as const,
        text: 'Test post',
        visibility: 'public' as const,
      };

      const post = await api.createPost(data, 'user-1', 'Test User');

      expect(post).toMatchObject({
        kind: 'text',
        text: 'Test post',
        authorId: 'user-1',
        authorName: 'Test User',
      });
    });

    it('should create a photo post', async () => {
      const data = {
        kind: 'photo' as const,
        text: 'Check out this photo',
        media: ['https://example.com/photo.jpg'],
        visibility: 'public' as const,
      };

      const post = await api.createPost(data, 'user-1', 'Test User');

      expect(post).toHaveProperty('id');
      expect(post.kind).toBe('photo');
    });

    it('should include tags', async () => {
      const data = {
        kind: 'text' as const,
        text: 'Test with tags',
        tags: ['test', 'demo'],
        visibility: 'public' as const,
      };

      const post = await api.createPost(data, 'user-1', 'Test User');

      expect(post).toHaveProperty('id');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        api.createPost({ kind: 'text', text: 'Test', visibility: 'public' }, 'user-1', 'Test')
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('queryFeed', () => {
    it('should return feed posts', async () => {
      const result = await api.queryFeed();

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.posts)).toBe(true);
    });

    it('should accept filters', async () => {
      const result = await api.queryFeed({ sortBy: 'recent' });

      expect(result).toHaveProperty('posts');
      expect(Array.isArray(result.posts)).toBe(true);
    });

    it('should accept location filter', async () => {
      const result = await api.queryFeed({
        location: { lat: 40.7128, lon: -74.006, radiusKm: 10 },
      });

      expect(result).toHaveProperty('posts');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.queryFeed()).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('getPostById', () => {
    it('should return a post by id', async () => {
      const post = await api.getPostById('post-1');

      expect(post).not.toBeNull();
      expect(post).toHaveProperty('id');
    });

    it('should return null on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const post = await api.getPostById('post-1');
      expect(post).toBeNull();

      global.fetch = originalFetch;
    });
  });

  describe('getPost', () => {
    it('should return a post', async () => {
      const post = await api.getPost('post-1');

      expect(post).not.toBeNull();
      expect(post).toHaveProperty('id');
    });
  });

  describe('getFeed', () => {
    it('should return feed with default options', async () => {
      const result = await api.getFeed();

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('total');
    });

    it('should return trending feed', async () => {
      const result = await api.getFeed({ mode: 'trending' });

      expect(result).toHaveProperty('posts');
    });

    it('should return feed with location', async () => {
      const result = await api.getFeed({ lat: 40.7128, lng: -74.006 });

      expect(result).toHaveProperty('posts');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getFeed()).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
