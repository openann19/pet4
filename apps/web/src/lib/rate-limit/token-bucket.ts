/**
 * Token Bucket Rate Limiting Algorithm
 *
 * Implements token bucket algorithm for rate limiting.
 * Suitable for both Node.js runtime and Edge runtime.
 */

export interface TokenBucketConfig {
  capacity: number; // Maximum number of tokens
  refillRate: number; // Tokens per second
  initialTokens?: number; // Initial token count (defaults to capacity)
}

export interface TokenBucketResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Token Bucket implementation
 * Thread-safe for single-instance deployments
 * For distributed systems, use external storage (Redis, KV store)
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(config: TokenBucketConfig) {
    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.tokens = config.initialTokens ?? config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens from the bucket
   * @param tokens Number of tokens to consume (default: 1)
   * @returns TokenBucketResult with rate limit information
   */
  consume(tokens: number = 1): TokenBucketResult {
    const now = Date.now();
    this.refill(now);

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      const remaining = Math.floor(this.tokens);
      const resetAt = this.calculateResetTime(remaining);

      return {
        allowed: true,
        remaining,
        resetAt,
        limit: this.capacity,
      };
    }

    // Not enough tokens
    const resetAt = this.calculateResetTime(0);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      limit: this.capacity,
    };
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(now: number): void {
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Calculate when the bucket will have tokens available again
   */
  private calculateResetTime(remaining: number): number {
    if (remaining > 0) {
      return Date.now() + 1000; // Approximate: next second
    }
    // Calculate time until we have at least 1 token
    const tokensNeeded = 1 - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    return Date.now() + Math.ceil(secondsNeeded * 1000);
  }

  /**
   * Get current token count (for testing/monitoring)
   */
  getTokens(): number {
    this.refill(Date.now());
    return this.tokens;
  }

  /**
   * Reset bucket to full capacity
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Create a token bucket with predefined rate limits
 */
export function createTokenBucket(
  requestsPerMinute: number,
  burst?: number
): TokenBucket {
  const capacity = burst ?? requestsPerMinute;
  const refillRate = requestsPerMinute / 60; // Tokens per second

  return new TokenBucket({
    capacity,
    refillRate,
    initialTokens: capacity,
  });
}
