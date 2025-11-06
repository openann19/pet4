import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import { haptics } from '../../lib/haptics'

// Support both old Reaction format and new MessageReaction format
export interface Reaction {
  emoji: string
  users: string[]
}

export interface MessageReaction {
  emoji: string
  userId?: string
  userName?: string
  userAvatar?: string
  timestamp?: string
  userIds?: string[]
  count?: number
}

interface MessageReactionsProps {
  messageId: string
  reactions: Reaction[] | MessageReaction[]
  currentUserId: string
  onAddReaction: (emoji: string) => void
  onRemoveReaction: (emoji: string) => void
  onLongPress?: () => void
  availableReactions?: readonly string[]
}

const DEFAULT_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🎉', '🔥', '💯', '🙏', '👀'] as const

const springConfigs = {
  smooth: { damping: 25, stiffness: 400 },
  bouncy: { damping: 15, stiffness: 500 },
  snappy: { damping: 20, stiffness: 600 },
}

const timingConfigs = {
  fast: { duration: 150 },
  smooth: { duration: 300 },
}

// Convert MessageReaction[] to Reaction[] format for compatibility
function normalizeReactions(
  reactions: Reaction[] | MessageReaction[]
): Array<{ emoji: string; users: string[]; reactions: MessageReaction[] }> {
  if (reactions.length === 0) return []

  // Check if it's the new format (MessageReaction[])
  const firstReaction = reactions[0]
  if (firstReaction && ('userId' in firstReaction || 'userIds' in firstReaction)) {
    const messageReactions = reactions as MessageReaction[]
    const grouped = messageReactions.reduce((acc, reaction) => {
      if (!reaction.emoji) return acc
      
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          users: [],
          reactions: [],
        }
      }
      
      const group = acc[reaction.emoji]
      if (group) {
        group.reactions.push(reaction)
        if (reaction.userId && !group.users.includes(reaction.userId)) {
          group.users.push(reaction.userId)
        }
        if (reaction.userIds) {
          reaction.userIds.forEach(userId => {
            if (!group.users.includes(userId)) {
              group.users.push(userId)
            }
          })
        }
      }
      
      return acc
    }, {} as Record<string, { emoji: string; users: string[]; reactions: MessageReaction[] }>)
    
    return Object.values(grouped)
  }

  // Old format (Reaction[])
  const oldReactions = reactions as Reaction[]
  return oldReactions.map(reaction => ({
    emoji: reaction.emoji,
    users: reaction.users,
    reactions: reaction.users.map(userId => ({
      emoji: reaction.emoji,
      userId,
    })) as MessageReaction[],
  }))
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  onLongPress,
  availableReactions = DEFAULT_REACTIONS,
}) => {
  const [showPicker, setShowPicker] = useState(false)
  const [visibleReactions, setVisibleReactions] = useState<Set<string>>(new Set())

  const normalizedReactions = useMemo(() => {
    return normalizeReactions(reactions)
  }, [reactions])

  // Track visible reactions for animations
  useEffect(() => {
    const currentEmojis = new Set(normalizedReactions.map(r => r.emoji))
    setVisibleReactions(prev => {
      const next = new Set(prev)
      currentEmojis.forEach(emoji => next.add(emoji))
      prev.forEach(emoji => {
        if (!currentEmojis.has(emoji)) {
          next.delete(emoji)
        }
      })
      return next
    })
  }, [normalizedReactions])

  const handleReactionPress = useCallback((emoji: string) => {
    const existingReaction = normalizedReactions.find((r) => r.emoji === emoji)
    const userHasReacted = existingReaction?.users.includes(currentUserId) ?? false

    haptics.selection()

    if (userHasReacted) {
      onRemoveReaction(emoji)
    } else {
      onAddReaction(emoji)
    }
  }, [normalizedReactions, currentUserId, onAddReaction, onRemoveReaction])

  const handlePickerReaction = useCallback((emoji: string) => {
    haptics.selection()
    onAddReaction(emoji)
    setShowPicker(false)
  }, [onAddReaction])

  const pickerScale = useSharedValue(0.9)
  const pickerOpacity = useSharedValue(0)

  useEffect(() => {
    if (showPicker) {
      pickerScale.value = withSpring(1, springConfigs.bouncy)
      pickerOpacity.value = withTiming(1, timingConfigs.fast)
    } else {
      pickerScale.value = withTiming(0.9, timingConfigs.fast)
      pickerOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [showPicker, pickerScale, pickerOpacity])

  const pickerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pickerScale.value }],
    opacity: pickerOpacity.value,
  }))

  return (
    <View style={styles.container}>
      {normalizedReactions.length > 0 && (
        <View style={styles.reactionsDisplay}>
          {normalizedReactions.map((reaction) => {
            if (!visibleReactions.has(reaction.emoji)) return null

            return (
              <ReactionButton
                key={`${messageId}-${reaction.emoji}`}
                emoji={reaction.emoji}
                count={reaction.users.length}
                userReacted={reaction.users.includes(currentUserId)}
                onPress={() => handleReactionPress(reaction.emoji)}
              />
            )
          })}
        </View>
      )}

      <AddReactionButton
        onPress={() => setShowPicker(true)}
        onLongPress={onLongPress}
      />

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
        accessibilityViewIsModal
        accessibilityLabel="Reaction picker"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
          accessibilityRole="button"
          accessibilityLabel="Close reaction picker"
        >
          <Animated.View style={[styles.pickerContainer, pickerAnimatedStyle]}>
            <Text style={styles.pickerTitle}>React with</Text>
            <View style={styles.reactionGrid}>
              {availableReactions.map((emoji) => (
                <EmojiButton
                  key={emoji}
                  emoji={emoji}
                  onPress={() => handlePickerReaction(emoji)}
                />
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  )
}

interface ReactionButtonProps {
  emoji: string
  count: number
  userReacted: boolean
  onPress: () => void
}

function ReactionButton({
  emoji,
  count,
  userReacted,
  onPress,
}: ReactionButtonProps): React.JSX.Element {
  const scale = useSharedValue(0)
  const hoverScale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSpring(1, springConfigs.bouncy)
  }, [scale])

  const handlePress = useCallback(() => {
    hoverScale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    )
    onPress()
  }, [hoverScale, onPress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * hoverScale.value }],
  }))

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.reactionBubble,
        userReacted && styles.reactionBubbleActive,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}`}
      accessibilityState={{ selected: userReacted }}
    >
      <Animated.View style={animatedStyle}>
        <Text style={styles.reactionEmoji}>{emoji}</Text>
        {count > 1 && (
          <Text style={styles.reactionCount}>{count}</Text>
        )}
      </Animated.View>
    </Pressable>
  )
}

interface AddReactionButtonProps {
  onPress: () => void
  onLongPress?: (() => void) | undefined
}

function AddReactionButton({
  onPress,
  onLongPress,
}: AddReactionButtonProps): React.JSX.Element {
  const scale = useSharedValue(1)

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.1, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    )
    onPress()
  }, [scale, onPress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      style={styles.addReactionButton}
      onPress={handlePress}
      onLongPress={onLongPress ?? undefined}
      accessibilityRole="button"
      accessibilityLabel="Add reaction"
    >
      <Animated.View style={animatedStyle}>
        <Text style={styles.addReactionText}>+</Text>
      </Animated.View>
    </Pressable>
  )
}

interface EmojiButtonProps {
  emoji: string
  onPress: () => void
}

function EmojiButton({ emoji, onPress }: EmojiButtonProps): React.JSX.Element {
  const scale = useSharedValue(1)

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.2, springConfigs.bouncy),
      withSpring(1, springConfigs.smooth)
    )
    onPress()
  }, [scale, onPress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      style={styles.reactionOption}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`React with ${emoji}`}
    >
      <Animated.View style={animatedStyle}>
        <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reactionBubbleActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReactionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  reactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reactionOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reactionOptionEmoji: {
    fontSize: 28,
  },
})
