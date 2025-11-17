import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { parseISODateStrict, calcAgeUTC, isOfMinimumAge, DOBValidationError } from './age'

describe('age utils', () => {
  const fixedNow = new Date(Date.UTC(2025, 10, 16)) // 2025-11-16 UTC

  beforeAll(() => vi.useFakeTimers())
  afterAll(() => vi.useRealTimers())

  it('parses valid ISO dates', () => {
    const d = parseISODateStrict('2012-02-29') // leap day OK
    expect(d.toISOString()).toBe('2012-02-29T00:00:00.000Z')
  })

  it('rejects invalid dates', () => {
    expect(() => parseISODateStrict('2010-02-29')).toThrow(DOBValidationError)
    expect(() => parseISODateStrict('2012-2-9')).toThrow(DOBValidationError)
    expect(() => parseISODateStrict('12/09/2012')).toThrow(DOBValidationError)
  })

  it('calculates age UTC correctly across boundaries', () => {
    const dob = parseISODateStrict('2012-11-16')
    expect(calcAgeUTC(dob, fixedNow)).toBe(13)
    const dob2 = parseISODateStrict('2012-11-17')
    expect(calcAgeUTC(dob2, fixedNow)).toBe(12)
  })

  it('validates minimum age', () => {
    vi.setSystemTime(fixedNow)
    expect(isOfMinimumAge('2012-11-16', 13, fixedNow)).toBe(true)
    expect(isOfMinimumAge('2012-11-17', 13, fixedNow)).toBe(false)
  })
})
