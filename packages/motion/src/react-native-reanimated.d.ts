declare module 'react-native-reanimated' {
  // Minimal ambient declarations to satisfy tsc in non-native environments.
  const Animated: any;
  export default Animated;

  export function useSharedValue<T>(value: T): SharedValue<T>;
  export function useDerivedValue<T>(factory: () => T): SharedValue<T>;
  export function useAnimatedStyle<T extends object>(factory: () => T): AnimatedStyle<T>;
  export function useAnimatedProps<T extends object>(factory: () => T): any;
  export function useAnimatedReaction(...args: any[]): void;
  export function useAnimatedGestureHandler(...args: any[]): any;
  export function useAnimatedRef<T = any>(): any;

  export function withSpring(...args: any[]): any;
  export function withTiming(...args: any[]): any;
  export function withRepeat(...args: any[]): any;
  export function withSequence(...args: any[]): any;
  export function withDelay(...args: any[]): any;
  export function withDecay(...args: any[]): any;
  export function cancelAnimation(...args: any[]): void;
  export function runOnJS<T extends (...args: any[]) => any>(fn: T): T;
  export function runOnUI(...args: any[]): any;

  export const Easing: any;
  export function interpolate(...args: any[]): any;
  export const Extrapolation: any;

  export type SharedValue<T> = { value: T };
  export type AnimatedStyle<T> = any;
  export type AnimatedProps<T> = any;
}
