import { vi } from 'vitest';

/**
 * Browser API mocks for testing
 */
export function setupBrowserAPIMocks(): void {
  // Mock scrollIntoView for Radix UI components
  Element.prototype.scrollIntoView = vi.fn();

  // Mock window.matchMedia for responsive design tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock URL.createObjectURL and revokeObjectURL
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'mocked-object-url'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });

  // Mock window scroll methods
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  Object.defineProperty(window, 'scroll', { value: vi.fn(), writable: true });
  Object.defineProperty(Element.prototype, 'scrollTo', { value: vi.fn(), writable: true });
}

