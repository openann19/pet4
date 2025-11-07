/**
 * Photo Moderation Storage Service
 * 
 * Handles storage and retrieval of photo moderation records.
 * Integrates with real storage backend.
 */

import { createLogger } from '@/lib/logger'
import type {
  PhotoModerationRecord,
  PhotoModerationMetadata,
  PhotoScanResult,
  PhotoModerationStatus
} from '@/core/domain/photo-moderation'
import { storage } from '@/lib/storage'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('PhotoModerationStorage')

const RECORD_PREFIX = 'photo-moderation:record:'
const INDEX_PREFIX = 'photo-moderation:index:'

export interface PhotoModerationStorageOptions {
  photoId: string
  metadata: PhotoModerationMetadata
  kycRequired: boolean
}

export class PhotoModerationStorageService {
  /**
   * Create moderation record
   */
  async createRecord(
    options: PhotoModerationStorageOptions
  ): Promise<PhotoModerationRecord> {
    try {
      const now = new Date().toISOString()

      const record: PhotoModerationRecord = {
        photoId: options.photoId,
        status: 'pending',
        metadata: options.metadata,
        kycRequired: options.kycRequired,
        createdAt: now,
        updatedAt: now
      }

      const recordKey = `${String(RECORD_PREFIX ?? '')}${String(options.photoId ?? '')}`
      await storage.set(recordKey, record)

      // Index by user
      await this.indexByUser(options.metadata.uploadedBy, options.photoId)

      // Index by status
      await this.indexByStatus('pending', options.photoId)

      logger.info('Photo moderation record created', {
        photoId: options.photoId,
        userId: options.metadata.uploadedBy
      })

      return record
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create moderation record', err, {
        photoId: options.photoId
      })
      throw err
    }
  }

  /**
   * Get moderation record
   */
  async getRecord(photoId: string): Promise<PhotoModerationRecord | null> {
    try {
      const recordKey = `${String(RECORD_PREFIX ?? '')}${String(photoId ?? '')}`
      const record = await storage.get<PhotoModerationRecord>(recordKey)
      return record || null
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get moderation record', err, { photoId })
      throw err
    }
  }

  /**
   * Update moderation record
   */
  async updateRecord(
    photoId: string,
    updates: {
      status?: PhotoModerationStatus
      scanResult?: PhotoScanResult
      moderatedBy?: string
      rejectionReason?: string
    }
  ): Promise<PhotoModerationRecord> {
    try {
      const record = await this.getRecord(photoId)
      if (!record) {
        throw new Error(`Record not found: ${String(photoId ?? '')}`)
      }

      const previousStatus = record.status

      // Update fields
      if (updates.status !== undefined) {
        record.status = updates.status
      }
      if (updates.scanResult !== undefined) {
        record.scanResult = updates.scanResult
      }
      if (updates.moderatedBy !== undefined) {
        record.moderatedBy = updates.moderatedBy
      }
      if (updates.rejectionReason !== undefined) {
        record.rejectionReason = updates.rejectionReason
      }

      if (updates.status !== undefined || updates.moderatedBy !== undefined) {
        record.moderatedAt = new Date().toISOString()
      }

      record.updatedAt = new Date().toISOString()

      const recordKey = `${String(RECORD_PREFIX ?? '')}${String(photoId ?? '')}`
      await storage.set(recordKey, record)

      // Update indexes
      if (updates.status !== undefined && updates.status !== previousStatus) {
        await this.removeFromStatusIndex(previousStatus, photoId)
        await this.indexByStatus(updates.status, photoId)
      }

      logger.info('Photo moderation record updated', {
        photoId,
        previousStatus,
        newStatus: record.status
      })

      return record
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update moderation record', err, { photoId })
      throw err
    }
  }

  /**
   * Get records by user
   */
  async getRecordsByUser(userId: string): Promise<PhotoModerationRecord[]> {
    try {
      const indexKey = `${String(INDEX_PREFIX ?? '')}user:${String(userId ?? '')}`
      const photoIds = await storage.get<string[]>(indexKey) ?? []

      const records: PhotoModerationRecord[] = []
      for (const photoId of photoIds) {
        const record = await this.getRecord(photoId)
        if (isTruthy(record)) {
          records.push(record)
        }
      }

      return records
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get records by user', err, { userId })
      throw err
    }
  }

  /**
   * Get records by status
   */
  async getRecordsByStatus(
    status: PhotoModerationStatus,
    limit: number = 100
  ): Promise<PhotoModerationRecord[]> {
    try {
      const indexKey = `${String(INDEX_PREFIX ?? '')}status:${String(status ?? '')}`
      const photoIds = await storage.get<string[]>(indexKey) ?? []

      const records: PhotoModerationRecord[] = []
      for (const photoId of photoIds.slice(0, limit)) {
        const record = await this.getRecord(photoId)
        if (isTruthy(record)) {
          records.push(record)
        }
      }

      return records
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get records by status', err, { status })
      throw err
    }
  }

  /**
   * Check if photo is approved
   */
  async isApproved(photoId: string): Promise<boolean> {
    try {
      const record = await this.getRecord(photoId)
      return record?.status === 'approved' || false
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to check approval status', err, { photoId })
      return false
    }
  }

  /**
   * Index by user
   */
  private async indexByUser(userId: string, photoId: string): Promise<void> {
    try {
      const indexKey = `${String(INDEX_PREFIX ?? '')}user:${String(userId ?? '')}`
      const photoIds = await storage.get<string[]>(indexKey) ?? []

      if (!photoIds.includes(photoId)) {
        photoIds.push(photoId)
        await storage.set(indexKey, photoIds)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to index by user', err, { userId, photoId })
      throw err
    }
  }

  /**
   * Index by status
   */
  private async indexByStatus(status: PhotoModerationStatus, photoId: string): Promise<void> {
    try {
      const indexKey = `${String(INDEX_PREFIX ?? '')}status:${String(status ?? '')}`
      const photoIds = await storage.get<string[]>(indexKey) ?? []

      if (!photoIds.includes(photoId)) {
        photoIds.push(photoId)
        await storage.set(indexKey, photoIds)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to index by status', err, { status, photoId })
      throw err
    }
  }

  /**
   * Remove from status index
   */
  private async removeFromStatusIndex(
    status: PhotoModerationStatus,
    photoId: string
  ): Promise<void> {
    try {
      const indexKey = `${String(INDEX_PREFIX ?? '')}status:${String(status ?? '')}`
      const photoIds = await storage.get<string[]>(indexKey) ?? []

      const filtered = photoIds.filter(id => id !== photoId)
      await storage.set(indexKey, filtered)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to remove from status index', err, { status, photoId })
      throw err
    }
  }
}

export const photoModerationStorage = new PhotoModerationStorageService()

