import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Plus, Clock, Filter } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import type { Location, LostPetAlert } from '@/lib/maps/types';
import { getCurrentLocation, snapToGrid, calculateDistance, formatDistance } from '@/lib/maps/utils';
import InteractiveMap, { type MapMarker } from '@/components/maps/InteractiveMap';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { lostFoundAPI } from '@/api/lost-found-api';
import L from 'leaflet';
import { toast } from 'sonner';

interface LostFoundMapProps {
  alerts: LostPetAlert[];
  onReportSighting?: (alertId: string, location: Location) => void;
  onReportLost?: () => void;
}

export default function LostFoundMap({
  alerts,
  onReportSighting,
  onReportLost,
}: LostFoundMapProps): JSX.Element {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<LostPetAlert | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');

  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
        setUserLocation(coarse);
      })
      .catch(() => {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      });
  }, [mapSettings.PRIVACY_GRID_METERS]);

  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter((alert) => alert.status === 'active');

    const now = new Date();
    if (timeFilter !== 'all') {
      const cutoffHours = timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 720;
      const cutoff = new Date(now.getTime() - cutoffHours * 60 * 60 * 1000);
      filtered = filtered.filter((alert) => alert.lastSeenTime >= cutoff);
    }

    if (userLocation) {
      filtered = filtered.filter((alert) => {
        const distance = calculateDistance(userLocation, alert.lastSeen);
        return distance <= radiusKm;
      });
    }

    return filtered;
  }, [alerts, userLocation, radiusKm, timeFilter]);

  const mapMarkers = useMemo((): MapMarker[] => {
    return filteredAlerts.map((alert) => {
      const alertIcon = L.divIcon({
        className: 'custom-alert-marker',
        html: `
          <div class="alert-marker-container">
            <img src="${alert.petPhoto}" alt="${alert.petName}" class="alert-marker-image" />
            <div class="alert-marker-pulse"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
      });

      return {
        id: alert.id,
        location: alert.lastSeen,
        data: alert,
        icon: alertIcon,
      };
    });
  }, [filteredAlerts]);

  const handleMarkerClick = (marker: MapMarker): void => {
    haptics.trigger('light');
    setSelectedAlert(marker.data as LostPetAlert);
  };

  const handleReportSighting = async (): Promise<void> => {
    if (!selectedAlert || !userLocation || !onReportSighting) return;
    
    haptics.trigger('success');
    onReportSighting(selectedAlert.id, userLocation);
    toast.success(t.lostFound?.sightingReported || 'Sighting reported');
  };

  const mapCenter = useMemo((): Location => {
    if (!userLocation) return { lat: 40.7128, lng: -74.006 };
    return userLocation;
  }, [userLocation]);

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <MapPin size={64} className="mx-auto text-primary/30" weight="duotone" />
          <p className="text-lg font-semibold text-foreground/70">
            {t.map?.loading || 'Loading map...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        .alert-marker-container {
          position: relative;
          width: 48px;
          height: 48px;
        }
        .alert-marker-image {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid hsl(var(--destructive));
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .alert-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: hsl(var(--destructive));
          opacity: 0.3;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        .custom-alert-marker {
          background: transparent;
          border: none;
        }
      `}</style>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-2">
            <MapPin size={14} />
            {filteredAlerts.length} {t.lostFound?.alerts || 'alerts'}
          </Badge>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={timeFilter}
              onChange={(e) => {
                haptics.trigger('selection');
                setTimeFilter(e.target.value as typeof timeFilter);
              }}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">{t.lostFound?.allTime || 'All time'}</option>
              <option value="24h">{t.lostFound?.last24h || 'Last 24h'}</option>
              <option value="7d">{t.lostFound?.last7d || 'Last 7 days'}</option>
              <option value="30d">{t.lostFound?.last30d || 'Last 30 days'}</option>
            </select>
          </div>
        </div>
        {onReportLost && (
          <Button onClick={onReportLost} size="sm">
            <Plus size={18} className="mr-2" />
            {t.lostFound?.reportLost || 'Report Lost Pet'}
          </Button>
        )}
      </div>

      <div className="relative h-[500px] rounded-lg overflow-hidden border">
        <InteractiveMap
          center={mapCenter}
          zoom={12}
          markers={mapMarkers}
          onMarkerClick={handleMarkerClick}
          height="100%"
          clusterMarkers={true}
        />
      </div>

      {selectedAlert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border rounded-lg space-y-3 bg-background"
        >
          <div className="flex items-start justify-between">
            <div className="flex gap-3 flex-1">
              <img
                src={selectedAlert.petPhoto}
                alt={selectedAlert.petName}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{selectedAlert.petName}</h3>
                <p className="text-sm text-muted-foreground">{selectedAlert.breed}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedAlert.lastSeenTime).toLocaleDateString()}
                  </span>
                  {userLocation && (
                    <Badge variant="secondary" className="text-xs">
                      {formatDistance(calculateDistance(userLocation, selectedAlert.lastSeen))}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedAlert(null)}
            >
              <X size={20} />
            </Button>
          </div>

          <p className="text-sm text-foreground">{selectedAlert.description}</p>

          {onReportSighting && (
            <Button
              className="w-full"
              onClick={handleReportSighting}
            >
              <MapPin size={18} className="mr-2" />
              {t.lostFound?.reportSighting || 'Report Sighting'}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

