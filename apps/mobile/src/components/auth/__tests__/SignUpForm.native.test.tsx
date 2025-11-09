/**
 * SignUpForm Component Tests (Mobile)
 * Location: apps/mobile/src/components/auth/__tests__/SignUpForm.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { SignUpForm } from '../SignUpForm.native'
import { apiClient } from '@/utils/api-client'
import { saveAuthToken, saveRefreshToken } from '@/utils/secure-storage'
import { useStorage } from '@/hooks/use-storage'

// Mock API client
vi.mock('@/utils/api-client', () => ({
    apiClient: {
        post: vi.fn(),
    },
}))

// Mock secure storage
vi.mock('@/utils/secure-storage', () => ({
    saveAuthToken: vi.fn(),
    saveRefreshToken: vi.fn(),
}))

// Mock useStorage hook
vi.mock('@/hooks/useStorage', () => ({
    useStorage: vi.fn(),
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
    createLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    })),
}))

const mockApiClient = vi.mocked(apiClient)
const mockSaveAuthToken = vi.mocked(saveAuthToken)
const mockSaveRefreshToken = vi.mocked(saveRefreshToken)
const mockUseStorage = vi.mocked(useStorage)

describe('SignUpForm', () => {
    const mockOnSuccess = vi.fn()
    const mockOnSwitchToSignIn = vi.fn()
    const mockSetUserEmail = vi.fn()
    const mockSetIsAuthenticated = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseStorage.mockImplementation((key: string) => {
            if (key === 'user-email') {
                return ['', mockSetUserEmail, vi.fn()]
            }
            if (key === 'is-authenticated') {
                return [false, mockSetIsAuthenticated, vi.fn()]
            }
            return ['', vi.fn(), vi.fn()]
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('renders correctly', () => {
        const { getByText, getByPlaceholderText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        expect(getByText('Create Account')).toBeTruthy()
        expect(getByPlaceholderText('you@example.com')).toBeTruthy()
        expect(getByPlaceholderText('Enter a strong password')).toBeTruthy()
        expect(getByPlaceholderText('Repeat your password')).toBeTruthy()
    })

    it('validates email format', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        fireEvent.changeText(emailInput, 'invalid-email')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(() => {
            expect(queryByText(/valid email/i)).toBeTruthy()
        })
    })

    it('validates password length', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const passwordInput = getByPlaceholderText('Enter a strong password')

        fireEvent.changeText(emailInput, 'test@example.com')
        fireEvent.changeText(passwordInput, '12345')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(() => {
            expect(queryByText(/at least 8 characters/i)).toBeTruthy()
        })
    })

    it('validates password match', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const passwordInput = getByPlaceholderText('Enter a strong password')
        const confirmPasswordInput = getByPlaceholderText('Repeat your password')

        fireEvent.changeText(emailInput, 'test@example.com')
        fireEvent.changeText(passwordInput, 'password123')
        fireEvent.changeText(confirmPasswordInput, 'password456')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(() => {
            expect(queryByText(/passwords do not match/i)).toBeTruthy()
        })
    })

    it('calls onSuccess after successful sign up', async () => {
        const mockResponse = {
            accessToken: 'token-123',
            refreshToken: 'refresh-123',
            user: {
                id: 'user1',
                email: 'test@example.com',
                name: 'Test User',
            },
        }

        mockApiClient.post.mockResolvedValue(mockResponse)
        mockSaveAuthToken.mockResolvedValue()
        mockSaveRefreshToken.mockResolvedValue()

        const { getByPlaceholderText, getByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const passwordInput = getByPlaceholderText('Enter a strong password')
        const confirmPasswordInput = getByPlaceholderText('Repeat your password')

        fireEvent.changeText(emailInput, 'test@example.com')
        fireEvent.changeText(passwordInput, 'password123')
        fireEvent.changeText(confirmPasswordInput, 'password123')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(
            () => {
                expect(mockSaveAuthToken).toHaveBeenCalledWith('token-123')
                expect(mockSaveRefreshToken).toHaveBeenCalledWith('refresh-123')
                expect(mockSetUserEmail).toHaveBeenCalled()
                expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
                expect(mockOnSuccess).toHaveBeenCalled()
            },
            { timeout: 2000 }
        )
    })

    it('calls onSwitchToSignIn when sign in link is pressed', () => {
        const { getByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const signInLink = getByText('Sign in')
        fireEvent.press(signInLink)

        expect(mockOnSwitchToSignIn).toHaveBeenCalled()
    })

    it('shows loading state during submission', async () => {
        let resolvePost: (value: unknown) => void
        const postPromise = new Promise(resolve => {
            resolvePost = resolve
        })
        mockApiClient.post.mockReturnValue(postPromise)

        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const passwordInput = getByPlaceholderText('Enter a strong password')
        const confirmPasswordInput = getByPlaceholderText('Repeat your password')

        fireEvent.changeText(emailInput, 'test@example.com')
        fireEvent.changeText(passwordInput, 'password123')
        fireEvent.changeText(confirmPasswordInput, 'password123')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(() => {
            expect(queryByText('Loading...')).toBeTruthy()
        })

        await act(async () => {
            resolvePost!({
                accessToken: 'token-123',
                refreshToken: 'refresh-123',
                user: {
                    id: 'user1',
                    email: 'test@example.com',
                },
            })
            await postPromise
        })
    })

    it('handles API errors', async () => {
        const error = new Error('Sign up failed')
        mockApiClient.post.mockRejectedValue(error)

        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const passwordInput = getByPlaceholderText('Enter a strong password')
        const confirmPasswordInput = getByPlaceholderText('Repeat your password')

        fireEvent.changeText(emailInput, 'test@example.com')
        fireEvent.changeText(passwordInput, 'password123')
        fireEvent.changeText(confirmPasswordInput, 'password123')

        const submitButton = getByText('Sign Up')
        fireEvent.press(submitButton)

        await waitFor(() => {
            expect(queryByText(/unable to create/i)).toBeTruthy()
        })
    })

    it('toggles password visibility', () => {
        const { getByPlaceholderText, getAllByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const passwordInput = getByPlaceholderText('Enter a strong password')
        const toggleButtons = getAllByText('👁️')

        expect(passwordInput.props.secureTextEntry).toBe(true)

        if (toggleButtons.length > 0) {
            fireEvent.press(toggleButtons[0]!)
        }

        // Password visibility should toggle
        expect(passwordInput.props.secureTextEntry).toBe(false)
    })

    it('clears errors when user starts typing', () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />
        )

        const emailInput = getByPlaceholderText('you@example.com')
        const submitButton = getByText('Sign Up')

        // Trigger validation error
        fireEvent.press(submitButton)

        // Start typing to clear error
        fireEvent.changeText(emailInput, 't')

        // Error should be cleared
        expect(queryByText(/Email is required/i)).toBeFalsy()
    })
})
