const createSharedValue = <T,>(initial: T) => {
  let current = initial;
  return {
    get value() {
      return current;
    },
    set value(next: T) {
      current = next;
    },
  };
};

export const Animated = {
  View: 'div',
  Text: 'span',
  Image: 'img',
};

export const useSharedValue = <T,>(initial: T) => {
  return createSharedValue(initial);
};

export const useDerivedValue = <T,>(_factory: () => T) => {
  const shared = useSharedValue<T>(_factory());
  return shared;
};

export const useAnimatedStyle = <T extends Record<string, unknown>>(
  factory: () => T
): T => {
  try {
    return factory();
  } catch {
    return {} as T;
  }
};

export const withSpring = <T,>(value: T) => value;
export const withTiming = <T,>(value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const withSequence = <T,>(...values: T[]) => values[values.length - 1];
export const withDelay = <T,>(_delay: number, value: T) => value;
export const cancelAnimation = (): void => {
  // no-op for web
};
export const runOnJS = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn;
export const runOnUI = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn;

const Reanimated = {
  Animated,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  runOnJS,
  runOnUI,
};

export default Reanimated;
