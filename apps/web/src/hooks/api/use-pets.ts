/**
 * React Query hooks for pets API (Web)
 * Location: apps/web/src/hooks/api/use-pets.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { petAPI } from '@/lib/api-services'
import type { Pet } from '@/lib/api-schemas'

export interface CreatePetData {
  name: string
  species: string
  breed?: string
  age?: number
  [key: string]: unknown
}

export interface UpdatePetData {
  name?: string
  species?: string
  breed?: string
  age?: number
  [key: string]: unknown
}

/**
 * Hook to get list of pets
 */
export function usePets(params?: { ownerId?: string; status?: string }): UseQueryResult<Pet[]> {
  return useQuery({
    queryKey: [...queryKeys.pets.list, params],
    queryFn: async () => {
      const response = await petAPI.list(params)
      return response.items
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get a single pet by ID
 */
export function usePet(id: string | null | undefined): UseQueryResult<Pet> {
  return useQuery({
    queryKey: id ? queryKeys.pets.detail(id) : ['pets', 'null'],
    queryFn: () => {
      if (!id) {
        throw new Error('Pet ID is required')
      }
      return petAPI.getById(id)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new pet
 */
export function useCreatePet(): UseMutationResult<Pet, unknown, CreatePetData, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePetData) => petAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets.list })
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.pets })
    },
  })
}

/**
 * Hook to update a pet
 */
export function useUpdatePet(): UseMutationResult<Pet, unknown, { id: string; data: UpdatePetData }, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePetData }) => petAPI.update(id, data),
    onSuccess: (data, variables) => {
      void queryClient.setQueryData(queryKeys.pets.detail(variables.id), data)
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets.list })
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.pets })
    },
  })
}

/**
 * Hook to delete a pet
 */
export function useDeletePet(): UseMutationResult<{ success: boolean }, unknown, string, unknown> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => petAPI.delete(id),
    onSuccess: (_, id) => {
      void queryClient.removeQueries({ queryKey: queryKeys.pets.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.pets.list })
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.pets })
    },
  })
}
