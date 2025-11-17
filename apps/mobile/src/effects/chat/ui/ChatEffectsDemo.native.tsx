/**
 * Chat Effects Demo Component
 * Showcase and testing component for all-in-chat-effects library
 * 
 * Location: apps/mobile/src/effects/chat/ui/ChatEffectsDemo.native.tsx
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native'
import Animated, { useSharedValue } from 'react-native-reanimated'
import {
  useReduceMotion,
  ShimmerOverlay,
  useBubblePopIn,
  SendSwoosh,
  TypingIndicator,
  ReactionBurst,
  SwipeToReply,
  Ripple,
  DeliveryTicks,
  useMessageAppear,
  PrismShimmerOverlay,
  EmojiTrail,
  ConfettiEmitter,
  ReadGlint,
  UnreadGlowPulse,
  useParallaxTilt,
  type DeliveryState,
} from './all-in-chat-effects'

/**
 * Demo component showing all available effects
 */
export function ChatEffectsDemo(): React.JSX.Element {
  const reduceMotion = useReduceMotion()
  const [width, setWidth] = useState(300)
  const [showBurst, setShowBurst] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [deliveryState, setDeliveryState] = useState<DeliveryState>('sending')
  const [readNonce, setReadNonce] = useState(0)
  const [unreadActive, setUnreadActive] = useState(true)
  const scrollY = useSharedValue(0)

  const bubblePopStyle = useBubblePopIn({ reduceMotion })
  const messageAppearStyle = useMessageAppear({ index: 0, reduceMotion })
  const parallaxStyle = useParallaxTilt({ scrollY, factor: 0.02 })

  const handleDeliveryStateChange = () => {
    const states: DeliveryState[] = ['sending', 'sent', 'delivered', 'read']
    const currentIndex = states.indexOf(deliveryState)
    const nextIndex = (currentIndex + 1) % states.length
    setDeliveryState(states[nextIndex] ?? 'sending')
    
    if (states[nextIndex] === 'read') {
      setReadNonce((prev: number) => prev + 1)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      onScroll={(e: { nativeEvent: { contentOffset: { y: number } } }) => {
        scrollY.value = e.nativeEvent.contentOffset.y
      }}
      scrollEventThrottle={16}
    >
      <Animated.View style={[styles.header, parallaxStyle]}>
        <Text style={styles.title}>Chat Effects Demo</Text>
        <Text style={styles.subtitle}>
          Reduce Motion: {reduceMotion ? 'ON' : 'OFF'}
        </Text>
      </Animated.View>

      {/* Shimmer Overlay Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shimmer Overlay</Text>
        <View
          style={styles.demoBox}
          onLayout={(e: { nativeEvent: { layout: { width: number } } }) => { setWidth(e.nativeEvent.layout.width); }}
        >
          <Text>Loading content...</Text>
          <ShimmerOverlay width={width} />
        </View>
      </View>

      {/* Prism Shimmer Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prism Shimmer</Text>
        <View
          style={[styles.demoBox, { backgroundColor: '#1F2937' }]}
          onLayout={(e: { nativeEvent: { layout: { width: number } } }) => { setWidth(e.nativeEvent.layout.width); }}
        >
          <Text style={{ color: '#fff' }}>Premium content</Text>
          <PrismShimmerOverlay width={width} />
        </View>
      </View>

      {/* Bubble Pop-In Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bubble Pop-In</Text>
        <Animated.View style={[styles.messageBubble, bubblePopStyle]}>
          <Text>Hello! This bubble pops in smoothly</Text>
        </Animated.View>
      </View>

      {/* Send Swoosh Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Swoosh (Simulated)</Text>
        <SendSwoosh
          from={{ x: 200, y: 500 }}
          to={{ x: 0, y: 0 }}
          nonce={Date.now()}
          reduceMotion={reduceMotion}
        >
          <View style={styles.messageBubble}>
            <Text>Message with swoosh animation</Text>
          </View>
        </SendSwoosh>
      </View>

      {/* Typing Indicator Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typing Indicator</Text>
        <View style={styles.typingContainer}>
          <TypingIndicator reduceMotion={reduceMotion} />
        </View>
      </View>

      {/* Reaction Burst Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reaction Burst</Text>
        <Pressable
          onPress={() => { setShowBurst(true); }}
          style={styles.demoButton}
        >
          <Text style={styles.buttonText}>Trigger Burst</Text>
        </Pressable>
        {showBurst && (
          <View style={styles.burstContainer}>
            <ReactionBurst onDone={() => { setShowBurst(false); }} />
          </View>
        )}
      </View>

      {/* Swipe to Reply Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Swipe to Reply</Text>
        <SwipeToReply
          onReply={() => {
            import('react-native').then(({ Alert }) => {
              Alert.alert('Reply', 'Reply triggered!');
            });
          }}
        >
          <View style={styles.messageBubble}>
            <Text>Swipe right to reply →</Text>
          </View>
        </SwipeToReply>
      </View>

      {/* Ripple Feedback Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ripple Feedback</Text>
        <Ripple onPress={() => {}}>
          <View style={styles.demoButton}>
            <Text style={styles.buttonText}>Press for Ripple</Text>
          </View>
        </Ripple>
      </View>

      {/* Delivery Ticks Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Status Ticks</Text>
        <Pressable
          onPress={handleDeliveryStateChange}
          style={styles.deliveryContainer}
        >
          <Text>Status: {deliveryState} </Text>
          <DeliveryTicks state={deliveryState} />
        </Pressable>
      </View>

      {/* Message Appear Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Appear (Stagger)</Text>
        <Animated.View style={[styles.messageBubble, messageAppearStyle]}>
          <Text>Message with stagger animation</Text>
        </Animated.View>
      </View>

      {/* Confetti Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confetti Emitter</Text>
        <Pressable
          onPress={() => { setShowConfetti(true); }}
          style={styles.demoButton}
        >
          <Text style={styles.buttonText}>Celebrate! 🎉</Text>
        </Pressable>
        {showConfetti && (
          <View style={styles.confettiContainer}>
            <ConfettiEmitter onDone={() => { setShowConfetti(false); }} />
          </View>
        )}
      </View>

      {/* Read Glint Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Read Glint</Text>
        <View style={styles.messageBubble}>
          <Text>Message with read glint</Text>
          {deliveryState === 'read' && (
            <ReadGlint width={width} nonce={readNonce} />
          )}
        </View>
      </View>

      {/* Unread Glow Pulse Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unread Glow Pulse</Text>
        <Pressable
          onPress={() => { setUnreadActive(!unreadActive); }}
          style={styles.unreadContainer}
        >
          <Text>09:41 </Text>
          <UnreadGlowPulse active={unreadActive} />
          <Text> (Tap to toggle)</Text>
        </Pressable>
      </View>

      {/* Emoji Trail Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emoji Trail</Text>
        <Text style={styles.hint}>Draw with your finger!</Text>
        <View style={styles.emojiTrailContainer}>
          <EmojiTrail areaWidth={300} areaHeight={200} emoji="✨" />
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1F2937',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  demoBox: {
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  messageBubble: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  typingContainer: {
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  demoButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  burstContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  confettiContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  unreadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  emojiTrailContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
})
