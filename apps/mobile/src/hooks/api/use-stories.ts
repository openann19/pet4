/**
 * React Query hooks for stories and highlights API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-stories.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '@/lib/query-client'
import { apiClient } from '@/utils/api-client'
import type { StoryHighlight } from '@shared/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('StoriesAPIHooks')

/**
 * Fetch user's story highlights
 */
async function fetchHighlights(userId: string): Promise<StoryHighlight[]> {
  try {
    const result = await apiClient.get<StoryHighlight[]>(`/stories/highlights?userId=${userId}`, {
      cacheKey: `stories:highlights:${userId}`,
      skipCache: false,
    })
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to fetch highlights', err, { userId })
    return []
  }
}

/**
 * Create a new story highlight
 */
async function createHighlight(
  userId: string,
  petId: string,
  title: string,
  coverImage: string,
  storyIds: string[]
): Promise<StoryHighlight> {
  return apiClient.post<StoryHighlight>('/stories/highlights', {
    userId,
    petId,
    title,
    coverImage,
    storyIds,
  })
}

/**
 * Update a story highlight (add/remove stories)
 */
async function updateHighlight(
  highlightId: string,
  updates: {
    title?: string
    coverImage?: string
    storyIds?: string[]
    isPinned?: boolean
  }
): Promise<StoryHighlight> {
  return apiClient.put<StoryHighlight>(`/stories/highlights/${highlightId}`, updates)
}

/**
 * Delete a story highlight
 */
async function deleteHighlight(highlightId: string): Promise<void> {
  return apiClient.delete<void>(`/stories/highlights/${highlightId}`)
}

/**
 * Add a story to a highlight
 */
async function addStoryToHighlight(highlightId: string, storyId: string): Promise<StoryHighlight> {
  return apiClient.post<StoryHighlight>(`/stories/highlights/${highlightId}/stories`, { storyId })
}

/**
 * Hook to fetch user's story highlights
 */
export function useStoryHighlights(userId: string): UseQueryResult<StoryHighlight[], Error> {
  return useQuery({
    queryKey: queryKeys.stories.highlights(userId),
    queryFn: () => fetchHighlights(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new story highlight
 */
export function useCreateHighlight(): UseMutationResult<
  StoryHighlight,
  Error,
  {
    userId: string
    petId: string
    title: string
    coverImage: string
    storyIds: string[]
  },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.stories.createHighlight,
    mutationFn: async data => {
      return createHighlight(data.userId, data.petId, data.title, data.coverImage, data.storyIds)
    },
    onSuccess: newHighlight => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.highlights(newHighlight.userId),
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create highlight', err)
    },
  })
}

/**
 * Hook to update a story highlight
 */
export function useUpdateHighlight(): UseMutationResult<
  StoryHighlight,
  Error,
  {
    highlightId: string
    updates: {
      title?: string
      coverImage?: string
      storyIds?: string[]
      isPinned?: boolean
    }
  },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.stories.updateHighlight,
    mutationFn: async ({ highlightId, updates }) => {
      return updateHighlight(highlightId, updates)
    },
    onSuccess: updatedHighlight => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.highlights(updatedHighlight.userId),
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update highlight', err)
    },
  })
}

/**
 * Hook to add a story to a highlight
 */
export function useAddStoryToHighlight(): UseMutationResult<
  StoryHighlight,
  Error,
  { highlightId: string; storyId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.stories.addStoryToHighlight,
    mutationFn: async ({ highlightId, storyId }) => {
      return addStoryToHighlight(highlightId, storyId)
    },
    onSuccess: updatedHighlight => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.highlights(updatedHighlight.userId),
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to add story to highlight', err)
    },
  })
}

/**
 * Hook to delete a story highlight
 */
export function useDeleteHighlight(): UseMutationResult<
  void,
  Error,
  { highlightId: string; userId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.stories.deleteHighlight,
    mutationFn: async ({ highlightId }) => {
      return deleteHighlight(highlightId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stories.highlights(variables.userId),
      })
    },
    onError: error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to delete highlight', err)
    },
  })
}
