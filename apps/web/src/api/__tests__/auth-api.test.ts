/**
 * Auth API tests
 * Exercises HTTP flows against a contract server to ensure backend integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { authApi } from '@/api/auth-api';
import type { User } from '@/lib/contracts';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let server: ReturnType<typeof createServer>;

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? (JSON.parse(body) as T) : ({} as T);
}

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  roles: ['user'],
  status: 'active',
  lastSeenAt: new Date().toISOString(),
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      push: true,
      email: true,
      matches: true,
      messages: true,
      likes: true,
    },
    quietHours: null,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
};

beforeAll(async () => {
  server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost:8080');

    if (req.method === 'GET' && url.pathname === '/auth/me') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: mockUser }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const payload = await readJson<{ email: string; password: string }>(req);
      if (payload.email === 'test@example.com' && payload.password === 'password123') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: mockAuthResponse }));
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/register') {
      await readJson<{ email: string; password: string; displayName: string }>(req);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(JSON.stringify({ data: mockAuthResponse }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/logout') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ data: { success: true } }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/refresh') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
        })
      );
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/reset-password') {
      const payload = await readJson<{ currentPassword: string; newPassword: string }>(req);
      if (payload.currentPassword === 'wrong') {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Invalid current password' }));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ data: { success: true } }));
      }
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        process.env['TEST_API_PORT'] = String(address.port);
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

describe('AuthAPI.me', () => {
  it('should return current user', async () => {
    const user = await authApi.me();

    expect(user).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      displayName: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(authApi.me()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AuthAPI.login', () => {
  it('should login successfully with valid credentials', async () => {
    const response = await authApi.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response).toMatchObject({
      user: expect.any(Object),
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('should throw on invalid credentials', async () => {
    await expect(
      authApi.login({
        email: 'test@example.com',
        password: 'wrong',
      })
    ).rejects.toThrow();
  });

  it('should throw on network error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      authApi.login({
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AuthAPI.register', () => {
  it('should register successfully', async () => {
    const response = await authApi.register({
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
    });

    expect(response).toMatchObject({
      user: expect.any(Object),
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      authApi.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AuthAPI.logout', () => {
  it('should logout successfully', async () => {
    await expect(authApi.logout()).resolves.not.toThrow();
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(authApi.logout()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AuthAPI.refresh', () => {
  it('should refresh tokens successfully', async () => {
    const response = await authApi.refresh();

    expect(response).toMatchObject({
      accessToken: expect.any(String),
    });
  });

  it('should throw on error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(authApi.refresh()).rejects.toThrow();

    global.fetch = originalFetch;
  });
});

describe('AuthAPI.updatePassword', () => {
  it('should update password successfully', async () => {
    await expect(
      authApi.updatePassword({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      })
    ).resolves.not.toThrow();
  });

  it('should throw on invalid current password', async () => {
    await expect(
      authApi.updatePassword({
        currentPassword: 'wrong',
        newPassword: 'newpassword',
      })
    ).rejects.toThrow();
  });

  it('should throw on network error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      authApi.updatePassword({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      })
    ).rejects.toThrow();

    global.fetch = originalFetch;
  });
});
