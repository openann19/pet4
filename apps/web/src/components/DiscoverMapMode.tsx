import { MotionView } from "@petspark/motion";
import { useState, useEffect, useMemo } from 'react';
import { useAnimatePresence } from '@/effects/reanimated';
import { MapPin, X, Heart, Info } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type { Pet } from '@/lib/types';
import { calculateDistance, snapToGrid, getCurrentLocation } from '@/lib/maps/utils';

const logger = createLogger('DiscoverMapMode');
import type { Location } from '@/lib/maps/types';
import PetDetailDialog from '@/components/PetDetailDialog';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { calculateCompatibility } from '@/lib/matching';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import MapLibreMap from '@/components/maps/MapLibreMap';
import type { MapMarker } from '@/lib/maps/useMapLibreMap';

interface DiscoverMapModeProps {
  pets: Pet[];
  userPet: Pet | undefined;
  onSwipe: (pet: Pet, action: 'like' | 'pass') => void;
}

export default function DiscoverMapMode({ pets, userPet, onSwipe }: DiscoverMapModeProps) {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();

  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const selectedPetPresence = useAnimatePresence({
    isVisible: !!selectedPet,
    enterTransition: 'slideUp',
    exitTransition: 'slideDown',
  });

  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        try {
          if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
            const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
            setUserLocation(coarse);
          } else {
            logger.warn('DiscoverMapMode invalid location format', { location });
            setUserLocation({ lat: 40.7128, lng: -74.006 });
          }
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('DiscoverMapMode snapToGrid _error', err);
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('DiscoverMapMode getCurrentLocation error', err);
        // Fallback to default location (New York)
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      });
  }, [mapSettings.PRIVACY_GRID_METERS]);

  const petsWithLocations = useMemo(() => {
    if (
      !userLocation ||
      typeof userLocation.lat !== 'number' ||
      typeof userLocation.lng !== 'number'
    ) {
      return [];
    }

    if (!Array.isArray(pets)) {
      logger.warn('DiscoverMapMode pets is not an array', { pets });
      return [];
    }

    return pets
      .filter((pet) => pet != null)
      .map((pet) => {
        try {
          const petLoc = {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
          };

          const distance = calculateDistance(userLocation, petLoc);

          return {
            ...pet,
            locationData: petLoc,
            distance,
          };
        } catch (_error) {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('DiscoverMapMode calculateDistance _error', err, { petId: pet?.id });
          return null;
        }
      })
      .filter((pet): pet is NonNullable<typeof pet> => pet != null)
      .sort((a, b) => a.distance - b.distance);
  }, [pets, userLocation]);

  const mapMarkers = useMemo((): MapMarker[] => {
    return petsWithLocations.map((pet) => ({
      id: pet.id,
      location: pet.locationData,
      data: pet,
      icon: pet.photos?.[0] ?? '/placeholder-pet.png',
      color: 'hsl(var(--primary))',
    }));
  }, [petsWithLocations]);

  const mapCenter = useMemo((): Location => {
    if (!userLocation) return { lat: 40.7128, lng: -74.006 };
    return userLocation;
  }, [userLocation]);

  const handleMarkerClick = (marker: MapMarker) => {
    try {
      if (!marker?.data) {
        logger.warn('DiscoverMapMode handleMarkerClick missing marker data', { marker });
        return;
      }
      haptics.trigger('light');
      setSelectedPet(marker.data as Pet);
      setShowDetail(true);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('DiscoverMapMode handleMarkerClick _error', err, { markerId: marker?.id });
    }
  };

  const handleLike = () => {
    if (!selectedPet) return;
    haptics.trigger('success');
    onSwipe(selectedPet, 'like');
    setSelectedPet(null);
  };

  const handlePass = () => {
    if (!selectedPet) return;
    haptics.trigger('light');
    onSwipe(selectedPet, 'pass');
    setSelectedPet(null);
  };

  const compatibilityScore =
    selectedPet && userPet ? calculateCompatibility(userPet, selectedPet) : 0;

  if (!userLocation) {
    return (
      <div className="relative h-[calc(100vh-14rem)] max-h-175 bg-background rounded-2xl overflow-hidden border border-border shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
          <p className="text-lg font-semibold text-foreground/70">{t.map.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-14rem)] max-h-175 bg-background rounded-2xl overflow-hidden border border-border shadow-xl">
      <MapLibreMap
        center={mapCenter}
        zoom={12}
        markers={mapMarkers}
        onMarkerClick={handleMarkerClick}
        height="100%"
        clusterMarkers={true}
      />
      {selectedPetPresence.shouldRender && selectedPet && (
        <MotionView
          style={selectedPetPresence.animatedStyle}
          className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPet.photos?.[0] ?? '/placeholder-pet.png'}
                    alt={selectedPet.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-bold">{selectedPet.name}</h3>
                    <p className="text-muted-foreground">
                      {selectedPet.breed} • {selectedPet.age} {t.common.years}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      📍{' '}
                      {Math.round(
                        petsWithLocations.find((p) => p.id === selectedPet.id)?.distance ?? 0
                      )}{' '}
                      {t.common.km} {t.petProfile.distance}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPet(null)}
                className="shrink-0"
                aria-label="Close pet details"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary" className="text-sm">
                {compatibilityScore}% {t.discover.compatibility}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {selectedPet.size}
              </Badge>
            </div>

            <p className="text-foreground/80">{selectedPet.bio}</p>

            <div>
              <p className="text-sm font-semibold mb-2">{t.petProfile.personality}</p>
              <div className="flex gap-2 flex-wrap">
                {selectedPet.personality.map((trait) => (
                  <Badge key={trait} variant="outline">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={() => void handlePass()}
              >
                <X size={24} className="mr-2" />
                {t.discover.pass}
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-linear-to-r from-primary to-accent"
                onClick={() => void handleLike()}
              >
                <Heart size={24} className="mr-2" weight="fill" />
                {t.discover.like}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={() => setShowDetail(true)}
                aria-label="View pet details"
              >
                <Info size={24} />
              </Button>
            </div>
          </div>
        </MotionView>
      )}
      {selectedPet && (
        <ErrorBoundary
          fallback={
            <div className="p-4 text-sm text-muted-foreground">
              Failed to load pet details. Please refresh.
            </div>
          }
        >
          <PetDetailDialog pet={selectedPet} open={showDetail} onOpenChange={setShowDetail} />
        </ErrorBoundary>
      )}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{petsWithLocations.length}</p>
              <p className="text-xs text-muted-foreground">{t.map.placesNearby}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {petsWithLocations[0] ? Math.round(petsWithLocations[0].distance) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Closest (km)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
