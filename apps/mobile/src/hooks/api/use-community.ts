/**
 * React Query hooks for community API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-community.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { CommunityPost, CommunityComment } from '@/lib/types'

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'https://api.petspark.app'

/**
 * Fetch community posts
 */
async function fetchPosts(category?: string): Promise<CommunityPost[]> {
  const url = category
    ? `${String(API_BASE_URL ?? '')}/api/v1/community/feed?category=${String(category ?? '')}`
    : `${String(API_BASE_URL ?? '')}/api/v1/community/feed`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data.items || data
}

/**
 * Fetch a single community post
 */
async function fetchPost(postId: string): Promise<CommunityPost> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/community/posts/${String(postId ?? '')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
}

/**
 * Fetch comments for a post
 */
async function fetchComments(postId: string): Promise<CommunityComment[]> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/community/posts/${String(postId ?? '')}/comments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
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
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/community/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content, category, images }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create post: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
}

/**
 * Like/unlike a post
 */
async function likePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/community/posts/${String(postId ?? '')}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emoji: '❤️' }),
  })

  if (!response.ok) {
    throw new Error(`Failed to like post: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return { liked: data.liked ?? true, likesCount: data.likesCount ?? 0 }
}

/**
 * Add a comment to a post
 */
async function addComment(postId: string, content: string): Promise<CommunityComment> {
  const response = await fetch(`${String(API_BASE_URL ?? '')}/api/v1/community/posts/${String(postId ?? '')}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    throw new Error(`Failed to add comment: ${String(response.statusText ?? '')}`)
  }

  const data = await response.json()
  return data
}

/**
 * Hook to get community posts
 */
export function useCommunityPosts(
  category?: string
): UseQueryResult<CommunityPost[]> {
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
  { title: string; content: string; category: string; images?: string[] }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, content, category, images }) =>
      createPost(title, content, category, images),
    onSuccess: (data) => {
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
  { postId: string }
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
  { postId: string; content: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }) =>
      addComment(postId, content),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      })
    },
  })
}
