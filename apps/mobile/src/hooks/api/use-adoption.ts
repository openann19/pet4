/**
 * React Query hooks for adoption API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-adoption.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { AdoptionApplication, AdoptionProcess } from '@/lib/types'

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'https://api.petspark.app'

/**
 * Fetch adoption applications for current user
 */
async function fetchApplications(): Promise<AdoptionApplication[]> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/applications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data.items || data
}

/**
 * Fetch adoption applications for a specific pet
 */
async function fetchPetApplications(petId: string): Promise<AdoptionApplication[]> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/pets/${String(petId ?? '')}/applications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch pet applications: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data.items || data
}

/**
 * Fetch adoption process details
 */
async function fetchProcess(applicationId: string): Promise<AdoptionProcess> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/applications/${String(applicationId ?? '')}/process`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch process: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
}

/**
 * Submit an adoption application
 */
async function submitApplication(petId: string, answers: Record<string, unknown>): Promise<AdoptionApplication> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ petId, answers }),
  })

  if (!response.ok) {
    throw new Error(`Failed to submit application: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data.application || data
}

/**
 * Update application status
 */
async function updateStatus(
  applicationId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/applications/${String(applicationId ?? '')}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update status: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
}

/**
 * Schedule an adoption meeting
 */
async function scheduleMeeting(
  applicationId: string,
  dateTime: string,
  location: string
): Promise<{ success: boolean; meetingId: string }> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/adoption/applications/${String(applicationId ?? '')}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dateTime, location }),
  })

  if (!response.ok) {
    throw new Error(`Failed to schedule meeting: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
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
    queryFn: async () => {
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
    queryFn: async () => {
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
  { petId: string; answers: Record<string, unknown> }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petId, answers }) =>
      submitApplication(petId, answers),
    onSuccess: (data) => {
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
  { applicationId: string; status: string; notes?: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, status, notes }) =>
      updateStatus(applicationId, status, notes),
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
  { applicationId: string; dateTime: string; location: string }
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
