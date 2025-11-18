import { useState, useEffect } from 'react';
import { MotionView } from '@petspark/motion';
import { MapPin, NavigationArrow, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { Location } from '@/lib/maps/types';

const logger = createLogger('LocationSharing');
import { getCurrentLocation, snapToGrid } from '@/lib/maps/utils';
import MapLibreMap from '@/components/maps/MapLibreMap';
import { openInMaps } from '@/lib/maps/deep-links';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isTruthy } from '@petspark/shared';

interface LocationBubbleProps {
  location: Location;
  label?: string;
  timestamp?: string;
  isOwn?: boolean;
  onTap?: () => void;
  className?: string;
}

export function LocationBubble({
  location,
  label,
  timestamp,
  isOwn = false,
  onTap,
  className,
}: LocationBubbleProps): React.JSX.Element {
  const { t } = useApp();
  const [showFullMap, setShowFullMap] = useState(false);

  const handleTap = (): void => {
    haptics.trigger('light');
    if (isTruthy(onTap)) {
      onTap();
    } else {
      setShowFullMap(true);
    }
  };

  const handleOpenInMaps = (): void => {
    openInMaps(location, label);
  };

  return (
    <>
      <MotionView
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => void handleTap()}
        className={cn(
          'relative rounded-2xl overflow-hidden border cursor-pointer group',
          isOwn ? 'bg-primary/10 border-primary/30' : 'bg-muted border-border',
          className
        )}
      >
        <div className="aspect-video w-full max-w-xs relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <MapPin size={32} className="text-primary" weight="fill" />
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                <MapPin size={14} weight="fill" />
                <span>{label ?? (t.map as { location?: string })?.location ?? 'Location'}</span>
              </div>
              {timestamp && (
                <Badge variant="secondary" className="text-xs opacity-80">
                  {timestamp}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </MotionView>

      <Sheet open={showFullMap} onOpenChange={setShowFullMap}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">
                {(t.map as { location?: string })?.location ?? 'Location'}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFullMap(false)}
                aria-label="Close map"
              >
                <X size={20} />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 relative">
            <MapLibreMap
              center={location}
              zoom={15}
              markers={[
                {
                  id: 'location',
                  location,
                  data: { label },
                },
              ]}
              height="100%"
              clusterMarkers={false}
            />
          </div>

          <div className="p-4 border-t space-y-3">
            <div>
              <p className="text-sm font-semibold mb-1">
                {label ?? (t.map as { location?: string })?.location ?? 'Location'}
              </p>
              <p className="text-xs text-muted-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
            <Button className="w-full" onClick={() => void handleOpenInMaps()}>
              <NavigationArrow size={18} className="mr-2" />
              {t.map?.openInMaps ?? 'Open in Maps'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface LocationPickerProps {
  onSelectLocation: (location: Location) => void;
  onClose: () => void;
  currentLocation?: Location;
}

export function LocationPicker({
  onSelectLocation,
  onClose,
  currentLocation,
}: LocationPickerProps): React.JSX.Element {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [sharingPrecise, setSharingPrecise] = useState(false);

  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        try {
          if (sharingPrecise) {
            setSelectedLocation(location);
          } else {
            const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
            setSelectedLocation(coarse);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('LocationPicker snapToGrid error', err);
          setSelectedLocation(currentLocation ?? { lat: 40.7128, lng: -74.006 });
        }
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('LocationPicker getCurrentLocation error', err);
        // Fallback to current location or default location
        setSelectedLocation(currentLocation ?? { lat: 40.7128, lng: -74.006 });
      });
  }, [sharingPrecise, mapSettings.PRIVACY_GRID_METERS, currentLocation]);

  const handleMapClick = (location: Location): void => {
    haptics.trigger('light');
    if (isTruthy(sharingPrecise)) {
      setSelectedLocation(location);
    } else {
      const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
      setSelectedLocation(coarse);
    }
  };

  const handleShare = (): void => {
    if (!selectedLocation) return;
    haptics.trigger('success');
    onSelectLocation(selectedLocation);
    onClose();
    toast.success(t.map?.locationShared ?? 'Location shared');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t.map?.shareLocation ?? 'Share location'}</p>
        <Badge
          variant={sharingPrecise ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => {
            haptics.trigger('selection');
            setSharingPrecise(!sharingPrecise);
          }}
        >
          {sharingPrecise ? 'Precise' : 'Approximate'}
        </Badge>
      </div>

      {selectedLocation && (
        <div className="relative h-64 rounded-lg overflow-hidden border">
          <MapLibreMap
            center={selectedLocation}
            zoom={sharingPrecise ? 15 : 13}
            onMapClick={handleMapClick}
            height="100%"
            markers={[
              {
                id: 'selected',
                location: selectedLocation,
                data: {},
              },
            ]}
            clusterMarkers={false}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => void onClose()}>
          {t.common.cancel ?? 'Cancel'}
        </Button>
        <Button className="flex-1" onClick={() => void handleShare()} disabled={!selectedLocation}>
          <MapPin size={18} className="mr-2" />
          {t.map?.shareLocation ?? 'Share'}
        </Button>
      </div>
    </div>
  );
}
