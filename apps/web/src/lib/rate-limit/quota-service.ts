/**
 * Quota Service for Daily/Periodic Rate Limits
 *
 * Tracks daily quotas and usage across time periods.
 * Designed for quota-based rate limiting (e.g., 100 generations per day).
 */

export interface QuotaConfig {
  dailyLimit: number;
  windowMs?: number; // Custom window in ms (default: 24 hours)
  resetAtMidnight?: boolean; // Reset at midnight UTC (default: true)
}

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  used: number;
}

export interface QuotaUsage {
  userId: string;
  action: string;
  count: number;
  windowStart: number;
  windowEnd: number;
}

/**
 * In-memory quota service
 * For production, use persistent storage (Redis, database, KV store)
 */
export class QuotaService {
  private quotas = new Map<string, QuotaUsage>();
  private readonly dailyLimit: number;
  private readonly windowMs: number;
  private readonly resetAtMidnight: boolean;

  constructor(config: QuotaConfig) {
    this.dailyLimit = config.dailyLimit;
    this.windowMs = config.windowMs ?? 24 * 60 * 60 * 1000; // 24 hours
    this.resetAtMidnight = config.resetAtMidnight ?? true;
  }

  /**
   * Get quota key for user and action
   */
  private getKey(userId: string, action: string): string {
    return `quota:${action}:${userId}`;
  }

  /**
   * Get window start time
   */
  private getWindowStart(now: number): number {
    if (this.resetAtMidnight) {
      // Reset at midnight UTC
      const date = new Date(now);
      date.setUTCHours(0, 0, 0, 0);
      return date.getTime();
    }
    // Sliding window: start from now - windowMs
    return now - this.windowMs;
  }

  /**
   * Check if quota allows the request
   */
  checkQuota(userId: string, action: string): QuotaResult {
    const key = this.getKey(userId, action);
    const now = Date.now();
    const windowStart = this.getWindowStart(now);
    const windowEnd = windowStart + this.windowMs;

    let usage = this.quotas.get(key);

    // Check if window has expired
    if (!usage || usage.windowEnd < now) {
      // Start new window
      usage = {
        userId,
        action,
        count: 0,
        windowStart,
        windowEnd,
      };
      this.quotas.set(key, usage);
    }

    // Check quota
    if (usage.count >= this.dailyLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: usage.windowEnd,
        limit: this.dailyLimit,
        used: usage.count,
      };
    }

    // Increment usage
    usage.count += 1;
    this.quotas.set(key, usage);

    return {
      allowed: true,
      remaining: this.dailyLimit - usage.count,
      resetAt: usage.windowEnd,
      limit: this.dailyLimit,
      used: usage.count,
    };
  }

  /**
   * Get current quota usage without consuming
   */
  getUsage(userId: string, action: string): QuotaResult {
    const key = this.getKey(userId, action);
    const now = Date.now();
    const windowStart = this.getWindowStart(now);
    const windowEnd = windowStart + this.windowMs;

    const usage = this.quotas.get(key);

    if (!usage || usage.windowEnd < now) {
      return {
        allowed: true,
        remaining: this.dailyLimit,
        resetAt: windowEnd,
        limit: this.dailyLimit,
        used: 0,
      };
    }

    return {
      allowed: usage.count < this.dailyLimit,
      remaining: Math.max(0, this.dailyLimit - usage.count),
      resetAt: usage.windowEnd,
      limit: this.dailyLimit,
      used: usage.count,
    };
  }

  /**
   * Reset quota for user and action
   */
  resetQuota(userId: string, action: string): void {
    const key = this.getKey(userId, action);
    this.quotas.delete(key);
  }

  /**
   * Clear all quotas (for testing)
   */
  clearAll(): void {
    this.quotas.clear();
  }
}

/**
 * Create quota service with predefined limits
 */
export function createQuotaService(dailyLimit: number): QuotaService {
  return new QuotaService({
    dailyLimit,
    resetAtMidnight: true,
  });
}
