import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Heart, Info } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import type { Pet } from '@/lib/types';
import { calculateDistance, snapToGrid, getCurrentLocation, formatDistance } from '@/lib/maps/utils';
import type { Location } from '@/lib/maps/types';
import PetDetailDialog from '@/components/PetDetailDialog';
import { calculateCompatibility } from '@/lib/matching';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import InteractiveMap, { type MapMarker } from '@/components/maps/InteractiveMap';
import L from 'leaflet';

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

  useEffect(() => {
    getCurrentLocation()
      .then(location => {
        const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
        setUserLocation(coarse);
      })
      .catch(() => {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      });
  }, [mapSettings.PRIVACY_GRID_METERS]);

  const petsWithLocations = useMemo(() => {
    if (!userLocation) return [];
    
    return pets.map(pet => {
      const petLoc = {
        lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
        lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
      };
      
      return {
        ...pet,
        locationData: petLoc,
        distance: calculateDistance(userLocation, petLoc),
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [pets, userLocation]);

  const mapMarkers = useMemo((): MapMarker[] => {
    return petsWithLocations.map((pet) => {
      const petIcon = L.divIcon({
        className: 'custom-pet-marker',
        html: `
          <div class="pet-marker-container">
            <img src="${pet.photos?.[0] || '/placeholder-pet.png'}" alt="${pet.name}" class="pet-marker-image" />
            <div class="pet-marker-badge">${Math.round(pet.distance)}km</div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50],
      });

      return {
        id: pet.id,
        location: pet.locationData,
        data: pet,
        icon: petIcon,
      };
    });
  }, [petsWithLocations]);

  const mapCenter = useMemo((): Location => {
    if (!userLocation) return { lat: 40.7128, lng: -74.006 };
    return userLocation;
  }, [userLocation]);

  const handleMarkerClick = (marker: MapMarker) => {
    haptics.trigger('light');
    setSelectedPet(marker.data as Pet);
    setShowDetail(true);
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

  const compatibilityScore = selectedPet && userPet
    ? calculateCompatibility(userPet, selectedPet)
    : 0;

  if (!userLocation) {
    return (
      <div className="relative h-[calc(100vh-14rem)] max-h-[700px] bg-background rounded-2xl overflow-hidden border border-border shadow-xl flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
          <p className="text-lg font-semibold text-foreground/70">
            {t.map.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-14rem)] max-h-[700px] bg-background rounded-2xl overflow-hidden border border-border shadow-xl">
      <style>{`
        .pet-marker-container {
          position: relative;
          width: 50px;
          height: 50px;
        }
        .pet-marker-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .pet-marker-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .custom-pet-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      <InteractiveMap
        center={mapCenter}
        zoom={12}
        markers={mapMarkers}
        onMarkerClick={handleMarkerClick}
        height="100%"
        clusterMarkers={true}
      />

      <AnimatePresence>
        {selectedPet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPet.photos?.[0] || '/placeholder-pet.png'}
                      alt={selectedPet.name}
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-2xl font-bold">{selectedPet.name}</h3>
                      <p className="text-muted-foreground">
                        {selectedPet.breed} • {selectedPet.age} {t.common.years}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        📍 {Math.round(petsWithLocations.find(p => p.id === selectedPet.id)?.distance || 0)} {t.common.km} {t.petProfile.distance}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPet(null)}
                  className="shrink-0"
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
                  onClick={handlePass}
                >
                  <X size={24} className="mr-2" />
                  {t.discover.pass}
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 text-lg bg-linear-to-r from-primary to-accent"
                  onClick={handleLike}
                >
                  <Heart size={24} className="mr-2" weight="fill" />
                  {t.discover.like}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => setShowDetail(true)}
                >
                  <Info size={24} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPet && (
        <PetDetailDialog
          pet={selectedPet}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
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
