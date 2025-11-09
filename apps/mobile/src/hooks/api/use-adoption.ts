/**
 * React Query hooks for adoption API (Mobile)
 * Uses hardened API client for all requests
 * Location: apps/mobile/src/hooks/api/use-adoption.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { AdoptionApplication, AdoptionProcess } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

/**
 * Fetch adoption applications for current user
 */
async function fetchApplications(): Promise<AdoptionApplication[]> {
  const data = await apiClient.get<{ items?: AdoptionApplication[] } | AdoptionApplication[]>(
    '/api/v1/adoption/applications',
    {
      cacheKey: 'adoption:applications',
      skipCache: false,
    }
  )
  return Array.isArray(data) ? data : data.items || []
}

/**
 * Fetch adoption applications for a specific pet
 */
async function fetchPetApplications(petId: string): Promise<AdoptionApplication[]> {
  const data = await apiClient.get<{ items?: AdoptionApplication[] } | AdoptionApplication[]>(
    `/api/v1/adoption/pets/${petId}/applications`,
    {
      cacheKey: `adoption:pet:${petId}:applications`,
      skipCache: false,
    }
  )
  return Array.isArray(data) ? data : data.items || []
}

/**
 * Fetch adoption process details
 */
function fetchProcess(applicationId: string): Promise<AdoptionProcess> {
  return apiClient.get<AdoptionProcess>(`/api/v1/adoption/applications/${applicationId}/process`, {
    cacheKey: `adoption:process:${applicationId}`,
    skipCache: false,
  })
}

/**
 * Submit an adoption application
 */
async function submitApplication(
  petId: string,
  answers: Record<string, unknown>
): Promise<AdoptionApplication> {
  const data = await apiClient.post<{ application?: AdoptionApplication } | AdoptionApplication>(
    '/api/v1/adoption/applications',
    { petId, answers },
    {
      skipCache: true,
    }
  )
  return (
    (data as { application?: AdoptionApplication }).application || (data as AdoptionApplication)
  )
}

/**
 * Update application status
 */
function updateStatus(
  applicationId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean }> {
  return apiClient.patch<{ success: boolean }>(
    `/api/v1/adoption/applications/${applicationId}/status`,
    {
      status,
      notes,
    }
  )
}

/**
 * Schedule an adoption meeting
 */
async function scheduleMeeting(
  applicationId: string,
  dateTime: string,
  location: string
): Promise<{ success: boolean; meetingId: string }> {
  const data = await apiClient.post<{ success?: boolean; meetingId?: string }>(
    `/api/v1/adoption/applications/${applicationId}/meetings`,
    { dateTime, location }
  )
  return { success: data.success ?? true, meetingId: data.meetingId ?? '' }
}

/**
 * Hook to get adoption applications for current user
 */
export function useAdoptionApplications(): UseQueryResult<AdoptionApplication[]> {
  return useQuery({
    queryKey: queryKeys.adoption.applications(),
    queryFn: () => fetchApplications(),
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
    queryFn: () => {
      if (!petId) {
        throw new Error('Pet ID is required')
      }
      return fetchPetApplications(petId)
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
    queryFn: () => {
      if (!applicationId) {
        throw new Error('Application ID is required')
      }
      return fetchProcess(applicationId)
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
  { petId: string; answers: Record<string, unknown> },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petId, answers }) => submitApplication(petId, answers),
    onSuccess: data => {
      // Invalidate user's applications
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.applications(),
      })
      // Invalidate pet's applications
      if (data.petId || data.adoptionProfileId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.adoption.petApplications(data.petId || data.adoptionProfileId || ''),
        })
      }
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
    mutationFn: ({ applicationId, status, notes }) => updateStatus(applicationId, status, notes),
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
      scheduleMeeting(applicationId, dateTime, location),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adoption.process(variables.applicationId),
      })
    },
  })
}
