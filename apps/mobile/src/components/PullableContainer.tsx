/**
 * Pullable container wrapper with gesture support
 * Location: src/components/PullableContainer.tsx
 */

import React, { type ReactNode } from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { Animated, type AnimatedStyle } from '@petspark/motion'
import type { UsePullToRefreshOptions } from '../hooks/use-pull-to-refresh'
import { usePullToRefresh } from '../hooks/use-pull-to-refresh'
import { RefreshControl } from './RefreshControl'

export interface PullableContainerProps {
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>
  /** Children to render inside pullable container */
  children: ReactNode
  /** Options for pull-to-refresh behavior */
  refreshOptions?: UsePullToRefreshOptions
  /** Show refresh control (default true) */
  showRefreshControl?: boolean
  /** Custom style for container */
  style?: AnimatedStyle<ViewStyle>
  /** Content container style */
  contentContainerStyle?: AnimatedStyle<ViewStyle>
}

export function PullableContainer({
  onRefresh,
  children,
  refreshOptions,
  showRefreshControl = true,
  style,
  contentContainerStyle,
}: PullableContainerProps): React.JSX.Element {
  const { isRefreshing, gesture, animatedStyle, translateY, progress } = usePullToRefresh(
    onRefresh,
    refreshOptions
  )

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={Object.assign({}, styles.container, style, animatedStyle)}>
        {showRefreshControl && (
          <RefreshControl
            refreshing={isRefreshing}
            translateY={translateY}
            {...(progress !== undefined ? { progress } : {})}
            {...(refreshOptions?.threshold !== undefined
              ? { threshold: refreshOptions.threshold }
              : {})}
          />
        )}
        <Animated.View style={Object.assign({}, styles.content, contentContainerStyle)}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})
