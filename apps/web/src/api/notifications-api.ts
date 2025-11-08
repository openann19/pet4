/**
 * Notifications API Service
 *
 * Handles user location queries and geofencing through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';

const logger = createLogger('NotificationsApi');

export interface UpdateUserLocationRequest {
  userId: string;
  lat: number;
  lon: number;
}

export interface QueryNearbyUsersRequest {
  centerLat: number;
  centerLon: number;
  radiusKm: number;
}

export interface QueryNearbyUsersResponse {
  userIds: string[];
}

export interface TriggerGeofenceRequest {
  alertId: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

class NotificationsApiImpl {
  /**
   * POST /users/location
   * Update user location
   */
  async updateUserLocation(userId: string, lat: number, lon: number): Promise<void> {
    try {
      const request: UpdateUserLocationRequest = {
        userId,
        lat,
        lon,
      };

      await APIClient.post(ENDPOINTS.USERS.LOCATION, request);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update user location', err, { userId });
      throw err;
    }
  }

  /**
   * GET /users/location/nearby?lat=...&lon=...&radius=...
   * Query nearby users
   */
  async queryNearbyUsers(
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): Promise<string[]> {
    try {
      const url = `${ENDPOINTS.USERS.LOCATION_NEARBY}?lat=${centerLat}&lon=${centerLon}&radius=${radiusKm}`;
      const response = await APIClient.get<QueryNearbyUsersResponse>(url);
      return response.data.userIds;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to query nearby users', err, { centerLat, centerLon, radiusKm });
      throw err;
    }
  }

  /**
   * POST /notifications/geofence
   * Trigger geofenced notifications
   */
  async triggerGeofence(
    alertId: string,
    lat: number,
    lon: number,
    radiusKm: number
  ): Promise<void> {
    try {
      const request: TriggerGeofenceRequest = {
        alertId,
        lat,
        lon,
        radiusKm,
      };

      await APIClient.post(ENDPOINTS.NOTIFICATIONS.GEOFENCE, request);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to trigger geofence', err, { alertId });
      throw err;
    }
  }

  /**
   * GET /notifications/user-locations
   * Get all user locations (for geofencing)
   */
  async getUserLocations(): Promise<
    {
      userId: string;
      lat: number;
      lon: number;
      lastUpdated: string;
    }[]
  > {
    try {
      const response = await APIClient.get<{
        locations: {
          userId: string;
          lat: number;
          lon: number;
          lastUpdated: string;
        }[];
      }>(ENDPOINTS.NOTIFICATIONS.USER_LOCATIONS);
      return response.data.locations;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user locations', err);
      throw err;
    }
  }
}

export const notificationsApi = new NotificationsApiImpl();
