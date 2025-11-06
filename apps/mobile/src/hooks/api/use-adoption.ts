/**
 * React Query hooks for adoption API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-adoption.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { adoptionAPI } from '@/lib/api-services'
import type { AdoptionApplication, AdoptionProcess } from '@/lib/types'

/**
 * Hook to get adoption applications for current user
 */
export function useAdoptionApplications(): UseQueryResult<AdoptionApplication[]> {
  return useQuery({
    queryKey: queryKeys.adoption.applications(),
    queryFn: () => adoptionAPI.getApplications(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get adoption applications for a specific pet (shelter view)
 */
export function usePetAdoptionApplications(
  petId: string | null | undefined
): UseQueryResult<AdoptionApplication[]> {
  return useQuery({
    queryKey: queryKeys.adoption.petApplications(petId || ''),
    queryFn: async () => {
      if (!petId) {
        throw new Error('Pet ID is required')
      }
      return adoptionAPI.getPetApplications(petId)
    },
    enabled: !!petId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get adoption process details
 */
export function useAdoptionProcess(
  applicationId: string | null | undefined
): UseQueryResult<AdoptionProcess> {
  return useQuery({
    queryKey: queryKeys.adoption.process(applicationId || ''),
    queryFn: async () => {
      if (!applicationId) {
        throw new Error('Application ID is required')
      }
      return adoptionAPI.getProcess(applicationId)
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to submit an adoption application
 */
export function useSubmitApplication(): UseMutationResult<
  AdoptionApplication,
  unknown,
  { petId: string; answers: Record<string, any> },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petId, answers }) =>
      adoptionAPI.submitApplication(petId, answers),
    onSuccess: (data) => {
      // Invalidate user's applications
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.applications(),
      })
      // Invalidate pet's applications
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.petApplications(data.petId),
      })
    },
  })
}

/**
 * Hook to update application status
 */
export function useUpdateApplicationStatus(): UseMutationResult<
  { success: boolean },
  unknown,
  { applicationId: string; status: string; notes?: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, status, notes }) =>
      adoptionAPI.updateStatus(applicationId, status, notes),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.applications(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.process(variables.applicationId),
      })
    },
  })
}

/**
 * Hook to schedule an adoption meeting
 */
export function useScheduleMeeting(): UseMutationResult<
  { success: boolean; meetingId: string },
  unknown,
  { applicationId: string; dateTime: string; location: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, dateTime, location }) =>
      adoptionAPI.scheduleMeeting(applicationId, dateTime, location),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.process(variables.applicationId),
      })
    },
  })
}
