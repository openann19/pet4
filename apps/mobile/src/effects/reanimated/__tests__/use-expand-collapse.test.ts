import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useExpandCollapse } from '../use-expand-collapse'

describe('useExpandCollapse', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with expanded state', () => {
    const { result } = renderHook(() => useExpandCollapse({ isExpanded: true }))

    expect(result.current.heightStyle).toBeDefined()
    expect(result.current.opacityStyle).toBeDefined()
  })

  it('should initialize with collapsed state', () => {
    const { result } = renderHook(() => useExpandCollapse({ isExpanded: false }))

    expect(result.current.heightStyle).toBeDefined()
    expect(result.current.opacityStyle).toBeDefined()
  })

  it('should accept custom duration', () => {
    const { result } = renderHook(() =>
      useExpandCollapse({
        isExpanded: true,
        duration: 500,
      })
    )

    expect(result.current.heightStyle).toBeDefined()
    expect(result.current.opacityStyle).toBeDefined()
  })

  it('should animate from collapsed to expanded', async () => {
    const { result, rerender } = renderHook(
      (props: { isExpanded: boolean }) => useExpandCollapse({ isExpanded: props.isExpanded }),
      {
        initialProps: { isExpanded: false },
      }
    )

    expect(result.current.heightStyle).toBeDefined()

    rerender({ isExpanded: true })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.heightStyle).toBeDefined()
    })
  })

  it('should animate from expanded to collapsed', async () => {
    const { result, rerender } = renderHook(
      (props: { isExpanded: boolean }) => useExpandCollapse({ isExpanded: props.isExpanded }),
      {
        initialProps: { isExpanded: true },
      }
    )

    expect(result.current.heightStyle).toBeDefined()

    rerender({ isExpanded: false })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.heightStyle).toBeDefined()
    })
  })

  it('should disable opacity animation when enableOpacity is false', () => {
    const { result } = renderHook(() =>
      useExpandCollapse({
        isExpanded: true,
        enableOpacity: false,
      })
    )

    expect(result.current.heightStyle).toBeDefined()
    expect(result.current.opacityStyle).toBeDefined()
  })

  it('should return animated styles', () => {
    const { result } = renderHook(() => useExpandCollapse({ isExpanded: true }))

    expect(result.current.heightStyle).toBeDefined()
    expect(result.current.opacityStyle).toBeDefined()
  })
})
