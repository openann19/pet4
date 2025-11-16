/**
 * FilterChips Component for Mobile Adoption Marketplace
 *
 * Dynamic filter display with removable chips and animations.
 * Shows active filters with clear all functionality.
 *
 * @example
 * <FilterChips
 *   filters={filters} 
 *   onRemoveFilter={handleRemoveFilter}
 *   onClearAll={handleClearAll}
 * />
 */
import React, { useCallback, useMemo } from 'react'
import {
  Text,  
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Animated, {
  FadeInRight,
  FadeOutLeft,
  Layout,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

// Type definition for adoption filters
interface AdoptionFilters {
  readonly petType?: string
  readonly breed?: readonly string[]
  readonly size?: readonly string[]
  readonly age?: { readonly min?: number; readonly max?: number }
  readonly location?: string
  readonly maxDistance?: number
  readonly gender?: string
  readonly goodWithKids?: boolean
  readonly goodWithPets?: boolean
  readonly vaccinated?: boolean
  readonly spayedNeutered?: boolean
  readonly sortBy?: string
}
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/typography'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('FilterChips')

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface FilterChipsProps {
  readonly filters: AdoptionFilters
  readonly onRemoveFilter: (filterKey: keyof AdoptionFilters, value?: string | number | boolean) => void
  readonly onClearAll: () => void
}

interface FilterChip {
  readonly key: string
  readonly label: string
  readonly value: string | number | boolean
  readonly filterKey: keyof AdoptionFilters
}

export function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps): React.JSX.Element | null {
  const filterChips = useMemo((): readonly FilterChip[] => {
    const chips: FilterChip[] = []

    Object.entries(filters).forEach(([key, value]) => {
      const filterKey = key as keyof AdoptionFilters

      if (value === undefined || value === null) return

      switch (filterKey) {
        case 'petType':
          if (typeof value === 'string') {
            chips.push({
              key: `${filterKey}-${value}`,
              label: value.charAt(0).toUpperCase() + value.slice(1),
              value,
              filterKey,
            })
          }
          break

        case 'breed':
          if (Array.isArray(value) && value.length > 0) {
            value.forEach((breed) => {
              chips.push({
                key: `${filterKey}-${breed}`,
                label: breed,
                value: breed,
                filterKey,
              })
            })
          }
          break

        case 'size':
          if (Array.isArray(value) && value.length > 0) {
            value.forEach((size) => {
              chips.push({
                key: `${filterKey}-${size}`,
                label: size.charAt(0).toUpperCase() + size.slice(1),
                value: size,
                filterKey, 
              })
            })
          }
          break

        case 'age':
          if (typeof value === 'object' && value !== null) {
            const ageRange = value as { min?: number; max?: number }
            if (ageRange.min !== undefined || ageRange.max !== undefined) {
              const minLabel = ageRange.min !== undefined ? `${ageRange.min}+` : ''
              const maxLabel = ageRange.max !== undefined ? `≤${ageRange.max}` : ''
              const label = minLabel && maxLabel 
                ? `${ageRange.min}-${ageRange.max} years`
                : minLabel ? `${minLabel} years` : `${maxLabel} years`
              
              chips.push({
                key: `${filterKey}-range`,
                label,
                value: JSON.stringify(ageRange),
                filterKey,
              })
            }
          }
          break

        case 'location':
          if (typeof value === 'string') {
            chips.push({
              key: `${filterKey}-${value}`,
              label: `📍 ${value}`,
              value,
              filterKey,
            })
          }
          break

        case 'maxDistance':
          if (typeof value === 'number') {
            chips.push({
              key: `${filterKey}-${value}`,
              label: `Within ${value}km`,
              value,
              filterKey,
            })
          }
          break

        case 'gender':
          if (typeof value === 'string') {
            chips.push({
              key: `${filterKey}-${value}`,
              label: value === 'male' ? '♂ Male' : '♀ Female',
              value,
              filterKey,
            })
          }
          break

        case 'goodWithKids':
        case 'goodWithPets':
        case 'vaccinated':
        case 'spayedNeutered':
          if (value === true) {
            const labels = {
              goodWithKids: '👶 Good with kids',
              goodWithPets: '🐕 Good with pets', 
              vaccinated: '💉 Vaccinated',
              spayedNeutered: '✂️ Spayed/Neutered',
            }
            chips.push({
              key: `${filterKey}-true`,
              label: labels[filterKey],
              value: true,
              filterKey,
            })
          }
          break

        case 'sortBy':
          // Don't show sort as a chip
          break

        default:
          // Handle any other filters generically
          if (typeof value === 'string' || typeof value === 'number') {
            chips.push({
              key: `${filterKey}-${value}`,
              label: String(value),
              value,
              filterKey,
            })
          }
          break
      }
    })

    return chips
  }, [filters])

  const handleRemoveChip = useCallback((chip: FilterChip) => {
    logger.debug('Removing filter chip', { key: chip.key, filterKey: chip.filterKey })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onRemoveFilter(chip.filterKey, chip.value)
  }, [onRemoveFilter])

  const handleClearAll = useCallback(() => {
    logger.debug('Clearing all filters', { count: filterChips.length })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onClearAll()
  }, [onClearAll, filterChips.length])

  if (filterChips.length === 0) {
    return null
  }

  return (
    <Animated.View
      layout={Layout.springify().damping(15).stiffness(300)}
      style={styles.container}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterChips.map((chip) => (
          <AnimatedPressable
            key={chip.key}
            entering={FadeInRight.duration(300).springify()}
            exiting={FadeOutLeft.duration(200)}
            layout={Layout.springify().damping(15).stiffness(300)}
            style={styles.chip}
            onPress={() => handleRemoveChip(chip)}
            accessible
            accessibilityLabel={`Remove ${chip.label} filter`}
            accessibilityRole="button"
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {chip.label}
            </Text>
            <Text style={styles.chipRemove}>✕</Text>
          </AnimatedPressable>
        ))}

        {/* Clear All Button */}
        {filterChips.length > 1 && (
          <AnimatedPressable
            entering={FadeInRight.delay(100).duration(300).springify()}
            exiting={FadeOutLeft.duration(200)}
            layout={Layout.springify().damping(15).stiffness(300)}
            style={styles.clearAllButton}
            onPress={handleClearAll}
            accessible
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </AnimatedPressable>
        )}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    maxWidth: 200,
  },
  chipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  chipRemove: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    opacity: 0.7,
  },
  clearAllButton: {
    backgroundColor: colors.danger + '20',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
})