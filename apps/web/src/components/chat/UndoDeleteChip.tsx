'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut
} from 'react-native-reanimated'
import { useCallback, useEffect, useState } from 'react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { ArrowUUpLeft } from '@phosphor-icons/react'
import { isTruthy, isDefined } from '@/core/guards';

export interface UndoDeleteChipProps {
  onUndo: () => void
  duration?: number
  className?: string
}

export function UndoDeleteChip({
  onUndo,
  duration = 5000,
  className
}: UndoDeleteChipProps) {
  const [isVisible, setIsVisible] = useState(true)
  const translateX = useSharedValue(-100)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  const handleUndo = useCallback(() => {
    haptics.selection()
    setIsVisible(false)
    onUndo()
  }, [onUndo])

  useEffect(() => {
    if (isTruthy(isVisible)) {
      translateX.value = withSpring(0, springConfigs.bouncy)
      opacity.value = withTiming(1, timingConfigs.fast)
      scale.value = withSpring(1, springConfigs.bouncy)
    } else {
      translateX.value = withTiming(-100, timingConfigs.fast)
      opacity.value = withTiming(0, timingConfigs.fast)
      scale.value = withTiming(0.8, timingConfigs.fast)
    }
  }, [isVisible, translateX, opacity, scale])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => { clearTimeout(timer); }
  }, [duration])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value
    }
  })

  if (!isVisible) {
    return null
  }

  return (
    <AnimatedView
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={animatedStyle}
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'bg-card border border-border rounded-full shadow-lg',
        'px-4 py-2 flex items-center gap-2',
        'transform-gpu',
        className
      )}
    >
      <button
        onClick={handleUndo}
        className={cn(
          'flex items-center gap-2',
          'text-sm font-medium',
          'hover:opacity-80 transition-opacity'
        )}
      >
        <ArrowUUpLeft size={16} className="text-foreground" />
        <span className="text-foreground">Undo delete</span>
      </button>
    </AnimatedView>
  )
}

