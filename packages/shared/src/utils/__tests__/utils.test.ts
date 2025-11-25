import { describe, it, expect } from 'vitest'
import { cn, generateULID } from '../utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conflicting tailwind classes by keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'active', false && 'inactive')).toBe('base-class active')
  })

  it('should handle arrays and objects', () => {
    expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null values', () => {
    expect(cn('valid-class', undefined, null, 'another-class')).toBe('valid-class another-class')
  })

  it('should handle complex tailwind conflicts', () => {
    expect(cn('bg-red-500', 'bg-blue-500', 'text-sm', 'text-lg')).toBe('bg-blue-500 text-lg')
  })
})

describe('generateULID function', () => {
  it('should generate a string starting with "ulid-"', () => {
    const ulid = generateULID()
    expect(ulid).toMatch(/^ulid-/)
  })

  it('should generate unique values', () => {
    const ulid1 = generateULID()
    const ulid2 = generateULID()
    expect(ulid1).not.toBe(ulid2)
  })

  it('should contain timestamp and random components', () => {
    const ulid = generateULID()
    const parts = ulid.split('-')
    expect(parts.length).toBeGreaterThanOrEqual(2)
    expect(parts[0]).toBe('ulid')
    expect(parts[1]).toMatch(/^[a-z0-9]+$/)
  })

  it('should generate values of reasonable length', () => {
    const ulid = generateULID()
    expect(ulid.length).toBeGreaterThan(10)
    expect(ulid.length).toBeLessThan(50)
  })

  it('should generate valid base36 characters', () => {
    const ulid = generateULID()
    const randomPart = ulid.split('-')[1]
    expect(randomPart).toMatch(/^[0-9a-z]+$/)
  })
})
