import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Check, CurrencyDollar, PawPrint } from '@phosphor-icons/react';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';

interface AdoptionListingCardProps {
  listing: AdoptionListing;
  onSelect: (listing: AdoptionListing) => void;
  onFavorite?: (listingId: string) => void;
  isFavorited?: boolean;
}

function AdoptionListingCardComponent({
  listing,
  onSelect,
  onFavorite,
  isFavorited,
}: AdoptionListingCardProps): JSX.Element {
  const { t } = useApp();
  const {
    petName,
    petBreed,
    petAge,
    petGender,
    petSize,
    petPhotos,
    location,
    fee,
    vaccinated,
    spayedNeutered,
    status,
  } = listing;

  const formatFee = (): string => {
    if (!fee || fee.amount === 0) return 'Free';
    return `${fee.currency} ${fee.amount.toLocaleString()}`;
  };

  return (
    <MotionView
      whileHover={{ y: -12, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group"
    >
      <Card className="overflow-hidden rounded-2xl border-border/40 bg-background/90 backdrop-blur-xl shadow-xl group-hover:shadow-2xl group-hover:border-primary/30 transition-all duration-500">                                                                            
        <div
          className="relative aspect-4/3 overflow-hidden bg-muted cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"                                                                               
          onClick={() => {
            haptics.trigger('selection');
            onSelect(listing);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              haptics.trigger('selection');
              onSelect(listing);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${petName}`}
        >
          <img
            src={petPhotos[0] ?? '/placeholder-pet.jpg'}
            alt={petName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"                                                      
            loading="lazy"
          />

          {/* Premium overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />                                                         

          {/* Status Badge - Premium Style */}
          {status === 'pending_review' && (
            <Badge className={cn(
              'absolute bg-yellow-500/95 text-white backdrop-blur-md border-0 shadow-xl rounded-xl font-medium',
              getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
            )} style={{ top: '1rem', right: '1rem' }}>
              {t.adoption?.pendingReview ?? 'Pending Review'}
            </Badge>
          )}

          {/* Favorite Button - Premium Style */}
          {onFavorite && (
            <MotionView
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute top-4 left-4"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.trigger('light');
                  onFavorite(listing.id);
                }}
                className="w-11 h-11 rounded-full bg-white/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"                                                                   
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  size={22}
                  weight={isFavorited ? 'fill' : 'regular'}
                  className={isFavorited ? 'text-destructive' : 'text-foreground transition-colors duration-200'}                                                                              
                />
              </button>
            </MotionView>
          )}

          {/* Fee Badge - Premium Style */}
          <div className="absolute" style={{ bottom: '1rem', left: '1rem' }}>
            {fee && fee.amount > 0 ? (
              <Badge className={cn(
                'bg-primary/95 text-white backdrop-blur-md border-0 shadow-xl rounded-xl font-semibold',
                getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'md', paddingY: 'sm' })
              )}>
                <CurrencyDollar size={18} weight="bold" aria-hidden="true" />
                {formatFee()}
              </Badge>
            ) : (
              <Badge className={cn(
                'bg-green-500/95 text-white backdrop-blur-md border-0 shadow-xl rounded-xl font-semibold',
                getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
              )}>
                {t.adoption?.noFee ?? 'Free'}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className={cn(
          getSpacingClassesFromConfig({ padding: 'xl', spaceY: 'lg' })
        )}>
          {/* Pet Name and Age - Premium Typography */}
          <header
            onClick={() => {
              haptics.trigger('selection');
              onSelect(listing);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                haptics.trigger('selection');
                onSelect(listing);
              }
            }}
            role="button"
            tabIndex={0}
            className={cn(
              'cursor-pointer group/name focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded',
              getSpacingClassesFromConfig({ spaceY: 'sm' })
            )}
            aria-label={`View details for ${petName}`}
          >
            <h3 className={cn(
              getTypographyClasses('h3'),
              'group-hover/name:text-primary transition-colors duration-200'
            )}>{petName}</h3>
            <p className={cn(
              getTypographyClasses('body'),
              'text-muted-foreground',
              getSpacingClassesFromConfig({ marginY: 'sm' })
            )}>
              {petBreed} • {petAge}{' '}
              {petAge === 1 ? t.common?.year_singular || 'year' : t.common?.years || 'years'}
            </p>
          </header>

          {/* Location - Premium Style */}
          <div className={cn(
            'flex items-center text-muted-foreground',
            getSpacingClassesFromConfig({ gap: 'md' })
          )}>
            <MapPin size={18} weight="fill" className="text-primary/70 shrink-0" aria-hidden="true" />
            <span className={getTypographyClasses('body')}>
              {location.city}, {location.country}
            </span>
          </div>

          {/* Health & Info Badges - Premium Style */}
          <div className={cn(
            'flex flex-wrap',
            getSpacingClassesFromConfig({ gap: 'md' })
          )} role="list" aria-label="Pet information badges">
            {vaccinated && (
              <Badge variant="secondary" className={cn(
                getTypographyClasses('caption'),
                'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/15 transition-colors rounded-lg',
                getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'md', paddingY: 'sm' })
              )} role="listitem">
                <Check size={14} weight="bold" aria-hidden="true" />
                Vaccinated
              </Badge>
            )}
            {spayedNeutered && (
              <Badge variant="secondary" className={cn(
                getTypographyClasses('caption'),
                'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15 transition-colors rounded-lg',
                getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'md', paddingY: 'sm' })
              )} role="listitem">
                <Check size={14} weight="bold" aria-hidden="true" />
                Fixed
              </Badge>
            )}
            <Badge variant="outline" className={cn(
              getTypographyClasses('caption'),
              'rounded-lg border-border/60 hover:border-primary/30 transition-colors',
              getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
            )} role="listitem">
              {petGender === 'male' ? 'Male' : 'Female'}
            </Badge>
            <Badge variant="outline" className={cn(
              getTypographyClasses('caption'),
              'capitalize rounded-lg border-border/60 hover:border-primary/30 transition-colors',
              getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
            )} role="listitem">
              {petSize}
            </Badge>
          </div>

          {/* Temperament Traits - Premium Style */}
          {listing.temperament && listing.temperament.length > 0 && (
            <div className={cn(
              'flex flex-wrap',
              getSpacingClassesFromConfig({ gap: 'sm' })
            )} role="list" aria-label="Temperament traits">
              {listing.temperament.slice(0, 2).map((trait) => (
                <Badge key={trait} variant="outline" className={cn(
                  getTypographyClasses('caption'),
                  'bg-muted/40 border-border/40 hover:border-primary/30 transition-colors rounded-lg',
                  getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
                )} role="listitem">
                  {trait}
                </Badge>
              ))}
              {listing.temperament.length > 2 && (
                <Badge variant="outline" className={cn(
                  getTypographyClasses('caption'),
                  'text-muted-foreground rounded-lg border-border/40',
                  getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' })
                )} role="listitem">
                  +{listing.temperament.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Description Preview - Premium Typography */}
          {listing.petDescription && (
            <p className={`${getTypographyClasses('body')} text-muted-foreground line-clamp-2 leading-relaxed`}>                                                             
              {listing.petDescription}
            </p>
          )}

          {/* View Details Button - Premium Style */}
          <Button
            size="lg"
            className={cn(
              'w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl font-medium',
              getSpacingClassesFromConfig({ gap: 'md', marginY: 'sm' })
            )}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              haptics.trigger('success');
              onSelect(listing);
            }}
            aria-label={`View details for ${petName}`}
          >
            <PawPrint size={18} weight="fill" aria-hidden="true" />
            {t.adoption?.viewDetails || 'View Details'}
          </Button>
        </CardContent>
      </Card>
    </MotionView>
  );
}

// Memoize AdoptionListingCard to prevent unnecessary re-renders
export const AdoptionListingCard = memo(AdoptionListingCardComponent, (prev, next) => {
  return (
    prev.listing.id === next.listing.id &&
    prev.listing.status === next.listing.status &&
    prev.isFavorited === next.isFavorited
  );
});
