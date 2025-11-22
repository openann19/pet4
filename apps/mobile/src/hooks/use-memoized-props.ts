import { useRef, useEffect } from 'react';

/**
 * Hook to memoize props with custom comparison function
 * Useful for React.memo components that need complex prop comparisons
 *
 * @example
 * ```tsx
 * const memoizedProps = useMemoizedProps(props, (prev, next) => {
 *   return prev.id === next.id && prev.count === next.count;
 * });
 * ```
 */
export function useMemoizedProps<T extends Record<string, unknown>>(
  props: T,
  compareFn?: (prev: T, next: T) => boolean
): T {
  const ref = useRef<T>(props);
  const prevPropsRef = useRef<T>(props);

  useEffect(() => {
    prevPropsRef.current = ref.current;
  });

  // Default shallow comparison
  const defaultCompare = (prev: T, next: T): boolean => {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (prev[key] !== next[key]) {
        return false;
      }
    }

    return true;
  };

  const compare = compareFn ?? defaultCompare;

  if (!compare(prevPropsRef.current, props)) {
    ref.current = props;
  }

  return ref.current;
}

/**
 * Shallow comparison function for props
 */
export function shallowEqual<T extends Record<string, unknown>>(
  prev: T,
  next: T
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison function for props (use with caution - can be expensive)
 */
export function deepEqual<T>(prev: T, next: T): boolean {
  if (prev === next) {
    return true;
  }

  if (
    prev === null ||
    next === null ||
    typeof prev !== 'object' ||
    typeof next !== 'object'
  ) {
    return false;
  }

  const prevKeys = Object.keys(prev as Record<string, unknown>);
  const nextKeys = Object.keys(next as Record<string, unknown>);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) {
      return false;
    }

    const prevVal = (prev as Record<string, unknown>)[key];
    const nextVal = (next as Record<string, unknown>)[key];

    if (
      typeof prevVal === 'object' &&
      typeof nextVal === 'object' &&
      prevVal !== null &&
      nextVal !== null
    ) {
      if (!deepEqual(prevVal, nextVal)) {
        return false;
      }
    } else if (prevVal !== nextVal) {
      return false;
    }
  }

  return true;
}
