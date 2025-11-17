/**
 * Stories API Hooks Tests (Mobile)
 * Location: apps/mobile/src/hooks/api/__tests__/use-stories.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import {
  useStoryHighlights,
  useCreateHighlight,
  useUpdateHighlight,
  useAddStoryToHighlight,
  useDeleteHighlight,
} from '../use-stories'
import { apiClient } from '@/utils/api-client'
import { createLogger } from '@/utils/logger'

// Mock API client
vi.mock('@/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockApiClient = vi.mocked(apiClient)
const mockLogger = createLogger('test')

// Mock StoryHighlight type
interface StoryHighlight {
  id: string
  userId: string
  petId: string
  title: string
  coverImage: string
  storyIds: string[]
  isPinned?: boolean
  createdAt: string
  updatedAt: string
}

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

describe('useStoryHighlights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch story highlights successfully', async () => {
    const userId = 'user1'
    const mockHighlights: StoryHighlight[] = [
      {
        id: 'highlight1',
        userId,
        petId: 'pet1',
        title: 'My Highlights',
        coverImage: 'cover1.jpg',
        storyIds: ['story1', 'story2'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockHighlights)

    const { result } = renderHook(() => useStoryHighlights(userId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockHighlights)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/stories/highlights?userId=${userId}`,
      expect.objectContaining({
        cacheKey: `stories:highlights:${userId}`,
        skipCache: false,
      })
    )
  })

  it('should handle empty highlights', async () => {
    const userId = 'user1'
    mockApiClient.get.mockResolvedValue([])

    const { result } = renderHook(() => useStoryHighlights(userId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle error and return empty array', async () => {
    const userId = 'user1'
    const error = new Error('Failed to fetch highlights')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => useStoryHighlights(userId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('should not fetch when userId is empty', () => {
    const { result } = renderHook(() => useStoryHighlights(''), { wrapper })

    expect(result.current.isFetching).toBe(false)
  })
})

describe('useCreateHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create highlight successfully', async () => {
    const mockHighlight: StoryHighlight = {
      id: 'highlight1',
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockHighlight)

    const { result } = renderHook(() => useCreateHighlight(), { wrapper })

    result.current.mutate({
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockHighlight)
    expect(mockApiClient.post).toHaveBeenCalledWith('/stories/highlights', {
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
    })
  })

  it('should invalidate queries on success', async () => {
    const mockHighlight: StoryHighlight = {
      id: 'highlight1',
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockHighlight)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useCreateHighlight(), { wrapper: customWrapper })

    result.current.mutate({
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error and log it', async () => {
    const error = new Error('Failed to create highlight')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useCreateHighlight(), { wrapper })

    result.current.mutate({
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(mockLogger.error).toHaveBeenCalled()
  })
})

describe('useUpdateHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update highlight successfully', async () => {
    const highlightId = 'highlight1'
    const mockHighlight: StoryHighlight = {
      id: highlightId,
      userId: 'user1',
      petId: 'pet1',
      title: 'Updated Title',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2', 'story3'],
      isPinned: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }

    mockApiClient.put.mockResolvedValue(mockHighlight)

    const { result } = renderHook(() => useUpdateHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      updates: {
        title: 'Updated Title',
        storyIds: ['story1', 'story2', 'story3'],
        isPinned: true,
      },
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockHighlight)
    expect(mockApiClient.put).toHaveBeenCalledWith(`/stories/highlights/${highlightId}`, {
      title: 'Updated Title',
      storyIds: ['story1', 'story2', 'story3'],
      isPinned: true,
    })
  })

  it('should invalidate queries on success', async () => {
    const highlightId = 'highlight1'
    const mockHighlight: StoryHighlight = {
      id: highlightId,
      userId: 'user1',
      petId: 'pet1',
      title: 'Updated Title',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }

    mockApiClient.put.mockResolvedValue(mockHighlight)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useUpdateHighlight(), { wrapper: customWrapper })

    result.current.mutate({
      highlightId,
      updates: {
        title: 'Updated Title',
      },
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error and log it', async () => {
    const highlightId = 'highlight1'
    const error = new Error('Failed to update highlight')
    mockApiClient.put.mockRejectedValue(error)

    const { result } = renderHook(() => useUpdateHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      updates: {
        title: 'Updated Title',
      },
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(mockLogger.error).toHaveBeenCalled()
  })
})

describe('useAddStoryToHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should add story to highlight successfully', async () => {
    const highlightId = 'highlight1'
    const storyId = 'story3'
    const mockHighlight: StoryHighlight = {
      id: highlightId,
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2', storyId],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockHighlight)

    const { result } = renderHook(() => useAddStoryToHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      storyId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockHighlight)
    expect(mockApiClient.post).toHaveBeenCalledWith(`/stories/highlights/${highlightId}/stories`, {
      storyId,
    })
  })

  it('should invalidate queries on success', async () => {
    const highlightId = 'highlight1'
    const storyId = 'story3'
    const mockHighlight: StoryHighlight = {
      id: highlightId,
      userId: 'user1',
      petId: 'pet1',
      title: 'My Highlights',
      coverImage: 'cover1.jpg',
      storyIds: ['story1', 'story2', storyId],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockHighlight)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useAddStoryToHighlight(), { wrapper: customWrapper })

    result.current.mutate({
      highlightId,
      storyId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error and log it', async () => {
    const highlightId = 'highlight1'
    const storyId = 'story3'
    const error = new Error('Failed to add story to highlight')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useAddStoryToHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      storyId,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(mockLogger.error).toHaveBeenCalled()
  })
})

describe('useDeleteHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete highlight successfully', async () => {
    const highlightId = 'highlight1'
    const userId = 'user1'

    mockApiClient.delete.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      userId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockApiClient.delete).toHaveBeenCalledWith(`/stories/highlights/${highlightId}`)
  })

  it('should invalidate queries on success', async () => {
    const highlightId = 'highlight1'
    const userId = 'user1'

    mockApiClient.delete.mockResolvedValue(undefined)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useDeleteHighlight(), { wrapper: customWrapper })

    result.current.mutate({
      highlightId,
      userId,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error and log it', async () => {
    const highlightId = 'highlight1'
    const userId = 'user1'
    const error = new Error('Failed to delete highlight')
    mockApiClient.delete.mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteHighlight(), { wrapper })

    result.current.mutate({
      highlightId,
      userId,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(mockLogger.error).toHaveBeenCalled()
  })
})
