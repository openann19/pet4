/**
 * Mobile Adapter: useParallaxTilt
 * Parallax tilt effect for mobile (gesture-based or device tilt)
 */

import { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated'
import { useCallback } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'

export interface UseParallaxTiltOptions {
  maxTilt?: number
  damping?: number
  stiffness?: number
  enabled?: boolean
  perspective?: number
}

export interface UseParallaxTiltReturn {
  rotateX: SharedValue<number>
  rotateY: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  handleMove: (x: number, y: number, width: number, height: number) => void
  handleLeave: () => void
  gesture: ReturnType<typeof Gesture.Pan>
}

const DEFAULT_MAX_TILT = 15
const DEFAULT_DAMPING = 15
const DEFAULT_STIFFNESS = 150
const DEFAULT_PERSPECTIVE = 1000

export function useParallaxTilt(options: UseParallaxTiltOptions = {}): UseParallaxTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE
  } = options

  const isReducedMotion = useReducedMotionSV()
  const rotateX = useSharedValue(0)
  const rotateY = useSharedValue(0)

  const handleMove = useCallback((
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (!enabled || isReducedMotion.value) return

    const centerX = width / 2
    const centerY = height / 2
    
    const deltaX = x - centerX
    const deltaY = y - centerY
    
    const tiltX = interpolate(
      deltaY,
      [-height / 2, height / 2],
      [maxTilt, -maxTilt],
      Extrapolation.CLAMP
    )
    
    const tiltY = interpolate(
      deltaX,
      [-width / 2, width / 2],
      [-maxTilt, maxTilt],
      Extrapolation.CLAMP
    )

    rotateX.value = withSpring(tiltX, { damping, stiffness })
    rotateY.value = withSpring(tiltY, { damping, stiffness })
  }, [enabled, maxTilt, damping, stiffness, rotateX, rotateY, isReducedMotion])

  const handleLeave = useCallback(() => {
    if (!enabled || isReducedMotion.value) return
    rotateX.value = withSpring(0, { damping, stiffness })
    rotateY.value = withSpring(0, { damping, stiffness })
  }, [enabled, damping, stiffness, rotateX, rotateY, isReducedMotion])

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((e) => {
      // Get container dimensions from layout or use defaults
      const width = 200 // Should be passed from component
      const height = 200
      handleMove(e.x, e.y, width, height)
    })
    .onEnd(() => {
      handleLeave()
    })

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || isReducedMotion.value) {
      return {
        transform: [
          { perspective },
          { rotateX: '0deg' },
          { rotateY: '0deg' }
        ]
      }
    }

    return {
      transform: [
        { perspective },
        { rotateX: `${String(rotateX.value ?? '')}deg` },
        { rotateY: `${String(rotateY.value ?? '')}deg` }
      ]
    }
  })

  return {
    rotateX,
    rotateY,
    animatedStyle,
    handleMove,
    handleLeave,
    gesture
  }
}

