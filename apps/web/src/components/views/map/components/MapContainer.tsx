import { useRef } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { MapMarkers } from './MapMarkers';
import type { Place, Location } from '@/lib/maps/types';

export interface MapContainerProps {
  displayLocation: Location | null;
  preciseSharingEnabled: boolean;
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

export function MapContainer({
  displayLocation,
  preciseSharingEnabled,
  places,
  onPlaceClick,
}: MapContainerProps): React.JSX.Element {
  const { t } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground/70">
              {t.map?.interactiveMap ?? 'Interactive Map'}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {t.map?.mapDescription ??
                'Discover pet-friendly places, plan playdates, and find matches near you with our privacy-first location features.'}
            </p>
            {displayLocation && (
              <Badge variant="secondary" className="mt-2">
                {preciseSharingEnabled ? '📍 Precise' : '📌 Approximate'} •{' '}
                {displayLocation.lat.toFixed(4)}, {displayLocation.lng.toFixed(4)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {displayLocation && <MapMarkers places={places} onPlaceClick={onPlaceClick} />}
    </div>
  );
}

