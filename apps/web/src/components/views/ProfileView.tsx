import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion } from '@petspark/motion'
import { Plus, PawPrint, Pencil, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Pet, Match, SwipeAction } from '@/lib/types'
import type { VideoQuality } from '@/lib/call-types'
import type { ThemePreset } from '@/lib/theme-presets'
import CreatePetDialog from '@/components/CreatePetDialog'
import StatsCard from '@/components/StatsCard'
import VisualAnalysisDemo from '@/components/VisualAnalysisDemo'
import HighlightsBar from '@/components/stories/HighlightsBar'
import VideoQualitySettings from '@/components/call/VideoQualitySettings'
import ThemePresetSelector from '@/components/ThemePresetSelector'
import { SubscriptionStatusCard } from '@/components/payments/SubscriptionStatusCard'
import PetHealthDashboard from '@/components/health/PetHealthDashboard'
import { VerificationButton } from '@/components/verification/VerificationButton'
import { useApp } from '@/contexts/AppContext'

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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-2xl relative"
          >
            <MotionView
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <PawPrint size={48} className="text-white" weight="fill" />
            </MotionView>
            <MotionView
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </MotionView>
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-2"
          >
            {t.profile.createProfile}
          </MotionView>
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6 max-w-md"
          >
            {t.profile.noPetsDesc}
          </MotionView>
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MotionView
              whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl"
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
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-4">
      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-2 sm:py-0 sm:bg-transparent sm:backdrop-blur-none"
      >
        <ThemePresetSelector 
          currentPreset={themePreset}
          onPresetChange={handleThemePresetChange}
        />
      </MotionView>

      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
      >
        <SubscriptionStatusCard />
      </MotionView>

      {totalSwipes > 0 && (
        <StatsCard
          totalMatches={totalMatches}
          totalSwipes={totalSwipes}
          successRate={successRate}
        />
      )}

      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong p-6 rounded-3xl border border-white/20"
      >
        <h3 className="text-lg font-bold mb-4">Story Highlights</h3>
        <HighlightsBar onlyOwn={true} />
      </MotionView>

      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VisualAnalysisDemo />
      </MotionView>
      
      <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{t.profile.myPets}</h2>
          <p className="text-sm text-muted-foreground">
            {userPets?.length} {userPets?.length === 1 ? t.profile.subtitle : t.profile.subtitlePlural}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
          <Plus size={18} weight="bold" className="mr-1 sm:mr-2" />
          <span className="text-sm">{t.profile.addPet}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {(userPets || []).map((pet, idx) => (
          <MotionView
            key={pet.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
            whileHover={{ y: -12, scale: 1.03 }}
          >
            <div className="overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl group relative border border-white/20">
              <MotionView
                className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              />
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                <motion.img
                  src={pet.photo}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.12 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
                <MotionView
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
                <MotionView as="button"
                  onClick={() => handleEdit(pet)}
                  className="absolute top-3 right-3 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl"
                  whileHover={{ scale: 1.2, rotate: 360, borderColor: 'rgba(255, 255, 255, 0.6)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Pencil size={20} className="text-white drop-shadow-lg" weight="bold" />
                </MotionView>
              </div>

              <div className="p-5 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md">
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
        ))}
      </div>

      <MotionView
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <VideoQualitySettings 
          currentQuality={preferredQuality}
          onQualityChange={setPreferredQuality}
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
  )
}
