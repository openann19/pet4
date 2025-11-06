import { adoptionApi } from '@/api/adoption-api'
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown'
import DiscoverMapMode from '@/components/DiscoverMapMode'
import SavedSearchesManager from '@/components/discovery/SavedSearchesManager'
import DiscoveryFilters, { type DiscoveryPreferences } from '@/components/DiscoveryFilters'
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView'
import MatchCelebration from '@/components/MatchCelebration'
import { PetRatings } from '@/components/PetRatings'
import StoriesBar from '@/components/stories/StoriesBar'
import { TrustBadges } from '@/components/TrustBadges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VerificationBadge } from '@/components/VerificationBadge'
import { useApp } from '@/contexts/AppContext'
import { useDialog } from '@/hooks/useDialog'
import { useMatching } from '@/hooks/useMatching'
import { usePetDiscovery } from '@/hooks/usePetDiscovery'
import { useStorage } from '@/hooks/useStorage'
import { useStories } from '@/hooks/useStories'
import { useSwipe } from '@/hooks/useSwipe'
import { useViewMode } from '@/hooks/useViewMode'
import type { AdoptionProfile } from '@/lib/adoption-types'
import { formatDistance, getDistanceBetweenLocations, parseLocation } from '@/lib/distance'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { generateMatchReasoning } from '@/lib/matching'
import type { Story } from '@/lib/stories-types'
import type { Match, Pet, SwipeAction } from '@/lib/types'
import type { VerificationRequest } from '@/lib/verification-types'
import { BookmarkSimple, ChartBar, Heart, Info, MapPin, NavigationArrow, PawPrint, Sparkle, SquaresFour, X } from '@phosphor-icons/react'
import { useEffect, useState, useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, withDelay, interpolate, Extrapolation } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { Presence } from '@petspark/motion'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { usePageTransition } from '@/effects/reanimated/use-page-transition'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import { toast } from 'sonner'
import { AnimatedBadge } from '@/components/enhanced/AnimatedBadge'

const logger = createLogger('DiscoverView')

export default function DiscoverView() {
  const { t } = useApp()
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [swipeHistory, setSwipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [, setMatches] = useStorage<Match[]>('matches', [])
  // Stories are now managed by useStories hook
  const [verificationRequests] = useStorage<Record<string, VerificationRequest>>('verification-requests', {})
  const [preferences] = useStorage<DiscoveryPreferences>('discovery-preferences', {
    minAge: 0,
    maxAge: 15,
    sizes: ['small', 'medium', 'large', 'extra-large'],
    maxDistance: 50,
    personalities: [],
    interests: [],
    lookingFor: [],
    minCompatibility: 0,
    mediaFilters: {
      cropSize: 'any',
      photoQuality: 'any',
      hasVideo: false,
      minPhotos: 1,
    },
    advancedFilters: {
      verified: false,
      activeToday: false,
      hasStories: false,
      respondQuickly: false,
      superLikesOnly: false,
    },
  })
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedPetName, setMatchedPetName] = useState('')
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showAdoptableOnly, setShowAdoptableOnly] = useState(false)
  const [, setAdoptablePetIds] = useState<Set<string>>(new Set())
  
  const { viewMode, setMode: setViewMode } = useViewMode({
    initialMode: 'cards',
    availableModes: ['cards', 'map'],
  })

  const {
    animatedStyle: swipeAnimatedStyle,
    likeOpacityStyle,
    passOpacityStyle,
    isDragging,
    direction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset: resetSwipe,
  } = useSwipe({
    onSwipe: (dir) => {
      handleSwipe(dir === 'right' ? 'like' : 'pass')
    },
  })

  const selectedPetDialog = useDialog({
    initialOpen: false,
  })

  const breakdownDialog = useDialog({
    initialOpen: false,
  })

  const celebrationDialog = useDialog({
    initialOpen: false,
  })

  const savedSearchesDialog = useDialog({
    initialOpen: false,
  })

  const userPet = Array.isArray(userPets) && userPets.length > 0 ? userPets[0] : undefined

  const { stories, addStory, updateStory } = useStories({
    ...(userPet?.id && { currentPetId: userPet.id }),
  })

  useEffect(() => {
    if (userPets !== undefined) {
      setIsLoading(false)
    }
  }, [userPets])

  // Load adoptable pets (pets with active adoption listings)
  useEffect(() => {
    const loadAdoptablePets = async () => {
      try {
        const result = await adoptionApi.getAdoptionProfiles({})
        // Only include active listings
        const activeListings = result.profiles.filter((l: AdoptionProfile) => l.status === 'available')
        const petIds = new Set<string>(activeListings.map((listing: AdoptionProfile) => listing.petId))
        setAdoptablePetIds(petIds)
      } catch (error) {
        logger.error('Failed to load adoptable pets', error instanceof Error ? error : new Error(String(error)))
      }
    }
    loadAdoptablePets()
  }, [])
  const swipedPetIds = new Set(Array.isArray(swipeHistory) ? swipeHistory.map(s => s.targetPetId) : [])
  
  const prefs: DiscoveryPreferences = preferences || { 
    minAge: 0, 
    maxAge: 15, 
    sizes: ['small', 'medium', 'large', 'extra-large'], 
    maxDistance: 50,
    personalities: [],
    interests: [],
    lookingFor: [],
    minCompatibility: 0,
    mediaFilters: {
      cropSize: 'any',
      photoQuality: 'any',
      hasVideo: false,
      minPhotos: 1,
    },
    advancedFilters: {
      verified: false,
      activeToday: false,
      hasStories: false,
      respondQuickly: false,
      superLikesOnly: false,
    },
  }

  const {
    availablePets: discoveryPets,
    currentPet,
    currentIndex: discoveryIndex,
    nextPet,
    markAsSwiped,
  } = usePetDiscovery({
    ...(userPet && { userPet }),
    preferences: {
      minAge: prefs.minAge,
      maxAge: prefs.maxAge,
      sizes: prefs.sizes,
      personalities: prefs.personalities,
      interests: prefs.interests,
      lookingFor: prefs.lookingFor,
      minCompatibility: prefs.minCompatibility,
      maxDistance: prefs.maxDistance,
    },
    showAdoptableOnly,
    swipedPetIds,
  })

  // Add distance calculation to available pets
  const availablePets = discoveryPets.map(pet => {
    if (userPet?.location && pet.location) {
      const distance = getDistanceBetweenLocations(userPet.location, pet.location)
      const coordinates = pet.coordinates || parseLocation(pet.location)
      return {
        ...pet,
        ...(distance !== undefined && { distance }),
        ...(coordinates && { coordinates })
      }
    }
    return pet
  })

  // Update current index when discovery index changes
  useEffect(() => {
    setCurrentIndex(discoveryIndex)
  }, [discoveryIndex])

  const {
    compatibilityScore,
    compatibilityFactors,
    matchReasoning: reasoning,
  } = useMatching({
    ...(userPet && { userPet }),
    ...(currentPet && { otherPet: currentPet }),
    autoCalculate: true,
  })

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentPet || !userPet) return

    // Capture values before async operations to avoid stale closures
    const petId = currentPet.id
    const petName = currentPet.name
    const userId = userPet.id
    const userName = userPet.name
    const score = compatibilityScore

    haptics.trigger(action === 'like' ? 'success' : 'light')
    setShowSwipeHint(false)
    markAsSwiped(petId)

    const matchReasoning = reasoning.length > 0 ? reasoning : await generateMatchReasoning(userPet, currentPet)

    setTimeout(() => {
      const newSwipe: SwipeAction = {
        petId: userId,
        targetPetId: petId,
        action,
        timestamp: new Date().toISOString(),
      }
      
      // Update swipe history
      setSwipeHistory((prev) => [...(prev || []), newSwipe])

      if (action === 'like') {
        setMatches((currentMatches) => {
          const matchesArray = currentMatches || []
          const existingMatch = matchesArray.find(m => 
            m.matchedPetId === petId || m.petId === petId
          )

          if (existingMatch) {
            return matchesArray
          }

          const newMatch: Match = {
            id: `match-${Date.now()}`,
            petId: userId,
            matchedPetId: petId,
            compatibilityScore: score,
            reasoning: matchReasoning,
            matchedAt: new Date().toISOString(),
            status: 'active',
          }
          
          // Trigger celebration and notification for new match
          haptics.trigger('success')
          setMatchedPetName(petName)
          celebrationDialog.open()
          
          toast.success(t.common.itsAMatch, {
            description: `${userName} ${t.common.and} ${petName} ${t.common.areNowConnected}`,
          })
          
          return [...matchesArray, newMatch]
        })
      }

      // Move to next pet
      nextPet()
      resetSwipe()
    }, 300)
  }

  // Animation hooks for empty states - always declared at top level
  const emptyStateIconScale = useSharedValue(0)
  const emptyStateIconRotate = useSharedValue(-180)
  const emptyStateIconRotation = useSharedValue(0)
  const emptyStatePulseScale = useSharedValue(1)
  const emptyStatePulseOpacity = useSharedValue(0.5)
  const emptyStateTitleOpacity = useSharedValue(0)
  const emptyStateTitleY = useSharedValue(20)
  const emptyStateDescOpacity = useSharedValue(0)
  const emptyStateDescY = useSharedValue(20)
  
  // Animation hooks for "no more" state - always declared at top level
  const noMoreIconScale = useSharedValue(0)
  const noMorePulseScale = useSharedValue(1)
  const noMorePulseOpacity = useSharedValue(0.5)

  useEffect(() => {
    if (!userPet || availablePets.length === 0 || discoveryIndex >= availablePets.length) {
      emptyStateIconScale.value = withSpring(1, springConfigs.bouncy)
      emptyStateIconRotate.value = withSpring(0, springConfigs.bouncy)
      emptyStateIconRotation.value = withRepeat(
        withTiming(360, { duration: 3000 }),
        -1,
        false
      )
      emptyStatePulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      )
      emptyStatePulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      )
      emptyStateTitleOpacity.value = withDelay(200, withTiming(1, timingConfigs.smooth))
      emptyStateTitleY.value = withDelay(200, withTiming(0, timingConfigs.smooth))
      emptyStateDescOpacity.value = withDelay(300, withTiming(1, timingConfigs.smooth))
      emptyStateDescY.value = withDelay(300, withTiming(0, timingConfigs.smooth))
      
      if (availablePets.length === 0 || discoveryIndex >= availablePets.length) {
        noMoreIconScale.value = withSpring(1, springConfigs.bouncy)
        noMorePulseScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 750 }),
            withTiming(1, { duration: 750 })
          ),
          -1,
          true
        )
        noMorePulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 1000 }),
            withTiming(0.5, { duration: 1000 })
          ),
          -1,
          true
        )
      }
    }
  }, [userPet, availablePets.length, discoveryIndex, emptyStateIconScale, emptyStateIconRotate, emptyStateIconRotation, emptyStatePulseScale, emptyStatePulseOpacity, emptyStateTitleOpacity, emptyStateTitleY, emptyStateDescOpacity, emptyStateDescY, noMoreIconScale, noMorePulseScale, noMorePulseOpacity])

  const emptyStateIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emptyStateIconScale.value },
      { rotate: `${emptyStateIconRotate.value}deg` }
    ]
  })) as AnimatedStyle

  const emptyStateRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emptyStateIconRotation.value}deg` }]
  })) as AnimatedStyle

  const emptyStatePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emptyStatePulseScale.value }],
    opacity: emptyStatePulseOpacity.value
  })) as AnimatedStyle

  const emptyStateTitleStyle = useAnimatedStyle(() => ({
    opacity: emptyStateTitleOpacity.value,
    transform: [{ translateY: emptyStateTitleY.value }]
  })) as AnimatedStyle

  const emptyStateDescStyle = useAnimatedStyle(() => ({
    opacity: emptyStateDescOpacity.value,
    transform: [{ translateY: emptyStateDescY.value }]
  })) as AnimatedStyle

  const noMoreIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: noMoreIconScale.value }]
  })) as AnimatedStyle

  const noMorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: noMorePulseScale.value }]
  })) as AnimatedStyle

  // Animation hooks for swipe hint
  const swipeHintOpacity = useSharedValue(0)
  const swipeHintY = useSharedValue(0)
  const swipeHintLeftX = useSharedValue(0)
  const swipeHintRightX = useSharedValue(0)

  useEffect(() => {
    if (showSwipeHint && currentIndex === 0) {
      swipeHintOpacity.value = withTiming(1, timingConfigs.smooth)
      swipeHintY.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
      swipeHintLeftX.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
      swipeHintRightX.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
    } else {
      swipeHintOpacity.value = withTiming(0, timingConfigs.smooth)
    }
  }, [showSwipeHint, currentIndex, swipeHintOpacity, swipeHintY, swipeHintLeftX, swipeHintRightX])

  const swipeHintContainerStyle = useAnimatedStyle(() => ({
    opacity: swipeHintOpacity.value
  })) as AnimatedStyle

  const swipeHintYStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: swipeHintY.value }]
  })) as AnimatedStyle

  const swipeHintLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeHintLeftX.value }]
  })) as AnimatedStyle

  const swipeHintRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeHintRightX.value }]
  })) as AnimatedStyle

  // Animation hooks for swipe hint
  const swipeHintOpacity = useSharedValue(0)
  const swipeHintY = useSharedValue(0)
  const swipeHintLeftX = useSharedValue(0)
  const swipeHintRightX = useSharedValue(0)

  useEffect(() => {
    if (showSwipeHint && currentIndex === 0) {
      swipeHintOpacity.value = withTiming(1, timingConfigs.smooth)
      swipeHintY.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
      swipeHintLeftX.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
      swipeHintRightX.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
    } else {
      swipeHintOpacity.value = withTiming(0, timingConfigs.smooth)
    }
  }, [showSwipeHint, currentIndex, swipeHintOpacity, swipeHintY, swipeHintLeftX, swipeHintRightX])

  const swipeHintContainerStyle = useAnimatedStyle(() => ({
    opacity: swipeHintOpacity.value
  })) as AnimatedStyle

  const swipeHintYStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: swipeHintY.value }]
  })) as AnimatedStyle

  const swipeHintLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeHintLeftX.value }]
  })) as AnimatedStyle

  // Animation hooks for pass button icon rotation
  const passButtonIconRotate = useSharedValue(0)

  useEffect(() => {
    passButtonIconRotate.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 500 }),
        withTiming(10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    )
  }, [passButtonIconRotate])

  const passButtonIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${passButtonIconRotate.value}deg` }]
  })) as AnimatedStyle

  // Animation hooks for compatibility badge
  const compatibilityBadgeScale = useSharedValue(0)
  const compatibilityBadgeRotate = useSharedValue(-180)
  const compatibilityBadgeY = useSharedValue(-20)
  const compatibilityBadgeOpacity = useSharedValue(0)
  const compatibilityBadgeHoverScale = useSharedValue(1)
  const compatibilityGlowOpacity = useSharedValue(0.3)

  useEffect(() => {
    if (currentPet) {
      compatibilityBadgeScale.value = withDelay(400, withSpring(1, { stiffness: 350, damping: 20 }))
      compatibilityBadgeRotate.value = withDelay(400, withSpring(0, { stiffness: 350, damping: 20 }))
      compatibilityBadgeY.value = withDelay(400, withSpring(0, { stiffness: 350, damping: 20 }))
      compatibilityBadgeOpacity.value = withDelay(400, withTiming(1, { duration: 300 }))
      compatibilityGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      )
    }
  }, [currentPet, compatibilityBadgeScale, compatibilityBadgeRotate, compatibilityBadgeY, compatibilityBadgeOpacity, compatibilityGlowOpacity])

  const compatibilityBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: compatibilityBadgeScale.value * compatibilityBadgeHoverScale.value },
      { rotate: `${compatibilityBadgeRotate.value}deg` },
      { translateY: compatibilityBadgeY.value }
    ],
    opacity: compatibilityBadgeOpacity.value
  })) as AnimatedStyle

  const compatibilityGlowStyle = useAnimatedStyle(() => ({
    opacity: compatibilityGlowOpacity.value
  })) as AnimatedStyle

  // Animation hooks for button hover/tap
  const passButtonHover = useHoverLift({ scale: 1.05, translateY: -2 })
  const likeButtonHover = useHoverLift({ scale: 1.05, translateY: -2 })
  const likeButtonShimmerX = useSharedValue(-100)
  const likeButtonHeartScale = useSharedValue(1)

  useEffect(() => {
    likeButtonShimmerX.value = withRepeat(
      withTiming(200, { duration: 2000 }),
      -1,
      false
    )
    likeButtonHeartScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 500 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    )
  }, [likeButtonShimmerX, likeButtonHeartScale])

  const likeButtonShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${likeButtonShimmerX.value}%` }]
  })) as AnimatedStyle

  const likeButtonHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonHeartScale.value }]
  })) as AnimatedStyle

  // Animation hooks for distance badge
  const distanceBadgeScale = useSharedValue(0)
  const distanceBadgeOpacity = useSharedValue(0)

  useEffect(() => {
    if (currentPet?.distance !== undefined) {
      distanceBadgeScale.value = withDelay(100, withSpring(1, springConfigs.bouncy))
      distanceBadgeOpacity.value = withDelay(100, withTiming(1, timingConfigs.smooth))
    }
  }, [currentPet?.distance, distanceBadgeScale, distanceBadgeOpacity])

  const distanceBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: distanceBadgeScale.value }],
    opacity: distanceBadgeOpacity.value
  })) as AnimatedStyle

  // Animation hooks for breakdown dialog
  const breakdownDialogOpacity = useSharedValue(0)
  const breakdownDialogY = useSharedValue(20)

  useEffect(() => {
    if (breakdownDialog.isOpen) {
      breakdownDialogOpacity.value = withTiming(1, timingConfigs.smooth)
      breakdownDialogY.value = withTiming(0, timingConfigs.smooth)
    } else {
      breakdownDialogOpacity.value = withTiming(0, timingConfigs.smooth)
      breakdownDialogY.value = withTiming(20, timingConfigs.smooth)
    }
  }, [breakdownDialog.isOpen, breakdownDialogOpacity, breakdownDialogY])

  const breakdownDialogStyle = useAnimatedStyle(() => ({
    opacity: breakdownDialogOpacity.value,
    transform: [{ translateY: breakdownDialogY.value }]
  })) as AnimatedStyle

  if (isLoading) {
    return null
  }

  if (!userPet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">                                                                 
        <AnimatedView
          style={emptyStateIconStyle}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"                        
        >
          <AnimatedView style={emptyStateRotateStyle}>
            <Sparkle size={48} className="text-primary" />
          </AnimatedView>
          <AnimatedView
            style={emptyStatePulseStyle}
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"                                                              
          />
        </AnimatedView>
        <AnimatedView
          style={emptyStateTitleStyle}
          className="text-2xl font-bold mb-2"
          as="h2"
        >
          {t.discover.createProfile}
        </AnimatedView>
        <AnimatedView
          style={emptyStateDescStyle}
          className="text-muted-foreground mb-6 max-w-md"
          as="p"
        >
          {t.discover.createProfileDesc}
        </AnimatedView>
      </div>
    )
  }

  if (availablePets.length === 0 || discoveryIndex >= availablePets.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">                                                                 
        <AnimatedView
          style={noMoreIconStyle}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"                        
        >
          <AnimatedView style={noMorePulseStyle}>
            <Heart size={48} className="text-primary" />
          </AnimatedView>
          <AnimatedView
            style={noMoreRingStyle}
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"                                                              
          />
        </AnimatedView>
        <AnimatedView
          style={emptyStateTitleStyle}
          className="text-2xl font-bold mb-2"
          as="h2"
        >
          {t.discover.noMore}
        </AnimatedView>
        <AnimatedView
          style={emptyStateDescStyle}
          className="text-muted-foreground mb-6 max-w-md"
          as="p"
        >
          {availablePets.length === 0 && currentIndex === 0
            ? t.discover.noMoreDescAdjust
            : t.discover.noMoreDesc}
        </AnimatedView>
      </div>
    )
  }

  const handleStoryCreated = (story: Story) => {
    addStory(story)
  }

  const handleStoryUpdate = (updatedStory: Story) => {
    updateStory(updatedStory.id, updatedStory)
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">{t.discover.title}</h2>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {t.discover.subtitle} {userPet.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="inline-flex items-center bg-muted/50 rounded-xl p-1 border border-border">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setViewMode('cards')
              }}
              className="h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm"
            >
              <SquaresFour size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">{t.map.cards}</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setViewMode('map')
              }}
              className="h-8 sm:h-9 px-2 sm:px-4 rounded-lg text-xs sm:text-sm"
            >
              <MapPin size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">{t.map.mapView}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Presence visible={prefs.maxDistance < 100}>
              {prefs.maxDistance < 100 && (
                <AnimatedView>
                  <Badge 
                    variant="outline" 
                    className="gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary px-2 py-1"                                               
                  >
                    <NavigationArrow size={14} weight="fill" />
                    Within {prefs.maxDistance} miles
                  </Badge>
                </AnimatedView>
              )}
            </Presence>
            <AnimatedView>
              <Badge
                variant={showAdoptableOnly ? "default" : "outline"}
                className="gap-1.5 text-xs font-semibold cursor-pointer hover:bg-primary/10 transition-colors px-2 py-1"                                        
                onClick={() => {
                  haptics.trigger('selection')
                  setShowAdoptableOnly(!showAdoptableOnly)
                }}
              >
                <PawPrint size={14} weight="fill" />
                {t.adoption?.adoptable ?? 'Adoptable'}
              </Badge>
            </AnimatedView>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                savedSearchesDialog.open()
              }}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg"
            >
              <BookmarkSimple size={16} className="sm:mr-2" weight="fill" />
              <span className="hidden sm:inline">Saved</span>
            </Button>
            <DiscoveryFilters />
          </div>
        </div>
      </div>

      {userPet && viewMode === 'cards' && (
        <StoriesBar
          allStories={stories || []}
          currentUserId={userPet.id}
          currentUserName={userPet.name}
          currentUserPetId={userPet.id}
          currentUserPetName={userPet.name}
          currentUserPetPhoto={userPet.photo}
          onStoryCreated={handleStoryCreated}
          onStoryUpdate={handleStoryUpdate}
        />
      )}

      {viewMode === 'map' ? (
        <DiscoverMapMode 
          pets={availablePets as Pet[]}
          userPet={userPet}
          onSwipe={(pet, action) => {
            const tempIndex = currentIndex
            const foundIndex = availablePets.findIndex(p => p.id === pet.id)
            if (foundIndex !== -1) {
              setCurrentIndex(foundIndex)
            }
            setTimeout(() => {
              handleSwipe(action)
              if (tempIndex !== foundIndex) {
                setCurrentIndex(tempIndex)
              }
            }, 50)
          }}
        />
      ) : (
        <div className="relative h-[500px] sm:h-[600px] flex items-center justify-center mb-6">                                                                 
          <Presence visible={!!currentPet}>
            {currentPet && (
              <AnimatedView
                key={currentPet.id}
                style={swipeAnimatedStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"                                                                        
              >
                <AnimatedView
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-linear-to-r from-primary to-accent rounded-full text-white font-bold text-lg shadow-2xl z-50 border-4 border-white"                                           
                  style={likeOpacityStyle}
                >
                  <Heart size={24} weight="fill" className="inline mr-2" />
                  LIKE
                </AnimatedView>
                <AnimatedView
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-linear-to-r from-gray-500 to-gray-700 rounded-full text-white font-bold text-lg shadow-2xl z-50 border-4 border-white"                                        
                  style={passOpacityStyle}
                >
                  PASS
                  <X size={24} weight="bold" className="inline ml-2" />
                </AnimatedView>
              {showSwipeHint && currentIndex === 0 && (
                <AnimatedView
                  style={swipeHintContainerStyle}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"                                                        
                >
                  <AnimatedView style={swipeHintYStyle} className="flex gap-12">
                    <AnimatedView
                      style={swipeHintLeftStyle}
                      className="flex items-center gap-2 glass-strong px-4 py-2 rounded-full backdrop-blur-xl border border-white/30"                           
                    >
                      <span className="text-2xl">👈</span>
                      <span className="text-white font-semibold drop-shadow-lg">{t.discover.swipeHintPass}</span>                                               
                    </AnimatedView>
                    <AnimatedView
                      style={swipeHintRightStyle}
                      className="flex items-center gap-2 glass-strong px-4 py-2 rounded-full backdrop-blur-xl border border-white/30"                           
                    >
                      <span className="text-white font-semibold drop-shadow-lg">{t.discover.swipeHintLike}</span>                                               
                      <span className="text-2xl">👉</span>
                    </AnimatedView>
                  </AnimatedView>
                </AnimatedView>
              )}
              <div className="h-full overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl">
                <div className="relative h-full flex flex-col bg-linear-to-br from-white/50 to-white/30">
                  <div className="relative h-96 overflow-hidden group">
                    <AnimatedView 
                      className="absolute inset-0 bg-linear-to-br from-primary/25 via-accent/15 to-secondary/20 z-10 pointer-events-none"                       
                      style={useAnimatedStyle(() => ({ opacity: 0 })) as AnimatedStyle}
                      onMouseEnter={() => {}}
                    />
                    <img
                      src={currentPet.photo}
                      alt={currentPet.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                    <AnimatedView
                      style={compatibilityBadgeStyle}
                      className="absolute top-4 right-4 glass-strong px-4 py-2 rounded-full font-bold text-lg shadow-2xl backdrop-blur-xl border-2 border-white/40"
                      onMouseEnter={() => {
                        compatibilityBadgeHoverScale.value = withSpring(1.15, springConfigs.bouncy)
                      }}
                      onMouseLeave={() => {
                        compatibilityBadgeHoverScale.value = withSpring(1, springConfigs.bouncy)
                      }}
                      onClick={() => {
                        haptics.trigger('selection')
                        breakdownDialog.toggle()
                      }}
                    >
                      <span className="bg-linear-to-r from-accent via-primary to-secondary bg-clip-text text-transparent animate-gradient">
                        {compatibilityScore}% {t.discover.match}
                      </span>
                      <AnimatedView
                        className="absolute inset-0 rounded-full"
                        style={compatibilityGlowStyle}
                      />
                    </AnimatedView>
                    <AnimatedView
                      className="absolute top-4 left-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl cursor-pointer transition-transform hover:scale-110 active:scale-90"
                      onClick={() => {
                        haptics.trigger('selection')
                        selectedPetDialog.open()
                      }}
                    >
                      <Info size={20} className="text-white drop-shadow-lg" weight="bold" />                                                                    
                    </AnimatedView>
                    <AnimatedView
                      className="absolute bottom-4 right-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl cursor-pointer transition-transform hover:scale-110 active:scale-90"
                      onClick={() => {
                        haptics.trigger('selection')
                        breakdownDialog.toggle()
                      }}
                      style={useAnimatedStyle(() => ({
                        transform: [{ rotate: breakdownDialog.isOpen ? '360deg' : '0deg' }]
                      })) as AnimatedStyle}
                    >
                      <ChartBar size={20} className="text-white drop-shadow-lg" weight={breakdownDialog.isOpen ? 'fill' : 'bold'} />                            
                    </AnimatedView>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold truncate">{currentPet.name}</h3>
                          {currentPet.verified && (
                            <VerificationBadge 
                              verified={currentPet.verified} 
                              level={verificationRequests?.[currentPet.id]?.verificationLevel || 'basic'}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin size={16} weight="fill" />
                            {currentPet.location}
                          </p>
                          {currentPet.distance !== undefined && (
                            <AnimatedView style={distanceBadgeStyle}>
                              <Badge 
                                variant="secondary" 
                                className="gap-1 bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 text-foreground font-semibold px-2 py-0.5"
                              >
                                <NavigationArrow size={12} weight="fill" className="text-primary" />                                                            
                                {formatDistance(currentPet.distance)}
                              </Badge>
                            </AnimatedView>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentPet.trustProfile && (
                      <div className="mb-4">
                        <PetRatings trustProfile={currentPet.trustProfile} compact />
                      </div>
                    )}

                    {currentPet.trustProfile && currentPet.trustProfile.badges && Array.isArray(currentPet.trustProfile.badges) && currentPet.trustProfile.badges.length > 0 && (
                      <div className="mb-4">
                        <TrustBadges badges={currentPet.trustProfile.badges.slice(0, 4)} compact />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">{t.discover.about}</p>
                        <p className="text-foreground">{currentPet.breed} • {currentPet.age} {t.common.years} • {currentPet.gender}</p>
                      </div>

                      {reasoning.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <Sparkle size={16} weight="fill" className="text-accent" />
                            {t.discover.whyMatch}
                          </p>
                          <div className="space-y-1">
                            {reasoning.map((reason, idx) => (
                              <p key={idx} className="text-sm text-foreground">• {reason}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentPet.personality && Array.isArray(currentPet.personality) && currentPet.personality.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2">{t.discover.personality}</p>
                          <div className="flex flex-wrap gap-2">
                            {currentPet.personality.map((trait, idx) => (
                              <Badge key={idx} variant="secondary">{trait}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 glass-effect border-t border-white/20 flex gap-4 backdrop-blur-xl">                                                       
                    <AnimatedView 
                      style={passButtonHover.animatedStyle}
                      onMouseEnter={passButtonHover.handleEnter}
                      onMouseLeave={passButtonHover.handleLeave}
                      className="flex-1"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 border-2 glass-effect hover:glass-strong hover:border-destructive/50 hover:bg-destructive/10 group backdrop-blur-xl transition-all"                                                              
                        onClick={() => {
                          haptics.trigger('light')
                          handleSwipe('pass')
                        }}
                      >
                        <AnimatedView style={passButtonIconStyle}>
                          <X size={28} weight="bold" className="text-foreground/70 group-hover:text-destructive transition-colors drop-shadow-lg" />            
                        </AnimatedView>
                      </Button>
                    </AnimatedView>
                    <AnimatedView 
                      style={likeButtonHover.animatedStyle}
                      onMouseEnter={likeButtonHover.handleEnter}
                      onMouseLeave={likeButtonHover.handleLeave}
                      className="flex-1"
                    >
                      <Button
                        size="lg"
                        className="w-full h-14 bg-linear-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-2xl hover:shadow-accent/50 transition-all group relative overflow-hidden neon-glow"                                                                   
                        onClick={() => {
                          haptics.trigger('success')
                          handleSwipe('like')
                        }}
                      >
                        <AnimatedView
                          className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"                                              
                          style={likeButtonShimmerStyle}
                        />
                        <AnimatedView style={likeButtonHeartStyle}>
                          <Heart size={28} weight="fill" className="relative z-10 drop-shadow-2xl" />                                                           
                        </AnimatedView>
                      </Button>
                    </AnimatedView>
                  </div>
                </div>
              </div>
            </AnimatedView>
          )}
        </Presence>
        </div>
      )}

      {breakdownDialog.isOpen && compatibilityFactors && (
        <AnimatedView style={breakdownDialogStyle}>
          <CompatibilityBreakdown factors={compatibilityFactors} className="mb-6" />                                                                            
        </AnimatedView>
      )}

      <Presence visible={selectedPetDialog.isOpen && !!currentPet}>
        {selectedPetDialog.isOpen && currentPet && (
          <EnhancedPetDetailView
            pet={currentPet}
            onClose={selectedPetDialog.close}
            onLike={() => {
              handleSwipe('like')
              selectedPetDialog.close()
            }}
            onPass={() => {
              handleSwipe('pass')
              selectedPetDialog.close()
            }}
            compatibilityScore={compatibilityScore}
            matchReasons={reasoning}
            showActions={true}
          />
        )}
      </Presence>

      <MatchCelebration
        show={celebrationDialog.isOpen}
        petName1={userPet?.name || ''}
        petName2={matchedPetName}
        onComplete={celebrationDialog.close}
      />

      {savedSearchesDialog.isOpen && (
        <Dialog open={savedSearchesDialog.isOpen} onOpenChange={savedSearchesDialog.setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <SavedSearchesManager
              currentPreferences={prefs}
              onApplySearch={(newPreferences) => {
                const event = new CustomEvent('updateDiscoveryPreferences', { detail: newPreferences })
                window.dispatchEvent(event)
              }}
              onClose={savedSearchesDialog.close}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
