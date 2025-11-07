/**
 * Chat Message Bubble Types
 * 
 * Defines the domain model for chat messages, reactions, read receipts, and media.
 */

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'sticker' | 'pet-card'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐'

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  type: MessageType
  content: string
  status: MessageStatus
  timestamp?: string // Alias for createdAt compatibility
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
      latitude?: number // Alias for compatibility
      longitude?: number // Alias for compatibility
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
  reactions?: MessageReaction[] | Record<ReactionType, string[]> // userIds who reacted
  createdAt: string
  updatedAt?: string
  deletedAt?: string
  deletedFor?: string[] // userIds who deleted this message
}

export interface MessageCluster {
  messages: Message[]
  senderId: string
  timestamp: string
  isCurrentUser: boolean
}

export interface ReadReceipt {
  userId: string
  messageId: string
  roomId: string
  readAt: string
}

export interface TypingIndicator {
  userId: string
  roomId: string
  startedAt: string
}

export interface ChatRoom {
  id: string
  participantIds: string[]
  type: 'direct' | 'group'
  lastMessage?: Message
  lastMessageAt?: string
  unreadCount?: Record<string, number> | number
  matchedPetId?: string
  matchId?: string // Alias for compatibility
  matchedPetName?: string
  matchedPetPhoto?: string
  isTyping?: boolean
  typingUsers?: TypingUser[]
  createdAt: string
  updatedAt: string
}

// Alias for compatibility
export type ChatMessage = Message

export interface MessageReport {
  id: string
  messageId: string
  roomId: string
  reportedBy: string
  reportedUserId: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other'
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
  action?: 'warning' | 'mute' | 'suspend' | 'no_action'
  createdAt: string
}

// Message templates for quick replies
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
  { id: 'closing-1', text: 'Talk to you soon!', category: 'closing' }
]

// Message attachment
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

// Message reaction
export interface MessageReaction {
  emoji: string
  userId?: string
  userName?: string
  userAvatar?: string
  timestamp?: string
  // For normalized reactions (from ReactionsRecord)
  userIds?: string[]
  count?: number
}

// Typing user
export interface TypingUser {
  userId: string
  userName: string
  startedAt: string
}

// Smart suggestion
export interface SmartSuggestion {
  id: string
  text: string
  category: 'greeting' | 'question' | 'suggestion' | 'closing'
  confidence?: number
  icon?: string
}

// Sticker type
export interface Sticker {
  id: string
  pack: string
  categoryId: string
  emoji: string
  label: string
  keywords: string[]
}

// Reaction emojis
export const REACTION_EMOJIS: ReactionType[] = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']
