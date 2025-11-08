/**
 * Test Helpers
 *
 * Common utilities and helpers for writing tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Create a test query client with default options
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Render component with React Query provider
 */
export function renderWithQueryClient(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for next tick
 */
export async function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  const mockedError = vi.fn();
  const mockedWarn = vi.fn();
  const mockedLog = vi.fn();

  console.error = mockedError;
  console.warn = mockedWarn;
  console.log = mockedLog;

  return {
    mockedError,
    mockedWarn,
    mockedLog,
    restore: () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    },
  };
}

/**
 * Create mock API response
 */
export function createMockAPIResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

/**
 * Create mock API error
 */
export function createMockAPIError(message: string, status = 500, code?: string) {
  const error = new Error(message) as Error & {
    status: number;
    code?: string;
  };
  error.status = status;
  if (code) {
    error.code = code;
  }
  return error;
}

/**
 * Mock fetch with response
 */
export function mockFetch(response: unknown, status = 200) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers(),
    } as Response)
  );
}

/**
 * Mock fetch with error
 */
export function mockFetchError(error: Error) {
  global.fetch = vi.fn(() => Promise.reject(error));
}
