import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient, endpoints } from '@/lib/api'
import type { Post, CreatePostData, UpdatePostData } from '@shared/types'

interface PostsResponse {
  posts: Post[]
  hasMore: boolean
  total: number
}

interface InfinitePostsData {
  pages: PostsResponse[]
  pageParams: unknown[]
}

export function usePosts(_page = 1, limit = 10) {
  const queryClient = useQueryClient()

  // Get posts feed
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PostsResponse>({
      queryKey: ['posts', 'feed'],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await apiClient.get(endpoints.posts.feed, { page: pageParam, limit })
        return response.data as PostsResponse
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length + 1 : undefined
      },
      staleTime: 30 * 1000, // 30 seconds
    })

  const posts = data?.pages.flatMap(page => page.posts) || []

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await apiClient.post(endpoints.posts.create, data)
      return response.data as Post
    },
    onSuccess: newPost => {
      // Add new post to the beginning of the first page
      queryClient.setQueryData(['posts', 'feed'], (old: InfinitePostsData | undefined) => {
        if (!old?.pages?.[0]) return old
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              posts: [newPost, ...old.pages[0].posts],
              total: old.pages[0].total + 1,
            },
            ...old.pages.slice(1),
          ],
        }
      })
    },
  })

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePostData }) => {
      const response = await apiClient.put(`${endpoints.posts.update}/${id}`, data)
      return response.data as Post
    },
    onSuccess: updatedPost => {
      // Update post in all cached pages
      queryClient.setQueriesData(
        { queryKey: ['posts', 'feed'] },
        (old: InfinitePostsData | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PostsResponse) => ({
              ...page,
              posts: page.posts.map(post => (post.id === updatedPost.id ? updatedPost : post)),
            })),
          }
        }
      )
    },
  })

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${endpoints.posts.delete}/${id}`)
      return id
    },
    onSuccess: deletedId => {
      // Remove post from all cached pages
      queryClient.setQueriesData(
        { queryKey: ['posts', 'feed'] },
        (old: InfinitePostsData | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PostsResponse) => ({
              ...page,
              posts: page.posts.filter(post => post.id !== deletedId),
              total: page.total - 1,
            })),
          }
        }
      )
      // Also remove individual post cache if it exists
      queryClient.removeQueries({ queryKey: ['post', deletedId] })
    },
  })

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiClient.post(`${endpoints.posts.like}/${postId}`)
      return response.data as { likeCount: number; isLiked: boolean }
    },
    onSuccess: (data, postId) => {
      // Update like count in all cached pages
      queryClient.setQueriesData(
        { queryKey: ['posts', 'feed'] },
        (old: InfinitePostsData | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PostsResponse) => ({
              ...page,
              posts: page.posts.map(post =>
                post.id === postId
                  ? { ...post, likeCount: data.likeCount, isLiked: data.isLiked }
                  : post
              ),
            })),
          }
        }
      )
      // Also update individual post cache if it exists
      queryClient.setQueryData(['post', postId], (old: Post | undefined) =>
        old ? { ...old, likeCount: data.likeCount, isLiked: data.isLiked } : old
      )
    },
  })

  // Unlike post mutation
  const unlikePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiClient.post(`${endpoints.posts.unlike}/${postId}`)
      return response.data as { likeCount: number; isLiked: boolean }
    },
    onSuccess: (data, postId) => {
      // Update like count in all cached pages
      queryClient.setQueriesData(
        { queryKey: ['posts', 'feed'] },
        (old: InfinitePostsData | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PostsResponse) => ({
              ...page,
              posts: page.posts.map(post =>
                post.id === postId
                  ? { ...post, likeCount: data.likeCount, isLiked: data.isLiked }
                  : post
              ),
            })),
          }
        }
      )
      // Also update individual post cache if it exists
      queryClient.setQueryData(['post', postId], (old: Post | undefined) =>
        old ? { ...old, likeCount: data.likeCount, isLiked: data.isLiked } : old
      )
    },
  })

  return {
    posts,
    data,
    isLoading,
    error,
    hasNextPage: hasNextPage || false,
    createPost: useCallback(
      (data: CreatePostData) => createPostMutation.mutateAsync(data),
      [createPostMutation]
    ),
    updatePost: useCallback(
      ({ id, data }: { id: string; data: UpdatePostData }) =>
        updatePostMutation.mutateAsync({ id, data }),
      [updatePostMutation]
    ),
    deletePost: useCallback(
      (id: string) => deletePostMutation.mutateAsync(id),
      [deletePostMutation]
    ),
    likePost: useCallback(
      (postId: string) => likePostMutation.mutateAsync(postId),
      [likePostMutation]
    ),
    unlikePost: useCallback(
      (postId: string) => unlikePostMutation.mutateAsync(postId),
      [unlikePostMutation]
    ),
    isCreatingPost: createPostMutation.isPending,
    isUpdatingPost: updatePostMutation.isPending,
    isDeletingPost: deletePostMutation.isPending,
    isLikingPost: likePostMutation.isPending,
    isUnlikingPost: unlikePostMutation.isPending,
    isFetchingNextPage,
    fetchNextPage,
  }
}

export function usePost(id: string) {
  const {
    data: post,
    isLoading,
    error,
  } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await apiClient.get(`${endpoints.posts.feed}/${id}`)
      return response.data as Post
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    post,
    isLoading,
    error,
  }
}
