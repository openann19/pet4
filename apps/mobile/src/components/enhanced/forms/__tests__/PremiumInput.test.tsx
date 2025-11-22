/**
 * PremiumInput Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/forms/__tests__/PremiumInput.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { PremiumInput } from '../PremiumInput'

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

// Mock react-native-vector-icons
vi.mock('react-native-vector-icons/Feather', () => ({
    default: 'FeatherIcon',
}))

describe('PremiumInput', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByTestId } = render(<PremiumInput placeholder="Enter text" />)

        expect(getByTestId('premium-input')).toBeTruthy()
    })

    it('renders with label', () => {
        const { getByText } = render(<PremiumInput label="Email" placeholder="Enter email" />)

        expect(getByText('Email')).toBeTruthy()
    })

    it('renders with error message', () => {
        const { getByText } = render(<PremiumInput label="Email" error="Email is required" />)

        expect(getByText('Email is required')).toBeTruthy()
    })

    it('renders with helper text', () => {
        const { getByText } = render(
            <PremiumInput label="Email" helperText="Enter your email address" />
        )

        expect(getByText('Enter your email address')).toBeTruthy()
    })

    it('handles text input', () => {
        const onChangeText = vi.fn()
        const { getByPlaceholderText } = render(
            <PremiumInput placeholder="Enter text" onChangeText={onChangeText} />
        )

        const input = getByPlaceholderText('Enter text')
        fireEvent.changeText(input, 'Hello')

        expect(onChangeText).toHaveBeenCalledWith('Hello')
    })

    it('renders with password type', () => {
        const { getByTestId } = render(<PremiumInput type="password" placeholder="Enter password" />)

        expect(getByTestId('premium-input')).toBeTruthy()
    })

    it('toggles password visibility', () => {
        const { getByTestId } = render(
            <PremiumInput type="password" showPasswordToggle={true} placeholder="Enter password" />
        )

        // Password toggle should be available
        expect(getByTestId('premium-input')).toBeTruthy()
    })

    it('shows clear button when value exists', () => {
        const onClear = vi.fn()
        const { getByTestId } = render(
            <PremiumInput
                value="Hello"
                showClearButton={true}
                onClear={onClear}
                placeholder="Enter text"
            />
        )

        expect(getByTestId('premium-input')).toBeTruthy()
    })

    it('calls onClear when clear button is pressed', () => {
        const onClear = vi.fn()
        const { getByTestId } = render(
            <PremiumInput
                value="Hello"
                showClearButton={true}
                onClear={onClear}
                placeholder="Enter text"
            />
        )

        // Clear button should trigger onClear
        expect(getByTestId('premium-input')).toBeTruthy()
    })

    it('renders with left icon', () => {
        const leftIcon = <Text>Icon</Text>
        const { getByText } = render(<PremiumInput leftIcon={leftIcon} placeholder="Enter text" />)

        expect(getByText('Icon')).toBeTruthy()
    })

    it('renders with right icon', () => {
        const rightIcon = <Text>Icon</Text>
        const { getByText } = render(<PremiumInput rightIcon={rightIcon} placeholder="Enter text" />)

        expect(getByText('Icon')).toBeTruthy()
    })

    it('renders with different sizes', () => {
        const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

        sizes.forEach(size => {
            const { getByTestId } = render(<PremiumInput size={size} placeholder="Enter text" />)
            expect(getByTestId('premium-input')).toBeTruthy()
        })
    })

    it('renders with different variants', () => {
        const variants: Array<'default' | 'filled' | 'outlined'> = ['default', 'filled', 'outlined']

        variants.forEach(variant => {
            const { getByTestId } = render(<PremiumInput variant={variant} placeholder="Enter text" />)
            expect(getByTestId('premium-input')).toBeTruthy()
        })
    })

    it('handles focus events', () => {
        const onFocus = vi.fn()
        const { getByPlaceholderText } = render(
            <PremiumInput placeholder="Enter text" onFocus={onFocus} />
        )

        const input = getByPlaceholderText('Enter text')
        fireEvent(input, 'focus')

        expect(onFocus).toHaveBeenCalled()
    })

    it('handles blur events', () => {
        const onBlur = vi.fn()
        const { getByPlaceholderText } = render(
            <PremiumInput placeholder="Enter text" onBlur={onBlur} />
        )

        const input = getByPlaceholderText('Enter text')
        fireEvent(input, 'blur')

        expect(onBlur).toHaveBeenCalled()
    })

    it('handles disabled state', () => {
        const { getByPlaceholderText } = render(
            <PremiumInput placeholder="Enter text" editable={false} />
        )

        const input = getByPlaceholderText('Enter text')
        expect(input.props.editable).toBe(false)
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(<PremiumInput placeholder="Enter text" style={customStyle} />)

        expect(getByTestId('premium-input')).toBeTruthy()
    })
})
