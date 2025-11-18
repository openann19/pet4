/**
 * Config Broadcast Service
 *
 * Handles real-time broadcasting of configuration updates to all connected clients.
 * Uses WebSocket/RealtimeClient to notify clients when configs change.
 */

import { adminApi } from '@/api/admin-api';
import { createLogger } from '@/lib/logger';
import type { RealtimeClient } from '@/lib/realtime';
import { adminSyncService } from './admin-sync-service';

const logger = createLogger('ConfigBroadcastService');

export type ConfigType = 'business' | 'matching' | 'map' | 'api' | 'system';

export interface ConfigBroadcastEvent {
  type: ConfigType;
  config: Record<string, unknown>;
  version: number;
  changedBy: string;
  timestamp: string;
}

export interface ConfigBroadcastListener {
  onConfigUpdate: (event: ConfigBroadcastEvent) => void;
}

class ConfigBroadcastService {
  private realtimeClient: RealtimeClient | null = null;
  private listeners = new Set<ConfigBroadcastListener>();
  private configVersions = new Map<ConfigType, number>();

  /**
   * Initialize the service with a realtime client
   */
  initialize(realtimeClient: RealtimeClient): void {
    this.realtimeClient = realtimeClient;

    // Listen for config update events
    this.realtimeClient.on('config:business:updated', (data) => {
      this.handleConfigUpdate('business', data as ConfigBroadcastEvent);
    });
    this.realtimeClient.on('config:matching:updated', (data) => {
      this.handleConfigUpdate('matching', data as ConfigBroadcastEvent);
    });
    this.realtimeClient.on('config:map:updated', (data) => {
      this.handleConfigUpdate('map', data as ConfigBroadcastEvent);
    });
    this.realtimeClient.on('config:api:updated', (data) => {
      this.handleConfigUpdate('api', data as ConfigBroadcastEvent);
    });
    this.realtimeClient.on('config:system:updated', (data) => {
      this.handleConfigUpdate('system', data as ConfigBroadcastEvent);
    });

    logger.info('Config broadcast service initialized');
  }

  /**
   * Broadcast a config update to all connected clients
   */
  async broadcastConfig(
    configType: ConfigType,
    config: Record<string, unknown>,
    changedBy: string
  ): Promise<{ success: boolean; version: number }> {
    try {
      // Get current version and increment
      const currentVersion = this.configVersions.get(configType) ?? 0;
      const newVersion = currentVersion + 1;
      this.configVersions.set(configType, newVersion);

      // Create broadcast event
      const event: ConfigBroadcastEvent = {
        type: configType,
        config,
        version: newVersion,
        changedBy,
        timestamp: new Date().toISOString(),
      };

      // Send via API (which will broadcast via WebSocket on server)
      const _result = await adminApi.broadcastConfig(configType, config);

      // Also trigger locally for immediate UI updates
      if (this.realtimeClient) {
        const eventName = `config:${configType}:updated`;
        await this.realtimeClient.emit(eventName, event);
        this.realtimeClient.trigger(eventName, event);
      }

      // Broadcast via admin sync service for cross-platform sync
      await adminSyncService.broadcastConfigUpdate(
        configType,
        changedBy,
        changedBy, // adminName - could be fetched from user service
        config
      );

      // Notify local listeners
      this.notifyListeners(event);

      logger.info('Config broadcasted', {
        configType,
        version: newVersion,
        changedBy,
      });

      return { success: true, version: newVersion };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config', err, { configType });
      throw err;
    }
  }

  /**
   * Subscribe to config update events
   */
  subscribe(listener: ConfigBroadcastListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle incoming config update event
   */
  private handleConfigUpdate(configType: ConfigType, event: ConfigBroadcastEvent): void {
    // Update version tracking
    this.configVersions.set(configType, event.version);

    // Notify listeners
    this.notifyListeners(event);

    logger.info('Config update received', {
      configType,
      version: event.version,
      changedBy: event.changedBy,
    });
  }

  /**
   * Notify all listeners of a config update
   */
  private notifyListeners(event: ConfigBroadcastEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener.onConfigUpdate(event);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error notifying config listener', err);
      }
    });
  }

  /**
   * Get current version for a config type
   */
  getConfigVersion(configType: ConfigType): number {
    return this.configVersions.get(configType) || 0;
  }

  /**
   * Reset version tracking (useful for testing or manual resets)
   */
  resetVersions(): void {
    this.configVersions.clear();
    logger.info('Config versions reset');
  }
}

export const configBroadcastService = new ConfigBroadcastService();
