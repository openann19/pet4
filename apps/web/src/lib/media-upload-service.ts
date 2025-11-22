/**
 * Media Upload Service
 *
 * Handles signed upload flow: backend issues signed intent → client uploads directly → backend callback persists
 */

import { api } from './api';
import { config } from './config';
import type { APIError } from './contracts';
import { createLogger } from './logger';
import { generateCorrelationId } from './utils';

const logger = createLogger('MediaUploadService');

export type MediaType = 'image' | 'video';
export type MediaProvider = 's3' | 'cloudinary' | 'simulated';

export interface SignedUploadIntent {
  uploadId: string;
  uploadUrl: string;
  uploadFields: Record<string, string>;
  callbackUrl: string;
  expiresAt: string;
  cdnUrl: string;
}

export interface UploadCompletionRequest {
  uploadId: string;
  mediaType: MediaType;
  metadata: {
    originalName: string;
    contentType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface UploadCompletionResponse {
  mediaId: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  metadata: Record<string, unknown>;
}

export interface MediaValidationRules {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
  maxAspectRatio?: number;
  minAspectRatio?: number;
  maxDurationSeconds?: number;
}

const DEFAULT_IMAGE_RULES: MediaValidationRules = {
  maxSizeBytes: 10 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  maxWidth: 4096,
  maxHeight: 4096,
  maxAspectRatio: 3,
  minAspectRatio: 0.33,
};

const DEFAULT_VIDEO_RULES: MediaValidationRules = {
  maxSizeBytes: 100 * 1024 * 1024,
  allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
  maxDurationSeconds: 300,
  maxWidth: 1920,
  maxHeight: 1080,
};

export class MediaUploadService {
  private provider: MediaProvider;

  constructor() {
    this.provider = config.current.MEDIA_UPLOAD_PROVIDER;
  }

  /**
   * Request signed upload intent from backend
   */
  async requestUploadIntent(
    mediaType: MediaType,
    metadata: {
      originalName: string;
      contentType: string;
      size: number;
    }
  ): Promise<SignedUploadIntent> {
    const correlationId = generateCorrelationId();

    try {
      logger.debug('Requesting upload intent', {
        mediaType,
        metadata,
        provider: this.provider,
        correlationId,
      });

      const response = await api.post<SignedUploadIntent>('/media/upload/intent', {
        mediaType,
        metadata,
        provider: this.provider,
        correlationId,
      });

      logger.info('Upload intent received', {
        uploadId: response.uploadId,
        expiresAt: response.expiresAt,
        correlationId,
      });

      return response;
    } catch (error) {
      const apiError = error as APIError;
      logger.error('Failed to request upload intent', new Error(apiError.message), {
        code: apiError.code,
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Upload file directly to provider using signed URL
   */
  async uploadToProvider(file: File, intent: SignedUploadIntent): Promise<void> {
    const correlationId = generateCorrelationId();

    try {
      logger.debug('Uploading to provider', {
        uploadId: intent.uploadId,
        fileName: file.name,
        fileSize: file.size,
        correlationId,
      });

      const formData = new FormData();

      Object.entries(intent.uploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append('file', file);

      const uploadResponse = await fetch(intent.uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Correlation-ID': correlationId,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      logger.info('File uploaded to provider', {
        uploadId: intent.uploadId,
        correlationId,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload to provider', err, {
        uploadId: intent.uploadId,
        correlationId,
      });
      throw new Error(`Failed to upload file: ${err.message}`);
    }
  }

  /**
   * Notify backend of upload completion
   */
  async completeUpload(
    uploadId: string,
    callbackUrl: string,
    mediaType: MediaType,
    metadata: UploadCompletionRequest['metadata']
  ): Promise<UploadCompletionResponse> {
    const correlationId = generateCorrelationId();

    try {
      logger.debug('Completing upload', {
        uploadId,
        mediaType,
        metadata,
        correlationId,
      });

      const response = await api.post<UploadCompletionResponse>(callbackUrl, {
        uploadId,
        mediaType,
        metadata,
        correlationId,
      } as UploadCompletionRequest);

      logger.info('Upload completed', {
        uploadId,
        mediaId: response.mediaId,
        cdnUrl: response.cdnUrl,
        correlationId,
      });

      return response;
    } catch (error) {
      const apiError = error as APIError;
      logger.error('Failed to complete upload', new Error(apiError.message), {
        uploadId,
        code: apiError.code,
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Validate file against rules
   */
  validateFile(file: File, mediaType: MediaType): { valid: boolean; error?: string } {
    const rules = mediaType === 'image' ? DEFAULT_IMAGE_RULES : DEFAULT_VIDEO_RULES;

    if (!rules.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: ${rules.allowedTypes.join(', ')}`,
      };
    }

    if (file.size > rules.maxSizeBytes) {
      return {
        valid: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${(rules.maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(file: File): Promise<{
    width: number;
    height: number;
    duration: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };

      video.src = url;
    });
  }

  /**
   * Upload file using chunked upload with pause/resume support
   *
   * Flow:
   * 1. POST to create upload → returns { uploadId, putUrl }
   * 2. PUT chunks with Content-Range headers
   * 3. POST to complete upload
   *
   * @param file - File to upload
   * @param createUrl - URL endpoint to create upload session
   * @param chunkSize - Size of each chunk in bytes (default: 5MB)
   * @returns Upload completion response
   */
  async uploadChunked(
    file: File,
    createUrl: string,
    chunkSize: number = 5 * 1024 * 1024
  ): Promise<UploadCompletionResponse> {
    const correlationId = generateCorrelationId();

    try {
      logger.debug('Starting chunked upload', {
        fileName: file.name,
        fileSize: file.size,
        chunkSize,
        correlationId,
      });

      // Step 1: Create upload session
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({
          size: file.size,
          name: file.name,
          contentType: file.type,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create upload session: ${createResponse.status} ${errorText}`);
      }

      const meta = (await createResponse.json()) as {
        uploadId: string;
        putUrl: string;
      };
      const { uploadId, putUrl } = meta;

      logger.info('Upload session created', {
        uploadId,
        correlationId,
      });

      // Step 2: Upload chunks with Content-Range
      let offset = 0;
      let part = 0;
      const totalChunks = Math.ceil(file.size / chunkSize);

      while (offset < file.size) {
        const end = Math.min(offset + chunkSize, file.size);
        const chunk = file.slice(offset, end);
        part++;

        logger.debug('Uploading chunk', {
          uploadId,
          part,
          offset,
          end,
          totalChunks,
          chunkSize: chunk.size,
          correlationId,
        });

        const chunkResponse = await fetch(`${putUrl}?part=${part}`, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
            'Content-Type': file.type,
            'X-Correlation-ID': correlationId,
          },
        });

        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text();
          throw new Error(`Chunk ${part} upload failed: ${chunkResponse.status} ${errorText}`);
        }

        // Check for ETag in response (for resume support)
        const etag = chunkResponse.headers.get('ETag');
        if (etag) {
          logger.debug('Chunk uploaded with ETag', {
            uploadId,
            part,
            etag,
            correlationId,
          });
        }

        offset = end;
      }

      logger.info('All chunks uploaded', {
        uploadId,
        totalParts: part,
        correlationId,
      });

      // Step 3: Finalize upload
      const finalizeResponse = await fetch(`${putUrl}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({
          uploadId,
          parts: part,
          totalSize: file.size,
        }),
      });

      if (!finalizeResponse.ok) {
        const errorText = await finalizeResponse.text();
        throw new Error(`Failed to finalize upload: ${finalizeResponse.status} ${errorText}`);
      }

      const completion = (await finalizeResponse.json()) as UploadCompletionResponse;

      logger.info('Chunked upload completed successfully', {
        uploadId,
        mediaId: completion.mediaId,
        cdnUrl: completion.cdnUrl,
        correlationId,
      });

      return completion;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Chunked upload failed', err, {
        fileName: file.name,
        fileSize: file.size,
        correlationId,
      });
      throw err;
    }
  }

  /**
   * Complete upload flow: intent → upload → complete
   */
  async uploadMedia(file: File, mediaType: MediaType): Promise<UploadCompletionResponse> {
    const correlationId = generateCorrelationId();

    try {
      logger.debug('Starting upload flow', {
        fileName: file.name,
        fileSize: file.size,
        mediaType,
        correlationId,
      });

      const validation = this.validateFile(file, mediaType);
      if (!validation.valid) {
        throw new Error(validation.error ?? 'File validation failed');
      }

      let metadata: UploadCompletionRequest['metadata'] = {
        originalName: file.name,
        contentType: file.type,
        size: file.size,
      };

      if (mediaType === 'image') {
        const dimensions = await this.getImageDimensions(file);
        metadata = {
          ...metadata,
          width: dimensions.width,
          height: dimensions.height,
        };
      } else if (mediaType === 'video') {
        const videoMetadata = await this.getVideoMetadata(file);
        metadata = {
          ...metadata,
          width: videoMetadata.width,
          height: videoMetadata.height,
          duration: videoMetadata.duration,
        };
      }

      const intent = await this.requestUploadIntent(mediaType, {
        originalName: file.name,
        contentType: file.type,
        size: file.size,
      });

      await this.uploadToProvider(file, intent);

      const completion = await this.completeUpload(
        intent.uploadId,
        intent.callbackUrl,
        mediaType,
        metadata
      );

      logger.info('Media upload completed successfully', {
        uploadId: intent.uploadId,
        mediaId: completion.mediaId,
        cdnUrl: completion.cdnUrl,
        correlationId,
      });

      return completion;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Media upload failed', err, {
        fileName: file.name,
        mediaType,
        correlationId,
      });
      throw error;
    }
  }
}

export const mediaUploadService = new MediaUploadService();
