/**
 * IconButton Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/buttons/__tests__/IconButton.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { IconButton } from '../IconButton'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import type { SharedValue } from 'react-native-reanimated'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
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

// Mock reduced motion
const mockSharedValue = (value: boolean): SharedValue<boolean> => {
    return {
        value,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        modify: vi.fn(),
    } as unknown as SharedValue<boolean>
}

vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
    useReducedMotionSV: vi.fn(() => mockSharedValue(false)),
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
    const Reanimated = {
        default: {
            createAnimatedComponent: (component: unknown) => component,
        },
        useSharedValue: () => ({ value: 0 }),
        useAnimatedStyle: () => ({}),
        withTiming: vi.fn((value: number) => value),
        withSequence: vi.fn((...args: unknown[]) => args),
    }
    return Reanimated
})

const mockHaptics = vi.mocked(Haptics)
const mockUsePressBounce = vi.mocked(usePressBounce)
const mockUseReducedMotionSV = vi.mocked(useReducedMotionSV)

describe('IconButton', () => {
    const mockIcon = <Text>Icon</Text>

    beforeEach(() => {
        vi.clearAllMocks()
        mockUsePressBounce.mockReturnValue({
            onPressIn: vi.fn(),
            onPressOut: vi.fn(),
            animatedStyle: {},
        })
        mockUseReducedMotionSV.mockReturnValue(mockSharedValue(false))
    })

    it('renders correctly', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('handles press events', () => {
        const onPress = vi.fn()
        const { getByLabelText } = render(
            <IconButton
                icon={mockIcon}
                accessibilityLabel="Test Button"
                onPress={onPress}
                enableRipple={true}
            />
        )

        fireEvent.press(getByLabelText('Test Button'))

        expect(onPress).toHaveBeenCalled()
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
    })

    it('does not call onPress when disabled', () => {
        const onPress = vi.fn()
        const { getByLabelText } = render(
            <IconButton
                icon={mockIcon}
                accessibilityLabel="Test Button"
                onPress={onPress}
                disabled={true}
            />
        )

        fireEvent.press(getByLabelText('Test Button'))

        expect(onPress).not.toHaveBeenCalled()
    })

    it('renders with small size', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" size="sm" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with medium size', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" size="md" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with large size', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" size="lg" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with primary variant', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" variant="primary" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with ghost variant', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" variant="ghost" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with outline variant', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" variant="outline" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('renders with glass variant', () => {
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" variant="glass" />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('does not trigger haptic when ripple is disabled', () => {
        const onPress = vi.fn()
        const { getByLabelText } = render(
            <IconButton
                icon={mockIcon}
                accessibilityLabel="Test Button"
                onPress={onPress}
                enableRipple={false}
            />
        )

        fireEvent.press(getByLabelText('Test Button'))

        expect(onPress).toHaveBeenCalled()
        expect(mockHaptics.impactAsync).not.toHaveBeenCalled()
    })

    it('handles reduced motion', () => {
        mockUseReducedMotionSV.mockReturnValue(mockSharedValue(true))

        const onPress = vi.fn()
        const { getByLabelText } = render(
            <IconButton
                icon={mockIcon}
                accessibilityLabel="Test Button"
                onPress={onPress}
                enableRipple={true}
            />
        )

        fireEvent.press(getByLabelText('Test Button'))

        expect(onPress).toHaveBeenCalled()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByLabelText } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" style={customStyle} />
        )

        expect(getByLabelText('Test Button')).toBeTruthy()
    })

    it('uses custom testID', () => {
        const { getByTestId } = render(
            <IconButton icon={mockIcon} accessibilityLabel="Test Button" testID="custom-test-id" />
        )

        expect(getByTestId('custom-test-id')).toBeTruthy()
    })
})
