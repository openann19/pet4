/**
 * Live Streaming API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { liveStreamingAPI } from '@/api/live-streaming-api';
import type {
  LiveStream,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamChatMessage,
} from '@/lib/live-streaming-types';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock APIClient - use closure to get port at runtime
let testServerPortForMock = 0;

const createAPIClientMock = () => {
  const makeRequest = async (endpoint: string, method: string, data?: unknown) => {
    // Read port dynamically at request time
    const port = testServerPortForMock;
    if (port === 0) {
      throw new Error('Test server not initialized. Port is 0.');
    }

    const testUrl = `http://localhost:${port}${endpoint}`;
    const response = await fetch(testUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { data: {} };
    }

    const text = await response.text();
    if (!text) {
      return { data: {} };
    }

    try {
      const json = JSON.parse(text);
      return { data: json.data || json };
    } catch {
      return { data: {} };
    }
  };

  return {
    get: (endpoint: string) => makeRequest(endpoint, 'GET'),
    post: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'POST', data),
    put: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PUT', data),
    patch: (endpoint: string, data?: unknown) => makeRequest(endpoint, 'PATCH', data),
    delete: (endpoint: string) => makeRequest(endpoint, 'DELETE'),
  };
};

vi.mock('@/lib/api-client', () => ({
  APIClient: createAPIClientMock(),
}));

let server: ReturnType<typeof createServer>;
let testServerPort: number;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockStream: LiveStream = {
  id: 'stream-1',
  hostId: 'user-1',
  hostName: 'Test Host',
  title: 'Test Stream',
  category: 'general',
  roomId: 'live:stream-1',
  status: 'live',
  allowChat: true,
  viewerCount: 10,
  peakViewerCount: 15,
  reactionsCount: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockViewer: LiveStreamViewer = {
  id: 'viewer-1',
  streamId: 'stream-1',
  userId: 'user-2',
  userName: 'Viewer',
  joinedAt: new Date().toISOString(),
  reactionsSent: 2,
};

const mockReaction: LiveStreamReaction = {
  id: 'reaction-1',
  streamId: 'stream-1',
  userId: 'user-2',
  userName: 'Viewer',
  emoji: '❤️',
  createdAt: new Date().toISOString(),
};

const mockChatMessage: LiveStreamChatMessage = {
  id: 'msg-1',
  streamId: 'stream-1',
  userId: 'user-2',
  userName: 'Viewer',
  text: 'Hello!',
  createdAt: new Date().toISOString(),
  banned: false,
};

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost`);

    if (req.method === 'POST' && url.pathname === '/live/createRoom') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(
        JSON.stringify({
          data: {
            stream: mockStream,
            joinToken: 'join-token-1',
            publishToken: 'publish-token-1',
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/live/endRoom') {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            stream: { ...mockStream, status: 'ended', endedAt: new Date().toISOString() },
          },
        })
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/live/active') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            streams: [mockStream],
            nextCursor: undefined,
            total: 1,
          },
        })
      );
      return;
    }

    if (
      req.method === 'GET' &&
      url.pathname.startsWith('/live/') &&
      !url.pathname.includes('/chat')
    ) {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            stream: mockStream,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname.includes('/join')) {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            viewer: mockViewer,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname.includes('/leave')) {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ data: {} }));
      return;
    }

    if (req.method === 'POST' && url.pathname.includes('/react')) {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            reaction: mockReaction,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname.includes('/chat')) {
      await readJson(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            message: mockChatMessage,
          },
        })
      );
      return;
    }

    if (req.method === 'GET' && url.pathname.includes('/chat')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            messages: [mockChatMessage],
          },
        })
      );
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        testServerPort = address.port;
        testServerPortForMock = testServerPort;
        process.env['TEST_API_PORT'] = String(testServerPort);
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      testServerPortForMock = 0;
      resolve();
    });
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('LiveStreamingAPI.createRoom', () => {
  it('should create room', async () => {
    const result = await liveStreamingAPI.createRoom({
      hostId: 'user-1',
      hostName: 'Test Host',
      title: 'Test Stream',
      category: 'general',
      allowChat: true,
    });

    expect(result).toMatchObject({
      stream: expect.any(Object),
      joinToken: expect.any(String),
      publishToken: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      liveStreamingAPI.createRoom({
        hostId: 'user-1',
        hostName: 'Test Host',
        title: 'Test Stream',
        category: 'general',
        allowChat: true,
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.endRoom', () => {
  it('should end room', async () => {
    const stream = await liveStreamingAPI.endRoom('stream-1', 'user-1');

    expect(stream).toMatchObject({
      id: 'stream-1',
      status: 'ended',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(liveStreamingAPI.endRoom('stream-1', 'user-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.queryActiveStreams', () => {
  it('should return active streams', async () => {
    const result = await liveStreamingAPI.queryActiveStreams();

    expect(result).toMatchObject({
      streams: expect.any(Array),
      total: expect.any(Number),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(liveStreamingAPI.queryActiveStreams()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.getStreamById', () => {
  it('should return stream', async () => {
    const stream = await liveStreamingAPI.getStreamById('stream-1');

    expect(stream).toMatchObject({
      id: 'stream-1',
    });
  });

  it('should return null for non-existent stream', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const stream = await liveStreamingAPI.getStreamById('stream-999');

    expect(stream).toBeNull();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.joinStream', () => {
  it('should join stream', async () => {
    const viewer = await liveStreamingAPI.joinStream('stream-1', 'user-2', 'Viewer');

    expect(viewer).toMatchObject({
      streamId: 'stream-1',
      userId: 'user-2',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(liveStreamingAPI.joinStream('stream-1', 'user-2', 'Viewer')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.leaveStream', () => {
  it('should leave stream', async () => {
    await expect(liveStreamingAPI.leaveStream('stream-1', 'user-2')).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(liveStreamingAPI.leaveStream('stream-1', 'user-2')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.sendReaction', () => {
  it('should send reaction', async () => {
    const reaction = await liveStreamingAPI.sendReaction(
      'stream-1',
      'user-2',
      'Viewer',
      undefined,
      '❤️'
    );

    expect(reaction).toMatchObject({
      streamId: 'stream-1',
      emoji: '❤️',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      liveStreamingAPI.sendReaction('stream-1', 'user-2', 'Viewer', undefined, '❤️')
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.sendChatMessage', () => {
  it('should send chat message', async () => {
    const message = await liveStreamingAPI.sendChatMessage(
      'stream-1',
      'user-2',
      'Viewer',
      undefined,
      'Hello!'
    );

    expect(message).toMatchObject({
      streamId: 'stream-1',
      text: 'Hello!',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      liveStreamingAPI.sendChatMessage('stream-1', 'user-2', 'Viewer', undefined, 'Hello!')
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('LiveStreamingAPI.queryChatMessages', () => {
  it('should return chat messages', async () => {
    const result = await liveStreamingAPI.queryChatMessages('stream-1');

    expect(result).toMatchObject({
      messages: expect.any(Array),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(liveStreamingAPI.queryChatMessages('stream-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
