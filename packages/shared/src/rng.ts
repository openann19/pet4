/**
 * Seeded Random Number Generator
 *
 * Xorshift32 algorithm for deterministic random number generation.
 * Useful for particle effects and animations where reproducibility is needed.
 *
 * Location: packages/shared/src/rng.ts
 */

/**
 * Create a seeded random number generator function
 *
 * @param seed - Initial seed value (will be converted to unsigned 32-bit integer)
 * @returns Function that returns random numbers in [0, 1)
 */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0

  return (): number => {
    // Xorshift32 algorithm
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

/**
 * Create a seeded RNG with automatic seed generation
 * Uses current timestamp + Math.random as fallback seed
 */
export function makeAutoRng(): () => number {
  const seed = Date.now() ^ (Math.random() * 0xffffffff)
  return makeRng(seed)
}
