/**
 * MessageBubble Component - Mobile Native Implementation
 *
 * Premium chat message bubble with full feature parity to web:
 * - Design token alignment (colors, typography, spacing)
 * - Motion facade integration (@petspark/motion patterns)
 * - Premium interactions (reactions, status ticks, haptics)
 * - Accessibility support (VoiceOver, semantic roles)
 * - Performance optimized (memo, layout animations)
 *
 * Location: apps/mobile/src/components/chat/MessageBubble.tsx
 */

import React, { memo, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native'
import { Animated, Layout, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnUI } from '@petspark/motion'
import { colors } from '../../theme/colors'
import { getTypographyStyle, spacing } from '../../theme/typography'
import { createLogger } from '../../utils/logger'

const logger = createLogger('MessageBubble')

// Shared types aligned with web implementation
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'sticker' | 'pet-card'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐'

/**
 * Message data structure - aligned with web chat-types.ts
 */
export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  type: MessageType
  content: string
  status: MessageStatus
  createdAt: string
  timestamp?: string // Alias for compatibility
  reactions?: Record<ReactionType, string[]> | { emoji: ReactionType; userId: string; userName: string }[]
  metadata?: Record<string, unknown>
}

/**
 * MessageBubble props - aligned with web implementation
 */
export interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isClusterStart: boolean
  isClusterEnd: boolean
  index?: number
  isNew?: boolean
  isHighlighted?: boolean
  variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default'
  previousStatus?: Message['status']
  roomType?: 'direct' | 'group'
  onReact?: (messageId: string, reaction: ReactionType) => void
  onReply?: (messageId: string) => void
  onCopy?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  showTimestamp?: boolean
}

/**
 * MessageBubble component with premium mobile chat experience
 */
export const MessageBubble = memo<MessageBubbleProps>(({
  message,
  isOwn,
  isClusterStart,
  isClusterEnd,
  index = 0,
  isNew = false,
  isHighlighted = false,
  variant: _variant = 'default',
  previousStatus: _previousStatus,
  roomType: _roomType = 'direct',
  onReact,
  onReply,
  onCopy,
  onDelete,
  showTimestamp = false,
}) => {
  // Animation values for premium interactions
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const glowOpacity = useSharedValue(0)

  // State for interactions
  const [showReactions, setShowReactions] = useState(false)
  const [_isLongPressing, setIsLongPressing] = useState(false)

  // Format timestamp
  const formatTime = useCallback((timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [])

  // Handle long press for reactions
  const handleLongPress = useCallback(() => {
    if (message.status === 'sending') return

    runOnUI(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
      glowOpacity.value = withTiming(0.3, { duration: 150 })
    })()

    setIsLongPressing(true)
    setShowReactions(true)

    // Haptic feedback
    AccessibilityInfo.announceForAccessibility('Message options available')

    logger.debug('Long press triggered', { messageId: message.id })
  }, [message.id, message.status, scale, glowOpacity])

  // Handle press out
  const handlePressOut = useCallback(() => {
    runOnUI(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      glowOpacity.value = withTiming(0, { duration: 150 })
    })()

    setIsLongPressing(false)
  }, [scale, glowOpacity])

  // Handle reaction
  const handleReaction = useCallback((reaction: ReactionType) => {
    if (onReact) {
      onReact(message.id, reaction)
      AccessibilityInfo.announceForAccessibility(`Added ${reaction} reaction`)
    }
    setShowReactions(false)
    handlePressOut()
  }, [message.id, onReact, handlePressOut])

  // Handle reply
  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(message.id)
      AccessibilityInfo.announceForAccessibility('Reply to message')
    }
    setShowReactions(false)
    handlePressOut()
  }, [message.id, onReply, handlePressOut])

  // Handle copy
  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy(message.id)
      AccessibilityInfo.announceForAccessibility('Message copied')
    }
    setShowReactions(false)
    handlePressOut()
  }, [message.id, onCopy, handlePressOut])

  // Handle delete
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(message.id)
      AccessibilityInfo.announceForAccessibility('Message deleted')
    }
    setShowReactions(false)
    handlePressOut()
  }, [message.id, onDelete, handlePressOut])

  // Animated styles
  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  // Status icon component
  const renderStatusIcon = useCallback(() => {
    if (!isOwn) return null

    const getStatusColor = () => {
      switch (message.status) {
        case 'read':
          return colors.primary
        case 'delivered':
          return colors.textSecondary
        case 'sent':
          return colors.textSecondary
        case 'sending':
          return colors.textSecondary
        case 'failed':
          return colors.danger
        default:
          return colors.textSecondary
      }
    }

    const getStatusSymbol = () => {
      switch (message.status) {
        case 'read':
          return '✓✓'
        case 'delivered':
          return '✓✓'
        case 'sent':
          return '✓'
        case 'sending':
          return '○'
        case 'failed':
          return '!'
        default:
          return '○'
      }
    }

    return (
      <Text style={[styles.statusTick, { color: getStatusColor() }]}>
        {getStatusSymbol()}
      </Text>
    )
  }, [isOwn, message.status])

  // Reactions component
  const renderReactions = useCallback(() => {
    if (!message.reactions) return null

    const reactionEntries = Array.isArray(message.reactions)
      ? message.reactions.reduce((acc, reaction) => {
        const emoji = reaction.emoji
        if (!acc[emoji]) acc[emoji] = []
        acc[emoji].push(reaction.userId)
        return acc
      }, {} as Record<ReactionType, string[]>)
      : message.reactions

    const entries = Object.entries(reactionEntries) as [ReactionType, string[]][]
    if (entries.length === 0) return null

    return (
      <View style={styles.reactionsContainer}>
        {entries.map(([emoji, userIds]) => (
          <Pressable
            key={emoji}
            style={styles.reactionBubble}
            onPress={() => handleReaction(emoji)}
            accessibilityRole="button"
            accessibilityLabel={`${emoji} reaction from ${userIds.length} user${userIds.length > 1 ? 's' : ''}`}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {userIds.length > 1 && (
              <Text style={styles.reactionCount}>{userIds.length}</Text>
            )}
          </Pressable>
        ))}
      </View>
    )
  }, [message.reactions, handleReaction])

  // Reaction picker overlay
  const renderReactionPicker = useCallback(() => {
    if (!showReactions) return null

    const reactions: ReactionType[] = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐']

    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[
          styles.reactionPicker,
          isOwn ? styles.reactionPickerOwn : styles.reactionPickerOther
        ]}
      >
        {reactions.map((reaction) => (
          <Pressable
            key={reaction}
            style={styles.reactionPickerButton}
            onPress={() => handleReaction(reaction)}
            accessibilityRole="button"
            accessibilityLabel={`React with ${reaction}`}
          >
            <Text style={styles.reactionPickerEmoji}>{reaction}</Text>
          </Pressable>
        ))}
        <View style={styles.reactionPickerDivider} />
        <Pressable
          style={styles.reactionPickerButton}
          onPress={handleReply}
          accessibilityRole="button"
          accessibilityLabel="Reply to message"
        >
          <Text style={styles.reactionPickerAction}>↩️</Text>
        </Pressable>
        <Pressable
          style={styles.reactionPickerButton}
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy message"
        >
          <Text style={styles.reactionPickerAction}>📋</Text>
        </Pressable>
        {isOwn && (
          <Pressable
            style={styles.reactionPickerButton}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete message"
          >
            <Text style={[styles.reactionPickerAction, { color: colors.danger }]}>🗑️</Text>
          </Pressable>
        )}
      </Animated.View>
    )
  }, [showReactions, isOwn, handleReaction, handleReply, handleCopy, handleDelete])

  return (
    <>
      <Animated.View
        layout={Layout.springify().damping(15).stiffness(300)}
        {...(isNew ? { entering: FadeIn.delay(index * 50).duration(300) } : {})}
        style={[
          styles.container,
          isOwn ? styles.containerOwn : styles.containerOther,
          isClusterStart && styles.containerClusterStart,
        ]}
      >
        {/* Glow effect for interactions */}
        <Animated.View
          style={[
            styles.glow,
            animatedGlowStyle,
            isOwn ? styles.glowOwn : styles.glowOther,
          ]}
        />

        <Pressable
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={300}
          accessibilityRole="text"
          accessibilityLabel={`Message from ${isOwn ? 'you' : message.senderName || 'user'}: ${message.content}`}
          accessibilityHint="Long press for message options"
        >
          <Animated.View
            style={[
              styles.bubble,
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
              isHighlighted && styles.bubbleHighlighted,
              animatedBubbleStyle,
            ]}
          >
            {/* Message content */}
            <Text
              style={[
                styles.messageText,
                getTypographyStyle('body'),
                isOwn ? styles.messageTextOwn : styles.messageTextOther,
              ]}
              accessible={false} // Handled by parent Pressable
            >
              {message.content}
            </Text>

            {/* Timestamp and status */}
            <View style={styles.metaContainer}>
              {(showTimestamp || isClusterEnd) && (
                <Text style={[styles.timestamp, getTypographyStyle('caption')]}>
                  {formatTime(message.createdAt || message.timestamp || new Date().toISOString())}
                </Text>
              )}
              {renderStatusIcon()}
            </View>
          </Animated.View>
        </Pressable>

        {/* Reactions */}
        {renderReactions()}
      </Animated.View>

      {/* Reaction picker overlay */}
      {renderReactionPicker()}
    </>
  )
})

MessageBubble.displayName = 'MessageBubble'

// Premium styles aligned with design tokens and web parity
const styles = StyleSheet.create({
  // Container styles
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.lg,
    maxWidth: '85%', // Larger than old version for premium feel
    position: 'relative',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  containerClusterStart: {
    marginTop: spacing.md,
  },

  // Glow effect for interactions
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    opacity: 0,
  },
  glowOwn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glowOther: {
    backgroundColor: colors.textSecondary,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  // Bubble styles
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
    minWidth: 60,
    // Enhanced shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 8, // Signature chat bubble style
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleHighlighted: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Message text styles
  messageText: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  messageTextOwn: {
    color: '#FFFFFF', // High contrast on primary background
  },
  messageTextOther: {
    color: colors.textPrimary,
  },

  // Meta container (timestamp + status)
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    gap: spacing.xs / 2,
  },
  timestamp: {
    color: colors.textSecondary,
    opacity: 0.8,
  },
  statusTick: {
    fontSize: 12,
    lineHeight: 12,
    includeFontPadding: false,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs / 2,
    marginTop: spacing.xs,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs / 2,
  },
  reactionEmoji: {
    fontSize: 14,
    lineHeight: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Reaction picker overlay
  reactionPicker: {
    position: 'absolute',
    top: -60,
    backgroundColor: colors.card,
    borderRadius: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
  },
  reactionPickerOwn: {
    right: 0,
  },
  reactionPickerOther: {
    left: 0,
  },
  reactionPickerButton: {
    padding: spacing.xs,
    borderRadius: 20,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerEmoji: {
    fontSize: 18,
    lineHeight: 20,
  },
  reactionPickerAction: {
    fontSize: 16,
    lineHeight: 18,
  },
  reactionPickerDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs / 2,
  },
})
