/**
 * React Query hooks for chat API (Web)
 * Location: apps/web/src/hooks/api/use-chat.ts
 */

import type { QueryClient, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { chatAPI } from '@/lib/api-services';
import type { Message } from '@/lib/api-schemas';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useChat');

interface SendMessageInput {
  readonly chatRoomId: string;
  readonly content: string;
}

interface MarkAsReadInput {
  readonly chatRoomId: string;
  readonly messageId: string;
}

export type UseSendMessageReturn = UseMutationResult<
  Message,
  unknown,
  SendMessageInput,
  unknown
> & {
  readonly sendMessage: (input: SendMessageInput) => Promise<Message>;
};

export type UseMarkAsReadReturn = UseMutationResult<
  { success: boolean },
  unknown,
  MarkAsReadInput,
  unknown
> & {
  readonly markAsRead: (input: MarkAsReadInput) => Promise<{ success: boolean }>;
};

/**
 * Hook to get chat messages (infinite scroll)
 */
export function useChatMessages(
  chatRoomId: string | null | undefined
): ReturnType<typeof useInfiniteQuery<Message[]>> {
  return useInfiniteQuery({
    queryKey: chatRoomId ? queryKeys.chat.messages(chatRoomId) : ['chat', 'messages', 'null'],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      if (!chatRoomId) {
        throw new Error('Chat room ID is required');
      }
      const response = await chatAPI.getMessages(chatRoomId, pageParam as string | undefined);
      return response.items;
    },
    enabled: !!chatRoomId,
    getNextPageParam: () => undefined,
    staleTime: 30 * 1000, // 30 seconds for messages
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage(): UseSendMessageReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<Message, unknown, SendMessageInput>({
    mutationFn: ({ chatRoomId, content }) => chatAPI.sendMessage(chatRoomId, content),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      });
    },
  });

  const sendMessage = async (input: SendMessageInput): Promise<Message> => {
    try {
      return await mutation.mutateAsync(input);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send message', err, { chatRoomId: input.chatRoomId });
      throw err;
    }
  };

  return { ...mutation, sendMessage } satisfies UseSendMessageReturn;
}

/**
 * Hook to mark a message as read
 */
export function useMarkAsRead(): UseMarkAsReadReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<{ success: boolean }, unknown, MarkAsReadInput>({
    mutationFn: ({ chatRoomId, messageId }) => chatAPI.markAsRead(chatRoomId, messageId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.chatRoomId),
      });
    },
  });

  const markAsRead = async (input: MarkAsReadInput): Promise<{ success: boolean }> => {
    try {
      return await mutation.mutateAsync(input);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark message as read', err, {
        chatRoomId: input.chatRoomId,
        messageId: input.messageId,
      });
      throw err;
    }
  };

  return { ...mutation, markAsRead } satisfies UseMarkAsReadReturn;
}

/**
 * Voice message data structure
 */
export interface VoiceMessageData {
  blob: string;
  duration: number;
  waveform: number[];
}

interface VoiceMessageMutationInput {
  readonly messageId: string;
  readonly data: VoiceMessageData;
}

interface UseVoiceMessagesReturn {
  readonly voiceMessages: Record<string, VoiceMessageData>;
  readonly setVoiceMessage: (messageId: string, data: VoiceMessageData) => void;
  readonly removeVoiceMessage: (messageId: string) => void;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

async function fetchVoiceMessages(roomId: string): Promise<Record<string, VoiceMessageData>> {
  const { idbStorage } = await import('@/lib/storage-adapter');
  const key = `voice-messages-${roomId}`;
  const stored = await idbStorage.getItem(key);
  if (!stored) {
    return {};
  }
  return JSON.parse(stored) as Record<string, VoiceMessageData>;
}

function useSetVoiceMessageMutation(roomId: string, queryClient: QueryClient) {
  return useMutation<Record<string, VoiceMessageData>, unknown, VoiceMessageMutationInput>({
    mutationFn: async ({ messageId, data }) => {
      const { idbStorage } = await import('@/lib/storage-adapter');
      const key = `voice-messages-${roomId}`;
      const current =
        queryClient.getQueryData<Record<string, VoiceMessageData>>(
          queryKeys.chat.voiceMessages(roomId)
        ) ?? {};
      const updated = { ...current, [messageId]: data };
      await idbStorage.setItem(key, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.chat.voiceMessages(roomId), updated);
    },
  });
}

function useRemoveVoiceMessageMutation(roomId: string, queryClient: QueryClient) {
  return useMutation<Record<string, VoiceMessageData>, unknown, string>({
    mutationFn: async (messageId) => {
      const { idbStorage } = await import('@/lib/storage-adapter');
      const key = `voice-messages-${roomId}`;
      const current =
        queryClient.getQueryData<Record<string, VoiceMessageData>>(
          queryKeys.chat.voiceMessages(roomId)
        ) ?? {};
      const { [messageId]: _removed, ...updated } = current;
      await idbStorage.setItem(key, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.chat.voiceMessages(roomId), updated);
    },
  });
}

/**
 * Hook to get voice messages for a room
 * Uses React Query with IndexedDB persistence
 */
export function useVoiceMessages(roomId: string): UseVoiceMessagesReturn {
  const queryClient = useQueryClient();
  const queryResult = useQuery({
    queryKey: queryKeys.chat.voiceMessages(roomId),
    queryFn: () => fetchVoiceMessages(roomId),
    staleTime: Infinity, // Voice messages are static once created
    gcTime: 30 * 24 * 60 * 60 * 1000, // Keep for 30 days
  });

  const setVoiceMessage = useSetVoiceMessageMutation(roomId, queryClient);
  const removeVoiceMessage = useRemoveVoiceMessageMutation(roomId, queryClient);

  return {
    voiceMessages: queryResult.data ?? {},
    setVoiceMessage: (messageId: string, data: VoiceMessageData) =>
      setVoiceMessage.mutate({ messageId, data }),
    removeVoiceMessage: (messageId: string) => removeVoiceMessage.mutate(messageId),
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
  };
}
