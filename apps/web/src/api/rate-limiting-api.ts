/**
 * Rate Limiting API Service
 *
 * Handles rate limiting checks through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('RateLimitingAPI');

export interface CheckRateLimitRequest {
  userId: string;
  action: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

class RateLimitingApiImpl {
  /**
   * POST /rate-limiting/check
   * Check rate limit
   */
  async checkRateLimit(
    userId: string,
    action: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    try {
      const request: CheckRateLimitRequest = {
        userId,
        action,
        maxRequests,
        windowMs,
      };

      const response = await APIClient.post<RateLimitResult>('/rate-limiting/check', request);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check rate limit', err, { userId, action });
      // Fail open - allow request if rate limiting check fails
      throw err;
    }
  }
}

export const rateLimitingApi = new RateLimitingApiImpl();
