/**
 * Mobile Adapter: useReactionSparkles
 * Optimized reaction sparkles for mobile platform
 */

import { useReactionSparkles as useSharedReactionSparkles, type UseReactionSparklesOptions, type ReactionType } from '@petspark/motion'
import { useState, useCallback } from 'react'
import type { SharedValue } from 'react-native-reanimated'

export type { ReactionType } from '@petspark/motion'

export interface MobileReactionSparklesOptions extends UseReactionSparklesOptions {
  /**
   * Use native driver for better performance
   * @default true
   */
  useNativeDriver?: boolean
}

export interface UseReactionSparklesReturn {
  emojiScale: SharedValue<number>
  emojiOpacity: SharedValue<number>
  pulseScale: SharedValue<number>
  animatedStyle: ReturnType<typeof useSharedReactionSparkles>['animatedStyle']
  pulseStyle: ReturnType<typeof useSharedReactionSparkles>['pulseStyle']
  animate: (emoji: ReactionType, x?: number, y?: number) => void
  startPulse: () => void
  stopPulse: () => void
  // Mobile-specific: simplified particles (just opacity/scale animations)
  particles: Array<{
    id: string
    x: number
    y: number
    opacity: SharedValue<number>
    scale: SharedValue<number>
  }>
  clearParticles: () => void
}

export function useReactionSparkles(
  options: MobileReactionSparklesOptions = {}
): UseReactionSparklesReturn {
  const {
    useNativeDriver = true,
    ...sharedOptions
  } = options

  const shared = useSharedReactionSparkles(sharedOptions)
  const [particles, setParticles] = useState<UseReactionSparklesReturn['particles']>([])

  const animate = useCallback((emoji: ReactionType, x?: number, y?: number) => {
    shared.animate(emoji, x, y)

    // Create simplified particles for mobile (just visual feedback, no complex physics)
    if (x !== undefined && y !== undefined && sharedOptions.enableParticles) {
      // Mobile uses simpler particle system - just opacity/scale animations
      const newParticles = Array.from({ length: 5 }, (_, i) => ({
        id: `${String(Date.now() ?? '')}-${String(i ?? '')}`,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        opacity: shared.emojiOpacity, // Reuse shared opacity for simplicity
        scale: shared.emojiScale, // Reuse shared scale for simplicity
      }))
      setParticles(prev => [...prev, ...newParticles])
      
      // Clean up after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.includes(p)))
      }, 800)
    }
  }, [shared, sharedOptions.enableParticles])

  const clearParticles = useCallback(() => {
    setParticles([])
  }, [])

  return {
    ...shared,
    animate,
    particles,
    clearParticles,
  }
}

