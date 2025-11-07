'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { ReactNode } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface PresenceGlowProps {
  isActive: boolean
  children: ReactNode
  className?: string
  intensity?: number
  pulseDuration?: number
}

const DEFAULT_INTENSITY = 0.6
const DEFAULT_PULSE_DURATION = 2000

export function PresenceGlow({
  isActive,
  children,
  className,
  intensity = DEFAULT_INTENSITY,
  pulseDuration = DEFAULT_PULSE_DURATION
}: PresenceGlowProps): React.JSX.Element {
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(isActive)) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(intensity, {
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease)
          }),
          withTiming(intensity * 0.5, {
            duration: pulseDuration / 2,
            easing: Easing.inOut(Easing.ease)
          })
        ),
        -1,
        false
      )
    } else {
      glowOpacity.value = withTiming(0, timingConfigs.fast)
    }
  }, [isActive, intensity, pulseDuration, glowOpacity])

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      boxShadow: isActive
        ? `0 0 ${String(10 + glowOpacity.value * 10 ?? '')}px rgba(59, 130, 246, ${String(glowOpacity.value * 0.8 ?? '')})`
        : 'none'
    }
  })

  return (
    <div className={className} style={{ position: 'relative' }}>
      {children}
      {isActive && (
        <AnimatedView
          style={glowStyle}
          className="absolute inset-0 rounded-full pointer-events-none -z-10"
        >
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md" />
        </AnimatedView>
      )}
    </div>
  )
}

