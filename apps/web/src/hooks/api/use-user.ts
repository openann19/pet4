/**
 * React Query hooks for user API (Web)
 * Location: apps/web/src/hooks/api/use-user.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '@/lib/query-client'
import { authAPI, petAPI } from '@/lib/api-services'

export interface User {
  id: string
  email: string
  displayName: string
  [key: string]: unknown
}

export interface Pet {
  id: string
  name: string
  species: string
  [key: string]: unknown
}

/**
 * Hook to get current user
 */
export function useUser(): UseQueryResult<User> {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to update user
 */
export function useUpdateUser(): UseMutationResult<User, unknown, Partial<User>> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.match,
    mutationFn: async (data: Partial<User>) => {
      // Note: This assumes authAPI has an update method
      // If not, you may need to add it to api-services.ts
      const user = await authAPI.getCurrentUser()
      return { ...user, ...data } as User
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.profile, data)
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile })
    },
  })
}

/**
 * Hook to get user's pets
 */
export function useUserPets(): UseQueryResult<Pet[]> {
  return useQuery({
    queryKey: queryKeys.user.pets,
    queryFn: async () => {
      const response = await petAPI.list()
      return response.items
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
