import { X, Heart } from '@phosphor-icons/react';
import { Presence, MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { formatDistance } from '@/lib/maps/utils';
import { haptics } from '@/lib/haptics';
import type { Place, MapMarker } from '@/lib/maps/types';

export interface PlacesListSidebarProps {
  isVisible: boolean;
  places: Place[];
  savedPlaces: string[];
  onClose: () => void;
  onPlaceClick: (place: Place) => void;
  onSavePlace: (placeId: string) => void;
}

export function PlacesListSidebar({
  isVisible,
  places,
  savedPlaces,
  onClose,
  onPlaceClick,
  onSavePlace,
}: PlacesListSidebarProps): React.JSX.Element {
  const { t } = useApp();
  const { PLACE_CATEGORIES } = useMapConfig();

  return (
    <Presence>
      {isVisible && (
        <MotionView
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl overflow-y-auto"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {t.map?.nearbyPlaces ?? 'Nearby Places'} ({places.length})
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close places list"
              >
                <X size={20} />
              </Button>
            </div>

            {places.map((place) => {
              const category = PLACE_CATEGORIES.find((c) => c.id === place.category);
              const isSaved = savedPlaces.includes(place.id);

              return (
                <Card
                  key={place.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    haptics.trigger('light');
                    onPlaceClick(place);
                  }}
                >
                  <div className="flex gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${category?.color}20` }}
                    >
                      {category?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{place.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSavePlace(place.id);
                          }}
                          aria-label={isSaved ? 'Remove from saved places' : 'Save place'}
                        >
                          <Heart
                            size={16}
                            weight={isSaved ? 'fill' : 'regular'}
                            className={isSaved ? 'text-red-500' : ''}
                          />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {place.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatDistance(place.distance ?? 0)}
                        </Badge>
                        {place.verified && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ⭐ {place.rating.toFixed(1)} ({place.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </MotionView>
      )}
    </Presence>
  );
}

