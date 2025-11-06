/**
 * Seeded Random Number Generator
 * Provides deterministic random numbers based on a seed value
 */

export interface SeededRNG {
  range(min: number, max: number): number
  rangeInt(min: number, max: number): number
}

/**
 * Create a seeded random number generator
 */
export function createSeededRNG(seed: number | string): SeededRNG {
  let currentSeed = typeof seed === 'string' ? hashString(seed) : seed

  function next(): number {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }

  return {
    range(min: number, max: number): number {
      return min + next() * (max - min)
    },
    rangeInt(min: number, max: number): number {
      return Math.floor(min + next() * (max - min + 1))
    },
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

