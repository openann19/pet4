import { MotionView } from '@petspark/motion';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { haptics } from '@/lib/haptics';
import type { Place, _MapMarker } from '@/lib/maps/types';

export interface MapMarkersProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

export function MapMarkers({ places, onPlaceClick }: MapMarkersProps): React.JSX.Element {
  const { PLACE_CATEGORIES } = useMapConfig();

  return (
    <>
      {places.slice(0, 15).map((place, idx) => {
        const category = PLACE_CATEGORIES.find((c) => c.id === place.category);
        return (
          <MotionView
            key={place.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="absolute"
            style={{
              left: `${20 + (idx % 5) * 16}%`,
              top: `${20 + Math.floor(idx / 5) * 25}%`,
            }}
          >
            <button
              onClick={() => {
                haptics.trigger('light');
                onPlaceClick(place);
              }}
              className="relative group cursor-pointer transform transition-transform hover:scale-110 active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl backdrop-blur-sm border-2 border-white"
                style={{ backgroundColor: category?.color ?? 'hsl(var(--primary))' }}
              >
                {category?.icon ?? '📍'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </button>
          </MotionView>
        );
      })}
    </>
  );
}

