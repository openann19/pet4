/**
 * Deterministic RNG — LCG + Gaussian + string seeding (no Math.random)
 * Safe for SSR and tests; zero global leaks unless you opt-in with setSeed().
 */

export class SeededRNG {
  private seed: number
  private _gaussSpare: number | null = null

  constructor(seed: number = Date.now() >>> 0) {
    this.seed = seed >>> 0
  }

  /** Next uniform in [0,1) — LCG (Numerical Recipes) */
  next(): number {
    // (a * seed + c) mod 2^32
    const a = 1664525 >>> 0
    const c = 1013904223 >>> 0
    this.seed = (Math.imul(a, this.seed) + c) >>> 0
    // divide by 2^32 (exact)
    return this.seed / 0x100000000
  }

  /** Uniform [min,max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Integer [min,max) */
  rangeInt(min: number, max: number): number {
    return (min + this.next() * (max - min)) | 0
  }

  /** Gaussian (μ, σ) using Box–Muller with spare */
  nextGaussian(mu = 0, sigma = 1): number {
    if (this._gaussSpare !== null) {
      const v = this._gaussSpare
      this._gaussSpare = null
      return mu + v * sigma
    }

    let u = 0
    let v = 0

    // ensure (0,1)
    while (u === 0) u = this.next()
    while (v === 0) v = this.next()

    const mag = Math.sqrt(-2.0 * Math.log(u))
    const z0 = mag * Math.cos(2 * Math.PI * v)
    const z1 = mag * Math.sin(2 * Math.PI * v)

    this._gaussSpare = z1
    return mu + z0 * sigma
  }

  setSeed(seed: number): void {
    this.seed = seed >>> 0
    this._gaussSpare = null
  }

  getSeed(): number {
    return this.seed >>> 0
  }

  /** Derive seed from string (FNV-1a 32-bit) */
  static seedFromString(s: string): number {
    let h = 0x811c9dc5 >>> 0

    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }

    return h >>> 0
  }
}

let globalRNG: SeededRNG | null = null

function getGlobalRNG(): SeededRNG {
  return (globalRNG ??= new SeededRNG(Date.now() >>> 0))
}

export function random(): number {
  return getGlobalRNG().next()
}

export function randomRange(min: number, max: number): number {
  return getGlobalRNG().range(min, max)
}

export function randomInt(min: number, max: number): number {
  return getGlobalRNG().rangeInt(min, max)
}

export function randomGaussian(mu = 0, sigma = 1): number {
  return getGlobalRNG().nextGaussian(mu, sigma)
}

export function createSeededRNG(seed?: number | string): SeededRNG {
  const s = typeof seed === 'string' ? SeededRNG.seedFromString(seed) : (seed ?? Date.now() >>> 0)
  return new SeededRNG(s)
}

export function setSeed(seed: number | string): void {
  const s = typeof seed === 'string' ? SeededRNG.seedFromString(seed) : seed
  getGlobalRNG().setSeed(s >>> 0)
}
