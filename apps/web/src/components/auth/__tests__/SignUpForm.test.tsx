/**
 * SignUpForm tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpForm from '@/components/auth/SignUpForm';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      auth: {
        name: 'Full Name',
        namePlaceholder: 'John Doe',
        nameRequired: 'Name is required',
        nameTooShort: 'Name must be at least 2 characters',
        email: 'Email',
        emailPlaceholder: 'you@example.com',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        passwordRequired: 'Password is required',
        passwordTooShort: 'Password must be at least 6 characters',
        confirmPassword: 'Confirm Password',
        confirmPasswordRequired: 'Please confirm your password',
        passwordMismatch: 'Passwords do not match',
        termsRequired: 'You must agree to the Terms and Privacy Policy',
        signUp: 'Sign Up',
        signUpTitle: 'Create Account',
        signUpSubtitle: "Join PawfectMatch to find your pet's perfect companion",
        signUpSuccess: 'Account created successfully!',
        signUpError: 'Failed to create account. Please try again.',
        signIn: 'Sign in',
        noAccount: "Don't have an account?",
        or: 'or',
        signUpWithGoogle: 'Sign up with Google',
        signUpWithApple: 'Sign up with Apple',
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
    register: vi.fn(),
  }),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/auth/OAuthButtons', () => ({
  default: () => <div data-testid="oauth-buttons">OAuth Buttons</div>,
}));

vi.mock('@/components/auth/AgeGateModal', () => ({
  default: ({ open, onVerified }: any) =>
    open ? (
      <div data-testid="age-gate-modal">
        <button onClick={() => onVerified()}>Verify Age</button>
      </div>
    ) : null,
}));

vi.mock('@/lib/kyc-service', () => ({
  recordConsent: vi.fn(),
}));

// MotionView is mocked globally in setup.ts via @petspark/motion

describe('SignUpForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sign up form', () => {
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should validate name length', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('should validate password match', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should require terms agreement', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('You must agree to the Terms and Privacy Policy')
      ).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    await user.type(passwordInput, 'password123');

    // Button has aria-label "Show password" or "Hide password"
    const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
    const toggleButton = toggleButtons[0];
    if (!toggleButton) {
      throw new Error('Toggle button not found');
    }
    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('should call onSwitchToSignIn when switch link is clicked', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const switchLink = screen.getByText(/sign in/i);
    await user.click(switchLink);

    expect(mockOnSwitchToSignIn).toHaveBeenCalled();
  });

  it('should show age gate modal when age not verified', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    // Click the label which will toggle the checkbox
    const termsLabel = screen.getByText(/I agree to the/i);
    await user.click(termsLabel);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByTestId('age-gate-modal')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
