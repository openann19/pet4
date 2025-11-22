/**
 * React Query provider for the web surface with localStorage persistence.
 *
 * Ensures offline caching, focus/online state propagation, and background sync
 * while keeping React Query Devtools disabled in production builds.
 * Uses synchronous localStorage persister to avoid Promise serialization issues during hydration.
 */

import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient, queryPersister, backgroundSyncConfig } from '@/lib/query-client';
import { createLogger } from '@/lib/logger';

interface QueryProviderProps {
  readonly children: ReactNode;
}

const logger = createLogger('web.QueryProvider');

function setupNetworkManagement(): (() => void) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const handleOnline = (): void => {
    const isOnline = true;
    onlineManager.setOnline(isOnline);
    logger.debug('Network connection restored', {
      event: 'network-status-change',
      isOnline,
    });
  };

  const handleOffline = (): void => {
    const isOnline = false;
    onlineManager.setOnline(isOnline);
    logger.warn('Network connection lost', {
      event: 'network-status-change',
      isOnline,
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  onlineManager.setOnline(window.navigator.onLine);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

function setupFocusManagement(): (() => void) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const handleFocus = (): void => {
    focusManager.setFocused(true);
    logger.debug('Window gained focus', {
      event: 'focus-change',
      isFocused: true,
    });
  };

  const handleBlur = (): void => {
    focusManager.setFocused(false);
    logger.debug('Window lost focus', {
      event: 'focus-change',
      isFocused: false,
    });
  };

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  focusManager.setFocused(document.hasFocus());

  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  };
}

function setupBackgroundSync(): (() => void) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const syncInterval = window.setInterval(() => {
    const isOnline = window.navigator.onLine;
    const isVisible =
      typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

    if (!isOnline || !isVisible) {
      return;
    }

    logger.debug('Running background query sync', {
      event: 'background-sync',
    });

    void queryClient.invalidateQueries({
      refetchType: 'active',
    });
  }, backgroundSyncConfig.syncInterval);

  return () => {
    window.clearInterval(syncInterval);
  };
}

export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  useEffect(setupNetworkManagement, []);
  useEffect(setupFocusManagement, []);
  useEffect(setupBackgroundSync, []);

  const persistOptions = useMemo(
    () => ({
      persister: queryPersister,
      maxAge: 24 * 60 * 60 * 1000,
      dehydrateOptions: {
        shouldDehydrateQuery: (query: { state: { status: string } }) =>
          query.state.status === 'success',
      },
    }),
    []
  );

  const showDevtools = Boolean(import.meta.env.DEV);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} position="bottom" /> : null}
    </PersistQueryClientProvider>
  );
}

export const ReactQueryProvider = QueryProvider;
