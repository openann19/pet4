/**
 * Spinner Component Tests (Mobile)
 * Location: apps/mobile/src/components/ui/__tests__/Spinner.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react-native'
import { Spinner } from '../Spinner'
import { AccessibilityInfo } from 'react-native'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', async () => {
  const actual = await vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => fn()),
    withRepeat: vi.fn((anim: number, _count: number, _reverse: boolean) => anim),
    withTiming: vi.fn((value: number, _config: unknown) => value),
    Easing: {
      linear: vi.fn(),
      inOut: vi.fn((easing: (value: number) => number) => easing),
      ease: vi.fn(),
    },
  }
})

// Mock AccessibilityInfo
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    AccessibilityInfo: {
      isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
    },
  }
})

describe('Spinner (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with default props', () => {
    const { getByTestId } = render(<Spinner />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with custom testID', () => {
    const { getByTestId } = render(<Spinner testID="custom-spinner" />)

    const spinner = getByTestId('custom-spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with small size', () => {
    const { getByTestId } = render(<Spinner size="sm" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with medium size (default)', () => {
    const { getByTestId } = render(<Spinner size="md" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with large size', () => {
    const { getByTestId } = render(<Spinner size="lg" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with default variant', () => {
    const { getByTestId } = render(<Spinner variant="default" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with subtle variant', () => {
    const { getByTestId } = render(<Spinner variant="subtle" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should render with premium variant', () => {
    const { getByTestId } = render(<Spinner variant="premium" />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })

  it('should have accessibility props', () => {
    const { getByTestId } = render(<Spinner />)

    const spinner = getByTestId('spinner')
    expect(spinner.props.accessible).toBe(true)
    expect(spinner.props.accessibilityRole).toBe('progressbar')
    expect(spinner.props.accessibilityLabel).toBe('Loading')
    expect(spinner.props.accessibilityLiveRegion).toBe('polite')
  })

  it('should check for reduced motion preference', async () => {
    vi.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)

    render(<Spinner />)

    // Wait for the async check
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled()
  })

  it('should handle all size and variant combinations', () => {
    const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg']
    const variants: ('default' | 'subtle' | 'premium')[] = ['default', 'subtle', 'premium']

    sizes.forEach(size => {
      variants.forEach(variant => {
        const { getByTestId, unmount } = render(<Spinner size={size} variant={variant} />)
        const spinner = getByTestId('spinner')
        expect(spinner).toBeTruthy()
        unmount()
      })
    })
  })

  it('should apply custom style', () => {
    const customStyle = { marginTop: 10 }
    const { getByTestId } = render(<Spinner style={customStyle} />)

    const spinner = getByTestId('spinner')
    expect(spinner).toBeTruthy()
  })
})
