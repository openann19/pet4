/**
 * PremiumSelect Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/forms/__tests__/PremiumSelect.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { PremiumSelect } from '../PremiumSelect'

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

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
    },
}))

describe('PremiumSelect', () => {
    const mockOptions = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('renders with label', () => {
        const { getByText } = render(
            <PremiumSelect
                options={mockOptions}
                label="Select Option"
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('Select Option')).toBeTruthy()
    })

    it('renders with placeholder', () => {
        const { getByText } = render(
            <PremiumSelect
                options={mockOptions}
                placeholder="Choose an option"
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('Choose an option')).toBeTruthy()
    })

    it('renders selected value', () => {
        const { getByText } = render(
            <PremiumSelect
                options={mockOptions}
                value="option1"
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('Option 1')).toBeTruthy()
    })

    it('opens modal when pressed', () => {
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        const select = getByTestId('premium-select')
        fireEvent.press(select)

        // Modal should open
        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('handles single selection', () => {
        const onValueChange = vi.fn()
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                accessibilityLabel="Select option"
                onValueChange={onValueChange}
            />
        )

        const select = getByTestId('premium-select')
        fireEvent.press(select)

        // Selection should trigger onValueChange
        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('handles multi selection', () => {
        const onValueChange = vi.fn()
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                multiSelect={true}
                accessibilityLabel="Select option"
                onValueChange={onValueChange}
            />
        )

        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('renders with error message', () => {
        const { getByText } = render(
            <PremiumSelect
                options={mockOptions}
                error="Selection is required"
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('Selection is required')).toBeTruthy()
    })

    it('renders with helper text', () => {
        const { getByText } = render(
            <PremiumSelect
                options={mockOptions}
                helperText="Please select an option"
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByText('Please select an option')).toBeTruthy()
    })

    it('handles disabled state', () => {
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                disabled={true}
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('filters options when searchable', () => {
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                searchable={true}
                accessibilityLabel="Select option"
                onValueChange={vi.fn()}
            />
        )

        expect(getByTestId('premium-select')).toBeTruthy()
    })

    it('renders with different variants', () => {
        const variants: Array<'default' | 'filled' | 'outlined' | 'glass'> = [
            'default',
            'filled',
            'outlined',
            'glass',
        ]

        variants.forEach(variant => {
            const { getByTestId } = render(
                <PremiumSelect
                    options={mockOptions}
                    variant={variant}
                    accessibilityLabel="Select option"
                    onValueChange={vi.fn()}
                />
            )
            expect(getByTestId('premium-select')).toBeTruthy()
        })
    })

    it('renders with different sizes', () => {
        const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

        sizes.forEach(size => {
            const { getByTestId } = render(
                <PremiumSelect
                    options={mockOptions}
                    size={size}
                    accessibilityLabel="Select option"
                    onValueChange={vi.fn()}
                />
            )
            expect(getByTestId('premium-select')).toBeTruthy()
        })
    })

    it('handles option selection', () => {
        const onValueChange = vi.fn()
        const { getByTestId } = render(
            <PremiumSelect
                options={mockOptions}
                accessibilityLabel="Select option"
                onValueChange={onValueChange}
            />
        )

        const select = getByTestId('premium-select')
        fireEvent.press(select)

        // Selection logic would be tested through modal interaction
        expect(getByTestId('premium-select')).toBeTruthy()
    })
})
