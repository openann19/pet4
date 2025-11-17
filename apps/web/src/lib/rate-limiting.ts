import { createLogger } from './logger';
import { storage } from './storage';
import { rateLimitingApi } from '@/api/rate-limiting-api';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('RateLimiting');

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  action: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

interface AbuseDetection {
  readonly ip: string;
  readonly userId?: string;
  readonly violations: number;
  readonly lastViolation: number;
  readonly blocked: boolean;
  readonly blockedUntil?: number;
}

interface RateLimitMetrics {
  readonly action: string;
  readonly totalRequests: number;
  readonly allowedRequests: number;
  readonly blockedRequests: number;
  readonly averageResponseTime: number;
  readonly peakRequestsPerSecond: number;
}

/**
 * Rate limiting manager with abuse detection
 */
class RateLimitManager {
  private readonly abuseDetections = new Map<string, AbuseDetection>();
  private readonly metrics = new Map<string, RateLimitMetrics>();
  private readonly ipThrottles = new Map<string, number[]>();
  private readonly enableAbuseDetection = true;
  private readonly abuseThreshold = 10; // violations before blocking
  private readonly blockDuration = 60 * 60 * 1000; // 1 hour

  /**
   * Get client IP address
   */
  getClientIP(): string {
    // In a real implementation, this would get the IP from headers or connection
    // For now, use a placeholder
    return 'client-ip';
  }

  /**
   * Check abuse detection
   */
  checkAbuse(ip: string, userId?: string): boolean {
    if (!this.enableAbuseDetection) {
      return false
    }

    const key = userId ? `user:${userId}` : `ip:${ip}`
    const detection = this.abuseDetections.get(key)

    if (!detection) {
      return false
    }

    // Check if blocked
    if (detection.blocked && detection.blockedUntil && detection.blockedUntil > Date.now()) {
      return true
    }

    // Check if block expired
    if (detection.blocked && detection.blockedUntil && detection.blockedUntil <= Date.now()) {
      this.abuseDetections.delete(key)
      return false
    }

    return detection.blocked
  }

  /**
   * Record abuse violation
   */
  recordViolation(ip: string, userId?: string): void {
    if (!this.enableAbuseDetection) {
      return
    }

    const key = userId ? `user:${userId}` : `ip:${ip}`
    const existing = this.abuseDetections.get(key)

    if (existing) {
      const updated: AbuseDetection = {
        ...existing,
        violations: existing.violations + 1,
        lastViolation: Date.now(),
        blocked: existing.violations + 1 >= this.abuseThreshold,
        blockedUntil:
          existing.violations + 1 >= this.abuseThreshold
            ? Date.now() + this.blockDuration
            : existing.blockedUntil,
      }
      this.abuseDetections.set(key, updated)
    } else {
      const detection: AbuseDetection = {
        ip,
        userId,
        violations: 1,
        lastViolation: Date.now(),
        blocked: false,
      }
      this.abuseDetections.set(key, detection)
    }
  }

  /**
   * Check IP-based rate limit
   */
  checkIPRateLimit(ip: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const key = `ip-rate-limit:${config.action}:${ip}`
    const attempts = this.ipThrottles.get(key) ?? []

    // Filter out attempts outside the window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < config.windowMs)

    // Check if limit exceeded
    if (recentAttempts.length >= config.maxRequests) {
      this.recordViolation(ip)
      const oldestAttempt = recentAttempts[0]
      if (oldestAttempt) {
        const resetAt = oldestAttempt + config.windowMs
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          limit: config.maxRequests,
        }
      }
    }

    // Add current attempt
    recentAttempts.push(now)
    this.ipThrottles.set(key, recentAttempts)

    const remaining = Math.max(0, config.maxRequests - recentAttempts.length)
    const resetAt =
      recentAttempts.length > 0 && recentAttempts[0]
        ? recentAttempts[0] + config.windowMs
        : now + config.windowMs

    return {
      allowed: true,
      remaining,
      resetAt,
      limit: config.maxRequests,
    }
  }

  /**
   * Get abuse detection
   */
  getAbuseDetection(ip: string, userId?: string): AbuseDetection | null {
    const key = userId ? `user:${userId}` : `ip:${ip}`
    return this.abuseDetections.get(key) ?? null
  }

  /**
   * Get rate limit metrics
   */
  getMetrics(action: string): RateLimitMetrics | null {
    return this.metrics.get(action) ?? null
  }

  /**
   * Update metrics
   */
  updateMetrics(action: string, allowed: boolean, responseTime: number): void {
    const existing = this.metrics.get(action) ?? {
      action,
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      peakRequestsPerSecond: 0,
    }

    const updated: RateLimitMetrics = {
      ...existing,
      totalRequests: existing.totalRequests + 1,
      allowedRequests: allowed ? existing.allowedRequests + 1 : existing.allowedRequests,
      blockedRequests: allowed ? existing.blockedRequests : existing.blockedRequests + 1,
      averageResponseTime:
        (existing.averageResponseTime * existing.totalRequests + responseTime) /
        (existing.totalRequests + 1),
    }

    this.metrics.set(action, updated)
  }
}

const rateLimitManager = new RateLimitManager()

/**
 * Generic rate limiting utility using KV storage
 * Tracks requests using sliding window algorithm
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, action } = config
  const now = Date.now()
  const startTime = performance.now()

  // Get client IP
  const ip = rateLimitManager.getClientIP()

  // Check abuse detection
  if (rateLimitManager.checkAbuse(ip, userId)) {
    logger.warn('Request blocked due to abuse detection', { userId, ip, action })
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + windowMs,
      limit: maxRequests,
    }
  }

  // Check IP-based rate limit
  const ipResult = rateLimitManager.checkIPRateLimit(ip, config)
  if (!ipResult.allowed) {
    rateLimitManager.recordViolation(ip, userId)
    const responseTime = performance.now() - startTime
    rateLimitManager.updateMetrics(action, false, responseTime)
    return ipResult
  }

  try {
    const result = await rateLimitingApi.checkRateLimit(userId, action, maxRequests, windowMs)
    const responseTime = performance.now() - startTime
    rateLimitManager.updateMetrics(action, result.allowed, responseTime)
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Rate limit check failed, falling back to local storage', err, {
      userId,
      action,
    })

    // Fallback to local storage if API fails
    const key = `rate-limit:${action}:${userId}`
    const attempts = (await storage.get<number[]>(key)) ?? []

    // Filter out attempts outside the window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs)

    // Check if limit exceeded
    if (recentAttempts.length >= maxRequests) {
      rateLimitManager.recordViolation(ip, userId)
      const oldestAttempt = recentAttempts[0]
      if (isTruthy(oldestAttempt)) {
        const resetAt = oldestAttempt + windowMs
        const responseTime = performance.now() - startTime
        rateLimitManager.updateMetrics(action, false, responseTime)
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          limit: maxRequests,
        }
      }
    }

    // Add current attempt
    recentAttempts.push(now)

    // Store updated attempts
    await storage.set(key, recentAttempts)

    const remaining = Math.max(0, maxRequests - recentAttempts.length)
    const resetAt =
      recentAttempts.length > 0 && recentAttempts[0]
        ? recentAttempts[0] + windowMs
        : now + windowMs

    const responseTime = performance.now() - startTime
    rateLimitManager.updateMetrics(action, true, responseTime)

    return {
      allowed: true,
      remaining,
      resetAt,
      limit: maxRequests,
    }
  }
}

/**
 * Rate limit check for comments (max 50 per hour)
 */
export function checkCommentRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    action: 'comment',
  });
}

/**
 * Throws error if rate limit exceeded
 */
export async function enforceRateLimit(userId: string, config: RateLimitConfig): Promise<void> {
  const result = await checkRateLimit(userId, config)

  if (!result.allowed) {
    const resetMinutes = Math.ceil((result.resetAt - Date.now()) / (60 * 1000))
    throw new Error(
      `Rate limit exceeded. Maximum ${config.maxRequests} ${config.action} requests per ${Math.floor(config.windowMs / (60 * 1000))} minutes. ` +
        `Try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`
    )
  }
}

/**
 * Get rate limit metrics
 */
export function getRateLimitMetrics(action: string): RateLimitMetrics | null {
  return rateLimitManager.getMetrics(action)
}

/**
 * Get abuse detection status
 */
export function getAbuseDetection(ip: string, userId?: string): AbuseDetection | null {
  return rateLimitManager.getAbuseDetection(ip, userId)
}

/**
 * Check IP-based rate limit
 */
export function checkIPRateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  return rateLimitManager.checkIPRateLimit(ip, config)
}

/**
 * Export types
 */
export type { RateLimitConfig, RateLimitResult, AbuseDetection, RateLimitMetrics }
