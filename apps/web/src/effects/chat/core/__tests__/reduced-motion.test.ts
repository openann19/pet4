import { describe, expect, it } from 'vitest';
import { isReduceMotionEnabled } from '../reduced-motion';

function mockMatch(media: string, matches: boolean): void {
  Object.defineProperty(global, 'window', {
    value: {
      matchMedia: (q: string) => ({
        matches,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    },
    configurable: true,
    writable: true,
  });
}

describe('Reduced Motion', () => {
  describe('isReduceMotionEnabled', () => {
    it('should detect reduced motion via media query', () => {
      mockMatch('(prefers-reduced-motion: reduce)', true);
      expect(isReduceMotionEnabled()).toBe(true);
      mockMatch('(prefers-reduced-motion: reduce)', false);
      expect(isReduceMotionEnabled()).toBe(false);
    });
  });
});
