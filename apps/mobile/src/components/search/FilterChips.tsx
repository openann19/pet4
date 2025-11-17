/**
 * FilterChips Component for Mobile Adoption Marketplace
 *
 * Displays active filters as removable chips with premium UX,
 * Reanimated animations, and haptic feedback.
 *
 * @example
 * <FilterChips
 *   filters={{
 *     species: ['dog', 'cat'],
 *     size: ['small'],
 *     ageMax: 2
 *   }}
 *   onRemoveFilter={handleRemoveFilter}
 *   onClearAll={handleClearAll}
 * />
 */
import React, { useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Layout,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import type { AdoptionListingFilters } from '@/hooks/api/use-adoption-marketplace'
import { colors } from '@/theme/colors'
import { typography, spacing } from '@/theme/typography'
import { createLogger } from '@/utils/logger'

const logger = createLogger('FilterChips')

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface FilterChipsProps {
  readonly filters: AdoptionListingFilters
  readonly onRemoveFilter: (filterKey: keyof AdoptionListingFilters, value?: string | number) => void
  readonly onClearAll: () => void
}

interface FilterChip {
  readonly key: string
  readonly label: string
  readonly filterKey: keyof AdoptionListingFilters
  readonly value?: string | number
}

// Helper to format filter values into user-friendly labels
function formatFilterValue(key: keyof AdoptionListingFilters, value: unknown): string {
  switch (key) {
    case 'species':
      return Array.isArray(value) ? value.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : String(value)
    case 'breed':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'size':
      return Array.isArray(value) ? value.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : String(value)
    case 'ageMin':
      return `Age ${value}+`
    case 'ageMax':
      return `Age ≤${value}`
    case 'location':
      return `Near ${value}`
    case 'maxDistance':
      return `Within ${value}km`
    case 'goodWithKids':
      return 'Good with kids'
    case 'goodWithPets':
      return 'Good with pets'
    case 'goodWithCats':
      return 'Good with cats'
    case 'goodWithDogs':
      return 'Good with dogs'
    case 'energyLevel':
      return Array.isArray(value) ? value.map(e => `${e.charAt(0).toUpperCase() + e.slice(1)} energy`).join(', ') : `${value} energy`
    case 'temperament':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'vaccinated':
      return 'Vaccinated'
    case 'spayedNeutered':
      return 'Spayed/Neutered'
    case 'feeMax':
      return `Fee ≤$${value}`
    case 'featured':
      return 'Featured'
    case 'sortBy':
      return `Sort: ${value}`
    default:
      return String(value)
  }
}

// Convert filters object to array of filter chips
function filtersToChips(filters: AdoptionListingFilters): FilterChip[] {
  const chips: FilterChip[] = []
  
  Object.entries(filters).forEach(([key, value]) => {
    const filterKey = key as keyof AdoptionListingFilters
    
    if (value === undefined || value === null) return
    
    if (Array.isArray(value)) {
      if (value.length === 0) return
      // For arrays, create one chip for the entire array
      chips.push({
        key: `${key}-all`,
        label: formatFilterValue(filterKey, value),
        filterKey,
      })
    } else if (typeof value === 'boolean') {
      if (value) {
        chips.push({
          key,
          label: formatFilterValue(filterKey, value),
          filterKey,
        })
      }
    } else {
      chips.push({
        key,
        label: formatFilterValue(filterKey, value),
        filterKey,
        value,
      })
    }
  })
  
  return chips
}

function FilterChipComponent({
  chip,
  onRemove,
}: {
  readonly chip: FilterChip
  readonly onRemove: (filterKey: keyof AdoptionListingFilters, value?: string | number) => void
}): React.JSX.Element {
  const scale = useSharedValue(1)
  
  const handlePress = useCallback(() => {
    logger.debug('Filter chip removed', { filterKey: chip.filterKey, value: chip.value })
    
    // Animate press
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 100)
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    onRemove(chip.filterKey, chip.value)
  }, [chip.filterKey, chip.value, onRemove, scale])
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale])
  
  return (
    <AnimatedPressable
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
      layout={Layout.springify().damping(15).stiffness(300)}
      style={[styles.chip, animatedStyle]}
      onPress={handlePress}
      accessible
      accessibilityLabel={`Remove filter: ${chip.label}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to remove this filter"
    >
      <Text style={styles.chipText}>{chip.label}</Text>
      <View style={styles.chipRemove}>
        <Text style={styles.chipRemoveIcon}>✕</Text>
      </View>
    </AnimatedPressable>
  )
}

export function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps): React.JSX.Element | null {
  const chips = filtersToChips(filters)
  
  const handleClearAll = useCallback(() => {
    logger.debug('All filters cleared', { chipCount: chips.length })
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    onClearAll()
  }, [chips.length, onClearAll])
  
  // Don't render if no active filters
  if (chips.length === 0) {
    return null
  }
  
  return (
    <Animated.View
      entering={FadeInRight.duration(400)}
      exiting={FadeOutLeft.duration(300)}
      style={styles.container}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {chips.map((chip) => (
          <FilterChipComponent
            key={chip.key}
            chip={chip}
            onRemove={onRemoveFilter}
          />
        ))}
        
        {/* Clear All Button */}
        {chips.length > 1 && (
          <Animated.View
            entering={FadeInRight.delay(100).duration(300)}
            exiting={FadeOutLeft.duration(200)}
            layout={Layout.springify().damping(15).stiffness(300)}
          >
            <Pressable
              style={styles.clearAllButton}
              onPress={handleClearAll}
              accessible
              accessibilityLabel="Clear all filters"
              accessibilityRole="button"
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: spacing.lg, // Extra padding for last item
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    minHeight: 32,
  },
  chipText: {
    ...typography['body-sm'],
    color: colors.textPrimary,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  chipRemove: {
    backgroundColor: colors.accent + '30',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveIcon: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  clearAllButton: {
    backgroundColor: colors.textSecondary + '15',
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    fontWeight: '600',
  },
})