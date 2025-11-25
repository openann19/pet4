import CallInterface from '@/components/call/CallInterface';
import CompatibilityBreakdown from '@/components/CompatibilityBreakdown';
import { DetailedPetAnalytics } from '@/components/enhanced/DetailedPetAnalytics';
import { EnhancedPetDetailView } from '@/components/enhanced/EnhancedPetDetailView';
import { Suspense } from 'react';
import { PlaydateScheduler } from '@/components/lazy-exports';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useCall } from '@/hooks/useCall';
import { useMatches } from '@/hooks/useMatches';
import { haptics } from '@/lib/haptics';
import { calculateCompatibility, getCompatibilityFactors } from '@/lib/matching';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { Match, Pet } from '@/lib/types';
import {
  Calendar,
  ChartBar,
  ChatCircle,
  Heart,
  MapPin,
  Sparkle,
  VideoCamera,
} from '@phosphor-icons/react';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  MotionView
} from '@petspark/motion';
import type { AnimatedStyle } from '@petspark/motion';
import { useState, useEffect, useCallback } from 'react';

interface MatchesViewProps {
  onNavigateToChat?: () => void;
}

export default function MatchesView({ onNavigateToChat }: MatchesViewProps) {
  const { t } = useApp();
  const {
    matchedPets,
    userPet,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  } = useMatches();

  const [breakdownPet, setBreakdownPet] = useState<(Pet & { match: Match }) | null>(null);
  const [playdatePet, setPlaydatePet] = useState<(Pet & { match: Match }) | null>(null);

  const { activeCall, initiateCall, endCall, toggleMute, toggleVideo } = useCall(
    selectedPet?.id ?? 'room',
    userPet?.id ?? 'user',
    userPet?.name ?? 'You',
    userPet?.photo
  );

  // Memoized handlers for match cards
  const handlePetSelect = useCallback((pet: Pet & { match: Match }) => {
    selectPet(pet, pet.match);
  }, [selectPet]);

  const handlePetBreakdown = useCallback((pet: Pet & { match: Match }) => {
    setBreakdownPet(pet);
  }, []);

  const handlePetPlaydate = useCallback((pet: Pet & { match: Match }) => {
    setPlaydatePet(pet);
  }, []);

  const handlePetVideoCall = useCallback((pet: Pet & { match: Match }) => {
    void initiateCall(pet.id, pet.name, pet.photo, 'video');
  }, [initiateCall]);

  const handleStartChat = useCallback(() => {
    haptics.trigger('medium');
    onNavigateToChat?.();
  }, [onNavigateToChat]);

  // Animation hooks for empty state
  const emptyHeartScale = useSharedValue(0);
  const emptyHeartRotate = useSharedValue(-180);
  const emptyPulseScale = useSharedValue(1);
  const emptyPulseOpacity = useSharedValue(0.5);
  const emptyTextOpacity = useSharedValue(0);
  const emptyTextY = useSharedValue(20);
  const innerHeartScale = useSharedValue(1);

  // Presence hooks
  const emptyStatePresence = useAnimatePresence({ isVisible: matchedPets.length === 0 && !isLoading });

  // Initialize empty state animations
  useEffect(() => {
    if (matchedPets.length === 0 && !isLoading) {
      emptyHeartScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      emptyHeartRotate.value = withSpring(0, { damping: 15, stiffness: 200 });
      emptyTextOpacity.value = withTiming(1, { duration: 300 });
      emptyTextY.value = withSpring(0, { damping: 20, stiffness: 300 });

      // Pulse animation
      emptyPulseScale.value = withRepeat(
        withSequence(withTiming(1.5, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        false
      );
      emptyPulseOpacity.value = withRepeat(
        withSequence(withTiming(0, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
        -1,
        false
      );

      innerHeartScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 750 }),
          withTiming(1, { duration: 750 })
        ),
        -1,
        true
      );
    }
  }, [
    matchedPets.length,
    isLoading,
    emptyHeartScale,
    emptyHeartRotate,
    emptyTextOpacity,
    emptyTextY,
    emptyPulseScale,
    emptyPulseOpacity,
    innerHeartScale,
  ]);

  const emptyHeartStyle = useAnimatedStyle(() => ({
    transform: `scale(${emptyHeartScale.value}) rotate(${emptyHeartRotate.value}deg)`,
  })) as AnimatedStyle;

  const emptyPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emptyPulseScale.value }],
    opacity: emptyPulseOpacity.value,
  })) as AnimatedStyle;

  const emptyTextStyle = useAnimatedStyle(() => ({
    opacity: emptyTextOpacity.value,
    transform: [{ translateY: emptyTextY.value }],
  })) as AnimatedStyle;

  const innerHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerHeartScale.value }],
  })) as AnimatedStyle;

  if (isLoading) {
    return null;
  }

  if (matchedPets.length === 0) {
    return (
      <PageTransitionWrapper key="matches-empty" direction="up">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          {emptyStatePresence.shouldRender && (
            <MotionView
              style={emptyHeartStyle}
              className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
            >
              <MotionView style={innerHeartStyle}>
                <Heart size={48} className="text-primary" />
              </MotionView>
              <MotionView
                style={emptyPulseStyle}
                className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"
              />
            </MotionView>
          )}
          <MotionView style={emptyTextStyle} className="text-2xl font-bold mb-2">
            {t.matches.noMatches}
          </MotionView>
          <MotionView style={emptyTextStyle} className="text-muted-foreground mb-6 max-w-md">
            {t.matches.noMatchesDesc}
          </MotionView>
        </div>
      </PageTransitionWrapper>
    );
  }

  return (
    <PageTransitionWrapper key="matches-content" direction="up">
      <main aria-label="Matches view">
        <section aria-label="Matches">
          <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={cn(
                getTypographyClasses('h1'),
                'mb-2'
              )}>{t.matches.title}</h1>
              <p className="text-muted-foreground">
                {matchedPets.length}{' '}
                {matchedPets.length === 1 ? t.matches.subtitle : t.matches.subtitlePlural}
              </p>
            </div>
            {onNavigateToChat && matchedPets.length > 0 && (
              <MotionView>
                <Button
                  onClick={handleStartChat}
                  className="bg-linear-to-r from-primary to-accent hover:shadow-xl transition-all"
                  size="lg"
                >
                  <ChatCircle size={20} weight="fill" className="mr-2" />
                  {t.matches.startChat}
                </Button>
              </MotionView>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Match cards">
            {matchedPets.map((pet) => (
              <MatchCard
                key={pet.id}
                pet={pet}
                onSelect={() => handlePetSelect(pet)}
                onBreakdown={() => handlePetBreakdown(pet)}
                onPlaydate={() => handlePetPlaydate(pet)}
                onVideoCall={() => handlePetVideoCall(pet)}
                onChat={onNavigateToChat}
                t={t}
              />
            ))}
          </div>

          <MotionView>
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
          </MotionView>

          <Dialog open={!!breakdownPet} onOpenChange={(open) => !open && setBreakdownPet(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {breakdownPet && userPet && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">{breakdownPet.name}</h3>
                    <p className="text-muted-foreground">
                      {t.matches.compatibilityWith} {userPet.name}
                    </p>
                  </div>
                  <Tabs defaultValue="analytics" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                    </TabsList>
                    <TabsContent value="analytics" className="mt-4">
                      <DetailedPetAnalytics
                        pet={breakdownPet}
                        {...(breakdownPet.trustProfile
                          ? { trustProfile: breakdownPet.trustProfile }
                          : {})}
                        compatibilityScore={calculateCompatibility(userPet, breakdownPet)}
                        matchReasons={breakdownPet.match.reasoning ?? []}
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
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
              <PlaydateScheduler
                match={playdatePet.match}
                userPet={userPet}
                onClose={() => setPlaydatePet(null)}
                onStartVideoCall={() => {
                  void initiateCall(playdatePet.id, playdatePet.name, playdatePet.photo, 'video');
                  setPlaydatePet(null);
                }}
                onStartVoiceCall={() => {
                  void initiateCall(playdatePet.id, playdatePet.name, playdatePet.photo, 'voice');
                  setPlaydatePet(null);
                }}
              />
            </Suspense>
          )}

          <MotionView>
            {activeCall && (
              <CallInterface
                session={activeCall}
                onEndCall={endCall}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
              />
            )}
          </MotionView>
        </section>
      </main>
    </PageTransitionWrapper>
  );
}

interface MatchCardProps {
  pet: Pet & { match: Match };
  onSelect: () => void;
  onBreakdown: () => void;
  onPlaydate: () => void;
  onVideoCall: () => void;
  onChat?: () => void;
  t: ReturnType<typeof useApp>['t'];
}

function MatchCard({
  pet,
  onSelect,
  onBreakdown,
  onPlaydate,
  onVideoCall,
  onChat,
  t,
}: MatchCardProps): React.ReactElement {
  return (
    <MotionView>
      <div
        className="overflow-hidden rounded-3xl glass-strong premium-shadow backdrop-blur-2xl cursor-pointer group relative border border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={() => {
          haptics.trigger('selection');
          onSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            haptics.trigger('selection');
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View match details for ${pet.name}`}
      >
        <MotionView className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative h-64 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
          <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
          <MotionView className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
          <MotionView className="absolute top-3 right-3 glass-strong px-3 py-1.5 rounded-full font-bold text-sm shadow-2xl border border-white/30 backdrop-blur-xl">
            <span className="bg-linear-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              {pet.match.compatibilityScore}%
            </span>
          </MotionView>
          <MotionView
            onClick={(e) => {
              e.stopPropagation();
              haptics.trigger('selection');
              onBreakdown();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                haptics.trigger('selection');
                onBreakdown();
              }
            }}
            role="button"
            tabIndex={0}
            className="absolute bottom-3 right-3 w-11 h-11 glass-strong rounded-full flex items-center justify-center shadow-xl border border-white/30 backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
            aria-label={`View compatibility breakdown for ${pet.name}`}
          >
            <ChartBar size={20} className="text-white drop-shadow-lg" weight="bold" aria-hidden="true" />
          </MotionView>
        </div>

        <div className="p-5 bg-linear-to-br from-white/40 to-white/20 backdrop-blur-md">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold truncate">{pet.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <MapPin size={14} weight="fill" />
                {pet.location}
              </p>
            </div>
            <MatchCardActions onPlaydate={onPlaydate} onVideoCall={onVideoCall} onChat={onChat} />
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
              <p className="text-sm text-foreground line-clamp-2">{pet.match.reasoning[0]}</p>
            </div>
          )}
        </div>
      </div>
    </MotionView>
  );
}

interface MatchCardActionsProps {
  onPlaydate: () => void;
  onVideoCall: () => void;
  onChat?: () => void;
}

function MatchCardActions({
  onPlaydate,
  onVideoCall,
  onChat,
}: MatchCardActionsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <MotionView
        onClick={(e) => {
          e.stopPropagation();
          haptics.trigger('selection');
          onPlaydate();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            haptics.trigger('selection');
            onPlaydate();
          }
        }}
        role="button"
        tabIndex={0}
        className="w-10 h-10 rounded-full bg-linear-to-br from-secondary to-primary flex items-center justify-center shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
        aria-label="Schedule playdate"
      >
        <Calendar size={18} weight="fill" className="text-white" aria-hidden="true" />
      </MotionView>
      <MotionView
        onClick={(e) => {
          e.stopPropagation();
          haptics.trigger('medium');
          onVideoCall();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            haptics.trigger('medium');
            onVideoCall();
          }
        }}
        role="button"
        tabIndex={0}
        className="w-10 h-10 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
        aria-label="Start video call"
      >
        <VideoCamera size={18} weight="fill" className="text-white" aria-hidden="true" />
      </MotionView>
      {onChat && (
        <MotionView
          onClick={(e) => {
            e.stopPropagation();
            haptics.trigger('medium');
            onChat();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              haptics.trigger('medium');
              onChat();
            }
          }}
          role="button"
          tabIndex={0}
          className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
          aria-label="Start chat"
        >
          <ChatCircle size={18} weight="fill" className="text-white" aria-hidden="true" />
        </MotionView>
      )}
    </div>
  );
}
