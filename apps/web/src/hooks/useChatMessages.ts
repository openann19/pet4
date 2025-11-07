import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatMessages as useChatMessagesQuery, useSendMessage as useSendMessageMutation } from '@/hooks/api/use-chat'
import { useOutbox } from '@/hooks/useOutbox'
import type { ChatMessage, ReactionType } from '@/lib/chat-types'
import { 
  groupMessagesByDate, 
  generateMessageId,
  getReactionsArray
} from '@/lib/chat-utils'
import { queryKeys } from '@/lib/query-client'
import { chatAPI } from '@/lib/api-services'
import { isTruthy, isDefined } from '@/core/guards';

interface UseChatMessagesOptions {
  roomId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
}

export function useChatMessages({
  roomId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: UseChatMessagesOptions) {
  const queryClient = useQueryClient()
  const { data: messagesPages, ...queryResult } = useChatMessagesQuery(roomId)
  const sendMessageMutation = useSendMessageMutation()

  // Outbox for offline message queuing
  const outbox = useOutbox({
    storageKey: `chat-outbox-${String(roomId ?? '')}`,
    sendFn: async (payload: unknown) => {
      const { chatRoomId, content } = payload as { chatRoomId: string; content: string }
      await chatAPI.sendMessage(chatRoomId, content)
    },
    onFlush: () => {
      // Invalidate messages query after successful flush
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(roomId),
      })
    },
  })

  // Flatten infinite query pages into a single array and transform API messages to ChatMessage format
  const messages = useMemo(() => {
    if (!messagesPages?.pages) return []
    return messagesPages.pages.flat().map((msg): ChatMessage => {
      const chatMessage: ChatMessage = {
        id: msg.id,
        roomId: msg.chatRoomId || roomId,
        senderId: msg.senderId,
        type: msg.type || 'text',
        content: msg.content,
        status: msg.status || 'sent',
        timestamp: msg.createdAt,
        createdAt: msg.createdAt,
        reactions: msg.reactions || [],
      }
      // senderName and senderAvatar are optional, omit if not provided
      return chatMessage
    })
  }, [messagesPages, roomId])

  const messageGroups = useMemo(() => {
    return groupMessagesByDate(messages || [])
  }, [messages])

  const sendMessage = useCallback((
    content: string,
    type: 'text' | 'sticker' | 'voice' = 'text',
    metadata?: ChatMessage['metadata']
  ) => {
    if (!content.trim() && type === 'text') return null

    const newMessage: ChatMessage = {
      id: generateMessageId(),
      roomId,
      senderId: currentUserId,
      senderName: currentUserName,
      ...(currentUserAvatar !== undefined && currentUserAvatar !== null && { senderAvatar: currentUserAvatar }),
      content: type === 'text' ? content.trim() : content,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      reactions: [],
      ...(metadata !== undefined && { metadata })
    }

    // Optimistically update cache
    queryClient.setQueryData(queryKeys.chat.messages(roomId), (old: { pages: ChatMessage[][] } | undefined) => {
      if (!old) {
        return { pages: [[newMessage]], pageParams: [undefined] }
      }
      return {
        ...old,
        pages: [[newMessage, ...old.pages[0] || []]]
      }
    })

    // Send via API or queue in outbox (only for text/sticker, voice handled separately)
    if (type !== 'voice') {
      const payload = {
        chatRoomId: roomId,
        content: type === 'sticker' ? content : content.trim()
      }

      // Use outbox for offline queuing with idempotent clientId
      if (isTruthy(outbox.isOnline)) {
        // Try sending immediately if online
        sendMessageMutation.mutate(payload, {
          onError: () => {
            // If send fails, queue in outbox
            outbox.enqueue(newMessage.id, payload, newMessage.id)
          }
        })
      } else {
        // Queue in outbox if offline
        outbox.enqueue(newMessage.id, payload, newMessage.id)
      }
    }

    return newMessage
  }, [roomId, currentUserId, currentUserName, currentUserAvatar, queryClient, sendMessageMutation, outbox])

  const addReaction = useCallback((messageId: string, emoji: ReactionType) => {
    queryClient.setQueryData(queryKeys.chat.messages(roomId), (old: { pages: ChatMessage[][] } | undefined) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map(page =>
          page.map(msg => {
            if (msg.id === messageId) {
              const normalizedReactions = getReactionsArray(msg.reactions)
              const existingReaction = normalizedReactions.find(r => 
                r.userIds?.includes(currentUserId) && r.emoji === emoji
              )
              
              if (isTruthy(existingReaction)) {
                // Remove user from reaction
                const updatedReactions = normalizedReactions.map(r => {
                  if (r.emoji === emoji && r.userIds) {
                    return {
                      ...r,
                      userIds: r.userIds.filter(id => id !== currentUserId),
                      count: (r.count ?? 0) - 1
                    }
                  }
                  return r
                }).filter(r => (r.count ?? 0) > 0)
                
                return {
                  ...msg,
                  reactions: updatedReactions
                }
              } else {
                // Add user to reaction or create new reaction
                const reactionIndex = normalizedReactions.findIndex(r => r.emoji === emoji)
                if (reactionIndex >= 0) {
                  const updatedReactions = [...normalizedReactions]
                  const existing = updatedReactions[reactionIndex]
                  if (isTruthy(existing)) {
                    updatedReactions[reactionIndex] = {
                      ...existing,
                      userIds: [...(existing.userIds ?? []), currentUserId],
                      count: (existing.count ?? 0) + 1
                    }
                  }
                  return {
                    ...msg,
                    reactions: updatedReactions
                  }
                } else {
                  return {
                    ...msg,
                    reactions: [...normalizedReactions, {
                      emoji,
                      userIds: [currentUserId],
                      count: 1
                    }]
                  }
                }
              }
            }
            return msg
          })
        )
      }
    })
  }, [currentUserId, queryClient, roomId])

  const markAsRead = useCallback(() => {
    queryClient.setQueryData(queryKeys.chat.messages(roomId), (old: { pages: ChatMessage[][] } | undefined) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map(page =>
          page.map(msg => 
            msg.senderId !== currentUserId && msg.status !== 'read'
              ? { ...msg, status: 'read' as const }
              : msg
          )
        )
      }
    })
  }, [currentUserId, queryClient, roomId])

  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    queryClient.setQueryData(queryKeys.chat.messages(roomId), (_old: { pages: ChatMessage[][] } | undefined) => {
      const newMessages = typeof updater === 'function' 
        ? updater(messages)
        : updater
      return {
        pages: [newMessages],
        pageParams: [undefined]
      }
    })
  }, [messages, queryClient, roomId])

  return {
    messages,
    messageGroups,
    sendMessage,
    addReaction,
    markAsRead,
    setMessages,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    outboxQueue: outbox.queue,
    isOnline: outbox.isOnline,
  }
}

