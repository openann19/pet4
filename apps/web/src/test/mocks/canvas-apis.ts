import { vi } from 'vitest';

/**
 * Canvas API mocks for testing
 */
export function setupCanvasAPIMocks(): void {
  // Mock HTMLCanvasElement methods
  HTMLCanvasElement.prototype.getContext = vi.fn((_contextId?: string, _options?: unknown) => {
    const mockContext = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
    return mockContext as unknown as
      | CanvasRenderingContext2D
      | ImageBitmapRenderingContext
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null;
  }) as typeof HTMLCanvasElement.prototype.getContext;

  // Mock HTMLMediaElement methods
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    writable: true,
    value: vi.fn(() => Promise.resolve()),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    writable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    writable: true,
    value: vi.fn(),
  });
}

