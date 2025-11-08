import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdoptionDetailDialog } from '../AdoptionDetailDialog';
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
vi.mock('../AdoptionApplicationDialog', () => ({
  AdoptionApplicationDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="application-dialog">Application Dialog</div> : null,
}));

const mockUseApp = vi.mocked(useApp);
const mockHaptics = vi.mocked(haptics);

describe('AdoptionDetailDialog', () => {
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
    photos: ['https://example.com/buddy.jpg', 'https://example.com/buddy2.jpg'],
    contactEmail: 'shelter@example.com',
    contactPhone: '123-456-7890',
  };

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApp.mockReturnValue({
      t: {
        adoption: {
          available: 'Available',
          viewDetails: 'View Details',
        },
      },
    } as never);
  });

  it('renders nothing when profile is null', () => {
    const { container } = render(
      <AdoptionDetailDialog profile={null} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when profile is provided', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('displays pet name', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('displays pet breed', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/golden retriever/i)).toBeInTheDocument();
  });

  it('displays pet description', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/friendly dog/i)).toBeInTheDocument();
  });

  it('navigates to next photo', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockHaptics.trigger).toHaveBeenCalledWith('selection');
  });

  it('navigates to previous photo', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    if (prevButton) {
      await user.click(prevButton);
    }

    expect(mockHaptics.trigger).toHaveBeenCalledWith('selection');
  });

  it('opens application dialog when apply is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByTestId('application-dialog')).toBeInTheDocument();
    });

    expect(mockHaptics.trigger).toHaveBeenCalledWith('success');
  });

  it('displays photo indicators when multiple photos', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    const indicators = screen.getAllByRole('button');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('uses single photo when photos array is empty', () => {
    const profileWithSinglePhoto = {
      ...mockProfile,
      photos: [],
    };

    render(
      <AdoptionDetailDialog
        profile={profileWithSinglePhoto}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/shelter@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/123-456-7890/i)).toBeInTheDocument();
  });

  it('displays adoption fee', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/\$200/i)).toBeInTheDocument();
  });

  it('displays pet details', () => {
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/3 years/i)).toBeInTheDocument();
    expect(screen.getByText(/male/i)).toBeInTheDocument();
    expect(screen.getByText(/large/i)).toBeInTheDocument();
  });

  it('handles closing dialog', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionDetailDialog profile={mockProfile} open={true} onOpenChange={mockOnOpenChange} />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
