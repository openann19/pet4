'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  MotionView,
  type AnimatedStyle,
} from '@petspark/motion';
import { isTruthy } from '@petspark/shared';
import { useModalAnimation } from '@/effects/reanimated/use-modal-animation';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { timingConfigs } from '@/effects/reanimated/transitions';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, MapPin, Check, Crosshair } from '@phosphor-icons/react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MapLocationPicker');

export interface MapLocationPickerProps {
  onSelect: (lat: number, lon: number) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lon: number };
}

export function MapLocationPicker({
  onSelect,
  onClose,
  initialLocation,
}: MapLocationPickerProps): JSX.Element {
  const [selectedLat, setSelectedLat] = useState<number>(initialLocation?.lat ?? 37.7749);
  const [selectedLon, setSelectedLon] = useState<number>(initialLocation?.lon ?? -122.4194);
  const [address, setAddress] = useState<string>('Loading address...');
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const modalAnimation = useModalAnimation({
    isVisible,
    duration: 300,
  });

  const closeButtonAnimation = useBounceOnTap({
    onPress: handleClose,
    hapticFeedback: true,
  });

  const pinScale = useSharedValue(1);

  useEffect(() => {
    setIsVisible(true);
    return () => {
      setIsVisible(false);
    };
  }, []);

  useEffect(() => {
    pinScale.value = withRepeat(
      withSequence(withTiming(1.2, timingConfigs.smooth), withTiming(1, timingConfigs.smooth)),
      -1,
      false
    );
  }, [pinScale]);

  function handleClose(): void {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }

  useEffect(() => {
    if (navigator.geolocation && !initialLocation) {
      navigator.geolocation.getCurrentPosition(
        (position): void => {
          setSelectedLat(position.coords.latitude);
          setSelectedLon(position.coords.longitude);
        },
        (error): void => {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('Geolocation error', err);
        }
      );
    }
  }, [initialLocation]);

  const fetchAddress = useCallback(async (lat: number, lon: number): Promise<void> => {
    try {
      setIsLoadingAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAddress(data.display_name ?? 'Address not found');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to fetch address', err, { lat, lon });
      setAddress('Unable to fetch address');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  useEffect(() => {
    void fetchAddress(selectedLat, selectedLon);
  }, [selectedLat, selectedLon, fetchAddress]);

  const handleUseCurrentLocation = useCallback((): void => {
    if (isTruthy(navigator.geolocation)) {
      navigator.geolocation.getCurrentPosition(
        (position): void => {
          setSelectedLat(position.coords.latitude);
          setSelectedLon(position.coords.longitude);
        },
        (error): void => {
          const err = _error instanceof Error ? _error : new Error(String(_error));
          logger.error('Geolocation error', err);
        }
      );
    }
  }, []);

  const handleConfirm = useCallback((): void => {
    onSelect(selectedLat, selectedLon);
  }, [selectedLat, selectedLon, onSelect]);

  const pinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pinScale.value }],
    };
  }) as AnimatedStyle;

  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, timingConfigs.smooth);
  }, [backdropOpacity]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  }) as AnimatedStyle;

  return (
    <MotionView
      style={backdropStyle}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg"
    >
      <MotionView
        style={modalAnimation.style}
        className="container max-w-6xl mx-auto p-4 h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pick Location on Map</h2>
            <p className="text-sm text-muted-foreground">Drag the map or use current location</p>
          </div>
          <MotionView style={closeButtonAnimation.animatedStyle}>
            <Button variant="ghost" size="icon" onClick={closeButtonAnimation.handlePress} aria-label="X">
              <X size={24} />
            </Button>
          </MotionView>
        </div>

        <Card className="flex-1 relative overflow-hidden mb-4">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin size={64} className="mx-auto text-primary" weight="duotone" />
              <div>
                <p className="text-lg font-semibold">Interactive Map</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  In production, this would show an interactive map (OpenStreetMap, Google Maps, or
                  Mapbox) where users can drag to select a location.
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg max-w-md mx-auto">
                <p className="text-xs text-muted-foreground mb-2">Selected Location:</p>
                <p className="font-mono text-sm">
                  Lat: {selectedLat.toFixed(6)}, Lon: {selectedLon.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {isLoadingAddress ? 'Loading address...' : address}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <MotionView style={pinStyle}>
              <MapPin size={48} className="text-primary drop-shadow-lg" weight="fill" />
            </MotionView>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handleUseCurrentLocation()}
            className="flex-1"
            disabled={isLoadingAddress}
          >
            <Crosshair size={16} className="mr-2" />
            Use Current Location
          </Button>
          <Button
            variant="default"
            onClick={() => void handleConfirm()}
            className="flex-1"
            disabled={isLoadingAddress}
          >
            <Check size={16} className="mr-2" />
            Confirm Location
          </Button>
        </div>
      </MotionView>
    </MotionView>
  );
}
