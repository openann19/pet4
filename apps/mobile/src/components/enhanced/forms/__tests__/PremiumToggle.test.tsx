/**
 * PremiumToggle Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/forms/__tests__/PremiumToggle.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { PremiumToggle } from '../PremiumToggle'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
    const Reanimated = {
        default: {
            createAnimatedComponent: (component: unknown) => component,
        },
        useSharedValue: () => ({ value: 0 }),
        useAnimatedStyle: () => ({}),
        withSpring: vi.fn((value: number) => value),
    }
    return Reanimated
})

// Mock reduced motion
vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
    useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
    },
}))

describe('PremiumToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByTestId } = render(<PremiumToggle />)

        expect(getByTestId('premium-toggle')).toBeTruthy()
    })

    it('renders in checked state', () => {
        const { getByTestId } = render(<PremiumToggle checked={true} />)

        expect(getByTestId('premium-toggle')).toBeTruthy()
    })

    it('renders in unchecked state', () => {
        const { getByTestId } = render(<PremiumToggle checked={false} />)

        expect(getByTestId('premium-toggle')).toBeTruthy()
    })

    it('handles toggle', () => {
        const onChange = vi.fn()
        const { getByRole } = render(<PremiumToggle onChange={onChange} checked={false} />)

        const toggle = getByRole('switch')
        fireEvent.press(toggle)

        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('renders with label', () => {
        const { getByText } = render(<PremiumToggle label="Enable notifications" />)

        expect(getByText('Enable notifications')).toBeTruthy()
    })

    it('renders with description', () => {
        const { getByText } = render(
            <PremiumToggle label="Enable notifications" description="Receive push notifications" />
        )

        expect(getByText('Enable notifications')).toBeTruthy()
        expect(getByText('Receive push notifications')).toBeTruthy()
    })

    it('handles disabled state', () => {
        const onChange = vi.fn()
        const { getByRole } = render(
            <PremiumToggle onChange={onChange} checked={false} disabled={true} />
        )

        const toggle = getByRole('switch')
        fireEvent.press(toggle)

        expect(onChange).not.toHaveBeenCalled()
    })

    it('renders with different sizes', () => {
        const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

        sizes.forEach(size => {
            const { getByTestId } = render(<PremiumToggle size={size} />)
            expect(getByTestId('premium-toggle')).toBeTruthy()
        })
    })

    it('renders with different variants', () => {
        const variants: Array<'default' | 'primary' | 'accent'> = ['default', 'primary', 'accent']

        variants.forEach(variant => {
            const { getByTestId } = render(<PremiumToggle variant={variant} />)
            expect(getByTestId('premium-toggle')).toBeTruthy()
        })
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(<PremiumToggle style={customStyle} />)

        expect(getByTestId('premium-toggle')).toBeTruthy()
    })

    it('uses custom testID', () => {
        const { getByTestId } = render(<PremiumToggle testID="custom-toggle" />)

        expect(getByTestId('custom-toggle')).toBeTruthy()
    })
})
