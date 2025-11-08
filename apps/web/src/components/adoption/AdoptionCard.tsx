'use client';

import { Heart, MapPin, CheckCircle, PawPrint } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdoptionProfile } from '@/lib/adoption-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { useCallback } from 'react';

interface AdoptionCardProps {
  profile: AdoptionProfile;
  onSelect: (profile: AdoptionProfile) => void;
  onFavorite?: (profileId: string) => void;
  isFavorited?: boolean;
}

export function AdoptionCard({ profile, onSelect, onFavorite, isFavorited }: AdoptionCardProps) {
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

  const statusColors = {
    available: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    adopted: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    'on-hold': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };

  const statusLabels = {
    available: t.adoption?.available ?? 'Available',
    pending: t.adoption?.pending ?? 'Pending',
    adopted: t.adoption?.adopted ?? 'Adopted',
    'on-hold': t.adoption?.onHold ?? 'On Hold',
  };

  return (
    <AnimatedView
      style={cardAnimation.animatedStyle}
      onMouseEnter={cardAnimation.handleEnter}
      onMouseLeave={cardAnimation.handleLeave}
    >
      <Card className="overflow-hidden cursor-pointer group border-border/50 shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative h-64 overflow-hidden bg-muted" onClick={handleSelect}>
          <img
            src={profile.petPhoto}
            alt={profile.petName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <Badge className={`${statusColors[profile.status]} border backdrop-blur-sm`}>
              {statusLabels[profile.status]}
            </Badge>
            {onFavorite && (
              <AnimatedView
                style={favoriteButtonAnimation.animatedStyle}
                onMouseEnter={favoriteButtonAnimation.handleMouseEnter}
                onMouseLeave={favoriteButtonAnimation.handleMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  favoriteButtonAnimation.handlePress();
                }}
                className="w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer"
              >
                <Heart
                  size={20}
                  weight={isFavorited ? 'fill' : 'regular'}
                  className={isFavorited ? 'text-destructive' : 'text-foreground'}
                />
              </AnimatedView>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-white drop-shadow-lg mb-1">{profile.petName}</h3>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin size={14} weight="fill" />
              <span className="drop-shadow">{profile.location}</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3" onClick={handleSelect}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.breed}</span>
            <span>•</span>
            <span>
              {profile.age}{' '}
              {profile.age === 1
                ? (t.common?.year_singular ?? 'year')
                : (t.common?.years ?? 'years')}
            </span>
            <span>•</span>
            <span className="capitalize">{profile.gender}</span>
          </div>

          <p className="text-sm text-foreground line-clamp-2">{profile.description}</p>

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
              <span className="font-bold text-foreground ml-1">${profile.adoptionFee}</span>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                haptics.trigger('success');
                onSelect(profile);
              }}
            >
              <PawPrint size={16} weight="fill" />
              {t.adoption?.viewDetails ?? 'View Details'}
            </Button>
          </div>
        </div>
      </Card>
    </AnimatedView>
  );
}
