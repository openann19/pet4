import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserPets, useUserMatches, useUserSwipes, useUserPlaydates } from '../use-user-data';
import { APIClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  APIClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUserPets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user pets', async () => {
    const mockPets = [
      { id: '1', name: 'Fluffy', breed: 'Golden Retriever', age: 3, photos: [] },
      { id: '2', name: 'Buddy', breed: 'Labrador', age: 2, photos: [] },
    ];

    vi.mocked(APIClient.get).mockResolvedValue({
      data: { pets: mockPets },
      status: 200,
    } as never);

    const { result } = renderHook(() => useUserPets('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPets);
    expect(APIClient.get).toHaveBeenCalledWith('/users/user-1/pets');
  });

  it('should handle error', async () => {
    vi.mocked(APIClient.get).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useUserPets('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useUserMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user matches', async () => {
    const mockMatches = [
      {
        id: '1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(APIClient.get).mockResolvedValue({
      data: { matches: mockMatches },
      status: 200,
    } as never);

    const { result } = renderHook(() => useUserMatches('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMatches);
  });
});

describe('useUserSwipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user swipes', async () => {
    const mockSwipes = [
      {
        id: '1',
        petId: 'pet-1',
        targetPetId: 'pet-2',
        action: 'like' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(APIClient.get).mockResolvedValue({
      data: { swipes: mockSwipes },
      status: 200,
    } as never);

    const { result } = renderHook(() => useUserSwipes('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSwipes);
  });
});

describe('useUserPlaydates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user playdates', async () => {
    const mockPlaydates = [
      {
        id: '1',
        title: 'Park Playdate',
        location: 'Central Park',
        date: new Date().toISOString(),
        participants: ['user-1', 'user-2'],
      },
    ];

    vi.mocked(APIClient.get).mockResolvedValue({
      data: { playdates: mockPlaydates },
      status: 200,
    } as never);

    const { result } = renderHook(() => useUserPlaydates('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPlaydates);
  });
});
