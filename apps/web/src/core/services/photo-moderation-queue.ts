/**
 * Photo Moderation Queue Service
 * 
 * Manages photo moderation queue with real storage integration.
 * Handles queue operations, priorities, and batch processing.
 */

import { createLogger } from '@/lib/logger'
import type {
  PhotoModerationStatus
} from '@/core/domain/photo-moderation'
import { isValidStatusTransition } from '@/core/domain/photo-moderation'
import { storage } from '@/lib/storage'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('PhotoModerationQueue')

const QUEUE_PREFIX = 'photo-moderation:queue:'
const BATCH_PREFIX = 'photo-moderation:batch:'

export interface QueueItem {
  photoId: string
  priority: number
  status: PhotoModerationStatus
  createdAt: string
  updatedAt: string
}

export interface QueueBatch {
  batchId: string
  photoIds: string[]
  assignedTo?: string
  createdAt: string
  completedAt?: string
}

export interface QueueStats {
  pending: number
  scanning: number
  heldForKYC: number
  quarantined: number
  total: number
}

export class PhotoModerationQueueService {
  /**
   * Add photo to moderation queue
   */
  async enqueue(
    photoId: string,
    priority: number = 0
  ): Promise<void> {
    try {
      const queueItem: QueueItem = {
        photoId,
        priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const queueKey = `${String(QUEUE_PREFIX ?? '')}${String(photoId ?? '')}`
      await storage.set(queueKey, queueItem)

      logger.info('Photo enqueued for moderation', {
        photoId,
        priority
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to enqueue photo', err, { photoId, priority })
      throw err
    }
  }

  /**
   * Get next batch of photos for moderation
   */
  async getNextBatch(
    limit: number = 10,
    statuses: PhotoModerationStatus[] = ['pending', 'scanning']
  ): Promise<QueueItem[]> {
    try {
      const allItems: QueueItem[] = []
      const allKeys = await storage.keys()
      const keys = allKeys.filter(key => key.startsWith(QUEUE_PREFIX))

      for (const key of keys) {
        const item = await storage.get<QueueItem>(key)
        if (item && statuses.includes(item.status)) {
          allItems.push(item)
        }
      }

      // Sort by priority (higher first), then by createdAt (older first)
      allItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      return allItems.slice(0, limit)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get next batch', err, { limit, statuses })
      throw err
    }
  }

  /**
   * Update queue item status
   */
  async updateStatus(
    photoId: string,
    status: PhotoModerationStatus
  ): Promise<void> {
    try {
      const queueKey = `${String(QUEUE_PREFIX ?? '')}${String(photoId ?? '')}`
      const item = await storage.get<QueueItem>(queueKey)

      if (!item) {
        throw new Error(`Queue item not found: ${String(photoId ?? '')}`)
      }

      if (!isValidStatusTransition(item.status, status)) {
        throw new Error(`Invalid status transition from ${String(item.status ?? '')} to ${String(status ?? '')}`)
      }

      item.status = status
      item.updatedAt = new Date().toISOString()

      await storage.set(queueKey, item)

      logger.info('Queue item status updated', {
        photoId,
        previousStatus: item.status,
        newStatus: status
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update queue status', err, { photoId, status })
      throw err
    }
  }

  /**
   * Remove photo from queue (approved or rejected)
   */
  async dequeue(photoId: string): Promise<void> {
    try {
      const queueKey = `${String(QUEUE_PREFIX ?? '')}${String(photoId ?? '')}`
      await storage.set(queueKey, undefined as unknown as QueueItem)

      logger.info('Photo dequeued', { photoId })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to dequeue photo', err, { photoId })
      throw err
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      const allKeys = await storage.keys()
      const queueKeys = allKeys.filter(key => key.startsWith(QUEUE_PREFIX))
      const stats: QueueStats = {
        pending: 0,
        scanning: 0,
        heldForKYC: 0,
        quarantined: 0,
        total: 0
      }

      for (const key of queueKeys) {
        const item = await storage.get<QueueItem>(key)
        if (isTruthy(item)) {
          stats.total++
          switch (item.status) {
            case 'pending':
              stats.pending++
              break
            case 'scanning':
              stats.scanning++
              break
            case 'held_for_kyc':
              stats.heldForKYC++
              break
            case 'quarantined':
              stats.quarantined++
              break
          }
        }
      }

      return stats
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get queue stats', err)
      throw err
    }
  }

  /**
   * Assign batch to moderator
   */
  async assignBatch(
    photoIds: string[],
    moderatorId: string
  ): Promise<string> {
    try {
      const batchId = `batch_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substr(2, 9) ?? '')}`
      const batch: QueueBatch = {
        batchId,
        photoIds,
        assignedTo: moderatorId,
        createdAt: new Date().toISOString()
      }

      const batchKey = `${String(BATCH_PREFIX ?? '')}${String(batchId ?? '')}`
      await storage.set(batchKey, batch)

      // Update queue items
      for (const photoId of photoIds) {
        await this.updateStatus(photoId, 'scanning')
      }

      logger.info('Batch assigned to moderator', {
        batchId,
        moderatorId,
        photoCount: photoIds.length
      })

      return batchId
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to assign batch', err, { moderatorId, photoCount: photoIds.length })
      throw err
    }
  }
}

export const photoModerationQueue = new PhotoModerationQueueService()
