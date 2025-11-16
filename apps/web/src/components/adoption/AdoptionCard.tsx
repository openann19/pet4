'use client';

import { MotionView } from "@petspark/motion";
import { memo, useCallback } from 'react';
import { Heart, MapPin, CheckCircle, PawPrint } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdoptionProfile, AdoptionStatus } from '@/lib/adoption-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';

interface AdoptionCardProps {
  profile: AdoptionProfile;
  onSelect: (profile: AdoptionProfile) => void;
  onFavorite?: (profileId: string) => void;
  isFavorited?: boolean;
}

const STATUS_COLORS: Record<AdoptionStatus, string> = {
  available: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  adopted: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  'on-hold': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
} as const;

function AdoptionCardComponent({ profile, onSelect, onFavorite, isFavorited }: AdoptionCardProps) {
  const { t } = useApp();

  const cardAnimation = useHoverLift({
    translateY: -4,
    stiffness: 400,
    damping: 25,
  });

  const favoriteButtonAnimation = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
    onPress: () => {
      haptics.trigger('light');
      onFavorite?.(profile._id);
    },
  });

  const handleSelect = useCallback(() => {
    haptics.trigger('selection');
    onSelect(profile);
  }, [onSelect, profile]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      favoriteButtonAnimation.handlePress();
    },
    [favoriteButtonAnimation]
  );

  const handleFavoriteKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        favoriteButtonAnimation.handlePress();
      }
    },
    [favoriteButtonAnimation]
  );

  const handleViewDetailsClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      haptics.trigger('success');
      onSelect(profile);
    },
    [onSelect, profile]
  );

  const statusColor = STATUS_COLORS[profile.status];
  const statusLabel =
    profile.status === 'available'
      ? t.adoption?.available ?? 'Available'
      : profile.status === 'pending'
        ? t.adoption?.pending ?? 'Pending'
        : profile.status === 'adopted'
          ? t.adoption?.adopted ?? 'Adopted'
          : t.adoption?.onHold ?? 'On Hold';

  const ageLabel =
    profile.age === 1
      ? t.common?.year_singular ?? 'year'
      : t.common?.years ?? 'years';

  return (
    <MotionView
      style={cardAnimation.animatedStyle}
      onMouseEnter={cardAnimation.handleEnter}
      onMouseLeave={cardAnimation.handleLeave}
    >
      <Card className="overflow-hidden cursor-pointer group border-border/50 shadow-lg hover:shadow-xl transition-shadow">
        <div
          className="relative h-64 overflow-hidden bg-muted"
          onClick={handleSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect();
            }
          }}
          aria-label={`View details for ${profile.petName}`}
        >
          <img
            src={profile.petPhoto}
            alt={profile.petName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <Badge className={`${statusColor} border backdrop-blur-sm`}>
              {statusLabel}
            </Badge>
            {onFavorite && (
              <MotionView
                style={favoriteButtonAnimation.animatedStyle}
                onMouseEnter={favoriteButtonAnimation.handleMouseEnter}
                onMouseLeave={favoriteButtonAnimation.handleMouseLeave}
                onClick={handleFavoriteClick}
                className="w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={handleFavoriteKeyDown}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={20}
                  weight={isFavorited ? 'fill' : 'regular'}
                  className={isFavorited ? 'text-destructive' : 'text-foreground'}
                />
              </MotionView>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-white drop-shadow-lg mb-1">
              {profile.petName}
            </h3>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin size={14} weight="fill" />
              <span className="drop-shadow">{profile.location}</span>
            </div>
          </div>
        </div>

        <div
          className="p-4 space-y-3"
          onClick={handleSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect();
            }
          }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.breed}</span>
            <span>•</span>
            <span>
              {profile.age} {ageLabel}
            </span>
            <span>•</span>
            <span className="capitalize">{profile.gender}</span>
          </div>

          <p className="text-sm text-foreground line-clamp-2">
            {profile.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {profile.vaccinated && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle size={12} weight="fill" />
                {t.adoption?.vaccinated ?? 'Vaccinated'}
              </Badge>
            )}
            {profile.spayedNeutered && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckCircle size={12} weight="fill" />
                {t.adoption?.spayedNeutered ?? 'Spayed/Neutered'}
              </Badge>
            )}
            {profile.goodWithKids && (
              <Badge variant="secondary" className="text-xs">
                {t.adoption?.goodWithKids ?? 'Good with kids'}
              </Badge>
            )}
            {profile.goodWithPets && (
              <Badge variant="secondary" className="text-xs">
                {t.adoption?.goodWithPets ?? 'Good with pets'}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-sm">
              <span className="text-muted-foreground">
                {t.adoption?.adoptionFee ?? 'Adoption Fee'}:
              </span>
              <span className="font-bold text-foreground ml-1">
                ${profile.adoptionFee}
              </span>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleViewDetailsClick}
              type="button"
            >
              <PawPrint size={16} weight="fill" />
              {t.adoption?.viewDetails ?? 'View Details'}
            </Button>
          </div>
        </div>
      </Card>
    </MotionView>
  );
}

// Memoize AdoptionCard to prevent unnecessary re-renders
export const AdoptionCard = memo(AdoptionCardComponent, (prev, next) => {
  return (
    prev.profile._id === next.profile._id &&
    prev.profile.status === next.profile.status &&
    prev.profile.petPhoto === next.profile.petPhoto &&
    prev.profile.petName === next.profile.petName &&
    prev.profile.location === next.profile.location &&
    prev.profile.description === next.profile.description &&
    prev.profile.adoptionFee === next.profile.adoptionFee &&
    prev.isFavorited === next.isFavorited &&
    prev.onSelect === next.onSelect &&
    prev.onFavorite === next.onFavorite
  );
});
