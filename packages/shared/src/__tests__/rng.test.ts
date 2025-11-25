import { describe, it, expect } from 'vitest'
import { makeRng, makeAutoRng } from '../rng'

describe('makeRng function', () => {
  it('should create a deterministic RNG function', () => {
    const rng1 = makeRng(12345)
    const rng2 = makeRng(12345)

    // Same seed should produce same sequence
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
  })

  it('should produce numbers in range [0, 1)', () => {
    const rng = makeRng(42)

    for (let i = 0; i < 100; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('should produce different sequences for different seeds', () => {
    const rng1 = makeRng(12345)
    const rng2 = makeRng(54321)

    // Different seeds should produce different sequences
    expect(rng1()).not.toBe(rng2())
  })

  it('should handle zero seed', () => {
    const rng = makeRng(0)

    expect(typeof rng()).toBe('number')
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeLessThan(1)
  })

  it('should handle negative seeds', () => {
    const rng1 = makeRng(-12345)
    const rng2 = makeRng(-12345)

    // Same negative seed should produce same sequence
    expect(rng1()).toBe(rng2())
  })

  it('should handle large seeds', () => {
    const rng = makeRng(Number.MAX_SAFE_INTEGER)

    expect(typeof rng()).toBe('number')
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeLessThan(1)
  })

  it('should produce deterministic sequence', () => {
    const rng = makeRng(42)
    const sequence = [rng(), rng(), rng(), rng(), rng()]

    // Reset with same seed should produce exact same sequence
    const rng2 = makeRng(42)
    sequence.forEach(value => {
      expect(rng2()).toBe(value)
    })
  })

  it('should handle non-integer seeds by converting to unsigned 32-bit', () => {
    const rng1 = makeRng(123.456)
    const rng2 = makeRng(123)

    // Should be converted to integer part
    expect(rng1()).toBe(rng2())
  })
})

describe('makeAutoRng function', () => {
  it('should create an RNG function', () => {
    const rng = makeAutoRng()

    expect(typeof rng).toBe('function')
    expect(typeof rng()).toBe('number')
  })

  it('should produce numbers in valid range', () => {
    const rng = makeAutoRng()

    for (let i = 0; i < 10; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('should create valid RNG functions', () => {
    const rng1 = makeAutoRng()
    const rng2 = makeAutoRng()

    // Both should produce valid numbers
    const value1 = rng1()
    const value2 = rng2()

    expect(typeof value1).toBe('number')
    expect(typeof value2).toBe('number')
    expect(value1).toBeGreaterThanOrEqual(0)
    expect(value1).toBeLessThan(1)
    expect(value2).toBeGreaterThanOrEqual(0)
    expect(value2).toBeLessThan(1)
  })
})

describe('RNG edge cases', () => {
  it('should handle maximum unsigned 32-bit value', () => {
    const rng = makeRng(0xffffffff)

    expect(typeof rng()).toBe('number')
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeLessThan(1)
  })

  it('should handle very large positive numbers', () => {
    const rng = makeRng(1e20)

    expect(typeof rng()).toBe('number')
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeLessThan(1)
  })

  it('should handle very large negative numbers', () => {
    const rng = makeRng(-1e20)

    expect(typeof rng()).toBe('number')
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeLessThan(1)
  })
})
