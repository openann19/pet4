/**
 * PremiumErrorState Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/states/__tests__/PremiumErrorState.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { PremiumErrorState } from '../PremiumErrorState'
import * as Haptics from 'expo-haptics'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Medium: 'medium',
    },
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

// Mock reduced motion
vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
    useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

// Mock react-native-vector-icons
vi.mock('react-native-vector-icons/Feather', () => ({
    default: 'FeatherIcon',
}))

// Mock PremiumButton
vi.mock('../../PremiumButton', () => ({
    PremiumButton: ({
        children,
        onPress,
    }: {
        children: React.ReactNode
        onPress: () => void
        icon?: React.ReactNode
    }) => <button onClick={onPress}>{children}</button>,
}))

const mockHaptics = vi.mocked(Haptics)

describe('PremiumErrorState', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByText } = render(<PremiumErrorState />)

        expect(getByText('Something went wrong')).toBeTruthy()
    })

    it('renders with custom title', () => {
        const { getByText } = render(<PremiumErrorState title="Custom Error" />)

        expect(getByText('Custom Error')).toBeTruthy()
    })

    it('renders with message', () => {
        const { getByText } = render(<PremiumErrorState message="An error occurred" />)

        expect(getByText('An error occurred')).toBeTruthy()
    })

    it('renders with error object', () => {
        const error = new Error('Test error')
        const { getByText } = render(<PremiumErrorState error={error} />)

        expect(getByText('Test error')).toBeTruthy()
    })

    it('renders with error string', () => {
        const { getByText } = render(<PremiumErrorState error="Error string" />)

        expect(getByText('Error string')).toBeTruthy()
    })

    it('renders with retry button', () => {
        const onRetry = vi.fn()
        const { getByText } = render(<PremiumErrorState onRetry={onRetry} />)

        expect(getByText('Try Again')).toBeTruthy()
    })

    it('handles retry button press', () => {
        const onRetry = vi.fn()
        const { getByText } = render(<PremiumErrorState onRetry={onRetry} />)

        fireEvent.press(getByText('Try Again'))

        expect(onRetry).toHaveBeenCalled()
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith('medium')
    })

    it('renders with custom retry label', () => {
        const onRetry = vi.fn()
        const { getByText } = render(<PremiumErrorState onRetry={onRetry} retryLabel="Retry" />)

        expect(getByText('Retry')).toBeTruthy()
    })

    it('renders with default variant', () => {
        const { getByText } = render(<PremiumErrorState variant="default" />)

        expect(getByText('Something went wrong')).toBeTruthy()
    })

    it('renders with minimal variant', () => {
        const { getByText } = render(<PremiumErrorState variant="minimal" />)

        expect(getByText('Something went wrong')).toBeTruthy()
    })

    it('renders with detailed variant', () => {
        const error = new Error('Test error')
        error.stack = 'Error stack trace'
        const { getByText } = render(
            <PremiumErrorState variant="detailed" error={error} showDetails={true} />
        )

        expect(getByText('Something went wrong')).toBeTruthy()
    })

    it('shows error details when enabled', () => {
        const error = new Error('Test error')
        error.stack = 'Error stack trace'
        const { getByText } = render(
            <PremiumErrorState error={error} showDetails={true} variant="detailed" />
        )

        expect(getByText('Error Details')).toBeTruthy()
    })

    it('does not show error details when disabled', () => {
        const error = new Error('Test error')
        error.stack = 'Error stack trace'
        const { queryByText } = render(<PremiumErrorState error={error} showDetails={false} />)

        expect(queryByText('Error Details')).toBeFalsy()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(<PremiumErrorState style={customStyle} />)

        expect(getByTestId('premium-error-state')).toBeTruthy()
    })

    it('uses custom testID', () => {
        const { getByTestId } = render(<PremiumErrorState testID="custom-error-state" />)

        expect(getByTestId('custom-error-state')).toBeTruthy()
    })
})
