import type { LostAlertStatus } from '@/core/domain/lost-found'
import { canReceiveSightings, isValidLostAlertStatusTransition } from '@/core/domain/lost-found'
import { APIClient } from '@/lib/api-client'
import { ENDPOINTS } from '@/lib/endpoints'
import { createLogger } from '@/lib/logger'
import type {
    CreateLostAlertData,
    CreateSightingData,
    LostAlert,
    LostAlertFilters,
    Sighting,
} from '@/lib/lost-found-types'
import { notificationsService } from '@/lib/notifications-service'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('LostFoundAPI')

export interface CreateAlertRequest extends CreateLostAlertData {
  ownerId: string
  ownerName: string
  ownerAvatar?: string
}

export interface CreateAlertResponse {
  alert: LostAlert
}

export interface QueryAlertsResponse {
  alerts: LostAlert[]
  nextCursor?: string
  total: number
}

export interface UpdateStatusRequest {
  status: LostAlertStatus
}

export interface UpdateStatusResponse {
  alert: LostAlert
}

export interface CreateSightingRequest extends CreateSightingData {
  reporterId: string
  reporterName: string
  reporterAvatar?: string
}

export interface CreateSightingResponse {
  sighting: Sighting
}

export interface QuerySightingsResponse {
  sightings: Sighting[]
}

/**
 * Lost & Found Alerts API Service
 * Implements REST API endpoints as specified:
 * POST   /alerts/lost
 * GET    /alerts/lost?near=lat,lon&radius=km
 * PATCH  /alerts/lost/:id/status
 * POST   /alerts/sightings                 // nearby users report sightings
 */
export class LostFoundAPI {

  /**
   * POST /alerts/lost
   * Create a lost alert
   */
  async createAlert(
    data: CreateLostAlertData & { ownerId: string; ownerName: string; ownerAvatar?: string }
  ): Promise<LostAlert> {
    try {
      const request: CreateAlertRequest = {
        ...data,
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        ...(data.ownerAvatar ? { ownerAvatar: data.ownerAvatar } : {})
      }

      const response = await APIClient.post<CreateAlertResponse>(
        ENDPOINTS.LOST_FOUND.CREATE_ALERT,
        request
      )

      const alert = response.data.alert

      // Trigger geofenced push notifications to nearby users
      try {
        const radiusKm = alert.lastSeen.radiusM / 1000 || 10 // Convert meters to km, default 10km
        await notificationsService.triggerGeofencedNotifications(alert, radiusKm)
        logger.info('Geofenced notifications triggered', {
          alertId: alert.id,
          radiusKm
        })
      } catch (error) {
        logger.error('Failed to trigger geofenced notifications', error instanceof Error ? error : new Error(String(error)), {
          alertId: alert.id
        })
        // Don't fail alert creation if notification fails
      }

      return alert
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create alert', err, { ownerId: data.ownerId })
      throw err
    }
  }

  /**
   * GET /alerts/lost?near=lat,lon&radius=km
   * Query lost alerts with location filters
   */
  async queryAlerts(
    filters?: LostAlertFilters & { cursor?: string; limit?: number }
  ): Promise<{ alerts: LostAlert[]; nextCursor?: string; total: number }> {
    try {
      const queryParams: Record<string, unknown> = {}
      
      if (filters?.status && filters.status.length > 0) {
        queryParams['status'] = filters.status
      }
      
      if (filters?.species && filters.species.length > 0) {
        queryParams['species'] = filters.species
      }

      if (isTruthy(filters?.location)) {
        queryParams['near'] = `${String(filters.location.lat ?? '')},${String(filters.location.lon ?? '')}`
        queryParams['radius'] = filters.location.radiusKm
      }

      if (filters?.minReward !== undefined) {
        queryParams['minReward'] = filters.minReward
      }

      if (isTruthy(filters?.dateFrom)) {
        queryParams['dateFrom'] = filters.dateFrom
      }

      if (isTruthy(filters?.dateTo)) {
        queryParams['dateTo'] = filters.dateTo
      }

      if (isTruthy(filters?.cursor)) {
        queryParams['cursor'] = filters.cursor
      }

      if (isTruthy(filters?.limit)) {
        queryParams['limit'] = filters.limit
      }

      const url = ENDPOINTS.LOST_FOUND.QUERY_ALERTS + (Object.keys(queryParams).length > 0 
        ? '?' + new URLSearchParams(
            Object.entries(queryParams).map(([k, v]) => [k, String(v)])
          ).toString()
        : '')

      const response = await APIClient.get<QueryAlertsResponse>(url)
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to query alerts', err, { filters })
      throw err
    }
  }

  /**
   * GET /alerts/lost/:id
   */
  async getAlertById(id: string): Promise<LostAlert | null> {
    try {
      const response = await APIClient.get<{ alert: LostAlert }>(
        ENDPOINTS.LOST_FOUND.GET_ALERT(id)
      )
      
      const alert = response.data.alert
      
      // Increment view count (fire and forget)
      try {
        await APIClient.post(ENDPOINTS.LOST_FOUND.INCREMENT_VIEW(id))
      } catch (error) {
        logger.warn('Failed to increment view count', { 
          alertId: id, 
          error: error instanceof Error ? error : new Error(String(error)) 
        })
      }
      
      return alert
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      // If 404, return null instead of throwing
      if (err.message.includes('404') || err.message.includes('not found')) {
        return null
      }
      logger.error('Failed to get alert by ID', err, { id })
      throw err
    }
  }

  /**
   * PATCH /alerts/lost/:id/status
   * Update alert status (found/archived)
   */
  async updateAlertStatus(
    id: string,
    status: LostAlertStatus,
    userId: string
  ): Promise<LostAlert> {
    try {
      // First get the alert to validate transition
      const currentAlert = await this.getAlertById(id)
      if (!currentAlert) {
        throw new Error('Alert not found')
      }

      // Only owner can update status
      if (currentAlert.ownerId !== userId) {
        throw new Error('Unauthorized: Only alert owner can update status')
      }

      // Validate status transition using domain logic
      if (!isValidLostAlertStatusTransition(currentAlert.status, status)) {
        throw new Error(`Invalid status transition from ${String(currentAlert.status ?? '')} to ${String(status ?? '')}`)
      }

      const request: UpdateStatusRequest = { status }

      const response = await APIClient.patch<UpdateStatusResponse>(
        ENDPOINTS.LOST_FOUND.UPDATE_STATUS(id),
        request
      )

      return response.data.alert
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update alert status', err, { id, status, userId })
      throw err
    }
  }

  /**
   * POST /alerts/sightings
   * Report a sighting
   */
  async createSighting(
    data: CreateSightingData & { reporterId: string; reporterName: string; reporterAvatar?: string }
  ): Promise<Sighting> {
    try {
      // Verify alert exists and can receive sightings
      const alert = await this.getAlertById(data.alertId)
      if (!alert) {
        throw new Error('Alert not found')
      }
      if (!canReceiveSightings(alert.status)) {
        throw new Error('Cannot report sighting for inactive alert')
      }

      const request: CreateSightingRequest = {
        ...data,
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        ...(data.reporterAvatar ? { reporterAvatar: data.reporterAvatar } : {})
      }

      const response = await APIClient.post<CreateSightingResponse>(
        ENDPOINTS.LOST_FOUND.CREATE_SIGHTING,
        request
      )

      const sighting = response.data.sighting

      // Send notification to alert owner
      try {
        await notificationsService.notifyNewSighting(sighting, alert)
        logger.info('Sighting notification sent', {
          sightingId: sighting.id,
          alertId: alert.id,
          ownerId: alert.ownerId
        })
      } catch (error) {
        logger.error('Failed to send sighting notification', error instanceof Error ? error : new Error(String(error)))
        // Don't fail the sighting creation if notification fails
      }

      return sighting
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create sighting', err, { alertId: data.alertId })
      throw err
    }
  }

  /**
   * GET /alerts/sightings?alertId=:id
   */
  async querySightings(alertId: string): Promise<Sighting[]> {
    try {
      const url = `${String(ENDPOINTS.LOST_FOUND.GET_SIGHTINGS ?? '')}?alertId=${String(alertId ?? '')}`
      const response = await APIClient.get<QuerySightingsResponse>(url)
      return response.data.sightings
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to query sightings', err, { alertId })
      throw err
    }
  }

  /**
   * GET /alerts/lost?mine=1
   */
  async getUserAlerts(userId: string): Promise<LostAlert[]> {
    try {
      const url = `${String(ENDPOINTS.LOST_FOUND.QUERY_ALERTS ?? '')}?mine=1&ownerId=${String(userId ?? '')}`
      const response = await APIClient.get<QueryAlertsResponse>(url)
      return response.data.alerts
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get user alerts', err, { userId })
      throw err
    }
  }

  /**
   * POST /alerts/sightings/:id/verify
   * Verify or reject a sighting
   */
  async verifySighting(
    sightingId: string,
    verified: boolean,
    userId: string
  ): Promise<Sighting> {
    try {
      const response = await APIClient.post<CreateSightingResponse>(
        `/alerts/sightings/${String(sightingId ?? '')}/verify`,
        { verified, userId }
      )
      return response.data.sighting
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to verify sighting', err, { sightingId, verified })
      throw err
    }
  }
}

export const lostFoundAPI = new LostFoundAPI()

