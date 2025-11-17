/**
 * Community API Hooks Tests (Mobile)
 * Location: apps/mobile/src/hooks/api/__tests__/use-community.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import {
  useCommunityPosts,
  useCommunityPost,
  useCreatePost,
  useLikePost,
  useAddComment,
} from '../use-community'
import type { CommunityPost, CommunityComment } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

// Mock API client
vi.mock('@/utils/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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

describe('useCommunityPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch community posts successfully', async () => {
    const mockPosts: CommunityPost[] = [
      {
        id: 'post1',
        authorId: 'user1',
        authorName: 'John Doe',
        kind: 'text',
        title: 'Test Post',
        content: 'This is a test post',
        visibility: 'public',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockPosts)

    const { result } = renderHook(() => useCommunityPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPosts)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/community/feed',
      expect.objectContaining({
        cacheKey: 'community:posts:all',
        skipCache: false,
      })
    )
  })

  it('should fetch posts with category', async () => {
    const category = 'adoption'
    const mockPosts: CommunityPost[] = [
      {
        id: 'post1',
        authorId: 'user1',
        authorName: 'John Doe',
        kind: 'text',
        title: 'Test Post',
        content: 'This is a test post',
        category,
        visibility: 'public',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue(mockPosts)

    const { result } = renderHook(() => useCommunityPosts(category), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPosts)
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/v1/community/feed?category=${category}`,
      expect.objectContaining({
        cacheKey: `community:posts:${category}`,
        skipCache: false,
      })
    )
  })

  it('should handle items property response format', async () => {
    const mockPosts: CommunityPost[] = [
      {
        id: 'post1',
        authorId: 'user1',
        authorName: 'John Doe',
        kind: 'text',
        title: 'Test Post',
        content: 'This is a test post',
        visibility: 'public',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValue({ items: mockPosts })

    const { result } = renderHook(() => useCommunityPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPosts)
  })

  it('should handle empty response', async () => {
    mockApiClient.get.mockResolvedValue([])

    const { result } = renderHook(() => useCommunityPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle error', async () => {
    const error = new Error('Failed to fetch posts')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => useCommunityPosts(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useCommunityPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch community post with comments when postId is provided', async () => {
    const postId = 'post1'
    const mockPost: CommunityPost = {
      id: postId,
      authorId: 'user1',
      authorName: 'John Doe',
      kind: 'text',
      title: 'Test Post',
      content: 'This is a test post',
      visibility: 'public',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const mockComments: CommunityComment[] = [
      {
        id: 'comment1',
        postId,
        authorId: 'user2',
        authorName: 'Jane Doe',
        text: 'Great post!',
        status: 'active',
        createdAt: '2024-01-01T01:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      },
    ]

    mockApiClient.get.mockResolvedValueOnce(mockPost).mockResolvedValueOnce(mockComments)

    const { result } = renderHook(() => useCommunityPost(postId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      ...mockPost,
      comments: mockComments,
    })
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/v1/community/posts/${postId}`,
      expect.objectContaining({
        cacheKey: `community:post:${postId}`,
        skipCache: false,
      })
    )
    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/api/v1/community/posts/${postId}/comments`,
      expect.objectContaining({
        cacheKey: `community:post:${postId}:comments`,
        skipCache: false,
      })
    )
  })

  it('should not fetch when postId is null', () => {
    const { result } = renderHook(() => useCommunityPost(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockApiClient.get).not.toHaveBeenCalled()
  })

  it('should throw error when postId is missing in queryFn', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Post ID is required'))

    const { result } = renderHook(() => useCommunityPost(''), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should handle error', async () => {
    const postId = 'post1'
    const error = new Error('Failed to fetch post')
    mockApiClient.get.mockRejectedValue(error)

    const { result } = renderHook(() => useCommunityPost(postId), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useCreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create post successfully', async () => {
    const mockPost: CommunityPost = {
      id: 'post1',
      authorId: 'user1',
      authorName: 'John Doe',
      kind: 'text',
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
      visibility: 'public',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockPost)

    const { result } = renderHook(() => useCreatePost(), { wrapper })

    result.current.mutate({
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockPost)
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/community/posts',
      {
        title: 'Test Post',
        content: 'This is a test post',
        category: 'adoption',
        images: undefined,
      },
      expect.objectContaining({
        skipCache: true,
      })
    )
  })

  it('should create post with images', async () => {
    const mockPost: CommunityPost = {
      id: 'post1',
      authorId: 'user1',
      authorName: 'John Doe',
      kind: 'photo',
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
      media: ['image1.jpg', 'image2.jpg'],
      visibility: 'public',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockPost)

    const { result } = renderHook(() => useCreatePost(), { wrapper })

    result.current.mutate({
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
      images: ['image1.jpg', 'image2.jpg'],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/v1/community/posts',
      {
        title: 'Test Post',
        content: 'This is a test post',
        category: 'adoption',
        images: ['image1.jpg', 'image2.jpg'],
      },
      expect.objectContaining({
        skipCache: true,
      })
    )
  })

  it('should invalidate queries on success', async () => {
    const mockPost: CommunityPost = {
      id: 'post1',
      authorId: 'user1',
      authorName: 'John Doe',
      kind: 'text',
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
      visibility: 'public',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockPost)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useCreatePost(), { wrapper: customWrapper })

    result.current.mutate({
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const error = new Error('Failed to create post')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useCreatePost(), { wrapper })

    result.current.mutate({
      title: 'Test Post',
      content: 'This is a test post',
      category: 'adoption',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useLikePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should like post successfully', async () => {
    const postId = 'post1'
    mockApiClient.post.mockResolvedValue({
      liked: true,
      likesCount: 10,
    })

    const { result } = renderHook(() => useLikePost(), { wrapper })

    result.current.mutate({ postId })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      liked: true,
      likesCount: 10,
    })
    expect(mockApiClient.post).toHaveBeenCalledWith(`/api/v1/community/posts/${postId}/reactions`, {
      emoji: '❤️',
    })
  })

  it('should handle response without liked property', async () => {
    const postId = 'post1'
    mockApiClient.post.mockResolvedValue({
      likesCount: 10,
    })

    const { result } = renderHook(() => useLikePost(), { wrapper })

    result.current.mutate({ postId })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      liked: true,
      likesCount: 10,
    })
  })

  it('should handle response without likesCount property', async () => {
    const postId = 'post1'
    mockApiClient.post.mockResolvedValue({
      liked: true,
    })

    const { result } = renderHook(() => useLikePost(), { wrapper })

    result.current.mutate({ postId })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      liked: true,
      likesCount: 0,
    })
  })

  it('should invalidate queries on success', async () => {
    const postId = 'post1'
    mockApiClient.post.mockResolvedValue({
      liked: true,
      likesCount: 10,
    })

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useLikePost(), { wrapper: customWrapper })

    result.current.mutate({ postId })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const postId = 'post1'
    const error = new Error('Failed to like post')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useLikePost(), { wrapper })

    result.current.mutate({ postId })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})

describe('useAddComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should add comment successfully', async () => {
    const postId = 'post1'
    const mockComment: CommunityComment = {
      id: 'comment1',
      postId,
      authorId: 'user1',
      authorName: 'John Doe',
      text: 'Great post!',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockComment)

    const { result } = renderHook(() => useAddComment(), { wrapper })

    result.current.mutate({
      postId,
      content: 'Great post!',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockComment)
    expect(mockApiClient.post).toHaveBeenCalledWith(`/api/v1/community/posts/${postId}/comments`, {
      content: 'Great post!',
    })
  })

  it('should invalidate queries on success', async () => {
    const postId = 'post1'
    const mockComment: CommunityComment = {
      id: 'comment1',
      postId,
      authorId: 'user1',
      authorName: 'John Doe',
      text: 'Great post!',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockApiClient.post.mockResolvedValue(mockComment)

    const queryClient = createTestQueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function customWrapper({ children }: { children: ReactNode }): ReactNode {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useAddComment(), { wrapper: customWrapper })

    result.current.mutate({
      postId,
      content: 'Great post!',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should handle error', async () => {
    const postId = 'post1'
    const error = new Error('Failed to add comment')
    mockApiClient.post.mockRejectedValue(error)

    const { result } = renderHook(() => useAddComment(), { wrapper })

    result.current.mutate({
      postId,
      content: 'Great post!',
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
