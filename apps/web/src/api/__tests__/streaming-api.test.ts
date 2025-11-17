/**
 * Streaming API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { streamingApi } from '@/api/streaming-api';
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

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost`);

    if (req.method === 'POST' && url.pathname === '/streaming/token-verify') {
      const payload = await readJson<{ token: string }>(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            valid: payload.token === 'valid-token',
            room: payload.token === 'valid-token' ? 'room-1' : undefined,
            participant: payload.token === 'valid-token' ? 'user-1' : undefined,
          },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/streaming/recording/start') {
      const payload = await readJson<{ roomId: string; recordingType: 'hls' | 'webm' }>(req);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            recordingId: `recording-${String(payload.roomId ?? '')}`,
            status: 'recording' as const,
          },
        })
      );
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/streaming/recording/')) {
      const recordingId = url.pathname.split('/').pop();
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            recordingId: recordingId || 'recording-1',
            roomId: 'room-1',
            status: 'completed' as const,
            url: `https://storage.example.com/${String(recordingId ?? '')}.mp4`,
            hlsUrl: `https://storage.example.com/${String(recordingId ?? '')}.m3u8`,
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

describe('StreamingAPI.verifyToken', () => {
  it('should verify valid token', async () => {
    const result = await streamingApi.verifyToken('valid-token');

    expect(result).toMatchObject({
      valid: true,
      room: 'room-1',
      participant: 'user-1',
    });
  });

  it('should verify invalid token', async () => {
    const result = await streamingApi.verifyToken('invalid-token');

    expect(result).toMatchObject({
      valid: false,
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(streamingApi.verifyToken('token')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('StreamingAPI.startRecording', () => {
  it('should start recording with hls type', async () => {
    const result = await streamingApi.startRecording('room-1', 'hls');

    expect(result).toMatchObject({
      recordingId: expect.any(String),
      status: 'recording',
    });
  });

  it('should start recording with webm type', async () => {
    const result = await streamingApi.startRecording('room-1', 'webm');

    expect(result).toMatchObject({
      recordingId: expect.any(String),
      status: 'recording',
    });
  });

  it('should default to hls type', async () => {
    const result = await streamingApi.startRecording('room-1');

    expect(result).toMatchObject({
      recordingId: expect.any(String),
      status: 'recording',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(streamingApi.startRecording('room-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('StreamingAPI.getRecording', () => {
  it('should get recording status', async () => {
    const result = await streamingApi.getRecording('recording-1');

    expect(result).toMatchObject({
      recordingId: 'recording-1',
      roomId: expect.any(String),
      status: expect.any(String),
    });
  });

  it('should include URLs when completed', async () => {
    const result = await streamingApi.getRecording('recording-1');

    if (result.status === 'completed') {
      expect(result.url).toBeDefined();
      expect(result.hlsUrl).toBeDefined();
    }
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(streamingApi.getRecording('recording-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
