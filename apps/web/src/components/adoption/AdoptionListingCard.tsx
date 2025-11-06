import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Check, CurrencyDollar, PawPrint } from '@phosphor-icons/react'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'
import { motion } from '@petspark/motion'
import { useApp } from '@/contexts/AppContext'
import { haptics } from '@/lib/haptics'

interface AdoptionListingCardProps {
  listing: AdoptionListing
  onSelect: (listing: AdoptionListing) => void
  onFavorite?: (listingId: string) => void
  isFavorited?: boolean
}

function AdoptionListingCardComponent({ listing, onSelect, onFavorite, isFavorited }: AdoptionListingCardProps) {
  const { t } = useApp()
  const { petName, petBreed, petAge, petGender, petSize, petPhotos, location, fee, vaccinated, spayedNeutered, status } = listing

  const formatFee = () => {
    if (!fee || fee.amount === 0) return 'Free'
    return `${fee.currency} ${fee.amount.toLocaleString()}`
  }

  return (
    <MotionView
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 border-border/50">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted" onClick={() => {
          haptics.trigger('selection')
          onSelect(listing)
        }}>
          <img
            src={petPhotos[0] || '/placeholder-pet.jpg'}
            alt={petName}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          
          {/* Status Badge */}
          {status === 'pending_review' && (
            <Badge className="absolute top-3 right-3 bg-yellow-500/90 text-white backdrop-blur-sm">
              {t.adoption?.pendingReview || 'Pending Review'}
            </Badge>
          )}

          {/* Favorite Button */}
          {onFavorite && (
            <MotionView as="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                haptics.trigger('light')
                onFavorite(listing.id)
              }}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <Heart
                size={20}
                weight={isFavorited ? 'fill' : 'regular'}
                className={isFavorited ? 'text-destructive' : 'text-foreground'}
              />
            </MotionView>
          )}

          {/* Fee Badge */}
          {fee && fee.amount > 0 && (
            <Badge className="absolute bottom-3 left-3 bg-primary/90 text-white backdrop-blur-sm">
              <CurrencyDollar size={16} weight="bold" />
              {formatFee()}
            </Badge>
          )}
          {(!fee || fee.amount === 0) && (
            <Badge className="absolute bottom-3 left-3 bg-green-500/90 text-white backdrop-blur-sm">
              {t.adoption?.noFee || 'Free'}
            </Badge>
          )}
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Pet Name and Age */}
          <div className="flex items-start justify-between">
            <div onClick={() => {
              haptics.trigger('selection')
              onSelect(listing)
            }} className="cursor-pointer flex-1">
              <h3 className="text-xl font-bold leading-tight">{petName}</h3>
              <p className="text-sm text-muted-foreground">
                {petBreed} • {petAge} {petAge === 1 ? t.common?.year_singular || 'year' : t.common?.years || 'years'}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} weight="fill" />
            <span>{location.city}, {location.country}</span>
          </div>

          {/* Health Badges */}
          <div className="flex flex-wrap gap-2">
            {vaccinated && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Check size={14} weight="bold" />
                Vaccinated
              </Badge>
            )}
            {spayedNeutered && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Check size={14} weight="bold" />
                Spayed/Neutered
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {petGender === 'male' ? 'Male' : 'Female'}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {petSize}
            </Badge>
          </div>

          {/* Temperament Traits - Show first 2 */}
          {listing.temperament && listing.temperament.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.temperament.slice(0, 2).map((trait) => (
                <Badge key={trait} variant="outline" className="text-xs">
                  {trait}
                </Badge>
              ))}
              {listing.temperament.length > 2 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{listing.temperament.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Description Preview */}
          {listing.petDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.petDescription}
            </p>
          )}

          {/* View Details Button */}
          <Button
            size="sm"
            className="w-full gap-1.5 mt-2"
            onClick={(e) => {
              e.stopPropagation()
              haptics.trigger('success')
              onSelect(listing)
            }}
          >
            <PawPrint size={16} weight="fill" />
            {t.adoption?.viewDetails || 'View Details'}
          </Button>
        </CardContent>
      </Card>
    </MotionView>
  )
}

// Memoize AdoptionListingCard to prevent unnecessary re-renders
export const AdoptionListingCard = memo(AdoptionListingCardComponent, (prev, next) => {
  return (
    prev.listing.id === next.listing.id &&
    prev.listing.status === next.listing.status &&
    prev.isFavorited === next.isFavorited
  )
})
