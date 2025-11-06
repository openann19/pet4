/**
 * React Query hooks for chat API (Mobile)
 * Location: apps/mobile/src/hooks/api/use-chat.ts
 */

import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import type { Message } from '@/lib/types'

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'https://api.petspark.app'

/**
 * Fetch chat messages
 */
async function fetchMessages(chatRoomId: string, cursor?: string): Promise<{ items: Message[]; nextCursor?: string }> {
  const url = cursor
    ? `${API_BASE_URL}/api/chat/${chatRoomId}/messages?cursor=${cursor}`
    : `${API_BASE_URL}/api/chat/${chatRoomId}/messages`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Send a message
 */
async function sendMessage(chatRoomId: string, content: string): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`)
  }

  const data = await response.json()
  return data.message
}

/**
 * Mark message as read
 */
async function markMessageAsRead(chatRoomId: string, messageId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/chat/${chatRoomId}/messages/${messageId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to mark message as read: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

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
      const response = await fetchMessages(chatRoomId, pageParam as string | undefined)
      return response.items
    },
    enabled: !!chatRoomId,
    getNextPageParam: () => {
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
  { chatRoomId: string; content: string },
  unknown
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
  { chatRoomId: string; messageId: string },
  unknown
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
