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
import { Presence, motion } from '@petspark/motion'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-0 bg-transparent">
        <MotionView
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative bg-card rounded-3xl overflow-hidden shadow-2xl"
        >
          <MotionView as="button"
            onClick={() => {
              haptics.trigger('light')
              onOpenChange(false)
            }}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full glass-strong flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} className="text-white drop-shadow-lg" weight="bold" />
          </MotionView>

          <div className="relative h-[400px] bg-gradient-to-br from-muted/50 to-muted overflow-hidden group">
            <Presence mode="wait">
              <motion.img
                key={currentIndex}
                src={currentPhoto}
                alt={`${pet.name} photo ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />
            </Presence>
            
            <MotionView
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />

            {hasMultiplePhotos && (
              <>
                <MotionView as="button"
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  whileHover={{ scale: 1.15, x: -4 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CaretLeft size={24} weight="bold" className="text-white drop-shadow-lg" />
                </MotionView>
                <MotionView as="button"
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 glass-strong rounded-full flex items-center justify-center shadow-2xl border border-white/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  whileHover={{ scale: 1.15, x: 4 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CaretRight size={24} weight="bold" className="text-white drop-shadow-lg" />
                </MotionView>
                <MotionView
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 z-20"
                >
                  {photos.map((_, idx) => (
                    <MotionView as="button"
                      key={idx}
                      onClick={() => goToPhoto(idx)}
                      className={`h-2 rounded-full transition-all shadow-lg ${
                        idx === currentIndex
                          ? 'bg-white w-10'
                          : 'bg-white/50 w-2 hover:bg-white/75'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </MotionView>
              </>
            )}

            <MotionView
              className="absolute bottom-6 left-6 text-white z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl sm:text-5xl font-bold drop-shadow-2xl">{pet.name}</h2>
                {pet.verified && (
                  <MotionView
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <ShieldCheck size={32} weight="fill" className="text-accent drop-shadow-lg" />
                  </MotionView>
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
                <MotionView
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-white/70 mt-2"
                >
                  Photo {currentIndex + 1} of {totalPhotos}
                </MotionView>
              )}
            </MotionView>
          </div>

          <div className="max-h-[calc(90vh-400px)] overflow-y-auto">
            <div className="p-6 sm:p-8 space-y-6">
              {pet.trustProfile && (
                <MotionView
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <PetRatings 
                    trustProfile={pet.trustProfile} 
                    {...(pet.ratings !== undefined ? { ratings: pet.ratings } : {})}
                  />
                </MotionView>
              )}

              {pet.bio && (
                <MotionView
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-2"
                >
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ChatCircle size={16} weight="fill" className="text-primary" />
                    About {pet.name}
                  </h3>
                  <p className="text-foreground leading-relaxed">{pet.bio}</p>
                </MotionView>
              )}

              <Separator />

              <MotionView
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <PawPrint size={16} weight="fill" className="text-primary" />
                    Details
                  </h3>
                  <div className="space-y-3">
                    <MotionView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                      whileHover={{ scale: 1.02, backgroundColor: 'oklch(from var(--muted) l c h / 0.7)' }}
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar size={18} weight="fill" className="text-accent" />
                        Age
                      </span>
                      <span className="font-semibold">{pet.age} years old</span>
                    </MotionView>
                    <MotionView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                      whileHover={{ scale: 1.02, backgroundColor: 'oklch(from var(--muted) l c h / 0.7)' }}
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
                    </MotionView>
                    <MotionView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                      whileHover={{ scale: 1.02, backgroundColor: 'oklch(from var(--muted) l c h / 0.7)' }}
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Ruler size={18} weight="fill" className="text-accent" />
                        Size
                      </span>
                      <span className="font-semibold">{sizeMap[pet.size] || pet.size}</span>
                    </MotionView>
                    <MotionView
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                      whileHover={{ scale: 1.02, backgroundColor: 'oklch(from var(--muted) l c h / 0.7)' }}
                    >
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin size={18} weight="fill" className="text-accent" />
                        Location
                      </span>
                      <span className="font-semibold">{pet.location}</span>
                    </MotionView>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Heart size={16} weight="fill" className="text-primary" />
                    Owner
                  </h3>
                  <MotionView
                    className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border"
                    whileHover={{ scale: 1.02, borderColor: 'oklch(from var(--primary) l c h / 0.3)' }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                        <AvatarImage src={pet.ownerAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg font-bold">
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
                  </MotionView>
                </div>
              </MotionView>

              {pet.personality && Array.isArray(pet.personality) && pet.personality.length > 0 && (
                <>
                  <Separator />
                  <MotionView
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Personality Traits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.personality.map((trait, idx) => (
                        <MotionView
                          key={idx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.55 + idx * 0.05 }}
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                          >
                            {trait}
                          </Badge>
                        </MotionView>
                      ))}
                    </div>
                  </MotionView>
                </>
              )}

              {pet.interests && Array.isArray(pet.interests) && pet.interests.length > 0 && (
                <>
                  <Separator />
                  <MotionView
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Interests & Activities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.interests.map((interest, idx) => (
                        <MotionView
                          key={idx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + idx * 0.05 }}
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <Badge 
                            variant="outline" 
                            className="px-3 py-1.5 text-sm font-medium border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                          >
                            {interest}
                          </Badge>
                        </MotionView>
                      ))}
                    </div>
                  </MotionView>
                </>
              )}

              {pet.lookingFor && Array.isArray(pet.lookingFor) && pet.lookingFor.length > 0 && (
                <>
                  <Separator />
                  <MotionView
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Looking For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pet.lookingFor.map((item, idx) => (
                        <MotionView
                          key={idx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.65 + idx * 0.05 }}
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <Badge 
                            className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all"
                          >
                            {item}
                          </Badge>
                        </MotionView>
                      ))}
                    </div>
                  </MotionView>
                </>
              )}

              {pet.trustProfile && pet.trustProfile.badges && Array.isArray(pet.trustProfile.badges) && pet.trustProfile.badges.length > 0 && (
                <>
                  <Separator />
                  <MotionView
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={16} weight="fill" className="text-primary" />
                      Trust & Verification
                    </h3>
                    <TrustBadges badges={pet.trustProfile.badges} showLabels />
                  </MotionView>
                </>
              )}
            </div>
          </div>
        </MotionView>
      </DialogContent>
    </Dialog>
  )
}
