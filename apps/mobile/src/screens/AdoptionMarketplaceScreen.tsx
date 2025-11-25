/**
 * AdoptionMarketplaceScreen Component
 *
 * Mobile adoption marketplace screen with premium UX matching web experience.
 * Features premium cards, filters, segmented control, and Reanimated animations.
 *
 * @example
 * <AdoptionMarketplaceScreen />
 */
import React, { useCallback } from 'react'
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Animated, FadeInUp, FadeInDown, FadeOutLeft } from '@petspark/motion'
import * as Haptics from 'expo-haptics'

import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { useAdoptionMarketplace, type AdoptionListing } from '../hooks/api/use-adoption-marketplace'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { SearchBar } from '../components/adoption/SearchBar'
import { FilterChips } from '../components/adoption/FilterChips'
import { PremiumControlStrip, type SortOption } from '../components/adoption/PremiumControlStrip'
import { AdoptionListingCard } from '../components/adoption/AdoptionListingCard'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/typography'
import { getTranslations } from '@mobile/i18n/translations'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('AdoptionMarketplaceScreen')
const _language = 'en'
const _t = getTranslations(_language)

type ViewMode = 'browse' | 'my-listings' | 'applications'

interface SegmentedControlProps {
  options: Array<{ label: string; value: ViewMode }>
  value: ViewMode
  onChange: (value: ViewMode) => void
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps): React.JSX.Element {
  return (
    <View style={styles.segmentedContainer}>
      {options.map((option, index) => {
        const isSelected = option.value === value
        const isFirst = index === 0
        const isLast = index === options.length - 1

        return (
          <Pressable
            key={option.value}
            style={[
              styles.segmentButton,
              isSelected && styles.segmentButtonActive,
              isFirst && styles.segmentButtonFirst,
              isLast && styles.segmentButtonLast,
            ]}
            onPress={() => {
              if (option.value !== value) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onChange(option.value)
              }
            }}
            accessible
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function AdoptionMarketplaceScreenContent(): React.JSX.Element {
  const networkStatus = useNetworkStatus()
  const {
    listings: _listings,
    loading,
    error: _error,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    currentUser: _currentUser,
    hasMore: _hasMore,
    filteredListings,
    activeFilterCount,
    mode: activeMode,
    setMode: setActiveMode,
    userListings,
    userListingsLoading,
    refreshListings,
    incrementView,
  } = useAdoptionMarketplace()

  const handleModeChange = useCallback((mode: ViewMode) => {
    setActiveMode(mode)
  }, [setActiveMode])

  const handleFiltersPress = useCallback(() => {
    // TODO: Implement filter modal
    logger.debug('Filters pressed', { activeFilterCount })
  }, [activeFilterCount])

  const handleRemoveFilter = useCallback((filterKey: keyof typeof filters, _value?: string | number | boolean) => {
    const newFilters = { ...filters }

    if (Array.isArray(newFilters[filterKey])) {
      // For array filters, remove the entire array
      delete newFilters[filterKey]
    } else {
      // For single value filters, remove the value
      delete newFilters[filterKey]
    }

    setFilters(newFilters)
  }, [filters, setFilters])

  const handleClearAllFilters = useCallback(() => {
    setFilters({})
  }, [setFilters])

  const handleSortChange = useCallback((sort: SortOption) => {
    // Map UI SortOption to API sortBy format
    const sortByMap: Record<SortOption, 'recent' | 'distance' | 'age' | 'fee_low' | 'fee_high'> = {
      'recent': 'recent',
      'distance': 'distance',
      'age-young': 'age',
      'age-old': 'age',
      'price-low': 'fee_low',
      'price-high': 'fee_high',
    }
    setFilters({ ...filters, sortBy: sortByMap[sort] })
  }, [filters, setFilters])

  const handleCardPress = useCallback((listing: AdoptionListing) => {
    logger.debug('Card pressed', { listingId: listing.id, petName: listing.petName })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Increment view count
    incrementView(listing.id)

    // TODO: Navigate to listing detail screen
    // navigation.navigate('AdoptionDetail', { listingId: listing.id })
  }, [incrementView])

  const handleFavoritePress = useCallback((listing: AdoptionListing) => {
    logger.debug('Favorite pressed', { listingId: listing.id, petName: listing.petName })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // TODO: Implement favorite toggle
    // toggleFavorite(listing.id)
  }, [])

  const handleContactPress = useCallback((listing: AdoptionListing) => {
    logger.debug('Contact pressed', { listingId: listing.id, petName: listing.petName })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // TODO: Navigate to contact modal or chat
    // navigation.navigate('ContactSeller', { listingId: listing.id })
  }, [])

  const segmentOptions = [
    { label: 'Browse', value: 'browse' as ViewMode },
    { label: 'My Listings', value: 'my-listings' as ViewMode },
    { label: 'Applications', value: 'applications' as ViewMode },
  ]

  const renderLoadingState = () => (
    <Animated.View
      entering={FadeInUp.delay(100).duration(300)}
      style={styles.loadingContainer}
    >
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Loading pets...</Text>
    </Animated.View>
  )

  const renderEmptyState = () => {
    const _currentListings = activeMode === 'browse' ? filteredListings :
      activeMode === 'my-listings' ? userListings : []

    return (
      <Animated.View
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.emptyContainer}
      >
        <Text style={styles.emptyIcon}>🐾</Text>
        <Text style={styles.emptyTitle}>
          {activeMode === 'browse' ? 'No pets available' :
            activeMode === 'my-listings' ? 'No listings yet' : 'No applications yet'}
        </Text>
        <Text style={styles.emptyDescription}>
          {activeMode === 'browse'
            ? searchQuery ? `No pets found matching "${searchQuery}"` : 'Check back soon for new pets looking for their forever homes.'
            : activeMode === 'my-listings'
              ? 'Create your first listing to help pets find their forever homes.'
              : 'Applications will appear here when you apply for pets.'}
        </Text>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel="Adoption Marketplace"
      accessibilityRole="none"
    >
      <View style={styles.container}>
        {!networkStatus.isConnected && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <OfflineIndicator />
          </Animated.View>
        )}

        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>❤️</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>Adoption Marketplace</Text>
              <Text style={styles.subtitle}>
                Find your perfect companion and give them a loving forever home
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Mode Segmented Control */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.controlSection}
        >
          <SegmentedControl
            options={segmentOptions}
            value={activeMode}
            onChange={handleModeChange}
          />
        </Animated.View>

        {/* Search Bar - Only show for browse mode */}
        {activeMode === 'browse' && (
          <Animated.View
            entering={FadeInUp.delay(150).duration(400)}
            exiting={FadeOutLeft.duration(200)}
          >
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search pets by name, breed, or location..."
              showFilters
              activeFilterCount={activeFilterCount}
              onFiltersPress={handleFiltersPress}
            />
          </Animated.View>
        )}

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Control Strip */}
        {activeMode === 'browse' && (
          <PremiumControlStrip
            totalCount={filteredListings.length}
            currentSort={(() => {
              // Map API sortBy to UI SortOption
              const sortBy = filters.sortBy
              if (!sortBy) return 'recent'
              const sortMap: Record<'recent' | 'distance' | 'age' | 'fee_low' | 'fee_high', SortOption> = {
                'recent': 'recent',
                'distance': 'distance',
                'age': 'age-young', // Default to young for age
                'fee_low': 'price-low',
                'fee_high': 'price-high',
              }
              return sortMap[sortBy] || 'recent'
            })()}
            onSortChange={handleSortChange}
            loading={loading}
            showDistance={!!filters.location}
          />
        )}

        {/* Content */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.content}
        >
          {activeMode === 'browse' && (
            loading ? renderLoadingState() : (
              <FlatList
                data={filteredListings}
                renderItem={({ item }) => (
                  <AdoptionListingCard
                    listing={item}
                    onPress={handleCardPress}
                    onFavoritePress={handleFavoritePress}
                    onContactPress={handleContactPress}
                    isFavorited={false} // TODO: Get from favorites state
                    showDistance={!!filters.location}
                    {...(filters.location ? { distance: 5.2 } : {})} // TODO: Calculate actual distance
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                onRefresh={refreshListings}
                refreshing={loading}
              />
            )
          )}

          {activeMode === 'my-listings' && (
            userListingsLoading ? renderLoadingState() : (
              <FlatList
                data={userListings}
                renderItem={({ item }) => (
                  <AdoptionListingCard
                    listing={item}
                    onPress={handleCardPress}
                    onFavoritePress={handleFavoritePress}
                    onContactPress={handleContactPress}
                    isFavorited={false} // TODO: Get from favorites state
                    showDistance={false} // Don't show distance for own listings
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                onRefresh={refreshListings}
                refreshing={userListingsLoading}
              />
            )
          )}
          {activeMode === 'applications' && renderEmptyState()}
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

export function AdoptionMarketplaceScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('AdoptionMarketplaceScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <AdoptionMarketplaceScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography['body-sm'],
    color: colors.textSecondary,
  },
  controlSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  segmentButtonFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyDescription: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  loadingText: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
})
