/**
 * React Query hooks for notifications API (Web)
 * Location: apps/web/src/hooks/api/use-notifications.ts
 */

import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { notificationAPI } from '@/lib/api-services'
import type { Notification } from '@/lib/api-schemas'

/**
 * Hook to get notifications
 */
export function useNotifications(params?: {
  read?: boolean
  type?: string
}): UseQueryResult<Notification[]> {
  return useQuery({
    queryKey: [...queryKeys.notifications.list, params],
    queryFn: async () => {
      const response = await notificationAPI.list(params)
      return response.items
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead(): UseMutationResult<
  { success: boolean },
  unknown,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread })
    },
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead(): UseMutationResult<
  { success: boolean; count: number },
  unknown,
  void
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread })
    },
  })
}

