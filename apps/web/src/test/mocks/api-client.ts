/**
 * API Client Mock Utilities
 *
 * Deterministic mock utilities for API client in tests
 * Provides predictable network simulation without randomness
 */

import { vi } from 'vitest';

export interface MockAPIClient {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
}

export interface MockAPIClientConfig {
  /**
   * Fixed delay for all requests in ms
   * Default: 0 (immediate)
   */
  delay?: number;
  /**
   * Success rate for requests (0-1)
   * Default: 1.0 (always succeeds)
   */
  successRate?: number;
  /**
   * Default response data
   * Default: {}
   */
  defaultResponse?: unknown;
}

interface RequestLog {
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
  requestId: number;
}

let requestCounter = 0;
const requestLogs: RequestLog[] = [];

/**
 * Create a deterministic mock API client
 */
export function createMockAPIClient(config: MockAPIClientConfig = {}): MockAPIClient {
  const {
    delay = 0,
    successRate = 1.0,
    defaultResponse = {},
  } = config;

  // Deterministic request ID generator
  const getRequestId = (): number => {
    requestCounter += 1;
    return requestCounter;
  };

  // Deterministic timestamp generator
  let currentTimestamp = 1000000000000;
  const getTimestamp = (): number => {
    const ts = currentTimestamp;
    currentTimestamp += 1;
    return ts;
  };

  // Deterministic success/failure based on successRate
  const shouldSucceed = (requestId: number): boolean => {
    if (successRate >= 1.0) return true;
    if (successRate <= 0.0) return false;

    // Deterministic pattern: succeed if (requestId % (1/successRate)) === 0
    const threshold = Math.floor(1 / successRate);
    return requestId % threshold === 0;
  };

  // Create deterministic mock method
  const createMockMethod = (method: string, defaultStatus: number) => {
    return vi.fn(async (url: string, data?: unknown) => {
      const requestId = getRequestId();
      const timestamp = getTimestamp();

      // Log request for validation
      requestLogs.push({
        method,
        url,
        data,
        timestamp,
        requestId,
      });

      // Deterministic delay
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Deterministic success/failure
      if (!shouldSucceed(requestId)) {
        throw createMockAPIError(
          `API ${method} request failed (deterministic failure)`,
          500,
          'DETERMINISTIC_ERROR'
        );
      }

      return {
        data: defaultResponse,
        status: defaultStatus,
        headers: {
          'content-type': 'application/json',
        },
      };
    });
  };

  return {
    get: createMockMethod('GET', 200),
    post: createMockMethod('POST', 201),
    put: createMockMethod('PUT', 200),
    patch: createMockMethod('PATCH', 200),
    delete: createMockMethod('DELETE', 204),
    request: createMockMethod('REQUEST', 200),
  };
}

/**
 * Create a mock API response
 */
export function createMockAPIResponse<T = unknown>(
  data: T,
  status = 200
): { data: T; status: number; headers?: Record<string, string> } {
  return {
    data,
    status,
    headers: {
      'content-type': 'application/json',
    },
  };
}

/**
 * Create a mock API error
 */
export function createMockAPIError(
  message: string,
  status = 500,
  code?: string
): Error & { status: number; code?: string } {
  const error = new Error(message) as Error & { status: number; code?: string };
  error.status = status;
  if (code !== undefined) {
    error.code = code;
  }
  return error;
}

/**
 * Get request logs for validation
 */
export function getRequestLogs(): readonly RequestLog[] {
  return [...requestLogs];
}

/**
 * Clear request logs
 */
export function clearRequestLogs(): void {
  requestLogs.length = 0;
  requestCounter = 0;
}

/**
 * Reset API client mock state
 */
export function resetAPIClientMock(): void {
  clearRequestLogs();
}
