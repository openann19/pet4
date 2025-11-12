import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useBubbleTheme } from '../use-bubble-theme'

describe('useBubbleTheme', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleTheme())

    expect(result.current.gradientIntensity).toBeDefined()
    expect(result.current.shadowIntensity).toBeDefined()
    expect(result.current.colorIntensity).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.themeColors).toBeDefined()
    expect(result.current.updateTheme).toBeDefined()
  })

  it('should accept custom options', () => {
    const { result } = renderHook(() =>
      useBubbleTheme({
        senderType: 'bot',
        messageType: 'ai-answer',
        theme: 'dark',
      })
    )

    expect(result.current.themeColors).toEqual({
      primary: 'rgba(96, 165, 250, 1)',
      secondary: 'rgba(167, 139, 250, 1)',
      shadow: 'rgba(0, 0, 0, 0.3)',
    })
  })

  it('should support different themes', () => {
    const themes = ['light', 'dark', 'glass', 'cyberpunk'] as const

    themes.forEach(theme => {
      const { result } = renderHook(() => useBubbleTheme({ theme }))
      expect(result.current.themeColors).toBeDefined()
      expect(result.current.themeColors.primary).toBeDefined()
      expect(result.current.themeColors.secondary).toBeDefined()
      expect(result.current.themeColors.shadow).toBeDefined()
    })
  })

  it('should support different sender types', () => {
    const senderTypes = ['user', 'bot', 'system'] as const

    senderTypes.forEach(senderType => {
      const { result } = renderHook(() => useBubbleTheme({ senderType }))
      expect(result.current.gradientIntensity).toBeDefined()
      expect(result.current.shadowIntensity).toBeDefined()
      expect(result.current.colorIntensity).toBeDefined()
    })
  })

  it('should support different message types', () => {
    const messageTypes = ['ai-answer', 'error', 'system-alert', 'default'] as const

    messageTypes.forEach(messageType => {
      const { result } = renderHook(() => useBubbleTheme({ messageType }))
      expect(result.current.gradientIntensity).toBeDefined()
      expect(result.current.shadowIntensity).toBeDefined()
      expect(result.current.colorIntensity).toBeDefined()
    })
  })

  it('should update theme when updateTheme is called', async () => {
    const { result } = renderHook(() => useBubbleTheme({ theme: 'light' }))

    expect(result.current.themeColors.primary).toBe('rgba(59, 130, 246, 1)')

    result.current.updateTheme('dark')

    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(result.current.themeColors.primary).toBe('rgba(96, 165, 250, 1)')
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useBubbleTheme())

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should calculate intensity based on sender and message type', () => {
    const { result: userResult } = renderHook(() =>
      useBubbleTheme({ senderType: 'user', messageType: 'default' })
    )
    const { result: botResult } = renderHook(() =>
      useBubbleTheme({ senderType: 'bot', messageType: 'default' })
    )

    // User should have higher intensity than bot
    vi.advanceTimersByTime(100)

    expect(userResult.current.colorIntensity.value).toBeGreaterThan(
      botResult.current.colorIntensity.value
    )
  })
})
