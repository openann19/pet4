import { describe, expect, it } from 'vitest';
import { createSeededRNG, randomGaussian, setSeed } from '../seeded-rng';

describe('SeededRNG', () => {
  describe('string seeds', () => {
    it('should be deterministic', () => {
      const a = createSeededRNG('hello').next();
      const b = createSeededRNG('hello').next();
      expect(a).toBeCloseTo(b, 12);
    });
  });

  describe('gaussian distribution', () => {
    it('should use spare and be reproducible with same seed', () => {
      const r1 = createSeededRNG(123);
      const a = r1.nextGaussian(0, 1);
      const b = r1.nextGaussian(0, 1);
      const r2 = createSeededRNG(123);
      const c = r2.nextGaussian(0, 1);
      const d = r2.nextGaussian(0, 1);
      expect(a).toBeCloseTo(c, 12);
      expect(b).toBeCloseTo(d, 12);
    });
  });

  describe('global seed', () => {
    it('should affect outputs', () => {
      setSeed(42);
      const x = randomGaussian();
      setSeed(42);
      const y = randomGaussian();
      expect(x).toBeCloseTo(y, 12);
    });
  });
});
