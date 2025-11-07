import { useEffect, useState } from 'react';
import { isTruthy, isDefined } from '@/core/guards';

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility settings
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (isTruthy(mediaQuery.addEventListener)) {
      mediaQuery.addEventListener('change', handleChange);
      return () => { mediaQuery.removeEventListener('change', handleChange); };
    }
    
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => { mediaQuery.removeListener(handleChange); };
  }, []);

  return prefersReducedMotion;
}
