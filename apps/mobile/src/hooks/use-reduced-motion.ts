/**
 * Reduced Motion Hook — Mobile
 *
 * Detects reduced motion preference on mobile devices.
 * Falls back to false if not available.
 *
 * NOTE: This is a fallback implementation. The main implementation
 * is in @/effects/chat/core/reduced-motion which should be used instead.
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Check if reduced motion is enabled
 * @deprecated Use useReducedMotion from @/effects/chat/core/reduced-motion instead
 * @returns boolean indicating if reduced motion is enabled
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Check initial state
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduced;
}
