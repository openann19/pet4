declare module 'react-native-reanimated' {
  export type SharedValue<T> = {
    value: T
  }

  export interface SpringAnimationConfig {
    damping?: number
    stiffness?: number
    mass?: number
    velocity?: number
  }

  export interface TimingAnimationConfig {
    duration?: number
    easing?: (value: number) => number
  }

  export interface AnimationHelpers {
    linear(value: number): number
    inOut(easing: (value: number) => number): (value: number) => number
    ease(value: number): number
  }

  export const Easing: AnimationHelpers

  export function useSharedValue<T>(initialValue: T): SharedValue<T>

  export function useAnimatedStyle<Style extends Record<string, unknown>>(
    factory: () => Style,
    dependencies?: ReadonlyArray<unknown>
  ): Style

  export function interpolateColor(
    value: number,
    inputRange: readonly number[],
    outputRange: readonly (string | number)[],
  ): string

  export function withSpring(
    value: number,
    config?: SpringAnimationConfig
  ): number

  export function withTiming(
    value: number,
    config?: TimingAnimationConfig
  ): number

  export function withRepeat<T>(animation: T, iterations?: number, reverse?: boolean): T

  export function withSequence<T>(...animations: readonly T[]): T

  export function withDelay<T>(delay: number, animation: T): T

  export function cancelAnimation<T>(sharedValue: SharedValue<T>): void
}
