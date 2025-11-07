/**
 * SignInForm tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignInForm from '@/components/auth/SignInForm'

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      auth: {
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        passwordRequired: 'Password is required',
        passwordTooShort: 'Password must be at least 6 characters',
        signInSuccess: 'Welcome back!',
        signInError: 'Failed to sign in. Please try again.',
        forgotPasswordInfo: 'Password reset link would be sent to your email',
      },
    },
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}))

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/components/auth/OAuthButtons', () => ({
  default: () => <div data-testid="oauth-buttons">OAuth Buttons</div>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('SignInForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnSwitchToSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign in form', () => {
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '12345')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'password123')

    const toggleButton = screen.getByRole('button', { name: /toggle password/i })
    await user.click(toggleButton)

    expect(passwordInput.type).toBe('text')
  })

  it('should call onSwitchToSignUp when switch link is clicked', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const switchLink = screen.getByText(/sign up/i)
    await user.click(switchLink)

    expect(mockOnSwitchToSignUp).toHaveBeenCalled()
  })

  it('should handle forgot password click', async () => {
    const user = userEvent.setup()
    render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />)

    const forgotPasswordLink = screen.getByText(/forgot password/i)
    await user.click(forgotPasswordLink)

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalled()
    })
  })
})

