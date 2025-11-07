/**
 * Shared Chat Module
 * 
 * Exports all chat-related types and schemas.
 * Types are exported from schemas to avoid duplication.
 */

export * from './schemas'
export type {
  MessageTemplate,
  TypingUser,
  SmartSuggestion,
  Sticker,
  MessageCluster,
} from './types'

// Re-export constants
export { REACTION_EMOJIS, MESSAGE_TEMPLATES } from './types'

