/**
 * React Query hooks for chat API (Mobile)
 * Uses hardened API client for all requests
 * Location: apps/mobile/src/hooks/api/use-chat.ts
 */

import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { Message } from '@/lib/types'
import { apiClient } from '@/utils/api-client'

/**
 * Fetch chat messages
 */
function fetchMessages(
  chatRoomId: string,
  cursor?: string
): Promise<{ items: Message[]; nextCursor?: string }> {
  const endpoint = cursor
    ? `/api/chat/${chatRoomId}/messages?cursor=${cursor}`
    : `/api/chat/${chatRoomId}/messages`
  return apiClient.get<{ items: Message[]; nextCursor?: string }>(endpoint, {
    cacheKey: `chat:${chatRoomId}:messages:${cursor || 'initial'}`,
    skipCache: false,
  })
}

/**
 * Send a message
 */
async function sendMessage(chatRoomId: string, content: string): Promise<Message> {
  const data = await apiClient.post<{ message?: Message } | Message>(
    `/api/chat/${chatRoomId}/messages`,
    { content },
    {
      skipCache: true,
    }
  )
  return (data as { message?: Message }).message || (data as Message)
}

/**
 * Mark message as read
 */
function markMessageAsRead(chatRoomId: string, messageId: string): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(`/api/chat/${chatRoomId}/messages/${messageId}/read`)
}

/**
 * Hook to get chat messages (infinite scroll)
 */
export function useChatMessages(
  chatRoomId: string | null | undefined
): ReturnType<typeof useInfiniteQuery<Message[]>> {
  return useInfiniteQuery({
    queryKey: chatRoomId ? queryKeys.chat.messages(chatRoomId) : ['chat', 'messages', 'null'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<Message[]> => {
      if (!chatRoomId) {
        throw new Error('Chat room ID is required')
      }
      const response = await fetchMessages(chatRoomId, pageParam)
      return response.items
    },
    enabled: !!chatRoomId,
    getNextPageParam: (): string | undefined => {
      // Return cursor for next page if available
      return undefined
    },
    staleTime: 30 * 1000, // 30 seconds for messages
    gcTime: 5 * 60 * 1000, // 5 minutes
    initialPageParam: undefined,
  })
}

/**
 * Hook to send a message
 */
export function useSendMessage(): UseMutationResult<
  Message,
  unknown,
  { chatRoomId: string; content: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatRoomId, content }: { chatRoomId: string; content: string }) =>
      sendMessage(chatRoomId, content),
    onSuccess: (_data, variables) => {
      // Optimistically add message to cache
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      })
    },
  })
}

/**
 * Hook to mark a message as read
 */
export function useMarkAsRead(): UseMutationResult<
  { success: boolean },
  unknown,
  { chatRoomId: string; messageId: string }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatRoomId, messageId }: { chatRoomId: string; messageId: string }) =>
      markMessageAsRead(chatRoomId, messageId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      })
    },
  })
}
