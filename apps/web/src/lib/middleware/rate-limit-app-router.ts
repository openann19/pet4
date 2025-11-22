/**
 * App Router Rate Limiting Middleware
 *
 * Rate limiting middleware for Next.js App Router (NextRequest/NextResponse).
 * Supports both token bucket and quota-based rate limiting.
 */

import type { NextRequest } from '@/types/next-server';
import { NextResponse } from '@/types/next-server';
import type { TokenBucket } from '../rate-limit/token-bucket';
import { createTokenBucket } from '../rate-limit/token-bucket';
import type { QuotaService } from '../rate-limit/quota-service';
import { createQuotaService } from '../rate-limit/quota-service';

export interface RateLimitConfig {
  // Token bucket config
  requestsPerMinute?: number;
  burst?: number;
  // Quota config
  dailyLimit?: number;
  // Identification
  getIdentifier: (req: NextRequest) => Promise<string> | string;
  // Actions
  action?: string;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

// Global token buckets (in-memory)
// For production, use distributed storage (Redis, Upstash, etc.)
const tokenBuckets = new Map<string, TokenBucket>();
const quotaServices = new Map<string, QuotaService>();

/**
 * Get or create token bucket for identifier and action
 */
function getTokenBucket(identifier: string, action: string, config: RateLimitConfig): TokenBucket {
  const key = `${action}:${identifier}:token-bucket`;
  let bucket = tokenBuckets.get(key);

  if (!bucket) {
    const rpm = config.requestsPerMinute ?? 60;
    const burst = config.burst ?? rpm;
    bucket = createTokenBucket(rpm, burst);
    tokenBuckets.set(key, bucket);
  }

  return bucket;
}

/**
 * Get or create quota service for action
 */
function getQuotaService(action: string, config: RateLimitConfig): QuotaService {
  const key = `${action}:quota-service`;
  let service = quotaServices.get(key);

  if (!service && config.dailyLimit) {
    service = createQuotaService(config.dailyLimit);
    quotaServices.set(key, service);
  }

  return service!;
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number,
  retryAfter?: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toString());

  if (retryAfter !== undefined) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Create 429 Too Many Requests response
 */
function createRateLimitResponse(resetAt: number, limit: number): NextResponse {
  const now = Date.now();
  const retryAfter = Math.ceil((resetAt - now) / 1000);

  const response = new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${limit} requests. Try again after ${new Date(resetAt).toISOString()}.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return addRateLimitHeaders(response, limit, 0, resetAt, retryAfter);
}

/**
 * Rate limiting middleware for App Router
 *
 * @example
 * ```typescript
 * export async function middleware(request: NextRequest) {
 *   return withRateLimit(request, {
 *     requestsPerMinute: 60,
 *     dailyLimit: 1000,
 *     action: 'api',
 *     getIdentifier: async (req) => {
 *       const userId = req.headers.get('x-user-id');
 *       return userId ?? req.ip ?? 'anonymous';
 *     },
 *   });
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const identifier = await config.getIdentifier(request);
  const action = config.action ?? 'default';

  // Check token bucket rate limit
  if (config.requestsPerMinute) {
    const bucket = getTokenBucket(identifier, action, config);
    const bucketResult = bucket.consume(1);

    if (!bucketResult.allowed) {
      return createRateLimitResponse(bucketResult.resetAt, bucketResult.limit);
    }
  }

  // Check quota limit
  if (config.dailyLimit) {
    const quotaService = getQuotaService(action, config);
    const quotaResult = quotaService.checkQuota(identifier, action);

    if (!quotaResult.allowed) {
      return createRateLimitResponse(quotaResult.resetAt, quotaResult.limit);
    }
  }

  // Request allowed
  return null;
}

/**
 * Rate limit wrapper for route handlers
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return withRateLimitWrapper(request, async (req) => {
 *     // Your route handler logic
 *     return NextResponse.json({ success: true });
 *   }, {
 *     requestsPerMinute: 10,
 *     dailyLimit: 100,
 *     action: 'generate',
 *     getIdentifier: async (req) => req.headers.get('x-user-id') ?? 'anonymous',
 *   });
 * }
 * ```
 */
export async function withRateLimitWrapper<T extends NextResponse>(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<T>,
  config: RateLimitConfig
): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(request, config);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Execute handler
  const response = await handler(request);

  // Add rate limit headers to successful response
  const identifier = await config.getIdentifier(request);
  const action = config.action ?? 'default';

  let limit = 60;
  let remaining = 59;
  let resetAt = Date.now() + 60000;

  if (config.requestsPerMinute) {
    const bucket = getTokenBucket(identifier, action, config);
    const tokens = bucket.getTokens();
    limit = config.requestsPerMinute;
    remaining = Math.floor(tokens);
    resetAt = Date.now() + Math.ceil((limit - remaining) / (config.requestsPerMinute / 60)) * 1000;
  }

  if (config.dailyLimit) {
    const quotaService = getQuotaService(action, config);
    const quotaResult = quotaService.getUsage(identifier, action);
    limit = quotaResult.limit;
    remaining = quotaResult.remaining;
    resetAt = quotaResult.resetAt;
  }

  return addRateLimitHeaders(response, limit, remaining, resetAt);
}

/**
 * Predefined rate limit configs for common endpoints
 */
export const rateLimitConfigs = {
  generate: {
    requestsPerMinute: 10,
    dailyLimit: 100,
    action: 'generate',
  },
  chat: {
    requestsPerMinute: 60,
    dailyLimit: 500,
    action: 'chat',
  },
  preview: {
    requestsPerMinute: 30,
    dailyLimit: Infinity, // Unlimited daily
    action: 'preview',
  },
} as const;

/**
 * Get identifier from request (user ID, IP, or anonymous)
 */
export function getRequestIdentifier(request: NextRequest): string {
  // Try to get user ID from header
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return userId;
  }

  // Try to get IP address
  const ip =
    request.ip ?? request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
  if (ip) {
    return ip.split(',')[0]?.trim() ?? 'anonymous';
  }

  return 'anonymous';
}
