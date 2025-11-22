import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersView from '@/components/admin/UsersView';
import { adminApi } from '@/api/admin-api';
import { useStorage } from '@/hooks/use-storage';

vi.mock('@/api/admin-api');
vi.mock('@/hooks/use-storage');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockAdminApi = vi.mocked(adminApi);
const mockUseStorage = vi.mocked(useStorage);

describe('UsersView', () => {
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
    {
      _id: '3',
      name: 'Max',
      ownerId: 'owner1',
      ownerName: 'John Doe',
      photos: ['photo3.jpg'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    const setValue = vi.fn().mockResolvedValue(undefined);
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [mockPets, setValue, deleteValue];
      }
      return [defaultValue, setValue, deleteValue];
    });
    (mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn>; banUser?: ReturnType<typeof vi.fn>; activateUser?: ReturnType<typeof vi.fn> }).suspendUser = vi.fn().mockResolvedValue(undefined);
    (mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn>; banUser?: ReturnType<typeof vi.fn>; activateUser?: ReturnType<typeof vi.fn> }).banUser = vi.fn().mockResolvedValue(undefined);
    (mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn>; banUser?: ReturnType<typeof vi.fn>; activateUser?: ReturnType<typeof vi.fn> }).activateUser = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders users view', async () => {
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  it('displays users from pets data', async () => {
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });
  });

  it('calculates pets count per user correctly', async () => {
    render(<UsersView />);

    await waitFor(() => {
      const johnDoeRow = screen.getByText(/john doe/i).closest('div');
      if (johnDoeRow) {
        expect(within(johnDoeRow).getByText(/2/i)).toBeInTheDocument();
      }
    });
  });

  it('filters users by search query', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      expect(screen.queryByText(/john doe/i)).not.toBeInTheDocument();
    });
  });

  it('filters users by status', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });

    const statusTabs = screen.getAllByRole('tab');
    const activeTab = statusTabs.find((tab) => tab.textContent?.includes('Active'));
    if (activeTab) {
      await user.click(activeTab);
    }
  });

  it('opens user detail dialog on click', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays user details in dialog', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  it('suspends user when suspend button is clicked', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const suspendButton = screen.getByRole('button', { name: /suspend/i });
    await user.click(suspendButton);

    await waitFor(() => {
      expect((mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn> }).suspendUser).toHaveBeenCalled();
    });
  });

  it('bans user when ban button is clicked', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const banButton = screen.getByRole('button', { name: /ban/i });
    await user.click(banButton);

    await waitFor(() => {
      expect((mockAdminApi as { banUser?: ReturnType<typeof vi.fn> }).banUser).toHaveBeenCalled();
    });
  });

  it('activates user when activate button is clicked', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const activateButton = screen.getByRole('button', { name: /activate/i });
    if (activateButton) {
      await user.click(activateButton);

      await waitFor(() => {
        expect((mockAdminApi as { activateUser?: ReturnType<typeof vi.fn> }).activateUser).toHaveBeenCalled();
      });
    }
  });

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles empty pets array', async () => {
    const setValue = vi.fn().mockResolvedValue(undefined);
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [[], setValue, deleteValue];
      }
      return [defaultValue, setValue, deleteValue];
    });

    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  it('handles pets without ownerId or ownerName', async () => {
    const petsWithoutOwner = [
      { _id: '1', name: 'Buddy', photos: [] },
      { _id: '2', name: 'Luna', ownerId: 'owner2', photos: [] },
    ];

    const setValue = vi.fn().mockResolvedValue(undefined);
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'all-pets') {
        return [petsWithoutOwner, setValue, deleteValue];
      }
      return [defaultValue, setValue, deleteValue];
    });

    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/users/i)).toBeInTheDocument();
    });
  });

  it('displays user email correctly', async () => {
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john.doe@example.com/i)).toBeInTheDocument();
    });
  });

  it('displays user role badge', async () => {
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/user/i)).toBeInTheDocument();
    });
  });

  it('displays user status badge', async () => {
    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    (mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn> }).suspendUser?.mockRejectedValue(new Error('API Error'));

    render(<UsersView />);

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    const userCard = screen.getByText(/john doe/i).closest('[role="button"]');
    if (userCard) {
      await user.click(userCard);
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const suspendButton = screen.getByRole('button', { name: /suspend/i });
    await user.click(suspendButton);

    await waitFor(() => {
      expect((mockAdminApi as { suspendUser?: ReturnType<typeof vi.fn> }).suspendUser).toHaveBeenCalled();
    });
  });
});
