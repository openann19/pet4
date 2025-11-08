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
        nameRequired: 'Name is required',
        nameTooShort: 'Name must be at least 2 characters',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        passwordRequired: 'Password is required',
        passwordTooShort: 'Password must be at least 6 characters',
        confirmPasswordRequired: 'Please confirm your password',
        passwordMismatch: 'Passwords do not match',
        termsRequired: 'You must agree to the Terms and Privacy Policy',
        signUpSuccess: 'Account created successfully!',
        signUpError: 'Failed to create account. Please try again.',
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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

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
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText('You must agree to the Terms and Privacy Policy')
      ).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    const toggleButtons = screen.getAllByRole('button', { name: /toggle password/i });
    await user.click(toggleButtons[0]);

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
    const { useAuth } = await import('@/contexts/AuthContext');
    const mockRegister = vi.fn().mockResolvedValue({});
    vi.mocked(useAuth).mockReturnValue({ register: mockRegister } as any);

    render(<SignUpForm onSuccess={mockOnSuccess} onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByTestId('age-gate-modal')).toBeInTheDocument();
    });
  });
});
