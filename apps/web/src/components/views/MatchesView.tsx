import CallInterface from '@/components/call/CallInterface'
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown'
import { DetailedPetAnalytics } from '@/components/enhanced/DetailedPetAnalytics'
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView'
import PlaydateScheduler from '@/components/playdate/PlaydateScheduler'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/contexts/AppContext'
import { useCall } from '@/hooks/useCall'
import { useMatches } from '@/hooks/useMatches'
import { haptics } from '@/lib/haptics'
import { calculateCompatibility, getCompatibilityFactors } from '@/lib/matching'
import type { Match, Pet } from '@/lib/types'
import { Calendar, ChartBar, ChatCircle, Heart, MapPin, Sparkle, VideoCamera } from '@phosphor-icons/react'
import { Presence, motion } from '@petspark/motion'
import { useState } from 'react'

interface MatchesViewProps {
  onNavigateToChat?: () => void
}

export default function MatchesView({ onNavigateToChat }: MatchesViewProps) {
  const { t } = useApp()
  const {
    matchedPets,
    userPet,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  } = useMatches()

  const [breakdownPet, setBreakdownPet] = useState<(Pet & { match: Match }) | null>(null)
  const [playdatePet, setPlaydatePet] = useState<Pet & { match: Match } | null>(null)

  const {
    activeCall,
    initiateCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall(
    selectedPet?.id || 'room',
    userPet?.id || 'user',
    userPet?.name || 'You',
    userPet?.photo
  )

  if (isLoading) {
    return null
  }

  if (matchedPets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MotionView
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
        >
          <MotionView
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart size={48} className="text-primary" />
          </MotionView>
          <MotionView
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20"
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
          {t.matches.noMatches}
        </MotionView>
        <MotionView
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6 max-w-md"
        >
          {t.matches.noMatchesDesc}
        </MotionView>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold mb-2">{t.matches.title}</h2>
          <p className="text-muted-foreground">
            {matchedPets.length} {matchedPets.length === 1 ? t.matches.subtitle : t.matches.subtitlePlural}
          </p>
        </div>
        {onNavigateToChat && matchedPets.length > 0 && (
          <MotionView
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => {
                haptics.trigger('medium')
                onNavigateToChat()
              }}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all"
              size="lg"
            >
              <ChatCircle size={20} weight="fill" className="mr-2" />
              {t.matches.startChat}
            </Button>
          </MotionView>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchedPets.map((pet, idx) => (
          <MotionView
            key={pet.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
            whileHover={{ y: -12, scale: 1.03 }}
          >
            <div 
              className="overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl cursor-pointer group relative border border-white/20"
            >
              <MotionView
                className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              />
              <div 
                className="relative h-64 overflow-hidden"
                onClick={() => {
                  haptics.trigger('selection')
                  selectPet(pet, pet.match)
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                <motion.img
                  src={pet.photo}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.12 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
                <MotionView
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                />
                <MotionView 
                  className="absolute top-3 right-3 glass-strong px-3 py-1.5 rounded-full font-bold text-sm shadow-2xl border border-white/30 backdrop-blur-xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.08 + 0.3, type: 'spring' }}
                  whileHover={{ scale: 1.15, rotate: 360, borderColor: 'rgba(245, 158, 11, 0.8)' }}
                >
                  <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                    {pet.match.compatibilityScore}%
                  </span>
                </MotionView>
                <MotionView as="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    haptics.trigger('selection')
                    setBreakdownPet(pet)
                  }}
                  className="absolute bottom-3 right-3 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl"
                  whileHover={{ scale: 1.2, rotate: 360, borderColor: 'rgba(255, 255, 255, 0.6)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChartBar size={20} className="text-white drop-shadow-lg" weight="bold" />
                </MotionView>
              </div>

              <div className="p-5 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin size={14} weight="fill" />
                      {pet.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <MotionView as="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        haptics.trigger('selection')
                        setPlaydatePet(pet)
                      }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      title="Schedule playdate"
                    >
                      <Calendar size={18} weight="fill" className="text-white" />
                    </MotionView>
                    <MotionView as="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        haptics.trigger('medium')
                        initiateCall(pet.id, pet.name, pet.photo, 'video')
                      }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      title="Start video call"
                    >
                      <VideoCamera size={18} weight="fill" className="text-white" />
                    </MotionView>
                    {onNavigateToChat && (
                      <MotionView as="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          haptics.trigger('medium')
                          onNavigateToChat()
                        }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        title="Start chat"
                      >
                        <ChatCircle size={18} weight="fill" className="text-white" />
                      </MotionView>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {pet.breed} • {pet.age} {t.common.years}
                </p>

                {pet.match.reasoning.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkle size={12} weight="fill" className="text-accent" />
                      {t.matches.whyMatched}
                    </p>
                    <p className="text-sm text-foreground line-clamp-2">
                      {pet.match.reasoning[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </MotionView>
        ))}
      </div>

      <Presence>
        {selectedPet && selectedMatch && (
          <EnhancedPetDetailView
            pet={selectedPet}
            onClose={clearSelection}
            {...(onNavigateToChat ? { onChat: onNavigateToChat } : {})}
            compatibilityScore={selectedMatch.compatibilityScore}
            matchReasons={matchReasoning}
            showActions={false}
          />
        )}
      </Presence>

      <Dialog open={!!breakdownPet} onOpenChange={(open) => !open && setBreakdownPet(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {breakdownPet && userPet && (
            <div>
              <div className="mb-4">
                <h3 className="text-2xl font-bold">{breakdownPet.name}</h3>
                <p className="text-muted-foreground">{t.matches.compatibilityWith} {userPet.name}</p>
              </div>
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                </TabsList>
                <TabsContent value="analytics" className="mt-4">
                  <DetailedPetAnalytics
                    pet={breakdownPet}
                    {...(breakdownPet.trustProfile ? { trustProfile: breakdownPet.trustProfile } : {})}
                    compatibilityScore={calculateCompatibility(userPet, breakdownPet)}
                    matchReasons={breakdownPet.match.reasoning || []}
                  />
                </TabsContent>
                <TabsContent value="breakdown" className="mt-4">
                  <CompatibilityBreakdown 
                    factors={getCompatibilityFactors(userPet, breakdownPet)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {playdatePet && userPet && (
        <PlaydateScheduler
          match={playdatePet.match}
          userPet={userPet}
          onClose={() => setPlaydatePet(null)}
          onStartVideoCall={() => {
            initiateCall(playdatePet.id, playdatePet.name, playdatePet.photo, 'video')
            setPlaydatePet(null)
          }}
          onStartVoiceCall={() => {
            initiateCall(playdatePet.id, playdatePet.name, playdatePet.photo, 'voice')
            setPlaydatePet(null)
          }}
        />
      )}

      <Presence>
        {activeCall && (
          <CallInterface
            session={activeCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        )}
      </Presence>
    </div>
  )
}
