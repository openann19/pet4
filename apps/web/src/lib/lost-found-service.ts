import type { LostAlert, Sighting, LostAlertFilters, LostAlertStatus } from './lost-found-types';
import { lostFoundAPI } from '@/api/lost-found-api';
import { createLogger } from './logger';

const logger = createLogger('LostFoundService');

interface CreateLostAlertData {
  petSummary: LostAlert['petSummary'];
  lastSeen: LostAlert['lastSeen'];
  reward?: number;
  rewardCurrency?: string;
  contactMask: string;
  photos: string[];
}

class LostFoundService {
  async createAlert(
    userId: string,
    data: CreateLostAlertData,
    ownerName: string
  ): Promise<LostAlert> {
    try {
      return await lostFoundAPI.createAlert({
        ...data,
        ownerId: userId,
        ownerName,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create alert', err, { userId });
      throw err;
    }
  }

  async getAlertById(id: string): Promise<LostAlert | undefined> {
    try {
      return (await lostFoundAPI.getAlertById(id)) ?? undefined;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get alert by ID', err, { id });
      throw err;
    }
  }

  async getActiveAlerts(filters?: LostAlertFilters): Promise<LostAlert[]> {
    try {
      const response = await lostFoundAPI.queryAlerts(filters);
      return response.alerts;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active alerts', err, { filters });
      throw err;
    }
  }

  async getUserAlerts(userId: string): Promise<LostAlert[]> {
    try {
      return await lostFoundAPI.getUserAlerts(userId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user alerts', err, { userId });
      throw err;
    }
  }

  async updateAlertStatus(alertId: string, status: LostAlertStatus): Promise<void> {
    try {
      // Need userId - this should be passed in
      // For now, get alert first to verify ownership
      const alert = await this.getAlertById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }
      await lostFoundAPI.updateAlertStatus(alertId, status, alert.ownerId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update alert status', err, { alertId, status });
      throw err;
    }
  }

  async incrementViewCount(alertId: string): Promise<void> {
    try {
      // View count increment is handled automatically by the API when getting alert
      // This method is kept for backward compatibility but does nothing
      await lostFoundAPI.getAlertById(alertId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to increment view count', { error: err, alertId });
      // Don't throw - view count increment is non-critical
    }
  }

  async createSighting(data: Omit<Sighting, 'id' | 'createdAt' | 'verified'>): Promise<Sighting> {
    try {
      return await lostFoundAPI.createSighting({
        ...data,
        reporterId: data.reporterId ?? '',
        reporterName: data.reporterName ?? '',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create sighting', err, { alertId: data.alertId });
      throw err;
    }
  }

  async getAlertSightings(alertId: string): Promise<Sighting[]> {
    try {
      return await lostFoundAPI.querySightings(alertId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get alert sightings', err, { alertId });
      throw err;
    }
  }

  async verifySighting(sightingId: string, verified: boolean): Promise<void> {
    try {
      const { userService } = await import('./user-service');
      const user = await userService.user();
      if (!user) {
        throw new Error('User not authenticated');
      }
      await lostFoundAPI.verifySighting(sightingId, verified, user.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to verify sighting', err, { sightingId, verified });
      throw err;
    }
  }

  async getNearbyAlerts(lat: number, lon: number, radiusKm: number): Promise<LostAlert[]> {
    try {
      const response = await lostFoundAPI.queryAlerts({
        location: {
          lat,
          lon,
          radiusKm,
        },
      });
      return response.alerts;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get nearby alerts', err, { lat, lon, radiusKm });
      throw err;
    }
  }
}

export const lostFoundService = new LostFoundService();
