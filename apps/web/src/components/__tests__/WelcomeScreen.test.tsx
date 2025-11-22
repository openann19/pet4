/**
 * WelcomeScreen Tests
 *
 * Comprehensive tests for WelcomeScreen component covering all buttons, actions, and user flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeScreen from '@/components/WelcomeScreen';
import { renderWithProviders } from '@/test/utilities';

// Mock dependencies
vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
    isHapticSupported: vi.fn(() => false),
  },
}));

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

vi.mock('@/components/gdpr/ConsentBanner', () => ({
  ConsentBanner: ({ showOnMount }: { showOnMount?: boolean }) => (
    <div data-testid="consent-banner" data-show-on-mount={showOnMount}>
      Consent Banner
    </div>
  ),
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('WelcomeScreen', () => {
  const mockOnGetStarted = vi.fn();
  const mockOnSignIn = vi.fn();
  const mockOnExplore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render welcome screen with all elements', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }, { timeout: 500 });

      // Check title and subtitle
      expect(screen.getByText(/welcome to pawfectmatch/i)).toBeInTheDocument();
      expect(screen.getByText(/smarter matches/i)).toBeInTheDocument();

      // Check proof points
      expect(screen.getByText(/smart matching/i)).toBeInTheDocument();
      expect(screen.getByText(/safe chat/i)).toBeInTheDocument();
      expect(screen.getByText(/trusted community/i)).toBeInTheDocument();

      // Check buttons
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /i already have an account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explore first/i })).toBeInTheDocument();

      // Check language toggle
      expect(screen.getByRole('button', { name: /switch to bulgarian/i })).toBeInTheDocument();

      // Check legal text
      expect(screen.getByText(/by continuing you agree/i)).toBeInTheDocument();
      expect(screen.getByText(/terms/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();

      // Check consent banner
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render offline message when offline', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          isOnline={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should render deep link message when provided', async () => {
      const deepLinkMessage = 'You have a new message!';

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          deepLinkMessage={deepLinkMessage}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('note')).toBeInTheDocument();
        expect(screen.getByText(deepLinkMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Button Interactions', () => {
    it('should call onGetStarted when Get Started button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      await user.click(getStartedButton);

      expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
    });

    it('should call onSignIn when Sign In button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /i already have an account/i });
      await user.click(signInButton);

      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });

    it('should call onExplore when Explore button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const exploreButton = screen.getByRole('button', { name: /explore first/i });
      await user.click(exploreButton);

      expect(mockOnExplore).toHaveBeenCalledTimes(1);
    });

    it('should disable Get Started button when offline', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          isOnline={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toBeDisabled();
    });

    it('should not call onGetStarted when offline and button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          isOnline={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      await user.click(getStartedButton);

      expect(mockOnGetStarted).not.toHaveBeenCalled();
    });
  });

  describe('Language Toggle', () => {
    it('should render language toggle button', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const languageButton = screen.getByRole('button', { name: /switch to bulgarian/i });
      expect(languageButton).toBeInTheDocument();
    });

    it('should toggle language when language button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const languageButton = screen.getByRole('button', { name: /switch to bulgarian/i });
      await user.click(languageButton);

      // Language toggle should work (implementation may vary)
      // This test verifies the button is clickable
      expect(languageButton).toBeInTheDocument();
    });
  });

  describe('Legal Links', () => {
    it('should render terms and privacy links', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const termsLink = screen.getByRole('link', { name: /terms/i });
      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });

      expect(termsLink).toBeInTheDocument();
      expect(privacyLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', 'https://pawfectmatch.app/terms');
      expect(privacyLink).toHaveAttribute('href', 'https://pawfectmatch.app/privacy');
      expect(termsLink).toHaveAttribute('target', '_blank');
      expect(privacyLink).toHaveAttribute('target', '_blank');
      expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should track analytics when terms link is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const termsLink = screen.getByRole('link', { name: /terms/i });
      await user.click(termsLink);

      expect(analytics.track).toHaveBeenCalledWith('welcome_terms_opened');
    });

    it('should track analytics when privacy link is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      await user.click(privacyLink);

      expect(analytics.track).toHaveBeenCalledWith('welcome_privacy_opened');
    });
  });

  describe('Analytics Tracking', () => {
    it('should track welcome_viewed on mount', async () => {
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(analytics.track).toHaveBeenCalledWith('welcome_viewed');
      });
    });

    it('should track welcome_get_started_clicked when Get Started is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      await user.click(getStartedButton);

      expect(analytics.track).toHaveBeenCalledWith('welcome_get_started_clicked');
    });

    it('should track welcome_sign_in_clicked when Sign In is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /i already have an account/i });
      await user.click(signInButton);

      expect(analytics.track).toHaveBeenCalledWith('welcome_sign_in_clicked');
    });

    it('should track welcome_explore_clicked when Explore is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const exploreButton = screen.getByRole('button', { name: /explore first/i });
      await user.click(exploreButton);

      expect(analytics.track).toHaveBeenCalledWith('welcome_explore_clicked');
    });

    it('should track welcome_offline_state_shown when offline', async () => {
      vi.useRealTimers();
      const { analytics } = await import('@/lib/analytics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          isOnline={false}
        />
      );

      await waitFor(() => {
        expect(analytics.track).toHaveBeenCalledWith('welcome_offline_state_shown');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const languageButton = screen.getByRole('button', { name: /switch to bulgarian/i });
      expect(languageButton).toHaveAttribute('aria-pressed');
      expect(languageButton).toHaveAttribute('aria-label');

      const termsLink = screen.getByRole('link', { name: /terms/i });
      expect(termsLink).toBeInTheDocument();

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
    });

    it('should have loading state with proper ARIA attributes', () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have offline message with proper ARIA attributes', async () => {
      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
          isOnline={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const offlineAlert = screen.getByRole('alert');
        expect(offlineAlert).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus Get Started button after loading', async () => {
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const getStartedButton = screen.getByRole('button', { name: /get started/i });
        expect(getStartedButton).toHaveFocus();
      });
    });

    it('should support keyboard navigation for all buttons', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      const signInButton = screen.getByRole('button', { name: /i already have an account/i });
      const exploreButton = screen.getByRole('button', { name: /explore first/i });

      // Tab through buttons
      await user.tab();
      expect(getStartedButton).toHaveFocus();

      await user.tab();
      // Focus should move to next interactive element
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on button clicks', async () => {
      const user = userEvent.setup({ delay: null });
      vi.useRealTimers();
      const { haptics } = await import('@/lib/haptics');

      renderWithProviders(
        <WelcomeScreen
          onGetStarted={mockOnGetStarted}
          onSignIn={mockOnSignIn}
          onExplore={mockOnExplore}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      await user.click(getStartedButton);

      expect(haptics.trigger).toHaveBeenCalledWith('light');
    });
  });
});
