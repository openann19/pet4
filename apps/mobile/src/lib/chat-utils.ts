/**
 * Chat Utilities (Mobile)
 * Matches web implementation for parity
 */

import { v4 as uuidv4 } from 'uuid'
import type { MessageTemplate } from './chat-types'

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${String(Date.now() ?? '')}_${String(uuidv4().slice(0, 8) ?? '')}`
}

/**
 * Chat stickers catalog
 */
export interface ChatSticker {
  id: string
  name: string
  emoji: string
  category: string
}

export const CHAT_STICKERS: ChatSticker[] = [
  { id: 'sticker-1', name: 'Happy', emoji: '😊', category: 'emotions' },
  { id: 'sticker-2', name: 'Love', emoji: '❤️', category: 'emotions' },
  { id: 'sticker-3', name: 'Laugh', emoji: '😂', category: 'emotions' },
  { id: 'sticker-4', name: 'Thumbs Up', emoji: '👍', category: 'gestures' },
  { id: 'sticker-5', name: 'Fire', emoji: '🔥', category: 'emotions' },
  { id: 'sticker-6', name: 'Party', emoji: '🎉', category: 'celebration' },
  { id: 'sticker-7', name: 'Star', emoji: '⭐', category: 'gestures' },
  { id: 'sticker-8', name: 'Clap', emoji: '👏', category: 'gestures' },
  { id: 'sticker-9', name: 'Pray', emoji: '🙏', category: 'gestures' },
  { id: 'sticker-10', name: 'Cool', emoji: '😎', category: 'emotions' },
  { id: 'sticker-11', name: 'Heart Eyes', emoji: '😍', category: 'emotions' },
  { id: 'sticker-12', name: 'Wink', emoji: '😉', category: 'emotions' },
  { id: 'sticker-13', name: 'Thinking', emoji: '🤔', category: 'emotions' },
  { id: 'sticker-14', name: 'OK', emoji: '👌', category: 'gestures' },
  { id: 'sticker-15', name: 'Rock', emoji: '🤘', category: 'gestures' },
  { id: 'sticker-16', name: 'Celebrate', emoji: '🎊', category: 'celebration' },
  { id: 'sticker-17', name: 'Confetti', emoji: '🎈', category: 'celebration' },
  { id: 'sticker-18', name: 'Gift', emoji: '🎁', category: 'celebration' },
]
