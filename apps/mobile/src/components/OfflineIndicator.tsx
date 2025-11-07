/**
 * Offline indicator component
 * Location: src/components/OfflineIndicator.tsx
 */

import React from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useNetworkStatus } from '../hooks/use-network-status'
import { isTruthy, isDefined } from '@/core/guards';

export function OfflineIndicator(): React.JSX.Element | null {
  const { isConnected } = useNetworkStatus()

  if (isTruthy(isConnected)) {
    return null
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      <Text style={styles.text}>
        📡 You're offline. Changes will sync when connected.
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFA726',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})

