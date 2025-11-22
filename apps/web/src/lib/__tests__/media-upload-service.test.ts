/**
 * Media Upload Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaUploadService, mediaUploadService } from '../media-upload-service';
import { api } from '../api';

// Mock dependencies
vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  config: {
    current: {
      MEDIA_UPLOAD_PROVIDER: 's3',
    },
  },
}));

vi.mock('../logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock('../utils', () => ({
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MediaUploadService', () => {
  let service: MediaUploadService;
  let mockFile: File;

  beforeEach(() => {
    service = new MediaUploadService();
    vi.clearAllMocks();

    // Create mock file
    mockFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Mock successful API responses
    vi.mocked(api.post).mockResolvedValue({
      uploadId: 'upload-123',
      uploadUrl: 'https://s3.amazonaws.com/upload',
      uploadFields: { key: 'test-key', signature: 'test-sig' },
      callbackUrl: '/api/media/complete',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      cdnUrl: 'https://cdn.example.com/media-123',
    });

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(''),
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provider from config', () => {
      expect(service).toBeInstanceOf(MediaUploadService);
    });
  });

  describe('requestUploadIntent', () => {
    it('should request upload intent from backend', async () => {
      const mockIntent = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'value' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/media-123',
      };

      vi.mocked(api.post).mockResolvedValue(mockIntent);

      const result = await service.requestUploadIntent('image', {
        originalName: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      });

      expect(result).toEqual(mockIntent);
      expect(api.post).toHaveBeenCalledWith(
        '/media/upload/intent',
        expect.objectContaining({
          mediaType: 'image',
          metadata: expect.objectContaining({
            originalName: 'test.jpg',
            contentType: 'image/jpeg',
            size: 1024,
          }),
          provider: 's3',
          correlationId: 'test-correlation-id',
        })
      );
    });

    it('should throw error on backend failure', async () => {
      const apiError = {
        code: 'UPLOAD_ERROR',
        message: 'Upload failed',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      };
      vi.mocked(api.post).mockRejectedValue(apiError);

      await expect(
        service.requestUploadIntent('image', {
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
      ).rejects.toThrow(apiError);
    });

    it('should handle video media type', async () => {
      const mockIntent = {
        uploadId: 'video-upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'video-key' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/video-123',
      };

      vi.mocked(api.post).mockResolvedValue(mockIntent);

      const result = await service.requestUploadIntent('video', {
        originalName: 'test.mp4',
        contentType: 'video/mp4',
        size: 1024000,
      });

      expect(result.uploadId).toBe('video-upload-123');
      expect(api.post).toHaveBeenCalledWith(
        '/media/upload/intent',
        expect.objectContaining({
          mediaType: 'video',
          metadata: expect.objectContaining({
            originalName: 'test.mp4',
            contentType: 'video/mp4',
            size: 1024000,
          }),
        })
      );
    });
  });

  describe('uploadToProvider', () => {
    it('should upload file to provider successfully', async () => {
      const intent = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'test-key', signature: 'test-sig' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/media-123',
      };

      await service.uploadToProvider(mockFile, intent);

      expect(mockFetch).toHaveBeenCalledWith(intent.uploadUrl, {
        method: 'POST',
        body: expect.any(FormData),
        headers: {
          'X-Correlation-ID': 'test-correlation-id',
        },
      });

      // Verify FormData contains the file and fields
      const formData = mockFetch.mock.calls[0][1]?.body as FormData;
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should handle upload failure', async () => {
      const intent = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'test-key' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/media-123',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
        headers: { get: vi.fn() },
      });

      await expect(service.uploadToProvider(mockFile, intent)).rejects.toThrow(
        'Failed to upload file: Upload failed: 400 Bad Request'
      );
    });

    it('should handle network errors', async () => {
      const intent = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.amazonaws.com/upload',
        uploadFields: { key: 'test-key' },
        callbackUrl: '/api/media/complete',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        cdnUrl: 'https://cdn.example.com/media-123',
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.uploadToProvider(mockFile, intent)).rejects.toThrow(
        'Failed to upload file: Network error'
      );
    });
  });

  describe('completeUpload', () => {
    it('should complete upload successfully', async () => {
      const mockCompletion = {
        mediaId: 'media-123',
        cdnUrl: 'https://cdn.example.com/media-123',
        thumbnailUrl: 'https://cdn.example.com/thumb-123',
        metadata: { size: 1024, format: 'jpeg' },
      };

      vi.mocked(api.post).mockResolvedValue(mockCompletion);

      const result = await service.completeUpload('upload-123', '/api/media/complete', 'image', {
        originalName: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        width: 800,
        height: 600,
      });

      expect(result).toEqual(mockCompletion);
      expect(api.post).toHaveBeenCalledWith('/api/media/complete', {
        uploadId: 'upload-123',
        mediaType: 'image',
        metadata: {
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024,
          width: 800,
          height: 600,
        },
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle completion failure', async () => {
      const apiError = {
        code: 'COMPLETION_ERROR',
        message: 'Completion failed',
        correlationId: 'corr-123',
        timestamp: new Date().toISOString(),
      };
      vi.mocked(api.post).mockRejectedValue(apiError);

      await expect(
        service.completeUpload('upload-123', '/api/media/complete', 'image', {
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
      ).rejects.toThrow(apiError);
    });
  });

  describe('validateFile', () => {
    it('should validate valid image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file, 'image');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid video file', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const result = service.validateFile(file, 'video');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file type for image', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = service.validateFile(file, 'image');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type: text/plain');
      expect(result.error).toContain('image/jpeg, image/jpg, image/png, image/webp, image/gif');
    });

    it('should reject invalid file type for video', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = service.validateFile(file, 'video');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type: text/plain');
      expect(result.error).toContain('video/mp4, video/quicktime, video/webm');
    });

    it('should reject image file that is too large', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = service.validateFile(largeFile, 'image');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large: 11.00MB');
      expect(result.error).toContain('Maximum size: 10.00MB');
    });

    it('should reject video file that is too large', () => {
      const largeFile = new File([new ArrayBuffer(101 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4',
      });
      const result = service.validateFile(largeFile, 'video');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large: 101.00MB');
      expect(result.error).toContain('Maximum size: 100.00MB');
    });

    it('should accept file at maximum size limit', () => {
      const maxSizeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'max.jpg', {
        type: 'image/jpeg',
      });
      const result = service.validateFile(maxSizeFile, 'image');

      expect(result.valid).toBe(true);
    });
  });

  describe('getImageDimensions', () => {
    beforeEach(() => {
      // Mock Image constructor
      global.Image = vi.fn(() => ({
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null,
        onerror: null,
        src: '',
      })) as any;

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should get image dimensions successfully', async () => {
      const MockImage = global.Image as any;
      const mockImage = new MockImage();

      const dimensions = await service.getImageDimensions(mockFile);

      expect(dimensions).toEqual({ width: 800, height: 600 });
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle image load error', async () => {
      const MockImage = global.Image as any;
      const mockImage = new MockImage();

      // Simulate error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(service.getImageDimensions(mockFile)).rejects.toThrow('Failed to load image');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('getVideoMetadata', () => {
    beforeEach(() => {
      // Mock document.createElement for video
      global.document = {
        createElement: vi.fn(() => ({
          videoWidth: 1920,
          videoHeight: 1080,
          duration: 30.5,
          onloadedmetadata: null,
          onerror: null,
          src: '',
        })),
      } as any;

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-video-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should get video metadata successfully', async () => {
      const mockVideo = global.document.createElement('video') as any;

      // Simulate metadata loaded
      setTimeout(() => {
        if (mockVideo.onloadedmetadata) {
          mockVideo.onloadedmetadata();
        }
      }, 0);

      const metadata = await service.getVideoMetadata(mockFile);

      expect(metadata).toEqual({
        width: 1920,
        height: 1080,
        duration: 30.5,
      });
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-video-url');
    });

    it('should handle video load error', async () => {
      const mockVideo = global.document.createElement('video') as any;

      // Simulate error
      setTimeout(() => {
        if (mockVideo.onerror) {
          mockVideo.onerror();
        }
      }, 0);

      await expect(service.getVideoMetadata(mockFile)).rejects.toThrow('Failed to load video');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-video-url');
    });
  });

  describe('uploadChunked', () => {
    it('should perform chunked upload successfully', async () => {
      const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      // Mock create session response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(''),
          headers: { get: vi.fn() },
          json: vi.fn().mockResolvedValue({
            uploadId: 'chunked-upload-123',
            putUrl: 'https://storage.example.com/upload',
          }),
        })
        // Mock chunk upload responses
        .mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(''),
          headers: { get: vi.fn().mockReturnValue('etag-123') },
        })
        // Mock finalize response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(''),
          headers: { get: vi.fn() },
          json: vi.fn().mockResolvedValue({
            mediaId: 'media-123',
            cdnUrl: 'https://cdn.example.com/media-123',
            thumbnailUrl: 'https://cdn.example.com/thumb-123',
            metadata: { size: 10485760 },
          }),
        });

      const result = await service.uploadChunked(
        largeFile,
        'https://api.example.com/upload/create'
      );

      expect(result.mediaId).toBe('media-123');
      expect(result.cdnUrl).toBe('https://cdn.example.com/media-123');
      expect(mockFetch).toHaveBeenCalledTimes(4); // create + 2 chunks + finalize
    });

    it('should handle chunked upload creation failure', async () => {
      const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
        headers: { get: vi.fn() },
      });

      await expect(
        service.uploadChunked(largeFile, 'https://api.example.com/upload/create')
      ).rejects.toThrow('Failed to create upload session: 400 Bad Request');
    });

    it('should handle chunk upload failure', async () => {
      const largeFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'medium.jpg', {
        type: 'image/jpeg',
      });

      // Mock create session success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(''),
          headers: { get: vi.fn() },
          json: vi.fn().mockResolvedValue({
            uploadId: 'chunked-upload-123',
            putUrl: 'https://storage.example.com/upload',
          }),
        })
        // Mock chunk upload failure
        .mockResolvedValue({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue('Internal Server Error'),
          headers: { get: vi.fn() },
        });

      await expect(
        service.uploadChunked(largeFile, 'https://api.example.com/upload/create')
      ).rejects.toThrow('Chunk 1 upload failed: 500 Internal Server Error');
    });
  });

  describe('uploadMedia', () => {
    beforeEach(() => {
      // Mock image dimensions
      global.Image = vi.fn(() => ({
        naturalWidth: 800,
        naturalHeight: 600,
        onload: null,
        onerror: null,
        src: '',
      })) as any;
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      // Mock API responses
      vi.mocked(api.post)
        .mockResolvedValueOnce({
          uploadId: 'upload-123',
          uploadUrl: 'https://s3.amazonaws.com/upload',
          uploadFields: { key: 'test-key' },
          callbackUrl: '/api/media/complete',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          cdnUrl: 'https://cdn.example.com/media-123',
        })
        .mockResolvedValueOnce({
          mediaId: 'media-123',
          cdnUrl: 'https://cdn.example.com/media-123',
          thumbnailUrl: 'https://cdn.example.com/thumb-123',
          metadata: { size: 1024, format: 'jpeg' },
        });
    });

    it('should complete full upload flow for image', async () => {
      const mockImage = (global.Image as any)();
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await service.uploadMedia(mockFile, 'image');

      expect(result.mediaId).toBe('media-123');
      expect(result.cdnUrl).toBe('https://cdn.example.com/media-123');
      expect(api.post).toHaveBeenCalledTimes(2); // intent + completion
      expect(mockFetch).toHaveBeenCalledTimes(1); // upload to provider
    });

    it('should complete full upload flow for video', async () => {
      const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });

      // Mock video metadata
      global.document = {
        createElement: vi.fn(() => ({
          videoWidth: 1920,
          videoHeight: 1080,
          duration: 30.5,
          onloadedmetadata: null,
          onerror: null,
          src: '',
        })),
      } as any;

      const mockVideo = global.document.createElement('video') as any;
      setTimeout(() => {
        if (mockVideo.onloadedmetadata) mockVideo.onloadedmetadata();
      }, 0);

      const result = await service.uploadMedia(videoFile, 'video');

      expect(result.mediaId).toBe('media-123');
      expect(api.post).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle validation failure', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(service.uploadMedia(invalidFile, 'image')).rejects.toThrow(
        'File validation failed'
      );
    });

    it('should handle upload flow errors', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('API Error'));

      await expect(service.uploadMedia(mockFile, 'image')).rejects.toThrow('API Error');
    });
  });

  describe('mediaUploadService singleton', () => {
    it('should export singleton instance', () => {
      expect(mediaUploadService).toBeInstanceOf(MediaUploadService);
    });
  });

  describe('error handling', () => {
    it('should handle correlation ID generation errors', async () => {
      vi.doMock('../utils', () => ({
        generateCorrelationId: vi.fn(() => {
          throw new Error('Failed to generate correlation ID');
        }),
      }));

      await expect(
        service.requestUploadIntent('image', {
          originalName: 'test.jpg',
          contentType: 'image/jpeg',
          size: 1024,
        })
      ).rejects.toThrow('Failed to generate correlation ID');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file names', () => {
      const file = new File(['test'], '', { type: 'image/jpeg' });
      const result = service.validateFile(file, 'image');
      expect(result.valid).toBe(true);
    });

    it('should handle zero-byte files', () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = service.validateFile(emptyFile, 'image');
      expect(result.valid).toBe(true);
    });

    it('should handle special characters in file names', () => {
      const file = new File(['test'], 'test file (1).jpg', { type: 'image/jpeg' });
      const result = service.validateFile(file, 'image');
      expect(result.valid).toBe(true);
    });
  });
});
