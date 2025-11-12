import { describe, it, expect } from 'vitest';
import { createSeededRNG } from './seeded-rng';

describe('Seeded RNG', () => {
  it('is deterministic per seed', () => {
    const rng1 = createSeededRNG(123);
    const a = [rng1.next(), rng1.next(), rng1.nextInt(0, 10)];

    const rng2 = createSeededRNG(123);
    const b = [rng2.next(), rng2.next(), rng2.nextInt(0, 10)];

    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createSeededRNG(123);
    const a = [rng1.next(), rng1.next(), rng1.next()];

    const rng2 = createSeededRNG(456);
    const b = [rng2.next(), rng2.next(), rng2.next()];

    expect(a).not.toEqual(b);
  });

  it('generates integers in correct range', () => {
    const rng = createSeededRNG(789);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('generates floats in correct range', () => {
    const rng = createSeededRNG(999);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
