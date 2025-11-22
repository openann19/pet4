/**
 * useNetworkStatus Hook
 *
 * Tracks online/offline network status.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useState, useEffect } from 'react';

interface UseNetworkStatusReturn {
  isOnline: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const handleOnline = (): void => {
      try {
        setIsOnline(true);
      } catch {
        // Silently handle state update errors
      }
    };

    const handleOffline = (): void => {
      try {
        setIsOnline(false);
      } catch {
        // Silently handle state update errors
      }
    };

    try {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } catch {
      // Silently handle listener registration errors
    }

    return () => {
      try {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch {
        // Silently handle listener cleanup errors
      }
    };
  }, []);

  return { isOnline };
}
