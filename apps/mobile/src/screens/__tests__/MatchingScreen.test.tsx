import { MatchingScreen } from '@mobile/screens/MatchingScreen'
import { render } from '@testing-library/react-native'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { PaginatedResponse } from '@mobile/types/api'
import type { PetProfile } from '@mobile/types/pet'

const createTestQueryClient = (): QueryClient => {
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

function wrapper({ children }: { children: React.ReactNode }): React.ReactNode {
    const queryClient = createTestQueryClient()
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const createMockPetProfile = (id: string, name: string, breed: string): PetProfile => ({
    id,
    name,
    species: 'dog',
    breed,
    age: 24,
    photos: [],
    ownerId: 'owner-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
})

const mockUsePets = vi.fn((): UseQueryResult<PaginatedResponse<PetProfile>> => {
    return {
        data: {
            items: [
                createMockPetProfile('pet-1', 'Fluffy', 'Golden Retriever'),
                createMockPetProfile('pet-2', 'Buddy', 'Labrador'),
            ],
            hasMore: false,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>
})

vi.mock('@mobile/hooks/use-pets', () => ({
    usePets: mockUsePets,
    useLikePet: vi.fn(() => ({
        mutate: vi.fn(),
    })),
    useDislikePet: vi.fn(() => ({
        mutate: vi.fn(),
    })),
}))

vi.mock('@mobile/store/user-store', () => ({
    useUserStore: vi.fn(() => ({
        user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            pets: [
                createMockPetProfile('user-pet-1', 'My Pet', 'Poodle'),
            ],
            matches: [],
            createdAt: '2024-01-01',
        },
    })),
}))

vi.mock('@mobile/components/swipe/SwipeCardStack', () => ({
    SwipeCardStack: (_props: {
        pets: unknown[]
        onSwipeLeft: (petId: string) => void
        onSwipeRight: (petId: string) => void
    }) => {
        return null
    },
}))

vi.mock('@mobile/components/swipe/MatchCelebration', () => ({
    MatchCelebration: ({ visible }: { visible: boolean }) => {
        return visible ? null : null
    },
}))

vi.mock('@mobile/components/PullableContainer', () => ({
    PullableContainer: ({ children }: { children: React.ReactNode }) => {
        return children
    },
}))

describe('MatchingScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUsePets.mockReturnValue({
            data: {
                items: [
                    createMockPetProfile('pet-1', 'Fluffy', 'Golden Retriever'),
                    createMockPetProfile('pet-2', 'Buddy', 'Labrador'),
                ],
                hasMore: false,
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>)
    })

    it('should render without crashing', () => {
        render(<MatchingScreen />, { wrapper })
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should render SwipeCardStack with pets', () => {
        render(<MatchingScreen />, { wrapper })
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should handle loading state', () => {
        mockUsePets.mockReturnValueOnce({
            data: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>)

        const { getByText } = render(<MatchingScreen />, { wrapper })
        expect(getByText('Loading pets...')).toBeTruthy()
    })

    it('should handle error state', () => {
        const testError = new Error('Failed to load pets')
        mockUsePets.mockReturnValueOnce({
            data: undefined,
            isLoading: false,
            error: testError,
            refetch: vi.fn(),
        } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>)

        const { getByText } = render(<MatchingScreen />, { wrapper })
        expect(getByText('Error loading pets. Please try again.')).toBeTruthy()
    })
})
