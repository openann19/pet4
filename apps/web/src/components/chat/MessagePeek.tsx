'use client'

import { useEffect, useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { usePrefersReducedMotion } from '@/utils/reduced-motion'
import { useFeatureFlags } from '@/config/feature-flags'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { X } from '@phosphor-icons/react'

export interface MessagePeekProps {
  message: {
    content: string
    senderName: string
    timestamp: string
    type?: string
  }
  visible: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

/**
 * MessagePeek Component
 * 
 * Long-press preview card with magnified message content
 * Opens within 120ms, respects reduced motion
 */
export function MessagePeek({
  message,
  visible,
  onClose,
  position
}: MessagePeekProps) {
  const reducedMotion = usePrefersReducedMotion()
  const { enableMessagePeek } = useFeatureFlags()
  
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  
  useEffect(() => {
    if (!enableMessagePeek) {
      return
    }
    
    if (visible) {
      const duration = reducedMotion ? 120 : 180
      scale.value = withSpring(1, springConfigs.smooth)
      opacity.value = withTiming(1, { duration })
      backdropOpacity.value = withTiming(0.25, { duration })
    } else {
      scale.value = withTiming(0.9, timingConfigs.fast)
      opacity.value = withTiming(0, timingConfigs.fast)
      backdropOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [visible, reducedMotion, enableMessagePeek, scale, opacity, backdropOpacity])
  
  useEffect(() => {
    if (!visible || !enableMessagePeek) {
      return
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [visible, onClose, enableMessagePeek])
  
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle
  
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  })) as AnimatedStyle
  
  if (!enableMessagePeek || !visible) {
    return null
  }
  
  const cardPosition = position
    ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-50%, -50%)' }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  
  return (
    <>
      <AnimatedView
        style={backdropStyle}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <AnimatedView
        style={cardStyle}
        className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-[90vw]"
        style={{ ...cardPosition, ...cardStyle }}
        role="dialog"
        aria-modal="true"
        aria-label="Message preview"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-sm text-foreground">{message.senderName}</p>
            <p className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleTimeString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-base text-foreground whitespace-pre-wrap wrap-break-word">
          {message.content}
        </div>
      </AnimatedView>
    </>
  )
}
