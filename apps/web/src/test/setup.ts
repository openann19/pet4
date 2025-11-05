import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

vi.mock('@/config/env', () => ({
  ENV: {
    VITE_API_URL: 'http://localhost:8080',
    VITE_WS_URL: 'ws://localhost:8080',
    VITE_API_TIMEOUT: 5000,
    VITE_JWT_SECRET: 'abcdefghijklmnopqrstuvwxyz012345',
    VITE_JWT_EXPIRY: '7d',
    VITE_REFRESH_TOKEN_EXPIRY: '30d',
    VITE_USE_MOCKS: 'false',
    VITE_ENABLE_KYC: true,
    VITE_ENABLE_PAYMENTS: true,
    VITE_ENABLE_LIVE_STREAMING: true,
    VITE_MAPBOX_TOKEN: 'pk.test-token',
    VITE_STRIPE_PUBLIC_KEY: 'pk_test_1234567890',
    VITE_SENTRY_DSN: 'http://example.com/123',
    VITE_SENTRY_TRACES_SAMPLE_RATE: 0.1,
    VITE_CORS_ORIGIN: 'http://localhost:3000',
    VITE_CSP_ENABLED: true,
    VITE_APP_VERSION: 'test',
    VITE_ENVIRONMENT: 'development',
  },
}));

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null
  rootMargin: string = ''
  thresholds: ReadonlyArray<number> = []
  
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;
