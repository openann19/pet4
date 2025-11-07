/**
 * SignInForm Component Tests (Mobile)
 * Location: apps/mobile/src/components/auth/__tests__/SignInForm.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import SignInForm from '../SignInForm.native'
import { useStorage } from '../../../hooks/use-storage'

// Mock useStorage hook
vi.mock('../../../hooks/use-storage', () => ({
  useStorage: vi.fn(),
}))

const mockUseStorage = vi.mocked(useStorage)

describe('SignInForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnSwitchToSignUp = vi.fn()
  const mockSetAuthToken = vi.fn()
  const mockSetUserEmail = vi.fn()
  const mockSetIsAuthenticated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'auth-token') {
        return ['', mockSetAuthToken, vi.fn()]
      }
      if (key === 'user-email') {
        return ['', mockSetUserEmail, vi.fn()]
      }
      if (key === 'is-authenticated') {
        return [false, mockSetIsAuthenticated, vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    expect(getByText('Welcome Back')).toBeTruthy()
    expect(getByPlaceholderText('you@example.com')).toBeTruthy()
    expect(getByPlaceholderText('••••••••')).toBeTruthy()
  })

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const emailInput = getByPlaceholderText('you@example.com')
    fireEvent.changeText(emailInput, 'invalid-email')

    const submitButton = getByText('Sign In')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(queryByText(/valid email/i)).toBeTruthy()
    })
  })

  it('validates password length', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const emailInput = getByPlaceholderText('you@example.com')
    const passwordInput = getByPlaceholderText('••••••••')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, '12345')

    const submitButton = getByText('Sign In')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(queryByText(/at least 6 characters/i)).toBeTruthy()
    })
  })

  it('calls onSuccess after successful sign in', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const emailInput = getByPlaceholderText('you@example.com')
    const passwordInput = getByPlaceholderText('••••••••')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, 'password123')

    const submitButton = getByText('Sign In')
    fireEvent.press(submitButton)

    await waitFor(
      () => {
        expect(mockSetAuthToken).toHaveBeenCalled()
        expect(mockSetUserEmail).toHaveBeenCalledWith('test@example.com')
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true)
        expect(mockOnSuccess).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )
  })

  it('calls onSwitchToSignUp when sign up link is pressed', () => {
    const { getByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const signUpLink = getByText('Sign up')
    fireEvent.press(signUpLink)

    expect(mockOnSwitchToSignUp).toHaveBeenCalled()
  })

  it('toggles password visibility', () => {
    const { getByPlaceholderText, getByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const passwordInput = getByPlaceholderText('••••••••')
    const toggleButton = getByText('👁️')

    expect(passwordInput.props.secureTextEntry).toBe(true)

    fireEvent.press(toggleButton)

    expect(passwordInput.props.secureTextEntry).toBe(false)
  })

  it('shows loading state during submission', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const emailInput = getByPlaceholderText('you@example.com')
    const passwordInput = getByPlaceholderText('••••••••')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, 'password123')

    const submitButton = getByText('Sign In')
    fireEvent.press(submitButton)

    await waitFor(() => {
      expect(queryByText('Loading...')).toBeTruthy()
    })
  })

  it('clears errors when user starts typing', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />
    )

    const emailInput = getByPlaceholderText('you@example.com')
    const submitButton = getByText('Sign In')

    // Trigger validation error
    fireEvent.press(submitButton)

    // Start typing to clear error
    fireEvent.changeText(emailInput, 't')

    // Error should be cleared
    expect(queryByText(/Email is required/i)).toBeFalsy()
  })
})

