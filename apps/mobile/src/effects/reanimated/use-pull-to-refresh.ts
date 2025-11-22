/**
 * Mobile Adapter: usePullToRefresh
 * Adapter for existing usePullToRefresh hook to match web API
 */

import { usePullToRefresh as useMobilePullToRefresh } from '../../hooks/use-pull-to-refresh'
import type { UsePullToRefreshOptions as MobileUsePullToRefreshOptions, UsePullToRefreshReturn as MobileUsePullToRefreshReturn } from '../../hooks/use-pull-to-refresh'
import type { SharedValue } from 'react-native-reanimated'

export interface UsePullToRefreshOptions extends Omit<MobileUsePullToRefreshOptions, 'onRefresh'> {
  onRefresh: () => Promise<void>
}

export interface UsePullToRefreshReturn {
  isRefreshing: boolean
  refresh: () => Promise<void>
  translateY: SharedValue<number>
  progress: SharedValue<number>
  gesture: MobileUsePullToRefreshReturn['gesture']
  animatedStyle: MobileUsePullToRefreshReturn['animatedStyle']
}

/**
 * Adapter that wraps the existing mobile usePullToRefresh hook
 * to match the web API structure
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: Omit<UsePullToRefreshOptions, 'onRefresh'> = {}
): UsePullToRefreshReturn {
  const mobileHook = useMobilePullToRefresh(onRefresh, options)

  return {
    isRefreshing: mobileHook.isRefreshing,
    refresh: mobileHook.refresh,
    translateY: mobileHook.translateY,
    progress: mobileHook.progress,
    gesture: mobileHook.gesture,
    animatedStyle: mobileHook.animatedStyle,
  }
}

