/**
 * Rate Limiting Middleware
 *
 * Rate limiting for GDPR endpoints to prevent abuse.
 * Uses express-rate-limit with configurable limits.
 */

import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'
import { createLogger } from '../utils/logger'

const logger = createLogger('RateLimit')

export interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

/**
 * Create rate limiter for GDPR endpoints
 */
export function createGDPRRateLimiter(config?: Partial<RateLimitConfig>) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many GDPR requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }

  const finalConfig = { ...defaultConfig, ...config }

  return rateLimit({
    ...finalConfig,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.userId,
      })

      res.status(429).json({
        error: {
          message: finalConfig.message ?? 'Too many requests, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      })
    },
    // Use user ID if available, otherwise fall back to IP
    keyGenerator: (req: Request): string => {
      if (req.userId) {
        return req.userId
      }
      // The library recommends using req.ip for rate limiting based on IP.
      // The previous validation error was a warning, not a critical failure.
      return req.ip ?? 'unknown'
    },
  })
}

/**
 * Strict rate limiter for deletion endpoints
 */
export function createDeletionRateLimiter() {
  return createGDPRRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit to 3 deletion requests per hour
    message: 'Too many deletion requests. Please wait before requesting another deletion.',
  })
}

/**
 * Standard rate limiter for export endpoints
 */
export function createExportRateLimiter() {
  return createGDPRRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 export requests per 15 minutes
    message: 'Too many export requests. Please wait before requesting another export.',
  })
}

/**
 * Standard rate limiter for consent endpoints
 */
export function createConsentRateLimiter() {
  return createGDPRRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit to 20 consent updates per 5 minutes
    message: 'Too many consent updates. Please wait before updating consent again.',
  })
}
