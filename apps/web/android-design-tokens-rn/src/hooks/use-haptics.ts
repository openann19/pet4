/**
 * Lightweight haptics shim for the RN design token showcase.
 * Provides a stable API without requiring platform haptics in web builds.
 */
export function useHaptics(): { impact: (style?: 'light' | 'medium' | 'heavy') => void } {
  return {
    impact: () => {
      // no-op shim; could be replaced with navigator.vibrate or platform-specific haptics
    },
  };
}
