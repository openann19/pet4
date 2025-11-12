import { useRef } from 'react';
import { useMapLibreMap, type MapMarker } from '@/lib/maps/useMapLibreMap';
import type { Location } from '@/lib/maps/types';
import { useApp } from '@/contexts/AppContext';
import { isTruthy, isDefined } from '@petspark/shared';

interface MapLibreMapProps {
  center: Location;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (location: Location) => void;
  className?: string;
  height?: string;
  clusterMarkers?: boolean;
}

export default function MapLibreMap({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapClick,
  className = '',
  height = '100%',
  clusterMarkers = true,
}: MapLibreMapProps): React.JSX.Element {
  const { t } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { isLoading, error } = useMapLibreMap({
    container: mapContainerRef.current,
    center,
    zoom,
    markers,
    ...(onMarkerClick ? { onMarkerClick } : {}),
    ...(onMapClick ? { onMapClick } : {}),
    clusterMarkers,
  });

  if (isTruthy(error)) {
    return (
      <div className={`flex items-center justify-center ${String(className ?? '')}`} style={{ height }}>
        <div className="text-center space-y-2 p-4">
          <p className="text-destructive font-semibold">
            {t.map?.errorLoadingMap || 'Error loading map'}
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${String(className ?? '')}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{t.map?.loading || 'Loading map...'}</p>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: '100%', minHeight: '400px' }}
      />
    </div>
  );
}
