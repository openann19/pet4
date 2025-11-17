declare module 'react-native-reanimated' {
  import type { ComponentType, ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react'

  // Minimal ambient declarations to satisfy tsc in non-native environments.
  interface AnimatedComponents {
    readonly SharedValue: <T>(value: T) => SharedValue<T>
    readonly View: ForwardRefExoticComponent<import('react-native').ViewProps>
    readonly Text: ForwardRefExoticComponent<import('react-native').TextProps>
    readonly ScrollView: ForwardRefExoticComponent<import('react-native').ViewProps>
  }
  const Animated: AnimatedComponents
  export default Animated

  export interface SpringConfig {
    damping?: number
    mass?: number
    stiffness?: number
    overshootClamping?: boolean
    restDisplacementThreshold?: number
    restSpeedThreshold?: number
    velocity?: number
  }

  export interface TimingConfig {
    duration?: number
    easing?: (value: number) => number
  }

  export interface RepeatConfig {
    numberOfReps?: number
    reverse?: boolean
  }

  export interface DecayConfig {
    deceleration?: number
    velocity?: number
    clamp?: [number, number]
  }

  export function useSharedValue<T>(value: T): SharedValue<T>
  export function useDerivedValue<T>(factory: () => T): SharedValue<T>
  export function useAnimatedStyle<T extends object>(factory: () => T): AnimatedStyle<T>                                                                        
  export function useAnimatedProps<T extends object>(factory: () => T): AnimatedProps<T>
  export function useAnimatedReaction<T>(
    dependencies: () => T,
    reaction: (value: T, previous: T | undefined) => void,
    initialValue?: T
  ): void
  export function useAnimatedGestureHandler<
    T extends Record<string, unknown>
  >(
    handlers: T
  ): T
  export function useAnimatedRef<T = unknown>(): { current: T | null }

  export function withSpring(
    toValue: number,
    config?: SpringConfig,
    callback?: (finished?: boolean) => void
  ): number
  export function withTiming(
    toValue: number,
    config?: TimingConfig,
    callback?: (finished?: boolean) => void
  ): number
  export function withRepeat(
    animation: number,
    numberOfReps?: number,
    reverse?: boolean
  ): number
  export function withSequence(...animations: number[]): number
  export function withDelay(delayMs: number, animation: number): number
  export function withDecay(
    config: DecayConfig,
    callback?: (finished?: boolean) => void
  ): number
  export function cancelAnimation(sharedValue: SharedValue<number>): void
  export function runOnJS<T extends (...args: never[]) => unknown>(fn: T): T
  export function runOnUI<T extends (...args: never[]) => unknown>(fn: T): T

  export const Easing: {
    readonly linear: (value: number) => number
    readonly ease: (value: number) => number
    readonly quad: (value: number) => number
    readonly cubic: (value: number) => number
    readonly sin: (value: number) => number
    readonly circle: (value: number) => number
    readonly exp: (value: number) => number
    readonly elastic: (bounciness?: number) => (value: number) => number
    readonly back: (overshoot?: number) => (value: number) => number
    readonly bounce: (value: number) => number
    readonly bezier: (x1: number, y1: number, x2: number, y2: number) => (value: number) => number                                                              
    readonly poly: (exponent: number) => (value: number) => number
    readonly in: (easing: (value: number) => number) => (value: number) => number                                                                               
    readonly out: (easing: (value: number) => number) => (value: number) => number                                                                              
    readonly inOut: (easing: (value: number) => number) => (value: number) => number                                                                            
  }
  export function interpolate(
    value: number,
    inputRange: number[],
    outputRange: number[],
    extrapolate?: 'extend' | 'clamp' | 'identity'
  ): number
  export const Extrapolation: {
    readonly EXTEND: 'extend'
    readonly CLAMP: 'clamp'
    readonly IDENTITY: 'identity'
  }

  export type SharedValue<T> = { value: T }
  export type AnimatedStyle<T> = T & Record<string, unknown>
  export type AnimatedProps<T> = T & Record<string, unknown>
}

declare module 'react-native' {
  import type { CSSProperties } from 'react'

  export interface LayoutRectangle {
    x: number
    y: number
    width: number
    height: number
  }

  export interface LayoutChangeEvent {
    nativeEvent: {
      layout: LayoutRectangle
    }
  }

  // Style types
  export type ViewStyle = CSSProperties & Record<string, unknown>
  export type TextStyle = CSSProperties & Record<string, unknown>
  export type ImageStyle = CSSProperties & Record<string, unknown>

  // Component props
  export interface ViewProps {
    style?: ViewStyle | AnimatedStyle<ViewStyle> | Array<ViewStyle | AnimatedStyle<ViewStyle>>
    [key: string]: unknown
  }

  export interface TextProps {
    style?: TextStyle | AnimatedStyle<TextStyle> | Array<TextStyle | AnimatedStyle<TextStyle>>
    [key: string]: unknown
  }

  // Platform API
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos'
    select: <T>(specifics: {
      ios?: T
      android?: T
      native?: T
      default?: T
      web?: T
    }) => T | undefined
  }
}
