/**
 * SearchBar Component for Mobile Adoption Marketplace
 *
 * Premium search input with haptic feedback, animations, and filter integration.
 * Features focus animations, clear button, and filter badge.
 *
 * @example
 * <SearchBar
 *   value={query}
 *   onChangeText={setQuery}
 *   placeholder="Search pets..."
 *   showFilters
 *   activeFilterCount={2}
 *   onFiltersPress={handleFilters}
 * />
 */
import React, { useRef, useCallback } from 'react'
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  type TextInputProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/typography'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('SearchBar')

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly placeholder?: string
  readonly showFilters?: boolean
  readonly activeFilterCount?: number
  readonly onFiltersPress?: () => void
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  showFilters = false,
  activeFilterCount = 0,
  onFiltersPress,
  ...textInputProps
}: SearchBarProps): React.JSX.Element {
  const inputRef = useRef<TextInput>(null)
  const focusState = useSharedValue(0)
  const clearScale = useSharedValue(1)
  const filterScale = useSharedValue(1)

  const handleFocus = useCallback(() => {
    logger.debug('Search input focused')
    focusState.value = withTiming(1, { duration: 200 })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [focusState])

  const handleBlur = useCallback(() => {
    logger.debug('Search input blurred')
    focusState.value = withTiming(0, { duration: 200 })
  }, [focusState])

  const handleClear = useCallback(() => {
    logger.debug('Search cleared')
    clearScale.value = withSpring(0.8, { damping: 10, stiffness: 500 })
    setTimeout(() => {
      clearScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 150)
    
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChangeText('')
    inputRef.current?.focus()
  }, [onChangeText, clearScale])

  const handleFiltersPress = useCallback(() => {
    if (!onFiltersPress) return

    logger.debug('Filters button pressed', { activeFilterCount })
    filterScale.value = withSpring(0.9, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      filterScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 150)
    
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onFiltersPress()
  }, [onFiltersPress, activeFilterCount, filterScale])

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusState.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
    shadowOpacity: focusState.value * 0.1,
  }))

  const clearAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearScale.value }],
    opacity: value.length > 0 ? 1 : 0,
  }))

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterScale.value }],
  }))

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.searchIcon}>
        <Text style={styles.searchIconText}>🔍</Text>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessible
        accessibilityLabel="Search input"
        accessibilityRole="search"
        {...textInputProps}
      />

      {/* Clear Button */}
      <AnimatedPressable
        style={[styles.clearButton, clearAnimatedStyle]}
        onPress={handleClear}
        accessible
        accessibilityLabel="Clear search"
        accessibilityRole="button"
      >
        <Text style={styles.clearIcon}>✕</Text>
      </AnimatedPressable>

      {/* Filter Button */}
      {showFilters && (
        <AnimatedPressable
          style={[styles.filterButton, filterAnimatedStyle]}
          onPress={handleFiltersPress}
          accessible
          accessibilityLabel={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          accessibilityRole="button"
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </AnimatedPressable>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchIconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButton: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
})