/**
 * Domain Snapshots Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-domain-snapshots.test.ts
 *
 * Tests for the useDomainSnapshots hook with React Query integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { useDomainSnapshots } from '../use-domain-snapshots'

// Mock API client
const mockApiClient = {
  get: vi.fn(),
}

vi.mock('@mobile/utils/api-client', () => ({
  apiClient: mockApiClient,
}))

// Mock logger
vi.mock('@mobile/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock query client
const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Wrapper component with QueryClient
function QueryWrapper({ children }: { children: ReactNode }): ReactNode {
  const queryClient = createTestQueryClient()
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDomainSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success Cases', () => {
    it('should return domain snapshots from API', async () => {
      const mockData = {
        adoption: {
          canEditActiveListing: true,
          canReceiveApplications: true,
          statusTransitions: [{ status: 'active', allowed: true }],
          applicationTransitions: [{ status: 'pending', allowed: true }],
        },
        community: {
          canEditPendingPost: true,
          canReceiveCommentsOnActivePost: true,
          postTransitions: [{ status: 'pending', allowed: true }],
          commentTransitions: [{ status: 'active', allowed: true }],
        },
        matching: {
          hardGatesPassed: true,
          hardGateFailures: [],
          score: {
            totalScore: 85.5,
            breakdown: {},
          },
        },
      }

      mockApiClient.get.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/domain/snapshots')
    })

    it('should return default snapshots when loading', () => {
      mockApiClient.get.mockImplementationOnce(() => new Promise(() => {}))

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeDefined()
      expect(result.current.data.adoption).toBeDefined()
      expect(result.current.data.community).toBeDefined()
      expect(result.current.data.matching).toBeDefined()
    })

    it('should return default snapshots on error', async () => {
      const error = new Error('Failed to fetch')
      mockApiClient.get.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.data).toBeDefined()
      expect(result.current.data.adoption.canEditActiveListing).toBe(false)
    })

    it('should return default snapshots for invalid data', async () => {
      mockApiClient.get.mockResolvedValueOnce({ invalid: 'data' })

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data.adoption.canEditActiveListing).toBe(false)
    })
  })

  describe('Data Structure', () => {
    it('should return adoption snapshot with correct structure', async () => {
      const mockData = {
        adoption: {
          canEditActiveListing: true,
          canReceiveApplications: true,
          statusTransitions: [],
          applicationTransitions: [],
        },
        community: {
          canEditPendingPost: true,
          canReceiveCommentsOnActivePost: true,
          postTransitions: [],
          commentTransitions: [],
        },
        matching: {
          hardGatesPassed: true,
          hardGateFailures: [],
          score: {
            totalScore: 85.5,
            breakdown: {},
          },
        },
      }

      mockApiClient.get.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data.adoption.canEditActiveListing).toBeDefined()
      expect(typeof result.current.data.adoption.canEditActiveListing).toBe('boolean')
      expect(result.current.data.adoption.canReceiveApplications).toBeDefined()
      expect(typeof result.current.data.adoption.canReceiveApplications).toBe('boolean')
      expect(Array.isArray(result.current.data.adoption.statusTransitions)).toBe(true)
      expect(Array.isArray(result.current.data.adoption.applicationTransitions)).toBe(true)
    })

    it('should return community snapshot with correct structure', async () => {
      const mockData = {
        adoption: {
          canEditActiveListing: true,
          canReceiveApplications: true,
          statusTransitions: [],
          applicationTransitions: [],
        },
        community: {
          canEditPendingPost: true,
          canReceiveCommentsOnActivePost: true,
          postTransitions: [],
          commentTransitions: [],
        },
        matching: {
          hardGatesPassed: true,
          hardGateFailures: [],
          score: {
            totalScore: 85.5,
            breakdown: {},
          },
        },
      }

      mockApiClient.get.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data.community.canEditPendingPost).toBeDefined()
      expect(typeof result.current.data.community.canEditPendingPost).toBe('boolean')
      expect(result.current.data.community.canReceiveCommentsOnActivePost).toBeDefined()
      expect(typeof result.current.data.community.canReceiveCommentsOnActivePost).toBe('boolean')
      expect(Array.isArray(result.current.data.community.postTransitions)).toBe(true)
      expect(Array.isArray(result.current.data.community.commentTransitions)).toBe(true)
    })

    it('should return matching snapshot with correct structure', async () => {
      const mockData = {
        adoption: {
          canEditActiveListing: true,
          canReceiveApplications: true,
          statusTransitions: [],
          applicationTransitions: [],
        },
        community: {
          canEditPendingPost: true,
          canReceiveCommentsOnActivePost: true,
          postTransitions: [],
          commentTransitions: [],
        },
        matching: {
          hardGatesPassed: true,
          hardGateFailures: [],
          score: {
            totalScore: 85.5,
            breakdown: {},
          },
        },
      }

      mockApiClient.get.mockResolvedValueOnce(mockData)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data.matching.hardGatesPassed).toBeDefined()
      expect(typeof result.current.data.matching.hardGatesPassed).toBe('boolean')
      expect(Array.isArray(result.current.data.matching.hardGateFailures)).toBe(true)
      expect(result.current.data.matching.score).toBeDefined()
      expect(typeof result.current.data.matching.score.totalScore).toBe('number')
    })
  })

  describe('Error Handling', () => {
    it('should return default snapshots when API fails', async () => {
      const error = new Error('Network error')
      mockApiClient.get.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.data).toBeDefined()
      expect(result.current.data.adoption.canEditActiveListing).toBe(false)
    })

    it('should provide refetch function', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        adoption: {
          canEditActiveListing: true,
          canReceiveApplications: true,
          statusTransitions: [],
          applicationTransitions: [],
        },
        community: {
          canEditPendingPost: true,
          canReceiveCommentsOnActivePost: true,
          postTransitions: [],
          commentTransitions: [],
        },
        matching: {
          hardGatesPassed: true,
          hardGateFailures: [],
          score: {
            totalScore: 85.5,
            breakdown: {},
          },
        },
      })

      const { result } = renderHook(() => useDomainSnapshots(), {
        wrapper: QueryWrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })
  })
})
