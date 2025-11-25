/**
 * PremiumControlStrip Component for Mobile Adoption Marketplace
 *
 * Shows listing count, sort options, and view toggle with premium UX.
 * Includes Reanimated animations and haptic feedback.
 *
 * @example
 * <PremiumControlStrip
 *   totalCount={42}
 *   currentSort="recent"
 *   onSortChange={handleSortChange}
 *   loading={false}
 * />
 */
import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, FadeInUp, SlideInDown, SlideOutDown } from '@petspark/motion'
import * as Haptics from 'expo-haptics'

import { colors } from '@/theme/colors'
import { typography, spacing } from '@/theme/typography'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PremiumControlStrip')

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type SortOption = 'recent' | 'distance' | 'age' | 'fee_low' | 'fee_high'

interface SortOptionInfo {
  readonly value: SortOption
  readonly label: string
  readonly icon: string
  readonly description: string
}

const SORT_OPTIONS: readonly SortOptionInfo[] = [
  {
    value: 'recent',
    label: 'Most Recent',
    icon: '🕒',
    description: 'Newest listings first',
  },
  {
    value: 'distance',
    label: 'Nearest',
    icon: '📍',
    description: 'Closest to your location',
  },
  {
    value: 'age',
    label: 'Age',
    icon: '🐾',
    description: 'Youngest pets first',
  },
  {
    value: 'fee_low',
    label: 'Price: Low to High',
    icon: '💰',
    description: 'Lowest adoption fees first',
  },
  {
    value: 'fee_high',
    label: 'Price: High to Low',
    icon: '💎',
    description: 'Highest adoption fees first',
  },
] as const

export interface PremiumControlStripProps {
  readonly totalCount: number
  readonly currentSort: SortOption
  readonly onSortChange: (sort: SortOption) => void
  readonly loading?: boolean
  readonly showDistance?: boolean
}

function SortModal({
  visible,
  currentSort,
  onClose,
  onSortSelect,
}: {
  readonly visible: boolean
  readonly currentSort: SortOption
  readonly onClose: () => void
  readonly onSortSelect: (sort: SortOption) => void
}): React.JSX.Element {
  const handleSortSelect = useCallback((sort: SortOption) => {
    logger.debug('Sort option selected', { sort })

    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    onSortSelect(sort)
    onClose()
  }, [onSortSelect, onClose])

  const handleBackdropPress = useCallback(() => {
    logger.debug('Sort modal closed via backdrop')
    onClose()
  }, [onClose])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={handleBackdropPress}>
        <Animated.View
          entering={SlideInDown.duration(300).springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContent}
        >
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Sort by</Text>

          <View style={styles.sortOptions}>
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.value === currentSort

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.sortOption,
                    isSelected && styles.sortOptionSelected,
                  ]}
                  onPress={() => handleSortSelect(option.value)}
                  accessible
                  accessibilityLabel={`Sort by ${option.label}. ${option.description}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.sortOptionIcon}>
                    <Text style={styles.sortOptionIconText}>{option.icon}</Text>
                  </View>

                  <View style={styles.sortOptionContent}>
                    <Text style={[
                      styles.sortOptionLabel,
                      isSelected && styles.sortOptionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.sortOptionDescription}>
                      {option.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.sortOptionCheck}>
                      <Text style={styles.sortOptionCheckIcon}>✓</Text>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

export function PremiumControlStrip({
  totalCount,
  currentSort,
  onSortChange,
  loading = false,
  showDistance = false,
}: PremiumControlStripProps): React.JSX.Element {
  const [showSortModal, setShowSortModal] = useState(false)
  const sortButtonScale = useSharedValue(1)

  const currentSortOption = SORT_OPTIONS.find(option => option.value === currentSort) ?? SORT_OPTIONS[0]!

  const handleSortPress = useCallback(() => {
    logger.debug('Sort button pressed', { currentSort })

    // Animate button press
    sortButtonScale.value = withSpring(0.95, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      sortButtonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 100)

    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    setShowSortModal(true)
  }, [currentSort, sortButtonScale])

  const handleSortModalClose = useCallback(() => {
    setShowSortModal(false)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    onSortChange(sort)
  }, [onSortChange])

  const sortButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sortButtonScale.value }],
  }), [sortButtonScale])

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={styles.container}
      >
        {/* Results Count */}
        <View style={styles.countSection}>
          <Text style={styles.countText}>
            {loading ? 'Loading...' : `${totalCount.toLocaleString()} ${totalCount === 1 ? 'pet' : 'pets'}`}
          </Text>
          {showDistance && !loading && (
            <Text style={styles.countSubtext}>within your area</Text>
          )}
        </View>

        {/* Sort Button */}
        <AnimatedPressable
          style={[styles.sortButton, sortButtonAnimatedStyle]}
          onPress={handleSortPress}
          disabled={loading}
          accessible
          accessibilityLabel={`Sort by ${currentSortOption.label}. Tap to change sorting`}
          accessibilityRole="button"
          accessibilityHint="Opens sort options menu"
        >
          <Text style={styles.sortIcon}>{currentSortOption.icon}</Text>
          <Text style={styles.sortText}>
            {currentSortOption.label}
          </Text>
          <Text style={styles.sortArrow}>▼</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        currentSort={currentSort}
        onClose={handleSortModalClose}
        onSortSelect={handleSortChange}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countSection: {
    flex: 1,
  },
  countText: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  countSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  sortText: {
    ...typography['body-sm'],
    color: colors.textPrimary,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  sortArrow: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sortOptions: {
    gap: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortOptionSelected: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  sortOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sortOptionIconText: {
    fontSize: 20,
  },
  sortOptionContent: {
    flex: 1,
  },
  sortOptionLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  sortOptionLabelSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  sortOptionDescription: {
    ...typography['body-sm'],
    color: colors.textSecondary,
  },
  sortOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionCheckIcon: {
    fontSize: 14,
    color: colors.card,
    fontWeight: '700',
  },
})
