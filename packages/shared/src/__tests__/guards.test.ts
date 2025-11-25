import { describe, it, expect } from 'vitest'
import { isDefined, isNonEmptyString, isTruthy } from '../guards'

describe('isDefined guard', () => {
  it('should return true for defined values', () => {
    expect(isDefined(0)).toBe(true)
    expect(isDefined('')).toBe(true)
    expect(isDefined(false)).toBe(true)
    expect(isDefined([])).toBe(true)
    expect(isDefined({})).toBe(true)
    expect(isDefined('test')).toBe(true)
    expect(isDefined(42)).toBe(true)
  })

  it('should return false for null', () => {
    expect(isDefined(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isDefined(undefined)).toBe(false)
  })

  it('should type narrow correctly', () => {
    const value: string | null | undefined = 'test'
    if (isDefined(value)) {
      // TypeScript should know value is string here
      expect(value.toUpperCase()).toBe('TEST')
    }
  })
})

describe('isNonEmptyString guard', () => {
  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('test')).toBe(true)
    expect(isNonEmptyString('a')).toBe(true)
    expect(isNonEmptyString(' ')).toBe(true)
    expect(isNonEmptyString('0')).toBe(true)
    expect(isNonEmptyString('false')).toBe(true)
  })

  it('should return false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false)
  })

  it('should return false for non-string values', () => {
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(undefined)).toBe(false)
    expect(isNonEmptyString(0)).toBe(false)
    expect(isNonEmptyString(false)).toBe(false)
    expect(isNonEmptyString([])).toBe(false)
    expect(isNonEmptyString({})).toBe(false)
    expect(isNonEmptyString(String)).toBe(false)
  })

  it('should type narrow correctly', () => {
    const value: unknown = 'test'
    if (isNonEmptyString(value)) {
      // TypeScript should know value is string here
      expect(value.length).toBe(4)
    }
  })
})

describe('isTruthy guard', () => {
  it('should return true for truthy values', () => {
    expect(isTruthy(1)).toBe(true)
    expect(isTruthy(-1)).toBe(true)
    expect(isTruthy('test')).toBe(true)
    expect(isTruthy('0')).toBe(true)
    expect(isTruthy('false')).toBe(true)
    expect(isTruthy(true)).toBe(true)
    expect(isTruthy([])).toBe(true)
    expect(isTruthy({})).toBe(true)
    expect(isTruthy(() => {})).toBe(true)
    expect(isTruthy(new Date())).toBe(true)
  })

  it('should return false for falsy values', () => {
    expect(isTruthy(0)).toBe(false)
    expect(isTruthy('')).toBe(false)
    expect(isTruthy(false)).toBe(false)
    expect(isTruthy(null)).toBe(false)
    expect(isTruthy(undefined)).toBe(false)
    expect(isTruthy(NaN)).toBe(false)
  })

  it('should exclude falsy types from the returned type', () => {
    const value: number | string | null | undefined | false | 0 | '' = 'test'
    if (isTruthy(value)) {
      // TypeScript should know value excludes falsy types
      expect(typeof value).toBe('string' || 'number')
    }
  })
})
