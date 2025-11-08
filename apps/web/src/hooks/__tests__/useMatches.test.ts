import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatches } from '../useMatches';
import { matchingAPI } from '@/lib/api-services';
import { useUserPets } from '@/hooks/api/use-user';

vi.mock('@/lib/api-services', () => ({
  matchingAPI: {
    getMatches: vi.fn(),
  },
}));

vi.mock('@/hooks/api/use-user', () => ({
  useUserPets: vi.fn(),
}));

vi.mock('@/lib/matching', () => ({
  generateMatchReasoning: vi.fn(() => ['Reason 1', 'Reason 2']),
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

describe('useMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch matches for pet', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];
    const mockMatches = [
      {
        id: 'match-1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(useUserPets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matches).toEqual(mockMatches);
    expect(matchingAPI.getMatches).toHaveBeenCalledWith('pet-1');
  });

  it('should filter active matches', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];
    const mockMatches = [
      {
        id: 'match-1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'match-2',
        petId: 'pet-1',
        matchedPetId: 'pet-3',
        status: 'passed' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(useUserPets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matchedPets.length).toBe(1);
    expect(result.current.matchedPets[0]?.match.status).toBe('active');
  });

  it('should select pet and match', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];
    const mockMatches = [
      {
        id: 'match-1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(useUserPets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pet = { id: 'pet-2', name: 'Buddy', species: 'cat' };
    const match = mockMatches[0];

    act(() => {
      result.current.selectPet(pet, match);
    });

    expect(result.current.selectedPet).toEqual(pet);
    expect(result.current.selectedMatch).toEqual(match);
  });

  it('should clear selection', async () => {
    const mockPets = [{ id: 'pet-1', name: 'Fluffy', species: 'dog' }];
    const mockMatches = [
      {
        id: 'match-1',
        petId: 'pet-1',
        matchedPetId: 'pet-2',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(useUserPets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectPet({ id: 'pet-2', name: 'Buddy', species: 'cat' }, mockMatches[0]);
      result.current.clearSelection();
    });

    expect(result.current.selectedPet).toBe(null);
    expect(result.current.selectedMatch).toBe(null);
  });
});
