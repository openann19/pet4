import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrollToNew } from './use-scroll-to-new'

describe('useScrollToNew', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useScrollToNew())

    expect(result.current.chipOpacity.value).toBe(0)
    expect(result.current.chipTranslateY.value).toBe(20)
  })

  it('should show chip when isVisible is true', () => {
    const { result } = renderHook(() => useScrollToNew({ isVisible: true }))

    expect(result.current.chipOpacity.value).toBeGreaterThan(0)
    expect(result.current.chipTranslateY.value).toBeLessThan(20)
  })

  it('should hide chip when isVisible is false', () => {
    const { result } = renderHook(() => useScrollToNew({ isVisible: false }))

    expect(result.current.chipOpacity.value).toBe(0)
    expect(result.current.chipTranslateY.value).toBe(20)
  })

  it('should show chip manually', () => {
    const { result } = renderHook(() => useScrollToNew())

    act(() => {
      result.current.show()
    })

    expect(result.current.chipOpacity.value).toBeGreaterThan(0)
    expect(result.current.chipTranslateY.value).toBeLessThan(20)
  })

  it('should hide chip manually', () => {
    const { result } = renderHook(() => useScrollToNew({ isVisible: true }))

    act(() => {
      result.current.hide()
    })

    expect(result.current.chipOpacity.value).toBe(0)
    expect(result.current.chipTranslateY.value).toBe(20)
  })

  it('should scroll to latest when called', () => {
    const containerRef = { current: document.createElement('div') }
    const targetRef = { current: document.createElement('div') }
    
    containerRef.current.scrollTop = 0
    containerRef.current.scrollTo = vi.fn()

    const { result } = renderHook(() =>
      useScrollToNew({ containerRef, targetRef, isVisible: true })
    )

    act(() => {
      result.current.scrollToLatest()
    })

    expect(result.current.chipOpacity.value).toBeLessThan(1)
  })

  it('should handle scroll without container ref', () => {
    const targetRef = { current: document.createElement('div') }
    targetRef.current.scrollIntoView = vi.fn()

    const { result } = renderHook(() =>
      useScrollToNew({ targetRef })
    )

    act(() => {
      result.current.scrollToLatest()
    })

    expect(targetRef.current.scrollIntoView).toHaveBeenCalled()
  })

  it('should provide animated style', () => {
    const { result } = renderHook(() => useScrollToNew())

    expect(result.current.chipStyle).toBeDefined()
  })

  it('should not scroll multiple times simultaneously', () => {
    const containerRef = { current: document.createElement('div') }
    const targetRef = { current: document.createElement('div') }
    
    containerRef.current.scrollTop = 0
    containerRef.current.scrollTo = vi.fn()

    const { result } = renderHook(() =>
      useScrollToNew({ containerRef, targetRef })
    )

    act(() => {
      result.current.scrollToLatest()
      result.current.scrollToLatest()
    })

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(containerRef.current.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('should animate chip on visibility change', () => {
    const { result, rerender } = renderHook(
      ({ isVisible }) => useScrollToNew({ isVisible }),
      { initialProps: { isVisible: false } }
    )

    expect(result.current.chipOpacity.value).toBe(0)

    rerender({ isVisible: true })

    expect(result.current.chipOpacity.value).toBeGreaterThan(0)
  })
})

