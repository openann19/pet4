/**
 * React Query provider setup with offline persistence
 * Location: src/providers/QueryProvider.tsx
 */

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import React from 'react'
import { asyncStorage } from '../utils/storage-adapter'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 60_000, // 1 minute
      gcTime: 1_800_000, // 30 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: {
    getItem: asyncStorage.getItem,
    setItem: asyncStorage.setItem,
    removeItem: asyncStorage.removeItem,
  },
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
