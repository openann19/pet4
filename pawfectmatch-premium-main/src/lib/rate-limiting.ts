import { createLogger } from './logger'

const logger = createLogger('RateLimiting')

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  action: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

/**
 * Generic rate limiting utility using KV storage
 * Tracks requests using sliding window algorithm
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, action } = config
  const key = `rate-limit:${action}:${userId}`
  const now = Date.now()
  
  try {
    const attempts = await spark.kv.get<number[]>(key) || []
    
    // Filter out attempts outside the window
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < windowMs
    )
    
    // Check if limit exceeded
    if (recentAttempts.length >= maxRequests) {
      const oldestAttempt = recentAttempts[0]
      if (oldestAttempt) {
        const resetAt = oldestAttempt + windowMs
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          limit: maxRequests
        }
      }
    }
    
    // Add current attempt
    recentAttempts.push(now)
    
    // Store updated attempts
    await spark.kv.set(key, recentAttempts)
    
    const remaining = Math.max(0, maxRequests - recentAttempts.length)
    const resetAt = recentAttempts.length > 0 && recentAttempts[0]
      ? recentAttempts[0] + windowMs
      : now + windowMs
    
    return {
      allowed: true,
      remaining,
      resetAt,
      limit: maxRequests
    }
  } catch (error) {
    logger.error('Rate limit check failed', error instanceof Error ? error : new Error(String(error)), {
      userId,
      action
    })
    // Fail open - allow request if rate limiting check fails
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
      limit: maxRequests
    }
  }
}

/**
 * Rate limit check for comments (max 50 per hour)
 */
export async function checkCommentRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(userId, {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    action: 'comment'
  })
}

/**
 * Throws error if rate limit exceeded
 */
export async function enforceRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  const result = await checkRateLimit(userId, config)
  
  if (!result.allowed) {
    const resetMinutes = Math.ceil((result.resetAt - Date.now()) / (60 * 1000))
    throw new Error(
      `Rate limit exceeded. Maximum ${config.maxRequests} ${config.action} requests per ${Math.floor(config.windowMs / (60 * 1000))} minutes. ` +
      `Try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`
    )
  }
}

