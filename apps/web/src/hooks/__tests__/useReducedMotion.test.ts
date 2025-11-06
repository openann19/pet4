import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia
  let mockMatchMedia: (query: string) => MediaQueryList

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    mockMatchMedia = vi.fn()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns false when reduced motion is not preferred', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)
  })

  it('returns true when reduced motion is preferred', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | undefined
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        changeHandler = handler
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current).toBe(true)
  })

  it('uses addEventListener when available', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    renderHook(() => useReducedMotion())

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('uses addListener as fallback for older browsers', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    renderHook(() => useReducedMotion())

    expect(mockMediaQuery.addListener).toHaveBeenCalledWith(expect.any(Function))
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.fn()
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { unmount } = renderHook(() => useReducedMotion())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
  })

  it('cleans up listener on unmount for older browsers', () => {
    const removeListenerSpy = vi.fn()
    const mockMediaQuery = {
      matches: false,
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener: vi.fn(),
      removeListener: removeListenerSpy,
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { unmount } = renderHook(() => useReducedMotion())

    unmount()

    expect(removeListenerSpy).toHaveBeenCalled()
  })

  it('handles window being undefined', () => {
    const originalWindow = global.window
    Object.defineProperty(global, 'window', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    Object.defineProperty(global, 'window', {
      writable: true,
      value: originalWindow,
    })
  })

  it('handles rapid preference changes', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    mockMatchMedia = vi.fn(() => mockMediaQuery)
    window.matchMedia = mockMatchMedia as typeof window.matchMedia

    const { result, rerender } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    rerender()

    expect(result.current).toBe(false)
  })
})

