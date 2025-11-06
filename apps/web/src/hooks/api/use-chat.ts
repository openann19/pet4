/**
 * React Query hooks for chat API (Web)
 * Location: apps/web/src/hooks/api/use-chat.ts
 */

import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { chatAPI } from '@/lib/api-services'
import type { Message } from '@/lib/api-schemas'

/**
 * Hook to get chat messages (infinite scroll)
 */
export function useChatMessages(
  chatRoomId: string | null | undefined
): ReturnType<typeof useInfiniteQuery<Message[]>> {
  return useInfiniteQuery({
    queryKey: chatRoomId ? queryKeys.chat.messages(chatRoomId) : ['chat', 'messages', 'null'],
    queryFn: async ({ pageParam }) => {
      if (!chatRoomId) {
        throw new Error('Chat room ID is required')
      }
      const response = await chatAPI.getMessages(chatRoomId, pageParam as string | undefined)
      return response.items
    },
    enabled: !!chatRoomId,
    getNextPageParam: (lastPage, allPages) => {
      // Return cursor for next page if available
      // This depends on your API response structure
      return undefined
    },
    staleTime: 30 * 1000, // 30 seconds for messages
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to send a message
 */
export function useSendMessage(): UseMutationResult<
  Message,
  unknown,
  { chatRoomId: string; content: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatRoomId, content }: { chatRoomId: string; content: string }) =>
      chatAPI.sendMessage(chatRoomId, content),
    onSuccess: (data, variables) => {
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
  { chatRoomId: string; messageId: string },
  unknown
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatRoomId, messageId }: { chatRoomId: string; messageId: string }) =>
      chatAPI.markAsRead(chatRoomId, messageId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      })
    },
  })
}
