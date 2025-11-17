/**
 * Community Reactions API tests
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { CommunityReactionsApi } from '@/api/community/community-reactions-api';
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

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://localhost:8080');

      // POST /community/posts/:id/like
      if (req.method === 'POST' && url.pathname.match(/\/community\/posts\/[^/]+\/like$/)) {
        const payload = await readJson<{ emoji: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              added: true,
              reactionsCount: 5,
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

describe('CommunityReactionsApi', () => {
  let api: CommunityReactionsApi;

  beforeAll(() => {
    api = new CommunityReactionsApi();
  });

  describe('toggleReaction', () => {
    it('should toggle reaction on a post', async () => {
      const result = await api.toggleReaction(
        'post-1',
        'user-1',
        'Test User',
        'https://example.com/avatar.jpg',
        '❤️'
      );

      expect(result).toMatchObject({
        added: true,
        reactionsCount: expect.any(Number),
      });
    });

    it('should work without avatar', async () => {
      const result = await api.toggleReaction('post-1', 'user-1', 'Test User', undefined, '👍');

      expect(result).toHaveProperty('added');
      expect(result).toHaveProperty('reactionsCount');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        api.toggleReaction('post-1', 'user-1', 'Test User', undefined, '❤️')
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
