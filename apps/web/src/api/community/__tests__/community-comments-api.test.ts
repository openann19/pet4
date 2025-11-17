/**
 * Community Comments API tests
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { CommunityCommentsApi } from '@/api/community/community-comments-api';
import type { Comment } from '@/lib/community-types';
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

const mockComment: Comment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-1',
  authorName: 'Test User',
  text: 'Test comment',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  likesCount: 0,
  isLiked: false,
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

      // POST /community/posts/:id/comment
      if (req.method === 'POST' && url.pathname.match(/\/community\/posts\/[^/]+\/comment$/)) {
        const payload = await readJson<{ text: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              comment: {
                ...mockComment,
                text: payload.text,
              },
            },
          })
        );
        return;
      }

      // GET /community/posts/:id/comment
      if (req.method === 'GET' && url.pathname.match(/\/community\/posts\/[^/]+\/comment$/)) {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              comments: [mockComment],
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

describe('CommunityCommentsApi', () => {
  let api: CommunityCommentsApi;

  beforeAll(() => {
    api = new CommunityCommentsApi();
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const mockGetPost = vi.fn().mockResolvedValue({ status: 'active' });
      const data = {
        postId: 'post-1',
        text: 'Test comment',
        authorId: 'user-1',
        authorName: 'Test User',
      };

      const comment = await api.createComment(data, mockGetPost);

      expect(comment).toMatchObject({
        postId: 'post-1',
        text: 'Test comment',
        authorId: 'user-1',
      });
      expect(mockGetPost).toHaveBeenCalledWith('post-1');
    });

    it('should throw if post not found', async () => {
      const mockGetPost = vi.fn().mockResolvedValue(null);
      const data = {
        postId: 'post-1',
        text: 'Test comment',
        authorId: 'user-1',
        authorName: 'Test User',
      };

      await expect(api.createComment(data, mockGetPost)).rejects.toThrow('Post not found');
    });

    it('should throw if post is inactive', async () => {
      const mockGetPost = vi.fn().mockResolvedValue({ status: 'archived' });
      const data = {
        postId: 'post-1',
        text: 'Test comment',
        authorId: 'user-1',
        authorName: 'Test User',
      };

      await expect(api.createComment(data, mockGetPost)).rejects.toThrow();
    });
  });

  describe('getPostComments', () => {
    it('should return post comments', async () => {
      const comments = await api.getPostComments('post-1');

      expect(Array.isArray(comments)).toBe(true);
      if (comments.length > 0) {
        expect(comments[0]).toHaveProperty('id');
        expect(comments[0]).toHaveProperty('text');
      }
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getPostComments('post-1')).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
