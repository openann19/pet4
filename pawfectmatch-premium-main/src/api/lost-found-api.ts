import type {
  LostAlert,
  Sighting,
  LostAlertFilters,
  CreateLostAlertData,
  CreateSightingData,
} from '@/lib/lost-found-types'
import type { LostAlertStatus } from '@/core/domain/lost-found'
import { isValidLostAlertStatusTransition, canReceiveSightings } from '@/core/domain/lost-found'                                                  
import { generateULID } from '@/lib/utils'
import { notificationsService } from '@/lib/notifications-service'
import { createLogger } from '@/lib/logger'

const logger = createLogger('LostFoundAPI')

/**
 * Lost & Found Alerts API Service
 * Implements REST API endpoints as specified:
 * POST   /alerts/lost
 * GET    /alerts/lost?near=lat,lon&radius=km
 * PATCH  /alerts/lost/:id/status
 * POST   /alerts/sightings                 // nearby users report sightings
 */
export class LostFoundAPI {
  private async getAlerts(): Promise<LostAlert[]> {
    return await spark.kv.get<LostAlert[]>('lost-found-alerts') || []
  }

  private async setAlerts(alerts: LostAlert[]): Promise<void> {
    await spark.kv.set('lost-found-alerts', alerts)
  }

  private async getSightings(): Promise<Sighting[]> {
    return await spark.kv.get<Sighting[]>('lost-found-sightings') || []
  }

  private async setSightings(sightings: Sighting[]): Promise<void> {
    await spark.kv.set('lost-found-sightings', sightings)
  }

  /**
   * POST /alerts/lost
   * Create a lost alert
   */
  async createAlert(
    data: CreateLostAlertData & { ownerId: string; ownerName: string; ownerAvatar?: string }
  ): Promise<LostAlert> {
    const alerts = await this.getAlerts()
    
    const alert: LostAlert = {
      id: generateULID(),
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      ownerAvatar: data.ownerAvatar,
      petSummary: data.petSummary,
      lastSeen: data.lastSeen,
      reward: data.reward,
      contactMask: data.contactMask,
      photos: data.photos, // Should be stripped of EXIF before storage
      status: 'active',
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: 0,
      sightingsCount: 0
    }

    alerts.push(alert)
    await this.setAlerts(alerts)

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
  }

  /**
   * GET /alerts/lost?near=lat,lon&radius=km
   * Query lost alerts with location filters
   */
  async queryAlerts(
    filters?: LostAlertFilters & { cursor?: string; limit?: number }
  ): Promise<{ alerts: LostAlert[]; nextCursor?: string; total: number }> {
    let alerts = await this.getAlerts()
    
    // Filter by status - only show active by default
    if (!filters?.status || filters.status.length === 0) {
      alerts = alerts.filter(a => a.status === 'active')
    } else {
      alerts = alerts.filter(a => filters.status!.includes(a.status))
    }

    if (filters) {
      if (filters.species && filters.species.length > 0) {
        alerts = alerts.filter(a => filters.species!.includes(a.petSummary.species))
      }

      if (filters.location) {
        alerts = alerts.filter(a => {
          if (!a.lastSeen.lat || !a.lastSeen.lon) return false
          const distance = this.calculateDistance(
            filters.location!.lat,
            filters.location!.lon,
            a.lastSeen.lat,
            a.lastSeen.lon
          )
          return distance <= filters.location!.radiusKm
        })
      }

      if (filters.minReward !== undefined) {
        alerts = alerts.filter(a => a.reward && a.reward >= filters.minReward!)
      }

      if (filters.dateFrom) {
        alerts = alerts.filter(a => new Date(a.createdAt) >= new Date(filters.dateFrom!))
      }

      if (filters.dateTo) {
        alerts = alerts.filter(a => new Date(a.createdAt) <= new Date(filters.dateTo!))
      }
    }

    // Sort by most recent first
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = alerts.length
    const limit = filters?.limit || 20
    const startIndex = filters?.cursor ? parseInt(filters.cursor, 10) : 0
    const endIndex = startIndex + limit
    const paginated = alerts.slice(startIndex, endIndex)
    const nextCursor = endIndex < total ? endIndex.toString() : undefined

    return {
      alerts: paginated,
      nextCursor,
      total
    }
  }

  /**
   * GET /alerts/lost/:id
   */
  async getAlertById(id: string): Promise<LostAlert | null> {
    const alerts = await this.getAlerts()
    const alert = alerts.find(a => a.id === id)
    
    if (alert) {
      // Increment view count
      await this.incrementViewCount(id)
    }
    
    return alert || null
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
    const alerts = await this.getAlerts()
    const alert = alerts.find(a => a.id === id)
    
    if (!alert) {
      throw new Error('Alert not found')
    }

    // Only owner can update status
    if (alert.ownerId !== userId) {
      throw new Error('Unauthorized: Only alert owner can update status')
    }

    // Validate status transition using domain logic
    if (!isValidLostAlertStatusTransition(alert.status, status)) {
      throw new Error(`Invalid status transition from ${alert.status} to ${status}`)
    }

    alert.status = status
    alert.updatedAt = new Date().toISOString()

    if (status === 'found') {
      alert.foundAt = new Date().toISOString()
    } else if (status === 'archived') {
      alert.archivedAt = new Date().toISOString()
    }

    await this.setAlerts(alerts)
    
    return alert
  }

  /**
   * POST /alerts/sightings
   * Report a sighting
   */
  async createSighting(
    data: CreateSightingData & { reporterId: string; reporterName: string; reporterAvatar?: string }
  ): Promise<Sighting> {
    const sightings = await this.getSightings()
    const alerts = await this.getAlerts()
    
    // Verify alert exists and can receive sightings
    const alert = alerts.find(a => a.id === data.alertId)
    if (!alert) {
      throw new Error('Alert not found')
    }
    if (!canReceiveSightings(alert.status)) {
      throw new Error('Cannot report sighting for inactive alert')
    }
    
    const sighting: Sighting = {
      ...data,
      id: generateULID(),
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      reporterAvatar: data.reporterAvatar,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    sightings.push(sighting)
    await this.setSightings(sightings)

    // Increment alert sightings count
    const alertToUpdate = alerts.find(a => a.id === data.alertId)
    if (alertToUpdate) {
      alertToUpdate.sightingsCount = (alertToUpdate.sightingsCount ?? 0) + 1
      await this.setAlerts(alerts)
      
      // Send notification to alert owner
      try {
        await notificationsService.notifyNewSighting(sighting, alertToUpdate)
        logger.info('Sighting notification sent', {
          sightingId: sighting.id,
          alertId: alertToUpdate.id,
          ownerId: alertToUpdate.ownerId
        })
      } catch (error) {
        logger.error('Failed to send sighting notification', error instanceof Error ? error : new Error(String(error)))
        // Don't fail the sighting creation if notification fails
      }
    }

    return sighting
  }

  /**
   * GET /alerts/sightings?alertId=:id
   */
  async querySightings(alertId: string): Promise<Sighting[]> {
    const sightings = await this.getSightings()
    return sightings
      .filter(s => s.alertId === alertId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * GET /alerts/lost?mine=1
   */
  async getUserAlerts(userId: string): Promise<LostAlert[]> {
    const alerts = await this.getAlerts()
    return alerts
      .filter(a => a.ownerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Helper methods

  private async incrementViewCount(alertId: string): Promise<void> {
    const alerts = await this.getAlerts()
    const alert = alerts.find(a => a.id === alertId)
    
    if (alert) {
      alert.viewsCount = (alert.viewsCount ?? 0) + 1
      await this.setAlerts(alerts)
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const lostFoundAPI = new LostFoundAPI()

