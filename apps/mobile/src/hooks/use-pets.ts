/**
 * React Query hooks for pets API
 * Location: src/hooks/use-pets.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePetsStore } from '../store/pets-store'
import { useUserStore } from '../store/user-store'
import { queryKeys, mutationKeys } from '../lib/query-client'
import type { ApiResponse, PaginatedResponse } from '../types/api'
import type { Match, PetProfile } from '../types/pet'
import { isTruthy, isDefined } from '@/core/guards';

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'https://api.petspark.app'

/**
 * Fetch pets for matching
 */
async function fetchPets(cursor?: string): Promise<PaginatedResponse<PetProfile>> {
  const url = cursor
    ? `${String(API_BASE_URL ?? '')}/api/pets?cursor=${String(cursor ?? '')}`
    : `${String(API_BASE_URL ?? '')}/api/pets`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch pets: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data as PaginatedResponse<PetProfile>
}

/**
 * Like a pet (swipe right)
 */
async function likePet(petId: string): Promise<ApiResponse<Match | null>> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/pets/${String(petId ?? '')}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to like pet: ${String(response.statusText ?? '')}`)
  }

  return response.json()
}

/**
 * Dislike a pet (swipe left)
 */
async function dislikePet(petId: string): Promise<ApiResponse<null>> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/pets/${String(petId ?? '')}/dislike`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to dislike pet: ${String(response.statusText ?? '')}`)
  }

  return response.json()
}

/**
 * Hook to fetch pets with pagination
 */
export function usePets(cursor?: string): UseQueryResult<PaginatedResponse<PetProfile>> {
  return useQuery({
    queryKey: cursor ? [...queryKeys.pets.list, cursor] : queryKeys.pets.list,
    queryFn: () => fetchPets(cursor),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

/**
 * Hook to like a pet with optimistic updates
 */
export function useLikePet(): UseMutationResult<ApiResponse<Match | null>, unknown, string> {
  const queryClient = useQueryClient()
  const { addMatch } = useUserStore()
  const { markAsSwiped, markAsLiked } = usePetsStore()

  return useMutation({
    mutationKey: mutationKeys.like,
    mutationFn: (petId: string) => likePet(petId),
    onMutate: async (petId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['pets'] })

      // Snapshot previous value
      const previousPets = queryClient.getQueryData<PaginatedResponse<PetProfile>>(['pets'])

      // Optimistically update UI
      queryClient.setQueryData<PaginatedResponse<PetProfile>>(['pets'], (old: PaginatedResponse<PetProfile> | undefined) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((p: PetProfile) => p.id !== petId),
        }
      })

      // Mark as swiped/liked in store
      markAsSwiped(petId)
      markAsLiked(petId)

      return previousPets ? { previousPets } : {}
    },
    onError: (_err: unknown, _petId: string, context: { previousPets?: PaginatedResponse<PetProfile> } | undefined) => {
      // Rollback on error
      if (isTruthy(context?.previousPets)) {
        queryClient.setQueryData(['pets'], context.previousPets)
      }
    },
    onSuccess: (_data: ApiResponse<Match | null>, _petId: string) => {
      // Update matches if match occurred
      if (_data.data && 'id' in _data.data) {
        addMatch(_data.data)
      }

      // Invalidate matches query
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list })
    },
    onSettled: () => {
      // Refetch pets to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets.list })
    },
  })
}

/**
 * Hook to dislike a pet with optimistic updates
 */
export function useDislikePet(): UseMutationResult<ApiResponse<null>, unknown, string> {
  const queryClient = useQueryClient()
  const { markAsSwiped } = usePetsStore()

  return useMutation({
    mutationKey: mutationKeys.dislike,
    mutationFn: (petId: string) => dislikePet(petId),
    onMutate: async (petId: string): Promise<{ previousPets?: PaginatedResponse<PetProfile> }> => {
      await queryClient.cancelQueries({ queryKey: ['pets'] })

      const previousPets = queryClient.getQueryData<PaginatedResponse<PetProfile>>(['pets'])                                                                    

      queryClient.setQueryData<PaginatedResponse<PetProfile>>(['pets'], (old: PaginatedResponse<PetProfile> | undefined) => {                                   
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((p: PetProfile) => p.id !== petId),
        }
      })

      markAsSwiped(petId)

      return previousPets ? { previousPets } : {}
    },
    onError: (_err: unknown, _petId: string, context: { previousPets?: PaginatedResponse<PetProfile> } | undefined) => {
      if (isTruthy(context?.previousPets)) {
        queryClient.setQueryData(['pets'], context.previousPets)
      }
    },
    onSettled: () => {
      // Refetch pets to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets.list })
    },
  })
}

