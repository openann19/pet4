/**
 * useBusinessConfig Hook
 *
 * Extracts business logic for managing business configuration
 * from UI components to improve testability and separation of concerns
 */

import { useState, useCallback, useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { getBusinessConfig, updateBusinessConfig } from '@/lib/purchase-service';
import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { adminApi } from '@/api/admin-api';
import type { BusinessConfig } from '@/lib/business-types';
import type { User } from '@/lib/user-service';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface UseBusinessConfigOptions {
  autoLoad?: boolean;
}

interface UseBusinessConfigReturn {
  config: BusinessConfig | null;
  loading: boolean;
  saving: boolean;
  broadcasting: boolean;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  saveAndBroadcastConfig: () => Promise<void>;
  updatePrice: (path: string[], value: number) => void;
  updateLimit: (path: string[], value: number) => void;
  updateExperiment: (key: string, value: { enabled: boolean; rollout: number; params: Record<string, unknown> }) => void;
  resetConfig: () => void;
}

export function useBusinessConfig(
  options: UseBusinessConfigOptions = {}
): UseBusinessConfigReturn {
  const { autoLoad = true } = options;
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUser] = useStorage<User | null>('current-user', null);

  const loadConfig = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const cfg = await getBusinessConfig();
      if (cfg) {
        setConfig(cfg);
      } else {
        // Create default config
        const defaultConfig: BusinessConfig = {
          id: 'default',
          version: '1',
          prices: {
            premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
            elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
            boost: { price: 2.99, currency: 'USD' },
            superLike: { price: 0.99, currency: 'USD' },
          },
          limits: {
            free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
            premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
            elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
          },
          experiments: {},
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.id ?? 'admin',
        };
        setConfig(defaultConfig);
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Load config _error', err, { action: 'loadConfig' });
      toast.error('Failed to load config');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (autoLoad) {
      void loadConfig();
    }
  }, [autoLoad, loadConfig]);

  const saveConfig = useCallback(async (): Promise<void> => {
    if (!config || !currentUser) {
      toast.error('Config or user not available');
      return;
    }

    setSaving(true);
    try {
      await updateBusinessConfig(config, currentUser.id || 'admin');
      toast.success('Business config updated successfully');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Save config _error', err, { action: 'saveConfig' });
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  }, [config, currentUser]);

  const saveAndBroadcastConfig = useCallback(async (): Promise<void> => {
    if (!config || !currentUser) {
      toast.error('Config or user not available');
      return;
    }

    setSaving(true);
    setBroadcasting(true);
    try {
      // First save the config
      await updateBusinessConfig(config, currentUser.id || 'admin');

      // Then broadcast it
      await configBroadcastService.broadcastConfig(
        'business',
        config satisfies Record<string, unknown>,
        currentUser.id || 'admin'
      );

      toast.success('Business config saved and broadcasted successfully');

      // Log audit entry
      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'business_config',
        targetId: config.id || 'default',
        details: JSON.stringify({ configType: 'business' }),
      });
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Save and broadcast config _error', err, { action: 'saveAndBroadcastConfig' });
      toast.error('Failed to save and broadcast config');
    } finally {
      setSaving(false);
      setBroadcasting(false);
    }
  }, [config, currentUser]);

  const updatePrice = useCallback(
    (path: string[], value: number): void => {
      if (!config) return;
      const newConfig = { ...config };
      let current: Record<string, unknown> = newConfig as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (key === undefined) return;
        const next = current[key];
        if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
          current = next as Record<string, unknown>;
        } else {
          return;
        }
      }
      const lastKey = path[path.length - 1];
      if (lastKey !== undefined) {
        current[lastKey] = value;
      }
      setConfig(newConfig as BusinessConfig);
    },
    [config]
  );

  const updateLimit = useCallback(
    (path: string[], value: number): void => {
      if (!config) return;
      const newConfig = { ...config };
      let current: Record<string, unknown> = newConfig as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (key === undefined) return;
        const next = current[key];
        if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
          current = next as Record<string, unknown>;
        } else {
          return;
        }
      }
      const lastKey = path[path.length - 1];
      if (lastKey !== undefined) {
        current[lastKey] = value;
      }
      setConfig(newConfig as BusinessConfig);
    },
    [config]
  );

  const updateExperiment = useCallback(
    (key: string, value: { enabled: boolean; rollout: number; params: Record<string, unknown> }): void => {
      if (!config) return;
      setConfig({
        ...config,
        experiments: {
          ...config.experiments,
          [key]: value,
        },
      });
    },
    [config]
  );

  const resetConfig = useCallback((): void => {
    if (!currentUser) return;
    const defaultConfig: BusinessConfig = {
      id: 'default',
      version: '1',
      prices: {
        premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
        elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
        boost: { price: 2.99, currency: 'USD' },
        superLike: { price: 0.99, currency: 'USD' },
      },
      limits: {
        free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
        premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
        elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
      },
      experiments: {},
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id || 'admin',
    };
    setConfig(defaultConfig);
  }, [currentUser]);

  return {
    config,
    loading,
    saving,
    broadcasting,
    loadConfig,
    saveConfig,
    saveAndBroadcastConfig,
    updatePrice,
    updateLimit,
    updateExperiment,
    resetConfig,
  };
}
