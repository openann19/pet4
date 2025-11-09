import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdoptionCard } from '../AdoptionCard';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));
vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>
      {children}
    </div>
  ),
}));
vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
  })),
}));
vi.mock('@/effects/reanimated/use-hover-tap', () => ({
  useHoverTap: vi.fn(() => ({
    animatedStyle: {},
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handlePress: vi.fn(),
  })),
}));

const mockUseApp = vi.mocked(useApp);
const mockHaptics = vi.mocked(haptics);

describe('AdoptionCard', () => {
  const mockProfile: AdoptionProfile = {
    _id: '1',
    petId: 'pet1',
    petName: 'Buddy',
    petPhoto: 'https://example.com/buddy.jpg',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'male',
    size: 'large',
    location: 'New York',
    shelterId: 'shelter1',
    shelterName: 'Happy Paws',
    status: 'available',
    description: 'Friendly dog',
    healthStatus: 'Healthy',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'high',
    adoptionFee: 200,
    postedDate: new Date().toISOString(),
    personality: ['friendly', 'energetic'],
    photos: ['https://example.com/buddy.jpg'],
    contactEmail: 'shelter@example.com',
    contactPhone: '123-456-7890',
  };

  const mockOnSelect = vi.fn();
  const mockOnFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApp.mockReturnValue({
      t: {
        adoption: {
          available: 'Available',
          pending: 'Pending',
          adopted: 'Adopted',
          onHold: 'On Hold',
        },
      },
    } as never);
  });

  it('renders adoption card with profile information', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByAltText('Buddy')).toBeInTheDocument();
    expect(screen.getByText(/golden retriever/i)).toBeInTheDocument();
  });

  it('displays status badge correctly', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    const card = screen.getByAltText('Buddy').closest('div');
    if (card) {
      await user.click(card);
    }

    expect(mockOnSelect).toHaveBeenCalledWith(mockProfile);
    expect(mockHaptics.trigger).toHaveBeenCalledWith('selection');
  });

  it('displays favorite button when onFavorite is provided', () => {
    render(
      <AdoptionCard profile={mockProfile} onSelect={mockOnSelect} onFavorite={mockOnFavorite} />
    );

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    expect(favoriteButton).toBeInTheDocument();
  });

  it('does not display favorite button when onFavorite is not provided', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    const favoriteButtons = screen.queryAllByRole('button', { name: /favorite/i });
    expect(favoriteButtons.length).toBe(0);
  });

  it('calls onFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionCard profile={mockProfile} onSelect={mockOnSelect} onFavorite={mockOnFavorite} />
    );

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    await user.click(favoriteButton);

    expect(mockOnFavorite).toHaveBeenCalledWith('1');
    expect(mockHaptics.trigger).toHaveBeenCalledWith('light');
  });

  it('displays filled heart icon when favorited', () => {
    render(
      <AdoptionCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onFavorite={mockOnFavorite}
        isFavorited={true}
      />
    );

    const heartIcon = screen.getByRole('button', { name: /favorite/i }).querySelector('svg');
    expect(heartIcon).toBeInTheDocument();
  });

  it('displays different status colors for different statuses', () => {
    const { rerender } = render(
      <AdoptionCard profile={{ ...mockProfile, status: 'pending' }} onSelect={mockOnSelect} />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(
      <AdoptionCard profile={{ ...mockProfile, status: 'adopted' }} onSelect={mockOnSelect} />
    );

    expect(screen.getByText('Adopted')).toBeInTheDocument();

    rerender(
      <AdoptionCard profile={{ ...mockProfile, status: 'on-hold' }} onSelect={mockOnSelect} />
    );

    expect(screen.getByText('On Hold')).toBeInTheDocument();
  });

  it('displays pet location', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText(/new york/i)).toBeInTheDocument();
  });

  it('displays shelter name', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText(/happy paws/i)).toBeInTheDocument();
  });

  it('displays adoption fee', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText(/\$200/i)).toBeInTheDocument();
  });

  it('displays pet details correctly', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText(/3 years/i)).toBeInTheDocument();
    expect(screen.getByText(/male/i)).toBeInTheDocument();
    expect(screen.getByText(/large/i)).toBeInTheDocument();
  });

  it('handles missing translation gracefully', () => {
    mockUseApp.mockReturnValue({
      t: {},
    } as never);

    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('prevents event propagation when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionCard profile={mockProfile} onSelect={mockOnSelect} onFavorite={mockOnFavorite} />
    );

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    await user.click(favoriteButton);

    expect(mockOnFavorite).toHaveBeenCalled();
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('displays pet photo with correct alt text', () => {
    render(<AdoptionCard profile={mockProfile} onSelect={mockOnSelect} />);

    const image = screen.getByAltText('Buddy');
    expect(image).toHaveAttribute('src', 'https://example.com/buddy.jpg');
  });

  it('handles profile with minimal required fields', () => {
    const minimalProfile: AdoptionProfile = {
      _id: '2',
      petId: 'pet2',
      petName: 'Luna',
      petPhoto: 'https://example.com/luna.jpg',
      breed: 'Siamese',
      age: 2,
      gender: 'female',
      size: 'small',
      location: 'Los Angeles',
      shelterId: 'shelter2',
      shelterName: 'Cat Haven',
      status: 'available',
      description: 'Calm cat',
      healthStatus: 'Healthy',
      vaccinated: false,
      spayedNeutered: false,
      goodWithKids: false,
      goodWithPets: false,
      energyLevel: 'low',
      adoptionFee: 150,
      postedDate: new Date().toISOString(),
      personality: [],
      photos: [],
      contactEmail: 'cathaven@example.com',
    };

    render(<AdoptionCard profile={minimalProfile} onSelect={mockOnSelect} />);

    expect(screen.getByText('Luna')).toBeInTheDocument();
  });
});
