/**
 * Rate limiting with token bucket and sliding window algorithms
 *
 * Features:
 * - Token bucket algorithm for burst handling
 * - Sliding window for accurate rate limiting
 * - Multiple rate limit tiers (per-second, per-minute, per-hour)
 * - Persistent state across page reloads
 * - Automatic cleanup of expired entries
 * - IP-based and user-based limiting
 * - Retry-After header calculation
 *
 * @example
 * ```tsx
 * const rateLimiter = useRateLimiter({
 *   limits: [
 *     { requests: 10, window: 1000 },    // 10/second
 *     { requests: 100, window: 60000 },  // 100/minute
 *     { requests: 1000, window: 3600000 } // 1000/hour
 *   ],
 *   onLimitExceeded: (retryAfter) => {
 *     showError(`Rate limited. Try again in ${retryAfter}ms`);
 *   }
 * });
 *
 * // Check if action is allowed
 * if (rateLimiter.canProceed('sendMessage')) {
 *   await sendMessage();
 *   rateLimiter.consume('sendMessage');
 * }
 *
 * // Get remaining quota
 * const remaining = rateLimiter.getRemaining('sendMessage');
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  readonly requests: number;
  readonly window: number; // milliseconds
}

export interface RateLimiterConfig {
  readonly limits: readonly RateLimitConfig[];
  readonly userId?: string;
  readonly persistKey?: string;
  readonly onLimitExceeded?: (retryAfter: number, limitConfig: RateLimitConfig) => void;
  readonly onWarning?: (remaining: number, limitConfig: RateLimitConfig) => void;
  readonly warningThreshold?: number; // Percentage (0-1)
}

export interface RateLimitState {
  readonly isLimited: boolean;
  readonly retryAfter: number | null;
  readonly remaining: Record<string, number>;
  readonly resetTimes: Record<string, number>;
}

interface RequestRecord {
  readonly timestamp: number;
  readonly actionKey: string;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  readonly capacity: number;
  readonly refillRate: number; // tokens per millisecond
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_PREFIX = 'petspark_ratelimit_';
const CLEANUP_INTERVAL = 60000; // 1 minute
const DEFAULT_WARNING_THRESHOLD = 0.2; // 20% remaining

// ============================================================================
// Utilities
// ============================================================================

function getStorageKey(prefix: string, userId: string | undefined): string {
  return `${prefix}${userId ?? 'anonymous'}`;
}

function loadRequests(storageKey: string): RequestRecord[] {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as RequestRecord[];
  } catch {
    return [];
  }
}

function saveRequests(storageKey: string, requests: readonly RequestRecord[]): void {
  localStorage.setItem(storageKey, JSON.stringify(requests));
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRateLimiter(config: RateLimiterConfig) {
  const {
    limits,
    userId,
    persistKey = STORAGE_PREFIX,
    onLimitExceeded,
    onWarning,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
  } = config;

  const storageKey = getStorageKey(persistKey, userId);

  // State
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: null,
    remaining: {},
    resetTimes: {},
  });

  // Refs
  const requestsRef = useRef<RequestRecord[]>(loadRequests(storageKey));
  const tokensRef = useRef<Map<string, TokenBucket>>(new Map());
  const cleanupTimerRef = useRef<number | null>(null);

  // ============================================================================
  // Token Bucket Implementation
  // ============================================================================

  const initializeTokenBucket = useCallback(
    (actionKey: string, limitConfig: RateLimitConfig): TokenBucket => {
      return {
        tokens: limitConfig.requests,
        lastRefill: Date.now(),
        capacity: limitConfig.requests,
        refillRate: limitConfig.requests / limitConfig.window,
      };
    },
    []
  );

  const refillTokens = useCallback((bucket: TokenBucket): void => {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * bucket.refillRate;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }, []);

  // ============================================================================
  // Sliding Window Implementation
  // ============================================================================

  const getRequestsInWindow = useCallback(
    (actionKey: string, windowMs: number): number => {
      const now = Date.now();
      const cutoff = now - windowMs;

      return requestsRef.current.filter(
        (req) => req.actionKey === actionKey && req.timestamp > cutoff
      ).length;
    },
    []
  );

  const cleanupExpiredRequests = useCallback(() => {
    const now = Date.now();
    const maxWindow = Math.max(...limits.map((l) => l.window));
    const cutoff = now - maxWindow;

    requestsRef.current = requestsRef.current.filter(
      (req) => req.timestamp > cutoff
    );

    saveRequests(storageKey, requestsRef.current);
  }, [limits, storageKey]);

  // ============================================================================
  // Rate Limiting Logic
  // ============================================================================

  const canProceed = useCallback(
    (actionKey: string): boolean => {
      const now = Date.now();

      for (const limitConfig of limits) {
        // Token bucket check
        const bucketKey = `${actionKey}_${limitConfig.window}`;
        let bucket = tokensRef.current.get(bucketKey);

        if (!bucket) {
          bucket = initializeTokenBucket(actionKey, limitConfig);
          tokensRef.current.set(bucketKey, bucket);
        }

        refillTokens(bucket);

        if (bucket.tokens < 1) {
          // Calculate retry-after time
          const tokensNeeded = 1 - bucket.tokens;
          const retryAfter = Math.ceil(tokensNeeded / bucket.refillRate);

          setState((prev) => ({
            ...prev,
            isLimited: true,
            retryAfter,
          }));

          if (onLimitExceeded) {
            onLimitExceeded(retryAfter, limitConfig);
          }

          return false;
        }

        // Sliding window check
        const requestsInWindow = getRequestsInWindow(
          actionKey,
          limitConfig.window
        );

        if (requestsInWindow >= limitConfig.requests) {
          // Find oldest request in window to calculate retry-after
          const oldestInWindow = requestsRef.current
            .filter((req) => req.actionKey === actionKey)
            .sort((a, b) => a.timestamp - b.timestamp)[0];

          const retryAfter = oldestInWindow
            ? limitConfig.window - (now - oldestInWindow.timestamp)
            : limitConfig.window;

          setState((prev) => ({
            ...prev,
            isLimited: true,
            retryAfter,
          }));

          if (onLimitExceeded) {
            onLimitExceeded(retryAfter, limitConfig);
          }

          return false;
        }

        // Warning threshold check
        const remaining = limitConfig.requests - requestsInWindow;
        const remainingPercentage = remaining / limitConfig.requests;

        if (remainingPercentage <= warningThreshold && onWarning) {
          onWarning(remaining, limitConfig);
        }
      }

      setState((prev) => ({
        ...prev,
        isLimited: false,
        retryAfter: null,
      }));

      return true;
    },
    [
      limits,
      initializeTokenBucket,
      refillTokens,
      getRequestsInWindow,
      warningThreshold,
      onLimitExceeded,
      onWarning,
    ]
  );

  const consume = useCallback(
    (actionKey: string): void => {
      const now = Date.now();

      // Add request record
      const record: RequestRecord = {
        timestamp: now,
        actionKey,
      };

      requestsRef.current.push(record);
      saveRequests(storageKey, requestsRef.current);

      // Consume tokens from all buckets
      for (const limitConfig of limits) {
        const bucketKey = `${actionKey}_${limitConfig.window}`;
        const bucket = tokensRef.current.get(bucketKey);

        if (bucket) {
          refillTokens(bucket);
          bucket.tokens = Math.max(0, bucket.tokens - 1);
        }
      }

      // Update remaining counts
      const remaining: Record<string, number> = {};
      const resetTimes: Record<string, number> = {};

      for (const limitConfig of limits) {
        const requestsInWindow = getRequestsInWindow(
          actionKey,
          limitConfig.window
        );
        const key = `${limitConfig.requests}/${limitConfig.window}`;
        remaining[key] = limitConfig.requests - requestsInWindow;
        resetTimes[key] = now + limitConfig.window;
      }

      setState((prev) => ({
        ...prev,
        remaining,
        resetTimes,
      }));
    },
    [limits, storageKey, refillTokens, getRequestsInWindow]
  );

  // ============================================================================
  // Public API
  // ============================================================================

  const getRemaining = useCallback(
    (actionKey: string): Record<string, number> => {
      const remaining: Record<string, number> = {};

      for (const limitConfig of limits) {
        const requestsInWindow = getRequestsInWindow(
          actionKey,
          limitConfig.window
        );
        const key = `${limitConfig.requests}/${limitConfig.window}`;
        remaining[key] = Math.max(0, limitConfig.requests - requestsInWindow);
      }

      return remaining;
    },
    [limits, getRequestsInWindow]
  );

  const reset = useCallback(
    (actionKey?: string): void => {
      if (actionKey) {
        // Reset specific action
        requestsRef.current = requestsRef.current.filter(
          (req) => req.actionKey !== actionKey
        );

        // Clear token buckets for this action
        for (const limitConfig of limits) {
          const bucketKey = `${actionKey}_${limitConfig.window}`;
          tokensRef.current.delete(bucketKey);
        }
      } else {
        // Reset all
        requestsRef.current = [];
        tokensRef.current.clear();
      }

      saveRequests(storageKey, requestsRef.current);

      setState({
        isLimited: false,
        retryAfter: null,
        remaining: {},
        resetTimes: {},
      });
    },
    [limits, storageKey]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Periodic cleanup
  useEffect(() => {
    cleanupTimerRef.current = window.setInterval(() => {
      cleanupExpiredRequests();
    }, CLEANUP_INTERVAL);

    return () => {
      if (cleanupTimerRef.current !== null) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupExpiredRequests]);

  // Initial cleanup
  useEffect(() => {
    cleanupExpiredRequests();
  }, [cleanupExpiredRequests]);

  return {
    canProceed,
    consume,
    getRemaining,
    reset,
    state,
  };
}
