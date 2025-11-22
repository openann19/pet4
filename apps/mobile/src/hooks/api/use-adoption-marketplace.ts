/**
 * React Query hooks for adoption marketplace (Mobile)
 * Mobile adaptation of web adoption marketplace with React Query patterns
 * Location: apps/mobile/src/hooks/api/use-adoption-marketplace.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { queryKeys } from '@/lib/query-client'
import { apiClient } from '@/utils/api-client'

// Types based on web implementation but mobile-adapted
export interface AdoptionListing {
  readonly id: string
  readonly ownerId: string
  readonly ownerName: string
  readonly ownerAvatar?: string
  readonly petId: string
  readonly petName: string
  readonly petBreed: string
  readonly petAge: number
  readonly petGender: 'male' | 'female'
  readonly petSize: 'tiny' | 'small' | 'medium' | 'large' | 'extra-large'
  readonly petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other'
  readonly petColor?: string
  readonly petPhotos: readonly string[]
  readonly petDescription: string
  readonly status: 'active' | 'pending_review' | 'adopted' | 'withdrawn'
  readonly fee?: { amount: number; currency: string } | null
  readonly location: {
    readonly city: string
    readonly country: string
    readonly lat?: number
    readonly lon?: number
    readonly privacyRadiusM?: number
  }
  readonly requirements: readonly string[]
  readonly vaccinated: boolean
  readonly spayedNeutered: boolean
  readonly microchipped: boolean
  readonly goodWithKids: boolean
  readonly goodWithPets: boolean
  readonly goodWithCats?: boolean
  readonly goodWithDogs?: boolean
  readonly energyLevel: 'low' | 'medium' | 'high' | 'very-high'
  readonly temperament: readonly string[]
  readonly specialNeeds?: string
  readonly reasonForAdoption: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly viewsCount: number
  readonly applicationsCount: number
  readonly featured: boolean
}

export interface AdoptionListingFilters {
  readonly species?: readonly string[]
  readonly breed?: readonly string[]
  readonly ageMin?: number
  readonly ageMax?: number
  readonly size?: readonly string[]
  readonly location?: string
  readonly maxDistance?: number
  readonly userLocation?: {
    readonly lat: number
    readonly lon: number
  }
  readonly goodWithKids?: boolean
  readonly goodWithPets?: boolean
  readonly goodWithCats?: boolean
  readonly goodWithDogs?: boolean
  readonly energyLevel?: readonly string[]
  readonly temperament?: readonly string[]
  readonly vaccinated?: boolean
  readonly spayedNeutered?: boolean
  readonly feeMax?: number
  readonly status?: readonly string[]
  readonly featured?: boolean
  readonly sortBy?: 'recent' | 'distance' | 'age' | 'fee_low' | 'fee_high'
}

export interface AdoptionMarketplaceResponse {
  readonly listings: readonly AdoptionListing[]
  readonly total: number
  readonly hasMore: boolean
}

export interface MarketplaceMode {
  readonly mode: 'browse' | 'my-listings' | 'applications'
}

// API functions
async function fetchListings(filters?: AdoptionListingFilters): Promise<AdoptionMarketplaceResponse> {
  const params = new URLSearchParams()
  
  if (filters?.species?.length) {
    params.append('species', filters.species.join(','))
  }
  if (filters?.breed?.length) {
    params.append('breed', filters.breed.join(','))
  }
  if (filters?.ageMin !== undefined) {
    params.append('ageMin', String(filters.ageMin))
  }
  if (filters?.ageMax !== undefined) {
    params.append('ageMax', String(filters.ageMax))
  }
  if (filters?.size?.length) {
    params.append('size', filters.size.join(','))
  }
  if (filters?.location) {
    params.append('location', filters.location)
  }
  if (filters?.maxDistance !== undefined) {
    params.append('maxDistance', String(filters.maxDistance))
  }
  if (filters?.goodWithKids !== undefined) {
    params.append('goodWithKids', String(filters.goodWithKids))
  }
  if (filters?.goodWithPets !== undefined) {
    params.append('goodWithPets', String(filters.goodWithPets))
  }
  if (filters?.vaccinated !== undefined) {
    params.append('vaccinated', String(filters.vaccinated))
  }
  if (filters?.spayedNeutered !== undefined) {
    params.append('spayedNeutered', String(filters.spayedNeutered))
  }
  if (filters?.feeMax !== undefined) {
    params.append('feeMax', String(filters.feeMax))
  }
  if (filters?.sortBy) {
    params.append('sortBy', filters.sortBy)
  }

  const queryString = params.toString()
  const url = `/api/v1/adoption/marketplace/listings${queryString ? `?${queryString}` : ''}`

  const data = await apiClient.get<AdoptionMarketplaceResponse>(url, {
    cacheKey: `adoption:marketplace:${queryString}`,
    skipCache: false,
  })

  return data
}

async function fetchUserListings(userId: string): Promise<readonly AdoptionListing[]> {
  const data = await apiClient.get<{ listings?: readonly AdoptionListing[] } | readonly AdoptionListing[]>(
    `/api/v1/adoption/marketplace/users/${userId}/listings`,
    {
      cacheKey: `adoption:user:${userId}:listings`,
      skipCache: false,
    }
  )
  return Array.isArray(data) ? data : (data as { listings?: readonly AdoptionListing[] }).listings || []
}

async function fetchCurrentUser(): Promise<{ id: string; name: string } | null> {
  try {
    const data = await apiClient.get<{ user?: { id: string; name: string } }>('/api/v1/auth/me', {
      cacheKey: 'auth:current-user',
      skipCache: false,
    })
    return data.user || null
  } catch {
    return null
  }
}

async function incrementViewCount(listingId: string): Promise<void> {
  await apiClient.post(`/api/v1/adoption/marketplace/listings/${listingId}/view`, {}, {
    skipCache: true,
  })
}

// React Query hooks
export function useAdoptionListings(
  filters?: AdoptionListingFilters
): UseQueryResult<AdoptionMarketplaceResponse> {
  return useQuery({
    queryKey: queryKeys.adoption.marketplaceListings(filters),
    queryFn: () => fetchListings(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUserListings(
  userId: string | null | undefined
): UseQueryResult<readonly AdoptionListing[]> {
  return useQuery({
    queryKey: queryKeys.adoption.userListings(userId || ''),
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      return fetchUserListings(userId)
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useCurrentUser(): UseQueryResult<{ id: string; name: string } | null> {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: fetchCurrentUser,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry auth failures
  })
}

export function useIncrementViewCount(): UseMutationResult<void, unknown, string> {
  return useMutation({
    mutationFn: incrementViewCount,
    // No cache invalidation needed for view counts
  })
}

// High-level marketplace hook combining all functionality
export interface UseAdoptionMarketplaceReturn {
  readonly listings: readonly AdoptionListing[]
  readonly loading: boolean
  readonly error: Error | null
  readonly searchQuery: string
  readonly setSearchQuery: (query: string) => void
  readonly filters: AdoptionListingFilters
  readonly setFilters: (filters: AdoptionListingFilters) => void
  readonly currentUser: { id: string; name: string } | null | undefined
  readonly hasMore: boolean
  readonly filteredListings: readonly AdoptionListing[]
  readonly activeFilterCount: number
  readonly mode: 'browse' | 'my-listings' | 'applications'
  readonly setMode: (mode: 'browse' | 'my-listings' | 'applications') => void
  readonly userListings: readonly AdoptionListing[]
  readonly userListingsLoading: boolean
  readonly refreshListings: () => Promise<void>
  readonly incrementView: (listingId: string) => void
}

export function useAdoptionMarketplace(): UseAdoptionMarketplaceReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<AdoptionListingFilters>({})
  const [mode, setMode] = useState<'browse' | 'my-listings' | 'applications'>('browse')
  
  const queryClient = useQueryClient()
  
  // Data queries
  const {
    data: listingsResponse,
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useAdoptionListings(filters)
  
  const { data: currentUser } = useCurrentUser()
  
  const {
    data: userListings = [],
    isLoading: userListingsLoading,
  } = useUserListings(currentUser?.id)
  
  const { mutate: incrementView } = useIncrementViewCount()
  
  // Derived data
  const listings = listingsResponse?.listings || []
  const hasMore = listingsResponse?.hasMore || false
  
  const filteredListings = useMemo(() => {
    if (!searchQuery) return listings
    
    const query = searchQuery.toLowerCase()
    return listings.filter((listing) =>
      listing.petName.toLowerCase().includes(query) ||
      listing.petBreed.toLowerCase().includes(query) ||
      listing.location.city.toLowerCase().includes(query) ||
      listing.ownerName.toLowerCase().includes(query)
    )
  }, [listings, searchQuery])
  
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter((key) => {
      const value = filters[key as keyof AdoptionListingFilters]
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null
    }).length
  }, [filters])
  
  const refreshListings = useCallback(async () => {
    await Promise.all([
      refetchListings(),
      currentUser?.id && queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.userListings(currentUser.id),
      }),
    ])
  }, [refetchListings, queryClient, currentUser?.id])
  
  return {
    listings,
    loading: listingsLoading,
    error: listingsError,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    currentUser,
    hasMore,
    filteredListings,
    activeFilterCount,
    mode,
    setMode,
    userListings,
    userListingsLoading,
    refreshListings,
    incrementView,
  }
}