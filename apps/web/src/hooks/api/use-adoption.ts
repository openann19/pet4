/**
 * React Query hooks for adoption API (Web)
 * Location: apps/web/src/hooks/api/use-adoption.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { adoptionAPI } from '@/lib/api-services';
import type { AdoptionProfile } from '@/lib/api-schemas';

export interface SubmitApplicationData {
  profileId: string;
  message?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  [key: string]: unknown;
}

/**
 * Hook to get adoption profiles (infinite scroll)
 */
export function useAdoptionProfiles(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.adoption.listings, filters],
    queryFn: async ({ pageParam: _pageParam }) => {
      const response = await adoptionAPI.listProfiles({
        ...filters,
        // Add pagination params if needed
      });
      return response.items;
    },
    getNextPageParam: (_lastPage, _allPages) => {
      // Return cursor for next page if available
      return undefined;
    },
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get a single adoption profile
 */
export function useAdoptionProfile(id: string | null | undefined): UseQueryResult<AdoptionProfile> {
  return useQuery({
    queryKey: id ? queryKeys.adoption.listing(id) : ['adoption', 'listings', 'null'],
    queryFn: async () => {
      if (!id) {
        throw new Error('Adoption profile ID is required');
      }
      return await adoptionAPI.getProfile(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to submit an adoption application
 */
export function useSubmitApplication(): UseMutationResult<
  { success: boolean; applicationId: string },
  unknown,
  SubmitApplicationData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitApplicationData) => adoptionAPI.submitApplication(data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.listing(variables.profileId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.applications,
      });
    },
  });
}
