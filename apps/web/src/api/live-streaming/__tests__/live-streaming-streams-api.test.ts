/**
 * Live Streaming Streams API tests
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { LiveStreamingStreamsApi } from '@/api/live-streaming/live-streaming-streams-api';
import type { LiveStream } from '@/lib/live-streaming-types';
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

const mockStream: LiveStream = {
  id: 'stream-1',
  roomId: 'room-1',
  hostId: 'user-1',
  hostName: 'Test Host',
  title: 'Test Stream',
  status: 'live',
  viewerCount: 0,
  startedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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

      // POST /streaming/create-room
      if (req.method === 'POST' && url.pathname === '/streaming/create-room') {
        const payload = await readJson<{ title: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              stream: { ...mockStream, title: payload.title },
              joinToken: 'mock-join-token',
              publishToken: 'mock-publish-token',
            },
          })
        );
        return;
      }

      // POST /streaming/end-room
      if (req.method === 'POST' && url.pathname === '/streaming/end-room') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              stream: { ...mockStream, status: 'ended' },
            },
          })
        );
        return;
      }

      // GET /streaming/active
      if (req.method === 'GET' && url.pathname === '/streaming/active') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            data: {
              streams: [mockStream],
              total: 1,
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

describe('LiveStreamingStreamsApi', () => {
  let api: LiveStreamingStreamsApi;

  beforeAll(() => {
    api = new LiveStreamingStreamsApi();
  });

  describe('createRoom', () => {
    it('should create a live stream room', async () => {
      const data = {
        title: 'Test Stream',
        description: 'Test description',
        hostId: 'user-1',
        hostName: 'Test Host',
      };

      const result = await api.createRoom(data);

      expect(result).toHaveProperty('stream');
      expect(result).toHaveProperty('joinToken');
      expect(result).toHaveProperty('publishToken');
      expect(result.stream.title).toBe('Test Stream');
    });

    it('should throw if tokens are missing', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            stream: mockStream,
            // Missing tokens
          },
        }),
      });

      await expect(
        api.createRoom({
          title: 'Test',
          hostId: 'user-1',
          hostName: 'Test',
        })
      ).rejects.toThrow(/required LiveKit tokens/);

      global.fetch = originalFetch;
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        api.createRoom({
          title: 'Test',
          hostId: 'user-1',
          hostName: 'Test',
        })
      ).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });

  describe('endRoom', () => {
    it('should end a live stream', async () => {
      const stream = await api.endRoom('stream-1', 'user-1');

      expect(stream).toHaveProperty('id');
      expect(stream.status).toBe('ended');
    });

    it('should throw on error', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.endRoom('stream-1', 'user-1')).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
