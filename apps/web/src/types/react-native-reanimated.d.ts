declare module 'react-native-reanimated' {
  import type { MotionStyle, MotionValue } from 'framer-motion';

  export type SharedValue<T> = MotionValue<T> & { value: T };

  export type AnimatedStyle<T extends object = Record<string, unknown>> = MotionStyle & T;

  export function useSharedValue<T>(initialValue: T): SharedValue<T>;

  export function useAnimatedStyle<T extends object = Record<string, unknown>>(
    factory: () => AnimatedStyle<T>
  ): AnimatedStyle<T>;

  export function useAnimatedProps<T extends object = Record<string, unknown>>(
    updater: () => T,
    deps?: unknown[]
  ): T;

  export function useDerivedValue<T>(processor: () => T, deps?: unknown[]): SharedValue<T>;

  export function useAnimatedReaction<T>(
    prepare: () => T,
    react: (prepareResult: T, previousPrepareResult: T | null) => void,
    prepareDeps?: unknown[]
  ): void;

  export function useAnimatedGestureHandler<T extends Record<string, unknown>>(handlers: T): T;

  export function useAnimatedRef<T>(): React.RefObject<T>;

  export interface SpringConfig {
    damping?: number;
    stiffness?: number;
    mass?: number;
    overshootClamping?: boolean;
    restDisplacementThreshold?: number;
    restSpeedThreshold?: number;
  }

  export interface TimingConfig {
    duration?: number;
    easing?: (value: number) => number;
  }

  export type WithSpringConfig = SpringConfig;

  export type WithTimingConfig = TimingConfig;

  export interface DecayConfig {
    deceleration?: number;
    velocity?: number;
    clamp?: [number, number];
  }

  export function withSpring<T>(
    toValue: T,
    config?: SpringConfig,
    callback?: (finished?: boolean) => void
  ): T;

  export function withTiming<T>(
    toValue: T,
    config?: TimingConfig,
    callback?: (finished?: boolean) => void
  ): T;

  export function withRepeat<T>(animation: T, repeatCount?: number, reverse?: boolean): T;

  export function withSequence<T>(...animations: T[]): T;

  export function withDelay<T>(timeMs: number, animation: T): T;

  export function withDecay(config: DecayConfig): number;

  export function interpolate(
    value: number,
    inputRange: number[],
    outputRange: number[],
    extrapolation?: ExtrapolationMode | ExtrapolationConfig
  ): number;

  export function cancelAnimation<T>(sharedValue: SharedValue<T>): void;

  export function runOnJS<Args extends unknown[], Return>(
    fn: (...args: Args) => Return
  ): (...args: Args) => void;

  export function runOnUI<Args extends unknown[], Return>(
    fn: (...args: Args) => Return
  ): (...args: Args) => Return;

  export type ExtrapolationMode = 'identity' | 'clamp' | 'extend';

  export const Extrapolation: {
    readonly IDENTITY: ExtrapolationMode;
    readonly CLAMP: ExtrapolationMode;
    readonly EXTEND: ExtrapolationMode;
  };

  export interface ExtrapolationConfig {
    extrapolateLeft?: ExtrapolationMode;
    extrapolateRight?: ExtrapolationMode;
  }

  export const Easing: {
    readonly linear: (value: number) => number;
    readonly ease: (value: number) => number;
    readonly quad: (value: number) => number;
    readonly cubic: (value: number) => number;
    readonly sin: (value: number) => number;
    readonly circle: (value: number) => number;
    readonly exp: (value: number) => number;
    readonly elastic: (bounciness?: number) => (value: number) => number;
    readonly back: (overshootClamping?: number) => (value: number) => number;
    readonly bounce: (value: number) => number;
    readonly bezier: (x1: number, y1: number, x2: number, y2: number) => (value: number) => number;
    readonly poly: (exponent: number) => (value: number) => number;
    readonly in: (easing: (value: number) => number) => (value: number) => number;
    readonly out: (easing: (value: number) => number) => (value: number) => number;
    readonly inOut: (easing: (value: number) => number) => (value: number) => number;
  };

  export type AnimatedViewProps = Record<string, unknown> & {
    style?: AnimatedStyle<Record<string, unknown>>;
    children?: unknown;
  };

  export type AnimatedTextProps = Record<string, unknown> & {
    style?: AnimatedStyle<Record<string, unknown>>;
    children?: unknown;
  };

  export type AnimatedProps<T extends Record<string, unknown> = Record<string, unknown>> = T;

  export interface FadeInProps {
    duration?: number;
    delay?: number;
  }

  export interface FadeOutProps {
    duration?: number;
    delay?: number;
  }

  export const FadeIn: React.ComponentType<FadeInProps & AnimatedViewProps>;
  export const FadeOut: React.ComponentType<FadeOutProps & AnimatedViewProps>;

  export namespace Animated {
    export type SharedValue<T> = import('react-native-reanimated').SharedValue<T>;
    export const View: React.ComponentType<AnimatedViewProps>;
    export const Text: React.ComponentType<AnimatedTextProps>;
  }

  declare const Animated: {
    readonly SharedValue: typeof SharedValue;
    readonly View: typeof Animated.View;
    readonly Text: typeof Animated.Text;
  };

  export default Animated;
}
