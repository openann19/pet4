/**
 * React Query Configuration with Offline Persistence (Mobile)
 *
 * Sets up TanStack Query with AsyncStorage for offline caching
 * Following KRASIVO specification for premium data layer
 */

import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { asyncStorage } from '../utils/storage-adapter'
import { createLogger } from '../utils/logger'

const logger = createLogger('QueryClient')

// Create storage persister for offline caching
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: asyncStorage.getItem,
    setItem: asyncStorage.setItem,
    removeItem: asyncStorage.removeItem,
  },
  key: 'petspark-query-cache',
})

// Query client configuration - KRASIVO spec
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 1_800_000, // 30 minutes
      retry: 1, // Single retry for mobile
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Setup persistence
void persistQueryClient({
  queryClient,
  persister: queryPersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
})

// Query keys for consistent caching
export const queryKeys = {
  user: {
    pets: ['user', 'pets'] as const,
    profile: ['user', 'profile'] as const,
  },
  pets: {
    list: ['pets', 'list'] as const,
    detail: (id: string) => ['pets', 'detail', id] as const,
  },
  matches: {
    list: ['matches', 'list'] as const,
    detail: (id: string) => ['matches', 'detail', id] as const,
  },
  swipes: {
    history: ['swipes', 'history'] as const,
    stats: ['swipes', 'stats'] as const,
  },
  playdates: {
    list: ['playdates', 'list'] as const,
    detail: (id: string) => ['playdates', 'detail', id] as const,
  },
  chat: {
    messages: (chatRoomId: string) => ['chat', 'messages', chatRoomId] as const,
  },
  community: {
    posts: (category?: string) =>
      category ? ['community', 'posts', category] : (['community', 'posts'] as const),
    post: (postId: string) => ['community', 'post', postId] as const,
  },
  adoption: {
    applications: () => ['adoption', 'applications'] as const,
    petApplications: (petId: string) => ['adoption', 'pet-applications', petId] as const,
    process: (applicationId: string) => ['adoption', 'process', applicationId] as const,
  },
  stories: {
    highlights: (userId: string) => ['stories', 'highlights', userId] as const,
    list: ['stories', 'list'] as const,
    detail: (storyId: string) => ['stories', 'detail', storyId] as const,
  },
  payments: {
    subscription: (userId: string) => ['payments', 'subscription', userId] as const,
    methods: (userId: string) => ['payments', 'methods', userId] as const,
    billingIssues: (userId: string) => ['payments', 'billing-issues', userId] as const,
  },
} as const

// Mutation keys for consistent mutation tracking
export const mutationKeys = {
  swipe: ['swipe'] as const,
  like: ['like'] as const,
  dislike: ['dislike'] as const,
  playdate: ['playdate'] as const,
  stories: {
    createHighlight: ['stories', 'createHighlight'] as const,
    updateHighlight: ['stories', 'updateHighlight'] as const,
    addStoryToHighlight: ['stories', 'addStoryToHighlight'] as const,
    deleteHighlight: ['stories', 'deleteHighlight'] as const,
  },
  payments: {
    createSubscription: ['payments', 'createSubscription'] as const,
    cancelSubscription: ['payments', 'cancelSubscription'] as const,
    updatePaymentMethod: ['payments', 'updatePaymentMethod'] as const,
    restorePurchases: ['payments', 'restorePurchases'] as const,
  },
} as const

logger.info('Query client initialized with offline persistence')
