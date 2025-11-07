/**
 * Photo Scanning Service
 * 
 * Scans photos using AI/ML models and content moderation.
 * Integrates with existing content moderation service.
 */

import { createLogger } from '@/lib/logger'
import {
  moderateMediaContent,
  generateContentFingerprint
} from '@/core/services/content-moderation'
import type {
  PhotoScanResult,
  PhotoModerationMetadata
} from '@/core/domain/photo-moderation'
import { shouldQuarantine, canAutoApprove } from '@/core/domain/photo-moderation'

const logger = createLogger('PhotoScanning')

export interface PhotoScanOptions {
  photoUrl: string
  metadata: PhotoModerationMetadata
  skipCache?: boolean
}

export class PhotoScanningService {
  /**
   * Scan photo using content moderation
   */
  async scanPhoto(options: PhotoScanOptions): Promise<PhotoScanResult> {
    try {
      logger.info('Starting photo scan', {
        photoId: options.metadata.photoId,
        photoUrl: options.photoUrl
      })

      // Perform content moderation scan
      const moderationResult = await moderateMediaContent(options.photoUrl, 'image')

      // Generate content fingerprint
      const fingerprint = await generateContentFingerprint(
        options.photoUrl,
        [options.photoUrl]
      )

      // Build scan result
      const scanResult: PhotoScanResult = {
        nsfwScore: moderationResult.nsfwScore,
        toxicityScore: 0, // Media moderation doesn't provide toxicity
        contentFingerprint: fingerprint,
        detectedIssues: moderationResult.blockedReasons,
        requiresManualReview: moderationResult.requiresReview,
        scannedAt: new Date().toISOString()
      }

      logger.info('Photo scan completed', {
        photoId: options.metadata.photoId,
        nsfwScore: scanResult.nsfwScore,
        requiresReview: scanResult.requiresManualReview
      })

      return scanResult
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Photo scan failed', err, {
        photoId: options.metadata.photoId,
        photoUrl: options.photoUrl
      })

      // Return safe fallback result
      return {
        nsfwScore: 0,
        toxicityScore: 0,
        contentFingerprint: '',
        detectedIssues: ['Scan failed'],
        requiresManualReview: true,
        scannedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Batch scan multiple photos
   */
  async batchScan(
    photos: PhotoScanOptions[]
  ): Promise<Map<string, PhotoScanResult>> {
    const results = new Map<string, PhotoScanResult>()

    for (const photo of photos) {
      try {
        const result = await this.scanPhoto(photo)
        results.set(photo.metadata.photoId, result)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Batch scan item failed', err, {
          photoId: photo.metadata.photoId
        })

        // Add error result
        results.set(photo.metadata.photoId, {
          nsfwScore: 1,
          toxicityScore: 0,
          contentFingerprint: '',
          detectedIssues: ['Scan failed'],
          requiresManualReview: true,
          scannedAt: new Date().toISOString()
        })
      }
    }

    return results
  }

  /**
   * Determine if photo should be auto-approved based on scan
   */
  shouldAutoApprove(scanResult: PhotoScanResult): boolean {
    return canAutoApprove(scanResult)
  }

  /**
   * Determine if photo should be quarantined based on scan
   */
  shouldQuarantine(scanResult: PhotoScanResult): boolean {
    return shouldQuarantine(scanResult)
  }
}

export const photoScanningService = new PhotoScanningService()

