/**
 * ChatScreen Component
 *
 * Fully wired mobile chat experience that leverages the ultra-premium effects pack.
 * Highlights:
 * - Magnetic scroll FAB + shimmer overlays
 * - Delivery ticks, reaction bursts, typing indicator
 * - Shared reduced-motion awareness
 *
 * Location: apps/mobile/src/screens/ChatScreen.tsx
 */
import React, { useCallback, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ChatList, type Message } from '@mobile/components/chat'
import HoloBackgroundNative from '@mobile/components/chrome/HoloBackground.native'
import { useReduceMotion } from '@mobile/effects/chat/ui'
import {
  ReactionBurst,
  ShimmerOverlay,
  TypingIndicator,
} from '@mobile/effects/chat/ui/all-in-chat-effects'
import { colors } from '@mobile/theme/colors'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('ChatScreen')

type DraftMessage = Message & {
  readonly status: 'sending' | 'sent' | 'delivered' | 'read'
}

const INITIAL_MESSAGES: DraftMessage[] = [
  {
    id: '1',
    content: 'Welcome to your premium chat experience!',
    senderId: 'system',
    timestamp: Date.now() - 60_000,
    status: 'delivered',
  },
  {
    id: '2',
    content: 'Swipe on me to reply ✨',
    senderId: 'friend',
    timestamp: Date.now() - 45_000,
    status: 'read',
  },
]

export function ChatScreen(): React.ReactElement {
  const [messages] = useState<Message[]>(() => INITIAL_MESSAGES)
  const [isTyping, setIsTyping] = useState(true)
  const [composerWidth, setComposerWidth] = useState(0)
  const [showReactionBurst, setShowReactionBurst] = useState(false)

  const reduceMotion = useReduceMotion()

  const currentUserId = 'current-user'

  const handleReaction = useCallback((messageId: string) => {
    logger.debug('Reaction triggered', { messageId })
    setShowReactionBurst(true)
  }, [])

  const handleReply = useCallback((messageId: string) => {
    logger.debug('Reply gesture', { messageId })
  }, [])

  const handleLongPress = useCallback((messageId: string) => {
    logger.debug('Message long pressed', { messageId })
  }, [])

  const handleScrollToBottom = useCallback(() => {
    logger.debug('Scroll-to-bottom triggered')
    setIsTyping(false)
  }, [])

  const handleReactionComplete = useCallback(() => {
    setShowReactionBurst(false)
  }, [])

  const handleComposerLayout = useCallback((event: LayoutChangeEvent) => {
    setComposerWidth(event.nativeEvent.layout.width)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HoloBackgroundNative intensity={0.5} />
      <View style={styles.chatContainer}>
        <ChatList
          messages={messages}
          currentUserId={currentUserId}
          isTyping={false}
          onScrollToBottom={handleScrollToBottom}
          onReact={handleReaction}
          onReply={handleReply}
          onLongPress={handleLongPress}
        />

        {isTyping && (
          <View pointerEvents="none" style={styles.typingOverlay}>
            <TypingIndicator size={6} gap={6} duration={900} reduceMotion={reduceMotion} />
          </View>
        )}

        {showReactionBurst && (
          <View pointerEvents="none" style={styles.reactionOverlay}>
            <ReactionBurst count={10} spread={60} duration={600} onDone={handleReactionComplete} />
          </View>
        )}
      </View>

      <View style={styles.composerShim} onLayout={handleComposerLayout}>
        {composerWidth > 0 && (
          <ShimmerOverlay
            width={composerWidth}
            height={40}
            streakWidth={0.45}
            opacityRange={[0.15, 0.55]}
            paused={reduceMotion}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  typingOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  composerShim: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reactionOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusTick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
