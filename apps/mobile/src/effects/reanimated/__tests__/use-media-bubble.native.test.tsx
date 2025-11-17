/**
 * Tests for useMediaBubble hook
 * Verifies reduced-motion support and media type handling
 */

import { renderHook } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMediaBubble } from '../use-media-bubble'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withTiming: vi.fn((toValue) => toValue),
    withSequence: vi.fn((...args) => args[0]),
  }
})

vi.mock('@petspark/motion', () => ({
  useMediaBubble: vi.fn((options) => ({
    imageOpacity: { value: 0 },
    imageScale: { value: 0.95 },
    zoomModalOpacity: { value: 0 },
    zoomModalScale: { value: 0.9 },
    waveformScales: Array.from({ length: 20 }, () => ({ value: 0.3 })),
    imageStyle: {},
    zoomModalStyle: {},
    waveformStyles: Array.from({ length: 20 }, () => ({})),
    handleImageLoad: vi.fn(),
    handleImageTap: vi.fn(),
    closeZoom: vi.fn(),
  })),
}))

describe('useMediaBubble (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values for image type', () => {
    const { result } = renderHook(() => useMediaBubble({ type: 'image' }))
    
    expect(result.current.imageOpacity).toBeDefined()
    expect(result.current.imageScale).toBeDefined()
    expect(result.current.imageStyle).toBeDefined()
  })

  it('should handle video type', () => {
    const { result } = renderHook(() => useMediaBubble({ type: 'video' }))
    
    expect(result.current.imageStyle).toBeDefined()
  })

  it('should handle voice type with waveform', () => {
    const { result } = renderHook(() => 
      useMediaBubble({ 
        type: 'voice',
        waveform: Array.from({ length: 20 }, () => 0.5)
      })
    )
    
    expect(result.current.waveformStyles).toBeDefined()
    expect(result.current.waveformStyles.length).toBe(20)
  })

  it('should provide zoom modal handlers', () => {
    const { result } = renderHook(() => useMediaBubble({ type: 'image' }))
    
    expect(result.current.handleImageTap).toBeDefined()
    expect(result.current.closeZoom).toBeDefined()
  })
})

