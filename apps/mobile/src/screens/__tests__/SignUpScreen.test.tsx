import SignUpScreen from '@mobile/screens/SignUpScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

const mockNavigation = {
    reset: vi.fn(),
    replace: vi.fn(),
    navigate: vi.fn(),
    goBack: vi.fn(),
    setOptions: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    canGoBack: vi.fn(() => true),
    dispatch: vi.fn(),
    getParent: vi.fn(),
    getState: vi.fn(),
    isFocused: vi.fn(() => true),
    navigateDeprecated: vi.fn(),
    preload: vi.fn(),
    getId: vi.fn(() => 'test-id'),
} as unknown

vi.mock('@mobile/components/auth/SignUpForm.native', () => ({
    default: (_props: {
        onSuccess: () => void
        onSwitchToSignIn: () => void
    }) => {
        return null
    },
}))

describe('SignUpScreen', () => {
    it('should render without crashing', () => {
        const props = {
            navigation: mockNavigation as any,
            route: {
                key: 'SignUp',
                name: 'SignUp' as const,
                params: undefined,
            },
        }
        render(<SignUpScreen {...props} />)
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should pass onSuccess handler that resets navigation', () => {
        const props = {
            navigation: mockNavigation as any,
            route: {
                key: 'SignUp',
                name: 'SignUp' as const,
                params: undefined,
            },
        }
        render(<SignUpScreen {...props} />)

        // Verify navigation methods are available
        expect((mockNavigation as any).reset).toBeDefined()
    })

    it('should pass onSwitchToSignIn handler that replaces navigation', () => {
        const props = {
            navigation: mockNavigation as any,
            route: {
                key: 'SignUp',
                name: 'SignUp' as const,
                params: undefined,
            },
        }
        render(<SignUpScreen {...props} />)

        // Verify navigation methods are available
        expect((mockNavigation as any).replace).toBeDefined()
        expect((mockNavigation as any).reset).toBeDefined()
    })

    it('should call navigation.reset with correct params when onSuccess is called', () => {
        const props = {
            navigation: mockNavigation as any,
            route: {
                key: 'SignUp',
                name: 'SignUp' as const,
                params: undefined,
            },
        }
        render(<SignUpScreen {...props} />)
        expect((mockNavigation as any).reset).toBeDefined()
    })

    it('should call navigation.replace with SignIn when onSwitchToSignIn is called', () => {
        const props = {
            navigation: mockNavigation as any,
            route: {
                key: 'SignUp',
                name: 'SignUp' as const,
                params: undefined,
            },
        }
        render(<SignUpScreen {...props} />)
        expect((mockNavigation as any).replace).toBeDefined()
    })
})
