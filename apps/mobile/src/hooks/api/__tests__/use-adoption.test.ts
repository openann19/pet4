/**
 * Adoption API Hooks Tests (Mobile)
 * Location: apps/mobile/src/hooks/api/__tests__/use-adoption.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import {
  useAdoptionApplications,
  usePetAdoptionApplications,
  useAdoptionProcess,
  useSubmitApplication,
  useUpdateApplicationStatus,
  useScheduleMeeting,
} from '../use-adoption'
import type { AdoptionApplication, AdoptionProcess } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

// Mock API client
vi.mock('@/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockApiClient = vi.mocked(apiClient)

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

describe('useAdoptionApplications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch adoption applications successfully', async () => {
    const mockApplications: AdoptionApplication[] = [
      {
        _id: 'app1',
        id: 'app1',
        adoptionProfileId: 'pet1',
        applicantId: 'user1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '123-456-7890',
        householdType: 'house',
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: '5 years',
        reason: 'Looking for a companion',
        status: 'pending',
        submittedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockApplications)

    const { result } = renderHook(() => useAdoptionApplications(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplications)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/adoption/applications',
      expect.objectContaining({
        cacheKey: 'adoption:applications',
        skipCache: false,
      })
    )
  })

  it('should handle array response format', async () => {
    const mockApplications: AdoptionApplication[] = [
      {
        _id: 'app1',
        adoptionProfileId: 'pet1',
        applicantId: 'user1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '123-456-7890',
        householdType: 'house',
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: '5 years',
        reason: 'Looking for a companion',
        status: 'pending',
        submittedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockApplications)

    const { result } = renderHook(() => useAdoptionApplications(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplications)
  })

  it('should handle items property response format', async () => {
    const mockApplications: AdoptionApplication[] = [
      {
        _id: 'app1',
        adoptionProfileId: 'pet1',
        applicantId: 'user1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '123-456-7890',
        householdType: 'house',
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: '5 years',
        reason: 'Looking for a companion',
        status: 'pending',
        submittedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue({ items: mockApplications })

    const { result } = renderHook(() => useAdoptionApplications(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplications)
  })

  it('should handle empty response', async () => {
    mockApiClient.get.mockResolvedValue([])

    const { result } = renderHook(() => useAdoptionApplications(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle error', async () => {
    const error = new Error('Failed to fetch applications')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => useAdoptionApplications(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('usePetAdoptionApplications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch pet adoption applications when petId is provided', async () => {
    const petId = 'pet1'
    const mockApplications: AdoptionApplication[] = [
      {
        _id: 'app1',
        adoptionProfileId: petId,
        applicantId: 'user1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '123-456-7890',
        householdType: 'house',
        hasYard: true,
        hasOtherPets: false,
        hasChildren: false,
        experience: '5 years',
        reason: 'Looking for a companion',
        status: 'pending',
        submittedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockApplications)

    const { result } = renderHook(() => usePetAdoptionApplications(petId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplications)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/v1/adoption/pets/${petId}/applications`,
      expect.objectContaining({
        cacheKey: `adoption:pet:${petId}:applications`,
        skipCache: false,
      })
    )
  })

  it('should not fetch when petId is null', () => {
    const { result } = renderHook(() => usePetAdoptionApplications(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should not fetch when petId is undefined', () => {
    const { result } = renderHook(() => usePetAdoptionApplications(undefined), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should throw error when petId is missing in queryFn', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Pet ID is required'))

    const { result } = renderHook(() => usePetAdoptionApplications(''), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useAdoptionProcess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch adoption process when applicationId is provided', async () => {
    const applicationId = 'app1'
    const mockProcess: AdoptionProcess = {
      applicationId,
      status: 'in_progress',
      steps: [
        {
          name: 'Application Review',
          status: 'completed',
          completedAt: '2024-01-01T00:00:00Z',
        },
        {
          name: 'Interview',
          status: 'in_progress',
        },
      ],
      nextStep: 'Home Visit',
    }

    mockApiClient.get.mockResolvedValue(mockProcess)

    const { result } = renderHook(() => useAdoptionProcess(applicationId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockProcess)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/v1/adoption/applications/${applicationId}/process`,
      expect.objectContaining({
        cacheKey: `adoption:process:${applicationId}`,
        skipCache: false,
      })
    )
  })

  it('should not fetch when applicationId is null', () => {
    const { result } = renderHook(() => useAdoptionProcess(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should throw error when applicationId is missing in queryFn', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Application ID is required'))

    const { result } = renderHook(() => useAdoptionProcess(''), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useSubmitApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit application successfully', async () => {
    const mockApplication: AdoptionApplication = {
      _id: 'app1',
      adoptionProfileId: 'pet1',
      applicantId: 'user1',
      applicantName: 'John Doe',
      applicantEmail: 'john@example.com',
      applicantPhone: '123-456-7890',
      householdType: 'house',
      hasYard: true,
      hasOtherPets: false,
      hasChildren: false,
      experience: '5 years',
      reason: 'Looking for a companion',
      status: 'submitted',
      submittedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockApplication)

    const { result } = renderHook(() => useSubmitApplication(), { wrapper })

    result.current.mutate({
      petId: 'pet1',
      answers: {
        experience: '5 years',
        reason: 'Looking for a companion',
      },
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplication)
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/adoption/applications',
      {
        petId: 'pet1',
        answers: {
          experience: '5 years',
          reason: 'Looking for a companion',
        },
      },
      expect.objectContaining({
        skipCache: true,
      })
    )
  })

  it('should handle application object in response', async () => {
    const mockApplication: AdoptionApplication = {
      _id: 'app1',
      adoptionProfileId: 'pet1',
      applicantId: 'user1',
      applicantName: 'John Doe',
      applicantEmail: 'john@example.com',
      applicantPhone: '123-456-7890',
      householdType: 'house',
      hasYard: true,
      hasOtherPets: false,
      hasChildren: false,
      experience: '5 years',
      reason: 'Looking for a companion',
      status: 'submitted',
      submittedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue({ application: mockApplication })

    const { result } = renderHook(() => useSubmitApplication(), { wrapper })

    result.current.mutate({
      petId: 'pet1',
      answers: {},
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockApplication)
  })

  it('should invalidate queries on success', async () => {
    const mockApplication: AdoptionApplication = {
      _id: 'app1',
      id: 'app1',
      adoptionProfileId: 'pet1',
      petId: 'pet1',
      applicantId: 'user1',
      applicantName: 'John Doe',
      applicantEmail: 'john@example.com',
      applicantPhone: '123-456-7890',
      householdType: 'house',
      hasYard: true,
      hasOtherPets: false,
      hasChildren: false,
      experience: '5 years',
      reason: 'Looking for a companion',
      status: 'submitted',
      submittedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockApplication)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useSubmitApplication(), { wrapper: customWrapper })

    result.current.mutate({
      petId: 'pet1',
      answers: {},
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const error = new Error('Failed to submit application')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useSubmitApplication(), { wrapper })

    result.current.mutate({
      petId: 'pet1',
      answers: {},
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useUpdateApplicationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update application status successfully', async () => {
    mockApiClient.patch.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useUpdateApplicationStatus(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      status: 'approved',
      notes: 'Application approved',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({ success: true })
    expect(mockApiClient.patch).toHaveBeenCalledWith('/api/v1/adoption/applications/app1/status', {
      status: 'approved',
      notes: 'Application approved',
    })
  })

  it('should update status without notes', async () => {
    mockApiClient.patch.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useUpdateApplicationStatus(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      status: 'rejected',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockApiClient.patch).toHaveBeenCalledWith('/api/v1/adoption/applications/app1/status', {
      status: 'rejected',
      notes: undefined,
    })
  })

  it('should invalidate queries on success', async () => {
    mockApiClient.patch.mockResolvedValue({ success: true })

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useUpdateApplicationStatus(), { wrapper: customWrapper })

    result.current.mutate({
      applicationId: 'app1',
      status: 'approved',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })
})

describe('useScheduleMeeting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should schedule meeting successfully', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      meetingId: 'meeting1',
    })

    const { result } = renderHook(() => useScheduleMeeting(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      success: true,
      meetingId: 'meeting1',
    })
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/adoption/applications/app1/meetings', {
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })
  })

  it('should handle response without success property', async () => {
    mockApiClient.post.mockResolvedValue({
      meetingId: 'meeting1',
    })

    const { result } = renderHook(() => useScheduleMeeting(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      success: true,
      meetingId: 'meeting1',
    })
  })

  it('should handle response without meetingId', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
    })

    const { result } = renderHook(() => useScheduleMeeting(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      success: true,
      meetingId: '',
    })
  })

  it('should invalidate queries on success', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      meetingId: 'meeting1',
    })

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useScheduleMeeting(), { wrapper: customWrapper })

    result.current.mutate({
      applicationId: 'app1',
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const error = new Error('Failed to schedule meeting')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useScheduleMeeting(), { wrapper })

    result.current.mutate({
      applicationId: 'app1',
      dateTime: '2024-01-15T10:00:00Z',
      location: '123 Main St',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
