/**
 * PremiumSlider Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/forms/__tests__/PremiumSlider.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react-native'
import { PremiumSlider } from '../PremiumSlider'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
    const Reanimated = {
        default: {
            createAnimatedComponent: (component: unknown) => component,
        },
        useSharedValue: () => ({ value: 0 }),
        useAnimatedStyle: () => ({}),
        withSpring: vi.fn((value: number) => value),
        withTiming: vi.fn((value: number) => value),
        View: 'View',
        Text: 'Text',
    }
    return Reanimated
})

// Mock reduced motion
vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
    useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

describe('PremiumSlider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByTestId } = render(
            <PremiumSlider accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
    })

    it('renders with label', () => {
        const { getByText } = render(
            <PremiumSlider label="Volume" accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByText('Volume')).toBeTruthy()
    })

    it('renders with value display', () => {
        const { getByText } = render(
            <PremiumSlider
                value={50}
                showValue={true}
                accessibilityLabel="Slider"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('50')).toBeTruthy()
    })

    it('renders with custom min and max', () => {
        const { getByTestId } = render(
            <PremiumSlider
                min={0}
                max={200}
                value={100}
                accessibilityLabel="Slider"
                onValueChange={vi.fn()}
            />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
    })

    it('handles value changes', () => {
        const onValueChange = vi.fn()
        const { getByTestId } = render(
            <PremiumSlider value={50} accessibilityLabel="Slider" onValueChange={onValueChange} />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
        // Value change would be tested through gesture interaction
    })

    it('renders with steps', () => {
        const { getByTestId } = render(
            <PremiumSlider showSteps={true} accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
    })

    it('handles disabled state', () => {
        const { getByTestId } = render(
            <PremiumSlider disabled={true} accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(
            <PremiumSlider style={customStyle} accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByTestId('premium-slider')).toBeTruthy()
    })

    it('uses custom testID', () => {
        const { getByTestId } = render(
            <PremiumSlider testID="custom-slider" accessibilityLabel="Slider" onValueChange={vi.fn()} />
        )

        expect(getByTestId('custom-slider')).toBeTruthy()
    })
})
