import { PetRatings } from '@/components/PetRatings'
import { TrustBadges } from '@/components/TrustBadges'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { usePhotoCarousel } from '@/hooks/usePhotoCarousel'
import { haptics } from '@/lib/haptics'
import type { Pet } from '@/lib/types'
import { Calendar, CaretLeft, CaretRight, ChatCircle, GenderFemale, GenderMale, Heart, MapPin, PawPrint, Ruler, ShieldCheck, Star, X } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

interface PetDetailDialogProps {
  pet: Pet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PetDetailDialog({ pet, open, onOpenChange }: PetDetailDialogProps) {
  if (!pet) return null

  const photos = pet.photos || [pet.photo]
  const {
    currentIndex,
    currentPhoto,
    hasMultiplePhotos,
    totalPhotos,
    nextPhoto,
    prevPhoto,
    goToPhoto,
  } = usePhotoCarousel({ photos })

  const sizeMap: Record<string, string> = {
    'small': 'Small (< 20 lbs)',
    'medium': 'Medium (20-50 lbs)',
    'large': 'Large (50-100 lbs)',
    'extra-large': 'Extra Large (> 100 lbs)'
  }

  // Animation hooks
  const dialogOpacity = useSharedValue(0)
  const dialogScale = useSharedValue(0.95)
  const dialogY = useSharedValue(20)
  const photoOpacity = useSharedValue(0)
  const photoScale = useSharedValue(0.98)
  
  // Interactive element hooks
  const closeButtonHover = useHoverLift()
  const closeButtonTap = useBounceOnTap()
  // (Reserved for future interactive buttons; remove unused to satisfy lints)
  
  // Presence hooks
  const dialogPresence = useAnimatePresence({ isVisible: open })

  // Initialize dialog animation
  useEffect(() => {
    if (open) {
      dialogOpacity.value = withSpring(1, { damping: 20, stiffness: 300 })
      dialogScale.value = withSpring(1, { damping: 20, stiffness: 300 })
      dialogY.value = withSpring(0, { damping: 20, stiffness: 300 })
    } else {
      dialogOpacity.value = withTiming(0, { duration: 200 })
      dialogScale.value = withTiming(0.95, { duration: 200 })
      dialogY.value = withTiming(20, { duration: 200 })
    }
  }, [open])

  const dialogStyle = useAnimatedStyle(() => ({
    opacity: dialogOpacity.value,
    transform: [
      { scale: dialogScale.value },
      { translateY: dialogY.value }
    ]
  })) as AnimatedStyle

  // Animate photo transition when the current photo index changes
  useEffect(() => {
    photoOpacity.value = 0
    photoScale.value = 0.98
    // small timeout ensures the key change applies before animating in
    requestAnimationFrame(() => {
      photoOpacity.value = withSpring(1, { damping: 20, stiffness: 250 })
      photoScale.value = withSpring(1, { damping: 20, stiffness: 250 })
    })
  }, [currentIndex])

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: photoScale.value }]
  })) as AnimatedStyle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent">
  {dialogPresence.shouldRender && open && (
          <AnimatedView
            style={[dialogStyle, dialogPresence.animatedStyle]}
            className="relative bg-card rounded-3xl overflow-hidden shadow-2xl"
          >
            <AnimatedView
              style={[
                closeButtonHover.animatedStyle,
                closeButtonTap.animatedStyle
              ]}
              onClick={() => {
                haptics.trigger('light')
                onOpenChange(false)
              }}
              onMouseEnter={closeButtonHover.handleEnter}
              onMouseLeave={closeButtonHover.handleLeave}
              onMouseDown={closeButtonTap.handlePress}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full glass-strong flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl cursor-pointer"
            >
              <X size={20} className="text-white drop-shadow-lg" weight="bold" />
            </AnimatedView>

          <div className="relative h-[400px] bg-linear-to-br from-muted/50 to-muted overflow-hidden group">
            <AnimatedView
              key={currentIndex}
              style={photoStyle}
              className="w-full h-full"
            >
              <img
                src={currentPhoto}
                alt={`${pet.name} photo ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </AnimatedView>
            
            <AnimatedView
              className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"
            />

            {hasMultiplePhotos && (
              <>
                <AnimatedView
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity z-30"
                >
                  <CaretLeft size={24} weight="bold" className="text-white drop-shadow-lg" />
                </AnimatedView>
                <AnimatedView
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity z-30"
                >
                  <CaretRight size={24} weight="bold" className="text-white drop-shadow-lg" />
                </AnimatedView>
                <AnimatedView
                  className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 z-20"
                >
                  {photos.map((_, idx) => (
                    <AnimatedView
                      key={idx}
                      onClick={() => goToPhoto(idx)}
                      className={`h-2 rounded-full transition-all shadow-lg ${
                        idx === currentIndex
                          ? 'bg-white w-10'
                          : 'bg-white/50 w-2 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </AnimatedView>
              </>
            )}

            <AnimatedView
              className="absolute bottom-6 left-6 text-white z-20"
            >
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl sm:text-5xl font-bold drop-shadow-2xl">{pet.name}</h2>
                {pet.verified && (
                  <AnimatedView
                  >
                    <ShieldCheck size={32} weight="fill" className="text-accent drop-shadow-lg" />
                  </AnimatedView>
                )}
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <span className="flex items-center gap-1.5 text-lg">
                  {pet.gender === 'male' ? (
                    <GenderMale size={20} weight="fill" />
                  ) : (
                    <GenderFemale size={20} weight="fill" />
                  )}
                  {pet.age} years
                </span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span className="text-lg">{pet.breed}</span>
              </div>
              {hasMultiplePhotos && (
                <AnimatedView
                  className="text-sm text-white/70 mt-2"
                >
                  Photo {currentIndex + 1} of {totalPhotos}
                </AnimatedView>
              )}
            </AnimatedView>
          </div>

          <div className="max-h-[calc(90vh-400px)] overflow-y-auto">
            <div className="p-6 sm:p-8 space-y-6">
              {pet.trustProfile && (
                <AnimatedView>
                  <PetRatings 
                    trustProfile={pet.trustProfile} 
                    {...(pet.ratings !== undefined ? { ratings: pet.ratings } : {})}
                  />
                </AnimatedView>
              )}

              {pet.bio && (
                <AnimatedView
                  className="space-y-2"
                >
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ChatCircle size={16} weight="fill" className="text-primary" />
                    About {pet.name}
                  </h3>
                  <p className="text-foreground leading-relaxed">{pet.bio}</p>
                </AnimatedView>
              )}

              <Separator />

              <AnimatedView
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <PawPrint size={16} weight="fill" className="text-primary" />
                    Details
                  </h3>
                  <div className="space-y-3">
                    <AnimatedView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar size={18} weight="fill" className="text-accent" />
                        Age
                      </span>
                      <span className="font-semibold">{pet.age} years old</span>
                    </AnimatedView>
                    <AnimatedView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        {pet.gender === 'male' ? (
                          <GenderMale size={18} weight="fill" className="text-accent" />
                        ) : (
                          <GenderFemale size={18} weight="fill" className="text-accent" />
                        )}
                        Gender
                      </span>
                      <span className="font-semibold capitalize">{pet.gender}</span>
                    </AnimatedView>
                    <AnimatedView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Ruler size={18} weight="fill" className="text-accent" />
                        Size
                      </span>
                      <span className="font-semibold">{sizeMap[pet.size] || pet.size}</span>
                    </AnimatedView>
                    <AnimatedView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin size={18} weight="fill" className="text-accent" />
                        Location
                      </span>
                      <span className="font-semibold">{pet.location}</span>
                    </AnimatedView>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Heart size={16} weight="fill" className="text-primary" />
                    Owner
                  </h3>
                  <AnimatedView
                    className="p-4 rounded-xl bg-linear-to-br from-primary/5 to-accent/5 border border-border"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                        <AvatarImage src={pet.ownerAvatar} />
                        <AvatarFallback className="bg-linear-to-br from-primary to-accent text-primary-foreground text-lg font-bold">
                          {pet.ownerName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{pet.ownerName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={14} weight="fill" />
                          {pet.location}
                        </p>
                      </div>
                    </div>
                    {pet.trustProfile && (
                      <div className="flex items-center gap-2 justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Star size={16} weight="fill" className="text-accent" />
                          <span className="text-sm font-semibold">
                            {pet.trustProfile.overallRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pet.trustProfile.totalReviews} reviews
                        </span>
                        {pet.trustProfile.responseRate > 0 && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-xs text-muted-foreground">
                              {pet.trustProfile.responseRate}% response rate
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </AnimatedView>
                </div>
              </AnimatedView>

              {pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0 && (
                <>
                  <Separator />
                  <AnimatedView
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Personality Traits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.personality.map((trait, idx) => (
                        <AnimatedView
                          key={idx}
                        >
                          <Badge 
                            variant="secondary" 
                            className="px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                          >
                            {trait}
                          </Badge>
                        </AnimatedView>
                      ))}
                    </div>
                  </AnimatedView>
                </>
              )}

              {pet.interests && Array.isArray(pet.interests) && pet.interests.length > 0 && (
                <>
                  <Separator />
                  <AnimatedView
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Interests & Activities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.interests.map((interest, idx) => (
                        <AnimatedView
                          key={idx}
                        >
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 text-sm font-medium border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                          >
                            {interest}
                          </Badge>
                        </AnimatedView>
                      ))}
                    </div>
                  </AnimatedView>
                </>
              )}

              {pet.lookingFor && Array.isArray(pet.lookingFor) && pet.lookingFor.length > 0 && (
                <>
                  <Separator />
                  <AnimatedView
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Looking For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.lookingFor.map((item, idx) => (
                        <AnimatedView
                          key={idx}
                        >
                          <Badge 
                            className="px-3 py-1.5 text-sm font-medium bg-linear-to-r from-primary to-accent text-white hover:shadow-lg transition-all"
                          >
                            {item}
                          </Badge>
                        </AnimatedView>
                      ))}
                    </div>
                  </AnimatedView>
                </>
              )}

              {pet.trustProfile && pet.trustProfile.badges && Array.isArray(pet.trustProfile.badges) && pet.trustProfile.badges.length > 0 && (
                <>
                  <Separator />
                  <AnimatedView
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={16} weight="fill" className="text-primary" />
                      Trust & Verification
                    </h3>
                    <TrustBadges badges={pet.trustProfile.badges} showLabels />
                  </AnimatedView>
                </>
              )}
            </div>
          </div>
        </AnimatedView>

      </DialogContent>
    </Dialog>
  )
}

