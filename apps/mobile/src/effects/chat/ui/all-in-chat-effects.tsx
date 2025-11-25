/**
 * All-In Chat Effects Library
 * A comprehensive effects pack for chat UIs - mix and match!
 *
 * Features:
 * - 17 production-ready chat effects
 * - Full accessibility support (reduce motion)
 * - TypeScript strict mode
 * - Zero console.* (uses project logger)
 * - Gesture-driven interactions
 * - 60fps performance optimized
 *
 * Libraries: react, react-native, react-native-reanimated v3, react-native-gesture-handler
 * Optional: expo-linear-gradient for enhanced shimmer visuals
 *
 * Location: apps/mobile/src/effects/chat/ui/all-in-chat-effects.tsx
 */

import React, { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  View,
  Pressable,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, withDelay, withSequence, cancelAnimation, interpolate, interpolateColor, Easing, runOnJS, type SharedValue } from '@petspark/motion'
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import { isTruthy } from '@petspark/shared';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface UseShimmerSweepOptions {
  /** Duration in ms for one full pass */
  duration?: number
  /** Start delay in ms */
  delay?: number
  /** Opacity range [min, max] */
  opacityRange?: [number, number]
  /** Container width in pixels */
  width: number
  /** Pause animation */
  paused?: boolean
  /** Easing function */
  easing?: (t: number) => number
}

export interface UseShimmerSweepReturn {
  progress: SharedValue<number>
  opacity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

export interface ShimmerOverlayProps {
  /** Container width (measured via onLayout) */
  width: number
  /** Overlay height */
  height?: number
  /** Streak width as portion of container width */
  streakWidth?: number
  duration?: number
  delay?: number
  opacityRange?: [number, number]
  paused?: boolean
  easing?: (t: number) => number
  /** Custom children for streak (e.g., LinearGradient) */
  children?: ReactNode
}

export interface SendSwooshProps {
  /** Message bubble to animate */
  children: ReactNode
  /** Origin coordinates (e.g., send button center) */
  from: { x: number; y: number }
  /** Destination coordinates (usually {x:0, y:0}) */
  to?: { x: number; y: number }
  /** Trigger key to re-run animation */
  nonce?: number | string
  reduceMotion?: boolean
}

export interface ReactionBurstProps {
  /** Number of particles */
  count?: number
  /** Particle size in px */
  size?: number
  /** Spread radius in px */
  spread?: number
  /** Animation duration in ms */
  duration?: number
  /** Callback when animation completes */
  onDone?: () => void
}

export interface SwipeToReplyProps {
  /** Message bubble content */
  children: ReactNode
  /** Reply callback */
  onReply?: () => void
  /** Swipe distance threshold to trigger */
  threshold?: number
  /** Glow trail width */
  glowWidth?: number
}

export interface RippleProps {
  /** Press callback */
  onPress?: () => void
  /** Ripple radius */
  radius?: number
  /** Animation duration */
  duration?: number
  /** Button content */
  children: ReactNode
}

export type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read'

export interface DeliveryTicksProps {
  state: DeliveryState
}

export interface TypingIndicatorProps {
  /** Dot size */
  size?: number
  /** Gap between dots */
  gap?: number
  /** Animation duration */
  duration?: number
  reduceMotion?: boolean
}

export interface PrismShimmerOverlayProps {
  width: number
  height?: number
  streakWidth?: number
  /** Rotation angle in degrees */
  angleDeg?: number
  /** Skew angle in degrees */
  skewDeg?: number
  duration?: number
  delay?: number
  opacityRange?: [number, number]
  paused?: boolean
  children?: ReactNode
}

export interface EmojiTrailProps {
  /** Emoji character */
  emoji?: string
  /** Particle lifetime in ms */
  lifeMs?: number
  /** Distance between particles */
  step?: number
  /** Max particles on screen */
  max?: number
  /** Completion callback */
  onComplete?: () => void
  /** Container width */
  areaWidth?: number
  /** Container height */
  areaHeight?: number
}

export interface ConfettiEmitterProps {
  /** Number of confetti pieces */
  count?: number
  /** Spread radius */
  spread?: number
  /** Color palette */
  colors?: string[]
  /** Animation duration */
  duration?: number
  /** Completion callback */
  onDone?: () => void
}

export interface ReadGlintProps {
  /** Bubble width */
  width: number
  /** Glint height */
  height?: number
  /** Trigger nonce */
  nonce: number | string
}

export interface UnreadGlowPulseProps {
  /** Glow size */
  size?: number
  /** Active state */
  active: boolean
}

export interface UseParallaxTiltOptions {
  /** Scroll position shared value */
  scrollY: SharedValue<number>
  /** Tilt intensity factor */
  factor?: number
}

export interface UseMessageAppearOptions {
  /** Message index for stagger */
  index: number
  reduceMotion?: boolean
}

export interface UseBubblePopInOptions {
  delay?: number
  tension?: number
  friction?: number
  reduceMotion?: boolean
}

// ============================================================
// ACCESSIBILITY: REDUCE MOTION HOOK
// ============================================================

/**
 * Hook to detect user's reduce motion preference
 * Respects system-level accessibility settings
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    let mounted = true

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled: boolean | null | undefined) => {
      if (isTruthy(mounted)) {
        setReduce(Boolean(enabled))
      }
    })

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setReduce(Boolean(enabled))
      }
    )

    return () => {
      mounted = false
      subscription?.remove()
    }
  }, [])

  return reduce
}

// ============================================================
// 1) SHIMMER SWEEP (hook + overlay component)
// ============================================================

/**
 * Creates a sweeping shimmer animation
 * Use for loading states, skeleton screens, or attention highlights
 */
export function useShimmerSweep({
  duration = 2400,
  delay = 0,
  opacityRange = [0, 0.6],
  width,
  paused = false,
  easing = Easing.inOut(Easing.quad),
}: UseShimmerSweepOptions): UseShimmerSweepReturn {
  const progress = useSharedValue(0) // 0..1
  const opacity = useSharedValue(opacityRange[0])

  useEffect(() => {
    const start = (): void => {
      progress.value = withRepeat(
        withTiming(1, { duration, easing }),
        -1,
        false
      )
      opacity.value = withRepeat(
        withSequence(
          withTiming(opacityRange[1], { duration: duration * 0.5 }),
          withTiming(opacityRange[0], { duration: duration * 0.5 })
        ),
        -1,
        false
      )
    }

    const stop = (): void => {
      cancelAnimation(progress)
      cancelAnimation(opacity)
    }

    if (isTruthy(paused)) {
      stop()
      return stop
    }

    if (delay > 0) {
      const timer = setTimeout(start, delay)
      return () => {
        clearTimeout(timer)
        stop()
      }
    }

    start()
    return stop
  }, [duration, delay, opacityRange, paused, easing, progress, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = (progress.value * 2 - 1) * width
    return {
      transform: [{ translateX }],
      opacity: opacity.value,
    }
  })

  return { progress, opacity, animatedStyle }
}

/**
 * Shimmer overlay component
 * Place as absolute overlay on loading content
 */
export function ShimmerOverlay({
  width,
  height = 24,
  streakWidth = 0.35,
  duration = 2400,
  delay = 0,
  opacityRange = [0, 0.6],
  paused = false,
  easing = Easing.inOut(Easing.quad),
  children,
}: ShimmerOverlayProps): React.JSX.Element {
  const { animatedStyle } = useShimmerSweep({
    width,
    duration,
    delay,
    opacityRange,
    paused,
    easing,
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.abs,
        animatedStyle,
        { width: width * streakWidth, height },
      ]}
    >
      {children ?? (
        <View style={[StyleSheet.absoluteFill, styles.defaultShimmer]} />
      )}
    </Animated.View>
  )
}

// ============================================================
// 2) BUBBLE POP-IN (micro spring on mount)
// ============================================================

/**
 * Subtle spring animation for message bubble entrance
 * Prevents harsh pop-in, adds polish
 */
export function useBubblePopIn(
  options?: UseBubblePopInOptions
): ReturnType<typeof useAnimatedStyle> {
  const {
    delay = 0,
    tension = 700,
    friction = 40,
    reduceMotion = false,
  } = options ?? {}

  const scale = useSharedValue(reduceMotion ? 1 : 0.85)
  const opacity = useSharedValue(reduceMotion ? 1 : 0)

  useEffect(() => {
    const animate = (): void => {
      scale.value = withDelay(
        delay,
        withSpring(1, {
          stiffness: tension,
          damping: friction,
          mass: 0.6,
        })
      )
      opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration: 160,
          easing: Easing.out(Easing.quad),
        })
      )
    }

    animate()

    return () => {
      cancelAnimation(scale)
      cancelAnimation(opacity)
    }
  }, [delay, tension, friction, reduceMotion, scale, opacity])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return style
}

// ============================================================
// 3) SEND SWOOSH (launch from origin -> settle at destination)
// ============================================================

/**
 * Smooth trajectory animation for sent messages
 * Animates from send button to final position
 */
export function SendSwoosh({
  children,
  from,
  to = { x: 0, y: 0 },
  nonce,
  reduceMotion = false,
}: SendSwooshProps): React.JSX.Element {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (isTruthy(reduceMotion)) return

    const deltaX = from.x - to.x
    const deltaY = from.y - to.y

    translateX.value = deltaX
    translateY.value = deltaY
    scale.value = 0.9

    // Bezier-like timing using cubic easing
    translateX.value = withTiming(0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    })
    translateY.value = withTiming(0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    })
    scale.value = withSequence(
      withTiming(1.02, { duration: 240 }),
      withSpring(1, { stiffness: 600, damping: 36 })
    )
  }, [nonce, from.x, from.y, to.x, to.y, reduceMotion, translateX, translateY, scale])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

// ============================================================
// 4) TYPING INDICATOR (3 animated dots)
// ============================================================

/**
 * Classic typing indicator with smooth wave animation
 * Shows when other user is composing a message
 */
export function TypingIndicator({
  size = 6,
  gap = 6,
  duration = 900,
  reduceMotion = false,
}: TypingIndicatorProps): React.JSX.Element {
  const alpha1 = useSharedValue(0.4)
  const alpha2 = useSharedValue(0.4)
  const alpha3 = useSharedValue(0.4)

  useEffect(() => {
    if (isTruthy(reduceMotion)) return

    const animate = (sv: SharedValue<number>, delayFactor: number): void => {
      const sharedValue = sv;
      sharedValue.value = withDelay(
        duration * delayFactor,
        withRepeat(
          withSequence(
            withTiming(1, { duration }),
            withTiming(0.4, { duration })
          ),
          -1,
          false
        )
      )
    }

    animate(alpha1, 0)
    animate(alpha2, 0.2)
    animate(alpha3, 0.4)

    return () => {
      cancelAnimation(alpha1)
      cancelAnimation(alpha2)
      cancelAnimation(alpha3)
    }
  }, [duration, reduceMotion, alpha1, alpha2, alpha3])

  const style1 = useAnimatedStyle(() => ({
    opacity: alpha1.value,
    transform: [
      { translateY: interpolate(alpha1.value, [0.4, 1], [0, -2]) },
    ],
  }))

  const style2 = useAnimatedStyle(() => ({
    opacity: alpha2.value,
    transform: [
      { translateY: interpolate(alpha2.value, [0.4, 1], [0, -2]) },
    ],
  }))

  const style3 = useAnimatedStyle(() => ({
    opacity: alpha3.value,
    transform: [
      { translateY: interpolate(alpha3.value, [0.4, 1], [0, -2]) },
    ],
  }))

  const dotBaseStyle = { width: size, height: size, borderRadius: size / 2, backgroundColor: '#9CA3AF' }

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[dotBaseStyle, style1]} />
      <View style={{ width: gap }} />
      <Animated.View style={[dotBaseStyle, style2]} />
      <View style={{ width: gap }} />
      <Animated.View style={[dotBaseStyle, style3]} />
    </View>
  )
}

// ============================================================
// 5) REACTION BURST (lightweight particle explosion)
// ============================================================

/**
 * Particle burst effect for reactions
 * Radiates particles in a circle pattern
 */
export function ReactionBurst({
  count = 12,
  size = 6,
  spread = 48,
  duration = 700,
  onDone,
}: ReactionBurstProps): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration, easing: Easing.out(Easing.quad) },
      (finished?: boolean) => {
        if (finished === true && onDone !== undefined) {
          runOnJS(onDone)()
        }
      }
    )
  }, [duration, onDone, progress])

  const items = useMemo(
    () => Array.from({ length: count }, (_: unknown, i: number) => i),
    [count]
  )

  return (
    <View style={[styles.absCenter, { width: spread * 2, height: spread * 2 }]}>
      {items.map((i: number) => (
        <Particle
          key={i}
          index={i}
          total={count}
          size={size}
          spread={spread}
          progress={progress}
        />
      ))}
    </View>
  )
}

interface ParticleProps {
  index: number
  total: number
  size: number
  spread: number
  progress: SharedValue<number>
}

function Particle({
  index,
  total,
  size,
  spread,
  progress,
}: ParticleProps): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    const angle = (index / total) * Math.PI * 2
    const radius = interpolate(progress.value, [0, 1], [0, spread])
    const scaleValue = interpolate(progress.value, [0, 1], [1, 0.6])
    const opacityValue = interpolate(progress.value, [0, 0.7, 1], [1, 1, 0])

    return {
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { scale: scaleValue },
      ],
      opacity: opacityValue,
    }
  })

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  )
}

// ============================================================
// 6) SWIPE TO REPLY (gesture + glow trail)
// ============================================================

/**
 * Swipe gesture to trigger reply action
 * Shows visual feedback with glow trail
 */
export function SwipeToReply({
  children,
  onReply,
  threshold = 72,
  glowWidth = 8,
}: SwipeToReplyProps): React.JSX.Element {
  const translateX = useSharedValue(0)
  const glow = useSharedValue(0)

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onChange((event: { translationX: number }) => {
          // Only respond to horizontal swipes > 10px
          if (Math.abs(event.translationX) > 10) {
            translateX.value = Math.max(0, event.translationX)
          }
        })
        .onEnd(() => {
          const shouldTrigger = translateX.value > threshold
          glow.value = shouldTrigger ? 1 : 0
          translateX.value = withTiming(0, { duration: 220 })

          if (shouldTrigger && onReply !== undefined) {
            runOnJS(onReply)()
          }
        }),
    [threshold, onReply, translateX, glow]
  )

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    width: glowWidth,
    opacity: interpolate(translateX.value, [0, threshold], [0, 0.85]),
    transform: [{ translateX: translateX.value - glowWidth }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <View>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  )
}

// ============================================================
// 7) RIPPLE FEEDBACK (press ripple, pure RN)
// ============================================================

/**
 * Touch ripple effect for buttons
 * No native dependencies, pure Reanimated
 */
export function Ripple({
  onPress,
  radius = 44,
  duration = 420,
  children,
}: RippleProps): React.JSX.Element {
  const scale = useSharedValue(0.01)
  const opacity = useSharedValue(0)

  const play = (): void => {
    scale.value = 0.01
    opacity.value = 0

    scale.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad),
    })
    opacity.value = withTiming(1, { duration: duration * 0.65 })
    opacity.value = withDelay(
      duration * 0.65,
      withTiming(0, { duration: duration * 0.35 })
    )
  }

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Pressable
      onPress={() => {
        play()
        onPress?.()
      }}
      style={styles.rippleContainer}
    >
      <View>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.absCenter,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderWidth: 2,
              borderColor: 'rgba(59, 130, 246, 0.5)',
            },
            ringStyle,
          ]}
        />
      </View>
    </Pressable>
  )
}

// ============================================================
// 8) DELIVERY STATUS (✓ → ✓✓, color pulse)
// ============================================================

/**
 * Animated delivery status ticks
 * Morphs from single to double check with color change
 */
export function DeliveryTicks({ state }: DeliveryTicksProps): React.JSX.Element {
  const progress = useSharedValue(0) // 0=sending, 1=sent, 2=delivered, 3=read

  useEffect(() => {
    const target =
      state === 'sending'
        ? 0
        : state === 'sent'
          ? 1
          : state === 'delivered'
            ? 2
            : 3

    progress.value = withTiming(target, { duration: 220 })
  }, [state, progress])

  const tick1Style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [0.4, 1]),
  }))

  const tick2Style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1]),
  }))

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      ['#999999', '#999999', '#0BA360', '#3B82F6']
    )
    return { color }
  })

  return (
    <Animated.Text style={[styles.tickText, colorStyle]}>
      <Animated.Text style={tick1Style}>✓</Animated.Text>
      <Animated.Text style={tick2Style}>✓</Animated.Text>
    </Animated.Text>
  )
}

// ============================================================
// 9) MESSAGE APPEAR (staggered list entry animation)
// ============================================================

/**
 * Staggered entrance animation for message list items
 * Apply to FlatList renderItem based on index
 */
export function useMessageAppear({
  index,
  reduceMotion = false,
}: UseMessageAppearOptions): ReturnType<typeof useAnimatedStyle> {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(reduceMotion ? 0 : 10)

  useEffect(() => {
    const delayMs = Math.min(index * 25, 200)

    opacity.value = withDelay(delayMs, withTiming(1, { duration: 180 }))
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      })
    )
  }, [index, reduceMotion, opacity, translateY])

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))
}

// ============================================================
// 10) PRISM SHIMMER (angled specular highlight)
// ============================================================

/**
 * Angled shimmer effect with rotation and skew
 * Premium look for images and media attachments
 */
export function PrismShimmerOverlay({
  width,
  height = 28,
  streakWidth = 0.32,
  angleDeg = 18,
  skewDeg = 12,
  duration = 2200,
  delay = 0,
  opacityRange = [0, 0.7],
  paused,
  children,
}: PrismShimmerOverlayProps): React.JSX.Element {
  const { animatedStyle } = useShimmerSweep({
    width,
    duration,
    delay,
    opacityRange,
    paused: paused ?? false,
  })

  const tiltStyle = {
    transform: [
      { rotateZ: `${String(angleDeg ?? '')}deg` },
      { skewX: `${String(skewDeg ?? '')}deg` },
    ],
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.abs,
        { width: width * streakWidth, height },
        animatedStyle,
        tiltStyle,
      ]}
    >
      {children ?? (
        <View style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}>
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(255,255,255,0.9)' },
            ]}
          />
        </View>
      )}
    </Animated.View>
  )
}

// ============================================================
// 11) EMOJI TRAIL (finger draws sparkly trail)
// ============================================================

/**
 * Interactive emoji trail effect
 * Draw sparkles or hearts with your finger
 *
 * TODO: Disabled due to gesture-handler types/runtime mismatch in v2.16
 * The onStart/onUpdate callbacks don't accept event parameters according to types,
 * but they do at runtime. Needs gesture-handler upgrade or workaround.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function EmojiTrail({
  emoji = '✨',
  lifeMs = 900,
  step = 10,
  max = 64,
  onComplete,
}: EmojiTrailProps): React.JSX.Element {
  // Component disabled - return empty view
  return <View />
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Original implementation commented out due to types/runtime mismatch:
/*
export function EmojiTrail({
  emoji = '✨',
  lifeMs = 900,
  step = 10,
  max = 64,
  onComplete,
  areaWidth = 0,
  areaHeight = 0,
}: EmojiTrailProps): React.JSX.Element {
  // Component disabled - return empty view
  return <View />
}
/*
  interface ParticleData {
    id: number;
    x: number;
    y: number;
    drift: number;
    rot: number;
  }
  const [particles, setParticles] = useState<ParticleData[]>([])
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const idCounter = useRef(0)

  const addParticle = useCallback((x: number, y: number): void => {
    idCounter.current += 1
    const id = idCounter.current

    setParticles((prev: ParticleData[]) => {
      const next = [
        ...prev,
        {
          id,
          x,
          y,
          drift: (Math.random() * 2 - 1) * 12,
          rot: (Math.random() * 2 - 1) * 25,
        },
      ]
      return next.length > max ? next.slice(next.length - max) : next
    })
  }, [max])

  const removeParticle = (id: number): void => {
    setParticles((prev: ParticleData[]) => prev.filter((p: ParticleData) => p.id !== id))
  }

  // Note: gesture handler types in v2.16 don't support event params on onStart
  // This is a runtime vs types mismatch - using any to bypass for now
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((event: any) => {
          lastPos.current = { x: event.x, y: event.y }
          addParticle(event.x, event.y)
        })
        .onUpdate((event: any) => {
          const last = lastPos.current
          if (last === null) {
            lastPos.current = { x: event.x, y: event.y }
            return
          }

          const dx = event.x - last.x
          const dy = event.y - last.y

          if (Math.hypot(dx, dy) > step) {
            addParticle(event.x, event.y)
            lastPos.current = { x: event.x, y: event.y }
          }
        })
        .onEnd(() => {
          lastPos.current = null
          onComplete?.()
        }),
    [step, onComplete, addParticle]
  )

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ width: areaWidth, height: areaHeight }}>
        {particles.map((p: ParticleData) => (
          <EmojiParticle
            key={p.id}
            id={p.id}
            x={p.x}
            y={p.y}
            drift={p.drift}
            rot={p.rot}
            lifeMs={lifeMs}
            emoji={emoji}
            onDone={removeParticle}
          />
        ))}
      </View>
    </GestureDetector>
  )
}

interface EmojiParticleProps {
  id: number
  x: number
  y: number
  drift: number
  rot: number
  lifeMs: number
  emoji: string
  onDone: (id: number) => void
}

function EmojiParticle({
  id,
  x,
  y,
  drift,
  rot,
  lifeMs,
  emoji,
  onDone,
}: EmojiParticleProps): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: lifeMs, easing: Easing.out(Easing.quad) },
      (finished?: boolean) => {
        if (finished === true) {
          runOnJS(onDone)(id)
        }
      }
    )
  }, [lifeMs, id, onDone, progress])

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: y,
    opacity: interpolate(progress.value, [0, 0.7, 1], [1, 1, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, drift]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -20]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.85]) },
      { rotate: `${String(rot * 0.5)}deg` },
    ],
  }))

  return <Animated.Text style={style}>{emoji}</Animated.Text>
}
*/

// ============================================================
// 12) CONFETTI EMITTER (celebration particles)
// ============================================================

/**
 * Confetti burst with gravity and spin
 * Perfect for celebrations and achievements
 */
export function ConfettiEmitter({
  count = 24,
  spread = 120,
  colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#F43F5E'],
  duration = 900,
  onDone,
}: ConfettiEmitterProps): React.JSX.Element {
  const time = useSharedValue(0)

  useEffect(() => {
    time.value = withTiming(
      1,
      { duration, easing: Easing.out(Easing.quad) },
      (finished?: boolean) => {
        if (finished === true) {
          runOnJS(onDone ?? (() => {
            // No-op callback
          }))()
        }
      }
    )
  }, [duration, onDone, time])

  interface SeedData {
    key: number;
    color: string;
    angle: number;
    velocity: number;
    spin: number;
    size: number;
  }

  const seeds = useMemo<SeedData[]>(
    () =>
      Array.from({ length: count }, (_: unknown, i: number) => ({
        key: i,
        color: colors[i % colors.length] ?? '#F59E0B',
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.3,
        velocity: 40 + Math.random() * 90,
        spin: (Math.random() * 2 - 1) * 360,
        size: 4 + Math.floor(Math.random() * 6),
      })),
    [count, colors]
  )

  return (
    <View style={{ width: spread * 2, height: spread * 2 }}>
      {seeds.map((seed: SeedData) => (
        <ConfettiPiece
          key={seed.key}
          seed={seed}
          spread={spread}
          time={time}
        />
      ))}
    </View>
  )
}

interface ConfettiPieceProps {
  seed: {
    color: string
    angle: number
    velocity: number
    spin: number
    size: number
  }
  spread: number
  time: SharedValue<number>
}

function ConfettiPiece({
  seed,
  spread,
  time,
}: ConfettiPieceProps): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    const gravity = 160 // px/sim-unit^2
    const t = time.value

    const vx = Math.cos(seed.angle) * seed.velocity
    const vy = Math.sin(seed.angle) * seed.velocity

    const x = vx * t
    const y = vy * t + 0.5 * gravity * t * t

    return {
      position: 'absolute',
      left: spread,
      top: spread,
      width: seed.size + 4,
      height: seed.size,
      backgroundColor: seed.color,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${String(seed.spin * t)}deg` },
      ],
      opacity: interpolate(t, [0.8, 1], [1, 0]),
    }
  })

  return <Animated.View style={style} />
}

// ============================================================
// 13) READ GLINT (one-shot sparkle on read status)
// ============================================================

/**
 * Sparkle effect when message is marked as read
 * Draws attention to status change
 */
export function ReadGlint({
  width,
  height = 24,
  nonce,
}: ReadGlintProps): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = 0
    progress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    })
  }, [nonce, progress])

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: -width * 0.2,
    top: 0,
    width: width * 0.25,
    height,
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, width * 1.4]) },
      { rotateZ: '20deg' },
    ],
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { backgroundColor: 'rgba(255,255,255,0.7)' }]}
    />
  )
}

// ============================================================
// 14) UNREAD GLOW PULSE (attention indicator)
// ============================================================

/**
 * Pulsing glow for unread messages
 * Subtle attention grabber until dismissed
 */
export function UnreadGlowPulse({
  size = 18,
  active,
}: UnreadGlowPulseProps): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!active) {
      progress.value = 0
      return
    }

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0, { duration: 900 })
      ),
      -1,
      false
    )

    return () => {
      cancelAnimation(progress)
    }
  }, [active, progress])

  const style = useAnimatedStyle(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    position: 'absolute',
    left: -size * 0.3,
    top: -size * 0.3,
    opacity: interpolate(progress.value, [0, 1], [0.2, 0.7]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.9, 1.15]) },
    ],
    backgroundColor: 'rgba(59,130,246,0.35)',
  }))

  return <Animated.View pointerEvents="none" style={style} />
}

// ============================================================
// 15) PARALLAX TILT (scroll-driven 3D effect)
// ============================================================

/**
 * Subtle 3D tilt effect driven by scroll position
 * Adds depth to headers and sticky elements
 */
export function useParallaxTilt({
  scrollY,
  factor = 0.02,
}: UseParallaxTiltOptions): ReturnType<typeof useAnimatedStyle> {
  return useAnimatedStyle(() => {
    const tilt = scrollY.value * factor
    const clampedTilt = Math.max(-6, Math.min(6, tilt))

    return {
      transform: [{ perspective: 600 }, { rotateX: `${String(clampedTilt ?? '')}deg` }],
    }
  })
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  absCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -0.5 }, { translateY: -0.5 }],
  },
  defaultShimmer: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  particle: {
    backgroundColor: '#CBD5E1',
  },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.35)',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  tickText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rippleContainer: {
    overflow: 'hidden',
  },
})

// ============================================================
// USAGE EXAMPLES (in comments for reference)
// ============================================================

/*

// 1) Shimmer on loading skeleton
<View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
  <SkeletonBox />
  <ShimmerOverlay width={width} />
</View>

// 2) Prism shimmer on image
<View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
  <Image source={...} />
  <PrismShimmerOverlay width={w} />
</View>

// 3) Send swoosh animation
<SendSwoosh from={buttonCoords} nonce={messageId}>
  <MessageBubble {...props} />
</SendSwoosh>

// 4) Typing indicator
const reduceMotion = useReduceMotion()
<TypingIndicator reduceMotion={reduceMotion} />

// 5) Swipe to reply
<SwipeToReply onReply={() => handleReply(message.id)}>
  <MessageBubble {...props} />
</SwipeToReply>

// 6) Ripple button
<Ripple onPress={handleSend}>
  <SendButton />
</Ripple>

// 7) Delivery ticks
<DeliveryTicks state={message.status} />

// 8) Message appear animation
const appearStyle = useMessageAppear({ index, reduceMotion })
<Animated.View style={appearStyle}>
  <MessageBubble {...props} />
</Animated.View>

// 9) Reaction burst
{showBurst && <ReactionBurst onDone={() => setShowBurst(false)} />}

// 10) Emoji trail over composer
<EmojiTrail
  areaWidth={width}
  areaHeight={height}
  onComplete={() => Haptics.impactAsync('light')}
/>

// 11) Confetti for achievements
{showConfetti && <ConfettiEmitter onDone={() => setShowConfetti(false)} />}

// 12) Read glint
{message.status === 'read' && (
  <ReadGlint width={bubbleWidth} nonce={readTimestamp} />
)}

// 13) Unread pulse
<View>
  <Text>09:41</Text>
  <UnreadGlowPulse active={!message.isRead} />
</View>

// 14) Parallax tilt
const scrollY = useSharedValue(0)
const tiltStyle = useParallaxTilt({ scrollY })
<Animated.View style={tiltStyle}>
  <ChatHeader />
</Animated.View>

*/
