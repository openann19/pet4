/**
 * MessageBubble Component
 *
 * Premium chat message bubble component integrating:
 * - Send/receive effects
 * - Status ticks
 * - Reactions
 * - Layout animations for list insert/remove
 *
 * Location: apps/mobile/src/components/chat/MessageBubble.tsx
 */

import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { Layout, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated'
import { useReceiveAirCushion } from '../../effects/chat/bubbles/use-receive-air-cushion'
import { useSendWarp } from '../../effects/chat/bubbles/use-send-warp'
import { useSwipeReplyElastic } from '../../effects/chat/gestures/use-swipe-reply-elastic'
import { useReactionBurst } from '../../effects/chat/reactions/use-reaction-burst'
import { RibbonFX } from '../../effects/chat/shaders'
import { AdditiveBloom } from '../../effects/chat/shaders/additive-bloom'
import { useStatusTicks } from '../../effects/chat/status/use-status-ticks'
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
  onReply?: (messageId: string) => void
  onLongPress?: (messageId: string) => void

  bubbleWidth?: number // Width of the bubble for positioning effects
  bubbleHeight?: number // Height of the bubble for positioning effects
}

/**
 * MessageBubble component
 */
export function MessageBubble({
  message,
  currentUserId,
  onReact,
  onLongPress,
  bubbleWidth: propBubbleWidth,
  bubbleHeight: propBubbleHeight,
}: MessageBubbleProps): React.ReactElement {
  const isOwn = message.senderId === currentUserId

  // Measure bubble dimensions dynamically
  const [bubbleWidth, setBubbleWidth] = useState(propBubbleWidth ?? 200)
  const [bubbleHeight, setBubbleHeight] = useState(propBubbleHeight ?? 60)

  const handleLayout = React.useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout
      if (width > 0 && height > 0) {
        setBubbleWidth(width)
        setBubbleHeight(height)
      }
    },
    []
  )

  // Send effect (for own messages)
  const sendWarp = useSendWarp({
    enabled: !!(isOwn && message.isNew),
    onStatusChange: status => {
      logger.debug('Message status changed', { messageId: message.id, status })
    },
  })

  // Receive effect (for incoming messages)
  const receiveAir = useReceiveAirCushion({
    enabled: !!(!isOwn && message.isNew),
    isNew: message.isNew ?? false,
    isMention: message.isMention ?? false,
  })

  // Swipe-to-reply gesture
  const swipeReply = useSwipeReplyElastic({
    enabled: true,
    bubbleWidth,
    bubbleHeight,
    onThresholdCross: () => {
      logger.debug('Swipe threshold crossed', { messageId: message.id })
    },
    onReply: () => {
      logger.debug('Swipe reply triggered', { messageId: message.id })
    },
  })

  // Status ticks
  const statusTicks = useStatusTicks({
    enabled: isOwn,
    status: message.status,
    previousStatus: message.previousStatus ?? message.status,
    isOwnMessage: isOwn,
  })

  // Reaction burst
  const reactionBurst = useReactionBurst({
    enabled: true,
    onLongPressConfirm: () => {
      onReact?.(message.id)
    },
  })

  // Track ribbon visibility for conditional rendering
  const [showRibbon, setShowRibbon] = useState(false)
  useAnimatedReaction(
    () => swipeReply.ribbonAlpha.value,
    value => {
      setShowRibbon(value > 0)
    }
  )

  // Trigger send effect when message is sent
  React.useEffect(() => {
    if (isOwn && message.isNew && message.status === 'sending') {
      // Set bloom center to bubble center
      sendWarp.bloomCenterX.value = bubbleWidth / 2
      sendWarp.bloomCenterY.value = bubbleHeight / 2
      // Ensure bloom radius respects <= 24px constraint for low-end devices
      sendWarp.bloomRadius.value = Math.min(18, 24)
      sendWarp.trigger()
    }
  }, [isOwn, message.isNew, message.status, sendWarp, bubbleWidth, bubbleHeight])

  // Update ribbon coordinates when bubble size changes
  React.useEffect(() => {
    // Update ribbon glow to respect <= 24px constraint
    swipeReply.ribbonGlow.value = Math.min(18, 24)
  }, [swipeReply, bubbleWidth, bubbleHeight])

  // Trigger status change when status updates
  React.useEffect(() => {
    if (isOwn && message.status === 'sent') {
      sendWarp.triggerStatusChange('sent')
    }
  }, [isOwn, message.status, sendWarp])

  const handleLongPress = (): void => {
    reactionBurst.trigger()
    onLongPress?.(message.id)
  }

  // Status tick animated styles
  const tick1Style = useAnimatedStyle(() => ({
    opacity: statusTicks.tick1Fill.value,
  }))

  const tick2Style = useAnimatedStyle(() => ({
    opacity: statusTicks.tick2Fill.value,
  }))

  return (
    <GestureDetector gesture={swipeReply.gesture}>
      <Animated.View
        style={[
          styles.container,
          isOwn ? styles.ownContainer : styles.otherContainer,
          isOwn ? sendWarp.animatedStyle : receiveAir.animatedStyle,
        ]}
        layout={Layout.springify()}
      >
        {/* AdditiveBloom glow trail for send effect */}
        {isOwn && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AdditiveBloom
              width={bubbleWidth}
              height={bubbleHeight}
              centerX={sendWarp.bloomCenterX}
              centerY={sendWarp.bloomCenterY}
              radius={sendWarp.bloomRadius}
              intensity={sendWarp.bloomIntensity}
              color={[0.3, 0.75, 1]}
            />
          </View>
        )}

        {/* RibbonFX for swipe-to-reply */}
        {showRibbon && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <RibbonFX
              width={bubbleWidth}
              height={bubbleHeight}
              p0={swipeReply.ribbonP0}
              p1={swipeReply.ribbonP1}
              thickness={swipeReply.ribbonThickness}
              glow={swipeReply.ribbonGlow}
              progress={swipeReply.ribbonProgress}
              color={[0.2, 0.8, 1.0]}
              alpha={swipeReply.ribbonAlpha}
            />
          </View>
        )}

        <TouchableOpacity
          onLongPress={handleLongPress}
          onLayout={handleLayout}
          activeOpacity={0.8}
          style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        >
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>

          {/* Status ticks (for own messages) */}
          {isOwn && (
            <View style={styles.statusContainer}>
              <Animated.View style={[styles.tick, tick1Style]}>
                <Text style={[styles.tickText, { color: statusTicks.color.value }]}>✓</Text>
              </Animated.View>
              {message.status !== 'sending' && (
                <Animated.View style={[styles.tick, tick2Style]}>
                  <Text style={[styles.tickText, { color: statusTicks.color.value }]}>✓</Text>
                </Animated.View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  tick: {
    marginLeft: 4,
  },
  tickText: {
    fontSize: 12,
  },
})
