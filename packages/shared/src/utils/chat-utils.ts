import { generateULID } from './utils'

export interface ChatRoom {
  id: string
  matchId: string
  petId: string
  matchedPetId: string
  petName: string
  matchedPetName: string
  petPhoto: string
  matchedPetPhoto: string
  lastMessage?: ChatMessage
  unreadCount?: number
  updatedAt: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'sticker' | 'voice' | 'location' | 'pet-card'
  timestamp: string
  createdAt: string
  status: 'sent' | 'delivered' | 'read'
  reactions?: MessageReaction[]
  attachments?: MessageAttachment[]
  metadata?: Record<string, unknown>
}

export interface MessageReaction {
  emoji: ReactionType
  userId: string
  userName: string
  userAvatar?: string
  timestamp: string
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'file'
  url: string
  name?: string
  size?: number
}

export type ReactionType = '❤️' | '👍' | '😂' | '😢' | '😡' | '🐶' | '🐱'
export const REACTION_EMOJIS: ReactionType[] = ['❤️', '👍', '😂', '😢', '😡', '🐶', '🐱']

export function createChatRoom(
  matchId: string,
  petId: string,
  matchedPetId: string,
  petName: string,
  matchedPetName: string,
  petPhoto: string,
  matchedPetPhoto: string
): ChatRoom {
  const now = new Date().toISOString()
  return {
    id: generateULID(),
    matchId,
    petId,
    matchedPetId,
    petName,
    matchedPetName,
    petPhoto,
    matchedPetPhoto,
    updatedAt: now,
    createdAt: now,
  }
}

export function formatChatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function getReactionsArray(reactions?: MessageReaction[]): MessageReaction[] {
  if (!reactions) return []
  return Object.values(reactions)
}
