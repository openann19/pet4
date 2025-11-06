/**
 * React Query hooks for community API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-community.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { communityAPI } from '@/lib/api-services'
import type { CommunityPost, CommunityComment } from '@/lib/types'

/**
 * Hook to get community posts
 */
export function useCommunityPosts(
  category?: string
): UseQueryResult<CommunityPost[]> {
  return useQuery({
    queryKey: queryKeys.community.posts(category),
    queryFn: () => communityAPI.getPosts(category),
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
      const post = await communityAPI.getPost(postId)
      const comments = await communityAPI.getComments(postId)
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
      communityAPI.createPost(title, content, category, images),
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
  { postId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId }) => communityAPI.likePost(postId),
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
    mutationFn: ({ postId, content }) =>
      communityAPI.addComment(postId, content),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      })
    },
  })
}
