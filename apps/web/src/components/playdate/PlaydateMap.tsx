import { useState, useEffect } from 'react';
import { motion, MotionView } from '@petspark/motion';
import {
  MapPin,
  NavigationArrow,
  Calendar,
  Clock,
  X,
  List,
  MapTrifold,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Playdate } from '@/lib/playdate-types';
import type { Location } from '@/lib/maps/types';
import { getCurrentLocation, calculateDistance, formatDistance } from '@/lib/maps/utils';
import { format } from 'date-fns';

interface PlaydateMapProps {
  playdates: Playdate[];
  onSelectPlaydate?: (playdate: Playdate) => void;
  onClose?: () => void;
}

export default function PlaydateMap({ playdates, onSelectPlaydate, onClose }: PlaydateMapProps) {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedPlaydate, setSelectedPlaydate] = useState<Playdate | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
          setUserLocation(location);
        }
      })
      .catch((error: unknown) => {
        // Location access denied or unavailable - component handles gracefully
        // User can still view playdates without their location
        if (error instanceof Error && error.name !== 'NotAllowedError') {
          // Only handle unexpected errors, permission denials are expected
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('PlaydateMap getCurrentLocation error', err);
        }
      });
  }, []);

  const playdatesWithLocation = playdates.filter(
    (p) =>
      p?.location?.lat &&
      typeof p.location.lat === 'number' &&
      p?.location?.lng &&
      typeof p.location.lng === 'number' &&
      p?.status !== 'cancelled'
  );

  const handleSelectPlaydate = (playdate: Playdate) => {
    if (!playdate) return;
    try {
      setSelectedPlaydate(playdate);
      if (onSelectPlaydate) {
        onSelectPlaydate(playdate);
      }
    } catch (error) {
      // Silently handle state update errors
    }
  };

  const handleGetDirections = (playdate: Playdate) => {
    if (
      !playdate?.location?.lat ||
      typeof playdate.location.lat !== 'number' ||
      !playdate?.location?.lng ||
      typeof playdate.location.lng !== 'number'
    ) {
      return;
    }

    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${playdate.location.lat},${playdate.location.lng}`;
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    } catch (error) {
      // Silently handle window.open errors
    }
  };

  const getDistanceFromUser = (playdate: Playdate) => {
    if (
      !userLocation ||
      !playdate?.location?.lat ||
      typeof playdate.location.lat !== 'number' ||
      !playdate?.location?.lng ||
      typeof playdate.location.lng !== 'number'
    ) {
      return null;
    }

    try {
      const distance = calculateDistance(userLocation, {
        lat: playdate.location.lat,
        lng: playdate.location.lng,
      });
      return formatDistance(distance);
    } catch (error) {
      // Silently handle distance calculation errors
      return null;
    }
  };

  return (
    <MotionView
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/98 backdrop-blur-md z-50 overflow-auto"
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MapTrifold size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Playdate Locations</h1>
              <p className="text-sm text-muted-foreground">
                {playdatesWithLocation.length} upcoming playdate
                {playdatesWithLocation.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <MapTrifold size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Map</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="X">
                <X size={24} />
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'map' ? (
          <Card className="overflow-hidden mb-6">
            <div className="relative w-full h-125 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-2xl px-4">
                  <MapTrifold size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-2">Interactive Playdate Map</h3>
                  <p className="text-muted-foreground mb-6">
                    Visualization of all your upcoming playdate locations with directions and
                    distance info
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {playdatesWithLocation.slice(0, 6).map((playdate, index) => {
                      const distance = getDistanceFromUser(playdate);
                      return (
                        <MotionView
                          key={playdate.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className={`p-3 cursor-pointer hover:shadow-lg transition-all ${
                              selectedPlaydate?.id === playdate.id
                                ? 'ring-2 ring-primary bg-primary/5'
                                : 'hover:bg-accent/5'
                            }`}
                            onClick={() => handleSelectPlaydate(playdate)}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin
                                size={20}
                                weight="fill"
                                className={
                                  selectedPlaydate?.id === playdate.id
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {playdate.location.name}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {playdate.location.address}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar size={12} />
                                {format(new Date(playdate.date), 'MMM dd')}
                              </div>
                              {distance && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <NavigationArrow size={12} />
                                  {distance}
                                </div>
                              )}
                            </div>
                          </Card>
                        </MotionView>
                      );
                    })}
                  </div>
                </div>
              </div>

              {userLocation && (
                <MotionView
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium">Your Location</span>
                  </div>
                </MotionView>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {playdatesWithLocation.map((playdate, index) => {
              const distance = getDistanceFromUser(playdate);
              return (
                <MotionView
                  key={playdate.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                      selectedPlaydate?.id === playdate.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-accent/5'
                    }`}
                    onClick={() => handleSelectPlaydate(playdate)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                        <MapPin size={24} weight="fill" className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{playdate.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar size={14} />
                          {format(new Date(playdate.date), 'EEE, MMM dd, yyyy')}
                          <Clock size={14} className="ml-2" />
                          {playdate.startTime}
                        </div>
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{playdate.location.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {playdate.location.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{playdate.type}</Badge>
                          <Badge
                            variant={playdate.status === 'confirmed' ? 'default' : 'secondary'}
                          >
                            {playdate.status}
                          </Badge>
                          {distance && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                              <NavigationArrow size={12} />
                              {distance} away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </MotionView>
              );
            })}
            {playdatesWithLocation.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming playdates with locations</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {selectedPlaydate && (
          <MotionView
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4"
          >
            <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/98 backdrop-blur-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{selectedPlaydate.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlaydate.location.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() = aria-label="X"> setSelectedPlaydate(null)}>
                  <X size={20} />
                </Button>
              </div>
              <Button onClick={() => handleGetDirections(selectedPlaydate)} className="w-full">
                <NavigationArrow size={18} className="mr-2" weight="bold" />
                Get Directions
              </Button>
            </Card>
          </MotionView>
        )}
      </div>
    </MotionView>
  );
}
