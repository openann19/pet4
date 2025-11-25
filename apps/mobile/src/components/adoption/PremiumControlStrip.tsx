/**
 * PremiumControlStrip Component for Mobile Adoption Marketplace
 *
 * Results counter and sort options with bottom sheet modal.
 * Features comprehensive sort options and mobile-optimized interactions.
 *
 * @example
 * <PremiumControlStrip
 *   totalCount={42}
 *   currentSort="recent"
 *   onSortChange={handleSortChange}
 *   loading={false}
 *   showDistance={true}
 * />
 */
import React, { useState, useCallback } from 'react'
import {
  View,
  Text, 
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native'
import { Animated, FadeInUp, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'
import * as Haptics from 'expo-haptics'

import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/typography'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('PremiumControlStrip')

export type SortOption = 'recent' | 'distance' | 'age-young' | 'age-old' | 'price-low' | 'price-high'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PremiumControlStripProps {
  readonly totalCount: number
  readonly currentSort: SortOption
  readonly onSortChange: (sort: SortOption) => void
  readonly loading?: boolean
  readonly showDistance?: boolean
}

interface SortModalProps {
  readonly visible: boolean
  readonly currentSort: SortOption
  readonly onSortChange: (sort: SortOption) => void
  readonly onClose: () => void
  readonly showDistance?: boolean
}

const sortOptions: Array<{
  value: SortOption
  label: string
  description: string
  requiresDistance?: boolean
}> = [
  {
    value: 'recent',
    label: 'Most Recent',
    description: 'Latest listings first',
  },
  {
    value: 'distance',
    label: 'Distance',
    description: 'Closest pets first',
    requiresDistance: true,
  },
  {
    value: 'age-young',
    label: 'Age: Young to Old',
    description: 'Youngest pets first',
  },
  {
    value: 'age-old',
    label: 'Age: Old to Young', 
    description: 'Oldest pets first',
  },
  {
    value: 'price-low',
    label: 'Price: Low to High',
    description: 'Lowest adoption fee first',
  },
  {
    value: 'price-high',
    label: 'Price: High to Low',
    description: 'Highest adoption fee first',
  },
]

function SortModal({ visible, currentSort, onSortChange, onClose, showDistance }: SortModalProps): React.JSX.Element {
  const handleSortSelect = useCallback((sort: SortOption) => {
    logger.debug('Sort option selected', { sort })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSortChange(sort)
    onClose()
  }, [onSortChange, onClose])

  const availableOptions = sortOptions.filter(option => 
    !option.requiresDistance || showDistance
  )

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"  
      onRequestClose={onClose}
      accessible
      accessibilityViewIsModal
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sort Options</Text>
          </View>

          <View style={styles.sortOptions}>
            {availableOptions.map((option) => {
              const isSelected = option.value === currentSort
              
              return (
                <Pressable
                  key={option.value}
                  style={[styles.sortOption, isSelected && styles.sortOptionSelected]}
                  onPress={() => handleSortSelect(option.value)}
                  accessible
                  accessibilityLabel={`Sort by ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.sortOptionContent}>
                    <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.sortOptionDescription, isSelected && styles.sortOptionDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={styles.sortOptionCheck}>✓</Text>
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
  const sortScale = useSharedValue(1)

  const handleSortPress = useCallback(() => {
    logger.debug('Sort button pressed', { currentSort })
    
    // Animate button
    sortScale.value = withSpring(0.95, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      sortScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 150)

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setShowSortModal(true)
  }, [currentSort, sortScale])

  const handleSortChange = useCallback((sort: SortOption) => {
    logger.debug('Sort changed', { from: currentSort, to: sort })
    onSortChange(sort)
  }, [currentSort, onSortChange])

  const closeSortModal = useCallback(() => {
    setShowSortModal(false)
  }, [])

  const getCurrentSortLabel = useCallback((): string => {
    const option = sortOptions.find(opt => opt.value === currentSort)
    return option?.label || 'Most Recent'
  }, [currentSort])

  const sortAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sortScale.value }],
  }), [sortScale])

  const formatResultsText = (): string => {
    if (loading) return 'Loading...'
    if (totalCount === 0) return 'No results'
    if (totalCount === 1) return '1 result'
    return `${totalCount.toLocaleString()} results`
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {formatResultsText()}
          </Text>
        </View>

        {/* Sort Button */}
        <AnimatedPressable
          style={[styles.sortButton, sortAnimatedStyle]}
          onPress={handleSortPress}
          accessible
          accessibilityLabel={`Sort by ${getCurrentSortLabel()}`}
          accessibilityRole="button"
          accessibilityHint="Opens sort options"
        >
          <Text style={styles.sortButtonText}>
            {getCurrentSortLabel()}
          </Text>
          <Text style={styles.sortButtonIcon}>⌄</Text>
        </AnimatedPressable>
      </View>

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        onClose={closeSortModal}
        showDistance={showDistance}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsText: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  sortButtonText: {
    ...typography['body-sm'],
    color: colors.textPrimary,
    fontWeight: '500',
  },
  sortButtonIcon: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    opacity: 0.3,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sortOptions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  sortOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  sortOptionContent: {
    flex: 1,
  },
  sortOptionLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  sortOptionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  sortOptionDescription: {
    ...typography['body-sm'],
    color: colors.textSecondary,
  },
  sortOptionDescriptionSelected: {
    color: colors.primary,
    opacity: 0.8,
  },
  sortOptionCheck: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
})