import { useState, useEffect, useMemo } from 'react';
import { motion } from '@petspark/motion';
import { X, MagnifyingGlass, NavigationArrow, Star } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import type { Location, Place } from '@/lib/maps/types';
import { getCurrentLocation, snapToGrid, calculateDistance, formatDistance } from '@/lib/maps/utils';
import MapLibreMap from '@/components/maps/MapLibreMap';
import type { MapMarker } from '@/lib/maps/useMapLibreMap';
import { forwardGeocode } from '@/lib/maps/geocoding';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { toast } from 'sonner';

interface VenuePickerProps {
  open: boolean;
  onClose: () => void;
  onSelectVenue: (venue: Place) => void;
  matchLocation?: Location;
}

const VENUE_CATEGORIES = [
  { id: 'park', label: 'Park', icon: '🌳' },
  { id: 'vet', label: 'Vet', icon: '🏥' },
  { id: 'groomer', label: 'Groomer', icon: '✂️' },
  { id: 'cafe', label: 'Pet-friendly Café', icon: '☕' },
  { id: 'store', label: 'Pet Store', icon: '🏪' },
];

export default function VenuePicker({
  open,
  onClose,
  onSelectVenue,
  matchLocation,
}: VenuePickerProps): React.JSX.Element {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [venues, setVenues] = useState<Place[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Place | null>(null);

  useEffect(() => {
    if (open) {
      getCurrentLocation()
        .then((location) => {
          const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
          setUserLocation(coarse);
        })
        .catch(() => {
          setUserLocation(matchLocation || { lat: 40.7128, lng: -74.006 });
        });
    }
  }, [open, matchLocation, mapSettings.PRIVACY_GRID_METERS]);

  useEffect(() => {
    if (open && userLocation) {
      loadVenues();
    }
  }, [open, userLocation, selectedCategory]);

  const loadVenues = async (): Promise<void> => {
    if (!userLocation) return;
    
    try {
      const query = searchQuery || (selectedCategory ? `${selectedCategory} pet` : 'pet friendly');
      const results = await forwardGeocode(query, 'en', userLocation);
      
      const places: Place[] = results.map((result) => ({
        id: result.id,
        name: result.name,
        category: selectedCategory || 'other',
        location: result.location,
        address: result.address,
        photos: [],
        verified: false,
        petFriendly: true,
        rating: result.relevance ? result.relevance * 5 : 4.0,
        reviewCount: 0,
        amenities: [],
        moderationStatus: 'approved',
      }));
      
      setVenues(places.slice(0, 20));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || t.map?.errorLoadingMap || 'Error loading venues');
    }
  };

  const mapMarkers = useMemo((): MapMarker[] => {
    return venues.map((venue) => ({
      id: venue.id,
      location: venue.location,
      data: venue,
      color: 'hsl(var(--primary))',
    }));
  }, [venues]);

  const handleMarkerClick = (marker: MapMarker): void => {
    haptics.trigger('light');
    setSelectedVenue(marker.data as Place);
  };

  const handleSelectVenue = (): void => {
    if (!selectedVenue) return;
    haptics.trigger('success');
    onSelectVenue(selectedVenue);
    onClose();
  };

  const handleSearch = (): void => {
    haptics.trigger('light');
    loadVenues();
  };

  const handleGetDirections = (venue: Place): void => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;
    window.open(url, '_blank');
  };

  const mapCenter = useMemo((): Location => {
    if (selectedVenue) return selectedVenue.location;
    if (matchLocation) return matchLocation;
    return userLocation || { lat: 40.7128, lng: -74.006 };
  }, [selectedVenue, matchLocation, userLocation]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-xl font-bold">
            {t.map?.choosePlace || 'Choose a place'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 border-b">
            <div className="flex gap-2">
              <Input
                placeholder={t.map?.searchPlaceholder || 'Search places...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <MagnifyingGlass size={20} />
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {VENUE_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    haptics.trigger('selection');
                    setSelectedCategory(selectedCategory === category.id ? null : category.id);
                  }}
                  className="shrink-0"
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            {userLocation && (
              <>
                <MapLibreMap
                  center={mapCenter}
                  zoom={selectedVenue ? 15 : 13}
                  markers={mapMarkers}
                  onMarkerClick={handleMarkerClick}
                  height="100%"
                  clusterMarkers={false}
                />
              </>
            )}
          </div>

          {selectedVenue && (
            <MotionView
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedVenue.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVenue.address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {selectedVenue.rating && (
                      <div className="flex items-center gap-1">
                        <Star size={14} weight="fill" className="text-yellow-500" />
                        <span className="text-sm">{selectedVenue.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {userLocation && (
                      <Badge variant="secondary" className="text-xs">
                        <NavigationArrow size={12} className="mr-1" />
                        {formatDistance(calculateDistance(userLocation, selectedVenue.location))}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedVenue(null)}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGetDirections(selectedVenue)}
                >
                  <NavigationArrow size={18} className="mr-2" />
                  {t.map?.openInMaps || 'Open in Maps'}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSelectVenue}
                >
                  {t.map?.selectLocation || 'Select'}
                </Button>
              </div>
            </MotionView>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

