import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQueryClient } from '@/test-utils/react-query';
import { useUser, useUpdateUser, useUserPets } from '../use-user';
import { authAPI, petAPI } from '@/lib/api-services';

const mockedAuthAPI = vi.mocked(authAPI);
const mockedPetAPI = vi.mocked(petAPI);

vi.mock('@/lib/api-services', () => ({
  authAPI: {
    getCurrentUser: vi.fn(),
  },
  petAPI: {
    list: vi.fn(),
  },
}));

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch current user', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockedAuthAPI.getCurrentUser.mockResolvedValue(mockUser as never);

    const { result } = renderHookWithQueryClient(() => useUser());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(mockedAuthAPI.getCurrentUser.mock.calls.length).toBeGreaterThan(0);
  });

  it('should handle error', async () => {
    mockedAuthAPI.getCurrentUser.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHookWithQueryClient(() => useUser());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockedAuthAPI.getCurrentUser.mockResolvedValue(mockUser as never);

    const { result } = renderHookWithQueryClient(() => useUpdateUser());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
    });

    await result.current.mutateAsync({ displayName: 'Updated User' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe('useUserPets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user pets', async () => {
    const mockPets = [
      { id: 'pet-1', name: 'Fluffy', species: 'dog' },
      { id: 'pet-2', name: 'Buddy', species: 'cat' },
    ];

    mockedPetAPI.list.mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHookWithQueryClient(() => useUserPets());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPets);
    expect(mockedPetAPI.list.mock.calls.length).toBeGreaterThan(0);
  });

  it('should handle error', async () => {
    mockedPetAPI.list.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHookWithQueryClient(() => useUserPets());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
