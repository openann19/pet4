import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

import { MainAppContent } from '@/components/MainAppContent';
import { renderWithProviders } from '@/test/utilities';

// Mock all lazy loaded components
vi.mock('@/components/views/DiscoverView', () => ({
  default: () => <div data-testid="discover-view">Discover View</div>,
}));

vi.mock('@/components/views/MatchesView', () => ({
  default: ({ onNavigateToChat }: { onNavigateToChat: () => void }) => (
    <div data-testid="matches-view">
      Matches View
      <button onClick={() => void onNavigateToChat()} data-testid="matches-nav-chat">
        Chat
      </button>
    </div>
  ),
}));

vi.mock('@/components/views/ProfileView', () => ({
  default: () => <div data-testid="profile-view">Profile View</div>,
}));

vi.mock('@/components/views/ChatView', () => ({
  default: () => <div data-testid="chat-view">Chat View</div>,
}));

vi.mock('@/components/views/CommunityView', () => ({
  default: () => <div data-testid="community-view">Community View</div>,
}));

vi.mock('@/components/views/AdoptionView', () => ({
  default: () => <div data-testid="adoption-view">Adoption View</div>,
}));

vi.mock('@/components/views/LostFoundView', () => ({
  default: () => <div data-testid="lost-found-view">Lost Found View</div>,
}));

vi.mock('@/components/chrome/HoloBackground', () => ({
  default: ({ intensity }: { intensity: number }) => (
    <div data-testid="holo-background" data-intensity={intensity}>
      Holo Background
    </div>
  ),
}));

vi.mock('@/effects/cursor/GlowTrail', () => ({
  default: () => <div data-testid="glow-trail">Glow Trail</div>,
}));

vi.mock('@/effects/ultra-web-overlays', () => ({
  AmbientAuroraBackground: ({ intensity }: { intensity: number }) => (
    <div data-testid="aurora-background" data-intensity={intensity}>
      Aurora Background
    </div>
  ),
  ScrollProgressBar: () => <div data-testid="scroll-progress">Scroll Progress</div>,
  PageChangeFlash: ({ key }: { key: string }) => (
    <div data-testid="page-flash" data-key={key}>
      Page Flash
    </div>
  ),
}));

vi.mock('@/components/LoadingState', () => ({
  default: () => <div data-testid="loading-state">Loading...</div>,
}));

vi.mock('@/components/AppHeader', () => ({
  AppHeader: ({
    t,
    theme,
    language,
    animations,
    onToggleTheme,
    onToggleLanguage,
    onOpenAdminConsole,
    onOpenThemeSettings,
  }: any) => (
    <div data-testid="app-header">
      Header - Theme: {theme}, Lang: {language}
      <button onClick={() => void onToggleTheme()} data-testid="toggle-theme">
        Toggle Theme
      </button>
      <button onClick={() => void onToggleLanguage()} data-testid="toggle-language">
        Toggle Language
      </button>
      <button onClick={() => void onOpenAdminConsole()} data-testid="open-admin">
        Admin
      </button>
      <button onClick={() => void onOpenThemeSettings()} data-testid="open-theme-settings">
        Theme Settings
      </button>
    </div>
  ),
}));

vi.mock('@/components/AppNavBar', () => ({
  AppNavBar: ({ currentView, t, animations, onNavigate }: any) => (
    <div data-testid="app-nav-bar">
      Nav - Current: {currentView}
      <button onClick={() => onNavigate('discover')} data-testid="nav-discover">
        Discover
      </button>
    </div>
  ),
}));

vi.mock('@/components/AppModals', () => ({
  AppModals: ({
    showGenerateProfiles,
    showStats,
    showMap,
    showAdminConsole,
    showThemeSettings,
    playdates,
    totalMatches,
    totalSwipes,
    successRate,
    animations,
    onCloseGenerateProfiles,
    onCloseStats,
    onCloseMap,
    onCloseAdminConsole,
    onCloseThemeSettings,
  }: any) => (
    <div data-testid="app-modals">
      Modals - Show Admin: {showAdminConsole ? 'yes' : 'no'}
      <button onClick={() => void onCloseAdminConsole()} data-testid="close-admin">
        Close Admin
      </button>
    </div>
  ),
}));

vi.mock('@/components/SeedDataInitializer', () => ({
  default: () => <div data-testid="seed-data">Seed Data</div>,
}));

vi.mock('@/components/payments/BillingIssueBanner', () => ({
  BillingIssueBanner: () => <div data-testid="billing-banner">Billing Issue</div>,
}));

vi.mock('@/components/QuickActionsMenu', () => ({
  default: ({
    onCreatePet,
    onViewHealth,
    onSchedulePlaydate,
    onSavedSearches,
    onGenerateProfiles,
    onViewStats,
    onViewMap,
  }: any) => (
    <div data-testid="quick-actions">
      Quick Actions
      <button onClick={() => void onCreatePet()} data-testid="create-pet">
        Create Pet
      </button>
    </div>
  ),
}));

vi.mock('@/components/navigation/BottomNavBar', () => ({
  default: () => <div data-testid="bottom-nav">Bottom Nav</div>,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

vi.mock('@/hooks/use-app-animations', () => ({
  useAppAnimations: () => ({
    loadingTransition: { style: {} },
    pageTransition: { style: {} },
  }),
}));

const mockProps = {
  currentView: 'discover',
  t: {
    app: { title: 'PetSpark' },
    nav: { discover: 'Discover', chat: 'Chat' },
  },
  theme: 'light' as const,
  language: 'en' as const,
  playdates: [],
  totalMatches: 10,
  totalSwipes: 100,
  successRate: 0.1,
  animations: {
    loadingTransition: { style: {} },
    pageTransition: { style: {} },
  },
  showGenerateProfiles: false,
  showStats: false,
  showMap: false,
  showAdminConsole: false,
  showThemeSettings: false,
  onNavigate: vi.fn(),
  onToggleTheme: vi.fn(),
  onToggleLanguage: vi.fn(),
  onOpenAdminConsole: vi.fn(),
  onOpenThemeSettings: vi.fn(),
  onCloseGenerateProfiles: vi.fn(),
  onCloseStats: vi.fn(),
  onCloseMap: vi.fn(),
  onCloseAdminConsole: vi.fn(),
  onCloseThemeSettings: vi.fn(),
  onNavigateToProfile: vi.fn(),
  onNavigateToMatches: vi.fn(),
  onNavigateToDiscover: vi.fn(),
  onNavigateToChat: vi.fn(),
};

describe('MainAppContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders discover view by default', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('discover-view')).toBeInTheDocument();
    });
  });

  it('renders different views based on currentView', async () => {
    const { rerender } = renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} currentView="matches" />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('matches-view')).toBeInTheDocument();
    });

    rerender(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} currentView="chat" />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('chat-view')).toBeInTheDocument();
    });
  });

  it('renders all background effects and components', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('holo-background')).toBeInTheDocument();
      expect(screen.getByTestId('glow-trail')).toBeInTheDocument();
      expect(screen.getByTestId('aurora-background')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-progress')).toBeInTheDocument();
      expect(screen.getByTestId('page-flash')).toBeInTheDocument();
    });
  });

  it('renders header with correct props', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      const header = screen.getByTestId('app-header');
      expect(header).toHaveTextContent('Theme: light');
      expect(header).toHaveTextContent('Lang: en');
    });
  });

  it('renders nav bar and handles navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      const navBar = screen.getByTestId('app-nav-bar');
      expect(navBar).toHaveTextContent('Current: discover');
    });

    const navButton = screen.getByTestId('nav-discover');
    await user.click(navButton);

    expect(mockProps.onNavigate).toHaveBeenCalledWith('discover');
  });

  it('renders modals and handles modal actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} showAdminConsole />
      </Suspense>,
    );

    await waitFor(() => {
      const modals = screen.getByTestId('app-modals');
      expect(modals).toHaveTextContent('Show Admin: yes');
    });

    const closeButton = screen.getByTestId('close-admin');
    await user.click(closeButton);

    expect(mockProps.onCloseAdminConsole).toHaveBeenCalled();
  });

  it('renders quick actions menu', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  it('renders bottom nav bar', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    });
  });

  it('renders toaster', async () => {
    renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <MainAppContent {...mockProps} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });
});
