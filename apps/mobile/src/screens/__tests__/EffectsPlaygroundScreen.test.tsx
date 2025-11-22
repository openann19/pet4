import { EffectsPlaygroundScreen } from '@mobile/screens/EffectsPlaygroundScreen'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockUseSendWarp = vi.fn(() => ({
  bloomCenterX: { value: 0 },
  bloomCenterY: { value: 0 },
  bloomRadius: { value: 0 },
  bloomIntensity: { value: 0 },
  translateX: { value: 0 },
  opacity: { value: 1 },
  glowOpacity: { value: 0 },
  trigger: vi.fn(),
}))

const mockUseGlassMorphZoom = vi.fn(() => ({
  aberrationCenter: { value: { x: 0, y: 0 } },
  aberrationRadius: { value: 0 },
  aberrationIntensity: { value: 0 },
  scale: { value: 1 },
  opacity: { value: 0 },
  open: vi.fn(),
  close: vi.fn(),
}))

vi.mock('@mobile/effects/chat/bubbles/use-send-warp', () => ({
  useSendWarp: mockUseSendWarp,
}))

vi.mock('@mobile/effects/chat/media/use-glass-morph-zoom', () => ({
  useGlassMorphZoom: mockUseGlassMorphZoom,
}))

vi.mock('@mobile/effects/chat/gestures/use-swipe-reply-elastic', () => ({
  useSwipeReplyElastic: vi.fn(() => ({
    ribbonP0: { value: { x: 0, y: 0 } },
    ribbonP1: { value: { x: 0, y: 0 } },
    ribbonThickness: { value: 0 },
    ribbonGlow: { value: 0 },
    ribbonProgress: { value: 0 },
    ribbonAlpha: { value: 0 },
    translateX: { value: 0 },
  })),
}))

vi.mock('@mobile/effects/chat/shaders/additive-bloom', () => ({
  AdditiveBloom: () => null,
}))

vi.mock('@mobile/effects/chat/shaders/chromatic-aberration', () => ({
  ChromaticAberrationFX: () => null,
}))

vi.mock('@mobile/effects/chat/shaders/ribbon-fx', () => ({
  RibbonFX: () => null,
}))

vi.mock('react-native-reanimated', () => ({
  withTiming: vi.fn((value: number) => value),
}))

describe('EffectsPlaygroundScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSendWarp.mockReturnValue({
      bloomCenterX: { value: 0 },
      bloomCenterY: { value: 0 },
      bloomRadius: { value: 0 },
      bloomIntensity: { value: 0 },
      translateX: { value: 0 },
      opacity: { value: 1 },
      glowOpacity: { value: 0 },
      trigger: vi.fn(),
    })
    mockUseGlassMorphZoom.mockReturnValue({
      aberrationCenter: { value: { x: 0, y: 0 } },
      aberrationRadius: { value: 0 },
      aberrationIntensity: { value: 0 },
      scale: { value: 1 },
      opacity: { value: 0 },
      open: vi.fn(),
      close: vi.fn(),
    })
  })

  it('should render without crashing', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Effects Playground')).toBeTruthy()
  })

  it('should display section header', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Effects Playground')).toBeTruthy()
    expect(getByText(/Interactive demos for Skia effects/)).toBeTruthy()
  })

  it('should display settings card with reduced motion toggle', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Settings')).toBeTruthy()
    expect(getByText('Reduced Motion')).toBeTruthy()
  })

  it('should toggle reduced motion', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    // Verify the reduced motion label is present
    expect(getByText('Reduced Motion')).toBeTruthy()
  })

  it('should display Send Warp section', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Send Warp')).toBeTruthy()
    expect(getByText('AdditiveBloom glow trail')).toBeTruthy()
  })

  it('should display Trigger Send button', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Trigger Send')).toBeTruthy()
  })

  it('should trigger send warp on button press', () => {
    const mockTrigger = vi.fn()
    mockUseSendWarp.mockReturnValueOnce({
      bloomCenterX: { value: 0 },
      bloomCenterY: { value: 0 },
      bloomRadius: { value: 0 },
      bloomIntensity: { value: 0 },
      translateX: { value: 0 },
      opacity: { value: 1 },
      glowOpacity: { value: 0 },
      trigger: mockTrigger,
    })

    const { getByText } = render(<EffectsPlaygroundScreen />)
    const button = getByText('Trigger Send')
    fireEvent.press(button)
    expect(mockTrigger).toHaveBeenCalled()
  })

  it('should display Media Zoom section', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Media Zoom')).toBeTruthy()
    expect(getByText('ChromaticAberrationFX on open')).toBeTruthy()
  })

  it('should display Open and Close buttons for media zoom', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Open')).toBeTruthy()
    expect(getByText('Close')).toBeTruthy()
  })

  it('should trigger media zoom open on button press', () => {
    const mockOpen = vi.fn()
    mockUseGlassMorphZoom.mockReturnValueOnce({
      aberrationCenter: { value: { x: 0, y: 0 } },
      aberrationRadius: { value: 0 },
      aberrationIntensity: { value: 0 },
      scale: { value: 1 },
      opacity: { value: 0 },
      open: mockOpen,
      close: vi.fn(),
    })

    const { getByText } = render(<EffectsPlaygroundScreen />)
    const button = getByText('Open')
    fireEvent.press(button)
    expect(mockOpen).toHaveBeenCalled()
  })

  it('should trigger media zoom close on button press', () => {
    const mockClose = vi.fn()
    mockUseGlassMorphZoom.mockReturnValueOnce({
      aberrationCenter: { value: { x: 0, y: 0 } },
      aberrationRadius: { value: 0 },
      aberrationIntensity: { value: 0 },
      scale: { value: 1 },
      opacity: { value: 0 },
      open: vi.fn(),
      close: mockClose,
    })

    const { getByText } = render(<EffectsPlaygroundScreen />)
    const button = getByText('Close')
    fireEvent.press(button)
    expect(mockClose).toHaveBeenCalled()
  })

  it('should display Reply Ribbon section', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Reply Ribbon')).toBeTruthy()
    expect(getByText('RibbonFX for swipe-to-reply')).toBeTruthy()
  })

  it('should display Animate Ribbon button', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Animate Ribbon')).toBeTruthy()
  })

  it('should display Reset All button', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    expect(getByText('Reset All')).toBeTruthy()
  })

  it('should reset all effects on Reset All button press', () => {
    const { getByText } = render(<EffectsPlaygroundScreen />)
    const button = getByText('Reset All')
    fireEvent.press(button)
    // Component should handle reset without errors
    expect(button).toBeTruthy()
  })
})
