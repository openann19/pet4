/**
 * React Query Provider Component
 *
 * Provides React Query client with offline persistence and background sync
 */

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { onlineManager, focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient, queryPersister, backgroundSyncConfig } from '@/lib/query-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('QueryProvider');

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Setup online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const handleOnline = () => {
      try {
        logger.debug('Network connection restored');
        onlineManager.setOnline(true);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider handleOnline _error', err);
      }
    };

    const handleOffline = () => {
      try {
        logger.debug('Network connection lost');
        onlineManager.setOnline(false);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider handleOffline _error', err);
      }
    };

    try {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial online state - navigator.onLine is always defined in browsers
      if (typeof navigator.onLine === 'boolean') {
        onlineManager.setOnline(navigator.onLine);
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('QueryProvider setup online/offline listeners _error', err);
    }

    return () => {
      try {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider cleanup online/offline listeners _error', err);
      }
    };
  }, []);

  // Setup focus management for background tabs
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleFocus = () => {
      try {
        focusManager.setFocused(true);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider handleFocus _error', err);
      }
    };

    const handleBlur = () => {
      try {
        focusManager.setFocused(false);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider handleBlur _error', err);
      }
    };

    try {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      // Set initial focus state - document.hasFocus() is always defined in browsers
      if (typeof document.hasFocus === 'function') {
        try {
          focusManager.setFocused(document.hasFocus());
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('QueryProvider document.hasFocus _error', err);
          // Default to focused if hasFocus fails
          focusManager.setFocused(true);
        }
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('QueryProvider setup focus/blur listeners _error', err);
    }

    return () => {
      try {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider cleanup focus/blur listeners _error', err);
      }
    };
  }, []);

  // Setup background sync
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return;
    }

    const syncInterval = setInterval(() => {
      try {
        const isOnline = typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
        const isVisible =
          typeof document.visibilityState === 'string' && document.visibilityState === 'visible';

        if (isOnline && isVisible) {
          logger.debug('Running background sync');
          void queryClient
            .invalidateQueries({
              refetchType: 'active',
            })
            .catch((error: unknown) => {
              const err = _error instanceof Error ? _error : new Error(String(_error));
              logger.error('Background sync failed', err);
            });
        }
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Background sync interval _error', err);
      }
    }, backgroundSyncConfig.syncInterval);

    return () => {
      try {
        clearInterval(syncInterval);
      } catch (_error) {
        const err = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('QueryProvider cleanup sync interval _error', err);
      }
    };
  }, [queryClient]);

  // In development, show React Query devtools
  const showDevtools = import.meta.env.DEV;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        // Persist cache for 24 hours
        maxAge: 24 * 60 * 60 * 1000,
        // Dehydrate options
        dehydrateOptions: {
          shouldDehydrateQuery: (query: { state: { status: string } }) => {
            // Only persist successful queries
            return query.state.status === 'success';
          },
        },
      }}
    >
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  );
}

// Legacy provider for backwards compatibility
export const ReactQueryProvider = QueryProvider;
