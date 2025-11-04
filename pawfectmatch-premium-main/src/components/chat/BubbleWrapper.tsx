'use client'

import { useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useBubbleEntry, type BubbleDirection } from '@/effects/reanimated/use-bubble-entry'
import { useBubbleGesture } from '@/effects/reanimated/use-bubble-gesture'
import { useBubbleTilt } from '@/effects/reanimated/use-bubble-tilt'
import { useTypingShimmer } from '@/effects/reanimated/use-typing-shimmer'
import { useReactionSparkles, type ReactionType } from '@/effects/reanimated/use-reaction-sparkles'
import { useSwipeReply } from '@/effects/reanimated/use-swipe-reply'
import { useReceiptTransition } from '@/effects/reanimated/use-receipt-transition'
import { useMediaBubble, type MediaType } from '@/effects/reanimated/use-media-bubble'
import { useThreadHighlight } from '@/effects/reanimated/use-thread-highlight'
import { useTimestampReveal } from '@/effects/reanimated/use-timestamp-reveal'
import { useBubbleTheme, type SenderType, type MessageType as ThemeMessageType, type ChatTheme } from '@/effects/reanimated/use-bubble-theme'
import { BubbleGestureWrapper } from './BubbleGestureWrapper'
import type { MessageStatus } from '@/lib/chat-types'
import { createParticleAnimatedStyle, type Particle } from '@/effects/reanimated/particle-engine'
import { cn } from '@/lib/utils'

export interface BubbleWrapperProps {
  children: ReactNode
  index?: number
  direction?: BubbleDirection
  isOwn?: boolean
  isNew?: boolean
  isHighlighted?: boolean
  isThreadMessage?: boolean
  senderType?: SenderType
  messageType?: ThemeMessageType
  theme?: ChatTheme
  status?: MessageStatus
  previousStatus?: MessageStatus
  mediaType?: MediaType
  isMediaLoaded?: boolean
  isMediaPlaying?: boolean
  waveform?: number[]
  isTyping?: boolean
  typingComplete?: boolean
  onPress?: () => void
  onLongPress?: () => void
  onReply?: () => void
  onReaction?: (emoji: ReactionType) => void
  onMediaZoom?: () => void
  className?: string
  enabled?: boolean
}

export function BubbleWrapper({
  children,
  index = 0,
  direction = 'outgoing',
  isOwn = true,
  isNew = true,
  isHighlighted = false,
  isThreadMessage = false,
  senderType = 'user',
  messageType = 'default',
  theme = 'light',
  status = 'sent',
  previousStatus,
  mediaType,
  isMediaLoaded = false,
  isMediaPlaying = false,
  waveform = [],
  isTyping = false,
  typingComplete = false,
  onPress,
  onLongPress,
  onReply,
  onReaction,
  onMediaZoom,
  className,
  enabled = true
}: BubbleWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const entry = useBubbleEntry({
    index,
    direction,
    enabled,
    isNew
  })

  const gesture = useBubbleGesture({
    onPress,
    onLongPress,
    hapticFeedback: true
  })

  const tilt = useBubbleTilt({
    enabled
  })

  const shimmer = useTypingShimmer({
    enabled: isTyping && !typingComplete,
    isComplete: typingComplete
  })

  const sparkles = useReactionSparkles({
    onReaction,
    hapticFeedback: true
  })

  const swipeReply = useSwipeReply({
    onReply,
    enabled: enabled && !isOwn
  })

  const _receipt = useReceiptTransition({
    status,
    previousStatus
  })

  const _media = useMediaBubble({
    type: mediaType ?? 'image',
    isLoaded: isMediaLoaded,
    isPlaying: isMediaPlaying,
    onZoom: onMediaZoom,
    waveform
  })

  // Hooks called for React rules but not currently used in rendering
  void _receipt
  void _media

  const threadHighlight = useThreadHighlight({
    isThreadMessage,
    enabled
  })

  const timestamp = useTimestampReveal({
    enabled
  })

  const bubbleTheme = useBubbleTheme({
    senderType,
    messageType,
    theme
  })

  const handleHover = useCallback((event: { x: number; y: number }) => {
    if (!containerRef.current || !enabled) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = event.x - rect.left
    const relativeY = event.y - rect.top

    tilt.handleMove(relativeX, relativeY, rect.width, rect.height)
  }, [tilt, enabled])

  const handleHoverEnd = useCallback(() => {
    if (enabled) {
      tilt.handleLeave()
    }
  }, [tilt, enabled])

  const handlePanStart = useCallback((_event: { x: number; y: number }) => {
    if (swipeReply && enabled) {
      swipeReply.handleGestureStart()
    }
  }, [swipeReply, enabled])

  const handlePanUpdate = useCallback((event: {
    translationX: number
    translationY: number
    x: number
    y: number
  }) => {
    if (swipeReply && enabled) {
      swipeReply.handleGestureUpdate(event.translationX, event.translationX * 10)
    }
  }, [swipeReply, enabled])

  const handlePanEnd = useCallback((event: {
    translationX: number
    translationY: number
    velocityX: number
    velocityY: number
  }) => {
    if (swipeReply && enabled) {
      swipeReply.handleGestureEnd(event.translationX, event.velocityX)
    }
  }, [swipeReply, enabled])

  const handleLongPressWithTimestamp = useCallback((_event: { x: number; y: number }) => {
    if (onLongPress) {
      onLongPress()
    }
    if (timestamp) {
      timestamp.show()
    }
  }, [onLongPress, timestamp])

  useEffect(() => {
    if (isHighlighted) {
      gesture.showReactionMenu()
    }
  }, [isHighlighted, gesture])

  const combinedStyle: AnimatedStyle = {
    ...entry.animatedStyle,
    ...gesture.animatedStyle,
    ...tilt.animatedStyle,
    ...bubbleTheme.animatedStyle
  } as AnimatedStyle

  return (
    <BubbleGestureWrapper
      onPress={gesture.handlePress}
      onLongPress={handleLongPressWithTimestamp}
      onPanStart={handlePanStart}
      onPanUpdate={handlePanUpdate}
      onPanEnd={handlePanEnd}
      onHover={handleHover}
      onHoverEnd={handleHoverEnd}
      enabled={enabled}
    >
      <div
        ref={containerRef}
        className={cn('relative', className)}
      >
        <AnimatedView
          style={combinedStyle}
          className="relative"
        >
                     <AnimatedView
             style={gesture.glowStyle as AnimatedStyle}
             className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
           >
             <div />
           </AnimatedView>

           <AnimatedView
             style={threadHighlight.highlightStyle as AnimatedStyle}
             className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
           >
             <div />
           </AnimatedView>

           {isTyping && !typingComplete ? (
             <AnimatedView
               style={shimmer.placeholderStyle as AnimatedStyle}
               className="relative"
             >
               <div className="px-4 py-3 bg-muted/50 rounded-2xl">
                 <AnimatedView
                   style={shimmer.shimmerStyle as AnimatedStyle}
                   className="absolute inset-0 rounded-2xl overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                 </AnimatedView>
                 <div className="flex gap-1">
                   <div className="w-2 h-2 bg-foreground/30 rounded-full" />
                   <div className="w-2 h-2 bg-foreground/30 rounded-full" />
                   <div className="w-2 h-2 bg-foreground/30 rounded-full" />
                 </div>
               </div>
             </AnimatedView>
           ) : (
             <AnimatedView
               style={shimmer.contentStyle as AnimatedStyle}
               className="relative"
             >
               {children}
             </AnimatedView>
           )}

                                                                                       {sparkles.particles.map((particle: Particle) => {
               const particleStyle = createParticleAnimatedStyle(particle)
               return (
                 <AnimatedView
                   key={particle.id}
                   style={particleStyle as unknown as AnimatedStyle}
                   className="absolute pointer-events-none"
                 >
                   <div />
                 </AnimatedView>
               )
             })}

                       {swipeReply && (
               <AnimatedView
                 style={swipeReply.animatedStyle as unknown as AnimatedStyle}
                 className="absolute inset-0 rounded-2xl bg-primary/10 pointer-events-none"
               >
                 <div />
               </AnimatedView>
             )}
           </AnimatedView>

          {threadHighlight.previewStyle && (
            <AnimatedView
              style={threadHighlight.previewStyle as unknown as AnimatedStyle}
              className="mt-2 px-3 py-2 bg-muted rounded-lg text-sm opacity-70"
            >
              <div>Thread preview...</div>
            </AnimatedView>
          )}

          {timestamp.animatedStyle && (
            <AnimatedView
              style={timestamp.animatedStyle as unknown as AnimatedStyle}
              className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black/70 text-white text-xs rounded whitespace-nowrap"
            >
              <div>Timestamp</div>
            </AnimatedView>
          )}
      </div>
    </BubbleGestureWrapper>
  )
}
