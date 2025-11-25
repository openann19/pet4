/**
 * Type definitions for PETSPARK motion package
 */

import type { Variants, Transition, AnimationControls, Variant } from 'framer-motion'

// Re-export Variant for use in other modules
export type { Variant } from 'framer-motion'

// Animation variant types
export interface AnimationVariants extends Variants {
  hidden: Variant
  visible: Variant
  hover?: Variant
  tap?: Variant
  disabled?: Variant
}

// Animation preset types
export interface AnimationPreset {
  name: string
  variants: AnimationVariants
  transition?: Transition
  initial?: string
  animate?: string
  whileHover?: string
  whileTap?: string
}

// Motion component props
export interface MotionProps {
  variants?: AnimationVariants
  transition?: Transition
  initial?: string | boolean
  animate?: string | boolean
  exit?: string | boolean
  whileHover?: string | boolean
  whileTap?: string | boolean
  layout?: boolean
  layoutId?: string
}

// Animation hook types
export interface UseAnimationOptions {
  controls?: AnimationControls
  variants?: AnimationVariants
  transition?: Transition
  initial?: string
  animate?: string
  exit?: string
}

// Platform-specific animation types
export interface PlatformAnimation {
  web: AnimationVariants
  mobile?: AnimationVariants
}

// Gesture animation types
export interface GestureAnimations {
  drag?: string
  dragConstraints?: string
  dragElastic?: number
  dragMomentum?: boolean
  dragTransition?: Transition
}

// Stagger animation types
export interface StaggerAnimation {
  staggerChildren?: number
  delayChildren?: number
  staggerDirection?: 1 | -1
  when?: 'beforeChildren' | 'afterChildren'
}

// Layout animation types
export interface LayoutAnimation {
  type?: 'crossfade' | 'fade' | 'push' | 'swap'
  duration?: number
  ease?: string
}

// Spring animation types
export interface SpringAnimation {
  type: 'spring'
  stiffness?: number
  damping?: number
  mass?: number
  velocity?: number
  restDelta?: number
  restSpeed?: number
}

// Tween animation types
export interface TweenAnimation {
  type: 'tween'
  duration?: number
  ease?: string | number[]
  from?: Record<string, unknown>
  to?: Record<string, unknown>
}

// Keyframe animation types
export interface KeyframeAnimation {
  type: 'keyframes'
  duration?: number
  ease?: string | number[]
  keyframes?: Record<string, unknown>[]
}

// Animation duration presets
export type AnimationDuration = 'fast' | 'normal' | 'slow' | number

// Animation easing presets
export type AnimationEasing =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'circIn'
  | 'circOut'
  | 'circInOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'
  | 'anticipate'
  | string

// Animation direction types
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'

// Animation fill mode types
export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both'

// Animation play state types
export type AnimationPlayState = 'running' | 'paused'

// Animation iteration count types
export type AnimationIterationCount = number | 'infinite'

// Animation transform types
export interface AnimationTransform {
  x?: number | string
  y?: number | string
  z?: number | string
  scale?: number | string
  scaleX?: number | string
  scaleY?: number | string
  scaleZ?: number | string
  rotate?: number | string
  rotateX?: number | string
  rotateY?: number | string
  rotateZ?: number | string
  skewX?: number | string
  skewY?: number | string
  perspective?: number | string
  transformPerspective?: number | string
}

// Animation filter types
export interface AnimationFilter {
  blur?: number | string
  brightness?: number | string
  contrast?: number | string
  grayscale?: number | string
  hueRotate?: number | string
  invert?: number | string
  saturate?: number | string
  sepia?: number | string
  dropShadow?: string
}

// Complete animation definition
export interface CompleteAnimation {
  transform?: AnimationTransform
  filter?: AnimationFilter
  opacity?: number
  backgroundColor?: string
  color?: string
  borderColor?: string
  borderRadius?: number | string
  borderWidth?: number | string
  boxShadow?: string
  zIndex?: number
}
