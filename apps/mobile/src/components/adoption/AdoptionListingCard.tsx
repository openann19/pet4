/**
 * AdoptionListingCard Component for Mobile
 *
 * Premium listing card with image carousel, favorite button, premium badges,
 * and mobile-first interaction patterns. Features Reanimated animations
 * and haptic feedback.
 *
 * @example
 * <AdoptionListingCard
 *   listing={adoptionListing}
 *   onPress={handleCardPress}
 *   onFavoritePress={handleFavoritePress}
 *   onContactPress={handleContactPress}
 *   isFavorited={false}
 * />
 */
import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Layout,
  FadeInUp,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import type { AdoptionListing } from '@/hooks/api/use-adoption-marketplace'
import { colors } from '@/theme/colors'
import { typography, spacing } from '@/theme/typography'
import { createLogger } from '@/utils/logger'

const logger = createLogger('AdoptionListingCard')

const { width: screenWidth } = Dimensions.get('window')
const CARD_MARGIN = spacing.lg
const CARD_WIDTH = screenWidth - (CARD_MARGIN * 2)
const IMAGE_HEIGHT = 240
const CAROUSEL_DOT_SIZE = 8

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface AdoptionListingCardProps {
  readonly listing: AdoptionListing
  readonly onPress: (listing: AdoptionListing) => void
  readonly onFavoritePress: (listing: AdoptionListing) => void
  readonly onContactPress: (listing: AdoptionListing) => void
  readonly isFavorited: boolean
  readonly showDistance?: boolean
  readonly distance?: number
}

interface ImageCarouselProps {
  readonly images: readonly string[]
  readonly petName: string
  readonly featured: boolean
  readonly onImagePress: () => void
}

function ImageCarousel({ images, petName, featured, onImagePress }: ImageCarouselProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const scale = useSharedValue(1)
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / CARD_WIDTH)
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex])
  
  const handleImagePress = useCallback(() => {
    // Animate image press
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 150)
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    onImagePress()
  }, [onImagePress, scale])
  
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale])
  
  // Show first image if no images provided
  const displayImages = images.length > 0 ? images : ['/api/placeholder/pet']
  
  return (
    <View style={styles.imageContainer}>
      {/* Featured Badge */}
      {featured && (
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={styles.featuredBadge}
        >
          <Text style={styles.featuredBadgeText}>✨ Featured</Text>
        </Animated.View>
      )}
      
      {/* Image Carousel */}
      <AnimatedPressable
        style={[styles.imageWrapper, imageAnimatedStyle]}
        onPress={handleImagePress}
        accessible
        accessibilityLabel={`View photos of ${petName}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view full screen photos"
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageScroll}
          contentContainerStyle={styles.imageScrollContent}
        >
          {displayImages.map((imageUrl, index) => (
            <Image
              key={`${imageUrl}-${index}`}
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              accessible
              accessibilityLabel={`Photo ${index + 1} of ${displayImages.length} of ${petName}`}
            />
          ))}
        </ScrollView>
      </AnimatedPressable>
      
      {/* Image Indicators */}
      {displayImages.length > 1 && (
        <View style={styles.indicatorContainer}>
          {displayImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

interface PetInfoProps {
  readonly listing: AdoptionListing
  readonly showDistance: boolean | undefined
  readonly distance: number | undefined
}

function PetInfo({ listing, showDistance, distance }: PetInfoProps): React.JSX.Element {
  const formatAge = (age: number): string => {
    if (age < 1) {
      return `${Math.round(age * 12)} months`
    }
    return age === 1 ? '1 year' : `${age} years`
  }
  
  const formatLocation = (): string => {
    const { city, country } = listing.location
    if (showDistance && distance !== undefined) {
      return `${city}, ${country} • ${distance}km away`
    }
    return `${city}, ${country}`
  }
  
  return (
    <View style={styles.infoContainer}>
      {/* Pet Name and Age */}
      <View style={styles.nameRow}>
        <Text style={styles.petName} numberOfLines={1}>
          {listing.petName}
        </Text>
        <View style={styles.ageGenderBadge}>
          <Text style={styles.ageGenderText}>
            {formatAge(listing.petAge)} • {listing.petGender === 'male' ? '♂' : '♀'}
          </Text>
        </View>
      </View>
      
      {/* Breed and Size */}
      <Text style={styles.breedText} numberOfLines={1}>
        {listing.petBreed} • {listing.petSize.charAt(0).toUpperCase() + listing.petSize.slice(1)}
      </Text>
      
      {/* Location */}
      <Text style={styles.locationText} numberOfLines={1}>
        📍 {formatLocation()}
      </Text>
      
      {/* Key Traits */}
      <View style={styles.traitsContainer}>
        {listing.goodWithKids && (
          <View style={styles.traitBadge}>
            <Text style={styles.traitText}>Good with kids</Text>
          </View>
        )}
        {listing.goodWithPets && (
          <View style={styles.traitBadge}>
            <Text style={styles.traitText}>Good with pets</Text>
          </View>
        )}
        {listing.vaccinated && (
          <View style={styles.traitBadge}>
            <Text style={styles.traitText}>Vaccinated</Text>
          </View>
        )}
      </View>
      
      {/* Adoption Fee */}
      {listing.fee && (
        <View style={styles.feeContainer}>
          <Text style={styles.feeText}>
            Adoption fee: ${listing.fee.amount.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  )
}

interface CardActionsProps {
  readonly listing: AdoptionListing
  readonly isFavorited: boolean
  readonly onFavoritePress: () => void
  readonly onContactPress: () => void
}

function CardActions({ listing, isFavorited, onFavoritePress, onContactPress }: CardActionsProps): React.JSX.Element {
  const favoriteScale = useSharedValue(1)
  const contactScale = useSharedValue(1)
  
  const handleFavoritePress = useCallback(() => {
    logger.debug('Favorite button pressed', { listingId: listing.id, isFavorited })
    
    // Animate button
    favoriteScale.value = withSpring(0.8, { damping: 8, stiffness: 500 })
    setTimeout(() => {
      favoriteScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 200)
    
    // Haptic feedback
    void Haptics.impactAsync(
      isFavorited ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    )
    
    onFavoritePress()
  }, [listing.id, isFavorited, onFavoritePress, favoriteScale])
  
  const handleContactPress = useCallback(() => {
    logger.debug('Contact button pressed', { listingId: listing.id })
    
    // Animate button
    contactScale.value = withSpring(0.95, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      contactScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 150)
    
    // Haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    onContactPress()
  }, [listing.id, onContactPress, contactScale])
  
  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }), [favoriteScale])
  
  const contactAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contactScale.value }],
  }), [contactScale])
  
  return (
    <View style={styles.actionsContainer}>
      {/* Favorite Button */}
      <AnimatedPressable
        style={[styles.favoriteButton, favoriteAnimatedStyle]}
        onPress={handleFavoritePress}
        accessible
        accessibilityLabel={isFavorited ? `Remove ${listing.petName} from favorites` : `Add ${listing.petName} to favorites`}
        accessibilityRole="button"
        accessibilityState={{ selected: isFavorited }}
      >
        <Text style={[styles.favoriteIcon, isFavorited && styles.favoriteIconActive]}>
          {isFavorited ? '❤️' : '🤍'}
        </Text>
      </AnimatedPressable>
      
      {/* Contact Button */}
      <AnimatedPressable
        style={[styles.contactButton, contactAnimatedStyle]}
        onPress={handleContactPress}
        accessible
        accessibilityLabel={`Contact about ${listing.petName}`}
        accessibilityRole="button"
        accessibilityHint="Opens contact options"
      >
        <Text style={styles.contactButtonText}>Contact</Text>
      </AnimatedPressable>
    </View>
  )
}

export function AdoptionListingCard({
  listing,
  onPress,
  onFavoritePress,
  onContactPress,
  isFavorited,
  showDistance,
  distance,
}: AdoptionListingCardProps): React.JSX.Element {
  const cardScale = useSharedValue(1)
  
  const handleCardPress = useCallback(() => {
    logger.debug('Card pressed', { listingId: listing.id, petName: listing.petName })
    
    // Animate card press
    cardScale.value = withSpring(0.98, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }, 100)
    
    // Light haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    onPress(listing)
  }, [listing, onPress, cardScale])
  
  const handleFavoritePress = useCallback(() => {
    onFavoritePress(listing)
  }, [listing, onFavoritePress])
  
  const handleContactPress = useCallback(() => {
    onContactPress(listing)
  }, [listing, onContactPress])
  
  const handleImagePress = useCallback(() => {
    // For now, same as card press - can be customized for image gallery
    handleCardPress()
  }, [handleCardPress])
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }), [cardScale])
  
  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify().damping(15).stiffness(300)}
      layout={Layout.springify().damping(15).stiffness(300)}
      style={[styles.card, cardAnimatedStyle]}
    >
      <Pressable
        style={styles.cardContent}
        onPress={handleCardPress}
        accessible
        accessibilityLabel={`${listing.petName}, ${listing.petBreed}, ${listing.petAge} years old`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view full details"
      >
        {/* Image Carousel */}
        <ImageCarousel
          images={listing.petPhotos}
          petName={listing.petName}
          featured={listing.featured}
          onImagePress={handleImagePress}
        />
        
        {/* Pet Information */}
        <PetInfo
          listing={listing}
          showDistance={showDistance}
          distance={distance}
        />
        
        {/* Actions */}
        <CardActions
          listing={listing}
          isFavorited={isFavorited}
          onFavoritePress={handleFavoritePress}
          onContactPress={handleContactPress}
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: IMAGE_HEIGHT,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  imageWrapper: {
    flex: 1,
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  image: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: CAROUSEL_DOT_SIZE,
    height: CAROUSEL_DOT_SIZE,
    borderRadius: CAROUSEL_DOT_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: CAROUSEL_DOT_SIZE * 1.5,
  },
  infoContainer: {
    padding: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  petName: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  ageGenderBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ageGenderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  breedText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography['body-sm'],
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  traitBadge: {
    backgroundColor: colors.success + '20',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  traitText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  feeContainer: {
    marginBottom: spacing.sm,
  },
  feeText: {
    ...typography['body-sm'],
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  favoriteIconActive: {
    transform: [{ scale: 1.1 }],
  },
  contactButton: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    ...typography.button,
    color: colors.card,
    fontWeight: '600',
  },
})