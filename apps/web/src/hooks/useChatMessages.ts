import { useCallback, useMemo } from 'react'
import { useStorage } from '@/hooks/useStorage'
import type { ChatMessage, ReactionType } from '@/lib/chat-types'
import { 
  groupMessagesByDate, 
  generateMessageId,
  getReactionsArray
} from '@/lib/chat-utils'

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
  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${roomId}`, [])

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
      status: 'sent',
      reactions: [],
      ...(metadata !== undefined && { metadata })
    }

    setMessages((current) => [...(current || []), newMessage])
    return newMessage
  }, [roomId, currentUserId, currentUserName, currentUserAvatar, setMessages])

  const addReaction = useCallback((messageId: string, emoji: ReactionType) => {
    setMessages((current) => 
      (current || []).map(msg => {
        if (msg.id === messageId) {
          const normalizedReactions = getReactionsArray(msg.reactions)
          const existingReaction = normalizedReactions.find(r => 
            r.userIds?.includes(currentUserId) && r.emoji === emoji
          )
          
          if (existingReaction) {
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
              if (existing) {
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
  }, [currentUserId, setMessages])

  const markAsRead = useCallback(() => {
    setMessages((current) =>
      (current || []).map(msg => 
        msg.senderId !== currentUserId && msg.status !== 'read'
          ? { ...msg, status: 'read' as const }
          : msg
      )
    )
  }, [currentUserId, setMessages])

  return {
    messages,
    messageGroups,
    sendMessage,
    addReaction,
    markAsRead,
    setMessages,
  }
}

