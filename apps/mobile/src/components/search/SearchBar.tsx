/**
 * Premium SearchBar Component for Mobile
 *
 * Mobile-optimized search input with premium UX, haptic feedback,
 * and Reanimated micro-interactions.
 *
 * @example
 * <SearchBar 
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search pets..."
 *   showFilters
 *   activeFilterCount={3}
 *   onFiltersPress={handleFiltersPress}
 * />
 */
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type TextInputSubmitEditingEventData,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { colors } from '@/theme/colors'
import { typography, spacing } from '@/theme/typography'
import { createLogger } from '@/utils/logger'

const logger = createLogger('SearchBar')

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface SearchBarProps extends Omit<TextInputProps, 'style' | 'onFocus' | 'onBlur' | 'onSubmitEditing'> {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly placeholder?: string
  readonly showFilters?: boolean
  readonly activeFilterCount?: number
  readonly onFiltersPress?: () => void
  readonly onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  readonly onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  readonly onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void
  readonly disabled?: boolean
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  showFilters = false,
  activeFilterCount = 0,
  onFiltersPress,
  onFocus,
  onBlur,
  onSubmitEditing,
  disabled = false,
  ...textInputProps
}: SearchBarProps): React.JSX.Element {
  const [_isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  
  // Animation values
  const focusScale = useSharedValue(1)
  const borderProgress = useSharedValue(0)
  const filterButtonScale = useSharedValue(1)
  const clearButtonScale = useSharedValue(0)

  // Focus/blur animation spring config
  const springConfig = {
    damping: 15,
    stiffness: 300,
    mass: 0.8,
  }

  // Handle focus with haptic feedback
  const handleFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (disabled) return
    
    logger.debug('SearchBar focused')
    setIsFocused(true)
    
    // Animate focus state
    focusScale.value = withSpring(1.02, springConfig)
    borderProgress.value = withTiming(1, { duration: 200 })
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    onFocus?.(e)
  }, [disabled, focusScale, borderProgress, onFocus, springConfig])

  // Handle blur
  const handleBlur = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    logger.debug('SearchBar blurred')
    setIsFocused(false)
    
    // Animate blur state
    focusScale.value = withSpring(1, springConfig)
    borderProgress.value = withTiming(0, { duration: 300 })
    
    onBlur?.(e)
  }, [focusScale, borderProgress, onBlur, springConfig])

  // Handle text change with clear button animation
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text)
    
    // Animate clear button visibility
    const shouldShow = text.length > 0 ? 1 : 0
    clearButtonScale.value = withSpring(shouldShow, {
      damping: 12,
      stiffness: 250,
    })
  }, [onChangeText, clearButtonScale])

  // Handle clear button press
  const handleClearPress = useCallback(() => {
    logger.debug('SearchBar cleared')
    onChangeText('')
    inputRef.current?.focus()
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [onChangeText])

  // Handle filter button press
  const handleFiltersPress = useCallback(() => {
    if (!onFiltersPress) return
    
    logger.debug('Filter button pressed', { activeFilterCount })
    
    // Animate button press
    filterButtonScale.value = withSpring(0.95, { damping: 10, stiffness: 400 })
    
    setTimeout(() => {
      filterButtonScale.value = withSpring(1, springConfig)
    }, 100)
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    onFiltersPress()
  }, [onFiltersPress, activeFilterCount, filterButtonScale, springConfig])

  // Handle submit editing
  const handleSubmitEditing = useCallback((e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    logger.debug('SearchBar submitted', { query: value })
    inputRef.current?.blur()
    
    // Haptic feedback for search submission
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    onSubmitEditing?.(e)
  }, [value, onSubmitEditing])

  // Initialize clear button state
  useEffect(() => {
    clearButtonScale.value = value.length > 0 ? 1 : 0
  }, [value, clearButtonScale])

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      [colors.border, colors.accent]
    ),
  }), [focusScale, borderProgress])

  const clearButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearButtonScale.value }],
    opacity: clearButtonScale.value,
  }), [clearButtonScale])

  const filterButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterButtonScale.value }],
  }), [filterButtonScale])

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          disabled && styles.containerDisabled,
          containerAnimatedStyle,
        ]}
      >
        {/* Search Icon */}
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="never" // We use custom clear button
          editable={!disabled}
          selectTextOnFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          accessible
          accessibilityLabel={`Search input. ${placeholder}`}
          accessibilityHint="Enter search terms to find pets"
          accessibilityRole="search"
          {...textInputProps}
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <Animated.View style={clearButtonAnimatedStyle}>
            <Pressable
              style={styles.clearButton}
              onPress={handleClearPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessible
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              disabled={disabled}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>

      {/* Filter Button */}
      {showFilters && (
        <AnimatedPressable
          style={[styles.filterButton, filterButtonAnimatedStyle]}
          onPress={handleFiltersPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityLabel={`Filters. ${activeFilterCount > 0 ? `${activeFilterCount} active` : 'No filters active'}`}
          accessibilityRole="button"
          disabled={disabled}
        >
          <View style={styles.filterButtonContent}>
            <Text style={styles.filterIcon}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {activeFilterCount > 9 ? '9+' : activeFilterCount}
                </Text>
              </View>
            )}
          </View>
        </AnimatedPressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDisabled: {
    opacity: 0.6,
    backgroundColor: colors.surface,
  },
  searchIconContainer: {
    paddingRight: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  clearButton: {
    padding: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.textSecondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
})