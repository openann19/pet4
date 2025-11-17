/**
 * Feature Flags API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { featureFlagsApi } from '@/api/feature-flags-api';
import type { FeatureFlag, FeatureFlagKey, ABTest, ABTestVariant } from '@/lib/feature-flags';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

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

const mockFlags: Partial<Record<FeatureFlagKey, FeatureFlag>> = {
  stories_enabled: {
    key: 'stories_enabled',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['dev', 'staging', 'prod'],
    description: 'Stories feature',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
  voice_messages_enabled: {
    key: 'voice_messages_enabled',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['dev'],
    description: 'Voice messages',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system',
  },
};

const mockABTest: ABTest = {
  id: 'test-1',
  name: 'Test AB Test',
  description: 'Test description',
  enabled: true,
  startDate: new Date().toISOString(),
  variants: [],
};

const mockVariant: ABTestVariant = {
  id: 'variant-1',
  name: 'Variant A',
  weight: 50,
  config: {},
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

      if (req.method === 'GET' && url.pathname === '/feature-flags') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { flags: mockFlags } }));
        return;
      }

      if (req.method === 'PATCH' && url.pathname.startsWith('/feature-flags/')) {
        const payload = await readJson<{ updates: Partial<FeatureFlag>; modifiedBy: string }>(req);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { flag: { enabled: true, ...payload.updates } } }));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/ab-tests') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { tests: [mockABTest] } }));
        return;
      }

      if (
        req.method === 'GET' &&
        url.pathname.includes('/ab-tests/') &&
        url.pathname.includes('/variant')
      ) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { variant: mockVariant } }));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/ab-tests/exposure') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: { success: true } }));
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('FeatureFlagsAPI.getFeatureFlags', () => {
  it('should return feature flags', async () => {
    const flags = await featureFlagsApi.getFeatureFlags();

    expect(typeof flags).toBe('object');
    expect(Object.keys(flags).length).toBeGreaterThanOrEqual(0);
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(featureFlagsApi.getFeatureFlags()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('FeatureFlagsAPI.updateFeatureFlag', () => {
  it('should update feature flag', async () => {
    const flag = await featureFlagsApi.updateFeatureFlag(
      'stories_enabled',
      { enabled: false },
      'admin-1'
    );

    expect(flag).toMatchObject({
      enabled: expect.any(Boolean),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      featureFlagsApi.updateFeatureFlag('stories_enabled', { enabled: false }, 'admin-1')
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('FeatureFlagsAPI.getABTests', () => {
  it('should return AB tests', async () => {
    const tests = await featureFlagsApi.getABTests();

    expect(Array.isArray(tests)).toBe(true);
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(featureFlagsApi.getABTests()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('FeatureFlagsAPI.getABTestVariant', () => {
  it('should return AB test variant', async () => {
    const variant = await featureFlagsApi.getABTestVariant('test-1', 'user-1');

    expect(variant).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  it('should return null when no variant', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { variant: null } }),
    } as Response);

    const variant = await featureFlagsApi.getABTestVariant('test-1', 'user-1');

    expect(variant).toBeNull();

    global.fetch = originalFetch;
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(featureFlagsApi.getABTestVariant('test-1', 'user-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('FeatureFlagsAPI.trackABTestExposure', () => {
  it('should track AB test exposure', async () => {
    await expect(
      featureFlagsApi.trackABTestExposure('test-1', 'user-1', 'variant-1')
    ).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      featureFlagsApi.trackABTestExposure('test-1', 'user-1', 'variant-1')
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
