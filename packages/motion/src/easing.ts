/**
 * Shared easing utilities used by motion tokens and the public facade.
 * Lives in its own module to avoid circular dependencies between the
 * tokens and the main index export.
 */

export type PetSparkEasingFunction = (value: number) => number

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t * (2 - t),
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  poly: (n: number) => (t: number) => Math.pow(t, n),
  sin: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t: number) => 1 - Math.sqrt(1 - t * t),
  exp: (t: number) => Math.pow(2, 10 * (t - 1)),
  elastic: (bounciness: number) => (t: number) => {
    const p = bounciness * Math.PI
    return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p)
  },
  back: (s: number) => (t: number) => {
    const c = s + 1
    return c * t * t * t - s * t * t
  },
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
  inOut: (easing: (t: number) => number) => (t: number) =>
    t < 0.5 ? easing(2 * t) / 2 : 1 - easing(2 * (1 - t)) / 2,
}
