/**
 * Mobile Adapter: useMotionVariants
 * Variant-based animations for mobile using Reanimated
 */

import { useCallback, useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay, type SharedValue } from '@petspark/motion'
import { springConfigs, timingConfigs, type SpringConfig, type TimingConfig } from './transitions'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

export interface VariantDefinition {
  opacity?: number
  scale?: number
  x?: number
  y?: number
  rotate?: number
  rotateX?: number
  rotateY?: number
  translateX?: number
  translateY?: number
  backgroundColor?: string
  color?: string
  transition?: {
    type?: 'spring' | 'tween'
    duration?: number
    delay?: number
    stiffness?: number
    damping?: number
    mass?: number
    ease?: string | number[]
  }
}

export interface Variants {
  [key: string]: VariantDefinition
}

export interface UseMotionVariantsOptions {
  variants?: Variants
  initial?: string | VariantDefinition
  animate?: string | VariantDefinition
  exit?: string | VariantDefinition
  transition?: VariantDefinition['transition']
  enabled?: boolean
}

export interface UseMotionVariantsReturn {
  opacity: SharedValue<number>
  scale: SharedValue<number>
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  rotate: SharedValue<number>
  rotateX: SharedValue<number>
  rotateY: SharedValue<number>
  backgroundColor: SharedValue<string>
  color: SharedValue<string>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  setVariant: (variant: string) => void
  setCustomVariant: (variant: VariantDefinition) => void
}

function getVariantValue(
  variants: Variants | undefined,
  key: string | VariantDefinition | undefined,
  fallback: VariantDefinition = {}
): VariantDefinition {
  if (!key) return fallback
  if (typeof key === 'string') {
    return variants?.[key] ?? fallback
  }
  return key
}

function applyTransition(
  value: SharedValue<number | string>,
  target: number | string,
  transition: VariantDefinition['transition'] | undefined,
  isReducedMotion: boolean
): void {
  if (isTruthy(isReducedMotion)) {
    value.value = target as number
    return
  }

  const delay = transition?.delay ?? 0
  const duration = transition?.duration ?? timingConfigs.smooth.duration

  if (transition?.type === 'spring') {
    const springConfig: SpringConfig = {
      stiffness: transition.stiffness ?? springConfigs.smooth.stiffness ?? 400,
      damping: transition.damping ?? springConfigs.smooth.damping ?? 25,
      mass: transition.mass ?? 1
    }
    if (delay > 0) {
      value.value = withDelay(delay, withSpring(target as number, springConfig))
    } else {
      value.value = withSpring(target as number, springConfig)
    }
  } else {
    const timingConfig: TimingConfig = {
      duration,
        // easing removed - use default
    }
    if (delay > 0) {
      value.value = withDelay(delay, withTiming(target as number, timingConfig))
    } else {
      value.value = withTiming(target as number, timingConfig)
    }
  }
}

export function useMotionVariants(
  options: UseMotionVariantsOptions = {}
): UseMotionVariantsReturn {
  const {
    variants = {},
    initial,
    animate,
    exit,
    transition: defaultTransition,
    enabled = true
  } = options

  const isReducedMotion = useReducedMotionSV()
  const initialVariant = getVariantValue(variants, initial, { opacity: 1, scale: 1 })
  const animateVariant = getVariantValue(variants, animate, { opacity: 1, scale: 1 })
  const exitVariant = getVariantValue(variants, exit, { opacity: 0, scale: 0.95 })

  const opacity = useSharedValue(initialVariant.opacity ?? animateVariant.opacity ?? 1)
  const scale = useSharedValue(initialVariant.scale ?? animateVariant.scale ?? 1)
  const translateX = useSharedValue(initialVariant.translateX ?? initialVariant.x ?? animateVariant.translateX ?? animateVariant.x ?? 0)
  const translateY = useSharedValue(initialVariant.translateY ?? initialVariant.y ?? animateVariant.translateY ?? animateVariant.y ?? 0)
  const rotate = useSharedValue(initialVariant.rotate ?? animateVariant.rotate ?? 0)
  const rotateX = useSharedValue(initialVariant.rotateX ?? animateVariant.rotateX ?? 0)
  const rotateY = useSharedValue(initialVariant.rotateY ?? animateVariant.rotateY ?? 0)
  const backgroundColor = useSharedValue(initialVariant.backgroundColor ?? animateVariant.backgroundColor ?? 'transparent')
  const color = useSharedValue(initialVariant.color ?? animateVariant.color ?? 'inherit')

  const applyVariant = useCallback((variant: VariantDefinition) => {
    if (!enabled) return

    const transition = variant.transition ?? defaultTransition

    if (variant.opacity !== undefined) {
      applyTransition(opacity, variant.opacity, transition, isReducedMotion.value)
    }
    if (variant.scale !== undefined) {
      applyTransition(scale, variant.scale, transition, isReducedMotion.value)
    }
    if (variant.translateX !== undefined || variant.x !== undefined) {
      applyTransition(translateX, variant.translateX ?? variant.x ?? 0, transition, isReducedMotion.value)
    }
    if (variant.translateY !== undefined || variant.y !== undefined) {
      applyTransition(translateY, variant.translateY ?? variant.y ?? 0, transition, isReducedMotion.value)
    }
    if (variant.rotate !== undefined) {
      applyTransition(rotate, variant.rotate, transition, isReducedMotion.value)
    }
    if (variant.rotateX !== undefined) {
      applyTransition(rotateX, variant.rotateX, transition, isReducedMotion.value)
    }
    if (variant.rotateY !== undefined) {
      applyTransition(rotateY, variant.rotateY, transition, isReducedMotion.value)
    }
    if (variant.backgroundColor !== undefined) {
      backgroundColor.value = variant.backgroundColor
    }
    if (variant.color !== undefined) {
      color.value = variant.color
    }
  }, [enabled, defaultTransition, opacity, scale, translateX, translateY, rotate, rotateX, rotateY, backgroundColor, color, isReducedMotion])

  useEffect(() => {
    if (enabled && animate) {
      const variant = typeof animate === 'string' ? variants[animate] : animate
      if (isTruthy(variant)) {
        applyVariant(variant)
      }
    }
  }, [enabled, animate, variants, applyVariant])

  const setVariant = useCallback((variantKey: string) => {
    const variant = variants[variantKey]
    if (isTruthy(variant)) {
      applyVariant(variant)
    }
  }, [variants, applyVariant])

  const setCustomVariant = useCallback((variant: VariantDefinition) => {
    applyVariant(variant)
  }, [applyVariant])

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Array<{ translateX?: number; translateY?: number; scale?: number; rotate?: string; rotateX?: string; rotateY?: string }> = []

    if (translateX.value !== 0) {
      transforms.push({ translateX: translateX.value })
    }
    if (translateY.value !== 0) {
      transforms.push({ translateY: translateY.value })
    }
    if (scale.value !== 1) {
      transforms.push({ scale: scale.value })
    }
    if (rotate.value !== 0) {
      transforms.push({ rotate: `${String(rotate.value ?? '')}deg` })
    }
    if (rotateX.value !== 0) {
      transforms.push({ rotateX: `${String(rotateX.value ?? '')}deg` })
    }
    if (rotateY.value !== 0) {
      transforms.push({ rotateY: `${String(rotateY.value ?? '')}deg` })
    }

    const style: Record<string, unknown> = {
      opacity: opacity.value
    }

    if (transforms.length > 0) {
      style.transform = transforms
    }

    if (backgroundColor.value !== 'transparent') {
      style.backgroundColor = backgroundColor.value
    }

    if (color.value !== 'inherit') {
      style.color = color.value
    }

    return style
  })

  return {
    opacity,
    scale,
    translateX,
    translateY,
    rotate,
    rotateX,
    rotateY,
    backgroundColor,
    color,
    animatedStyle,
    setVariant,
    setCustomVariant
  }
}
