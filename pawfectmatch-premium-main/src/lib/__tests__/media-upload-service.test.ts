/**
 * Media Upload Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MediaUploadService } from '../media-upload-service'
import { api } from '../api'

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

vi.mock('../config', () => ({
  config: {
    current: {
      MEDIA_UPLOAD_PROVIDER: 's3'
    }
  }
}))

describe('MediaUploadService', () => {
  let service: MediaUploadService

  beforeEach(() => {
    service = new MediaUploadService()
    vi.clearAllMocks()
  })

  describe('requestUploadIntent', () => {
    it('should request upload intent from backend', async () => {
      const mockIntent = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'value' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/media-123'
      }

      vi.mocked(api.post).mockResolvedValue(mockIntent)

      const result = await service.requestUploadIntent('image', {
        originalName: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024
      })

      expect(result).toEqual(mockIntent)
      expect(api.post).toHaveBeenCalledWith('/media/upload/intent', expect.objectContaining({
        mediaType: 'image',
        metadata: expect.objectContaining({
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024
        })
      }))
    })

    it('should throw error on backend failure', async () => {
      vi.mocked(api.post).mockRejectedValue({
        code: 'UPLOAD_ERROR',
        message: 'Upload failed',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString()
      })

      await expect(
        service.requestUploadIntent('image', {
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024
        })
      ).rejects.toThrow()
    })
  })

  describe('validateFile', () => {
    it('should validate image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = service.validateFile(file, 'image')
      
      expect(result.valid).toBe(true)
    })

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = service.validateFile(file, 'image')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject file that is too large', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const result = service.validateFile(largeFile, 'image')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })
  })

  describe('getImageDimensions', () => {
    it('should get image dimensions', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' })
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
      
      const dimensions = await service.getImageDimensions(file)
      
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
    })
  })
})

