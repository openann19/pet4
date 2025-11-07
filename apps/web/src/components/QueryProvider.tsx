/**
 * React Query Provider Component
 *
 * Provides React Query client with offline persistence and background sync
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { onlineManager, focusManager } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryClient, queryPersister, backgroundSyncConfig } from '@/lib/query-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('QueryProvider')

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      logger.debug('Network connection restored')
      onlineManager.setOnline(true)
    }

    const handleOffline = () => {
      logger.debug('Network connection lost')
      onlineManager.setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial online state
    onlineManager.setOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Setup focus management for background tabs
  useEffect(() => {
    const handleFocus = () => { focusManager.setFocused(true); }
    const handleBlur = () => { focusManager.setFocused(false); }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Set initial focus state
    focusManager.setFocused(document.hasFocus())

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Setup background sync
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        logger.debug('Running background sync')
        queryClient.invalidateQueries({
          refetchType: 'active',
        })
      }
    }, backgroundSyncConfig.syncInterval)

    return () => { clearInterval(syncInterval); }
  }, [])

  // In development, show React Query devtools
  const showDevtools = import.meta.env.DEV

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
            return query.state.status === 'success'
          },
        },
      }}
    >
      {children}
      {showDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </PersistQueryClientProvider>
  )
}

// Legacy provider for backwards compatibility
export const ReactQueryProvider = QueryProvider