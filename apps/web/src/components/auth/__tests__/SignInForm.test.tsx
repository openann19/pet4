/**
 * SignInForm tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '@/components/auth/SignInForm';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      auth: {
        email: 'Email',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        passwordRequired: 'Password is required',
        passwordTooShort: 'Password must be at least 6 characters',
        passwordPlaceholder: '••••••••',
        signIn: 'Sign In',
        signInTitle: 'Welcome Back',
        signInSubtitle: 'Sign in to continue to PawfectMatch',
        signInSuccess: 'Welcome back!',
        signInError: 'Failed to sign in. Please try again.',
        forgotPassword: 'Forgot password?',
        forgotPasswordInfo: 'Password reset link would be sent to your email',
      },
      common: {
        loading: 'Loading...',
        cancel: 'Cancel',
        close: 'Close',
        confirm: 'Confirm',
        save: 'Save',
        error: 'Error',
      },
    },
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

vi.mock('@/api/auth-api', () => ({
  authApi: {
    forgotPassword: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/components/auth/OAuthButtons', () => ({
  default: () => <div data-testid="oauth-buttons">OAuth Buttons</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('SignInForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sign in form', async () => {
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    const emailInput = screen.getByLabelText('Email address');
    await act(async () => {
      await user.type(emailInput, 'invalid-email');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    await act(async () => {
      await user.type(passwordInput, 'password123');
    });

    // Button has aria-label "Show password" or "Hide password"
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await act(async () => {
      await user.click(toggleButton);
    });

    expect(passwordInput.type).toBe('text');
  });

  it('should call onSwitchToSignUp when switch link is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    const switchLink = screen.getByText(/sign up/i);
    await act(async () => {
      await user.click(switchLink);
    });

    expect(mockOnSwitchToSignUp).toHaveBeenCalled();
  });

  it('should handle forgot password click', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<SignInForm onSuccess={mockOnSuccess} onSwitchToSignUp={mockOnSwitchToSignUp} />);
    });

    // Enter email first (required for forgot password)
    const emailInput = screen.getByLabelText('Email address');
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
    });

    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await act(async () => {
      await user.click(forgotPasswordLink);
    });

    // Check that toast.success was called (password reset sent)
    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
