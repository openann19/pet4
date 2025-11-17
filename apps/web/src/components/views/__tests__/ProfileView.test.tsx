import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileView from '@/components/views/ProfileView';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(),
}));

vi.mock('@/components/CreatePetDialog', () => ({
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="create-pet-dialog">
      {open && <button onClick={() => onOpenChange(false)}>Close</button>}
    </div>
  ),
}));

vi.mock('@/components/StatsCard', () => ({
  default: ({
    totalMatches,
    totalSwipes,
    successRate,
  }: {
    totalMatches: number;
    totalSwipes: number;
    successRate: number;
  }) => (
    <div data-testid="stats-card">
      <span>Matches: {totalMatches}</span>
      <span>Swipes: {totalSwipes}</span>
      <span>Success: {successRate}%</span>
    </div>
  ),
}));

vi.mock('@/components/stories/HighlightsBar', () => ({
  default: () => <div data-testid="highlights-bar">Highlights</div>,
}));

vi.mock('@/components/call/VideoQualitySettings', () => ({
  default: () => <div data-testid="video-quality-settings">Video Settings</div>,
}));

vi.mock('@/components/ThemePresetSelector', () => ({
  default: () => <div data-testid="theme-preset-selector">Theme Selector</div>,
}));

vi.mock('@/components/payments/SubscriptionStatusCard', () => ({
  SubscriptionStatusCard: () => <div data-testid="subscription-status-card">Subscription</div>,
}));

vi.mock('@/components/health/PetHealthDashboard', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="health-dashboard">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('@/components/verification/VerificationButton', () => ({
  VerificationButton: () => <div data-testid="verification-button">Verify</div>,
}));

vi.mock('@/components/VisualAnalysisDemo', () => ({
  default: () => <div data-testid="visual-analysis">Analysis</div>,
}));

vi.mock('@/effects/reanimated', () => ({
  useMotionVariants: vi.fn(() => ({ animatedStyle: {} })),
  useStaggeredContainer: vi.fn(() => ({ animatedStyle: {} })),
  useHoverLift: vi.fn(() => ({ animatedStyle: {}, handleEnter: vi.fn(), handleLeave: vi.fn() })),
  usePressBounce: vi.fn(() => ({ animatedStyle: {}, handlePress: vi.fn() })),
  useGlowPulse: vi.fn(() => ({ animatedStyle: {} })),
  useIconRotation: vi.fn(() => ({ style: {}, animatedStyle: {} })),
}));

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApp).mockReturnValue({
      t: {
        profile: {
          createProfile: 'Create Profile',
          noPetsDesc: 'No pets description',
          createProfileBtn: 'Create Profile',
          myPets: 'My Pets',
          subtitle: 'pet',
          subtitlePlural: 'pets',
          addPet: 'Add Pet',
          yearsOld: 'years old',
        },
        petProfile: {
          personality: 'Personality',
          interests: 'Interests',
        },
      },
      themePreset: 'default',
      setThemePreset: vi.fn(),
    } as never);

    vi.mocked(useStorage).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'user-pets') return [[], vi.fn()];
      if (key === 'matches') return [[], vi.fn()];
      if (key === 'swipe-history') return [[], vi.fn()];
      if (key === 'video-quality-preference') return ['4k', vi.fn()];
      return [defaultValue, vi.fn()];
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should render empty state when no pets', () => {
    render(<ProfileView />);

    // Use getAllByText since there are multiple "Create Profile" texts (title and button)
    const createProfileTexts = screen.getAllByText('Create Profile');
    expect(createProfileTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('No pets description')).toBeInTheDocument();
  });

  it('should render pets when available', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        breed: 'Golden Retriever',
        age: 3,
        gender: 'male',
        photo: 'https://example.com/pet.jpg',
        ownerId: 'user-1',
      },
    ];

    vi.mocked(useStorage).mockImplementation((key: string) => {
      if (key === 'user-pets') return [mockPets, vi.fn()];
      if (key === 'matches') return [[], vi.fn()];
      if (key === 'swipe-history') return [[], vi.fn()];
      if (key === 'video-quality-preference') return ['4k', vi.fn()];
      return [[], vi.fn()];
    });

    render(<ProfileView />);

    expect(screen.getByText('Fluffy')).toBeInTheDocument();
    expect(screen.getByText('My Pets')).toBeInTheDocument();
  });

  it('should open create pet dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileView />);

    // Use getByRole to find the button specifically, not just text
    const createButton = screen.getByRole('button', { name: /create profile/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('create-pet-dialog')).toBeInTheDocument();
    });
  });

  it('should show stats when swipes exist', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        breed: 'Golden Retriever',
        age: 3,
        gender: 'male',
        photo: 'https://example.com/pet.jpg',
        ownerId: 'user-1',
      },
    ];
    const mockMatches = [
      {
        id: 'match-1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    ];
    const mockSwipes = [
      {
        id: 'swipe-1',
        petId: 'pet-1',
        targetPetId: 'pet-2',
        action: 'like' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useStorage).mockImplementation((key: string) => {
      if (key === 'user-pets') return [mockPets, vi.fn()];
      if (key === 'matches') return [mockMatches, vi.fn()];
      if (key === 'swipe-history') return [mockSwipes, vi.fn()];
      if (key === 'video-quality-preference') return ['4k', vi.fn()];
      return [[], vi.fn()];
    });

    render(<ProfileView />);

    expect(screen.getByTestId('stats-card')).toBeInTheDocument();
  });
});
