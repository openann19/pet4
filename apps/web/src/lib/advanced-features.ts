import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from './logger';

const logger = createLogger('advanced-features');

// Browser API type extensions
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface NetworkInformation extends EventTarget {
  type: string;
  effectiveType: string;
}

interface WakeLockManager {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>;
  released: boolean;
  type: 'screen';
}

interface NavigatorWithBattery {
  getBattery?(): Promise<BatteryManager>;
  connection?: NetworkInformation;
  wakeLock?: WakeLockManager;
}

interface WindowWithNavigator {
  navigator: Navigator & NavigatorWithBattery;
}

export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useLongPress(
  callback: () => void,
  options: { delay?: number; onStart?: () => void; onCancel?: () => void } = {}
) {
  const { delay = 500, onStart, onCancel } = options;
  const timeoutRef = useRef<number | undefined>(undefined);
  const [isPressed, setIsPressed] = useState(false);

  const start = useCallback(() => {
    setIsPressed(true);
    onStart?.();
    timeoutRef.current = window.setTimeout(() => {
      callback();
      setIsPressed(false);
    }, delay);
  }, [callback, delay, onStart]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsPressed(false);
      onCancel?.();
    }
  }, [onCancel]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  };

  return { handlers, isPressed };
}

export function useIdleDetection(callback: () => void, timeout = 60000) {
  const timeoutRef = useRef<number | undefined>(undefined);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(callback, timeout);
  }, [callback, timeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}

export function usePageVisibility(onVisible?: () => void, onHidden?: () => void) {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (visible) {
        onVisible?.();
      } else {
        onHidden?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisible, onHidden]);

  return isVisible;
}

export function useBatteryStatus() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    const nav = window.navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (!nav.getBattery) {
      return;
    }

    let cleanup: (() => void) | null = null;

    nav
      .getBattery()
      .then((battery: BatteryManager) => {
        try {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);

          const updateLevel = () => {
            try {
              setBatteryLevel(battery.level);
            } catch (_error) {
              const err = _error instanceof Error ? _error : new Error(String(_error));
              logger.error('useBatteryStatus updateLevel _error', err);
            }
          };
          const updateCharging = () => {
            try {
              setIsCharging(battery.charging);
            } catch (_error) {
              const err = _error instanceof Error ? _error : new Error(String(_error));
              logger.error('useBatteryStatus updateCharging _error', err);
            }
          };

          battery.addEventListener('levelchange', updateLevel);
          battery.addEventListener('chargingchange', updateCharging);

          cleanup = () => {
            try {
              battery.removeEventListener('levelchange', updateLevel);
              battery.removeEventListener('chargingchange', updateCharging);
            } catch (_error) {
              const err = _error instanceof Error ? _error : new Error(String(_error));
              logger.error('useBatteryStatus cleanup _error', err);
            }
          };
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('useBatteryStatus setup _error', err);
        }
      })
      .catch((error) => {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Failed to get battery status', err);
      });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return { batteryLevel, isCharging };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const handleOnline = () => {
      try {
        setIsOnline(true);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('useNetworkStatus handleOnline _error', err);
      }
    };

    const handleOffline = () => {
      try {
        setIsOnline(false);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('useNetworkStatus handleOffline _error', err);
      }
    };

    try {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('useNetworkStatus setup event listeners _error', err);
    }

    const nav = window.navigator as Navigator & { connection?: NetworkInformation };
    if (nav.connection) {
      try {
        const connection = nav.connection;
        setConnectionType(connection.type ?? 'unknown');
        setEffectiveType(connection.effectiveType ?? 'unknown');

        const handleChange = () => {
          try {
            setConnectionType(connection.type ?? 'unknown');
            setEffectiveType(connection.effectiveType ?? 'unknown');
          } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('useNetworkStatus handleChange _error', err);
          }
        };

        connection.addEventListener('change', handleChange);

        return () => {
          try {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            connection.removeEventListener('change', handleChange);
          } catch (_error) {
            const err = _error instanceof Error ? _error : new Error(String(_error));
            logger.error('useNetworkStatus cleanup _error', err);
          }
        };
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('useNetworkStatus setup connection listeners _error', err);
      }
    }

    return () => {
      try {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('useNetworkStatus cleanup _error', err);
      }
    };
  }, []);

  return { isOnline, connectionType, effectiveType };
}

export function useGeolocation(options?: PositionOptions) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError({
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      setLoading(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition(pos);
      setError(null);
      setLoading(false);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, []);

  return { position, error, loading };
}

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      logger.error('Failed to copy', err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  return { copy, copied };
}

export function useShare() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('share' in navigator);
  }, []);

  const share = useCallback(
    async (data: ShareData) => {
      if (!isSupported) return false;

      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('Share failed', err instanceof Error ? err : new Error(String(err)));
        }
        return false;
      }
    },
    [isSupported]
  );

  return { share, isSupported };
}

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    const nav = window.navigator as Navigator & { wakeLock?: WakeLockManager };
    if (nav.wakeLock) {
      try {
        wakeLockRef.current = await nav.wakeLock.request('screen');
        setIsLocked(true);

        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
        });
      } catch (err) {
        logger.error(
          'Wake Lock request failed',
          err instanceof Error ? err : new Error(String(err))
        );
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        void wakeLockRef.current.release();
      }
    };
  }, []);

  return { isLocked, requestWakeLock, releaseWakeLock };
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function usePrefersColorScheme() {
  const [prefersDark, setPrefersDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersDark ? 'dark' : 'light';
}

export function useOrientation() {
  const [orientation, setOrientation] = useState(window.screen?.orientation?.type ?? 'unknown');

  useEffect(() => {
    const handleChange = () => {
      setOrientation(window.screen?.orientation?.type ?? 'unknown');
    };

    window.screen?.orientation?.addEventListener('change', handleChange);
    return () => {
      window.screen?.orientation?.removeEventListener('change', handleChange);
    };
  }, []);

  return orientation;
}
