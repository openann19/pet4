import { MotionView } from "@petspark/motion";
import { useState, lazy, Suspense, useMemo } from 'react'
import { useStorage } from '@/hooks/use-storage'
import { useMotionVariants, useStaggeredContainer, useHoverLift, usePressBounce, useGlowPulse, useIconRotation } from '@/effects/reanimated'
import { Plus, PawPrint, Pencil, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Pet, Match, SwipeAction } from '@/lib/types'
import type { VideoQuality } from '@/lib/call-types'
import type { ThemePreset } from '@/lib/theme-presets'
import CreatePetDialog from '@/components/CreatePetDialog'
import StatsCard from '@/components/StatsCard'
import HighlightsBar from '@/components/stories/HighlightsBar'
import VideoQualitySettings from '@/components/call/VideoQualitySettings'
import ThemePresetSelector from '@/components/ThemePresetSelector'
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard'
import PetHealthDashboard from '@/components/health/PetHealthDashboard'
import { VerificationButton } from '@/components/verification/VerificationButton'
import { AchievementsPanel } from '@/components/gamification/AchievementsPanel'
import { ChallengesPanel } from '@/components/gamification/ChallengesPanel'
import { StreaksPanel } from '@/components/gamification/StreaksPanel'
import { useApp } from '@/contexts/AppContext'

// Lazy load heavy components
const VisualAnalysisDemo = lazy(() => import('@/components/VisualAnalysisDemo').then(module => ({ default: module.default })))

export default function ProfileView() {
  const { t, themePreset, setThemePreset } = useApp()
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [matches] = useStorage<Match[]>('matches', [])
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', [])
  const [preferredQuality = '4k', setPreferredQuality] = useStorage<VideoQuality>('video-quality-preference', '4k')
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showHealthDashboard, setShowHealthDashboard] = useState(false)
  const [selectedHealthPet, setSelectedHealthPet] = useState<Pet | null>(null)
  const totalMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'active').length : 0
  const totalSwipes = Array.isArray(swipeHistory) ? swipeHistory.length : 0
  const likeCount = Array.isArray(swipeHistory) ? swipeHistory.filter(s => s.action === 'like').length : 0
  const successRate = likeCount > 0 ? Math.round((totalMatches / likeCount) * 100) : 0

  // Animation hooks for empty state
  const emptyStateIcon = useMotionVariants({
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: 'spring', stiffness: 200, damping: 15 }
  })
  const emptyStatePulse = useGlowPulse({ duration: 2000, enabled: true })
  const emptyStateTitle = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.2 }
  })
  const emptyStateDesc = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.3 }
  })
  const emptyStateButton = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.4 }
  })
  const emptyStateButtonHover = useHoverLift({ scale: 1.05 })
  const emptyStateButtonTap = usePressBounce({ scale: 0.95 })

  // Create style objects from MotionValues (framer-motion supports MotionValues in style prop)                                                                 
  const emptyStateIconStyle = useMemo(() => ({
    scale: emptyStateIcon.scale,
    rotate: emptyStateIcon.rotate,
    opacity: emptyStateIcon.opacity,
  }), [emptyStateIcon.scale, emptyStateIcon.rotate, emptyStateIcon.opacity])                                                  
  const emptyStateTitleStyle = useMemo(() => ({
    opacity: emptyStateTitle.opacity,
    y: emptyStateTitle.translateY,
  }), [emptyStateTitle.opacity, emptyStateTitle.translateY])                                                                  
  const emptyStateDescStyle = useMemo(() => ({
    opacity: emptyStateDesc.opacity,
    y: emptyStateDesc.translateY,
  }), [emptyStateDesc.opacity, emptyStateDesc.translateY])                                                                    
  const emptyStateButtonStyle = useMemo(() => ({
    opacity: emptyStateButton.opacity,
    y: emptyStateButton.translateY,
  }), [emptyStateButton.opacity, emptyStateButton.translateY])                                                                
  const emptyStateButtonHoverStyle = useMemo(() => ({
    scale: emptyStateButtonHover.scale,
    y: emptyStateButtonHover.translateY,
  }), [emptyStateButtonHover.scale, emptyStateButtonHover.translateY])

  // Animation hooks for pet cards
  const _petCardsContainer = useStaggeredContainer({ delay: 0.08 })
  
  // Animation hooks for sections
  const themeSection = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.05 }
  })
  const subscriptionSection = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.075 }
  })
  const highlightsSection = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.1 }
  })
  const analysisSection = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.2 }
  })
  const videoSection = useMotionVariants({
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { delay: 0.4 }
  })

  // Create style objects from MotionValues for sections (framer-motion supports MotionValues in style prop)
  const themeSectionStyle = useMemo(() => ({
    opacity: themeSection.opacity,
    y: themeSection.translateY,
  }), [themeSection.opacity, themeSection.translateY])
  const subscriptionSectionStyle = useMemo(() => ({
    opacity: subscriptionSection.opacity,
    y: subscriptionSection.translateY,
  }), [subscriptionSection.opacity, subscriptionSection.translateY])
  const highlightsSectionStyle = useMemo(() => ({
    opacity: highlightsSection.opacity,
    y: highlightsSection.translateY,
  }), [highlightsSection.opacity, highlightsSection.translateY])
  const analysisSectionStyle = useMemo(() => ({
    opacity: analysisSection.opacity,
    y: analysisSection.translateY,
  }), [analysisSection.opacity, analysisSection.translateY])
  const videoSectionStyle = useMemo(() => ({
    opacity: videoSection.opacity,
    y: videoSection.translateY,
  }), [videoSection.opacity, videoSection.translateY])

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet)
    setShowCreateDialog(true)
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setEditingPet(null)
  }

  const handleThemePresetChange = (preset: ThemePreset) => {
    setThemePreset(preset)
    toast.success('Theme updated', {
      description: 'Your theme has been updated successfully'
    })
  }

  if (!Array.isArray(userPets) || userPets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <MotionView
            style={emptyStateIconStyle}
            className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-2xl relative"
          >
            <MotionView animatedStyle={emptyStatePulse.animatedStyle}>
              <PawPrint size={48} className="text-white" weight="fill" />
            </MotionView>
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary to-accent animate-pulse opacity-50" />
          </MotionView>
          <MotionView
            style={emptyStateTitleStyle}
            className="text-2xl font-bold mb-2"
          >
            {t.profile.createProfile}
          </MotionView>
          <MotionView
            style={emptyStateDescStyle}
            className="text-muted-foreground mb-6 max-w-md"
          >
            {t.profile.noPetsDesc}
          </MotionView>
          <MotionView style={emptyStateButtonStyle}>
            <MotionView
              style={emptyStateButtonHoverStyle}
              onMouseEnter={emptyStateButtonHover.handleEnter}
              onMouseLeave={emptyStateButtonHover.handleLeave}
              onClick={emptyStateButtonTap.handlePress}
            >
              <Button 
                size="lg" 
                onClick={() => { setShowCreateDialog(true); }}
                className="px-6 py-3 rounded-xl font-semibold shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Plus size={20} weight="bold" className="mr-2" />
                {t.profile.createProfileBtn}
              </Button>
            </MotionView>
          </MotionView>
        </div>
        <CreatePetDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-4">
      <MotionView
        style={themeSectionStyle}
        className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-2 sm:py-0 sm:bg-transparent sm:backdrop-blur-none"
      >
        <ThemePresetSelector 
          currentPreset={themePreset}
          onPresetChange={handleThemePresetChange}
        />
      </MotionView>
      <MotionView
        style={subscriptionSectionStyle}
      >
        <SubscriptionStatusCard subscription={null} />
      </MotionView>
      {totalSwipes > 0 && (
        <StatsCard
          totalMatches={totalMatches}
          totalSwipes={totalSwipes}
          successRate={successRate}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StreaksPanel userId="current-user" />
        <ChallengesPanel userId="current-user" />
      </div>
      <AchievementsPanel userId="current-user" />
      <MotionView
        style={highlightsSectionStyle}
        className="glass-strong p-6 rounded-3xl border border-white/20"
      >
        <h3 className="text-lg font-bold mb-4">Story Highlights</h3>
        <HighlightsBar onlyOwn={true} />
      </MotionView>
      <MotionView
        style={analysisSectionStyle}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <VisualAnalysisDemo />
        </Suspense>
      </MotionView>
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t.profile.myPets}</h2>
          <p className="text-sm text-muted-foreground">
            {userPets?.length} {userPets?.length === 1 ? t.profile.subtitle : t.profile.subtitlePlural}
          </p>
        </div>
        <Button onClick={() => { setShowCreateDialog(true); }} className="shrink-0 px-6 py-3 rounded-xl font-semibold shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Plus size={18} weight="bold" className="mr-1 sm:mr-2" />
          <span className="text-sm">{t.profile.addPet}</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {(userPets ?? []).map((pet, idx) => {
          const cardHover = useHoverLift({ scale: 1.03, translateY: -12 })
          const cardEntry = useMotionVariants({
            initial: { opacity: 0, translateY: 30, scale: 0.9 },
            animate: { opacity: 1, translateY: 0, scale: 1 },
            transition: { delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 30 }
          })
          const imageHover = useHoverLift({ scale: 1.12 })
          const editButtonHover = useHoverLift({ scale: 1.2 })
          const editButtonRotation = useIconRotation({ enabled: false, targetRotation: 360 })
          const editButtonTap = usePressBounce({ scale: 0.9 })
          
          const cardEntryStyle = useMemo(() => ({
            opacity: cardEntry.opacity,
            y: cardEntry.translateY,
            scale: cardEntry.scale,
          }), [cardEntry.opacity, cardEntry.translateY, cardEntry.scale])
          const cardHoverStyle = useMemo(() => ({
            scale: cardHover.scale,
            y: cardHover.translateY,
          }), [cardHover.scale, cardHover.translateY])
          const imageHoverStyle = useMemo(() => ({
            scale: imageHover.scale,
            y: imageHover.translateY,
          }), [imageHover.scale, imageHover.translateY])
          const editButtonHoverStyle = useMemo(() => ({
            scale: editButtonHover.scale,
            y: editButtonHover.translateY,
          }), [editButtonHover.scale, editButtonHover.translateY])
          const editButtonTapStyle = useMemo(() => ({
            scale: editButtonTap.scale,
          }), [editButtonTap.scale])
          
          return (
            <MotionView
              key={pet.id}
              style={{ ...cardEntryStyle, ...cardHoverStyle }}
              onMouseEnter={cardHover.handleEnter}
              onMouseLeave={cardHover.handleLeave}
            >
              <div className="overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl group relative border border-white/20">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                  <MotionView
                    style={imageHoverStyle}
                    onMouseEnter={imageHover.handleEnter}
                    onMouseLeave={imageHover.handleLeave}
                  >
                    <img
                      src={pet.photo}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  </MotionView>
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <MotionView
                    animatedStyle={editButtonRotation.style}
                    style={{ ...editButtonHoverStyle, ...editButtonTapStyle }}
                    onMouseEnter={() => {
                      editButtonHover.handleEnter()
                    }}
                    onMouseLeave={() => {
                      editButtonHover.handleLeave()
                    }}
                    onClick={() => {
                      editButtonTap.handlePress()
                      handleEdit(pet)
                    }}
                    className="absolute top-3 right-3 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Pencil size={20} className="text-white drop-shadow-lg" weight="bold" />
                  </MotionView>
                </div>

              <div className="p-5 bg-linear-to-br from-white/40 to-white/20 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-2 truncate">{pet.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {pet.breed} • {pet.age} {t.profile.yearsOld} • {pet.gender}
                </p>

                {pet.bio && (
                  <p className="text-sm text-foreground mb-4 line-clamp-3">{pet.bio}</p>
                )}

                {pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t.petProfile.personality.toUpperCase()}</p>
                    <div className="flex flex-wrap gap-2">
                      {pet.personality.slice(0, 5).map((trait, idx) => (
                        <Badge key={idx} variant="secondary">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pet.interests && Array.isArray(pet.interests) && pet.interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t.petProfile.interests.toUpperCase()}</p>
                    <div className="flex flex-wrap gap-2">
                      {pet.interests.slice(0, 5).map((interest, idx) => (
                        <Badge key={idx} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <VerificationButton
                    petId={pet.id}
                    userId={pet.ownerId}
                    variant="card"
                    className="mb-2"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedHealthPet(pet)
                      setShowHealthDashboard(true)
                    }}
                  >
                    <Heart size={16} className="mr-2" weight="fill" />
                    Health Dashboard
                  </Button>
                </div>
                </div>
              </div>
            </MotionView>
          );
        })}
      </div>
      <MotionView
        style={videoSectionStyle}
      >
        <VideoQualitySettings 
          currentQuality={preferredQuality}
          onQualityChange={(quality) => {
            void setPreferredQuality(quality);
          }}
        />
      </MotionView>
      <CreatePetDialog 
        open={showCreateDialog}
        onOpenChange={handleCloseDialog}
        editingPet={editingPet}
      />
      {showHealthDashboard && selectedHealthPet && (
        <PetHealthDashboard
          pet={selectedHealthPet}
          onClose={() => {
            setShowHealthDashboard(false)
            setSelectedHealthPet(null)
          }}
        />
      )}
    </div>
  );
}
