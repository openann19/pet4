/**
 * Rate Limiting Wrapper for App Router Route Handlers
 *
 * Convenience wrapper for adding rate limiting to API routes.
 */

import type { NextRequest } from '@/types/next-server';
import type { NextResponse } from '@/types/next-server';
import {
  withRateLimitWrapper,
  getRequestIdentifier,
  rateLimitConfigs,
  type RateLimitConfig,
} from './rate-limit-app-router';

/**
 * Create rate-limited route handler
 *
 * @example
 * ```typescript
 * export const POST = createRateLimitedHandler(
 *   async (request: NextRequest) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   {
 *     requestsPerMinute: 10,
 *     dailyLimit: 100,
 *     action: 'generate',
 *   }
 * );
 * ```
 */
export function createRateLimitedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    return withRateLimitWrapper(request, handler, {
      ...config,
      getIdentifier: config.getIdentifier ?? getRequestIdentifier,
    });
  };
}

/**
 * Predefined rate-limited handlers for common endpoint types
 */
export const createGenerateHandler = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  createRateLimitedHandler(handler, {
    ...rateLimitConfigs.generate,
    getIdentifier: getRequestIdentifier,
  });

export const createChatHandler = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  createRateLimitedHandler(handler, {
    ...rateLimitConfigs.chat,
    getIdentifier: getRequestIdentifier,
  });

export const createPreviewHandler = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  createRateLimitedHandler(handler, {
    ...rateLimitConfigs.preview,
    getIdentifier: getRequestIdentifier,
  });
