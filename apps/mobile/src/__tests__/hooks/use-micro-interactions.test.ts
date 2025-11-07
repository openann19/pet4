import { useMicroInteractions } from '@mobile/hooks/use-micro-interactions'
import { act, renderHook } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  selectionAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

describe('useMicroInteractions', () => {
  it('should return animation values and handlers', () => {
    const { result } = renderHook(() => useMicroInteractions())

    expect(result.current.scale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handlePress).toBeDefined()
    expect(result.current.handlePressIn).toBeDefined()
    expect(result.current.handlePressOut).toBeDefined()
  })

  it('should handle press with haptic feedback', () => {
    const { result } = renderHook(() =>
      useMicroInteractions({ hapticFeedback: true })
    )

    act(() => {
      result.current.handlePress()
    })

    expect(result.current.scale.value).toBeDefined()
  })

  it('should handle press in and out', () => {
    const { result } = renderHook(() => useMicroInteractions())

    act(() => {
      result.current.handlePressIn()
    })

    expect(result.current.scale.value).toBeLessThan(1)

    act(() => {
      result.current.handlePressOut()
    })

    expect(result.current.scale.value).toBe(1)
  })
})

