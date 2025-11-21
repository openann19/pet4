/**
 * Base Service Class
 *
 * Provides common functionality for all services:
 * - Error handling with typed errors
 * - Retry logic with exponential backoff
 * - Request/response validation with Zod
 * - Caching strategies
 * - Telemetry and performance monitoring
 * - Offline-first support with queue management
 */

import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { z } from 'zod';

const logger = createLogger('BaseService');

export interface RetryOptions {
  attempts?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  retryableStatusCodes?: number[];
}

export interface CacheOptions {
  enabled?: boolean;
  ttl?: number; // Time to live in milliseconds
  key?: string;
  invalidateOnMutation?: boolean;
}

export interface ServiceRequestConfig {
  retry?: RetryOptions;
  cache?: CacheOptions;
  timeout?: number;
  skipValidation?: boolean;
}

export interface TelemetryEvent {
  service: string;
  method: string;
  duration: number;
  success: boolean;
  errorCode?: string | undefined;
  cacheHit?: boolean | undefined;
}

/**
 * Base class for all service implementations
 */
export abstract class BaseService {
  protected readonly apiClient: typeof APIClient;
  protected readonly serviceName: string;
  private readonly cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly telemetryEvents: TelemetryEvent[] = [];
  private readonly maxTelemetryEvents = 100;

  constructor(serviceName: string, apiClient?: typeof APIClient) {
    this.serviceName = serviceName;
    this.apiClient = apiClient ?? APIClient;
  }

  /**
   * Make a request with automatic error handling, retry logic, validation, and caching
   */
  protected async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      schema?: z.ZodType<T>;
      config?: ServiceRequestConfig;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, schema, config = {} } = options;

    const startTime = Date.now();
    const cacheKey = config.cache?.key ?? endpoint;

    // Check cache for GET requests
    if (method === 'GET' && config.cache?.enabled !== false) {
      const cached = this.getFromCache<T>(cacheKey, config.cache?.ttl);
      if (cached !== null) {
        this.recordTelemetry({
          service: this.serviceName,
          method,
          duration: Date.now() - startTime,
          success: true,
          cacheHit: true,
        });
        return cached;
      }
    }

    try {
      // Execute request with retry logic
      const response = await this.executeWithRetry(async () => {
        switch (method) {
          case 'GET': {
            return await APIClient.get<T>(endpoint, {});
          }
          case 'POST': {
            return await APIClient.post<T>(endpoint, body, {});
          }
          case 'PUT': {
            return await APIClient.put<T>(endpoint, body, {});
          }
          case 'PATCH': {
            return await APIClient.patch<T>(endpoint, body, {});
          }
          case 'DELETE': {
            return await APIClient.delete<T>(endpoint, {});
          }
        }
      }, config.retry);

      // Validate response if schema provided
      let data: T;
      if (schema && !config.skipValidation) {
        data = this.validateResponse(response.data, schema, endpoint);
      } else {
        data = response.data;
      }

      // Cache GET responses
      if (method === 'GET' && config.cache?.enabled !== false && data !== undefined) {
        this.setCache(cacheKey, data, config.cache?.ttl);
      }

      // Invalidate cache on mutations
      if (method !== 'GET' && config.cache?.invalidateOnMutation !== false) {
        this.invalidateCache(cacheKey);
      }

      const duration = Date.now() - startTime;
      this.recordTelemetry({
        service: this.serviceName,
        method,
        duration,
        success: true,
        cacheHit: false,
      });

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorCode = this.getErrorCode(error);

      this.recordTelemetry({
        service: this.serviceName,
        method,
        duration,
        success: false,
        ...(errorCode !== undefined ? { errorCode } : {}),
      });

      // Re-throw with enhanced error context
      throw this.enhanceError(error, endpoint, method);
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retryOptions?: RetryOptions): Promise<T> {
    const attempts = retryOptions?.attempts ?? 3;
    const baseDelay = retryOptions?.delay ?? 1000;
    const exponentialBackoff = retryOptions?.exponentialBackoff ?? true;
    const retryableStatusCodes = retryOptions?.retryableStatusCodes ?? [
      408, 429, 500, 502, 503, 504,
    ];

    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, retryableStatusCodes);
        if (!isRetryable || attempt === attempts - 1) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = exponentialBackoff ? baseDelay * Math.pow(2, attempt) : baseDelay;

        logger.debug(
          `Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${attempts})`,
          {
            service: this.serviceName,
            error: error instanceof Error ? error.message : String(error),
          }
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      return retryableStatusCodes.includes(status);
    }

    // Network errors are always retryable
    if (error instanceof Error && error.name === 'NetworkError') {
      return true;
    }

    return false;
  }

  /**
   * Validate response against Zod schema
   */
  private validateResponse<T>(data: unknown, schema: z.ZodType<T>, endpoint: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Response validation failed', err, {
        service: this.serviceName,
        endpoint,
      });
      throw new Error(`Response validation failed for ${endpoint}: ${err.message}`);
    }
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object') {
      if ('code' in error && typeof error.code === 'string') {
        return error.code;
      }
      if ('status' in error && typeof error.status === 'number') {
        return `HTTP_${(error as { status: number }).status}`;
      }
    }

    if (error instanceof Error) {
      return error.name;
    }

    return undefined;
  }

  /**
   * Enhance error with context
   */
  private enhanceError(error: unknown, endpoint: string, method: string): Error {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error';
    } else {
      errorMessage = String(error) || 'Unknown error';
    }
    const enhancedMessage = `[${this.serviceName}] ${method} ${endpoint}: ${errorMessage}`;

    if (error instanceof Error) {
      const enhanced = new Error(enhancedMessage);
      if (error.stack !== undefined) {
        enhanced.stack = error.stack;
      }
      if (error.cause !== undefined) {
        enhanced.cause = error.cause;
      }
      return enhanced;
    }

    return new Error(enhancedMessage);
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string, ttl?: number): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const cacheTTL = ttl ?? cached.ttl;
    if (now - cached.timestamp > cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown, ttl?: number): void {
    const defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? defaultTTL,
    });
  }

  private invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clear all cache for this service
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Telemetry management
   */
  private recordTelemetry(event: TelemetryEvent): void {
    this.telemetryEvents.push(event);

    // Keep only recent events
    if (this.telemetryEvents.length > this.maxTelemetryEvents) {
      this.telemetryEvents.shift();
    }

    // Log performance metrics
    if (event.duration > 1000) {
      logger.warn('Slow service request detected', {
        service: event.service,
        method: event.method,
        duration: event.duration,
      });
    }
  }

  /**
   * Get telemetry data
   */
  public getTelemetry(): TelemetryEvent[] {
    return [...this.telemetryEvents];
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    averageDuration: number;
    successRate: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    if (this.telemetryEvents.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        cacheHitRate: 0,
        totalRequests: 0,
      };
    }

    const total = this.telemetryEvents.length;
    const successful = this.telemetryEvents.filter((e) => e.success).length;
    const cached = this.telemetryEvents.filter((e) => e.cacheHit).length;
    const totalDuration = this.telemetryEvents.reduce((sum, e) => sum + e.duration, 0);

    return {
      averageDuration: totalDuration / total,
      successRate: (successful / total) * 100,
      cacheHitRate: (cached / total) * 100,
      totalRequests: total,
    };
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
