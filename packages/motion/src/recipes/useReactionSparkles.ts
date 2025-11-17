/**
 * useReactionSparkles
 * Shared animation hook for reaction sparkle/particle effects
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useState, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withSequence, withRepeat, withTiming, withDelay, type SharedValue } from 'react-native-reanimated'
import { springConfigs, timingConfigs } from '../shared-transitions'
import { useReducedMotionSV } from '../reduced-motion'
import { haptic } from '../haptic'
import { isTruthy, isDefined } from '../utils/guards';

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐'

export interface UseReactionSparklesOptions {
  onReaction?: (emoji: ReactionType) => void
  hapticFeedback?: boolean
  enableParticles?: boolean
  enablePulse?: boolean
}

export interface UseReactionSparklesReturn {
  emojiScale: SharedValue<number>
  emojiOpacity: SharedValue<number>
  pulseScale: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  pulseStyle: ReturnType<typeof useAnimatedStyle>
  animate: (emoji: ReactionType, x?: number, y?: number) => void
  startPulse: () => void
  stopPulse: () => void
}

export const EMOJI_COLORS: Record<ReactionType, string[]> = {
  '❤️': ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
  '😂': ['#FFD93D', '#FFE66D', '#FFF4A3'],
  '👍': ['#4ECDC4', '#6EDDD4', '#8EEDE4'],
  '👎': ['#95A5A6', '#BDC3C7', '#D5DBDB'],
  '🔥': ['#FF6B35', '#FF8C42', '#FFA07A'],
  '🙏': ['#A8D8EA', '#C8E6F5', '#E8F4F8'],
  '⭐': ['#FFD700', '#FFE55C', '#FFF4A3']
}

const DEFAULT_HAPTIC_FEEDBACK = true
const DEFAULT_ENABLE_PARTICLES = true
const DEFAULT_ENABLE_PULSE = true

export function useReactionSparkles(
  options: UseReactionSparklesOptions = {}
): UseReactionSparklesReturn {
  const {
    onReaction,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enableParticles = DEFAULT_ENABLE_PARTICLES,
    enablePulse = DEFAULT_ENABLE_PULSE
  } = options

  const isReducedMotion = useReducedMotionSV()
  const emojiScale = useSharedValue(0)
  const emojiOpacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)
  const [isPulsing, setIsPulsing] = useState(false)

  const animate = useCallback((emoji: ReactionType, x?: number, y?: number) => {
    if (isTruthy(hapticFeedback)) {
      haptic.medium()
    }

    if (isTruthy(isReducedMotion.value)) {
      emojiScale.value = 1
      emojiOpacity.value = 1
      setTimeout(() => {
        emojiOpacity.value = 0
      }, 400)
    } else {
      emojiScale.value = withSequence(
        withSpring(1.2, {
          damping: 10,
          stiffness: 400
        }),
        withSpring(1, springConfigs.bouncy)
      )

      emojiOpacity.value = withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(400, withTiming(0, timingConfigs.smooth))
      )
    }

    // Particles are handled by platform-specific implementations
    if (enableParticles && x !== undefined && y !== undefined) {
      // Platform-specific particle spawning will be handled in adapters
    }

    if (onReaction) {
      onReaction(emoji)
    }
  }, [hapticFeedback, enableParticles, onReaction, emojiScale, emojiOpacity, isReducedMotion])

  const startPulse = useCallback(() => {
    if (!enablePulse || isPulsing || isReducedMotion.value) {
      return
    }

    setIsPulsing(true)
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: 400,
          easing: (t) => t
        }),
        withTiming(1, {
          duration: 400,
          easing: (t) => t
        })
      ),
      -1,
      false
    )
  }, [enablePulse, isPulsing, pulseScale, isReducedMotion])

  const stopPulse = useCallback(() => {
    setIsPulsing(false)
    if (isTruthy(isReducedMotion.value)) {
      pulseScale.value = 1
    } else {
      pulseScale.value = withTiming(1, timingConfigs.fast)
    }
  }, [pulseScale, isReducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      scale: emojiScale.value,
      opacity: emojiOpacity.value
    }
  })

  const pulseStyle = useAnimatedStyle(() => {
    return {
      scale: pulseScale.value
    }
  })

  return {
    emojiScale,
    emojiOpacity,
    pulseScale,
    animatedStyle,
    pulseStyle,
    animate,
    startPulse,
    stopPulse
  }
}

