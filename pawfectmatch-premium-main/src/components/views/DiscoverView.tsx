import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Sparkle, MapPin, Info, ChartBar, SquaresFour, BookmarkSimple, NavigationArrow, PawPrint } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Pet, Match, SwipeAction } from '@/lib/types'
import type { Story } from '@/lib/stories-types'
import type { VerificationRequest } from '@/lib/verification-types'
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView'
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown'
import DiscoveryFilters, { type DiscoveryPreferences } from '@/components/DiscoveryFilters'
import MatchCelebration from '@/components/MatchCelebration'
import StoriesBar from '@/components/stories/StoriesBar'
import DiscoverMapMode from '@/components/DiscoverMapMode'
import { createLogger } from '@/lib/logger'
import SavedSearchesManager from '@/components/discovery/SavedSearchesManager'
import { PetRatings } from '@/components/PetRatings'
import { TrustBadges } from '@/components/TrustBadges'
import { VerificationBadge } from '@/components/VerificationBadge'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'
import { parseLocation, getDistanceBetweenLocations, formatDistance } from '@/lib/distance'
import { adoptionAPI } from '@/api/adoption-api'
import { usePetDiscovery } from '@/hooks/usePetDiscovery'
import { useMatching } from '@/hooks/useMatching'
import { useSwipe } from '@/hooks/useSwipe'
import { useViewMode } from '@/hooks/useViewMode'
import { useDialog } from '@/hooks/useDialog'
import { useStories } from '@/hooks/useStories'
import { generateMatchReasoning } from '@/lib/matching'

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
    x,
    rotate,
    opacity,
    likeOpacity,
    passOpacity,
    isDragging,
    direction,
    handleDragStart,
    handleDrag,
    handleDragEnd,
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
    currentPetId: userPet?.id,
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
        const result = await adoptionAPI.queryListings()
        // Only include active listings
        const activeListings = result.listings.filter(l => l.status === 'active')
        const petIds = new Set(activeListings.map(listing => listing.petId))
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
    userPet,
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
      return {
        ...pet,
        distance: distance ?? undefined,
        coordinates: pet.coordinates || parseLocation(pet.location) || undefined
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
    userPet,
    otherPet: currentPet,
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

  // handleDragStart, handleDrag, handleDragEnd are now provided by useSwipe hook

  if (isLoading) {
    return null
  }

  if (!userPet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkle size={48} className="text-primary" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          {t.discover.createProfile}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6 max-w-md"
        >
          {t.discover.createProfileDesc}
        </motion.p>
      </div>
    )
  }

  if (availablePets.length === 0 || discoveryIndex >= availablePets.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart size={48} className="text-primary" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          {t.discover.noMore}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6 max-w-md"
        >
          {availablePets.length === 0 && currentIndex === 0
            ? t.discover.noMoreDescAdjust
            : t.discover.noMoreDesc}
        </motion.p>
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
            {prefs.maxDistance < 100 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Badge 
                  variant="outline" 
                  className="gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary px-2 py-1"
                >
                  <NavigationArrow size={14} weight="fill" />
                  Within {prefs.maxDistance} miles
                </Badge>
              </motion.div>
            )}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Badge
                variant={showAdoptableOnly ? "default" : "outline"}
                className="gap-1.5 text-xs font-semibold cursor-pointer hover:bg-primary/10 transition-colors px-2 py-1"
                onClick={() => {
                  haptics.trigger('selection')
                  setShowAdoptableOnly(!showAdoptableOnly)
                }}
              >
                <PawPrint size={14} weight="fill" />
                {t.adoption?.adoptable || 'Adoptable'}
              </Badge>
            </motion.div>
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
          pets={availablePets}
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
          <AnimatePresence mode="wait">
          {currentPet && (
            <motion.div
              key={currentPet.id}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.75, opacity: 0, rotateY: -30, y: 50 }}
              animate={{ 
                scale: isDragging ? 1.08 : 1, 
                opacity: 1, 
                rotateY: 0,
                y: 0,
                transition: { 
                  type: 'spring', 
                  stiffness: 280, 
                  damping: 25,
                  scale: {
                    type: 'spring',
                    stiffness: 400,
                    damping: 20
                  }
                }
              }}
              exit={{
                x: direction === 'right' ? 1000 : -1000,
                opacity: 0,
                rotate: direction === 'right' ? 50 : -50,
                scale: 0.4,
                y: direction === 'right' ? -50 : 50,
                transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
            >
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-linear-to-r from-primary to-accent rounded-full text-white font-bold text-lg shadow-2xl z-50 border-4 border-white"
                style={{ opacity: likeOpacity, scale: likeOpacity }}
              >
                <Heart size={24} weight="fill" className="inline mr-2" />
                LIKE
              </motion.div>
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-linear-to-r from-gray-500 to-gray-700 rounded-full text-white font-bold text-lg shadow-2xl z-50 border-4 border-white"
                style={{ opacity: passOpacity, scale: passOpacity }}
              >
                PASS
                <X size={24} weight="bold" className="inline ml-2" />
              </motion.div>
              {showSwipeHint && currentIndex === 0 && (
                <motion.div
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex gap-12"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                  >
                    <motion.div
                      className="flex items-center gap-2 glass-strong px-4 py-2 rounded-full backdrop-blur-xl border border-white/30"
                      animate={{ x: [-10, 0, -10] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      <span className="text-2xl">👈</span>
                      <span className="text-white font-semibold drop-shadow-lg">{t.discover.swipeHintPass}</span>
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-2 glass-strong px-4 py-2 rounded-full backdrop-blur-xl border border-white/30"
                      animate={{ x: [10, 0, 10] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      <span className="text-white font-semibold drop-shadow-lg">{t.discover.swipeHintLike}</span>
                      <span className="text-2xl">👉</span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
              <div className="h-full overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl">
                <div className="relative h-full flex flex-col bg-linear-to-br from-white/50 to-white/30">
                  <div className="relative h-96 overflow-hidden group">
                    <motion.div 
                      className="absolute inset-0 bg-linear-to-br from-primary/25 via-accent/15 to-secondary/20 z-10 pointer-events-none"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.img
                      src={currentPet.photo}
                      alt={currentPet.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"
                    />
                    <motion.div
                      initial={{ scale: 0, rotate: -180, y: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                      transition={{ 
                        delay: 0.4, 
                        type: 'spring', 
                        stiffness: 350, 
                        damping: 20,
                        opacity: { duration: 0.3 }
                      }}
                      className="absolute top-4 right-4 glass-strong px-4 py-2 rounded-full font-bold text-lg shadow-2xl backdrop-blur-xl border-2 border-white/40"
                      whileHover={{ 
                        scale: 1.15, 
                        borderColor: 'rgba(245, 158, 11, 0.9)',
                        boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className="bg-linear-to-r from-accent via-primary to-secondary bg-clip-text text-transparent"
                        animate={{ 
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        style={{ backgroundSize: '200% auto' }}
                      >
                        {compatibilityScore}% {t.discover.match}
                      </motion.span>
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            '0 0 10px rgba(245, 158, 11, 0.3)',
                            '0 0 20px rgba(245, 158, 11, 0.5)',
                            '0 0 10px rgba(245, 158, 11, 0.3)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <motion.button
                      onClick={() => {
                        haptics.trigger('selection')
                        selectedPetDialog.open()
                      }}
                      className="absolute top-4 left-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl"
                      whileHover={{ scale: 1.15, rotate: 360, borderColor: 'rgba(255, 255, 255, 0.6)' }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Info size={20} className="text-white drop-shadow-lg" weight="bold" />
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        haptics.trigger('selection')
                        breakdownDialog.toggle()
                      }}
                      className="absolute bottom-4 right-4 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl"
                      whileHover={{ scale: 1.15, borderColor: 'rgba(255, 255, 255, 0.6)' }}
                      whileTap={{ scale: 0.9 }}
                      animate={breakdownDialog.isOpen ? { rotate: 360 } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <ChartBar size={20} className="text-white drop-shadow-lg" weight={breakdownDialog.isOpen ? 'fill' : 'bold'} />
                    </motion.button>
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
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                            >
                              <Badge 
                                variant="secondary" 
                                className="gap-1 bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 text-foreground font-semibold px-2 py-0.5"
                              >
                                <NavigationArrow size={12} weight="fill" className="text-primary" />
                                {formatDistance(currentPet.distance)}
                              </Badge>
                            </motion.div>
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
                    <motion.div className="flex-1" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full h-14 border-2 glass-effect hover:glass-strong hover:border-destructive/50 hover:bg-destructive/10 group backdrop-blur-xl transition-all"
                        onClick={() => {
                          haptics.trigger('light')
                          handleSwipe('pass')
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <X size={28} weight="bold" className="text-foreground/70 group-hover:text-destructive transition-colors drop-shadow-lg" />
                        </motion.div>
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        className="w-full h-14 bg-linear-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-2xl hover:shadow-accent/50 transition-all group relative overflow-hidden neon-glow"
                        onClick={() => {
                          haptics.trigger('success')
                          handleSwipe('like')
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Heart size={28} weight="fill" className="relative z-10 drop-shadow-2xl" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      )}

      {breakdownDialog.isOpen && compatibilityFactors && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <CompatibilityBreakdown factors={compatibilityFactors} className="mb-6" />
        </motion.div>
      )}

      <AnimatePresence>
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
      </AnimatePresence>

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
