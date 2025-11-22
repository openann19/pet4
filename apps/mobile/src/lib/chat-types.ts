/**
 * Chat Types (Mobile)
 * Matches web implementation for parity
 */

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'sticker' | 'pet-card'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐'

export const REACTION_EMOJIS: ReactionType[] = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']

export interface MessageAttachment {
  id: string
  type: 'photo' | 'video' | 'voice' | 'document'
  url: string
  thumbnail?: string
  name?: string
  size?: number
  duration?: number
  mimeType?: string
}

export interface MessageReaction {
  emoji: ReactionType
  userId: string
  userName: string
  userAvatar?: string
  timestamp: string
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  type: MessageType
  content: string
  status: MessageStatus
  timestamp?: string
  createdAt: string
  attachments?: MessageAttachment[]
  metadata?: {
    messageId?: string
    translation?: {
      originalLang: string
      translatedText: string
      targetLang: string
    }
    media?: {
      url: string
      thumbnail?: string
      width?: number
      height?: number
      duration?: number
      size?: number
      mimeType?: string
    }
    location?: {
      lat: number
      lng: number
      latitude?: number
      longitude?: number
      address?: string
    }
    voiceNote?: {
      waveform: number[]
      duration: number
    }
    sticker?: {
      id: string
      pack: string
    }
    petCard?: {
      petId: string
      petName: string
      petPhoto?: string
    }
    replyTo?: string
  }
  reactions?: MessageReaction[]
  updatedAt?: string
  deletedAt?: string
  deletedFor?: string[]
}

export type ChatMessage = Message

export interface TypingUser {
  userId: string
  userName: string
  startedAt: string
}

export interface ChatRoom {
  id: string
  participantIds?: string[]
  type?: 'direct' | 'group'
  lastMessage?: Message
  lastMessageAt?: string
  unreadCount?: Record<string, number> | number
  matchedPetId?: string
  matchId?: string
  matchedPetName?: string
  matchedPetPhoto?: string
  isTyping?: boolean
  typingUsers?: TypingUser[]
  createdAt?: string
  updatedAt?: string
}

export interface MessageTemplate {
  id: string
  text: string
  title?: string
  icon?: string
  content?: string
  category: 'greeting' | 'playdate' | 'followup' | 'closing'
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: 'greet-1', text: 'Hey! Your pet looks adorable!', category: 'greeting' },
  { id: 'greet-2', text: 'Hi there! Would love to set up a playdate!', category: 'greeting' },
  { id: 'playdate-1', text: 'Want to meet up at the park this weekend?', category: 'playdate' },
  { id: 'playdate-2', text: 'Are you free for a playdate?', category: 'playdate' },
  { id: 'followup-1', text: 'Thanks for the great time!', category: 'followup' },
  { id: 'closing-1', text: 'Talk to you soon!', category: 'closing' },
]

export interface SmartSuggestion {
  id: string
  text: string
  category: 'greeting' | 'question' | 'suggestion' | 'closing'
}

// Legacy compatibility types
export interface ChatThread {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
    status: 'online' | 'offline' | 'typing'
  }>
  messages: ChatMessage[]
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: number
  updatedAt: number
}
