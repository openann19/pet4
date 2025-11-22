// Local utilities to avoid circular dependencies with @petspark/shared
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

export function isDefined<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

export function isTruthy<T>(v: T): v is Exclude<T, 0 | '' | false | null | undefined> {
  return !!v;
}

/**
 * Create a seeded random number generator function (Xorshift32 algorithm)
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