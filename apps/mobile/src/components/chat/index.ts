/**
 * Chat Components Index
 * 
 * Exports all chat components:
 * - MessageBubble
 * - ChatList
 * - MediaViewer
 * - StickerMessage
 * - ReactionBurstParticles
 * - ConfettiBurst
 * - LinkPreview
 * - PresenceAvatar
 * - AdvancedChatWindow
 * - TypingIndicator
 * 
 * Location: apps/mobile/src/components/chat/index.ts
 */

export * from './ChatList'
export * from './MediaViewer'
export * from './MessageBubble'
export { default as MessageAttachments } from './MessageAttachments.native'
export { StickerMessage } from './StickerMessage.native'
export type { StickerMessageProps } from './StickerMessage.native'

export { ReactionBurstParticles } from './ReactionBurstParticles.native'
export type { ReactionBurstParticlesProps } from './ReactionBurstParticles.native'

export { ConfettiBurst } from './ConfettiBurst.native'
export type { ConfettiBurstProps, ConfettiParticle } from './ConfettiBurst.native'

export { LinkPreview } from './LinkPreview.native'
export type { LinkPreviewProps } from './LinkPreview.native'

export { PresenceAvatar } from './PresenceAvatar.native'
export type { PresenceAvatarProps } from './PresenceAvatar.native'

export { LiquidDots } from './LiquidDots.native'
export type { LiquidDotsProps } from './LiquidDots.native'

export { default as TypingIndicator } from './TypingIndicator.native'

export { default as AdvancedChatWindow } from './AdvancedChatWindow.native'
export type { AdvancedChatWindowProps } from './AdvancedChatWindow.native'

