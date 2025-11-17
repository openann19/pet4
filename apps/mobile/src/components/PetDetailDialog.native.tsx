import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native'
import { Animated } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { Dialog } from './ui/Dialog.native'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.native'
import { Badge } from './ui/badge.native'
import type { Pet } from '@/lib/types'
import {
  Calendar,
  CaretLeft,
  CaretRight,
  ChatCircle,
  GenderFemale,
  GenderMale,
  Heart,
  MapPin,
  PawPrint,
  Ruler,
  ShieldCheck,
  Star,
} from '@phosphor-icons/react'
import { isTruthy } from '@petspark/shared'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const DIMENS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
  },
  component: {
    touchTargetMin: 44,
  },
} as const
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

interface PetDetailDialogProps {
  readonly pet: Pet | null
  readonly visible: boolean
  readonly onClose: () => void
}

interface PetRatingsProps {
  readonly trustProfile: NonNullable<Pet['trustProfile']>
}

function PetRatings({ trustProfile }: PetRatingsProps): React.JSX.Element {
  const overallRating = trustProfile.overallRating || 0
  const totalReviews = trustProfile.totalReviews || 0

  return (
    <Card style={styles.ratingsCard}>
      <CardHeader>
        <CardTitle style={styles.ratingsTitle}>Trust & Safety</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.ratingRow}>
          <View style={styles.ratingStars}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                weight={i < Math.floor(overallRating) ? 'fill' : 'regular'}
                color={i < Math.floor(overallRating) ? '#fbbf24' : '#d1d5db'}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {overallRating.toFixed(1)} ({totalReviews} reviews)
          </Text>
        </View>
        {trustProfile.responseRate !== undefined && trustProfile.responseRate > 0 && (
          <Text style={styles.responseRateText}>
            {trustProfile.responseRate}% response rate
          </Text>
        )}
      </CardContent>
    </Card>
  )
}

interface TrustBadgesProps {
  readonly badges: readonly string[]
}

function TrustBadges({ badges }: TrustBadgesProps): React.JSX.Element {
  if (!badges || !Array.isArray(badges) || badges.length === 0) return <></>

  return (
    <View style={styles.badgesContainer}>
      {badges.map((badge, index) => (
        <Badge key={index} variant="secondary" style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </Badge>
      ))}
    </View>
  )
}

function Separator(): React.JSX.Element {
  return <View style={styles.separator} />
}

function PetBio({ pet }: { pet: Pet }): React.JSX.Element | null {
  if (!pet.bio) return null

  return (
    <Card style={styles.sectionCard}>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <ChatCircle size={16} weight="fill" color="#6366f1" />
          <Text style={styles.sectionTitleText}>About {pet.name}</Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Text style={styles.bioText}>{pet.bio}</Text>
      </CardContent>
    </Card>
  )
}

function PetDetails({ pet }: { pet: Pet }): React.JSX.Element {
  const sizeMap: Record<string, string> = {
    'small': 'Small (< 20 lbs)',
    'medium': 'Medium (20-50 lbs)',
    'large': 'Large (50-100 lbs)',
    'extra-large': 'Extra Large (> 100 lbs)',
  }

  return (
    <Card style={styles.detailCard}>
      <CardHeader>
        <CardTitle style={styles.detailTitle}>
          <PawPrint size={16} weight="fill" color="#6366f1" />
          <Text style={styles.detailTitleText}>Details</Text>
        </CardTitle>
      </CardHeader>
      <CardContent style={styles.detailContent}>
        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Calendar size={16} weight="fill" color="#f59e0b" />
            <Text style={styles.detailLabelText}>Age</Text>
          </View>
          <Text style={styles.detailValue}>{pet.age} years old</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            {pet.gender === 'male' ? (
              <GenderMale size={16} weight="fill" color="#f59e0b" />
            ) : (
              <GenderFemale size={16} weight="fill" color="#f59e0b" />
            )}
            <Text style={styles.detailLabelText}>Gender</Text>
          </View>
          <Text style={styles.detailValue}>
            {pet.gender.toUpperCase()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ruler size={16} weight="fill" color="#f59e0b" />
            <Text style={styles.detailLabelText}>Size</Text>
          </View>
          <Text style={styles.detailValue}>
            {sizeMap[pet.size] || pet.size}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <MapPin size={16} weight="fill" color="#f59e0b" />
            <Text style={styles.detailLabelText}>Location</Text>
          </View>
          <Text style={styles.detailValue}>{pet.location}</Text>
        </View>
      </CardContent>
    </Card>
  )
}

function OwnerInfo({ pet }: { pet: Pet }): React.JSX.Element {
  return (
    <Card style={styles.ownerCard}>
      <CardHeader>
        <CardTitle style={styles.ownerTitle}>
          <Heart size={16} weight="fill" color="#6366f1" />
          <Text style={styles.ownerTitleText}>Owner</Text>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.ownerInfo}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.ownerInitial}>
              {pet.ownerName?.[0]?.toUpperCase() ?? ''}
            </Text>
          </View>
          <View style={styles.ownerDetails}>
            <Text style={styles.ownerName}>{pet.ownerName}</Text>
            <View style={styles.ownerLocation}>
              <MapPin size={12} weight="fill" color="#6b7280" />
              <Text style={styles.ownerLocationText}>{pet.location}</Text>
            </View>
          </View>
        </View>

        {pet.trustProfile && (
          <View style={styles.ownerRating}>
            <View style={styles.ratingStars}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={14}
                  weight={i < Math.floor(pet.trustProfile!.overallRating ?? 0) ? 'fill' : 'regular'}
                  color={i < Math.floor(pet.trustProfile!.overallRating ?? 0) ? '#fbbf24' : '#d1d5db'}
                />
              ))}
            </View>
            <Text style={styles.ownerRatingText}>
              {(pet.trustProfile.overallRating ?? 0).toFixed(1)} ({pet.trustProfile.totalReviews ?? 0} reviews)
            </Text>
            {pet.trustProfile.responseRate && pet.trustProfile.responseRate > 0 && (
              <Text style={styles.responseRate}>
                {pet.trustProfile.responseRate}% response rate
              </Text>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  )
}

function TrustBadges({ badges }: { badges: string[] }): React.JSX.Element {
  return (
    <View style={styles.badgesContainer}>
      {badges.map((badge, index) => (
        <Badge key={index} style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </Badge>
      ))}
    </View>
  )
}

function PetPhotoSection({ pet, currentPhotoIndex, hasMultiplePhotos, handlePrevPhoto, handleNextPhoto }: {
  pet: Pet;
  currentPhotoIndex: number;
  hasMultiplePhotos: boolean;
  handlePrevPhoto: () => void;
  handleNextPhoto: () => void;
}): React.JSX.Element {
  const photos = pet.photos || [pet.photo];
  const currentPhoto = photos[currentPhotoIndex] || pet.photo;

  return (
    <View style={styles.photoContainer}>
      <Image
        source={{ uri: currentPhoto }}
        style={styles.photo}
        resizeMode="cover"
        accessible
        accessibilityLabel={`Photo of ${pet.name ?? ''}, ${currentPhotoIndex + 1} of ${photos.length}`}
      />

      {/* Photo Overlay */}
      <View style={styles.photoOverlay} />

      {/* Navigation Buttons */}
      {hasMultiplePhotos && (
        <>
          <AnimatedTouchableOpacity
            style={styles.navButtonLeft}
            onPress={handlePrevPhoto}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
          >
            <CaretLeft size={24} weight="bold" color="#ffffff" />
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity
            style={styles.navButtonRight}
            onPress={handleNextPhoto}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Next photo"
          >
            <CaretRight size={24} weight="bold" color="#ffffff" />
          </AnimatedTouchableOpacity>
        </>
      )}

      {/* Photo Indicator Dots */}
      {hasMultiplePhotos && (
        <View style={styles.photoIndicator}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                index === currentPhotoIndex && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Pet Info Overlay */}
      <View style={styles.petInfoOverlay}>
        <View style={styles.petNameRow}>
          <Text style={styles.petName}>{pet.name ?? ''}</Text>
          {pet.verified === true && (
            <ShieldCheck size={24} weight="fill" color="#10b981" />
          )}
        </View>

        <View style={styles.petDetailsRow}>
          <View style={styles.petDetail}>
            {pet.gender === 'male' ? (
              <GenderMale size={16} weight="fill" color="#ffffff" />
            ) : (
              <GenderFemale size={16} weight="fill" color="#ffffff" />
            )}
            <Text style={styles.petDetailText}>{pet.age} years</Text>
          </View>

          <View style={styles.petDetailSeparator} />

          <Text style={styles.petBreed}>{pet.breed}</Text>
        </View>

        {hasMultiplePhotos && (
          <Text style={styles.photoCounter}>
            Photo {currentPhotoIndex + 1} of {photos.length}
          </Text>
        )}
      </View>
    </View>
  );
}

function PetContentSection({ pet }: { pet: Pet }): React.JSX.Element {
  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible
    >
      {/* Trust Profile */}
      {pet.trustProfile && (
        <PetRatings trustProfile={pet.trustProfile} />
      )}

      {/* Bio */}
      <PetBio pet={pet} />

      <Separator />

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        {/* Pet Details */}
        <PetDetails pet={pet} />

        {/* Owner Info */}
        <OwnerInfo pet={pet} />
      </View>

      {/* Personality Traits */}
      {pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0 && (
        <>
          <Separator />
          <Card style={styles.traitsCard}>
            <CardHeader>
              <CardTitle style={styles.traitsTitle}>Personality Traits</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.traitsContainer}>
                {pet.personality.map((trait, index) => (
                  <Badge key={index} variant="secondary" style={styles.traitBadge}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </Badge>
                ))}
              </View>
            </CardContent>
          </Card>
        </>
      )}

      {/* Interests */}
      {pet.interests && Array.isArray(pet.interests) && pet.interests.length > 0 && (
        <>
          <Separator />
          <Card style={styles.interestsCard}>
            <CardHeader>
              <CardTitle style={styles.interestsTitle}>Interests & Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.interestsContainer}>
                {pet.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </Badge>
                ))}
              </View>
            </CardContent>
          </Card>
        </>
      )}

      {/* Looking For */}
      {pet.lookingFor && Array.isArray(pet.lookingFor) && pet.lookingFor.length > 0 && (
        <>
          <Separator />
          <Card style={styles.lookingForCard}>
            <CardHeader>
              <CardTitle style={styles.lookingForTitle}>Looking For</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.lookingForContainer}>
                {pet.lookingFor.map((item, index) => (
                  <Badge key={index} style={styles.lookingForBadge}>
                    <Text style={styles.lookingForText}>{item}</Text>
                  </Badge>
                ))}
              </View>
            </CardContent>
          </Card>
        </>
      )}

      {/* Trust Badges */}
      {pet.trustProfile?.badges && Array.isArray(pet.trustProfile.badges) && pet.trustProfile.badges.length > 0 && (
        <>
          <Separator />
          <Card style={styles.trustBadgesCard}>
            <CardHeader>
              <CardTitle style={styles.trustBadgesTitle}>
                <ShieldCheck size={16} weight="fill" color="#6366f1" />
                <Text style={styles.trustBadgesTitleText}>Trust & Verification</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrustBadges badges={pet.trustProfile.badges.map(badge => badge.label)} />
            </CardContent>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

export default function PetDetailDialog({
  pet,
  visible,
  onClose,
}: PetDetailDialogProps): React.JSX.Element | null {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  if (!pet) return null

  const photos = pet.photos || [pet.photo]
  const hasMultiplePhotos = photos.length > 1

  const handlePrevPhoto = (): void => {
    if (isTruthy(hasMultiplePhotos)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    }
  }

  const handleNextPhoto = (): void => {
    if (isTruthy(hasMultiplePhotos)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    }
  }

  const handleClose = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  return (
    <Dialog
      visible={visible}
      onClose={handleClose}
      accessibilityLabel={`Pet details for ${String(pet.name ?? '')}`}
      accessibilityHint="Shows detailed information about this pet"
    >
      <View style={styles.container}>
        <PetPhotoSection
          pet={pet}
          currentPhotoIndex={currentPhotoIndex}
          hasMultiplePhotos={hasMultiplePhotos}
          handlePrevPhoto={handlePrevPhoto}
          handleNextPhoto={handleNextPhoto}
        />

        <PetContentSection pet={pet} />
      </View>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: DIMENS.radius.xl,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  photoContainer: {
    height: 300,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  navButtonLeft: {
    position: 'absolute',
    left: DIMENS.spacing.lg,
    top: '50%',
    width: DIMENS.component.touchTargetMin,
    height: DIMENS.component.touchTargetMin,
    borderRadius: DIMENS.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: DIMENS.spacing.lg,
    top: '50%',
    width: DIMENS.component.touchTargetMin,
    height: DIMENS.component.touchTargetMin,
    borderRadius: DIMENS.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndicator: {
    position: 'absolute',
    top: DIMENS.spacing.xl,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: DIMENS.spacing.sm,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  petInfoOverlay: {
    position: 'absolute',
    bottom: DIMENS.spacing.xl,
    left: DIMENS.spacing.xl,
    right: DIMENS.spacing.xl,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
    marginBottom: DIMENS.spacing.sm,
  },
  petName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  petDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.md,
  },
  petDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.xs,
  },
  petDetailText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  petDetailSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  petBreed: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  photoCounter: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: DIMENS.spacing.sm,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: DIMENS.spacing.xl,
    gap: DIMENS.spacing.xl,
  },
  ratingsCard: {
    marginBottom: 0,
  },
  ratingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  responseRateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: DIMENS.spacing.xs,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: DIMENS.spacing.lg,
  },
  detailsGrid: {
    gap: DIMENS.spacing.xl,
  },
  detailCard: {
    flex: 1,
    marginBottom: 0,
  },
  detailTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  detailTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailContent: {
    gap: DIMENS.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENS.spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: DIMENS.radius.md,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  detailLabelText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  ownerCard: {
    flex: 1,
    marginBottom: 0,
  },
  ownerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  ownerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ownerInfo: {
    flexDirection: 'row',
    gap: DIMENS.spacing.md,
    marginBottom: DIMENS.spacing.lg,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  ownerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: DIMENS.spacing.xs,
  },
  ownerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.xs,
  },
  ownerLocationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ownerRating: {
    paddingTop: DIMENS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: DIMENS.spacing.sm,
  },
  ownerRatingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  responseRate: {
    fontSize: 12,
    color: '#6b7280',
  },
  traitsCard: {
    marginBottom: 0,
  },
  traitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENS.spacing.sm,
  },
  traitBadge: {
    paddingHorizontal: DIMENS.spacing.md,
    paddingVertical: DIMENS.spacing.sm,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  interestsCard: {
    marginBottom: 0,
  },
  interestsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENS.spacing.sm,
  },
  interestBadge: {
    paddingHorizontal: DIMENS.spacing.md,
    paddingVertical: DIMENS.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  lookingForCard: {
    marginBottom: 0,
  },
  lookingForTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lookingForContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENS.spacing.sm,
  },
  lookingForBadge: {
    paddingHorizontal: DIMENS.spacing.md,
    paddingVertical: DIMENS.spacing.sm,
    backgroundColor: '#6366f1',
  },
  lookingForText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  trustBadgesCard: {
    marginBottom: 0,
  },
  trustBadgesTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENS.spacing.sm,
  },
  trustBadgesTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENS.spacing.sm,
  },
  badge: {
    paddingHorizontal: DIMENS.spacing.md,
    paddingVertical: DIMENS.spacing.sm,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
})
