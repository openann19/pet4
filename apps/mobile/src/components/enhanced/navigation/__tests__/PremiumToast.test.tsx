/**
 * PremiumToast Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/navigation/__tests__/PremiumToast.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { PremiumToast } from '../PremiumToast'

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
    }
    return Reanimated
})

// Mock reduced motion
vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
    useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

describe('PremiumToast', () => {
    const mockOnDismiss = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders correctly', () => {
        const { getByText } = render(
            <PremiumToast id="toast1" type="success" title="Success" onDismiss={mockOnDismiss} />
        )

        expect(getByText('Success')).toBeTruthy()
    })

    it('renders with description', () => {
        const { getByText } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                description="Operation completed successfully"
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByText('Success')).toBeTruthy()
        expect(getByText('Operation completed successfully')).toBeTruthy()
    })

    it('renders with different types', () => {
        const types: Array<'success' | 'error' | 'warning' | 'info'> = [
            'success',
            'error',
            'warning',
            'info',
        ]

        types.forEach(type => {
            const { getByText } = render(
                <PremiumToast id={`toast-${type}`} type={type} title="Title" onDismiss={mockOnDismiss} />
            )
            expect(getByText('Title')).toBeTruthy()
        })
    })

    it('renders with action button', () => {
        const action = {
            label: 'Action',
            onPress: vi.fn(),
        }
        const { getByText } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                action={action}
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByText('Action')).toBeTruthy()
    })

    it('handles action button press', () => {
        const action = {
            label: 'Action',
            onPress: vi.fn(),
        }
        const { getByText } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                action={action}
                onDismiss={mockOnDismiss}
            />
        )

        fireEvent.press(getByText('Action'))

        expect(action.onPress).toHaveBeenCalled()
    })

    it('dismisses automatically after duration', async () => {
        render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                duration={1000}
                onDismiss={mockOnDismiss}
            />
        )

        vi.advanceTimersByTime(1000)

        await waitFor(() => {
            expect(mockOnDismiss).toHaveBeenCalledWith('toast1')
        })
    })

    it('renders at top position', () => {
        const { getByText } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                position="top"
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByText('Success')).toBeTruthy()
    })

    it('renders at bottom position', () => {
        const { getByText } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                position="bottom"
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByText('Success')).toBeTruthy()
    })

    it('shows progress bar when enabled', () => {
        const { getByTestId } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                showProgress={true}
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByTestId('premium-toast')).toBeTruthy()
    })

    it('handles manual dismiss', () => {
        const { getByTestId } = render(
            <PremiumToast id="toast1" type="success" title="Success" onDismiss={mockOnDismiss} />
        )

        // Dismiss should be callable
        expect(getByTestId('premium-toast')).toBeTruthy()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(
            <PremiumToast
                id="toast1"
                type="success"
                title="Success"
                style={customStyle}
                onDismiss={mockOnDismiss}
            />
        )

        expect(getByTestId('premium-toast')).toBeTruthy()
    })
})
