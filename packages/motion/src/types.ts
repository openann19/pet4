/**
 * Shared TypeScript interfaces for animation hooks
 * Platform-agnostic definitions for consistent API contracts
 */

// Platform-agnostic SharedValue type
export type SharedValue<T = number> = {
  value: T
  modify: (modifier: (value: T) => T) => void
  addListener: (listener: (value: T) => void) => string
  removeListener: (id: string) => void
}

// ============================================================================
// Core Animation Types
// ============================================================================

export interface SpringConfig {
  stiffness?: number
  damping?: number
  mass?: number
}

export interface TimingConfig {
  duration?: number
  easing?: (value: number) => number
}

export interface WithSpringConfig extends SpringConfig {}
export interface WithTimingConfig extends TimingConfig {}

// ============================================================================
// Animation State Types
// ============================================================================

export interface AnimationState {
  isAnimating: SharedValue<boolean>
  progress: SharedValue
}

export interface TransformValues {
  translateX?: SharedValue
  translateY?: SharedValue
  scale?: SharedValue
  rotate?: SharedValue
  rotateX?: SharedValue
  rotateY?: SharedValue
  skewX?: SharedValue
  skewY?: SharedValue
}

// ============================================================================
// Common Hook Options
// ============================================================================

export interface BaseAnimationOptions {
  enabled?: boolean
  hapticFeedback?: boolean
  reducedMotion?: boolean
}

export interface SpringAnimationOptions extends BaseAnimationOptions {
  stiffness?: number
  damping?: number
  mass?: number
}

export interface TimingAnimationOptions extends BaseAnimationOptions {
  duration?: number
  easing?: (value: number) => number
}

export interface GestureAnimationOptions extends BaseAnimationOptions {
  maxDistance?: number
  sensitivity?: number
  bounds?: {
    min?: number
    max?: number
  }
}

// ============================================================================
// Common Hook Returns
// ============================================================================

// Platform-agnostic animated style type
export type AnimatedStyle = Record<string, unknown>

export interface BaseAnimationReturn {
  animatedStyle: AnimatedStyle
}

export interface GestureAnimationReturn extends BaseAnimationReturn {
  handleStart?: (...args: unknown[]) => void
  handleMove?: (...args: unknown[]) => void
  handleEnd?: (...args: unknown[]) => void
  handleCancel?: (...args: unknown[]) => void
}

export interface TransformAnimationReturn extends BaseAnimationReturn {
  values: TransformValues
}

// ============================================================================
// Specific Hook Types
// ============================================================================

// Magnetic Effects
export interface MagneticEffectOptions extends SpringAnimationOptions, GestureAnimationOptions {
  strength?: number
}

export interface MagneticEffectReturn extends TransformAnimationReturn {
  handleMove: (x: number, y: number) => void
  handleLeave: () => void
}

// Parallax Effects
export interface ParallaxTiltOptions extends SpringAnimationOptions {
  maxTilt?: number
  perspective?: number
}

export interface ParallaxTiltReturn extends TransformAnimationReturn {
  handleMove: (x: number, y: number, width: number, height: number) => void
  handleLeave: () => void
}

// Particle Effects
export interface ParticleOptions extends TimingAnimationOptions {
  count?: number
  size?: number
  color?: string
  velocity?: { x: number; y: number }
  lifetime?: number
}

export interface ParticleSystemReturn extends BaseAnimationReturn {
  particles: SharedValue<Array<{
    id: string
    x: number
    y: number
    scale: number
    opacity: number
  }>>
  spawnParticle: (config?: Partial<ParticleOptions>) => void
}

// Morphing Effects
export interface MorphShapeOptions extends SpringAnimationOptions {
  fromPath?: string
  toPath?: string
  progress?: SharedValue
}

export interface MorphShapeReturn extends BaseAnimationReturn {
  progress: SharedValue
  setProgress: (value: number) => void
}

// Carousel Effects
export interface CarouselOptions extends SpringAnimationOptions {
  itemCount: number
  itemWidth: number
  spacing?: number
  loop?: boolean
}

export interface CarouselReturn extends TransformAnimationReturn {
  currentIndex: SharedValue
  scrollToIndex: (index: number, animated?: boolean) => void
  next: () => void
  previous: () => void
}

// Wave Effects
export interface WaveAnimationOptions extends TimingAnimationOptions {
  amplitude?: number
  frequency?: number
  phase?: number
  waveCount?: number
}

export interface WaveAnimationReturn extends BaseAnimationReturn {
  amplitude: SharedValue
  phase: SharedValue
}

// Stagger Effects
export interface StaggerContainerOptions extends TimingAnimationOptions {
  staggerDelay?: number
  from?: 'first' | 'last' | 'center'
}

export interface StaggerContainerReturn extends BaseAnimationReturn {
  staggerIndex: SharedValue
}

// ============================================================================
// Transition Presets
// ============================================================================

export interface TransitionPreset {
  opacity?: {
    from: number
    to: number
    config: TimingConfig | SpringConfig
  }
  scale?: {
    from: number
    to: number
    config: TimingConfig | SpringConfig
  }
  translateX?: {
    from: number
    to: number
    config: TimingConfig | SpringConfig
  }
  translateY?: {
    from: number
    to: number
    config: TimingConfig | SpringConfig
  }
  rotate?: {
    from: number
    to: number
    config: TimingConfig | SpringConfig
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type AnimationConfig = SpringConfig | TimingConfig
export type AnimationType = 'spring' | 'timing' | 'decay' | 'bounce'
export type EasingFunction = (value: number) => number

// Platform-specific input types
export interface MouseEvent {
  clientX: number
  clientY: number
}

export interface TouchEvent {
  touches: Array<{ clientX: number; clientY: number }>
  changedTouches: Array<{ clientX: number; clientY: number }>
}

export interface GestureEvent {
  translationX: number
  translationY: number
  velocityX: number
  velocityY: number
}

// Haptic feedback types
export interface HapticOptions {
  enabled: boolean
  style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
  pattern?: number[]
}

// ============================================================================
// Re-export for convenience
// ============================================================================

// SharedValue is already exported as a type above
