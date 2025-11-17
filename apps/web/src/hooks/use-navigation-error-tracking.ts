import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import type { NavigationError, NavigationErrorType } from '@/lib/navigation-error-types';

const logger = createLogger('NavigationErrorTracking');

interface NavigationErrorTrackingOptions {
  onError?: (error: NavigationError) => void;
  enabled?: boolean;
}

export function useNavigationErrorTracking(
  options: NavigationErrorTrackingOptions = {}
): void {
  const { onError, enabled = true } = options;
  const location = useLocation();
  const previousPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleError = (event: ErrorEvent): void => {
      const error =
        event.error instanceof Error
          ? event.error
          : new Error(event.message ?? 'Unknown error');
      const errorType = detectErrorType(error);
      const fromPath = previousPathRef.current;
      const toPath = location.pathname;

      const navigationError: NavigationError = {
        type: errorType,
        error,
        fromPath,
        toPath,
        timestamp: new Date().toISOString(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };

      logger.error('Navigation error detected', error, {
        errorType,
        fromPath,
        toPath,
        navigationError,
      });

      onError?.(navigationError);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason ?? 'Unhandled promise rejection'));

      const errorType = detectErrorType(error);
      const fromPath = previousPathRef.current;
      const toPath = location.pathname;

      const navigationError: NavigationError = {
        type: errorType,
        error,
        fromPath,
        toPath,
        timestamp: new Date().toISOString(),
        metadata: {
          promiseRejection: true,
        },
      };

      logger.error('Unhandled promise rejection during navigation', error, {
        errorType,
        fromPath,
        toPath,
        navigationError,
      });

      onError?.(navigationError);
    };

    const handleChunkError = (event: Event): void => {
      if (event.type === 'error') {
        const target = event.target;
        if (
          target &&
          (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)
        ) {
          const src = target instanceof HTMLScriptElement ? target.src : target.href;
          if (src && (src.includes('chunk') || src.includes('assets'))) {
            const error = new Error(`ChunkLoadError: Failed to load ${src}`);
            const errorType: NavigationErrorType = 'chunk-load-error';
            const fromPath = previousPathRef.current;
            const toPath = location.pathname;

            const navigationError: NavigationError = {
              type: errorType,
              error,
              fromPath,
              toPath,
              timestamp: new Date().toISOString(),
              metadata: {
                src,
                tagName: target.tagName,
              },
            };

            logger.error('Chunk load error detected', error, {
              errorType,
              fromPath,
              toPath,
              src,
              navigationError,
            });

            onError?.(navigationError);
          }
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleChunkError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleChunkError, true);
    };
  }, [enabled, location.pathname, onError]);

  useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location.pathname]);
}

function detectErrorType(error: Error): NavigationErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('chunk') || message.includes('loading chunk') || name === 'chunkloaderror') {
    return 'chunk-load-error';
  }

  if (message.includes('hydration') || message.includes('hydration failed')) {
    return 'hydration-mismatch';
  }

  if (message.includes('404') || message.includes('not found') || name === 'notfounderror') {
    return '404';
  }

  if (message.includes('500') || message.includes('server error') || name === 'servererror') {
    return '500';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'data-fetch-error';
  }

  return 'unknown';
}
