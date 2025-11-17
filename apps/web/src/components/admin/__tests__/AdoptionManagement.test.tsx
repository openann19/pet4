import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdoptionManagement from '../AdoptionManagement';
import * as adoptionApiModule from '@/api/adoption-api';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/api/adoption-api', () => ({
  adoptionApi: {
    deleteProfile: vi.fn(),
  },
}));

vi.mock('@/hooks/use-storage');
vi.mock('@/components/adoption/AdoptionCard', () => ({
  AdoptionCard: ({ profile }: { profile: { petName: string } }) => (
    <div data-testid={`adoption-card-${profile.petName}`}>{profile.petName}</div>
  ),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAdoptionApi = adoptionApiModule.adoptionApi;

const mockUseStorage = vi.mocked(useStorage);

const mockProfiles = [
  {
    _id: '1',
    petId: 'pet1',
    petName: 'Buddy',
    petPhoto: 'https://example.com/buddy.jpg',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'male' as const,
    size: 'large' as const,
    location: 'New York',
    shelterId: 'shelter1',
    shelterName: 'Happy Paws',
    status: 'available' as const,
    description: 'Friendly dog',
    healthStatus: 'Healthy',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: true,
    energyLevel: 'high' as const,
    adoptionFee: 200,
    postedDate: new Date().toISOString(),
    personality: ['friendly', 'energetic'],
    photos: ['https://example.com/buddy.jpg'],
    contactEmail: 'shelter@example.com',
    contactPhone: '123-456-7890',
  },
  {
    _id: '2',
    petId: 'pet2',
    petName: 'Luna',
    petPhoto: 'https://example.com/luna.jpg',
    breed: 'Siamese',
    age: 2,
    gender: 'female' as const,
    size: 'small' as const,
    location: 'Los Angeles',
    shelterId: 'shelter2',
    shelterName: 'Cat Haven',
    status: 'pending' as const,
    description: 'Calm cat',
    healthStatus: 'Healthy',
    vaccinated: true,
    spayedNeutered: true,
    goodWithKids: true,
    goodWithPets: false,
    energyLevel: 'low' as const,
    adoptionFee: 150,
    postedDate: new Date(Date.now() - 86400000).toISOString(),
    personality: ['calm', 'affectionate'],
    photos: ['https://example.com/luna.jpg'],
    contactEmail: 'cathaven@example.com',
  },
];

describe('AdoptionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      const setValue = vi.fn().mockResolvedValue(undefined);
      const deleteValue = vi.fn().mockResolvedValue(undefined);
      if (key === 'adoption-profiles') {
        return [mockProfiles, setValue, deleteValue];
      }
      if (key === 'flagged-adoption-profiles') {
        return [['1'], setValue, deleteValue];
      }
      if (key === 'hidden-adoption-profiles') {
        return [[], setValue, deleteValue];
      }
      return [defaultValue, setValue, deleteValue];
    });
    vi.mocked(mockAdoptionApi.deleteProfile).mockResolvedValue(undefined);
  });

  it('should render adoption management interface', () => {
    render(<AdoptionManagement />);

    expect(screen.getByRole('main', { name: 'Adoption Management' })).toBeInTheDocument();
    expect(screen.getByText('Adoption Profiles')).toBeInTheDocument();
    expect(screen.getByText('Manage adoption listings and applications')).toBeInTheDocument();
  });

  it('should display statistics cards', () => {
    render(<AdoptionManagement />);

    expect(screen.getByText('Total Profiles')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Adopted')).toBeInTheDocument();
  });

  it('should display adoption profiles', () => {
    render(<AdoptionManagement />);

    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  it('should filter profiles by search query', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const searchInput = screen.getByLabelText('Search adoption profiles');
    await user.type(searchInput, 'Buddy');

    await waitFor(() => {
      expect(screen.getByText('Buddy')).toBeInTheDocument();
      expect(screen.queryByText('Luna')).not.toBeInTheDocument();
    });
  });

  it('should filter profiles by tab', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const availableTab = screen.getByRole('tab', { name: 'Available' });
    await user.click(availableTab);

    await waitFor(() => {
      expect(screen.getByText('Buddy')).toBeInTheDocument();
      expect(screen.queryByText('Luna')).not.toBeInTheDocument();
    });
  });

  it('should show flagged profiles count', () => {
    render(<AdoptionManagement />);

    const flaggedTab = screen.getByRole('tab', { name: /Flagged/ });
    expect(flaggedTab).toBeInTheDocument();
    const badge = within(flaggedTab).queryByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('should handle hide profile', async () => {
    const user = userEvent.setup();
    const setHiddenProfiles = vi.fn();
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    mockUseStorage.mockImplementation((key: string) => {
      if (key === 'hidden-adoption-profiles') {
        return [[], setHiddenProfiles, deleteValue];
      }
      if (key === 'adoption-profiles') {
        const setValue = vi.fn().mockResolvedValue(undefined);
        return [mockProfiles, setValue, deleteValue];
      }
      if (key === 'flagged-adoption-profiles') {
        const setValue = vi.fn().mockResolvedValue(undefined);
        return [['1'], setValue, deleteValue];
      }
      const setValue = vi.fn().mockResolvedValue(undefined);
      return [[], setValue, deleteValue];
    });

    render(<AdoptionManagement />);

    const hideButtons = screen.getAllByLabelText(/Hide/);
    const firstHideButton = hideButtons[0];
    if (firstHideButton) {
      await user.click(firstHideButton);

      await waitFor(() => {
        expect(setHiddenProfiles).toHaveBeenCalled();
      });
    }
  });

  it('should handle unhide profile', async () => {
    const user = userEvent.setup();
    const setHiddenProfiles = vi.fn();
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    mockUseStorage.mockImplementation((key: string) => {
      if (key === 'hidden-adoption-profiles') {
        return [['1'], setHiddenProfiles, deleteValue];
      }
      if (key === 'adoption-profiles') {
        const setValue = vi.fn().mockResolvedValue(undefined);
        return [mockProfiles, setValue, deleteValue];
      }
      if (key === 'flagged-adoption-profiles') {
        const setValue = vi.fn().mockResolvedValue(undefined);
        return [['1'], setValue, deleteValue];
      }
      const setValue = vi.fn().mockResolvedValue(undefined);
      return [[], setValue, deleteValue];
    });

    render(<AdoptionManagement />);

    const unhideButtons = screen.getAllByLabelText(/Unhide/);
    const firstUnhideButton = unhideButtons[0];
    if (firstUnhideButton) {
      await user.click(firstUnhideButton);

      await waitFor(() => {
        expect(setHiddenProfiles).toHaveBeenCalled();
      });
    }
  });

  it('should open delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText('Delete Adoption Profile')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });
    }
  });

  it('should delete profile when confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(mockAdoptionApi.deleteProfile).mockResolvedValue(undefined);

    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockAdoptionApi.deleteProfile).toHaveBeenCalledWith('1');
      });
    }
  });

  it('should handle delete error gracefully', async () => {
    const user = userEvent.setup();
    const deleteError = new Error('Delete failed');
    vi.mocked(mockAdoptionApi.deleteProfile).mockRejectedValue(deleteError);

    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockAdoptionApi.deleteProfile).toHaveBeenCalled();
      });
    }
  });

  it('should close delete dialog when cancelled', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    }
  });

  it('should display empty state when no profiles match filter', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const searchInput = screen.getByLabelText('Search adoption profiles');
    await user.type(searchInput, 'NonExistentPet');

    await waitFor(() => {
      expect(screen.getByText('No adoption profiles found')).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<AdoptionManagement />);

    expect(screen.getByRole('main', { name: 'Adoption Management' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search adoption profiles')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Filter adoption profiles' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Adoption profiles list' })).toBeInTheDocument();
  });

  it('should display profile name in delete dialog', async () => {
    const user = userEvent.setup();
    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Profile: Buddy/)).toBeInTheDocument();
      });
    }
  });

  it('should disable delete button while deleting', async () => {
    const user = userEvent.setup();
    let resolveDelete: (() => void) | undefined;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    vi.mocked(mockAdoptionApi.deleteProfile).mockReturnValue(deletePromise);

    render(<AdoptionManagement />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      await user.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });

      if (resolveDelete) {
        resolveDelete();
        await waitFor(() => {
          expect(confirmButton).not.toBeDisabled();
        });
      }
    }
  });
});
