/**
 * API Client Mock Utilities
 *
 * Mock utilities for API client in tests
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

/**
 * Create a mock API client
 */
export function createMockAPIClient(): MockAPIClient {
  return {
    get: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    post: vi.fn(() => Promise.resolve({ data: {}, status: 201 })),
    put: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    patch: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
    delete: vi.fn(() => Promise.resolve({ data: {}, status: 204 })),
    request: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
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
