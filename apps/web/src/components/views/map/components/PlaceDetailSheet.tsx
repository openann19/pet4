import { X, Heart, NavigationArrow } from '@phosphor-icons/react';
import { Presence, MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { formatDistance } from '@/lib/maps/utils';
import { haptics } from '@/lib/haptics';
import type { Place, MapMarker } from '@/lib/maps/types';

export interface PlaceDetailSheetProps {
  isVisible: boolean;
  marker: MapMarker | null;
  savedPlaces: string[];
  onClose: () => void;
  onSavePlace: (placeId: string) => void;
}

export function PlaceDetailSheet({
  isVisible,
  marker,
  savedPlaces,
  onClose,
  onSavePlace,
}: PlaceDetailSheetProps): React.JSX.Element {
  const { t } = useApp();
  const { PLACE_CATEGORIES } = useMapConfig();

  if (marker?.type !== 'place') {
    return <></>;
  }

  const place = marker.data as Place;
  const category = PLACE_CATEGORIES.find((c) => c.id === place.category);
  const isSaved = savedPlaces.includes(place.id);

  return (
    <Presence>
      {isVisible && (
        <MotionView
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 max-h-[60%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ backgroundColor: `${category?.color}20` }}
                >
                  {category?.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">{place.address}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close place details"
              >
                <X size={20} />
              </Button>
            </div>

            {place.description && <p className="text-foreground/80">{place.description}</p>}

            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">📏 {formatDistance(place.distance ?? 0)}</Badge>
              <Badge variant="secondary">
                ⭐ {place.rating.toFixed(1)} ({place.reviewCount})
              </Badge>
              {place.verified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Verified
                </Badge>
              )}
              {place.isOpen && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  🕐 Open Now
                </Badge>
              )}
            </div>

            {place.amenities.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Amenities</p>
                <div className="flex gap-2 flex-wrap">
                  {place.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  haptics.trigger('medium');
                  onSavePlace(place.id);
                }}
                variant={isSaved ? 'secondary' : 'outline'}
              >
                <Heart size={18} weight={isSaved ? 'fill' : 'regular'} className="mr-2" />
                {isSaved ? t.map?.saved ?? 'Saved' : t.map?.save ?? 'Save'}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  haptics.trigger('medium');
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}`;
                  window.open(url, '_blank');
                }}
              >
                <NavigationArrow size={18} className="mr-2" />
                {t.map?.navigate ?? 'Navigate'}
              </Button>
            </div>
          </div>
        </MotionView>
      )}
    </Presence>
  );
}

