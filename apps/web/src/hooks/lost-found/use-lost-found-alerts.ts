import { useCallback, useState } from 'react';
import { lostFoundAPI } from '@/api/lost-found-api';
import { createLogger } from '@/lib/logger';
import type { LostAlert, LostAlertFilters } from '@/lib/lost-found-types';
import { toast } from 'sonner';

const logger = createLogger('useLostFoundAlerts');

interface UseLostFoundAlertsOptions {
  viewMode: 'browse' | 'mine';
  activeTab: 'all' | 'active' | 'found' | 'favorites';
  userLocation: { lat: number; lon: number } | null;
}

interface UseLostFoundAlertsReturn {
  alerts: LostAlert[];
  loading: boolean;
  cursor: string | undefined;
  loadAlerts: () => Promise<void>;
  setAlerts: React.Dispatch<React.SetStateAction<LostAlert[]>>;
  setCursor: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function useLostFoundAlerts({
  viewMode,
  activeTab,
  userLocation,
}: UseLostFoundAlertsOptions): UseLostFoundAlertsReturn {
  const [alerts, setAlerts] = useState<LostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const filters: LostAlertFilters & { cursor?: string; limit?: number } = {
        limit: 50,
        ...(cursor && { cursor }),
      };

      if (viewMode === 'mine') {
        const spark = window.spark;
        if (!spark) {
          toast.error('User service not available');
          setLoading(false);
          return;
        }
        const user = await spark.user();
        const userAlerts = await lostFoundAPI.getUserAlerts(user.id);
        setAlerts(userAlerts);
        setLoading(false);
        return;
      }

      // For browse mode, optionally filter by location
      if (userLocation && activeTab === 'all') {
        filters.location = {
          lat: userLocation.lat,
          lon: userLocation.lon,
          radiusKm: 50, // 50km radius
        };
      }

      if (activeTab === 'active') {
        filters.status = ['active'];
      } else if (activeTab === 'found') {
        filters.status = ['found'];
      }

      const result = await lostFoundAPI.queryAlerts(filters);
      setAlerts(result.alerts);
      setCursor(result.nextCursor);
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to load alerts', err, { action: 'loadAlerts' });
      toast.error('Failed to load lost & found alerts');
    } finally {
      setLoading(false);
    }
  }, [viewMode, cursor, userLocation, activeTab]);

  return {
    alerts,
    loading,
    cursor,
    loadAlerts,
    setAlerts,
    setCursor,
  };
}

