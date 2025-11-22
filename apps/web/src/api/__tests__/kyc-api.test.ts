/**
 * KYC API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { kycApi } from '@/api/kyc-api';
import type { KYCStatus, KYCSubmission } from '@/lib/kyc-types';
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

const mockStatus: KYCStatus = 'pending';

const mockSubmission: KYCSubmission = {
  id: 'sub-1',
  userId: 'user-1',
  provider: 'onfido',
  status: 'pending',
  startedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  retryCount: 0,
  metadata: {},
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

      if (req.method === 'POST' && url.pathname === '/kyc/start') {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(
          JSON.stringify({
            data: {
              sessionId: 'session-1',
              submissionId: 'sub-1',
              providerToken: 'token-1',
            },
          })
        );
        return;
      }

      if (
        req.method === 'GET' &&
        url.pathname === '/kyc/status' &&
        !url.searchParams.get('submissions')
      ) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: { status: mockStatus } }));
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/kyc/verification/')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: mockSubmission }));
        return;
      }

      if (
        req.method === 'GET' &&
        url.pathname === '/kyc/status' &&
        url.searchParams.get('submissions') === 'true'
      ) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: [mockSubmission] }));
        return;
      }

      if (req.method === 'POST' && url.pathname.includes('/webhook')) {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: {} }));
        return;
      }

      if (req.method === 'POST' && url.pathname.includes('/review')) {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: {} }));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/kyc/consent') {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(
          JSON.stringify({
            data: {
              id: 'consent-1',
              userId: 'user-1',
              type: 'terms',
              version: '1.0',
              accepted: true,
              createdAt: new Date().toISOString(),
            },
          })
        );
        return;
      }

      if (req.method === 'POST' && url.pathname === '/kyc/age-verification') {
        await readJson(req);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(
          JSON.stringify({
            data: {
              id: 'age-1',
              userId: 'user-1',
              ageVerified: true,
              verifiedAt: new Date().toISOString(),
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('KYCApi.startKYC', () => {
  it('should start KYC verification', async () => {
    const result = await kycApi.startKYC({
      userId: 'user-1',
      provider: 'onfido',
    });

    expect(result).toMatchObject({
      sessionId: expect.any(String),
      submissionId: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      kycApi.startKYC({
        userId: 'user-1',
        provider: 'onfido',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.getKYCStatus', () => {
  it('should return KYC status', async () => {
    const status = await kycApi.getKYCStatus('user-1');

    expect(status).toBe('pending');
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(kycApi.getKYCStatus('user-1')).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.getKYCSubmission', () => {
  it('should return submission', async () => {
    const submission = await kycApi.getKYCSubmission('sub-1');

    expect(submission).toMatchObject({
      id: 'sub-1',
    });
  });

  it('should return null for non-existent submission', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const submission = await kycApi.getKYCSubmission('sub-999');

    expect(submission).toBeNull();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.getUserKYCSubmissions', () => {
  it('should return user submissions', async () => {
    const submissions = await kycApi.getUserKYCSubmissions('user-1');

    expect(Array.isArray(submissions)).toBe(true);
  });

  it('should return empty array on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const submissions = await kycApi.getUserKYCSubmissions('user-1');

    expect(submissions).toEqual([]);

    global.fetch = originalFetch;
  });
});

describe('KYCApi.handleKYCWebhook', () => {
  it('should handle webhook', async () => {
    await expect(
      kycApi.handleKYCWebhook({
        submissionId: 'sub-1',
        status: 'verified',
      })
    ).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      kycApi.handleKYCWebhook({
        submissionId: 'sub-1',
        status: 'verified',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.manualKYCReview', () => {
  it('should perform manual review', async () => {
    await expect(
      kycApi.manualKYCReview({
        submissionId: 'sub-1',
        decision: 'verified',
        actorUserId: 'admin-1',
      })
    ).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      kycApi.manualKYCReview({
        submissionId: 'sub-1',
        decision: 'verified',
        actorUserId: 'admin-1',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.recordConsent', () => {
  it('should record consent', async () => {
    const consent = await kycApi.recordConsent({
      userId: 'user-1',
      type: 'terms',
      version: '1.0',
      accepted: true,
    });

    expect(consent).toMatchObject({
      userId: 'user-1',
      type: 'terms',
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      kycApi.recordConsent({
        userId: 'user-1',
        type: 'terms',
        version: '1.0',
        accepted: true,
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('KYCApi.recordAgeVerification', () => {
  it('should record age verification', async () => {
    const verification = await kycApi.recordAgeVerification({
      userId: 'user-1',
      ageVerified: true,
    });

    expect(verification).toMatchObject({
      userId: 'user-1',
      ageVerified: true,
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      kycApi.recordAgeVerification({
        userId: 'user-1',
        ageVerified: true,
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
