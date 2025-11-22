/**
 * Location Share Button
 *
 * Button for sharing location with map preview
 */

'use client';

import { useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LocationShareButton');

export interface LocationShareButtonProps {
  onLocationShare: (location: { latitude: number; longitude: number; address?: string }) => void;
  className?: string;
}

export function LocationShareButton({
  onLocationShare,
  className,
}: LocationShareButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setIsLoading(false);
      },
      (err) => {
        logger.error('Failed to get location', err);
        setError('Failed to get your location. Please check your permissions.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleShare = useCallback(() => {
    if (location) {
      onLocationShare({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setIsOpen(false);
      setLocation(null);
    }
  }, [location, onLocationShare]);

  const mapUrl = location
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.coords.longitude - 0.01},${location.coords.latitude - 0.01},${location.coords.longitude + 0.01},${location.coords.latitude + 0.01}&layer=mapnik&marker=${location.coords.latitude},${location.coords.longitude}`
    : null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        className={cn('w-10 h-10 p-0 rounded-full', className)}
        variant="ghost"
        onClick={() => setIsOpen(true)}
        aria-label="Share location"
      >
        <MapPin className="size-5" aria-hidden="true" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={getTypographyClasses('h3')}>Share Location</DialogTitle>
          </DialogHeader>

          <PremiumCard variant="glass" className="p-4 space-y-4">
            {!location && (
              <div className="space-y-4">
                <p className={getTypographyClasses('bodyMuted')}>
                  Get your current location to share with others.
                </p>
                <Button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Getting location...' : 'Get My Location'}
                </Button>
                {error && (
                  <p className={cn(getTypographyClasses('caption'), 'text-destructive')}>
                    {error}
                  </p>
                )}
              </div>
            )}

            {location && (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
                  {mapUrl && (
                    <iframe
                      src={mapUrl}
                      className="w-full h-full"
                      title="Location map"
                      style={{ border: 0 }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <p className={cn(getTypographyClasses('body'), 'font-medium')}>
                    Coordinates
                  </p>
                  <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
                    {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLocation(null);
                      setError(null);
                    }}
                    className="flex-1"
                  >
                    Change
                  </Button>
                  <Button type="button" onClick={handleShare} className="flex-1">
                    Share Location
                  </Button>
                </div>
              </div>
            )}
          </PremiumCard>
        </DialogContent>
      </Dialog>
    </>
  );
}

