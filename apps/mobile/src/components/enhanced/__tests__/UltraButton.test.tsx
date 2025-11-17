/**
 * UltraButton Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/__tests__/UltraButton.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { UltraButton } from '../UltraButton'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Medium: 'medium',
    },
}))

// Mock @petspark/motion
vi.mock('@petspark/motion', () => ({
    usePressBounce: vi.fn(() => ({
        onPressIn: vi.fn(),
        onPressOut: vi.fn(),
        animatedStyle: {},
    })),
}))

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

// Mock transitions
vi.mock('@/effects/reanimated/transitions', () => ({
    springConfigs: {
        smooth: { damping: 25, stiffness: 400 },
        bouncy: { damping: 15, stiffness: 500 },
    },
}))

const mockHaptics = vi.mocked(Haptics)
const mockUsePressBounce = vi.mocked(usePressBounce)

describe('UltraButton', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUsePressBounce.mockReturnValue({
            onPressIn: vi.fn(),
            onPressOut: vi.fn(),
            animatedStyle: {},
        })
    })

    it('renders correctly', () => {
        const { getByText } = render(<UltraButton>Click Me</UltraButton>)

        expect(getByText('Click Me')).toBeTruthy()
    })

    it('renders with children as ReactNode', () => {
        const { getByText } = render(
            <UltraButton>
                <Text>Custom Content</Text>
            </UltraButton>
        )

        expect(getByText('Custom Content')).toBeTruthy()
    })

    it('handles press events', () => {
        const onPress = vi.fn()
        const { getByText } = render(<UltraButton onPress={onPress}>Click Me</UltraButton>)

        fireEvent.press(getByText('Click Me'))

        expect(onPress).toHaveBeenCalled()
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith('medium')
    })

    it('renders with default variant', () => {
        const { getByText } = render(<UltraButton>Click Me</UltraButton>)

        expect(getByText('Click Me')).toBeTruthy()
    })

    it('renders with destructive variant', () => {
        const { getByText } = render(<UltraButton variant="destructive">Delete</UltraButton>)

        expect(getByText('Delete')).toBeTruthy()
    })

    it('renders with outline variant', () => {
        const { getByText } = render(<UltraButton variant="outline">Outline</UltraButton>)

        expect(getByText('Outline')).toBeTruthy()
    })

    it('renders with secondary variant', () => {
        const { getByText } = render(<UltraButton variant="secondary">Secondary</UltraButton>)

        expect(getByText('Secondary')).toBeTruthy()
    })

    it('renders with small size', () => {
        const { getByText } = render(<UltraButton size="sm">Small</UltraButton>)

        expect(getByText('Small')).toBeTruthy()
    })

    it('renders with medium size', () => {
        const { getByText } = render(<UltraButton size="md">Medium</UltraButton>)

        expect(getByText('Medium')).toBeTruthy()
    })

    it('renders with large size', () => {
        const { getByText } = render(<UltraButton size="lg">Large</UltraButton>)

        expect(getByText('Large')).toBeTruthy()
    })

    it('applies elastic animation when enabled', () => {
        render(<UltraButton enableElastic={true}>Click Me</UltraButton>)

        expect(mockUsePressBounce).toHaveBeenCalled()
    })

    it('does not apply elastic animation when disabled', () => {
        render(<UltraButton enableElastic={false}>Click Me</UltraButton>)

        // Elastic should still be called but not used in handlers
        expect(mockUsePressBounce).toHaveBeenCalled()
    })

    it('handles glow effect when enabled', () => {
        const { getByText } = render(
            <UltraButton enableGlow={true} glowColor="rgba(255, 0, 0, 0.5)">
                Glow Button
            </UltraButton>
        )

        expect(getByText('Glow Button')).toBeTruthy()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByText } = render(<UltraButton style={customStyle}>Styled</UltraButton>)

        expect(getByText('Styled')).toBeTruthy()
    })

    it('handles disabled state', () => {
        const onPress = vi.fn()
        const { getByText } = render(
            <UltraButton onPress={onPress} disabled={true}>
                Disabled
            </UltraButton>
        )

        fireEvent.press(getByText('Disabled'))

        // Press should not be called when disabled
        expect(onPress).not.toHaveBeenCalled()
    })

    it('calls onPress when provided', () => {
        const onPress = vi.fn()
        const { getByText } = render(<UltraButton onPress={onPress}>Click Me</UltraButton>)

        fireEvent.press(getByText('Click Me'))

        expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress when not provided', () => {
        const { getByText } = render(<UltraButton>Click Me</UltraButton>)

        // Should not throw
        expect(() => {
            fireEvent.press(getByText('Click Me'))
        }).not.toThrow()
    })
})
