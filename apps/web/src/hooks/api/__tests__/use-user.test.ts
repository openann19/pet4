import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser, useUpdateUser, useUserPets } from '../use-user';
import { authAPI, petAPI } from '@/lib/api-services';

vi.mock('@/lib/api-services', () => ({
  authAPI: {
    getCurrentUser: vi.fn(),
  },
  petAPI: {
    list: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

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

    vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser as never);

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(vi.mocked(authAPI.getCurrentUser)).toHaveBeenCalled();
  });

  it('should handle error', async () => {
    vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

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

    const updatedUser = {
      ...mockUser,
      displayName: 'Updated User',
    };

    vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser as never);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

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

    vi.mocked(petAPI.list).mockResolvedValue({
      items: mockPets,
    } as never);

    const { result } = renderHook(() => useUserPets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPets);
    expect(petAPI.list).toHaveBeenCalled();
  });

  it('should handle error', async () => {
    vi.mocked(petAPI.list).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useUserPets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
