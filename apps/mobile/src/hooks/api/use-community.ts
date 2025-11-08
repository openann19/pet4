/**
 * React Query hooks for community API (Mobile)
 * Uses hardened API client for all requests
 * Location: apps/mobile/src/hooks/api/use-community.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { CommunityPost, CommunityComment } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

/**
 * Fetch community posts
 */
async function fetchPosts(category?: string): Promise<CommunityPost[]> {
  const endpoint = category
    ? `/api/v1/community/feed?category=${category}`
    : '/api/v1/community/feed'
  const data = await apiClient.get<{ items?: CommunityPost[] } | CommunityPost[]>(endpoint, {
    cacheKey: `community:posts:${category || 'all'}`,
    skipCache: false,
  })
  return Array.isArray(data) ? data : data.items || []
}

/**
 * Fetch a single community post
 */
async function fetchPost(postId: string): Promise<CommunityPost> {
  return apiClient.get<CommunityPost>(`/api/v1/community/posts/${postId}`, {
    cacheKey: `community:post:${postId}`,
    skipCache: false,
  })
}

/**
 * Fetch comments for a post
 */
async function fetchComments(postId: string): Promise<CommunityComment[]> {
  return apiClient.get<CommunityComment[]>(`/api/v1/community/posts/${postId}/comments`, {
    cacheKey: `community:post:${postId}:comments`,
    skipCache: false,
  })
}

/**
 * Create a community post
 */
async function createPost(
  title: string,
  content: string,
  category: string,
  images?: string[]
): Promise<CommunityPost> {
  return apiClient.post<CommunityPost>(
    '/api/v1/community/posts',
    { title, content, category, images },
    {
      skipCache: true,
    }
  )
}

/**
 * Like/unlike a post
 */
async function likePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  const data = await apiClient.post<{ liked?: boolean; likesCount?: number }>(
    `/api/v1/community/posts/${postId}/reactions`,
    { emoji: '❤️' }
  )
  return { liked: data.liked ?? true, likesCount: data.likesCount ?? 0 }
}

/**
 * Add a comment to a post
 */
async function addComment(postId: string, content: string): Promise<CommunityComment> {
  return apiClient.post<CommunityComment>(`/api/v1/community/posts/${postId}/comments`, { content })
}

/**
 * Hook to get community posts
 */
export function useCommunityPosts(category?: string): UseQueryResult<CommunityPost[]> {
  return useQuery({
    queryKey: queryKeys.community.posts(category),
    queryFn: () => fetchPosts(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get a single community post with comments
 */
export function useCommunityPost(
  postId: string | null | undefined
): UseQueryResult<CommunityPost & { comments: CommunityComment[] }> {
  return useQuery({
    queryKey: queryKeys.community.post(postId || ''),
    queryFn: async () => {
      if (!postId) {
        throw new Error('Post ID is required')
      }
      const post = await fetchPost(postId)
      const comments = await fetchComments(postId)
      return { ...post, comments }
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to create a community post
 */
export function useCreatePost(): UseMutationResult<
  CommunityPost,
  unknown,
  { title: string; content: string; category: string; images?: string[] },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, content, category, images }) =>
      createPost(title, content, category, images),
    onSuccess: data => {
      // Invalidate posts list
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.posts(data.category),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.posts(),
      })
    },
  })
}

/**
 * Hook to like/unlike a post
 */
export function useLikePost(): UseMutationResult<
  { liked: boolean; likesCount: number },
  unknown,
  { postId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId }) => likePost(postId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.posts(),
      })
    },
  })
}

/**
 * Hook to add a comment to a post
 */
export function useAddComment(): UseMutationResult<
  CommunityComment,
  unknown,
  { postId: string; content: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }) => addComment(postId, content),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      })
    },
  })
}
