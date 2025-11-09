import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenBucket, createTokenBucket } from './token-bucket';

describe('TokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests when tokens are available', () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 1, // 1 token per second
    });

    const result = bucket.consume(1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
  });

  it('should reject requests when tokens are exhausted', () => {
    const bucket = new TokenBucket({
      capacity: 2,
      refillRate: 1,
    });

    bucket.consume(2); // Exhaust tokens
    const result = bucket.consume(1);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should refill tokens over time', () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 1, // 1 token per second
    });

    bucket.consume(10); // Exhaust all tokens

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    const result = bucket.consume(5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should not exceed capacity', () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 1,
    });

    // Advance time significantly
    vi.advanceTimersByTime(20000);

    const result = bucket.consume(1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
  });

  it('should calculate reset time correctly', () => {
    const bucket = new TokenBucket({
      capacity: 10,
      refillRate: 1, // 1 token per second
    });

    bucket.consume(10); // Exhaust tokens
    const result = bucket.consume(1);

    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  describe('createTokenBucket', () => {
    it('should create bucket with requests per minute', () => {
      const bucket = createTokenBucket(60); // 60 requests per minute
      const result = bucket.consume(1);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(60);
    });

    it('should create bucket with burst capacity', () => {
      const bucket = createTokenBucket(60, 120); // 60 RPM, 120 burst
      const result = bucket.consume(120);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(120);
    });
  });
});
