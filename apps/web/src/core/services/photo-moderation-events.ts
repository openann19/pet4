/**
 * Photo Moderation Event Service
 * 
 * Emits events for every state change in photo moderation workflow.
 * Integrates with realtime events system.
 */

import { createLogger } from '@/lib/logger'
import { WebSocketManager } from '@/lib/websocket-manager'
import { config } from '@/lib/config'
import type {
  PhotoModerationStatus,
  PhotoModerationAction
} from '@/core/domain/photo-moderation'

const logger = createLogger('PhotoModerationEvents')

export interface PhotoModerationEvent {
  type: 'photo_moderation_state_changed'
  photoId: string
  userId: string
  action: PhotoModerationAction
  previousStatus: PhotoModerationStatus
  newStatus: PhotoModerationStatus
  timestamp: string
  metadata?: Record<string, unknown>
}

export class PhotoModerationEventService {
  private wsManager: WebSocketManager | null = null

  private getWSManager(): WebSocketManager {
    if (!this.wsManager) {
      this.wsManager = new WebSocketManager({
        url: config.current.WS_URL
      })
    }
    return this.wsManager
  }

  /**
   * Emit state change event
   */
  async emitStateChange(
    photoId: string,
    userId: string,
    action: PhotoModerationAction,
    previousStatus: PhotoModerationStatus,
    newStatus: PhotoModerationStatus,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const event: PhotoModerationEvent = {
        type: 'photo_moderation_state_changed',
        photoId,
        userId,
        action,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        ...(metadata !== undefined && { metadata })
      }

      const wsManager = this.getWSManager()

      // Emit to user's channel via notifications
      wsManager.send('/notifications', 'photo_moderation_state_changed', event)

      // If approved/rejected, also emit to admin channel
      if (newStatus === 'approved' || newStatus === 'rejected') {
        wsManager.send('/notifications', 'photo_moderation_state_changed', event)
      }

      logger.info('Photo moderation event emitted', {
        photoId,
        userId,
        action,
        previousStatus,
        newStatus
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to emit state change event', err, {
        photoId,
        userId,
        action
      })
      // Don't throw - events are non-critical
    }
  }

  /**
   * Emit batch processing event
   */
  async emitBatchProcessed(
    batchId: string,
    photoIds: string[],
    processedCount: number,
    failedCount: number
  ): Promise<void> {
    try {
      const event = {
        type: 'photo_moderation_batch_processed',
        batchId,
        photoIds,
        processedCount,
        failedCount,
        timestamp: new Date().toISOString()
      }

      const wsManager = this.getWSManager()
      wsManager.send('/notifications', 'photo_moderation_batch_processed', event)

      logger.info('Batch processed event emitted', {
        batchId,
        processedCount,
        failedCount
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to emit batch processed event', err, { batchId })
    }
  }

  /**
   * Emit queue stats update
   */
  async emitQueueStatsUpdate(stats: {
    pending: number
    scanning: number
    heldForKYC: number
    quarantined: number
    total: number
  }): Promise<void> {
    try {
      const event = {
        type: 'photo_moderation_queue_stats',
        stats,
        timestamp: new Date().toISOString()
      }

      const wsManager = this.getWSManager()
      wsManager.send('/notifications', 'photo_moderation_queue_stats', event)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to emit queue stats update', err)
    }
  }
}

export const photoModerationEvents = new PhotoModerationEventService()

