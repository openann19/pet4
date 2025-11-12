/**
 * ChatList Component
 *
 * Premium chat list component with:
 * - Layout Animations for message insertions
 * - Scroll-to-bottom FAB with magnetic effect
 * - Typing indicator with liquid dots
 * - Optimized FlashList rendering
 *
 * Location: apps/mobile/src/components/chat/ChatList.tsx
 */

import { FlashList } from '@shopify/flash-list'
import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { useLiquidDots } from '../../effects/chat/typing/use-liquid-dots'
import { MagneticScrollFab } from './MagneticScrollFab'
import { MessageBubble, type Message } from './MessageBubble'
import { isTruthy } from '@petspark/shared';

/**
 * Typing dot component
 */
function TypingDot({
  dot,
}: {
  dot: { yOffset: SharedValue<number>; opacity: SharedValue<number> }
}): React.ReactElement {
  const dotStyle = useAnimatedStyle(() => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
    transform: [{ translateY: dot.yOffset.value }],
    opacity: dot.opacity.value,
  }))

  return <Animated.View style={dotStyle} />
}

/**
 * ChatList props
 */
export interface ChatListProps {
  messages: Message[]
  currentUserId: string
  isTyping?: boolean
  onReact?: (messageId: string) => void
  onReply?: (messageId: string) => void
  onLongPress?: (messageId: string) => void
  onScrollToBottom?: () => void
}

/**
 * ChatList component
 */
export function ChatList({
  messages,
  currentUserId,
  isTyping = false,
  onReact,
  onReply,
  onLongPress,
  onScrollToBottom,
}: ChatListProps): React.ReactElement {
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [badgeCount, setBadgeCount] = useState(0)
  const previousBadgeCountRef = useRef(0)
  const flashListRef = useRef<FlashList<Message>>(null)

  // Handle scroll (for FAB visibility logic)
  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number }
        contentSize: { height: number }
        layoutMeasurement: { height: number }
      }
    }) => {
      const offsetY = event.nativeEvent.contentOffset.y
      const contentHeight = event.nativeEvent.contentSize.height
      const visibleHeight = event.nativeEvent.layoutMeasurement.height

      // Show FAB if scrolled up more than 200px from bottom
      const distanceFromBottom = contentHeight - visibleHeight - offsetY
      const shouldShowFab = distanceFromBottom > 200
      setShowScrollFab(shouldShowFab)

      // Update badge count based on unread messages
      if (isTruthy(shouldShowFab)) {
        const unreadCount = Math.floor(distanceFromBottom / 60) // Approximate
        if (unreadCount !== badgeCount) {
          previousBadgeCountRef.current = badgeCount
          setBadgeCount(unreadCount)
        }
      } else {
        setBadgeCount(0)
      }
    },
    [badgeCount]
  )

  // Scroll to bottom
  const handleScrollToBottom = useCallback(() => {
    if (flashListRef.current && messages.length > 0) {
      flashListRef.current.scrollToIndex({ index: messages.length - 1, animated: true })
    }
    setShowScrollFab(false)
    setBadgeCount(0)
    onScrollToBottom?.()
  }, [messages.length, onScrollToBottom])

  // Scroll FAB effect
  // Typing indicator liquid dots
  const typingDots = useLiquidDots({
    enabled: isTyping,
    dotSize: 6,
    dotColor: '#666666',
    dotSpacing: 8,
  })

  // Render message item
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      return (
        <Animated.View
          entering={FadeIn.duration(200).springify()}
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
        >
          <MessageBubble
            message={item}
            currentUserId={currentUserId}
            {...(onReact ? { onReact } : {})}
            {...(onReply ? { onReply } : {})}
            {...(onLongPress ? { onLongPress } : {})}
          />
        </Animated.View>
      )
    },
    [currentUserId, onReact, onReply, onLongPress]
  )

  // Key extractor
  const keyExtractor = useCallback((item: Message) => item.id, [])

  // Typing indicator component
  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) {
      return null
    }

    return (
      <Animated.View
        style={styles.typingContainer}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
      >
        <View style={styles.typingBubble}>
          <View style={styles.dotsContainer}>
            {typingDots.dots.map((dot, index) => (
              <TypingDot key={index} dot={dot} />
            ))}
          </View>
        </View>
      </Animated.View>
    )
  }, [isTyping, typingDots])

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        estimatedItemSize={84}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderTypingIndicator}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />

      {/* Scroll to bottom FAB */}
      {showScrollFab && (
        <Animated.View
          style={[styles.fabContainer, fabAnimatedStyle]}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <TouchableOpacity style={styles.fab} onPress={handleScrollToBottom} activeOpacity={0.8} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
            <Text style={styles.fabIcon}>↓</Text>
            {badgeCount > 0 && (
              <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
                <Text style={styles.badgeText}>
                  {badgeCount > 99 ? '99+' : badgeCount.toString()}
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 80,
    alignSelf: 'flex-start',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'var(--color-accent-secondary-9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'var(--color-bg-overlay)',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'var(--color-error-9)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 12,
    fontWeight: '600',
  },
})
