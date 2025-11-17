/**
 * Location Picker
 *
 * Map-based location picker with search
 */

'use client';

import { useState, useCallback } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { PlaydateLocation } from '@petspark/core';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LocationPicker');

export interface LocationPickerProps {
  onLocationSelect: (location: PlaydateLocation) => void;
  selectedLocation?: PlaydateLocation | null;
  className?: string;
}

export function LocationPicker({
  onLocationSelect,
  selectedLocation,
  className,
}: LocationPickerProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<PlaydateLocation | null>(
    selectedLocation ?? null
  );

  const handleGetCurrentLocation = useCallback(() => {
    setIsSearching(true);
    if (!navigator.geolocation) {
      logger.error('Geolocation not supported');
      setIsSearching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: PlaydateLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        onLocationSelect(location);
        setIsSearching(false);
      },
      (error) => {
        logger.error('Failed to get location', error);
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onLocationSelect]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // In a real implementation, this would call a geocoding API
      // For now, we'll use a mock response
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = (await response.json()) as {
          latitude: number;
          longitude: number;
          address: string;
        };
        const location: PlaydateLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
        };
        setCurrentLocation(location);
        onLocationSelect(location);
      }
    } catch (error) {
      logger.error('Location search failed', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onLocationSelect]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void handleSearch();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          size="icon"
        >
          <Search className="size-4" />
        </Button>
        <Button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isSearching}
          size="icon"
          variant="outline"
        >
          <MapPin className="size-4" />
        </Button>
      </div>

      {currentLocation && (
        <PremiumCard variant="glass" className="p-3">
          <div className="flex items-start gap-3">
            <MapPin className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {currentLocation.address && (
                <p className={cn(getTypographyClasses('body'), 'font-medium')}>
                  {currentLocation.address}
                </p>
              )}
              <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground')}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </PremiumCard>
      )}

      {currentLocation && (
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.longitude - 0.01},${currentLocation.latitude - 0.01},${currentLocation.longitude + 0.01},${currentLocation.latitude + 0.01}&layer=mapnik&marker=${currentLocation.latitude},${currentLocation.longitude}`}
            className="w-full h-full"
            title="Location map"
            style={{ border: 0 }}
          />
        </div>
      )}
    </div>
  );
}

