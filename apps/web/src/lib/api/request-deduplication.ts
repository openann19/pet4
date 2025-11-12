import { isTruthy, isDefined } from '@petspark/shared';

/**
 * Request Deduplication - Prevent duplicate API requests
 * Automatically deduplicates concurrent requests to the same endpoint
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<unknown>>;
  private maxAge: number;

  constructor(maxAge = 5000) {
    this.pendingRequests = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Execute request with deduplication
   * If same request is in-flight, return existing promise
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check for existing pending request
    const existing = this.pendingRequests.get(key) as PendingRequest<T> | undefined;

    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < this.maxAge) {
        return existing.promise;
      }
    }

    // Create new request
    const promise = fetcher()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear specific pending request
   */
  clear(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear stale requests
   */
  clearStale(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get stats
   */
  stats(): {
    pending: number;
    keys: string[];
  } {
    return {
      pending: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    };
  }
}

// Global deduplicator instance
export const requestDeduplicator = new RequestDeduplicator();

// Helper to create a deduplicated fetch function
export function createDedupedFetch<T>(key: string, fetcher: () => Promise<T>): () => Promise<T> {
  return () => requestDeduplicator.dedupe(key, fetcher);
}
