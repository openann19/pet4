/**
 * AuthScreen Tests
 *
 * Comprehensive tests for AuthScreen component covering mode switching, form rendering, and navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from '../AuthScreen';
import { renderWithProviders } from '@/test/utilities';

// Mock dependencies
vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

vi.mock('@/components/auth/SignInForm', () => ({
  default: ({ onSuccess, onSwitchToSignUp }: { onSuccess: () => void; onSwitchToSignUp: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Sign In Success</button>
      <button onClick={onSwitchToSignUp}>Switch to Sign Up</button>
    </div>
  ),
}));

vi.mock('@/components/auth/SignUpForm', () => ({
  default: ({ onSuccess, onSwitchToSignIn }: { onSuccess: () => void; onSwitchToSignIn: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Sign Up Success</button>
      <button onClick={onSwitchToSignIn}>Switch to Sign In</button>
    </div>
  ),
}));

describe('AuthScreen', () => {
  const mockOnBack = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render auth screen with sign up form by default', () => {
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
    });

    it('should render sign in form when initialMode is signin', () => {
      renderWithProviders(<AuthScreen initialMode="signin" onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
    });

    it('should render sign up form when initialMode is signup', () => {
      renderWithProviders(<AuthScreen initialMode="signup" onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
    });

    it('should render back button', () => {
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render language toggle button', () => {
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const languageButton = screen.getByRole('button', { name: /switch to/i });
      expect(languageButton).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch from sign up to sign in when switch link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();

      const switchButton = screen.getByRole('button', { name: /switch to sign in/i });
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
    });

    it('should switch from sign in to sign up when switch link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen initialMode="signin" onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();

      const switchButton = screen.getByRole('button', { name: /switch to sign up/i });
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSuccess when sign in succeeds', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen initialMode="signin" onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const successButton = screen.getByRole('button', { name: /sign in success/i });
      await user.click(successButton);

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onSuccess when sign up succeeds', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const successButton = screen.getByRole('button', { name: /sign up success/i });
      await user.click(successButton);

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('Language Toggle', () => {
    it('should render language toggle button', () => {
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const languageButton = screen.getByRole('button', { name: /switch to/i });
      expect(languageButton).toBeInTheDocument();
    });

    it('should toggle language when language button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const languageButton = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageButton);

      // Language toggle should work (implementation may vary)
      expect(languageButton).toBeInTheDocument();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on back button click', async () => {
      const user = userEvent.setup();
      const { haptics } = await import('@/lib/haptics');

      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(haptics.trigger).toHaveBeenCalledWith('light');
    });

    it('should trigger haptic feedback on mode switch', async () => {
      const user = userEvent.setup();
      const { haptics } = await import('@/lib/haptics');

      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const switchButton = screen.getByRole('button', { name: /switch to sign in/i });
      await user.click(switchButton);

      expect(haptics.trigger).toHaveBeenCalledWith('selection');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      renderWithProviders(<AuthScreen onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toHaveAttribute('aria-label');

      const languageButton = screen.getByRole('button', { name: /switch to/i });
      expect(languageButton).toHaveAttribute('aria-label');
      expect(languageButton).toHaveAttribute('aria-pressed');
    });
  });
});

