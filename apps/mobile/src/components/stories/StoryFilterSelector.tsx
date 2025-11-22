import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Layout,
  type SharedValue,
} from 'react-native-reanimated'
import { FILTER_CATEGORIES, getFiltersByCategory } from '../../lib/story-templates'
import type { StoryFilter } from '../../lib/story-templates'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)
const AnimatedView = Animated.createAnimatedComponent(View)

interface FilterItemProps {
  filter: StoryFilter
  index: number
  isSelected: boolean
  mediaPreview?: string
  onSelect: (filter: StoryFilter) => void
  onImageRef: (filterId: string) => (ref: Image | null) => void
  reducedMotion: SharedValue<boolean>
}

function FilterItem({
  filter,
  index,
  isSelected,
  mediaPreview,
  onSelect,
  onImageRef,
  reducedMotion,
}: FilterItemProps): JSX.Element {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withTiming(1, timingConfig)
    scale.value = withSpring(1, springConfig)
  }, [opacity, scale])

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = reducedMotion.value ? 1 : scale.value
    return {
      transform: [{ scale: scaleValue }],
      opacity: opacity.value,
    }
  }, [reducedMotion, scale, opacity])

  const handlePress = useCallback(() => {
    if (!reducedMotion.value) {
      scale.value = withSequence(withSpring(0.95, springConfig), withSpring(1, springConfig))
    }
    onSelect(filter)
  }, [filter, onSelect, scale, reducedMotion])

  const handlePressIn = useCallback(() => {
    if (!reducedMotion.value) {
      scale.value = withSpring(0.95, springConfig)
    }
  }, [scale, reducedMotion])

  const handlePressOut = useCallback(() => {
    if (!reducedMotion.value) {
      scale.value = withSpring(1, springConfig)
    }
  }, [scale, reducedMotion])

  return (
    <AnimatedTouchableOpacity
      entering={FadeIn.duration(200).delay(index * 30)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify().damping(15).stiffness(250)}
      style={[styles.filterItem, isSelected && styles.filterItemSelected, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Select filter: ${String(filter.name ?? '')}`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.filterPreview}>
        {mediaPreview ? (
          <Image
            ref={onImageRef(filter.id)}
            source={{ uri: mediaPreview }}
            style={styles.filterImage}
            resizeMode="cover"
            accessibilityLabel={`Preview with ${String(filter.name ?? '')} filter`}
          />
        ) : (
          <View
            style={[
              styles.filterPlaceholder,
              {
                backgroundColor: filter.id === 'filter-none' ? '#667eea' : '#f093fb',
              },
            ]}
          />
        )}
      </View>

      <View style={styles.filterOverlay}>
        <Text style={styles.filterName} numberOfLines={1}>
          {filter.name}
        </Text>
      </View>

      {isSelected && (
        <AnimatedView
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.selectedIndicator}
        >
          <Text style={styles.checkIcon}>✓</Text>
        </AnimatedView>
      )}
    </AnimatedTouchableOpacity>
  )
}

export interface StoryFilterSelectorProps {
  readonly selectedFilter: StoryFilter
  readonly onSelectFilter: (filter: StoryFilter) => void
  readonly mediaPreview?: string
  readonly intensity?: number
  readonly onIntensityChange?: (intensity: number) => void
}

const springConfig = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

const timingConfig = {
  duration: 200,
}

export default function StoryFilterSelector({
  selectedFilter,
  onSelectFilter,
  mediaPreview,
  intensity = 1,
  onIntensityChange,
}: StoryFilterSelectorProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [localIntensity, setLocalIntensity] = useState<number>(intensity)
  const previewRefs = useRef<Map<string, Image>>(new Map())
  const reducedMotion = useReducedMotionSV()

  const filteredFilters = useMemo(() => {
    const categoryFilters = getFiltersByCategory(selectedCategory)
    const normalizedQuery = searchQuery.toLowerCase().trim()

    if (normalizedQuery === '') {
      return categoryFilters
    }

    return categoryFilters.filter(filter => filter.name.toLowerCase().includes(normalizedQuery))
  }, [selectedCategory, searchQuery])

  useEffect(() => {
    // Note: React Native doesn't support CSS filters directly
    // Filters would need to be applied server-side or using Skia
    // This is a placeholder for future filter application
  }, [])

  useEffect(() => {
    setLocalIntensity(intensity)
  }, [intensity])

  const handleIntensityChange = useCallback(
    (value: number) => {
      const newIntensity = Math.max(0, Math.min(1, value))
      setLocalIntensity(newIntensity)
      onIntensityChange?.(newIntensity)
    },
    [onIntensityChange]
  )

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
  }, [])

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  const handleFilterSelect = useCallback(
    (filter: StoryFilter) => {
      onSelectFilter(filter)
    },
    [onSelectFilter]
  )

  const handleImageRef = useCallback((filterId: string) => {
    return (ref: Image | null) => {
      if (isTruthy(ref)) {
        previewRefs.current.set(filterId, ref)
      } else {
        previewRefs.current.delete(filterId)
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search filters..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            accessibilityLabel="Search story filters"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {FILTER_CATEGORIES.map(category => {
            const isSelected = selectedCategory === category.id
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => handleCategorySelect(category.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter category: ${String(category.name ?? '')}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {selectedFilter.id !== 'filter-none' && onIntensityChange && (
        <View style={styles.intensitySection}>
          <View style={styles.intensityHeader}>
            <View style={styles.intensityLabelContainer}>
              <Text style={styles.intensityIcon}>⚙️</Text>
              <Text style={styles.intensityLabel}>Filter Intensity</Text>
            </View>
            <Text style={styles.intensityValue}>{Math.round(localIntensity * 100)}%</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderMin}>0%</Text>
            <TouchableOpacity
              style={styles.sliderTrack}
              onPress={() => {
                // Slider implementation would go here
                // For now, using a simple touch handler
                const newValue = Math.min(1, localIntensity + 0.1)
                handleIntensityChange(newValue)
              }}
              accessibilityRole="adjustable"
              accessibilityLabel="Filter intensity slider"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(localIntensity * 100),
              }}
            >
              <View style={[styles.sliderFill, { width: `${localIntensity * 100}%` }]} />
            </TouchableOpacity>
            <Text style={styles.sliderMax}>100%</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersGrid}
        showsVerticalScrollIndicator={false}
      >
        {filteredFilters.length > 0 ? (
          filteredFilters.map((filter, index) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              index={index}
              isSelected={selectedFilter.id === filter.id}
              {...(mediaPreview && { mediaPreview })}
              onSelect={handleFilterSelect}
              onImageRef={handleImageRef}
              reducedMotion={reducedMotion}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No filters found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different search or category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  searchSection: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  intensityIcon: {
    fontSize: 16,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'var(--color-bg-overlay)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  categoriesContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'var(--color-bg-overlay)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: 'var(--color-accent-secondary-9)',
    borderColor: 'var(--color-accent-secondary-9)',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTextSelected: {
    color: 'var(--color-bg-overlay)',
  },
  intensitySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  intensityValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderMin: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 32,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: 'var(--color-accent-secondary-9)',
    borderRadius: 2,
  },
  sliderMax: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 32,
  },
  filtersScrollView: {
    flex: 1,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 8,
  },
  filterItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filterItemSelected: {
    borderColor: 'var(--color-accent-secondary-9)',
    borderWidth: 3,
  },
  filterPreview: {
    width: '100%',
    height: '100%',
  },
  filterImage: {
    width: '100%',
    height: '100%',
  },
  filterPlaceholder: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  filterName: {
    fontSize: 10,
    fontWeight: '600',
    color: 'var(--color-bg-overlay)',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'var(--color-accent-secondary-9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
})
