/**
 * API Config API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { apiConfigApi, type APIConfig } from '@/api/api-config-api';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let server: ReturnType<typeof createServer>;

const mockConfig: APIConfig = {
  maps: {
    provider: 'openstreetmap',
    apiKey: 'test-key',
    enabled: true,
    rateLimit: 100,
  },
  ai: {
    provider: 'spark',
    apiKey: 'test-key',
    model: 'gpt-4o',
    enabled: true,
    maxTokens: 1000,
    temperature: 0.7,
  },
  kyc: {
    provider: 'manual',
    apiKey: 'test-key',
    enabled: true,
    autoApprove: false,
    requireDocuments: true,
  },
  photoModeration: {
    provider: 'spark',
    apiKey: 'test-key',
    enabled: true,
    autoReject: false,
    confidenceThreshold: 0.8,
  },
  sms: {
    provider: 'disabled',
    apiKey: '',
    apiSecret: '',
    enabled: false,
    fromNumber: '',
  },
  email: {
    provider: 'disabled',
    apiKey: '',
    enabled: false,
    fromEmail: '',
    fromName: 'Test',
  },
  storage: {
    provider: 'local',
    apiKey: '',
    apiSecret: '',
    bucket: '',
    region: 'us-east-1',
    enabled: true,
  },
  analytics: {
    provider: 'disabled',
    apiKey: '',
    enabled: false,
  },
  livekit: {
    apiKey: '',
    apiSecret: '',
    wsUrl: '',
    enabled: false,
  },
};

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost:8080');

    if (req.method === 'GET' && url.pathname === '/api-config') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: { config: mockConfig } }));
      return;
    }

    res.statusCode = 404;
    res.end();
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('APIConfigAPI.getAPIConfig', () => {
  it('should return API config', async () => {
    const config = await apiConfigApi.getAPIConfig();

    expect(config).toMatchObject({
      maps: expect.any(Object),
      ai: expect.any(Object),
    });
  });

  it('should return null on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const config = await apiConfigApi.getAPIConfig();

    expect(config).toBeNull();

    global.fetch = originalFetch;
  });
});
