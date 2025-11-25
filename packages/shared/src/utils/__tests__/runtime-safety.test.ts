import { describe, it, expect } from 'vitest'
import { safeArrayAccess } from '../runtime-safety'

describe('safeArrayAccess', () => {
  it('should return the element at valid index', () => {
    const arr = ['a', 'b', 'c']
    expect(safeArrayAccess(arr, 0)).toBe('a')
    expect(safeArrayAccess(arr, 1)).toBe('b')
    expect(safeArrayAccess(arr, 2)).toBe('c')
  })

  it('should return undefined for null array', () => {
    expect(safeArrayAccess(null, 0)).toBeUndefined()
  })

  it('should return undefined for undefined array', () => {
    expect(safeArrayAccess(undefined, 0)).toBeUndefined()
  })

  it('should return undefined for negative index', () => {
    const arr = ['a', 'b', 'c']
    expect(safeArrayAccess(arr, -1)).toBeUndefined()
    expect(safeArrayAccess(arr, -5)).toBeUndefined()
  })

  it('should return undefined for index out of bounds', () => {
    const arr = ['a', 'b', 'c']
    expect(safeArrayAccess(arr, 3)).toBeUndefined()
    expect(safeArrayAccess(arr, 10)).toBeUndefined()
  })

  it('should return undefined for empty array', () => {
    const arr: string[] = []
    expect(safeArrayAccess(arr, 0)).toBeUndefined()
  })

  it('should handle arrays with different types', () => {
    const numbers = [1, 2, 3]
    expect(safeArrayAccess(numbers, 1)).toBe(2)

    const objects = [{ id: 1 }, { id: 2 }]
    expect(safeArrayAccess(objects, 0)).toEqual({ id: 1 })

    const mixed = ['string', 42, true, null]
    expect(safeArrayAccess(mixed, 2)).toBe(true)
  })

  it('should handle arrays with null/undefined elements', () => {
    const arr = ['a', null, undefined, 'd']
    expect(safeArrayAccess(arr, 1)).toBeNull()
    expect(safeArrayAccess(arr, 2)).toBeUndefined()
  })

  it('should work with large arrays', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i)
    expect(safeArrayAccess(largeArray, 999)).toBe(999)
    expect(safeArrayAccess(largeArray, 1000)).toBeUndefined()
  })

  it('should handle floating point indices by treating them as invalid', () => {
    const arr = ['a', 'b', 'c']
    expect(safeArrayAccess(arr, 1.5)).toBeUndefined()
    expect(safeArrayAccess(arr, 0.9)).toBeUndefined()
  })
})
