/**
 * Playdates View
 *
 * Main playdates view with scheduler, map, and list
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { PlaydateScheduler } from '@/components/playdates/PlaydateScheduler';
import { PlaydateMap } from '@/components/playdates/PlaydateMap';
import { PlaydateCard } from '@/components/playdates/PlaydateCard';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { playdatesClient } from '@petspark/core';
import type { Playdate, PlaydateLocation } from '@petspark/core';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';

const logger = createLogger('PlaydatesView');

export function PlaydatesView(): React.JSX.Element {
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  useEffect(() => {
    void loadPlaydates();
    void getCurrentLocation();
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        logger.error('Failed to get current location', error);
      }
    );
  }, []);

  const loadPlaydates = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await playdatesClient.getPlaydates();
      setPlaydates(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load playdates', err);
      toast.error('Failed to load playdates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = useCallback(
    async (playdateData: {
      title: string;
      description?: string;
      scheduledAt: string;
      duration: number;
      location: PlaydateLocation;
      isPublic: boolean;
      maxParticipants?: number;
      trustedContactId?: string;
    }) => {
      try {
        const newPlaydate = await playdatesClient.createPlaydate({
          ...playdateData,
          petId: 'current-pet-id',
          visibility: playdateData.isPublic ? 'public' : 'private',
        });
        setPlaydates((prev) => [newPlaydate, ...prev]);
        setShowScheduler(false);
        toast.success('Playdate scheduled!');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to schedule playdate', err);
        toast.error('Failed to schedule playdate');
      }
    },
    []
  );

  const handleJoin = useCallback(
    async (playdateId: string) => {
      try {
        const updated = await playdatesClient.joinPlaydate(playdateId);
        setPlaydates((prev) => prev.map((p) => (p.id === playdateId ? updated : p)));
        toast.success('Joined playdate!');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to join playdate', err);
        toast.error('Failed to join playdate');
      }
    },
    []
  );

  const handleCheckIn = useCallback(
    async (playdateId: string) => {
      try {
        await playdatesClient.checkIn(playdateId);
        toast.success('Checked in!');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to check in', err);
        toast.error('Failed to check in');
      }
    },
    []
  );

  const upcomingPlaydates = playdates.filter(
    (p) => new Date(p.scheduledAt) > new Date() && p.status === 'confirmed'
  );
  const nearbyPlaydates = currentLocation
    ? upcomingPlaydates
        .map((p) => ({
          playdate: p,
          distance: Math.sqrt(
            Math.pow(p.location.latitude - currentLocation.latitude, 2) +
              Math.pow(p.location.longitude - currentLocation.longitude, 2)
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10)
        .map((item) => item.playdate)
    : upcomingPlaydates;

  return (
    <PageTransitionWrapper>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn(getTypographyClasses('h1'), 'mb-2')}>Playdates</h1>
            <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
              Schedule and join playdates with other pet owners
            </p>
          </div>
          <Button onClick={() => setShowScheduler(true)}>
            <Plus className="size-4 mr-2" />
            Schedule Playdate
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <PremiumCard variant="glass" className="p-8 text-center">
                <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>Loading playdates...</p>
              </PremiumCard>
            ) : upcomingPlaydates.length === 0 ? (
              <PremiumCard variant="glass" className="p-8 text-center">
                <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
                  No upcoming playdates. Schedule one to get started!
                </p>
              </PremiumCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingPlaydates.map((playdate) => (
                  <PlaydateCard
                    key={playdate.id}
                    playdate={playdate}
                    onJoin={() => handleJoin(playdate.id)}
                    onCheckIn={() => handleCheckIn(playdate.id)}
                    isParticipant={playdate.participants.some((p) => p.id === 'current-user-id')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <PlaydateMap
              playdates={nearbyPlaydates}
              currentLocation={currentLocation}
              onPlaydateClick={(playdate) => {
                // Handle playdate click
              }}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className={cn(getTypographyClasses('h2'))}>Schedule Playdate</DialogTitle>
            </DialogHeader>
            <PlaydateScheduler
              onSchedule={handleSchedule}
              onCancel={() => setShowScheduler(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageTransitionWrapper>
  );
}

