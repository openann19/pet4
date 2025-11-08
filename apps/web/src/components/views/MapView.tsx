import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, Presence, MotionView } from '@petspark/motion';
import {
  MapPin,
  MagnifyingGlass,
  NavigationArrow,
  Heart,
  Crosshair,
  List,
  X,
  Warning,
  CheckCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { DEFAULT_LOCATION } from '@/lib/maps/config';
import {
  calculateDistance,
  formatDistance,
  snapToGrid,
  getCurrentLocation,
} from '@/lib/maps/utils';
import type { Location, Place, MapMarker } from '@/lib/maps/types';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { logger } from '@/lib/logger';

type MapViewMode = 'discover' | 'places' | 'playdate' | 'lost-pet' | 'matches';

export default function MapView() {
  const { t } = useApp();
  const { mapSettings, PLACE_CATEGORIES } = useMapConfig();

  const [_mode, _setMode] = useState<MapViewMode>('discover');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [coarseLocation, setCoarseLocation] = useState<Location | null>(null);
  const [preciseSharingEnabled, setPreciseSharingEnabled] = useStorage<boolean>(
    'map-precise-sharing',
    false
  );
  const [preciseSharingUntil, setPreciseSharingUntil] = useStorage<number | null>(
    'map-precise-until',
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radiusKm, _setRadiusKm] = useState(mapSettings.DEFAULT_RADIUS_KM);
  const [showList, setShowList] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>(
    'prompt'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [savedPlaces, setSavedPlaces] = useStorage<string[]>('saved-places', []);

  const mapRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (preciseSharingEnabled && preciseSharingUntil) {
      const now = Date.now();
      if (now > preciseSharingUntil) {
        setPreciseSharingEnabled(false);
        setPreciseSharingUntil(null);
        toast.info(t.map?.precisionExpired || 'Precise location sharing ended');
      }
    }
  }, [preciseSharingEnabled, preciseSharingUntil]);

  useEffect(() => {
    if (userLocation) {
      generateDemoPlaces(userLocation);
    }
  }, [userLocation, radiusKm]);

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
      setCoarseLocation(coarse);
      setLocationPermission('granted');
      toast.success(t.map?.locationEnabled || 'Location enabled');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Location error', err, { action: 'getUserLocation' });
      setLocationPermission('denied');
      setUserLocation(DEFAULT_LOCATION);
      setCoarseLocation(DEFAULT_LOCATION);
      toast.error(t.map?.locationDenied || 'Location access denied. Using default location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleEnablePreciseSharing = () => {
    haptics.trigger('medium');
    const until = Date.now() + 60 * 60 * 1000;
    setPreciseSharingEnabled(true);
    setPreciseSharingUntil(until);
    toast.success(t.map?.precisionEnabled || 'Precise location enabled for 60 minutes');
  };

  const handleDisablePreciseSharing = () => {
    haptics.trigger('light');
    setPreciseSharingEnabled(false);
    setPreciseSharingUntil(null);
    toast.info(t.map?.precisionDisabled || 'Precise location disabled');
  };

  const generateDemoPlaces = (center: Location) => {
    const places: Place[] = [];
    const categories = PLACE_CATEGORIES;

    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      if (!category) continue;
      const angle = (Math.PI * 2 * i) / 20;
      const dist = Math.random() * radiusKm;
      const deltaLat = (dist / 111) * Math.cos(angle);
      const deltaLng = (dist / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);

      const location: Location = {
        lat: center.lat + deltaLat,
        lng: center.lng + deltaLng,
      };

      places.push({
        id: `place-${i}`,
        name: `${category.name} ${i + 1}`,
        description: `Great ${category.name.toLowerCase()} in your area`,
        category: category.id,
        location,
        address: `${Math.floor(Math.random() * 999)} Main St, City`,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        hours: '9:00 AM - 6:00 PM',
        photos: [`https://images.unsplash.com/photo-${1560807700000 + i * 1000000}?w=400&q=80`],
        verified: Math.random() > 0.3,
        petFriendly: true,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 200),
        amenities: ['Water Bowl', 'Outdoor Space', 'Pet-Friendly Staff'],
        distance: calculateDistance(center, location),
        isOpen: Math.random() > 0.2,
        moderationStatus: 'approved',
      });
    }

    setNearbyPlaces(places.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
  };

  const handleCategoryFilter = (categoryId: string) => {
    haptics.trigger('selection');
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleSavePlace = (placeId: string) => {
    haptics.trigger('medium');
    setSavedPlaces((current) => {
      const currentPlaces = current || [];
      if (currentPlaces.includes(placeId)) {
        toast.info(t.map?.placeRemoved || 'Place removed from saved');
        return currentPlaces.filter((id) => id !== placeId);
      } else {
        toast.success(t.map?.placeSaved || 'Place saved');
        return [...currentPlaces, placeId];
      }
    });
  };

  const filteredPlaces = useMemo(() => {
    let filtered = nearbyPlaces;

    if (selectedCategory) {
      filtered = filtered.filter((place) => place.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.description?.toLowerCase().includes(query) ||
          place.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [nearbyPlaces, selectedCategory, searchQuery]);

  const displayLocation = preciseSharingEnabled && userLocation ? userLocation : coarseLocation;

  return (
    <div className="relative h-[calc(100vh-12rem)] max-h-[800px] bg-background rounded-2xl overflow-hidden border border-border shadow-xl">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30"
      >
        {/* Placeholder Map Visual */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground/70">
                {t.map?.interactiveMap || 'Interactive Map'}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {t.map?.mapDescription ||
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

        {/* Markers Visualization */}
        {displayLocation &&
          filteredPlaces.slice(0, 15).map((place, idx) => {
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
                    setSelectedMarker({
                      id: place.id,
                      type: 'place',
                      location: place.location,
                      data: place,
                    });
                    setShowList(false);
                  }}
                  className="relative group cursor-pointer transform transition-transform hover:scale-110 active:scale-95"
                >
                  <div
                    className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl backdrop-blur-sm border-2 border-white"
                    style={{ backgroundColor: category?.color || '#ec4899' }}
                  >
                    {category?.icon || '📍'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </button>
              </MotionView>
            );
          })}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
        {/* Search Bar */}
        <MotionView
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-2xl border border-border/50 p-3"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.map?.searchPlaceholder || 'Search places...'}
                className="pl-10 h-11 bg-background/50 border-border"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.trigger('selection');
                setShowList(!showList);
              }}
              className="h-11 w-11 rounded-xl hover:bg-primary/10"
            >
              {showList ? <X size={20} /> : <List size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={requestLocation}
              disabled={isLocating}
              className="h-11 w-11 rounded-xl hover:bg-primary/10"
            >
              <Crosshair size={20} className={isLocating ? 'animate-spin' : ''} />
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
            {PLACE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-background/50 text-foreground/70 hover:bg-muted'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </MotionView>

        {/* Privacy Banner */}
        {locationPermission === 'granted' && !preciseSharingEnabled && (
          <MotionView
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="backdrop-blur-xl bg-primary/10 rounded-xl border border-primary/20 p-3"
          >
            <div className="flex items-start gap-3">
              <Warning size={20} className="text-primary shrink-0 mt-0.5" weight="fill" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t.map?.approximateLocation || 'Using approximate location'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.map?.enablePrecisePrompt ||
                    'Enable precise location for live meet-ups and exact navigation'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleEnablePreciseSharing}
                className="shrink-0 h-8 text-xs"
              >
                {t.map?.enable || 'Enable'}
              </Button>
            </div>
          </MotionView>
        )}

        {preciseSharingEnabled && preciseSharingUntil && (
          <MotionView
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="backdrop-blur-xl bg-green-500/10 rounded-xl border border-green-500/20 p-3"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500 shrink-0" weight="fill" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t.map?.preciseEnabled || 'Precise location active'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.map?.preciseExpires ||
                    `Expires in ${Math.ceil((preciseSharingUntil - Date.now()) / 60000)} minutes`}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisablePreciseSharing}
                className="shrink-0 h-8 text-xs"
              >
                {t.map?.disable || 'Disable'}
              </Button>
            </div>
          </MotionView>
        )}
      </div>

      {/* Places List Sidebar */}
      <Presence>
        {showList && (
          <MotionView
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {t.map?.nearbyPlaces || 'Nearby Places'} ({filteredPlaces.length})
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowList(false)}>
                  <X size={20} />
                </Button>
              </div>

              {filteredPlaces.map((place) => {
                const category = PLACE_CATEGORIES.find((c) => c.id === place.category);
                const isSaved = (savedPlaces || []).includes(place.id);

                return (
                  <Card
                    key={place.id}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      haptics.trigger('light');
                      setSelectedMarker({
                        id: place.id,
                        type: 'place',
                        location: place.location,
                        data: place,
                      });
                      setShowList(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        {category?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate">{place.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSavePlace(place.id);
                            }}
                          >
                            <Heart
                              size={16}
                              weight={isSaved ? 'fill' : 'regular'}
                              className={isSaved ? 'text-red-500' : ''}
                            />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {place.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatDistance(place.distance || 0)}
                          </Badge>
                          {place.verified && (
                            <Badge variant="outline" className="text-xs">
                              ✓ Verified
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ⭐ {place.rating.toFixed(1)} ({place.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </MotionView>
        )}
      </Presence>

      {/* Selected Place Detail Sheet */}
      <Presence>
        {selectedMarker?.type === 'place' && (
          <MotionView
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[60%] bg-background rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto"
          >
            {(() => {
              const place = selectedMarker.data as Place;
              const category = PLACE_CATEGORIES.find((c) => c.id === place.category);
              const isSaved = (savedPlaces || []).includes(place.id);

              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        {category?.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{place.name}</h3>
                        <p className="text-sm text-muted-foreground">{place.address}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedMarker(null)}>
                      <X size={20} />
                    </Button>
                  </div>

                  {place.description && <p className="text-foreground/80">{place.description}</p>}

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">📏 {formatDistance(place.distance || 0)}</Badge>
                    <Badge variant="secondary">
                      ⭐ {place.rating.toFixed(1)} ({place.reviewCount})
                    </Badge>
                    {place.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Verified
                      </Badge>
                    )}
                    {place.isOpen && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        🕐 Open Now
                      </Badge>
                    )}
                  </div>

                  {place.amenities.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Amenities</p>
                      <div className="flex gap-2 flex-wrap">
                        {place.amenities.map((amenity) => (
                          <Badge key={amenity} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        haptics.trigger('medium');
                        handleSavePlace(place.id);
                      }}
                      variant={isSaved ? 'secondary' : 'outline'}
                    >
                      <Heart size={18} weight={isSaved ? 'fill' : 'regular'} className="mr-2" />
                      {isSaved ? t.map?.saved || 'Saved' : t.map?.save || 'Save'}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        haptics.trigger('medium');
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <NavigationArrow size={18} className="mr-2" />
                      {t.map?.navigate || 'Navigate'}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </MotionView>
        )}
      </Presence>

      {/* Stats Footer */}
      <MotionView
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-4 left-4 right-4 z-10"
      >
        <div className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-xl border border-border p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{filteredPlaces.length}</p>
              <p className="text-xs text-muted-foreground">{t.map?.placesNearby || 'Places'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{(savedPlaces || []).length}</p>
              <p className="text-xs text-muted-foreground">{t.map?.saved || 'Saved'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{radiusKm}</p>
              <p className="text-xs text-muted-foreground">{t.map?.radiusKm || 'km radius'}</p>
            </div>
          </div>
        </div>
      </MotionView>
    </div>
  );
}
