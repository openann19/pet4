/**
 * Playdate Map
 *
 * Map view showing nearby playdates
 */

'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { Playdate } from '@petspark/core';

export interface PlaydateMapProps {
  playdates: Playdate[];
  currentLocation?: { latitude: number; longitude: number };
  onPlaydateClick?: (playdate: Playdate) => void;
  className?: string;
}

export function PlaydateMap({
  playdates,
  currentLocation,
  onPlaydateClick,
  className,
}: PlaydateMapProps): React.JSX.Element {
  const bounds = useMemo(() => {
    if (playdates.length === 0 && !currentLocation) {
      return null;
    }

    const locations = [
      ...(currentLocation ? [currentLocation] : []),
      ...playdates.map((p) => ({ latitude: p.location.latitude, longitude: p.location.longitude })),
    ];

    const latitudes = locations.map((l) => l.latitude);
    const longitudes = locations.map((l) => l.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const padding = 0.01;
    return {
      minLat: minLat - padding,
      maxLat: maxLat + padding,
      minLng: minLng - padding,
      maxLng: maxLng + padding,
    };
  }, [playdates, currentLocation]);

  const mapUrl = bounds
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}&layer=mapnik`
    : null;

  return (
    <PremiumCard variant="glass" className={cn('p-4 space-y-4', className)}>
      <div>
        <h3 className={cn(getTypographyClasses('h3'), 'mb-2')}>Nearby Playdates</h3>
        <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
          {playdates.length} playdate{playdates.length !== 1 ? 's' : ''} nearby
        </p>
      </div>

      {mapUrl ? (
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
          <iframe
            src={mapUrl}
            className="w-full h-full"
            title="Playdates map"
            style={{ border: 0 }}
          />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-lg border border-border flex items-center justify-center bg-muted">
          <div className="text-center space-y-2">
            <MapPin className="size-8 mx-auto text-muted-foreground" />
            <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
              No playdates to display
            </p>
          </div>
        </div>
      )}

      {playdates.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {playdates.map((playdate) => (
            <button
              key={playdate.id}
              type="button"
              onClick={() => onPlaydateClick?.(playdate)}
              className={cn(
                'w-full text-left p-3 rounded-lg',
                'border border-border bg-card',
                'hover:bg-muted transition-colors',
                'flex items-center gap-3'
              )}
            >
              <MapPin className="size-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn(getTypographyClasses('body'), 'font-medium truncate')}>
                  {playdate.title}
                </p>
                <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground')}>
                  {playdate.location.address ?? `${playdate.location.latitude.toFixed(4)}, ${playdate.location.longitude.toFixed(4)}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </PremiumCard>
  );
}

