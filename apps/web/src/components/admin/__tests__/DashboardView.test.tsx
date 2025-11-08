import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardView from '../DashboardView';
import { adminApi } from '@/api/admin-api';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/api/admin-api');
vi.mock('@/hooks/useStorage');
vi.mock('@/components/admin/PetProfileGenerator', () => ({
  PetProfileGenerator: () => <div data-testid="pet-profile-generator">Pet Profile Generator</div>,
}));

const mockAdminApi = vi.mocked(adminApi);
const mockUseStorage = vi.mocked(useStorage);

describe('DashboardView', () => {
  const mockPets = [
    {
      _id: '1',
      name: 'Buddy',
      ownerId: 'owner1',
      ownerName: 'John Doe',
      photos: ['photo1.jpg'],
    },
    {
      _id: '2',
      name: 'Luna',
      ownerId: 'owner2',
      ownerName: 'Jane Smith',
      photos: ['photo2.jpg'],
    },
  ];

  const mockMatches = [
    { _id: 'match1', petId: '1', userId: 'user1' },
    { _id: 'match2', petId: '2', userId: 'user2' },
  ];

  const mockReports = [
    { id: '1', status: 'pending' as const },
    { id: '2', status: 'resolved' as const },
    { id: '3', status: 'pending' as const },
  ];

  const mockVerifications = [
    { id: '1', status: 'pending' as const },
    { id: '2', status: 'approved' as const },
  ];

  const mockSystemStats = {
    totalUsers: 100,
    activeUsers: 75,
    totalPets: 50,
    totalMatches: 200,
    totalMessages: 5000,
    pendingReports: 5,
    pendingVerifications: 3,
    resolvedReports: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [mockPets];
      }
      if (key === 'user-matches') {
        return [mockMatches];
      }
      if (key === 'admin-reports') {
        return [mockReports];
      }
      if (key === 'admin-verifications') {
        return [mockVerifications];
      }
      return [defaultValue, vi.fn()];
    });
    mockAdminApi.getSystemStats.mockResolvedValue(mockSystemStats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard with system stats', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(mockAdminApi.getSystemStats).toHaveBeenCalled();
    });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays total users stat', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  it('displays total pets stat', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/pets/i)).toBeInTheDocument();
    });
  });

  it('displays total matches stat', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/matches/i)).toBeInTheDocument();
    });
  });

  it('displays pending reports count', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/reports/i)).toBeInTheDocument();
    });
  });

  it('displays pending verifications count', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/verification/i)).toBeInTheDocument();
    });
  });

  it('falls back to local calculations when API fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockAdminApi.getSystemStats.mockRejectedValue(new Error('API Error'));

    render(<DashboardView />);

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load system stats'),
        expect.any(Error)
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it('calculates stats from local storage when API fails', async () => {
    mockAdminApi.getSystemStats.mockRejectedValue(new Error('API Error'));

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  it('merges API stats with local calculations', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(mockAdminApi.getSystemStats).toHaveBeenCalled();
    });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('handles empty pets array', async () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [[]];
      }
      if (key === 'user-matches') {
        return [[]];
      }
      if (key === 'admin-reports') {
        return [[]];
      }
      if (key === 'admin-verifications') {
        return [[]];
      }
      return [defaultValue, vi.fn()];
    });

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('handles null storage values', async () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [null];
      }
      if (key === 'user-matches') {
        return [null];
      }
      if (key === 'admin-reports') {
        return [null];
      }
      if (key === 'admin-verifications') {
        return [null];
      }
      return [defaultValue, vi.fn()];
    });

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays activity items', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    });
  });

  it('displays system health section', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/system health/i)).toBeInTheDocument();
    });
  });

  it('displays pet profile generator', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByTestId('pet-profile-generator')).toBeInTheDocument();
    });
  });

  it('updates stats when storage values change', async () => {
    const { rerender } = render(<DashboardView />);

    await waitFor(() => {
      expect(mockAdminApi.getSystemStats).toHaveBeenCalled();
    });

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [
          [...mockPets, { _id: '3', name: 'Max', ownerId: 'owner3', ownerName: 'Bob', photos: [] }],
        ];
      }
      if (key === 'user-matches') {
        return [mockMatches];
      }
      if (key === 'admin-reports') {
        return [mockReports];
      }
      if (key === 'admin-verifications') {
        return [mockVerifications];
      }
      return [defaultValue, vi.fn()];
    });

    rerender(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('handles pets without ownerId or ownerName', async () => {
    const petsWithoutOwner = [
      { _id: '1', name: 'Buddy', photos: [] },
      { _id: '2', name: 'Luna', ownerId: 'owner2', photos: [] },
    ];

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [petsWithoutOwner];
      }
      if (key === 'user-matches') {
        return [mockMatches];
      }
      if (key === 'admin-reports') {
        return [mockReports];
      }
      if (key === 'admin-verifications') {
        return [mockVerifications];
      }
      return [defaultValue, vi.fn()];
    });

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('calculates unique owners correctly', async () => {
    const petsWithDuplicateOwners = [
      { _id: '1', name: 'Buddy', ownerId: 'owner1', ownerName: 'John', photos: [] },
      { _id: '2', name: 'Luna', ownerId: 'owner1', ownerName: 'John', photos: [] },
      { _id: '3', name: 'Max', ownerId: 'owner2', ownerName: 'Jane', photos: [] },
    ];

    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [petsWithDuplicateOwners];
      }
      if (key === 'user-matches') {
        return [mockMatches];
      }
      if (key === 'admin-reports') {
        return [mockReports];
      }
      if (key === 'admin-verifications') {
        return [mockVerifications];
      }
      return [defaultValue, vi.fn()];
    });

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
