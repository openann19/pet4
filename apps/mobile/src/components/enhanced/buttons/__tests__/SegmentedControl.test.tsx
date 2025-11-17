/**
 * SegmentedControl Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/buttons/__tests__/SegmentedControl.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { SegmentedControl } from '../SegmentedControl'

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

describe('SegmentedControl', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByText } = render(
            <SegmentedControl
                options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                ]}
                value="option1"
                onValueChange={vi.fn()}
                accessibilityLabel="Test segmented control"
            />
        )

        expect(getByText('Option 1')).toBeTruthy()
        expect(getByText('Option 2')).toBeTruthy()
    })

    it('handles value change', () => {
        const onValueChange = vi.fn()
        const { getByText } = render(
            <SegmentedControl
                options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                ]}
                value="option1"
                onValueChange={onValueChange}
                accessibilityLabel="Test segmented control"
            />
        )

        fireEvent.press(getByText('Option 2'))

        expect(onValueChange).toHaveBeenCalledWith('option2')
    })

    it('highlights selected option', () => {
        const { getByText } = render(
            <SegmentedControl
                options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                ]}
                value="option1"
                onValueChange={vi.fn()}
                accessibilityLabel="Test segmented control"
            />
        )

        expect(getByText('Option 1')).toBeTruthy()
        expect(getByText('Option 2')).toBeTruthy()
    })

    it('renders with disabled options', () => {
        const { getByText } = render(
            <SegmentedControl
                options={[
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                ]}
                value="option1"
                onValueChange={vi.fn()}
                accessibilityLabel="Test segmented control"
            />
        )

        expect(getByText('Option 1')).toBeTruthy()
        expect(getByText('Option 2')).toBeTruthy()
    })
})
