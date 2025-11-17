/**
 * OAuthButtons tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OAuthButtons from '@/components/auth/OAuthButtons';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      auth: {
        signInWithGoogle: 'Sign in with Google',
        signInWithApple: 'Sign in with Apple',
      },
    },
  }),
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
    track: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{children}</button>,
  },
}));

// Mock window.fetch
global.fetch = vi.fn();

// Mock window.AppleID
type WindowWithAppleID = typeof window & {
  AppleID?: { auth: (config: unknown) => Promise<unknown> } | undefined;
};
(global.window as WindowWithAppleID).AppleID = undefined;

describe('OAuthButtons', () => {
  const mockOnGoogleSignIn = vi.fn();
  const mockOnAppleSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render Google and Apple sign in buttons', () => {
    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with apple/i)).toBeInTheDocument();
  });

  it('should call onGoogleSignIn when Google button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    const googleButton = screen.getByText(/sign in with google/i);
    await user.click(googleButton);

    await waitFor(() => {
      expect(mockOnGoogleSignIn).toHaveBeenCalled();
    });
  });

  it('should redirect to Google OAuth URL when API returns URL', async () => {
    const user = userEvent.setup();
    const mockUrl = 'https://accounts.google.com/oauth';
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: mockUrl }),
    } as Response);

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as { location?: Location }).location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });

    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    const googleButton = screen.getByText(/sign in with google/i);
    await user.click(googleButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/oauth/google/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  it('should call onAppleSignIn when Apple button is clicked', async () => {
    const user = userEvent.setup();

    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    const appleButton = screen.getByText(/sign in with apple/i);
    await user.click(appleButton);

    await waitFor(() => {
      expect(mockOnAppleSignIn).toHaveBeenCalled();
    });
  });

  it('should be disabled when disabled prop is true', async () => {
    const user = userEvent.setup();
    render(
      <OAuthButtons
        onGoogleSignIn={mockOnGoogleSignIn}
        onAppleSignIn={mockOnAppleSignIn}
        disabled={true}
      />
    );

    const googleButton = screen.getByText(/sign in with google/i);
    const appleButton = screen.getByText(/sign in with apple/i);

    await user.click(googleButton);
    await user.click(appleButton);

    expect(mockOnGoogleSignIn).not.toHaveBeenCalled();
    expect(mockOnAppleSignIn).not.toHaveBeenCalled();
  });

  it('should handle Google OAuth error gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    const googleButton = screen.getByText(/sign in with google/i);
    await user.click(googleButton);

    await waitFor(() => {
      expect(mockOnGoogleSignIn).toHaveBeenCalled();
    });
  });

  it('should use Apple Sign In API when available', async () => {
    const user = userEvent.setup();
    const mockAppleAuth = {
      init: vi.fn().mockResolvedValue(undefined),
      signIn: vi.fn().mockResolvedValue({ authorization: { id_token: 'token' } }),
    };

    (global.window as WindowWithAppleID).AppleID = { auth: mockAppleAuth };

    render(<OAuthButtons onGoogleSignIn={mockOnGoogleSignIn} onAppleSignIn={mockOnAppleSignIn} />);

    const appleButton = screen.getByText(/sign in with apple/i);
    await user.click(appleButton);

    await waitFor(() => {
      expect(mockAppleAuth.init).toHaveBeenCalled();
    });
  });
});
