'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  Calendar,
  ChatCircle,
  Heart,
  Lightning,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  TrendUp,
  Users,
  X,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useSharedValue, useAnimatedStyle, withSpring, withDelay } from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { haptics } from '@/lib/haptics';
import type { Pet } from '@/lib/types';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface EnhancedPetDetailViewProps {
  pet: Pet;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onChat?: () => void;
  compatibilityScore?: number;
  matchReasons?: string[];
  showActions?: boolean;
}

export function EnhancedPetDetailView({
  pet,
  onClose,
  onLike,
  onPass,
  onChat,
  compatibilityScore,
  matchReasons,
  showActions = true,
}: EnhancedPetDetailViewProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photo];

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleNextPhoto = useCallback((): void => {
    setIsLoading(true);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    haptics.trigger('light');
  }, [photos.length]);

  const handlePrevPhoto = useCallback((): void => {
    setIsLoading(true);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    haptics.trigger('light');
  }, [photos.length]);

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: handleNextPhoto,
    onSwipeRight: handlePrevPhoto,
    threshold: 50,
  });

  const handleImageLoad = useCallback((): void => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback((): void => {
    setIsLoading(false);
  }, []);

  const handleLike = useCallback(() => {
    haptics.trigger('medium');
    onLike?.();
  }, [onLike]);

  const handlePass = useCallback(() => {
    haptics.trigger('light');
    onPass?.();
  }, [onPass]);

  const handleChat = useCallback(() => {
    haptics.trigger('light');
    onChat?.();
  }, [onChat]);

  const trustScore = pet.trustScore ?? 0;
  const getTrustLevel = useCallback((score: number) => {
    if (score >= 80) return { label: 'Highly Trusted', color: 'text-green-500' };
    if (score >= 60) return { label: 'Trusted', color: 'text-blue-500' };
    if (score >= 40) return { label: 'Established', color: 'text-yellow-500' };
    return { label: 'New', color: 'text-muted-foreground' };
  }, []);

  const trustLevel = getTrustLevel(trustScore);

  // Animation hooks
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.95);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.95);
  const photoOpacity = useSharedValue(0);

  // Bounce hooks for buttons

  useEffect(() => {
    if (isVisible) {
      containerOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      containerScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      modalOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
      modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      containerOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
      modalScale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
    }
  }, [isVisible]);

  useEffect(() => {
    photoOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [currentPhotoIndex]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  })) as AnimatedStyle;

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  })) as AnimatedStyle;

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
  })) as AnimatedStyle;

  return (
    <AnimatedView
      className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      style={containerStyle}
    >
      <AnimatedView
        className="w-full max-w-4xl max-h-[90vh] bg-card rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-4 right-4 z-10">
            <CloseButton onClose={handleClose} />
          </div>

          <ScrollArea className="flex-1">
            {/* Photo Gallery */}
            <div className="relative h-96 bg-muted overflow-hidden" {...swipeGesture.handlers}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <AnimatedView className="w-full h-full" key={currentPhotoIndex} style={photoStyle}>
                <img
                  src={photos[currentPhotoIndex]}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </AnimatedView>

              {photos.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                    <PhotoNavButton onClick={handlePrevPhoto} />
                    <PhotoNavButton onClick={handleNextPhoto} />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, idx) => (
                      <PhotoIndicator
                        key={idx}
                        index={idx}
                        isActive={idx === currentPhotoIndex}
                        onClick={() => {
                          setIsLoading(true);
                          setCurrentPhotoIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {compatibilityScore !== undefined && (
                <CompatibilityBadge score={compatibilityScore} />
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <PetHeader pet={pet} trustScore={trustScore} trustLevel={trustLevel} />

              {/* Match Reasons */}
              {matchReasons && matchReasons.length > 0 && (
                <MatchReasonsCard reasons={matchReasons} />
              )}

              {/* Tabs */}
              <PetTabs pet={pet} />
            </div>
          </ScrollArea>

          {/* Actions */}
          {showActions && (
            <ActionButtons
              onLike={onLike ? handleLike : undefined}
              onPass={onPass ? handlePass : undefined}
              onChat={onChat ? handleChat : undefined}
            />
          )}
        </div>
      </AnimatedView>
    </AnimatedView>
  );
}

interface CloseButtonProps {
  onClose: () => void;
}

function CloseButton({ onClose }: CloseButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap();

  const handlePress = useCallback(() => {
    haptics.trigger('light');
    onClose();
  }, [onClose]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePress}
      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
      aria-label="Close pet detail view"
    >
      <AnimatedView style={bounce.animatedStyle}>
        <X size={24} weight="bold" />
      </AnimatedView>
    </Button>
  );
}

interface PhotoNavButtonProps {
  onClick: () => void;
}

function PhotoNavButton({ onClick }: PhotoNavButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap();

  const handlePress = useCallback(() => {
    haptics.trigger('light');
    onClick();
  }, [onClick]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePress}
      className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background pointer-events-auto"
      aria-label="Navigate to next photo"
    >
      <AnimatedView style={bounce.animatedStyle}>
        <PawPrint size={20} weight="fill" />
      </AnimatedView>
    </Button>
  );
}

interface PhotoIndicatorProps {
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function PhotoIndicator({ index, isActive, onClick }: PhotoIndicatorProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`h-2 rounded-full transition-all overflow-hidden ${isActive ? 'w-6 bg-white' : 'w-2 bg-white/50'
        }`}
      aria-label={`Go to photo ${index + 1}`}
    >
      <AnimatedView
        className="h-full rounded-full bg-white"
        style={
          useAnimatedStyle(() => ({
            width: isActive ? 24 : 8,
            opacity: isActive ? 1 : 0.5,
          })) as AnimatedStyle
        }
      />
    </button>
  );
}

interface CompatibilityBadgeProps {
  score: number;
}

function CompatibilityBadge({ score }: CompatibilityBadgeProps): React.JSX.Element {
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);

  useEffect(() => {
    badgeOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    badgeScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  })) as AnimatedStyle;

  return (
    <div className="absolute top-4 left-4">
      <AnimatedView
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-primary to-accent backdrop-blur-sm"
        style={badgeStyle}
      >
        <TrendUp size={20} weight="bold" className="text-white" />
        <span className="text-lg font-bold text-white">{score}% Match</span>
      </AnimatedView>
    </div>
  );
}

interface PetHeaderProps {
  pet: Pet;
  trustScore: number;
  trustLevel: { label: string; color: string };
}

function PetHeader({ pet, trustScore, trustLevel }: PetHeaderProps): React.JSX.Element {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          <p className="text-lg text-muted-foreground">
            {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'}
          </p>
        </div>
        {trustScore > 0 && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className={trustLevel.color} weight="fill" />
              <span className={`font-semibold ${String(trustLevel.color ?? '')}`}>{trustLevel.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">Trust Score: {trustScore}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin size={16} weight="fill" />
        <span>{pet.location}</span>
      </div>
    </div>
  );
}

interface MatchReasonsCardProps {
  reasons: string[];
}

function MatchReasonsCard({ reasons }: MatchReasonsCardProps): React.JSX.Element {
  return (
    <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-accent/5">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Star size={20} className="text-accent" weight="fill" />
          Why This Match Works
        </h3>
        <ul className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <MatchReasonItem key={idx} reason={reason} index={idx} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MatchReasonItemProps {
  reason: string;
  index: number;
}

function MatchReasonItem({ reason, index }: MatchReasonItemProps): React.JSX.Element {
  const itemOpacity = useSharedValue(0);
  const itemX = useSharedValue(-10);

  useEffect(() => {
    itemOpacity.value = withDelay(index * 50, withSpring(1, { damping: 20, stiffness: 300 }));
    itemX.value = withDelay(index * 50, withSpring(0, { damping: 20, stiffness: 300 }));
  }, [index]);

  const itemStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ translateX: itemX.value }],
  })) as AnimatedStyle;

  return (
    <AnimatedView className="text-sm flex items-start gap-2" style={itemStyle}>
      <Heart size={14} className="text-primary mt-0.5 shrink-0" weight="fill" />
      <span>{reason}</span>
    </AnimatedView>
  );
}

interface PetTabsProps {
  pet: Pet;
}

function PetTabs({ pet }: PetTabsProps): React.JSX.Element {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="personality">Personality</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="about" className="space-y-4 mt-4">
        <div>
          <h3 className="font-semibold mb-2">Bio</h3>
          <p className="text-muted-foreground">{pet.bio}</p>
        </div>

        {pet.interests && pet.interests.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {pet.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pet.lookingFor && pet.lookingFor.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {pet.lookingFor.map((item, idx) => (
                <Badge key={idx} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="personality" className="space-y-4 mt-4">
        {pet.personality && pet.personality.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Personality Traits</h3>
            <div className="grid grid-cols-2 gap-3">
              {pet.personality.map((trait, idx) => (
                <PersonalityTrait key={idx} trait={trait} index={idx} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Activity Level</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Energy</span>
              <span className="font-medium">{pet.activityLevel ?? 'Moderate'}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Users}
            label="Playdates"
            value={String(pet.playdateCount ?? 0)}
            color="primary"
          />
          <StatCard
            icon={Star}
            label="Rating"
            value={pet.overallRating?.toFixed(1) ?? 'N/A'}
            color="accent"
          />
          <StatCard
            icon={Lightning}
            label="Response Rate"
            value={`${Math.round((pet.responseRate ?? 0) * 100)}%`}
            color="secondary"
          />
          <StatCard
            icon={Calendar}
            label="Member Since"
            value={String(new Date(pet.createdAt ?? Date.now()).getFullYear())}
            color="lavender"
          />
        </div>

        {pet.badges && pet.badges.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Trust Badges</h3>
            <div className="flex flex-wrap gap-2">
              {pet.badges.map((badge, idx) => (
                <TrustBadgeItem key={idx} badge={badge} index={idx} />
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface PersonalityTraitProps {
  trait: string;
  index: number;
}

function PersonalityTrait({ trait, index }: PersonalityTraitProps): React.JSX.Element {
  const traitOpacity = useSharedValue(0);
  const traitScale = useSharedValue(0.9);

  useEffect(() => {
    traitOpacity.value = withDelay(index * 50, withSpring(1, { damping: 20, stiffness: 300 }));
    traitScale.value = withDelay(index * 50, withSpring(1, { damping: 20, stiffness: 300 }));
  }, [index]);

  const traitStyle = useAnimatedStyle(() => ({
    opacity: traitOpacity.value,
    transform: [{ scale: traitScale.value }],
  })) as AnimatedStyle;

  return (
    <AnimatedView
      className="p-3 rounded-lg bg-muted/50 border border-border text-center"
      style={traitStyle}
    >
      <PawPrint size={24} className="text-primary mx-auto mb-1" weight="fill" />
      <span className="text-sm font-medium">{trait}</span>
    </AnimatedView>
  );
}

interface StatCardProps {
  icon: React.ComponentType<React.ComponentProps<typeof Star>>;
  label: string;
  value: string;
  color: 'primary' | 'accent' | 'secondary' | 'lavender';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps): React.JSX.Element {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    secondary: 'bg-secondary/10 text-secondary',
    lavender: 'bg-lavender/10 text-lavender',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${String(colorClasses[color] ?? '')}`}>
            <Icon size={24} weight="duotone" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrustBadgeItemProps {
  badge: { label: string };
  index: number;
}

function TrustBadgeItem({ badge, index }: TrustBadgeItemProps): React.JSX.Element {
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);

  useEffect(() => {
    badgeOpacity.value = withDelay(index * 50, withSpring(1, { damping: 20, stiffness: 300 }));
    badgeScale.value = withDelay(index * 50, withSpring(1, { damping: 20, stiffness: 300 }));
  }, [index]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  })) as AnimatedStyle;

  return (
    <AnimatedView style={badgeStyle}>
      <Badge className="px-3 py-1.5">
        <ShieldCheck size={14} className="mr-1" weight="fill" />
        {badge.label}
      </Badge>
    </AnimatedView>
  );
}

interface ActionButtonsProps {
  onLike?: (() => void) | undefined;
  onPass?: (() => void) | undefined;
  onChat?: (() => void) | undefined;
}

function ActionButtons({ onLike, onPass, onChat }: ActionButtonsProps): React.JSX.Element {
  return (
    <div className="border-t border-border p-4 bg-card/95 backdrop-blur-sm">
      <div className="flex gap-3 max-w-md mx-auto">
        {onPass && <ActionButton variant="outline" icon={X} label="Pass" onClick={onPass} />}
        {onChat && (
          <ActionButton variant="secondary" icon={ChatCircle} label="Chat" onClick={onChat} />
        )}
        {onLike && (
          <ActionButton
            variant="primary"
            icon={Heart}
            label="Like"
            onClick={onLike}
            className="bg-linear-to-r from-primary to-accent hover:opacity-90"
          />
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  variant: 'outline' | 'secondary' | 'primary';
  icon: React.ComponentType<React.ComponentProps<typeof Heart>>;
  label: string;
  onClick: () => void;
  className?: string;
}

function ActionButton({
  variant,
  icon: Icon,
  label,
  onClick,
  className,
}: ActionButtonProps): React.JSX.Element {
  const bounce = useBounceOnTap();

  const handlePress = useCallback(() => {
    haptics.trigger('light');
    onClick();
  }, [onClick]);

  return (
    <Button
      variant={
        variant === 'outline' ? 'outline' : variant === 'secondary' ? 'secondary' : 'default'
      }
      size="lg"
      onClick={handlePress}
      className={`flex-1 rounded-full ${className ?? ''}`}
    >
      <AnimatedView style={bounce.animatedStyle} className="flex items-center">
        <Icon size={20} weight={variant === 'primary' ? 'fill' : 'bold'} className="mr-2" />
        {label}
      </AnimatedView>
    </Button>
  );
}
