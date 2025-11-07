/**
 * Image Upload API Service
 * 
 * Handles image uploads with signed URLs and storage.
 */

import { APIClient } from '@/lib/api-client'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('ImageUploadAPI')

export interface GetSignedUrlRequest {
  key: string
  contentType: string
  expiresIn?: number
}

export interface GetSignedUrlResponse {
  signedUrl: string
  key: string
  expiresAt: string
}

export interface UploadImageRequest {
  key: string
  contentType: string
  arrayBuffer: ArrayBuffer
}

export interface UploadImageResponse {
  url: string
  key: string
  size: number
}

class ImageUploadApiImpl {
  /**
   * GET /uploads/images/signed-url
   * Get signed URL for image upload
   */
  async getSignedUrl(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<{ signedUrl: string; key: string; expiresAt: string }> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('key', key)
      queryParams.append('contentType', contentType)
      if (isTruthy(expiresIn)) queryParams.append('expiresIn', String(expiresIn))

      const response = await APIClient.get<GetSignedUrlResponse>(
        `/uploads/images/signed-url?${String(queryParams.toString() ?? '')}`
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get signed URL', err, { key, contentType })
      throw err
    }
  }

  /**
   * POST /uploads/images
   * Upload image directly
   */
  async uploadImage(
    key: string,
    contentType: string,
    arrayBuffer: ArrayBuffer
  ): Promise<{ url: string; key: string; size: number }> {
    try {
      // Convert ArrayBuffer to base64 for JSON transmission
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      const request: UploadImageRequest = {
        key,
        contentType,
        arrayBuffer: arrayBuffer // Backend should handle ArrayBuffer or base64
      }

      const response = await APIClient.post<UploadImageResponse>(
        '/uploads/images',
        { ...request, data: base64 } // Send as base64 string
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to upload image', err, { key, contentType })
      throw err
    }
  }
}

export const imageUploadApi = new ImageUploadApiImpl()

