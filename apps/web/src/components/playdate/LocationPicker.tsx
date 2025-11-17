import { useState, useEffect } from 'react';
import { motion, Presence, MotionView } from '@petspark/motion';
import {
  MapPin,
  MagnifyingGlass,
  MapTrifold,
  ListBullets,
  NavigationArrow,
  Star,
  Park,
  Coffee,
  House,
  Path,
  Buildings,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PlaydateLocation } from '@/lib/playdate-types';
import type { Location } from '@/lib/maps/types';
import { getCurrentLocation, calculateDistance, formatDistance } from '@/lib/maps/utils';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

interface LocationPickerProps {
  value?: PlaydateLocation;
  onChange: (location: PlaydateLocation) => void;
  onClose?: () => void;
}

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  type: 'park' | 'cafe' | 'beach' | 'trail' | 'other';
  location: Location;
  distance?: number;
  rating?: number;
}

const MOCK_NEARBY_PLACES: NearbyPlace[] = [
  {
    id: '1',
    name: 'Central Dog Park',
    address: '123 Main St',
    type: 'park',
    location: { lat: 37.7749, lng: -122.4194 },
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Pawfect Paws Cafe',
    address: '456 Oak Ave',
    type: 'cafe',
    location: { lat: 37.775, lng: -122.4195 },
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Sunset Beach Trail',
    address: '789 Beach Rd',
    type: 'trail',
    location: { lat: 37.7751, lng: -122.4196 },
    rating: 4.6,
  },
  {
    id: '4',
    name: 'Riverside Park',
    address: '321 River Dr',
    type: 'park',
    location: { lat: 37.7752, lng: -122.4197 },
    rating: 4.7,
  },
  {
    id: '5',
    name: 'Pet Haven Meadow',
    address: '654 Green St',
    type: 'park',
    location: { lat: 37.7748, lng: -122.4193 },
    rating: 4.9,
  },
];

export default function LocationPicker({ value, onChange, onClose }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [_userLocation, setUserLocation] = useState<Location | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>(MOCK_NEARBY_PLACES);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [customLocation, setCustomLocation] = useState({
    name: value?.name || '',
    address: value?.address || '',
  });

  useEffect(() => {
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);

      const placesWithDistance = MOCK_NEARBY_PLACES.map((place) => ({
        ...place,
        distance: calculateDistance(location, place.location),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setNearbyPlaces(placesWithDistance);
      toast.success('Location detected');
    } catch (error) {
      toast.error('Could not get your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'park':
        return <Park size={20} weight="fill" className="text-green-600" />;
      case 'cafe':
        return <Coffee size={20} weight="fill" className="text-orange-600" />;
      case 'beach':
      case 'trail':
        return <Path size={20} weight="bold" className="text-blue-600" />;
      case 'home':
        return <House size={20} weight="fill" className="text-purple-600" />;
      default:
        return <Buildings size={20} className="text-gray-600" />;
    }
  };

  const handleSelectPlace = (place: NearbyPlace) => {
    setSelectedPlace(place);
    onChange({
      name: place.name,
      address: place.address,
      lat: place.location.lat,
      lng: place.location.lng,
      type: place.type,
    });
    haptics.selection();
  };

  const handleCustomLocation = () => {
    if (!customLocation.name || !customLocation.address) {
      toast.error('Please enter location name and address');
      return;
    }

    onChange({
      name: customLocation.name,
      address: customLocation.address,
      type: 'other',
    });
    haptics.success();
    if (onClose) onClose();
  };

  const filteredPlaces = nearbyPlaces.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MotionView
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/98 backdrop-blur-md z-50 overflow-auto"
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <MapPin size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Choose Location</h1>
              <p className="text-sm text-muted-foreground">
                Select a meeting spot for your playdate
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="X">
              <X size={24} />
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for parks, cafes, or places..."
              className="pl-10 pr-12 h-12 text-base"
            />
            {isLoadingLocation && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <MotionView
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <NavigationArrow size={20} className="text-primary" />
                </MotionView>
              </div>
            )}
          </div>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'list' | 'map')}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListBullets size={18} />
              List
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapTrifold size={18} />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <ScrollArea className="h-125">
              <div className="space-y-3">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    Nearby Places
                  </h3>
                  <Presence>
                    {filteredPlaces.map((place, index) => (
                      <MotionView
                        key={place.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`p-4 mb-3 cursor-pointer transition-all hover:shadow-lg ${
                            String(selectedPlace?.id === place.id
                                                                  ? 'ring-2 ring-primary bg-primary/5'
                                                                  : 'hover:bg-accent/5')
                          }`}
                          onClick={() => { handleSelectPlace(place); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-background to-muted flex items-center justify-center flex-shrink-0 border">
                              {getPlaceIcon(place.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-base">{place.name}</h4>
                                {place.rating && (
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1 flex-shrink-0"
                                  >
                                    <Star size={12} weight="fill" className="text-yellow-500" />
                                    {place.rating}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{place.address}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {place.type}
                                </Badge>
                                {place.distance !== undefined && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <NavigationArrow size={12} />
                                    {formatDistance(place.distance)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedPlace?.id === place.id && (
                              <MotionView
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                              >
                                <MapPin size={14} weight="fill" className="text-white" />
                              </MotionView>
                            )}
                          </div>
                        </Card>
                      </MotionView>
                    ))}
                  </Presence>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    Custom Location
                  </h3>
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Input
                          placeholder="Location name (e.g., My Favorite Park)"
                          value={customLocation.name}
                          onChange={(e) =>
                            setCustomLocation((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Address"
                          value={customLocation.address}
                          onChange={(e) =>
                            setCustomLocation((prev) => ({ ...prev, address: e.target.value }))
                          }
                        />
                      </div>
                      <Button onClick={handleCustomLocation} className="w-full">
                        <MapPin size={16} className="mr-2" weight="fill" />
                        Use This Location
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <Card className="overflow-hidden">
              <div className="relative w-full h-125 bg-linear-to-br from-primary/5 via-accent/5 to-secondary/5 flex items-center justify-center">
                <div className="text-center">
                  <MapTrifold size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Interactive Map View</h3>
                  <p className="text-muted-foreground max-w-md">
                    Map visualization shows nearby pet-friendly locations on an interactive map
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {filteredPlaces.slice(0, 5).map((place, index) => (
                      <MotionView
                        key={place.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant={selectedPlace?.id === place.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { handleSelectPlace(place); }}
                          className="gap-2"
                        >
                          {getPlaceIcon(place.type)}
                          {place.name}
                        </Button>
                      </MotionView>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedPlace && (
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4"
          >
            <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/98 backdrop-blur-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getPlaceIcon(selectedPlace.type)}
                  <div>
                    <h4 className="font-semibold">{selectedPlace.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => onClose?.()} className="w-full">
                Confirm Location
              </Button>
            </Card>
          </MotionView>
        )}
      </div>
    </MotionView>
  );
}
