import { vi } from 'vitest';

interface MockLogger {
  warn: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  setLevel: ReturnType<typeof vi.fn>;
  addHandler: ReturnType<typeof vi.fn>;
}

/**
 * Logger mocks for testing
 */
export function createMockLogger(): MockLogger {
  return {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    setLevel: vi.fn(),
    addHandler: vi.fn(),
  };
}

