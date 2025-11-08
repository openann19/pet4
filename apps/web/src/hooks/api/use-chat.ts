/**
 * React Query hooks for chat API (Web)
 * Location: apps/web/src/hooks/api/use-chat.ts
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { chatAPI } from '@/lib/api-services';
import type { Message } from '@/lib/api-schemas';

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
        throw new Error('Chat room ID is required');
      }
      const response = await chatAPI.getMessages(chatRoomId, pageParam as string | undefined);
      return response.items;
    },
    enabled: !!chatRoomId,
    getNextPageParam: (lastPage, allPages) => {
      // Return cursor for next page if available
      // This depends on your API response structure
      return undefined;
    },
    staleTime: 30 * 1000, // 30 seconds for messages
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatRoomId, content }: { chatRoomId: string; content: string }) =>
      chatAPI.sendMessage(chatRoomId, content),
    onSuccess: (data, variables) => {
      // Optimistically add message to cache
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      });
    },
  });
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatRoomId, messageId }: { chatRoomId: string; messageId: string }) =>
      chatAPI.markAsRead(chatRoomId, messageId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      });
    },
  });
}

/**
 * Voice message data structure
 */
export interface VoiceMessageData {
  blob: string;
  duration: number;
  waveform: number[];
}

/**
 * Hook to get voice messages for a room
 * Uses React Query with IndexedDB persistence
 */
export function useVoiceMessages(roomId: string): {
  voiceMessages: Record<string, VoiceMessageData>;
  setVoiceMessage: (messageId: string, data: VoiceMessageData) => void;
  removeVoiceMessage: (messageId: string) => void;
  isLoading: boolean;
  isError: boolean;
} {
  const queryClient = useQueryClient();
  const { data: voiceMessages = {}, ...queryResult } = useQuery({
    queryKey: queryKeys.chat.voiceMessages(roomId),
    queryFn: async () => {
      // Load from IndexedDB via storage adapter
      const { idbStorage } = await import('@/lib/storage-adapter');
      const key = `voice-messages-${roomId}`;
      const stored = await idbStorage.getItem(key);
      if (!stored) return {} as Record<string, VoiceMessageData>;
      return JSON.parse(stored) as Record<string, VoiceMessageData>;
    },
    staleTime: Infinity, // Voice messages are static once created
    gcTime: 30 * 24 * 60 * 60 * 1000, // Keep for 30 days
  });

  const setVoiceMessage = useMutation({
    mutationFn: async ({ messageId, data }: { messageId: string; data: VoiceMessageData }) => {
      const { idbStorage } = await import('@/lib/storage-adapter');
      const key = `voice-messages-${roomId}`;
      // Get current state from query cache
      const current =
        queryClient.getQueryData<Record<string, VoiceMessageData>>(
          queryKeys.chat.voiceMessages(roomId)
        ) || {};
      const updated = { ...current, [messageId]: data };
      await idbStorage.setItem(key, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.chat.voiceMessages(roomId), updated);
    },
  });

  const removeVoiceMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { idbStorage } = await import('@/lib/storage-adapter');
      const key = `voice-messages-${roomId}`;
      // Get current state from query cache
      const current =
        queryClient.getQueryData<Record<string, VoiceMessageData>>(
          queryKeys.chat.voiceMessages(roomId)
        ) || {};
      const { [messageId]: _, ...updated } = current;
      await idbStorage.setItem(key, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.chat.voiceMessages(roomId), updated);
    },
  });

  return {
    voiceMessages,
    setVoiceMessage: (messageId: string, data: VoiceMessageData) =>
      setVoiceMessage.mutate({ messageId, data }),
    removeVoiceMessage: (messageId: string) => removeVoiceMessage.mutate(messageId),
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
  };
}
