/**
 * React Query hooks for community API (Web)
 * Location: apps/web/src/hooks/api/use-community.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { communityAPI } from '@/lib/api-services';
import type { CommunityPost, Comment } from '@/lib/api-schemas';

export interface CreatePostData {
  content: string;
  photos?: string[];
  visibility?: 'public' | 'matches' | 'followers' | 'private';
  [key: string]: unknown;
}

export interface AddCommentData {
  content: string;
}

/**
 * Hook to get community feed (infinite scroll)
 */
export function useCommunityFeed(options?: {
  mode?: string;
  lat?: number;
  lng?: number;
}): ReturnType<typeof useInfiniteQuery<CommunityPost[]>> {
  return useInfiniteQuery({
    queryKey: [...queryKeys.community.posts, options],
    queryFn: async ({ pageParam }) => {
      const response = await communityAPI.getFeed({
        ...options,
        // Add pagination params if needed
      });
      return response.items;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage, allPages) => {
      // Return cursor for next page if available
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get a single post
 */
export function usePost(id: string | null | undefined): UseQueryResult<CommunityPost> {
  return useQuery({
    queryKey: id ? queryKeys.community.post(id) : ['community', 'posts', 'null'],
    queryFn: async () => {
      if (!id) {
        throw new Error('Post ID is required');
      }
      return await communityAPI.getPost(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new post
 */
export function useCreatePost(): UseMutationResult<
  CommunityPost,
  unknown,
  CreatePostData,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostData) => communityAPI.createPost(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.community.posts });
    },
  });
}

/**
 * Hook to delete a post
 */
export function useDeletePost(): UseMutationResult<{ success: boolean }, unknown, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => communityAPI.deletePost(id),
    onSuccess: (_, id) => {
      void queryClient.removeQueries({ queryKey: queryKeys.community.post(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.community.posts });
    },
  });
}

/**
 * Hook to get comments for a post
 */
export function useComments(postId: string | null | undefined): UseQueryResult<Comment[]> {
  return useQuery({
    queryKey: postId ? queryKeys.community.comments(postId) : ['community', 'comments', 'null'],
    queryFn: async () => {
      if (!postId) {
        throw new Error('Post ID is required');
      }
      return await communityAPI.getComments(postId);
    },
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a comment to a post
 */
export function useAddComment(): UseMutationResult<
  Comment,
  unknown,
  { postId: string; data: AddCommentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: AddCommentData }) =>
      communityAPI.addComment(postId, data.content),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.comments(variables.postId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      });
    },
  });
}

/**
 * Hook to react to a post
 */
export function useReactToPost(): UseMutationResult<
  { success: boolean },
  unknown,
  { postId: string; emoji: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      communityAPI.reactToPost(postId, emoji),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.community.post(variables.postId),
      });
    },
  });
}
