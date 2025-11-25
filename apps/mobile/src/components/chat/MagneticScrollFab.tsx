/**
 * MagneticScrollFab Component
 *
 * Floating action button that leans on the magnetic FAB effect from the
 * ultra-premium chat effects suite.
 *
 * Location: apps/mobile/src/components/chat/MagneticScrollFab.tsx
 */
import React, { memo } from 'react'
import { StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native'
import { Animated } from '@petspark/motion'

import { useScrollFabMagnetic } from '@mobile/effects/chat/ui'
import { colors } from '@mobile/theme/colors'

export interface MagneticScrollFabProps {
  readonly onPress: () => void
  readonly isVisible: boolean
  readonly badgeCount: number
  readonly previousBadgeCount: number
  readonly style?: ViewStyle
}

export const MagneticScrollFab = memo(function MagneticScrollFab({
  onPress,
  isVisible,
  badgeCount,
  previousBadgeCount,
  style,
}: MagneticScrollFabProps): React.ReactElement | null {
  const { animatedStyle, badgeAnimatedStyle } = useScrollFabMagnetic({
    enabled: true,
    isVisible,
    badgeCount,
    previousBadgeCount,
  })

  if (!isVisible) {
    return null
  }

  return (
    <Animated.View pointerEvents="box-none" style={[styles.fabContainer, animatedStyle, style]}>
      <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Scroll to latest messages">
        <Text style={styles.fabIcon}>↓</Text>
        {badgeCount > 0 && (
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount.toString()}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
})

export default MagneticScrollFab
