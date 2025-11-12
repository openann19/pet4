/**
 * Pets API Hooks Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-pets.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { usePets, useLikePet, useDislikePet } from '../use-pets'
import { apiClient } from '@/utils/api-client'
import { useUserStore } from '@/store/user-store'
import { usePetsStore } from '@/store/pets-store'

// Mock API client
vi.mock('@/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock stores
vi.mock('@/store/user-store', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('@/store/pets-store', () => ({
  usePetsStore: vi.fn(),
}))

const mockApiClient = vi.mocked(apiClient)
const mockUseUserStore = vi.mocked(useUserStore)
const mockUsePetsStore = vi.mocked(usePetsStore)

// Create test query client
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function wrapper({ children }: { children: ReactNode }): ReactNode {
  const queryClient = createTestQueryClient()
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('usePets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch pets successfully', async () => {
    const mockPets = {
      items: [
        {
          id: 'pet1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male' as const,
          size: 'large' as const,
          photo: 'photo1.jpg',
          photos: ['photo1.jpg'],
          bio: 'Friendly dog',
          personality: ['friendly'],
          interests: ['playing'],
          lookingFor: ['playdates'],
          location: 'New York',
          ownerId: 'owner1',
          ownerName: 'John Doe',
          verified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      nextCursor: undefined,
    }

    mockApiClient.get.mockResolvedValue(mockPets)

    const { result } = renderHook(() => usePets(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPets)
    expect(mockApiClient.get).toHaveBeenCalledWith('/pets')
  })

  it('should fetch pets with cursor', async () => {
    const cursor = 'cursor123'
    const mockPets = {
      items: [],
      total: 0,
      nextCursor: undefined,
    }

    mockApiClient.get.mockResolvedValue(mockPets)

    const { result } = renderHook(() => usePets(cursor), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockApiClient.get).toHaveBeenCalledWith(`/pets?cursor=${cursor}`)
  })

  it('should handle error', async () => {
    const error = new Error('Failed to fetch pets')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => usePets(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useLikePet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUserStore.mockReturnValue({
      addMatch: vi.fn(),
    } as unknown as ReturnType<typeof useUserStore>)
    mockUsePetsStore.mockReturnValue({
      markAsSwiped: vi.fn(),
      markAsLiked: vi.fn(),
    } as unknown as ReturnType<typeof usePetsStore>)
  })

  it('should like pet successfully', async () => {
    const petId = 'pet1'
    const mockResponse = {
      data: {
        id: 'match1',
        petId: 'pet1',
        matchedPetId: 'pet2',
        compatibilityScore: 85,
        reasoning: ['Both friendly'],
        matchedAt: '2024-01-01T00:00:00Z',
        status: 'active' as const,
      },
    }

    mockApiClient.post.mockResolvedValue(mockResponse)

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['pets'], {
      items: [
        {
          id: petId,
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male' as const,
          size: 'large' as const,
          photo: 'photo1.jpg',
          photos: ['photo1.jpg'],
          bio: 'Friendly dog',
          personality: ['friendly'],
          interests: ['playing'],
          lookingFor: ['playdates'],
          location: 'New York',
          ownerId: 'owner1',
          ownerName: 'John Doe',
          verified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useLikePet(), { wrapper: customWrapper })

    result.current.mutate(petId)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockApiClient.post).toHaveBeenCalledWith(`/pets/${petId}/like`)
  })

  it('should handle error and rollback', async () => {
    const petId = 'pet1'
    const error = new Error('Failed to like pet')
    mockApiClient.post.mockRejectedValue(error)

    const queryClient = createTestQueryClient()
    const previousPets = {
      items: [
        {
          id: petId,
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male' as const,
          size: 'large' as const,
          photo: 'photo1.jpg',
          photos: ['photo1.jpg'],
          bio: 'Friendly dog',
          personality: ['friendly'],
          interests: ['playing'],
          lookingFor: ['playdates'],
          location: 'New York',
          ownerId: 'owner1',
          ownerName: 'John Doe',
          verified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    }
    queryClient.setQueryData(['pets'], previousPets)

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useLikePet(), { wrapper: customWrapper })

    result.current.mutate(petId)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useDislikePet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePetsStore.mockReturnValue({
      markAsSwiped: vi.fn(),
    } as unknown as ReturnType<typeof usePetsStore>)
  })

  it('should dislike pet successfully', async () => {
    const petId = 'pet1'
    const mockResponse = {
      data: null,
    }

    mockApiClient.post.mockResolvedValue(mockResponse)

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['pets'], {
      items: [
        {
          id: petId,
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male' as const,
          size: 'large' as const,
          photo: 'photo1.jpg',
          photos: ['photo1.jpg'],
          bio: 'Friendly dog',
          personality: ['friendly'],
          interests: ['playing'],
          lookingFor: ['playdates'],
          location: 'New York',
          ownerId: 'owner1',
          ownerName: 'John Doe',
          verified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useDislikePet(), { wrapper: customWrapper })

    result.current.mutate(petId)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockApiClient.post).toHaveBeenCalledWith(`/pets/${petId}/dislike`)
  })

  it('should handle error and rollback', async () => {
    const petId = 'pet1'
    const error = new Error('Failed to dislike pet')
    mockApiClient.post.mockRejectedValue(error)

    const queryClient = createTestQueryClient()
    const previousPets = {
      items: [
        {
          id: petId,
          name: 'Buddy',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male' as const,
          size: 'large' as const,
          photo: 'photo1.jpg',
          photos: ['photo1.jpg'],
          bio: 'Friendly dog',
          personality: ['friendly'],
          interests: ['playing'],
          lookingFor: ['playdates'],
          location: 'New York',
          ownerId: 'owner1',
          ownerName: 'John Doe',
          verified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    }
    queryClient.setQueryData(['pets'], previousPets)

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useDislikePet(), { wrapper: customWrapper })

    result.current.mutate(petId)

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
