import { describe, it, expect } from 'vitest'
import { getReducedMotionDuration } from './reduced-motion'

describe('Reduced motion duration', () => {
  it('caps to ≤120ms when reduced motion enabled', () => {
    expect(getReducedMotionDuration(500, true)).toBeLessThanOrEqual(120)
    expect(getReducedMotionDuration(1000, true)).toBeLessThanOrEqual(120)
    expect(getReducedMotionDuration(200, true)).toBeLessThanOrEqual(120)
  })

  it('preserves original duration when reduced motion disabled', () => {
    expect(getReducedMotionDuration(80, false)).toBe(80)
    expect(getReducedMotionDuration(500, false)).toBe(500)
    expect(getReducedMotionDuration(1000, false)).toBe(1000)
  })

  it('handles edge cases', () => {
    expect(getReducedMotionDuration(0, true)).toBe(0)
    expect(getReducedMotionDuration(120, true)).toBeLessThanOrEqual(120)
    expect(getReducedMotionDuration(119, true)).toBe(119)
  })
})

