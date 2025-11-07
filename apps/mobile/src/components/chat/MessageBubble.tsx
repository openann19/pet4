/**
 * MessageBubble Component
 * 
 * Premium chat message bubble component integrating:
 * - Send/receive effects
 * - Status ticks
 * - Reactions
 * - Layout animations for list insert/remove
 * 
 * Now using ultra-streamlined all-in-chat-effects:
 * - SwipeToReply for gesture-based replies
 * - ShimmerOverlay for loading states
 * - DeliveryTicks for message status
 * 
 * Location: apps/mobile/src/components/chat/MessageBubble.tsx
 */

import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import Animated, { Layout } from 'react-native-reanimated'
import { SwipeToReply, DeliveryTicks, ShimmerOverlay } from '@/effects/chat'
import { createLogger } from '../../utils/logger'

const logger = createLogger('MessageBubble')

/**
 * Message data structure
 */
export interface Message {
  id: string
  content: string
  senderId: string
  timestamp: number
  status: 'sending' | 'sent' | 'delivered' | 'read'
  previousStatus?: 'sending' | 'sent' | 'delivered' | 'read'
  isNew?: boolean
  isMention?: boolean
}

/**
 * MessageBubble props
 */
export interface MessageBubbleProps {
  message: Message
  currentUserId: string
  onReact?: (messageId: string) => void
  onLongPress?: (messageId: string) => void
}

/**
 * MessageBubble component
 * Refactored to use ultra-streamlined all-in-chat-effects
 */
export function MessageBubble({
  message,
  currentUserId,
  onReact,
  onLongPress,
}: MessageBubbleProps): React.ReactElement {
  const isOwn = message.senderId === currentUserId
  const isLoading = message.status === 'sending'
  
  // Measure bubble dimensions for ShimmerOverlay
  const [bubbleWidth, setBubbleWidth] = useState(0)
  
  const handleLayout = React.useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout
    if (width > 0) {
      setBubbleWidth(width)
    }
  }, [])

  const handleReply = (): void => {
    logger.debug('Reply triggered', { messageId: message.id })
    // Trigger reply action (could be passed as prop)
  }

  const handleLongPress = (): void => {
    onLongPress?.(message.id)
    onReact?.(message.id)
  }

  return (
    <SwipeToReply onReply={handleReply}>
      <Animated.View
        style={[
          styles.container,
          isOwn ? styles.ownContainer : styles.otherContainer,
        ]}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onLongPress={handleLongPress}
          onLayout={handleLayout}
          activeOpacity={0.8}
          style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        >
          {/* ShimmerOverlay for loading state */}
          {isLoading && <ShimmerOverlay width={bubbleWidth} />}
          
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>

          {/* DeliveryTicks for message status (own messages only) */}
          {isOwn && <DeliveryTicks state={message.status} />}
        </TouchableOpacity>
      </Animated.View>
    </SwipeToReply>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: '75%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 60,
  },
  ownBubble: {
    backgroundColor: '#3B82F6',
  },
  otherBubble: {
    backgroundColor: '#E5E7EB',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#111827',
  },
})

