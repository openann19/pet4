/**
 * React Query Hooks for User Data
 *
 * Replaces local storage usage with server-backed queries and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '@/lib/query-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('UserDataHooks')

// Types
export interface Pet {
  id: string
  name: string
  breed: string
  age: number
  photos: string[]
  // Add other pet fields as needed
}

export interface Match {
  id: string
  petId: string
  matchedPetId: string
  status: 'active' | 'passed' | 'matched'
  createdAt: string
}

export interface SwipeAction {
  id: string
  petId: string
  targetPetId: string
  action: 'like' | 'pass'
  timestamp: string
}

export interface Playdate {
  id: string
  title: string
  location: string
  date: string
  participants: string[]
  // Add other playdate fields as needed
}

/**
 * Hook for user pets data
 */
export function useUserPets() {
  return useQuery({
    queryKey: queryKeys.user.pets,
    queryFn: async () => {
      // TODO: Replace with actual API call when available
      // For now, return empty array to maintain compatibility
      logger.debug('Fetching user pets')
      return [] as Pet[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for matches data
 */
export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches.list,
    queryFn: async () => {
      // TODO: Replace with actual API call
      logger.debug('Fetching matches')
      return [] as Match[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - matches change frequently
  })
}

/**
 * Hook for swipe history
 */
export function useSwipeHistory() {
  return useQuery({
    queryKey: queryKeys.swipes.history,
    queryFn: async () => {
      // TODO: Replace with actual API call
      logger.debug('Fetching swipe history')
      return [] as SwipeAction[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - history doesn't change often
  })
}

/**
 * Hook for playdates
 */
export function usePlaydates() {
  return useQuery({
    queryKey: queryKeys.playdates.list,
    queryFn: async () => {
      // TODO: Replace with actual API call
      logger.debug('Fetching playdates')
      return [] as Playdate[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for swipe stats (computed from swipe history)
 */
export function useSwipeStats() {
  const { data: swipeHistory = [] } = useSwipeHistory()

  return useQuery({
    queryKey: queryKeys.swipes.stats,
    queryFn: () => {
      const totalSwipes = swipeHistory.length
      const likes = swipeHistory.filter(s => s.action === 'like').length
      const passes = swipeHistory.filter(s => s.action === 'pass').length
      const successRate = likes > 0 ? Math.round((likes / totalSwipes) * 100) : 0

      return {
        totalSwipes,
        likes,
        passes,
        successRate,
      }
    },
    enabled: !!swipeHistory,
  })
}

/**
 * Mutation for performing a swipe action
 */
export function useSwipeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.swipe,
    mutationFn: async (swipe: Omit<SwipeAction, 'id' | 'timestamp'>) => {
      // TODO: Replace with actual API call
      logger.debug('Performing swipe', swipe)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // For now, just return the swipe with generated ID
      return {
        ...swipe,
        id: `swipe-${Date.now()}`,
        timestamp: new Date().toISOString(),
      } as SwipeAction
    },
    onSuccess: (newSwipe) => {
      // Optimistically update swipe history
      queryClient.setQueryData<SwipeAction[]>(
        queryKeys.swipes.history,
        (old = []) => [...old, newSwipe]
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.swipes.stats })
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.list })
    },
    onError: (error) => {
      logger.error('Swipe mutation failed', error)
    },
  })
}

/**
 * Mutation for creating a playdate
 */
export function useCreatePlaydateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: mutationKeys.playdate,
    mutationFn: async (playdate: Omit<Playdate, 'id'>) => {
      // TODO: Replace with actual API call
      logger.debug('Creating playdate', playdate)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        ...playdate,
        id: `playdate-${Date.now()}`,
      } as Playdate
    },
    onSuccess: (newPlaydate) => {
      // Optimistically update playdates list
      queryClient.setQueryData<Playdate[]>(
        queryKeys.playdates.list,
        (old = []) => [...old, newPlaydate]
      )
    },
    onError: (error) => {
      logger.error('Create playdate mutation failed', error)
    },
  })
}

/**
 * Computed hook for active matches count
 */
export function useActiveMatchesCount() {
  const { data: matches = [] } = useMatches()

  return matches.filter(match => match.status === 'active').length
}