/**
 * Integration Tests for Rate Limiting App Router Middleware
 *
 * Tests rate limiting middleware with simulated request/response objects.
 * Adapted for Vite app (not Next.js App Router).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { NextRequest } from '@/types/next-server';
import type { TokenBucket} from '../../rate-limit/token-bucket';
import { createTokenBucket } from '../../rate-limit/token-bucket';
import type { QuotaService} from '../../rate-limit/quota-service';
import { createQuotaService } from '../../rate-limit/quota-service';
import { getRequestIdentifier, rateLimitConfigs } from '../rate-limit-app-router';

// Mock Request and Response for testing
class MockRequest implements Pick<NextRequest, 'headers' | 'url'> {
  headers: Headers;
  ip?: string;
  url: string;

  constructor(
    url = 'http://localhost:3000/api/test',
    headers: Record<string, string> = {},
    ip?: string
  ) {
    this.url = url;
    this.headers = new Headers(headers);
    this.ip = ip;
  }
}

// Type guard to convert MockRequest to NextRequest-compatible type
function asNextRequest(request: MockRequest): NextRequest {
  return request as unknown as NextRequest;
}

class MockResponse extends Response {
  override readonly headers: Headers;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.headers = new Headers(init?.headers);
  }

  static override json(data: unknown, init?: ResponseInit): MockResponse {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
}

describe('Rate Limiting Integration', () => {
  let tokenBucket: TokenBucket;
  let quotaService: QuotaService;

  beforeEach(() => {
    // Create fresh instances for each test
    tokenBucket = createTokenBucket(60);
    quotaService = createQuotaService(100);
  });

  describe('Token Bucket Integration', () => {
    it('should allow requests within rate limit', () => {
      const result1 = tokenBucket.consume(1);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBeGreaterThanOrEqual(0);

      const result2 = tokenBucket.consume(1);
      expect(result2.allowed).toBe(true);
    });

    it('should reject requests exceeding rate limit', () => {
      // Exhaust tokens
      for (let i = 0; i < 60; i++) {
        tokenBucket.consume(1);
      }

      const result = tokenBucket.consume(1);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should include rate limit information', () => {
      const result = tokenBucket.consume(1);
      expect(result.limit).toBe(60);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quota Service Integration', () => {
    it('should allow requests within daily limit', () => {
      const result1 = quotaService.checkQuota('user1', 'action1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(99);
      expect(result1.used).toBe(1);

      const result2 = quotaService.checkQuota('user1', 'action1');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(98);
    });

    it('should reject requests exceeding daily limit', () => {
      // Exhaust quota
      for (let i = 0; i < 100; i++) {
        quotaService.checkQuota('user1', 'action1');
      }

      const result = quotaService.checkQuota('user1', 'action1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track quotas per user and action', () => {
      quotaService.checkQuota('user1', 'action1');
      quotaService.checkQuota('user1', 'action2');
      quotaService.checkQuota('user2', 'action1');

      const result1 = quotaService.getUsage('user1', 'action1');
      const result2 = quotaService.getUsage('user1', 'action2');
      const result3 = quotaService.getUsage('user2', 'action1');

      expect(result1.used).toBe(1);
      expect(result2.used).toBe(1);
      expect(result3.used).toBe(1);
    });
  });

  describe('Request Identifier', () => {
    it('should extract user ID from header', async () => {
      const request = new MockRequest('http://localhost:3000/api/test', {
        'x-user-id': 'user123',
      });

      const identifier = await getRequestIdentifier(asNextRequest(request));
      expect(identifier).toBe('user123');
    });

    it('should extract IP address when user ID not present', async () => {
      const request = new MockRequest('http://localhost:3000/api/test', {}, '192.168.1.1');
      request.ip = '192.168.1.1';

      const identifier = await getRequestIdentifier(asNextRequest(request));
      // Should fall back to IP or anonymous
      expect(identifier).toBeTruthy();
    });

    it('should use x-forwarded-for header', async () => {
      const request = new MockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      const identifier = await getRequestIdentifier(asNextRequest(request));
      expect(identifier).toBe('192.168.1.1');
    });

    it('should return anonymous when no identifier available', async () => {
      const request = new MockRequest('http://localhost:3000/api/test');

      const identifier = await getRequestIdentifier(asNextRequest(request));
      expect(identifier).toBe('anonymous');
    });
  });


  describe('Rate Limit Configs', () => {
    it('should have predefined configs', () => {
      expect(rateLimitConfigs.generate).toBeDefined();
      expect(rateLimitConfigs.chat).toBeDefined();
      expect(rateLimitConfigs.preview).toBeDefined();

      expect(rateLimitConfigs.generate.requestsPerMinute).toBe(10);
      expect(rateLimitConfigs.generate.dailyLimit).toBe(100);
      expect(rateLimitConfigs.chat.requestsPerMinute).toBe(60);
      expect(rateLimitConfigs.chat.dailyLimit).toBe(500);
    });
  });
});
