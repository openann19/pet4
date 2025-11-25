import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatches } from '@/hooks/useMatches';
import { matchingAPI, petAPI } from '@/lib/api-services';
import { usePets } from '@/hooks/api/use-pets';

// Unmock React Query to use real implementation for this test
vi.unmock('@tanstack/react-query');

vi.mock('@/lib/api-services', () => ({
  matchingAPI: {
    getMatches: vi.fn(),
  },
  petAPI: {
    getById: vi.fn(),
  },
}));

vi.mock('@/hooks/api/use-pets', () => ({
  usePets: vi.fn(),
}));

vi.mock('@/lib/matching', () => ({
  generateMatchReasoning: vi.fn(() => Promise.resolve(['Reason 1', 'Reason 2'])),
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch matches for pet', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        species: 'dog' as const,
        breed: 'Golden Retriever',
        age: 3,
        size: 'large' as const,
        gender: 'male' as const,
        photos: [
          {
            id: 'photo-1',
            url: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            uploadedAt: new Date().toISOString(),
          },
        ],
        personality: ['friendly', 'playful'],
        bio: 'A friendly dog',
        location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        ownerId: 'owner-1',
      },
    ];
    const mockMatches = [
      {
        id: 'match-1',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        status: 'active' as const,
        chatRoomId: 'room-1',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
    ];
    const mockMatchedPet = {
      id: 'pet-2',
      name: 'Buddy',
      species: 'cat' as const,
      breed: 'Persian',
      age: 2,
      size: 'small' as const,
      gender: 'female' as const,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/photo2.jpg',
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          order: 0,
          uploadedAt: new Date().toISOString(),
        },
      ],
      personality: ['calm', 'affectionate'],
      bio: 'A calm cat',
      location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      ownerId: 'owner-2',
    };

    vi.mocked(usePets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);
    vi.mocked(petAPI.getById).mockResolvedValue(mockMatchedPet as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0]?.id).toBe('match-1');
    expect(matchingAPI.getMatches).toHaveBeenCalledWith('pet-1');
  });

  it('should filter active matches', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        species: 'dog' as const,
        breed: 'Golden Retriever',
        age: 3,
        size: 'large' as const,
        gender: 'male' as const,
        photos: [
          {
            id: 'photo-1',
            url: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            uploadedAt: new Date().toISOString(),
          },
        ],
        personality: ['friendly'],
        bio: 'A friendly dog',
        location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        ownerId: 'owner-1',
      },
    ];
    const mockMatches = [
      {
        id: 'match-1',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        status: 'active' as const,
        chatRoomId: 'room-1',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
      {
        id: 'match-2',
        petAId: 'pet-1',
        petBId: 'pet-3',
        compatibilityScore: 70,
        status: 'archived' as const,
        chatRoomId: 'room-2',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
    ];
    const mockMatchedPet = {
      id: 'pet-2',
      name: 'Buddy',
      species: 'cat' as const,
      breed: 'Persian',
      age: 2,
      size: 'small' as const,
      gender: 'female' as const,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/photo2.jpg',
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          order: 0,
          uploadedAt: new Date().toISOString(),
        },
      ],
      personality: ['calm'],
      bio: 'A calm cat',
      location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      ownerId: 'owner-2',
    };

    vi.mocked(usePets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);
    vi.mocked(petAPI.getById).mockResolvedValue(mockMatchedPet as never);

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
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        species: 'dog' as const,
        breed: 'Golden Retriever',
        age: 3,
        size: 'large' as const,
        gender: 'male' as const,
        photos: [
          {
            id: 'photo-1',
            url: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            uploadedAt: new Date().toISOString(),
          },
        ],
        personality: ['friendly'],
        bio: 'A friendly dog',
        location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        ownerId: 'owner-1',
      },
    ];
    const mockMatches = [
      {
        id: 'match-1',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        status: 'active' as const,
        chatRoomId: 'room-1',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
    ];
    const mockMatchedPet = {
      id: 'pet-2',
      name: 'Buddy',
      species: 'cat' as const,
      breed: 'Persian',
      age: 2,
      size: 'small' as const,
      gender: 'female' as const,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/photo2.jpg',
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          order: 0,
          uploadedAt: new Date().toISOString(),
        },
      ],
      personality: ['calm'],
      bio: 'A calm cat',
      location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      ownerId: 'owner-2',
    };

    vi.mocked(usePets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);
    vi.mocked(petAPI.getById).mockResolvedValue(mockMatchedPet as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pet = {
      id: 'pet-2',
      name: 'Buddy',
      breed: 'Persian',
      age: 2,
      gender: 'female',
      size: 'small',
      photo: 'https://example.com/photo2.jpg',
      photos: ['https://example.com/photo2.jpg'],
      bio: 'A calm cat',
      personality: ['calm'],
      interests: [],
      lookingFor: [],
      location: 'City',
      coordinates: { latitude: 0, longitude: 0 },
      ownerId: 'owner-2',
      ownerName: '',
      verified: true,
      createdAt: new Date().toISOString(),
    };
    const match = result.current.matches[0];
    if (!match) {
      throw new Error('Match not found');
    }

    act(() => {
      result.current.selectPet(pet, match);
    });

    expect(result.current.selectedPet).toEqual(pet);
    expect(result.current.selectedMatch).toEqual(match);
  });

  it('should clear selection', async () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        species: 'dog' as const,
        breed: 'Golden Retriever',
        age: 3,
        size: 'large' as const,
        gender: 'male' as const,
        photos: [
          {
            id: 'photo-1',
            url: 'https://example.com/photo.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            uploadedAt: new Date().toISOString(),
          },
        ],
        personality: ['friendly'],
        bio: 'A friendly dog',
        location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        ownerId: 'owner-1',
      },
    ];
    const mockMatches = [
      {
        id: 'match-1',
        petAId: 'pet-1',
        petBId: 'pet-2',
        compatibilityScore: 85,
        status: 'active' as const,
        chatRoomId: 'room-1',
        createdAt: new Date().toISOString(),
        lastInteractionAt: new Date().toISOString(),
      },
    ];
    const mockMatchedPet = {
      id: 'pet-2',
      name: 'Buddy',
      species: 'cat' as const,
      breed: 'Persian',
      age: 2,
      size: 'small' as const,
      gender: 'female' as const,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/photo2.jpg',
          thumbnailUrl: 'https://example.com/thumb2.jpg',
          order: 0,
          uploadedAt: new Date().toISOString(),
        },
      ],
      personality: ['calm'],
      bio: 'A calm cat',
      location: { latitude: 0, longitude: 0, city: 'City', country: 'Country' },
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      ownerId: 'owner-2',
    };

    vi.mocked(usePets).mockReturnValue({
      data: mockPets,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
    } as never);

    vi.mocked(matchingAPI.getMatches).mockResolvedValue(mockMatches as never);
    vi.mocked(petAPI.getById).mockResolvedValue(mockMatchedPet as never);

    const { result } = renderHook(() => useMatches('pet-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const pet = {
      id: 'pet-2',
      name: 'Buddy',
      breed: 'Persian',
      age: 2,
      gender: 'female',
      size: 'small',
      photo: 'https://example.com/photo2.jpg',
      photos: ['https://example.com/photo2.jpg'],
      bio: 'A calm cat',
      personality: ['calm'],
      interests: [],
      lookingFor: [],
      location: 'City',
      coordinates: { latitude: 0, longitude: 0 },
      ownerId: 'owner-2',
      ownerName: '',
      verified: true,
      createdAt: new Date().toISOString(),
    };
    const match = result.current.matches[0];
    if (!match) {
      throw new Error('Match not found');
    }

    act(() => {
      result.current.selectPet(pet, match);
      result.current.clearSelection();
    });

    expect(result.current.selectedPet).toBe(null);
    expect(result.current.selectedMatch).toBe(null);
  });
});
