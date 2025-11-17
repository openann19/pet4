import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useReceiptTransition } from '../use-receipt-transition'

describe('useReceiptTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'sent',
      })
    )

    expect(result.current.opacity).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.colorIntensity).toBeDefined()
    expect(result.current.iconRotation).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.animateStatusChange).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'delivered',
        previousStatus: 'sent',
        pulseDuration: 800,
      })
    )

    expect(result.current.opacity).toBeDefined()
    expect(result.current.scale).toBeDefined()
  })

  it('should animate status change', async () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'delivered',
        previousStatus: 'sent',
      })
    )

    act(() => {
      result.current.animateStatusChange('delivered')
    })

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.scale.value).not.toBe(1)
    })
  })

  it('should handle sent status', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'sent',
      })
    )

    expect(result.current.colorIntensity.value).toBe(0)
  })

  it('should handle delivered status', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'delivered',
      })
    )

    expect(result.current.colorIntensity.value).toBe(1)
  })

  it('should handle read status', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'read',
      })
    )

    expect(result.current.colorIntensity.value).toBe(1)
  })

  it('should animate transition from delivered to read', async () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'read',
        previousStatus: 'delivered',
      })
    )

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.animatedStyle).toBeDefined()
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() =>
      useReceiptTransition({
        status: 'sent',
      })
    )

    expect(result.current.animatedStyle).toBeDefined()
  })
})
