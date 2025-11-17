/**
 * PremiumAvatar Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/display/__tests__/PremiumAvatar.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { PremiumAvatar } from '../PremiumAvatar'
import * as Haptics from 'expo-haptics'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
    impactAsync: vi.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
    },
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
    const Reanimated = {
        default: {
            createAnimatedComponent: (component: unknown) => component,
            Image: 'Image',
        },
        useSharedValue: () => ({ value: 0 }),
        useAnimatedStyle: () => ({}),
        View: 'View',
    }
    return Reanimated
})

const mockHaptics = vi.mocked(Haptics)

describe('PremiumAvatar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByTestId } = render(<PremiumAvatar name="John Doe" />)

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })

    it('renders with image source', () => {
        const { getByTestId } = render(
            <PremiumAvatar src="https://example.com/avatar.jpg" alt="Avatar" />
        )

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })

    it('renders with initials when no image', () => {
        const { getByText } = render(<PremiumAvatar name="John Doe" />)

        expect(getByText('JD')).toBeTruthy()
    })

    it('renders with single name initial', () => {
        const { getByText } = render(<PremiumAvatar name="John" />)

        expect(getByText('JO')).toBeTruthy()
    })

    it('renders with status indicator', () => {
        const { getByLabelText } = render(<PremiumAvatar name="John Doe" status="online" />)

        expect(getByLabelText('Status: online')).toBeTruthy()
    })

    it('renders with badge', () => {
        const { getByLabelText } = render(<PremiumAvatar name="John Doe" badge={5} />)

        expect(getByLabelText('Badge: 5')).toBeTruthy()
    })

    it('renders with badge as string', () => {
        const { getByLabelText } = render(<PremiumAvatar name="John Doe" badge="New" />)

        expect(getByLabelText('Badge: New')).toBeTruthy()
    })

    it('renders badge with 99+ for numbers over 99', () => {
        const { getByText } = render(<PremiumAvatar name="John Doe" badge={150} />)

        expect(getByText('99+')).toBeTruthy()
    })

    it('renders with different sizes', () => {
        const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'md', 'lg', 'xl']

        sizes.forEach(size => {
            const { getByTestId } = render(<PremiumAvatar name="John Doe" size={size} />)
            expect(getByTestId('premium-avatar')).toBeTruthy()
        })
    })

    it('renders with circle variant', () => {
        const { getByTestId } = render(<PremiumAvatar name="John Doe" variant="circle" />)

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })

    it('renders with square variant', () => {
        const { getByTestId } = render(<PremiumAvatar name="John Doe" variant="square" />)

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })

    it('renders with rounded variant', () => {
        const { getByTestId } = render(<PremiumAvatar name="John Doe" variant="rounded" />)

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })

    it('renders with different status values', () => {
        const statuses: Array<'online' | 'offline' | 'away' | 'busy'> = [
            'online',
            'offline',
            'away',
            'busy',
        ]

        statuses.forEach(status => {
            const { getByLabelText } = render(<PremiumAvatar name="John Doe" status={status} />)
            expect(getByLabelText(`Status: ${status}`)).toBeTruthy()
        })
    })

    it('handles press events', () => {
        const onPress = vi.fn()
        const { getByTestId } = render(<PremiumAvatar name="John Doe" onPress={onPress} />)

        fireEvent.press(getByTestId('premium-avatar'))

        expect(onPress).toHaveBeenCalled()
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
    })

    it('renders with custom icon', () => {
        const icon = <Text>Icon</Text>
        const { getByText } = render(<PremiumAvatar name="John Doe" icon={icon} />)

        expect(getByText('Icon')).toBeTruthy()
    })

    it('renders with fallback', () => {
        const fallback = <Text>Fallback</Text>
        const { getByText } = render(<PremiumAvatar name="John Doe" fallback={fallback} />)

        expect(getByText('Fallback')).toBeTruthy()
    })

    it('uses custom testID', () => {
        const { getByTestId } = render(<PremiumAvatar name="John Doe" testID="custom-avatar" />)

        expect(getByTestId('custom-avatar')).toBeTruthy()
    })

    it('applies custom style', () => {
        const customStyle = { marginTop: 20 }
        const { getByTestId } = render(<PremiumAvatar name="John Doe" style={customStyle} />)

        expect(getByTestId('premium-avatar')).toBeTruthy()
    })
})
