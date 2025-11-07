/**
 * Web polyfill for react-native-reanimated
 * Provides web-compatible implementations of reanimated APIs using standard React hooks and CSS
 */

import type { CSSProperties } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { isTruthy, isDefined } from '@/core/guards';

// Type definitions
export interface SharedValue<T = number> {
  value: T;
}

export type AnimatedStyle<T = CSSProperties> = T;

export interface WithSpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  velocity?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface WithTimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}

export interface WithDecayConfig {
  velocity?: number;
  deceleration?: number;
  clamp?: [number, number];
}

// Extrapolation enum
export enum Extrapolation {
  CLAMP = 'clamp',
  EXTEND = 'extend',
  IDENTITY = 'identity',
}

// Easing functions
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => {
    const t2 = t * t;
    return t2 * (3 - 2 * t);
  },
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: (_x1: number, y1: number, _x2: number, y2: number) => {
    return (t: number) => {
      // Simplified cubic bezier
      const t2 = t * t;
      const t3 = t2 * t;
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t2 * y2 + t3;
    };
  },
  inOut: (easing: (t: number) => number) => (t: number) => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  },
  out: (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
  in: (easing: (t: number) => number) => easing,
  elastic: (amplitude: number = 1) => {
    return (t: number) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      const s = p / 4;
      const result = Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) * amplitude + 1;
      return Math.max(0, Math.min(1, result));
    };
  },
};

// Shared value implementation
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  const ref = useRef<SharedValue<T>>({
    value: initialValue,
  });
  
  return ref.current;
}

// Animation functions
export function withSpring(toValue: number, _config?: WithSpringConfig): number {
  // In web polyfill, we return the target value
  // The actual animation is handled by CSS transitions
  return toValue;
}

export function withTiming(toValue: number, _config?: WithTimingConfig): number {                                                                               
  // In web polyfill, we return the target value
  // The actual animation is handled by CSS transitions
  return toValue;
}

export function withDecay(config: WithDecayConfig): number {
  // In web polyfill, we return the current value with decay applied
  // The actual animation is handled by CSS transitions
  const { velocity = 0, deceleration = 0.998, clamp } = config;
  
  // Calculate final position based on velocity and deceleration
  // Simplified decay: v = v0 * (deceleration ^ t)
  // For web, we'll use a simple approximation
  let finalValue = velocity * (1 - deceleration);
  
  // Apply clamp if provided
  if (isTruthy(clamp)) {
    const [min, max] = clamp;
    finalValue = Math.max(min, Math.min(max, finalValue));
  }
  
  return finalValue;
}

export function withDelay(_delayMs: number, animation: number): number {
  // Return the animation value, delay will be handled by CSS transition-delay
  return animation;
}

export function withSequence(...animations: number[]): number {
  // Return the last animation value
  return animations[animations.length - 1] ?? 0;
}

export function withRepeat(animation: number, _numberOfReps?: number, _reverse?: boolean): number {
  // Return the animation value
  return animation;
}

// Interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: 'clamp' | 'extend' | 'identity' | Extrapolation
): number {
  const extrapolateType = typeof extrapolate === 'string' ? extrapolate : extrapolate ?? 'clamp';
  
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }
  
  if (inputRange.length === 0 || outputRange.length === 0) {
    return 0;
  }
  
  // Find the right interval
  let i = 0;
  for (; i < inputRange.length - 1; i++) {
    const nextInput = inputRange[i + 1];
    if (nextInput !== undefined && value <= nextInput) {
      break;
    }
  }
  
  const inputMin = inputRange[i];
  const inputMax = inputRange[i + 1];
  const outputMin = outputRange[i];
  const outputMax = outputRange[i + 1];
  
  if (inputMin === undefined || outputMin === undefined) {
    return 0;
  }
  
  if (value < inputMin) {
    if (extrapolateType === 'clamp') {
      return outputMin;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }
  
  if (inputMax !== undefined && value > inputMax) {
    if (extrapolateType === 'clamp' && outputMax !== undefined) {
      return outputMax;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }
  
  const effectiveInputMax = inputMax ?? inputMin;
  const effectiveOutputMax = outputMax ?? outputMin;
  const progress = (value - inputMin) / (effectiveInputMax - inputMin);
  return outputMin + progress * (effectiveOutputMax - outputMin);
}

export function interpolateColor(
  value: number,
  _inputRange: number[],
  outputRange: string[]
): string {
  // Simplified color interpolation
  const index = Math.min(Math.floor(value), outputRange.length - 1);
  const color = outputRange[Math.max(0, index)];
  if (color !== undefined) {
    return color;
  }
  const firstColor = outputRange[0];
  return firstColor !== undefined ? firstColor : '#000';
}

// Animated style hook
export function useAnimatedStyle<T extends CSSProperties>(
  updater: () => T,
  dependencies?: unknown[]
): AnimatedStyle<T> {
  return useMemo(() => {
    const style = updater();
    
    // Convert transform array to CSS transform string
    if (style.transform && Array.isArray(style.transform)) {
      const transforms = style.transform as Array<Record<string, number | string>>;
      const transformString = transforms
        .map((t) => {
          const key = Object.keys(t)[0];
          if (key === undefined) {
            return '';
          }
          const value = t[key];
          
          if (key === 'translateX' || key === 'translateY') {
            return `${String(key ?? '')}(${String(value ?? '')}px)`;
          } else if (key === 'scale' || key === 'scaleX' || key === 'scaleY') {
            return `${String(key ?? '')}(${String(value ?? '')})`;
          } else if (key === 'rotate' || key === 'rotateX' || key === 'rotateY' || key === 'rotateZ') {
            return `${String(key ?? '')}(${String(value ?? '')}deg)`;
          }
          return `${String(key ?? '')}(${String(value ?? '')})`;
        })
        .join(' ');
      
      return {
        ...style,
        transform: transformString,
        transition: 'all 300ms ease-in-out',
      } as T;
    }
    
    return {
      ...style,
      transition: 'all 300ms ease-in-out',
    } as T;
  }, dependencies ?? []);
}

// Animated props hook
export function useAnimatedProps<T>(
  updater: () => T,
  dependencies?: unknown[]
): T {
  return useMemo(() => updater(), dependencies ?? []);
}

// Gesture handlers (no-op for web)
export function useAnimatedGestureHandler<T = unknown>(
  handlers: T
): T {
  return handlers;
}

// Scroll handlers (no-op for web)
export function useAnimatedScrollHandler<T = unknown>(
  handler: T
): T {
  return handler;
}

// Run on JS thread
export function runOnJS<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

// Run on UI thread (no-op for web)
export function runOnUI<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

// Worklets (no-op for web)
export function useWorkletCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps?: unknown[]
): T {
  return useCallback(fn, deps ?? []);
}

// Derived value
export function useDerivedValue<T>(
  updater: () => T,
  dependencies?: unknown[]
): SharedValue<T> {
  const value = useMemo(() => updater(), dependencies ?? []);
  return useSharedValue(value);
}

// Animation cancellation
export function cancelAnimation(_sharedValue: SharedValue<unknown>): void {
  // No-op for web polyfill
}

// Clock (no-op for web, not needed)
export function useClock(): SharedValue {
  return useSharedValue(Date.now());
}


// Default export for Animated namespace
const Animated = {
  View: 'div',
  Text: 'span',
  ScrollView: 'div',
  Image: 'img',
  FlatList: 'div',
};

export default Animated;
