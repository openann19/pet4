/**
 * React Query Configuration with Offline Persistence
 *
 * Sets up TanStack Query with custom storage adapter for offline caching
 * using the IndexedDB storage adapter.
 */

import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { idbStorage } from '@/lib/storage-adapter'
import { createLogger } from '@/lib/logger'

const logger = createLogger('QueryClient')

// Create storage persister for offline caching
export const queryPersister = createSyncStoragePersister({
  storage: idbStorage,
  key: 'petspark-query-cache',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
})

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 1 minute by default
      staleTime: 60_000,
      // Keep in cache for 30 minutes
      gcTime: 1_800_000,
      // Retry failed queries 2 times
      retry: 2,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
})

// Background sync configuration
export const backgroundSyncConfig = {
  // Sync interval in milliseconds (5 minutes)
  syncInterval: 5 * 60 * 1000,
  // Maximum retry attempts for failed syncs
  maxRetries: 3,
  // Backoff multiplier for retry delays
  backoffMultiplier: 2,
}

// Query keys for consistent caching
export const queryKeys = {
  // User data
  user: {
    profile: ['user', 'profile'] as const,
    preferences: ['user', 'preferences'] as const,
    pets: ['user', 'pets'] as const,
  },

  // Matching
  matches: {
    list: ['matches'] as const,
    detail: (id: string) => ['matches', id] as const,
  },

  // Pets
  pets: {
    list: ['pets', 'list'] as const,
    detail: (id: string) => ['pets', id] as const,
  },

  // Swipes
  swipes: {
    history: ['swipes', 'history'] as const,
    stats: ['swipes', 'stats'] as const,
  },

  // Playdates
  playdates: {
    list: ['playdates'] as const,
    detail: (id: string) => ['playdates', id] as const,
  },

  // Community
  community: {
    posts: ['community', 'posts'] as const,
    post: (id: string) => ['community', 'posts', id] as const,
    comments: (postId: string) => ['community', 'posts', postId, 'comments'] as const,
  },

  // Adoption
  adoption: {
    listings: ['adoption', 'listings'] as const,
    listing: (id: string) => ['adoption', 'listings', id] as const,
    applications: ['adoption', 'applications'] as const,
  },

  // Lost & Found
  lostFound: {
    alerts: ['lost-found', 'alerts'] as const,
    alert: (id: string) => ['lost-found', 'alerts', id] as const,
    sightings: ['lost-found', 'sightings'] as const,
  },

  // Chat
  chat: {
    rooms: ['chat', 'rooms'] as const,
    room: (id: string) => ['chat', 'rooms', id] as const,
    messages: (roomId: string) => ['chat', 'rooms', roomId, 'messages'] as const,
  },

  // Notifications
  notifications: {
    list: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
} as const

// Mutation keys for optimistic updates
export const mutationKeys = {
  swipe: ['swipe'] as const,
  match: ['match'] as const,
  playdate: ['playdate'] as const,
  post: ['post'] as const,
  comment: ['comment'] as const,
} as const
