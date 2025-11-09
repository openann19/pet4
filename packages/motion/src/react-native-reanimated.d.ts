declare module 'react-native-reanimated' {
  import type { ComponentType } from 'react';

  // Minimal ambient declarations to satisfy tsc in non-native environments.
  interface AnimatedComponents {
    readonly SharedValue: any;
    readonly View: ComponentType<any>;
    readonly Text: ComponentType<any>;
    readonly ScrollView: ComponentType<any>;
  }
  const Animated: AnimatedComponents;
  export default Animated;

  export function useSharedValue<T>(value: T): SharedValue<T>;
  export function useDerivedValue<T>(factory: () => T): SharedValue<T>;
  export function useAnimatedStyle<T extends object>(factory: () => T): AnimatedStyle<T>;
  export function useAnimatedProps<T extends object>(factory: () => T): any;
  export function useAnimatedReaction(...args: any[]): void;
  export function useAnimatedGestureHandler(...args: any[]): any;
  export function useAnimatedRef<T = unknown>(): any;

  export function withSpring(toValue: number, config?: any, callback?: (finished?: boolean) => void): any;
  export function withTiming(toValue: number, config?: any, callback?: (finished?: boolean) => void): any;
  export function withRepeat(...args: any[]): any;
  export function withSequence(...args: any[]): any;
  export function withDelay(...args: any[]): any;
  export function withDecay(...args: any[]): any;
  export function cancelAnimation(...args: any[]): void;
  export function runOnJS<T extends (...args: never[]) => unknown>(fn: T): T;
  export function runOnUI(...args: any[]): any;

  export const Easing: {
    readonly linear: (value: number) => number;
    readonly ease: (value: number) => number;
    readonly quad: (value: number) => number;
    readonly cubic: (value: number) => number;
    readonly sin: (value: number) => number;
    readonly circle: (value: number) => number;
    readonly exp: (value: number) => number;
    readonly elastic: (bounciness?: number) => (value: number) => number;
    readonly back: (overshoot?: number) => (value: number) => number;
    readonly bounce: (value: number) => number;
    readonly bezier: (x1: number, y1: number, x2: number, y2: number) => (value: number) => number;
    readonly poly: (exponent: number) => (value: number) => number;
    readonly in: (easing: (value: number) => number) => (value: number) => number;
    readonly out: (easing: (value: number) => number) => (value: number) => number;
    readonly inOut: (easing: (value: number) => number) => (value: number) => number;
  };
  export function interpolate(...args: any[]): any;
  export const Extrapolation: any;

  export type SharedValue<T> = { value: T };
  export type AnimatedStyle<T> = any;
  export type AnimatedProps<T> = any;
}

declare module 'react-native' {
  import type { CSSProperties, ComponentPropsWithoutRef } from 'react';

  export interface LayoutRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface LayoutChangeEvent {
    nativeEvent: {
      layout: LayoutRectangle;
    };
  }

  // Style types
  export type ViewStyle = CSSProperties & Record<string, unknown>;
  export type TextStyle = CSSProperties & Record<string, unknown>;
  export type ImageStyle = CSSProperties & Record<string, unknown>;

  // Component props
  export interface ViewProps extends ComponentPropsWithoutRef<'div'> {
    style?: ViewStyle | ViewStyle[];
  }

  export interface TextProps extends ComponentPropsWithoutRef<'span'> {
    style?: TextStyle | TextStyle[];
  }

  // Platform API
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    select: <T>(specifics: { ios?: T; android?: T; native?: T; default?: T; web?: T }) => T | undefined;
  };
}
